"""
ذكاء | EduAI — نقطة تشغيل الإنتاج (ملف واحد)
يخدم الواجهة المبنية (frontend/dist) عبر نفس منفذ الـ API (افتراضياً 8001)
"""
import os
from pathlib import Path
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.routes.api import router as api_router
from backend.config import ALLOWED_ORIGINS, PORT
from backend.services.ai_service import use_base_rules_var

BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR / "frontend" / "dist"

app = FastAPI(
    title="ذكاء | EduAI API",
    description="Backend API for EduAI Academic Assistant Platform (RAG, Summaries, Quizzes, Proofreader)",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_use_base_rules_context(request: Request, call_next):
    header_val = request.headers.get("x-use-base-rules", "true").lower()
    token = use_base_rules_var.set(header_val != "false")
    try:
        response = await call_next(request)
    finally:
        use_base_rules_var.reset(token)
    return response


app.include_router(api_router)

DIST_DIR = Path(os.getenv("DIST_DIR", str(DIST_DIR)))
if (DIST_DIR / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    candidate = DIST_DIR / full_path
    if full_path and candidate.is_file():
        return FileResponse(candidate)
    return FileResponse(DIST_DIR / "index.html")


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("serve:app", host=host, port=PORT, reload=False)