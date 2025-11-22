from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from openai import OpenAIError
from dotenv import load_dotenv
import os
import json
import traceback

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