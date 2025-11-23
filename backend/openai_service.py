"""OpenAI service for recipe generation"""
import os
import json
from openai import OpenAI
from openai import OpenAIError


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


def generate_recipe(meal_idea):
    """Generate a recipe using OpenAI API

    Args:
        meal_idea: String describing the meal to generate a recipe for

    Returns:
        dict with keys: success, recipe, ingredients, instructions
        or dict with key: error
    """
    # Check if API key is set
    openai_client = get_openai_client()
    if not openai_client:
        return {
            "error": "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        }

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
        return {
            "error": f"OpenAI API error: {str(e)}",
            "message": "Failed to communicate with OpenAI API. Please check your API key and network connection."
        }

    # Parse the response
    if not response.choices or not response.choices[0].message.content:
        return {
            "error": "Empty response from OpenAI",
            "message": "OpenAI returned an empty response. Please try again."
        }

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

    return {
        "success": True,
        "recipe": recipe_data.get("recipe", ""),
        "ingredients": ingredients,
        "instructions": recipe_data.get("instructions", "")
    }
