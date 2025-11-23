"""Main Flask application with API routes"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import traceback
import time

# Import services
from openai_service import get_openai_client, generate_recipe as generate_recipe_service
from price_service import search_google_shopping_price, get_mock_price

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


@app.route("/api/check-key", methods=["GET"])
def check_key():
    """Test endpoint to check if API key is configured"""
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key:
        return jsonify({
            "status": "ok",
            "message": "API key is set",
            "key_length": len(api_key)
        })
    else:
        return jsonify({
            "status": "error",
            "message": "API key is NOT set. Please set OPENAI_API_KEY environment variable."
        }), 503


@app.route("/api/target-price", methods=["GET"])
def get_target_price():
    """Get price for an item from nearby stores

    Query parameters:
        item: Item name (required)
        location: Location string (optional, e.g., "Austin, Texas, United States")
        store: Store name to filter by (optional, e.g., "Walmart", "Target")
    """
    try:
        item_name = request.args.get('item', '').strip()
        if not item_name:
            return jsonify({"error": "item parameter is required"}), 400

        location = request.args.get('location', '').strip() or None
        store_filter = request.args.get('store', '').strip() or None

        prices = {}

        # PRIMARY: Try Google Shopping API (SerpApi)
        google_shopping_result = search_google_shopping_price(item_name, location=location, store_filter=store_filter)
        if google_shopping_result:
            # Add all stores from Google Shopping
            prices.update(google_shopping_result['stores'])
            best_price = google_shopping_result['price']
            best_store = google_shopping_result['source']

            return jsonify({
                "price": best_price,
                "source": best_store,
                "stores": prices,
                "store_details": google_shopping_result.get('all_results', {}),  # Include full store details with logos
                "item": item_name,
                "location": location,
                "store_filter": store_filter,
                "note": f"Live prices from Google Shopping{f' near {location}' if location else ''}"
            })

        # FALLBACK: Use mock price as final fallback (direct from failed SerpApi)
        mock_price = get_mock_price(item_name)
        prices['estimated'] = mock_price
        return jsonify({
            "price": mock_price,
            "source": "estimated",
            "stores": prices,
            "item": item_name,
            "location": location,
            "store_filter": store_filter,
            "note": "Estimated price - actual store prices may vary. Please check SERPAPI_KEY configuration for live prices."
        })

    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in get_target_price: {str(e)}")
        print(f"Traceback: {error_trace}")

        # Return mock price on error
        item_name = request.args.get('item', 'item')
        mock_price = get_mock_price(item_name)
        return jsonify({
            "price": mock_price,
            "source": "estimated",
            "stores": {"estimated": mock_price},
            "error": str(e),
            "note": "Estimated price due to error. Please check SERPAPI_KEY configuration."
        })


@app.route("/api/store-prices", methods=["POST"])
def get_store_prices():
    """Get prices for multiple items from multiple stores"""
    try:
        data = request.get_json()
        items = data.get('items', [])

        if not items:
            return jsonify({"error": "items array is required"}), 400

        results = {}

        # Get location/store filter from batch request data
        location = data.get('location', '').strip() or None
        store_filter = data.get('store', '').strip() or None

        for item in items:
            item_name = item if isinstance(item, str) else item.get('name', '')
            if not item_name:
                continue

            prices = {}

            # PRIMARY: Try Google Shopping API (SerpApi)
            google_shopping_result = search_google_shopping_price(item_name, location=location, store_filter=store_filter)

            if google_shopping_result:
                prices.update(google_shopping_result['stores'])
                best_price = google_shopping_result['price']
                best_store = google_shopping_result['source']
            else:
                # FALLBACK: Use mock price
                best_price = get_mock_price(item_name)
                best_store = "estimated"
                prices['estimated'] = best_price

            results[item_name] = {
                "stores": prices,
                "best_price": best_price,
                "best_store": best_store
            }

            # Small delay to avoid rate limiting (especially for SerpApi)
            time.sleep(0.5)

        return jsonify({
            "success": True,
            "prices": results
        })

    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in get_store_prices: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": str(e),
            "message": "Failed to fetch store prices"
        }), 500


@app.route("/api/generate-recipe", methods=["POST"])
def generate_recipe():
    """Generate a recipe using OpenAI API"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        meal_idea = data.get('mealIdea', '').strip()

        if not meal_idea:
            return jsonify({"error": "mealIdea is required"}), 400

        # Call the service to generate recipe
        result = generate_recipe_service(meal_idea)

        # Check if there was an error
        if "error" in result:
            status_code = 503 if "not configured" in result.get("error", "") else 502
            return jsonify(result), status_code

        return jsonify(result)

    except Exception as e:
        # Log the full error for debugging
        error_trace = traceback.format_exc()
        print(f"Error in generate_recipe: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": str(e),
            "message": "An error occurred while generating the recipe. Please check the server logs for details."
        }), 500


if __name__ == '__main__':
    app.run(debug=True)
