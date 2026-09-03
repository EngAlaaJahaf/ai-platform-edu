import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.api import router as api_router
from backend.config import PORT, ALLOWED_ORIGINS
from backend.services.ai_service import use_base_rules_var

app = FastAPI(
    title="ذكاء | EduAI API",
    description="Backend API for EduAI Academic Assistant Platform (RAG, Summaries, Quizzes, Proofreader)",
    version="2.1.0"
)

# CORS middleware - restricted origins (env ALLOWED_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_use_base_rules_context(request: Request, call_next):
    # Check X-Use-Base-Rules header (case-insensitive in request.headers)
    header_val = request.headers.get("x-use-base-rules", "true").lower()
    token = use_base_rules_var.set(header_val != "false")
    try:
        response = await call_next(request)
    finally:
        use_base_rules_var.reset(token)
    return response

app.include_router(api_router)

@app.get("/")
def root():
    return {
        "message": "مرحباً بك في واجهة برمجة تطبيقات ذكاء | EduAI API",
        "docs_url": "/docs",
        "version": "2.1.0"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=True)
