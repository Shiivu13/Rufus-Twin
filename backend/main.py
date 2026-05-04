import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# Import supabase client
from backend.database import get_supabase_client

app = FastAPI(title="Rufus-Twin API")

# Enable CORS for frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase and Gemini
# Note: backend.database already calls load_dotenv(), so env vars are loaded
supabase = get_supabase_client()
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if not gemini_api_key:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=gemini_api_key)

class QueryRequest(BaseModel):
    user_query: str

@app.post("/ask")
async def ask_rufus(request: QueryRequest):
    user_query = request.user_query
    
    if not user_query:
        raise HTTPException(status_code=400, detail="user_query is required")
        
    try:
        # 1. Generate embedding for the user query using Gemini
        embed_result = genai.embed_content(
            model="models/text-embedding-004",
            content=user_query,
            task_type="retrieval_query"
        )
        query_embedding = embed_result['embedding']
        
        # 2. Call Supabase RPC function 'match_products' to find relevant product
        rpc_response = supabase.rpc(
            'match_products',
            {
                'query_embedding': query_embedding,
                'match_threshold': 0.3, # Similarity threshold
                'match_count': 1        # Number of top products to fetch
            }
        ).execute()
        
        products = rpc_response.data
        
        if not products:
            return {"response": "I couldn't find any relevant products matching your query in the database."}
            
        # 3. Fetch the most relevant product's details
        top_product = products[0]
        name = top_product.get("name", "Unknown Product")
        description = top_product.get("description", "No description available.")
        specs = top_product.get("specs", [])
        reviews = top_product.get("reviews", [])
        
        # Parse lists if they are arrays
        specs_str = ", ".join(specs) if isinstance(specs, list) else str(specs)
        reviews_str = " ".join(reviews) if isinstance(reviews, list) else str(reviews)
        
        # Combine the context
        context = f"Product Name: {name}\nDescription: {description}\nSpecifications: {specs_str}\nReviews: {reviews_str}"
        
        # 4. Create System Prompt for Gemini 1.5 Flash
        system_instruction = (
            "You are Rufus, a helpful AI shopping assistant. "
            "Use these reviews and specs to answer the user's question accurately. "
            "If the reviews say something negative, be honest."
        )
        
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
        
        # 5. Send context + user question to Gemini 1.5 Flash
        prompt = f"Context:\n{context}\n\nUser Question: {user_query}"
        response = model.generate_content(prompt)
        
        # 6. Return the AI's response as JSON
        return {
            "response": response.text,
            "product_matched": name
        }
        
    except Exception as e:
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # This allows you to run the file directly via `python backend/main.py`
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
