"""Price search service for grocery items using SerpAPI Google Shopping"""
import os
import re
import traceback
from serpapi import GoogleSearch


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

        # If store_filter is provided, we'll filter the results later

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
                    delivery = result.get('delivery', '')
                    store_location = None
                    if location:
                        store_location = location
                    elif delivery:
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
