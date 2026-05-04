import os
import json
import sys
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add root directory to path so we can import from backend
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(script_dir)
sys.path.append(root_dir)

from backend.database import get_supabase_client

# Initialize Gemini
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY is missing in .env file.")

genai.configure(api_key=gemini_api_key)

def load_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_embedding(text):
    """Generates a 768-dimensional embedding using Gemini API."""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text
    )
    return result['embedding']

def upload_products():
    supabase = get_supabase_client()
    data_path = os.path.join(root_dir, 'data', 'products.json')
    
    if not os.path.exists(data_path):
        print(f"Error: Data file not found at {data_path}")
        return

    products = load_data(data_path)
    print(f"Loaded {len(products)} products. Processing and uploading to Supabase using Gemini Embeddings...")
    
    for product in products:
        # Map our JSON keys to the requested data model
        name = product.get('Title', 'Unknown')
        price = product.get('Price', '')
        desc = product.get('Description', '')
        specs = product.get('Features', [])
        reviews_list = product.get('Reviews', [])
        
        reviews_text = " ".join(reviews_list)
        
        # Combine name, description, and reviews
        combined_text = f"Name: {name}\nDescription: {desc}\nReviews: {reviews_text}"
        
        try:
            print(f"Generating Gemini embedding for: {name}...")
            embedding = generate_embedding(combined_text)
            
            # Prepare the record matching user's requested details
            record = {
                "name": name,
                "price": price,
                "description": desc,
                "specs": specs,
                "reviews": reviews_list,
                "embedding": embedding
            }
            
            # Upload to Supabase
            response = supabase.table("products").insert(record).execute()
            print(f"✅ Successfully uploaded: {name}")
            
        except Exception as e:
            print(f"❌ Failed to process or upload '{name}'.")
            print(f"   Error Details: {e}")

if __name__ == "__main__":
    upload_products()
