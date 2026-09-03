import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
PORT = int(os.getenv("PORT", 8001))
