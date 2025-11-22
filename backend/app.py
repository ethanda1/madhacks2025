from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from openai import OpenAIError
from dotenv import load_dotenv
import os
import json
import traceback
import requests
from bs4 import BeautifulSoup
import re
import time
from urllib.parse import quote_plus

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Lazy initialization of OpenAI client
def get_openai_client():
    """Get OpenAI client, initializing it only when needed"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("WARNING: OPENAI_API_KEY environment variable is not set!")
        return None
    print(f"OpenAI API key found (length: {len(api_key)} characters)")
    # Explicitly create client with only the api_key to avoid proxy/environment issues
    try:
        client = OpenAI(api_key=api_key)
        return client
    except Exception as e:
        print(f"Error creating OpenAI client: {str(e)}")
        # Try without explicit api_key (let it use environment)
        try:
            return OpenAI()
        except Exception as e2:
            print(f"Error creating OpenAI client (fallback): {str(e2)}")
            return None

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

def search_walmart_price(item_name):
    """Search for item price on Walmart.com"""
    try:
        # Clean item name for search
        search_query = item_name.split('(')[0].strip()  # Remove quantity info
        search_url = f"https://www.walmart.com/search?q={quote_plus(search_query)}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        response = requests.get(search_url, headers=headers, timeout=10, allow_redirects=True)
        print(f"Walmart request status: {response.status_code} for {search_query}")
        
        if response.status_code != 200:
            print(f"Walmart returned status {response.status_code}")
            return None
        
        # Check if we got blocked or redirected to a different page
        if 'blocked' in response.url.lower() or 'captcha' in response.text.lower():
            print("Walmart blocked or captcha detected")
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try to find price - Walmart's structure varies, so we'll try multiple selectors
        price_selectors = [
            '[data-automation-id="product-price"]',
            '.price-current',
            '[itemprop="price"]',
            '.price',
            '[data-testid="product-price"]',
            '.w_iUH7',
            'span[class*="price"]',
        ]
        
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                # Extract price number
                price_match = re.search(r'\$?(\d+\.?\d*)', price_text)
                if price_match:
                    price = f"${price_match.group(1)}"
                    print(f"Walmart found price: {price} for {search_query}")
                    return price
        
        print(f"Walmart: No price found for {search_query}")
        return None
    except Exception as e:
        print(f"Walmart search error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def search_target_price(item_name):
    """Search for item price on Target.com"""
    try:
        search_query = item_name.split('(')[0].strip()
        search_url = f"https://www.target.com/s?searchTerm={quote_plus(search_query)}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        }
        
        response = requests.get(search_url, headers=headers, timeout=10, allow_redirects=True)
        print(f"Target request status: {response.status_code} for {search_query}")
        
        if response.status_code != 200:
            print(f"Target returned status {response.status_code}")
            return None
        
        # Check if we got blocked
        if 'blocked' in response.url.lower() or 'captcha' in response.text.lower():
            print("Target blocked or captcha detected")
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Target price selectors - try multiple
        price_selectors = [
            '[data-test="product-price"]',
            '[data-testid="product-price"]',
            'span[data-test*="price"]',
            '.h-text-bold',
            '[class*="price"]',
        ]
        
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                price_match = re.search(r'\$?(\d+\.?\d*)', price_text)
                if price_match:
                    price = f"${price_match.group(1)}"
                    print(f"Target found price: {price} for {search_query}")
                    return price
        
        print(f"Target: No price found for {search_query}")
        return None
    except Exception as e:
        print(f"Target search error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def get_mock_price(item_name):
    """Generate a mock price based on item type (fallback)"""
    # More realistic mock pricing for demo purposes
    import random
    item_lower = item_name.lower()
    
    # Base prices with some variation
    if any(word in item_lower for word in ['chicken', 'beef', 'pork', 'meat', 'diced']):
        base = 7.99
        variation = random.uniform(-1.50, 2.00)
        return f"${base + variation:.2f}"
    elif any(word in item_lower for word in ['cheese', 'dairy', 'shredded']):
        base = 4.49
        variation = random.uniform(-0.50, 1.00)
        return f"${base + variation:.2f}"
    elif any(word in item_lower for word in ['tortilla', 'bread']):
        base = 3.49
        variation = random.uniform(-0.50, 1.00)
        return f"${base + variation:.2f}"
    elif any(word in item_lower for word in ['seasoning', 'spice', 'packet', 'taco']):
        base = 1.99
        variation = random.uniform(-0.30, 0.50)
        return f"${base + variation:.2f}"
    elif any(word in item_lower for word in ['bean', 'can']):
        base = 1.49
        variation = random.uniform(-0.30, 0.50)
        return f"${base + variation:.2f}"
    elif any(word in item_lower for word in ['corn', 'kernel']):
        base = 1.99
        variation = random.uniform(-0.30, 0.50)
        return f"${base + variation:.2f}"
    elif any(word in item_lower for word in ['onion', 'pepper', 'tomato', 'vegetable', 'diced']):
        base = 1.29
        variation = random.uniform(-0.30, 0.50)
        return f"${base + variation:.2f}"
    elif any(word in item_lower for word in ['cilantro', 'herb', 'garnish']):
        base = 0.99
        variation = random.uniform(-0.20, 0.30)
        return f"${base + variation:.2f}"
    elif any(word in item_lower for word in ['lime', 'lemon', 'citrus']):
        base = 0.79
        variation = random.uniform(-0.20, 0.30)
        return f"${base + variation:.2f}"
    else:
        base = 3.99
        variation = random.uniform(-1.00, 2.00)
        return f"${base + variation:.2f}"

@app.route("/api/target-price", methods=["GET"])
def get_target_price():
    """Get price for an item from nearby stores"""
    try:
        item_name = request.args.get('item', '').strip()
        if not item_name:
            return jsonify({"error": "item parameter is required"}), 400
        
        # Try to get price from multiple sources
        prices = {}
        
        # Try Walmart
        walmart_price = search_walmart_price(item_name)
        if walmart_price:
            prices['walmart'] = walmart_price
        
        # Try Target
        target_price = search_target_price(item_name)
        if target_price:
            prices['target'] = target_price
        
        # If no prices found, use mock price as fallback
        if not prices:
            mock_price = get_mock_price(item_name)
            prices['estimated'] = mock_price
            return jsonify({
                "price": mock_price,
                "source": "estimated",
                "stores": prices,
                "note": "Estimated price - actual store prices may vary"
            })
        
        # Return the lowest price found
        best_price = min(prices.values(), key=lambda x: float(x.replace('$', '')))
        best_store = [k for k, v in prices.items() if v == best_price][0]
        
        return jsonify({
            "price": best_price,
            "source": best_store,
            "stores": prices,
            "item": item_name
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
            "error": "Could not fetch live prices",
            "note": "Showing estimated price"
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
        
        for item in items:
            item_name = item if isinstance(item, str) else item.get('name', '')
            if not item_name:
                continue
            
            prices = {}
            
            # Try Walmart
            walmart_price = search_walmart_price(item_name)
            if walmart_price:
                prices['walmart'] = walmart_price
            
            # Try Target
            target_price = search_target_price(item_name)
            if target_price:
                prices['target'] = target_price
            
            # Fallback to mock if no prices found
            if not prices:
                prices['estimated'] = get_mock_price(item_name)
            
            results[item_name] = {
                "stores": prices,
                "best_price": min(prices.values(), key=lambda x: float(x.replace('$', '').replace(',', ''))),
                "best_store": min(prices.items(), key=lambda x: float(x[1].replace('$', '').replace(',', '')))[0]
            }
            
            # Small delay to avoid rate limiting
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
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        meal_idea = data.get('mealIdea', '').strip()
        
        if not meal_idea:
            return jsonify({"error": "mealIdea is required"}), 400
        
        # Check if API key is set
        openai_client = get_openai_client()
        if not openai_client:
            return jsonify({
                "error": "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            }), 503
        
        # Call OpenAI API to generate recipe
        prompt = f"""Generate a recipe for {meal_idea}. 
        Please provide:
        1. A brief recipe description
        2. A list of ingredients with quantities (e.g., "1 lb Ground Beef", "2 cups Shredded Cheese")
        3. Basic cooking instructions
        
        Format your response as JSON with this structure:
        {{
            "recipe": "Brief description of the recipe",
            "ingredients": [
                {{"name": "Ingredient 1 with quantity"}},
                {{"name": "Ingredient 2 with quantity"}}
            ],
            "instructions": "Step-by-step cooking instructions"
        }}
        """
        
        try:
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful cooking assistant. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
        except OpenAIError as e:
            print(f"OpenAI API Error: {str(e)}")
            return jsonify({
                "error": f"OpenAI API error: {str(e)}",
                "message": "Failed to communicate with OpenAI API. Please check your API key and network connection."
            }), 502
        
        # Parse the response
        if not response.choices or not response.choices[0].message.content:
            return jsonify({
                "error": "Empty response from OpenAI",
                "message": "OpenAI returned an empty response. Please try again."
            }), 502
        
        content = response.choices[0].message.content.strip()
        
        # Try to extract JSON from the response (sometimes GPT wraps it in markdown)
        if content.startswith("```json"):
            content = content[7:]  # Remove ```json
        if content.startswith("```"):
            content = content[3:]  # Remove ```
        if content.endswith("```"):
            content = content[:-3]  # Remove closing ```
        
        content = content.strip()
        
        try:
            recipe_data = json.loads(content)
        except json.JSONDecodeError:
            # If JSON parsing fails, create a fallback response
            recipe_data = {
                "recipe": f"A delicious recipe for {meal_idea}",
                "ingredients": [
                    {"name": "Ingredient 1"},
                    {"name": "Ingredient 2"}
                ],
                "instructions": content
            }
        
        # Format ingredients for frontend (add IDs)
        ingredients = [
            {"id": idx + 1, "name": ing.get("name", str(ing))}
            for idx, ing in enumerate(recipe_data.get("ingredients", []))
        ]
        
        return jsonify({
            "success": True,
            "recipe": recipe_data.get("recipe", ""),
            "ingredients": ingredients,
            "instructions": recipe_data.get("instructions", "")
        })
        
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