import asyncio
import os
from backend.main import ask_rufus, QueryRequest, get_history

async def test():
    try:
        print("Testing /ask endpoint...")
        req = QueryRequest(user_query="Is Dyson V15 worth it?", session_id="test_session_123")
        res = await ask_rufus(req)
        print("Ask Response (encoded):", str(res).encode('utf-8'))
        
        print("\nTesting /history endpoint...")
        hist = await get_history("test_session_123")
        print("History Response:", hist)
        print("\nSUCCESS: All components connected!")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
