import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.environ['GEMINI_API_KEY'])

try:
    print([m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods])
except Exception as e:
    print(e)
