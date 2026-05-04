import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from tavily import TavilyClient

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

# Import supabase client
from database import get_supabase_client

app = FastAPI(title="Rufus-Twin API")

# Enable CORS for frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase and APIs
supabase = get_supabase_client()
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if not gemini_api_key:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables.")

tavily_api_key = os.environ.get("TAVILY_API_KEY")
tavily_client = TavilyClient(api_key=tavily_api_key) if tavily_api_key else None

genai.configure(api_key=gemini_api_key)

# Initialize Gemini models
system_instruction = (
    "You are Rufus, a witty and helpful AI shopping assistant. "
    "If a user says hello, be friendly and ask what they are looking to buy today. "
    "If they ask about a product, use the provided search results to give expert advice. "
    "Keep your tone helpful but slightly professional."
)

classifier_model = genai.GenerativeModel("gemini-flash-latest")
rufus_model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    system_instruction=system_instruction
)

class QueryRequest(BaseModel):
    user_query: str
    session_id: str = None

@app.post("/ask")
async def ask_rufus(request: QueryRequest):
    user_query = request.user_query
    session_id = request.session_id or str(uuid.uuid4())
    
    if not user_query:
        raise HTTPException(status_code=400, detail="user_query is required")
        
    try:
        # Fast-path for extremely simple greetings to ensure "near-instant" response
        fast_greetings = {"hi", "hello", "hey", "hola", "yo", "hi there", "hello there"}
        if user_query.lower().strip().strip("?!.") in fast_greetings:
            intent = "GREETING"
        else:
            # 1. The Classifier Step: Determine if we need to search the web
            classification_prompt = (
                f"Classify the following user query into 'RESEARCH' or 'GREETING'.\n"
                f"RESEARCH: If the query is about a specific product, a brand, a comparison, prices, or shopping advice.\n"
                f"GREETING: If the query is a simple greeting (hi, hello), a personal question (who are you), or general talk/jokes.\n\n"
                f"Query: {user_query}\n\n"
                f"Classification (Respond with ONLY 'RESEARCH' or 'GREETING'):"
            )
            classification_response = classifier_model.generate_content(classification_prompt)
            intent = classification_response.text.strip().upper()

        results = []
        images = []
        ai_response_text = ""

        # 2. Routing Logic
        if "GREETING" in intent:
            # Skip search step for simple greetings/general talk
            response = rufus_model.generate_content(user_query)
            ai_response_text = response.text
        else:
            # 3. The Research Step: Trigger Tavily Search for product/shopping queries
            if not tavily_client:
                raise HTTPException(status_code=500, detail="TAVILY_API_KEY is missing.")
            
            # Enhance query for research accuracy (2026/2027 context)
            future_keywords = ["rumor", "leak", "future", "upcoming", "next", "2026", "2027", "latest", "new"]
            enhanced_query = f"{user_query} latest 2026" if any(kw in user_query.lower() for kw in future_keywords) else user_query
            
            # Perform web search
            search_result = tavily_client.search(enhanced_query, search_depth='advanced', include_images=True)
            results = search_result.get("results", [])[:5]
            images = search_result.get("images", [])
            
            contexts = [f"Title: {res.get('title')}\nSnippet: {res.get('content')}" for res in results]
            context_str = "\n\n".join(contexts)
            
            prompt = f"Context (Real-time search results):\n{context_str}\n\nUser Question: {user_query}"
            response = rufus_model.generate_content(prompt)
            ai_response_text = response.text

        # 4. Save to chat history removed as requested
        
        return {
            "session_id": session_id,
            "response": ai_response_text,
            "search_results": results,
            "images": images,
            "intent": intent
        }
        
    except Exception as e:
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{session_id}")
async def get_history(session_id: str):
    try:
        # Fetch previous messages for the session
        response = supabase.table("chat_history").select("*").eq("session_id", session_id).order("created_at").execute()
        return {"session_id": session_id, "history": response.data}
    except Exception as e:
        # Fallback if ordered by created_at fails (if column doesn't exist)
        try:
            response = supabase.table("chat_history").select("*").eq("session_id", session_id).order("id").execute()
            return {"session_id": session_id, "history": response.data}
        except Exception as e2:
            print(f"Error fetching history: {e2}")
            # Final fallback
            try:
                response = supabase.table("chat_history").select("*").eq("session_id", session_id).execute()
                return {"session_id": session_id, "history": response.data}
            except Exception as e3:
                raise HTTPException(status_code=500, detail=str(e3))

@app.get("/products")
async def get_products():
    try:
        response = supabase.table("products").select("*").limit(10).execute()
        return {"products": response.data}
    except Exception as e:
        print(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
