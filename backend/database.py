import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# The Supabase Python client automatically handles the '/rest/v1' path, 
# so we strip it if it was provided in the .env file.
url: str = os.environ.get("SUPABASE_URL", "")
if url.endswith("/rest/v1/"):
    url = url.replace("/rest/v1/", "")
    
key: str = os.environ.get("SUPABASE_KEY", "")

def get_supabase_client() -> Client:
    """Returns a Supabase client instance."""
    if not url or not key:
        raise ValueError("Supabase URL or Key is missing. Check your .env file.")
    
    supabase: Client = create_client(url, key)
    return supabase

# Optional: Initialize a global instance
supabase_client = get_supabase_client()
