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
from serpapi import GoogleSearch

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

def search_google_shopping_price(item_name, location=None, store_filter=None):
    """Search for item price using SerpApi Google Shopping API
    
    Args:
        item_name: Name of the item to search for
        location: Optional location string (e.g., "Austin, Texas, United States")
        store_filter: Optional store name to filter by (e.g., "Walmart", "Target")
    """
    try:
        api_key = os.getenv('SERPAPI_KEY')
        if not api_key:
            print("SERPAPI_KEY not set, skipping Google Shopping search")
            return None
        
        # Clean item name for search - remove quantity info in parentheses
        search_query = item_name.split('(')[0].strip()
        
        # Add "grocery" or "food" to help get grocery store results
        if not any(word in search_query.lower() for word in ['grocery', 'food', 'ingredient']):
            search_query = f"{search_query} grocery"
        
        params = {
            "engine": "google_shopping",
            "q": search_query,
            "api_key": api_key,
            "gl": "us",  # Country: United States
            "hl": "en",  # Language: English
        }
        
        # Add location if provided
        if location:
            params["location"] = location
            print(f"Using location: {location}")
        
        # Note: Store filtering via shoprs parameter requires getting tokens from Filters API first
        # For now, we'll filter results after receiving them
        # If store_filter is provided, we'll filter the results
        
        search = GoogleSearch(params)
        results = search.get_dict()
        
        # Check if we got results
        if 'shopping_results' not in results or not results['shopping_results']:
            print(f"Google Shopping: No results found for {search_query}")
            return None
        
        # Extract prices from shopping results
        prices = {}
        stores = {}
        
        for result in results['shopping_results'][:10]:  # Check top 10 results for better store variety
            if 'price' in result:
                price_str = result['price']
                # Extract numeric price
                price_match = re.search(r'\$?(\d+\.?\d*)', price_str)
                if price_match:
                    price_value = float(price_match.group(1))
                    source = result.get('source', 'unknown')
                    
                    # Filter by store if specified
                    if store_filter and store_filter.lower() not in source.lower():
                        continue
                    
                    # Extract location information from various fields
                    # Delivery field often contains location info like "Get it by [date] (Free)" or store pickup info
                    delivery = result.get('delivery', '')
                    
                    # Try to extract store location from the result
                    # Some results may have location in the source name or delivery field
                    store_location = None
                    if location:
                        # If user provided location, we can infer stores are near that location
                        store_location = location
                    elif delivery:
                        # Try to extract location info from delivery string
                        # Delivery might contain pickup location info
                        store_location = delivery
                    
                    # Extract extensions (e.g., "Nearby, 3 mi", "37% OFF")
                    extensions = result.get('extensions', [])
                    nearby_info = None
                    discount_info = None
                    for ext in extensions:
                        if 'nearby' in ext.lower() or 'mi' in ext.lower():
                            nearby_info = ext
                        elif '%' in ext.lower() or 'off' in ext.lower():
                            discount_info = ext
                    
                    # Also check for tag field (discounts)
                    tag = result.get('tag', '')
                    if tag and not discount_info:
                        discount_info = tag
                    
                    # Store price by source (keep lowest price per source)
                    if source not in prices:
                        prices[source] = price_str
                        stores[source] = {
                            'price': price_str,
                            'title': result.get('title', ''),
                            'link': result.get('product_link', ''),  # Product link for purchasing
                            'icon': result.get('source_icon', ''),  # Store logo/icon
                            'thumbnail': result.get('thumbnail', ''),
                            'rating': result.get('rating'),
                            'reviews': result.get('reviews'),
                            'delivery': delivery,
                            'location': store_location,  # Store location information
                            'source': source,  # Store name
                            'nearby': nearby_info,  # Nearby distance info (e.g., "Nearby, 3 mi")
                            'discount': discount_info,  # Discount info (e.g., "37% OFF")
                            'extensions': extensions  # All extensions
                        }
                    else:
                        # Compare with existing price for this source
                        existing_price_match = re.search(r'\$?(\d+\.?\d*)', prices[source])
                        if existing_price_match and price_value < float(existing_price_match.group(1)):
                            prices[source] = price_str
                            stores[source] = {
                                'price': price_str,
                                'title': result.get('title', ''),
                                'link': result.get('product_link', ''),  # Product link for purchasing
                                'icon': result.get('source_icon', ''),
                                'thumbnail': result.get('thumbnail', ''),
                                'rating': result.get('rating'),
                                'reviews': result.get('reviews'),
                                'delivery': delivery,
                                'location': store_location,  # Store location information
                                'source': source,  # Store name
                                'nearby': nearby_info,  # Nearby distance info (e.g., "Nearby, 3 mi")
                                'discount': discount_info,  # Discount info (e.g., "37% OFF")
                                'extensions': extensions  # All extensions
                            }
        
        if not prices:
            print(f"Google Shopping: No valid prices found for {search_query}")
            return None
        
        # Return the best (lowest) price and all store options
        best_price = min(prices.items(), key=lambda x: float(re.search(r'\$?(\d+\.?\d*)', x[1]).group(1)))
        best_store = best_price[0]
        best_price_value = best_price[1]
        
        print(f"Google Shopping found price: {best_price_value} from {best_store} for {search_query}")
        
        # Return a dict with best price and all stores (including store details)
        return {
            'price': best_price_value,
            'source': best_store,
            'stores': {k: v['price'] for k, v in stores.items()},
            'all_results': stores,  # Full store details including logos
            'location': location
        }
        
    except Exception as e:
        print(f"Google Shopping search error: {str(e)}")
        traceback.print_exc()
        return None

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
        
        # Try to get price from multiple sources
        prices = {}
        
        # PRIMARY: Try Google Shopping API (SerpApi) - most reliable
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
        
        # FALLBACK 1: Try direct web scraping (Walmart, Target)
        walmart_price = search_walmart_price(item_name)
        if walmart_price:
            prices['walmart'] = walmart_price
        
        target_price = search_target_price(item_name)
        if target_price:
            prices['target'] = target_price
        
        # If we got prices from scraping, return them
        if prices:
            best_price = min(prices.values(), key=lambda x: float(x.replace('$', '').replace(',', '')))
            best_store = [k for k, v in prices.items() if v == best_price][0]
            
            return jsonify({
                "price": best_price,
                "source": best_store,
                "stores": prices,
                "item": item_name,
                "note": "Prices from web scraping - may be less accurate"
            })
        
        # FALLBACK 2: Use mock price as final fallback
        mock_price = get_mock_price(item_name)
        prices['estimated'] = mock_price
        return jsonify({
            "price": mock_price,
            "source": "estimated",
            "stores": prices,
            "note": "Estimated price - actual store prices may vary. Please set SERPAPI_KEY for live prices."
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
        
        for item in items:
            item_name = item if isinstance(item, str) else item.get('name', '')
            if not item_name:
                continue
            
            prices = {}
            
            # PRIMARY: Try Google Shopping API (SerpApi)
            # Note: For batch requests, we could accept location/store per item, but for simplicity
            # we'll use the same location/store for all items in a batch
            location = data.get('location', '').strip() or None
            store_filter = data.get('store', '').strip() or None
            
            google_shopping_result = search_google_shopping_price(item_name, location=location, store_filter=store_filter)
            if google_shopping_result:
                prices.update(google_shopping_result['stores'])
            else:
                # FALLBACK: Try direct web scraping
                walmart_price = search_walmart_price(item_name)
                if walmart_price:
                    prices['walmart'] = walmart_price
                
                target_price = search_target_price(item_name)
                if target_price:
                    prices['target'] = target_price
                
                # Final fallback to mock if no prices found
                if not prices:
                    prices['estimated'] = get_mock_price(item_name)
            
            # Calculate best price
            if prices:
                best_price = min(prices.values(), key=lambda x: float(x.replace('$', '').replace(',', '')))
                best_store = min(prices.items(), key=lambda x: float(x[1].replace('$', '').replace(',', '')))[0]
            else:
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
        
        IMPORTANT: Only include ingredients that users need to purchase at a grocery store. 
        DO NOT include:
        - Water (tap water, assume it's available)
        - Salt (assume it's a common pantry item)
        - Black pepper (assume it's a common pantry item)
        - Basic spices that are typically in every kitchen (salt, pepper, basic seasonings)
        - Cooking oil (unless it's a specific type like olive oil or sesame oil)
        - Common pantry staples that most people already have
        
        Only include ingredients that are:
        - Fresh produce (vegetables, fruits, herbs)
        - Meat, poultry, or seafood
        - Dairy products
        - Specific packaged items
        - Specialty ingredients
        - Items that vary by recipe and need to be purchased
        
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