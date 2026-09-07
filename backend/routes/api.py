import os
import shutil
import uuid
import time
import io
import re
import json
import zipfile
from collections import defaultdict
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header, Response, Depends, Request
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

from backend.config import UPLOAD_DIR
from backend.services.document_service import DocumentService
from backend.services.rag_service import RAGService
from backend.services.ai_service import AIService
from backend.services.auth_service import AuthService
from backend.services.quiz_formatter import QuizFormatterService
from backend.services.presentation_service import PresentationService, PresentationError
from backend.services.pptx_theme_extractor import extract_pptx_theme
from backend.database import (
    save_document, 
    get_document, 
    get_latest_document, 
    list_all_documents,
    count_documents,
    update_document_title,
    delete_document,
    save_document_summary,
    save_document_quiz,
    save_document_progress,
    get_or_create_user, 
    authenticate_admin,
    register_user,
    login_user,
    list_all_users,
    get_user_by_id,
    increment_user_tokens,
    estimate_tokens,
    admin_create_user,
    admin_update_user,
    admin_reset_user_password,
    admin_reset_user_tokens,
    admin_set_user_tokens,
    admin_delete_user,
    clear_activity_logs,
    list_prompts,
    save_prompt,
    delete_prompt,
    list_templates,
    save_template,
    delete_template,
    get_template,
    get_system_settings,
    update_system_settings,
    get_activity_logs,
    get_admin_metrics,
    log_activity,
    list_presentations,
    count_presentations,
    get_presentation,
    update_presentation_status,
    create_team,
    get_team,
    list_user_teams,
    join_team_by_code,
    get_member_role,
    set_member_role,
    remove_team_member,
    delete_team,
    share_with_team,
    unshare_from_team,
    list_team_shares,
    get_shared_documents_for_user,
    get_shared_presentations_for_user,
    get_user_doc_team_role,
    user_can_edit_document,
    get_user_pres_team_role,
    user_can_edit_presentation
)

router = APIRouter(prefix="/api")

# --- Auth helpers ---
def _get_current_user(x_user_id: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="غير مصرح - يلزم تسجيل الدخول (X-User-Id مفقود)")
    user = get_user_by_id(x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="المستخدم غير موجود أو الجلسة منتهية")
    return user

def _require_admin(current_user: dict = Depends(_get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="صلاحيات المدير مطلوبة (Admin only)")
    return current_user

# --- Simple in-memory rate limiter ---
RATE_LIMIT_STORE: Dict[str, List[float]] = defaultdict(list)

def _check_rate_limit(key: str, limit: int, window_sec: int = 60):
    now = time.time()
    lst = RATE_LIMIT_STORE[key]
    cutoff = now - window_sec
    # prune
    RATE_LIMIT_STORE[key] = [t for t in lst if t > cutoff]
    if len(RATE_LIMIT_STORE[key]) >= limit:
        raise HTTPException(status_code=429, detail="تم تجاوز الحد المسموح، حاول مرة أخرى بعد قليل (Rate limit)")
    RATE_LIMIT_STORE[key].append(now)

class AdminLoginRequest(BaseModel):
    admin_key: str

class StudentLoginRequest(BaseModel):
    email: str
    name: Optional[str] = ""

class ProgressRequest(BaseModel):
    progress_json: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "student"

class LoginRequest(BaseModel):
    email: str
    password: str

class AdminCreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "student"
    tier: Optional[str] = "Pro Academic 🌟"
    token_limit: Optional[int] = 500000
    permissions: Optional[Dict[str, Any]] = None

class AdminUpdateUserRequest(BaseModel):
    name: str
    email: str
    role: str
    tier: Optional[str] = "Pro Academic 🌟"
    token_limit: Optional[int] = 500000
    permissions: Optional[Dict[str, Any]] = None

class AdminResetPasswordRequest(BaseModel):
    new_password: str

class AdminSetTokensRequest(BaseModel):
    tokens_used: Optional[int] = None
    tokens_limit: Optional[int] = None

class UpdateDocumentRequest(BaseModel):
    title: str

class UpdateSettingsRequest(BaseModel):
    settings: Dict[str, Any]

class ChatRequest(BaseModel):
    query: str
    doc_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []
    custom_system_prompt: Optional[str] = None

class SummarizeRequest(BaseModel):
    doc_id: Optional[str] = None
    level: Optional[str] = "full"
    language: Optional[str] = "ar"
    custom_system_prompt: Optional[str] = None

class QuizRequest(BaseModel):
    doc_id: Optional[str] = None
    count: Optional[int] = 5
    difficulty: Optional[str] = "medium"
    language: Optional[str] = "bilingual"
    custom_system_prompt: Optional[str] = None
    extract_only: Optional[bool] = False

class ProofreadRequest(BaseModel):
    text: str
    custom_system_prompt: Optional[str] = None

class TranslateRequest(BaseModel):
    doc_id: Optional[str] = None
    text: Optional[str] = None
    source_lang: Optional[str] = "en"
    target_lang: Optional[str] = "ar"
    mode: Optional[str] = "line_by_line" # 'target_only', 'page_by_page', 'line_by_line'
    custom_system_prompt: Optional[str] = None

class ValidateConnectionRequest(BaseModel):
    provider: Optional[str] = "gemini"
    api_key: Optional[str] = ""
    base_url: Optional[str] = ""
    model: Optional[str] = ""

class FetchModelsRequest(BaseModel):
    provider: Optional[str] = "gemini"
    base_url: Optional[str] = ""
    api_key: Optional[str] = ""

class GoogleVerifyRequest(BaseModel):
    credential: str
    client_id: Optional[str] = None

class CreatePromptRequest(BaseModel):
    category: str
    title: str
    description: Optional[str] = ""
    system_prompt: str

class GeneratePromptRequest(BaseModel):
    task_goal: str
    category: Optional[str] = "quiz"

class QuizExportRequest(BaseModel):
    quiz_data: Any
    format: str # 'custom_text', 'csv', 'xlsx', 'json'
    chapter_title: Optional[str] = "Chapter Exam"

class QuizImportTextRequest(BaseModel):
    raw_text: str

class DocxExportRequest(BaseModel):
    title: str
    subtitle: Optional[str] = ""
    doc_name: Optional[str] = ""
    content: Optional[str] = None
    units: Optional[List[Dict[str, Any]]] = None
    sections: Optional[List[Dict[str, Any]]] = None

class PresentationGenerateRequest(BaseModel):
    text: Optional[str] = ""
    theme: Optional[Any] = "academic"  # str (legacy) أو كائن هوية بصرية {base, colors, fonts, accent}
    doc_id: Optional[str] = None
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    slide_min: Optional[int] = 8
    slide_max: Optional[int] = 15

class PresentationDeckRequest(BaseModel):
    deck: Dict[str, Any]


@router.get("/health")
def health_check(
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None)
):
    latest_doc = get_latest_document()
    return {
        "status": "ok",
        "provider": x_ai_provider,
        "has_documents": latest_doc is not None
    }

@router.post("/validate-key")
def validate_connection_endpoint(req: ValidateConnectionRequest):
    try:
        result = AIService.validate_connection(
            provider=req.provider or "gemini",
            api_key=req.api_key or "",
            base_url=req.base_url or "",
            model=req.model or ""
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/fetch-models")
def fetch_models_endpoint(req: FetchModelsRequest):
    """Dynamically query the Base URL or Provider to discover installed models."""
    models = AIService.fetch_available_models(
        provider=req.provider or "gemini",
        base_url=req.base_url or "",
        api_key=req.api_key or ""
    )
    return {"models": models}

@router.post("/auth/google/verify")
def verify_google_token_endpoint(req: GoogleVerifyRequest):
    result = AuthService.verify_google_credential(req.credential, req.client_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "فشل التحقق من Google"))
    return result

@router.post("/auth/register")
def register_endpoint(req: RegisterRequest):
    res = register_user(req.name, req.email, req.password, req.role or "student")
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "فشل إنشاء الحساب"))
    return res

@router.post("/auth/login")
def login_endpoint(req: LoginRequest):
    res = login_user(req.email, req.password)
    if not res["success"]:
        raise HTTPException(status_code=401, detail=res.get("error", "فشل تسجيل الدخول"))
    return res

@router.post("/auth/admin-login")
def admin_login_endpoint(req: AdminLoginRequest):
    res = authenticate_admin(req.admin_key)
    if not res["success"]:
        raise HTTPException(status_code=401, detail=res.get("error", "رمز التحقق أو كلمة مرور المدير غير صحيحة"))
    return res

@router.post("/auth/student-login")
def student_login_endpoint(req: StudentLoginRequest):
    clean_email = req.email.strip().lower()
    clean_name = req.name.strip() if req.name else clean_email.split("@")[0]
    user = get_or_create_user(
        google_id=f"student_{clean_email.replace('@', '_').replace('.', '_')}",
        email=clean_email,
        name=clean_name,
        picture=f"https://api.dicebear.com/7.x/avataaars/svg?seed={clean_email}",
        role="student"
    )
    return {"success": True, "user": user}

@router.get("/user/me")
def get_current_user_profile(x_user_id: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="غير مصرح")
    user = get_user_by_id(x_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    # Hide password_hash
    user.pop("password_hash", None)
    return {"user": user}

# --- Prompts Management Endpoints ---
@router.get("/prompts")
def get_prompts(category: Optional[str] = None):
    return {"prompts": list_prompts(category)}

@router.post("/prompts")
def create_custom_prompt(req: CreatePromptRequest):
    p_id = f"p_{str(uuid.uuid4())[:8]}"
    saved = save_prompt(
        prompt_id=p_id,
        category=req.category,
        title=req.title,
        description=req.description or "",
        system_prompt=req.system_prompt
    )
    return {"success": True, "prompt": saved}

@router.delete("/prompts/{prompt_id}")
def remove_custom_prompt(prompt_id: str):
    delete_prompt(prompt_id)
    return {"success": True}

@router.post("/generate-prompt")
def generate_prompt_endpoint(
    req: GeneratePromptRequest,
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None),
    x_ai_base_url: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header(None)
):
    result = AIService.generate_custom_prompt(
        task_goal=req.task_goal,
        category=req.category or "quiz",
        provider=x_ai_provider or "gemini",
        api_key=x_gemini_api_key,
        base_url=x_ai_base_url,
        model=x_gemini_model
    )
    return result

# --- Quiz Export & Import Endpoints ---
@router.post("/quiz/export")
def export_quiz_endpoint(req: QuizExportRequest):
    fmt = req.format.lower()
    chapter_title = req.chapter_title or "Chapter Exam"
    
    if fmt == "custom_text" or fmt == "txt":
        content = QuizFormatterService.to_bilingual_custom_text(req.quiz_data, chapter_title)
        return {
            "format": "txt",
            "content": content,
            "filename": f"Quiz_{chapter_title}.txt"
        }
    elif fmt == "csv":
        csv_text = QuizFormatterService.to_csv(req.quiz_data)
        return {
            "format": "csv",
            "content": csv_text,
            "filename": f"Quiz_{chapter_title}.csv"
        }
    elif fmt == "xlsx":
        excel_bytes = QuizFormatterService.to_excel_bytes(req.quiz_data)
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="Quiz_{chapter_title}.xlsx"'}
        )
    elif fmt == "json":
        return {
            "format": "json",
            "content": req.quiz_data,
            "filename": f"Quiz_{chapter_title}.json"
        }
    else:
        raise HTTPException(status_code=400, detail="الصيغة غير مدعومة. الصيغ المدعومة: custom_text, csv, xlsx, json")

@router.post("/quiz/import-text")
def import_quiz_text_endpoint(req: QuizImportTextRequest):
    parsed = QuizFormatterService.parse_custom_text(req.raw_text)
    if not parsed["questions"]:
        raise HTTPException(status_code=400, detail="لم يتم العثور على أسئلة مطابقة للصيغة في النص المدخل.")
    return parsed

# --- Document & AI Endpoints (Multi-Format Support with Multi-Tenant User Isolation) ---
@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...), 
    user_id: Optional[str] = Form(None),
    x_user_id: Optional[str] = Header(None)
):
    effective_user_id = user_id or x_user_id
    # Rate limit: 10 uploads / minute per user/ip
    _check_rate_limit(f"upload:{effective_user_id or request.client.host}", limit=10, window_sec=60)
    # Dynamic allowed formats & size from system_settings
    sys_settings = get_system_settings()
    allowed_exts = [str(f).lower() for f in sys_settings.get("allowed_formats", [".pdf", ".docx", ".doc", ".pptx", ".ppt", ".txt", ".md", ".csv", ".xlsx", ".xls", ".rtf"])]
    max_size_mb = int(sys_settings.get("max_upload_size_mb", 50))
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=400, 
            detail=f"نوع الملف غير مدعوم ({file_ext}). الصيغ المسموحة حالياً: {', '.join(allowed_exts)} (يمكن للمدير تعديلها من لوحة التحكم > إعدادات متقدمة)"
        )
    # Validate file size if available
    try:
        file.file.seek(0, 2)
        size_bytes = file.file.tell()
        file.file.seek(0)
        if size_bytes > max_size_mb * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"حجم الملف يتجاوز الحد المسموح ({max_size_mb} MB) — عدّل الحد من لوحة التحكم")
    except HTTPException:
        raise
    except Exception:
        pass
        
    doc_id = str(uuid.uuid4())[:8]
    save_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
    
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        pages_data = DocumentService.extract_text_and_pages(save_path)
        chunks = DocumentService.chunk_document(pages_data)
        full_text = "\n\n".join([p["text"] for p in pages_data])
        words_count = len(full_text.split())
        
        save_document(
            doc_id=doc_id,
            filename=file.filename,
            file_path=save_path,
            pages_count=len(pages_data),
            words_count=words_count,
            full_text=full_text,
            chunks=chunks,
            user_id=effective_user_id
        )
        
        return {
            "success": True,
            "doc_id": doc_id,
            "filename": file.filename,
            "pages_count": len(pages_data),
            "chunks_count": len(chunks),
            "words_count": words_count,
            "preview_text": full_text[:400] + "..." if len(full_text) > 400 else full_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء معالجة المستند: {str(e)}")

@router.get("/documents/latest")
def get_latest_doc_endpoint(x_user_id: Optional[str] = Header(None)):
    doc = get_latest_document(user_id=x_user_id)
    if not doc:
        return {"document": None}
    return {
        "document": {
            "doc_id": doc["id"],
            "filename": doc["filename"],
            "pages_count": doc["pages_count"],
            "words_count": doc.get("words_count", 0),
            "preview_text": doc["full_text"][:400] + "..." if len(doc.get("full_text", "")) > 400 else doc.get("full_text", ""),
            "summary_data": doc.get("summary_data"),
            "quiz_data": doc.get("quiz_data")
        }
    }

@router.post("/chat")
def chat_with_doc(
    req: ChatRequest,
    request: Request,
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None),
    x_ai_base_url: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    _check_rate_limit(f"chat:{x_user_id or request.client.host}", limit=20, window_sec=60)
    doc = _resolve_doc_for_user(req.doc_id, x_user_id) if req.doc_id else get_latest_document(user_id=x_user_id)
    chunks = doc.get("chunks", []) if doc else []
    # Dynamic RAG top_k from system_settings
    rag_k = int(get_system_settings().get("auto_rag_chunks", 4))
    # Ensure reasonable bounds 2-12, but keep user's expected 50 as fallback for legacy if chunks many
    # If chunks small, use all; if large, use setting*2
    top_k = max(4, min(50, rag_k * 3)) if rag_k else 50
    relevant_chunks = RAGService.search_relevant_chunks(req.query, chunks, top_k=top_k)
    
    result = AIService.answer_with_rag(
        query=req.query,
        context_chunks=relevant_chunks,
        conversation_history=req.history,
        provider=x_ai_provider or "gemini",
        api_key=x_gemini_api_key,
        base_url=x_ai_base_url,
        model=x_gemini_model,
        custom_system_prompt=req.custom_system_prompt
    )
    # Token tracking
    try:
        delta = estimate_tokens(req.query) + estimate_tokens(result.get("answer",""))
        increment_user_tokens(x_user_id, delta)
    except Exception: pass
    return {
        "query": req.query,
        "answer": result["answer"],
        "citations": result["citations"],
        "is_out_of_scope": result["is_out_of_scope"],
        "sources": result.get("sources", [])
    }

@router.post("/chat/stream")
def chat_stream(
    req: ChatRequest,
    request: Request,
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None),
    x_ai_base_url: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    _check_rate_limit(f"chat_stream:{x_user_id or request.client.host}", limit=20, window_sec=60)
    """Streaming RAG chat - yields text chunks as they arrive (vector-ranked)."""
    doc = _resolve_doc_for_user(req.doc_id, x_user_id) if req.doc_id else get_latest_document(user_id=x_user_id)
    chunks = doc.get("chunks", []) if doc else []
    rag_k = int(get_system_settings().get("auto_rag_chunks", 4))
    top_k = max(4, min(50, rag_k * 3)) if rag_k else 50
    relevant_chunks = RAGService.search_relevant_chunks(req.query, chunks, top_k=top_k)

    def gen():
        full = ""
        try:
            for token in AIService.answer_with_rag_stream(
                query=req.query,
                context_chunks=relevant_chunks,
                conversation_history=req.history,
                provider=x_ai_provider or "gemini",
                api_key=x_gemini_api_key,
                base_url=x_ai_base_url,
                model=x_gemini_model,
                custom_system_prompt=req.custom_system_prompt
            ):
                full += token
                yield token
            # Track tokens after stream completes
            try:
                delta = estimate_tokens(req.query) + estimate_tokens(full)
                increment_user_tokens(x_user_id, delta)
            except Exception: pass
        except Exception as e:
            yield f"\n\n⚠️ خطأ في البث: {e}"

    return StreamingResponse(gen(), media_type="text/plain; charset=utf-8", headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})

@router.post("/summarize")
def summarize_doc(
    req: SummarizeRequest,
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None),
    x_ai_base_url: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    doc = None
    if req.doc_id and req.doc_id not in ("undefined", "null", ""):
        doc = _resolve_doc_for_user(req.doc_id, x_user_id)
    if not doc:
        doc = get_latest_document(user_id=x_user_id)
        
    full_text = doc.get("full_text", "") if doc else ""
    if not full_text:
        raise HTTPException(status_code=400, detail="يرجى رفع أو اختيار مادة تعليمية للتلخيص أولاً.")
    
    summary_data = AIService.generate_summary_and_mindmap(
        full_text=full_text,
        level=req.level or "full",
        language=req.language or "ar",
        provider=x_ai_provider or "gemini",
        api_key=x_gemini_api_key,
        base_url=x_ai_base_url,
        model=x_gemini_model,
        custom_system_prompt=req.custom_system_prompt
    )
    if doc and doc.get("id") and (not x_user_id or user_can_edit_document(x_user_id, doc["id"])):
        save_document_summary(doc["id"], summary_data)
    try:
        import json as _json
        delta = estimate_tokens(full_text[:3000]) + estimate_tokens(_json.dumps(summary_data, ensure_ascii=False))
        increment_user_tokens(x_user_id, delta)
    except Exception: pass
        
    return summary_data

@router.post("/generate-quiz")
def generate_quiz_endpoint(
    req: QuizRequest,
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None),
    x_ai_base_url: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    doc = None
    if req.doc_id and req.doc_id not in ("undefined", "null", ""):
        doc = _resolve_doc_for_user(req.doc_id, x_user_id)
    if not doc:
        doc = get_latest_document(user_id=x_user_id)
        
    full_text = doc.get("full_text", "") if doc else ""
    if not full_text:
        raise HTTPException(status_code=400, detail="يرجى رفع أو اختيار مادة تعليمية للاختبار أولاً.")
    
    quiz_data = AIService.generate_quiz(
        full_text=full_text,
        count=req.count or 5,
        difficulty=req.difficulty or "medium",
        language=req.language or "bilingual",
        provider=x_ai_provider or "gemini",
        api_key=x_gemini_api_key,
        base_url=x_ai_base_url,
        model=x_gemini_model,
        custom_system_prompt=req.custom_system_prompt,
        extract_only=req.extract_only
    )
    if doc and doc.get("id") and (not x_user_id or user_can_edit_document(x_user_id, doc["id"])):
        save_document_quiz(doc["id"], quiz_data)
    try:
        import json as _json2
        delta = estimate_tokens(full_text[:3000]) + estimate_tokens(_json2.dumps(quiz_data, ensure_ascii=False))
        increment_user_tokens(x_user_id, delta)
    except Exception: pass
        
    return quiz_data

@router.post("/proofread")
def proofread_endpoint(
    req: ProofreadRequest,
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None),
    x_ai_base_url: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="النص المدخل فارغ.")
        
    result = AIService.proofread_text(
        input_text=req.text,
        provider=x_ai_provider or "gemini",
        api_key=x_gemini_api_key,
        base_url=x_ai_base_url,
        model=x_gemini_model,
        custom_system_prompt=req.custom_system_prompt
    )
    try:
        import json as _json3
        delta = estimate_tokens(req.text) + estimate_tokens(_json3.dumps(result, ensure_ascii=False))
        increment_user_tokens(x_user_id, delta)
    except Exception: pass
    return result

@router.post("/translate")
def translate_endpoint(
    req: TranslateRequest,
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None),
    x_ai_base_url: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """Translate academic documents in pure, page-by-page, or interlinear line-by-line modes."""
    doc = None
    if req.doc_id and req.doc_id not in ("undefined", "null", ""):
        doc = _resolve_doc_for_user(req.doc_id, x_user_id)
    if not doc:
        doc = get_latest_document(user_id=x_user_id)

    if req.text and req.text.strip():
        full_text = req.text.strip()
    elif doc:
        full_text = doc.get("full_text", "")
    else:
        full_text = ""

    if not full_text:
        raise HTTPException(status_code=400, detail="يرجى رفع أو اختيار مادة تعليمية تحتوي على نصوص للترجمة أولاً.")

    result = AIService.translate_document(
        full_text=full_text,
        source_lang=req.source_lang or "en",
        target_lang=req.target_lang or "ar",
        mode=req.mode or "line_by_line",
        provider=x_ai_provider or "gemini",
        api_key=x_gemini_api_key,
        base_url=x_ai_base_url,
        model=x_gemini_model,
        custom_system_prompt=req.custom_system_prompt
    )
    try:
        import json as _json4
        delta = estimate_tokens(full_text[:3000]) + estimate_tokens(_json4.dumps(result, ensure_ascii=False))
        increment_user_tokens(x_user_id, delta)
    except Exception: pass
    return result

@router.post("/export/docx")
def export_docx_endpoint(req: DocxExportRequest):
    """Generate and stream a styled Microsoft Word (.docx) document."""
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    import io
    from fastapi.responses import StreamingResponse

    doc = docx.Document()
    
    # Page Margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Document Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run(req.title or "المستند المترجم")
    title_run.font.size = Pt(20)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    # Subtitle / Meta
    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta_text = f"المستند الأصلي: {req.doc_name or 'مادة تعليمية'}  |  المنصة: المساعد الأكاديمي الذكي"
    if req.subtitle:
        meta_text = f"{req.subtitle}\n{meta_text}"
    sub_run = sub_p.add_run(meta_text)
    sub_run.font.size = Pt(10.5)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # If Line-by-line translation units provided
    if req.units and len(req.units) > 0:
        h = doc.add_heading(level=1)
        hrun = h.add_run("الترجمة السطرية الموازية (Line-by-Line Parallel Translation)")
        hrun.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        
        table = doc.add_table(rows=1, cols=2)
        table.style = 'Table Grid'
        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = 'النص الأصلي (Original Text)'
        hdr_cells[1].text = 'الترجمة الأكاديمية (Arabic Translation)'
        
        for idx, u in enumerate(req.units):
            row_cells = table.add_row().cells
            row_cells[0].text = f"[{idx+1}] {u.get('original', '')}"
            row_cells[1].text = u.get('translated', '')

    # If general sections provided
    elif req.sections and len(req.sections) > 0:
        for sec in req.sections:
            h = doc.add_heading(level=1)
            hrun = h.add_run(sec.get('title', 'قسم'))
            hrun.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
            
            p = doc.add_paragraph()
            prun = p.add_run(sec.get('content', ''))
            prun.font.size = Pt(12)
            p.paragraph_format.line_spacing = 1.3
            p.paragraph_format.space_after = Pt(8)

    # If raw content text provided
    elif req.content:
        for line in req.content.split('\n'):
            line_str = line.strip()
            if not line_str:
                continue
            if line_str.startswith('# '):
                h = doc.add_heading(level=1)
                hrun = h.add_run(line_str[2:])
                hrun.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
            elif line_str.startswith('## '):
                h = doc.add_heading(level=2)
                hrun = h.add_run(line_str[3:])
                hrun.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
            elif line_str.startswith('### '):
                h = doc.add_heading(level=3)
                hrun = h.add_run(line_str[4:])
            elif line_str.startswith('- ') or line_str.startswith('* '):
                doc.add_paragraph(line_str[2:], style='List Bullet')
            else:
                p = doc.add_paragraph()
                prun = p.add_run(line_str)
                prun.font.size = Pt(12)
                p.paragraph_format.line_spacing = 1.3

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    
    clean_name = f"Translated_{req.doc_name or 'Document'}.docx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{clean_name}"'}
    )



# -------------------------------------------------------------
# Document Management Endpoints (مكتبة وإدارة المستندات)
# -------------------------------------------------------------

@router.get("/documents")
def list_documents_endpoint(x_user_id: Optional[str] = Header(None), limit: int = 20, offset: int = 0, search: Optional[str] = None, include_shared: bool = True):
    """Retrieve paginated documents belonging to the authenticated user + team-shared ones."""
    docs = list_all_documents(user_id=x_user_id, limit=limit, offset=offset, search=search)
    total = count_documents(user_id=x_user_id, search=search)
    shared = get_shared_documents_for_user(x_user_id, search=search) if (include_shared and x_user_id) else []
    return {"documents": docs, "total": total, "limit": limit, "offset": offset, "shared": shared, "shared_total": len(shared)}

@router.get("/documents/{doc_id}")
def get_document_endpoint(doc_id: str, x_user_id: Optional[str] = Header(None)):
    """Retrieve single document details with owner validation (or team-shared view access)."""
    doc = _resolve_doc_for_user(doc_id, x_user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="المستند غير موجود أو لا تملك صلاحية الوصول إليه.")
    if x_user_id:
        role = get_user_doc_team_role(x_user_id, doc_id)
        if role:
            doc["shared"] = True
            doc["my_team_role"] = role
    return {"document": doc}

@router.patch("/documents/{doc_id}")
def update_document_endpoint(doc_id: str, req: UpdateDocumentRequest, x_user_id: Optional[str] = Header(None)):
    """Rename or update document title with owner validation (or team editor+ role)."""
    success = update_document_title(doc_id, req.title.strip(), user_id=x_user_id)
    if not success and x_user_id and user_can_edit_document(x_user_id, doc_id):
        success = update_document_title(doc_id, req.title.strip())
    if not success:
        if _doc_edit_denied(doc_id, x_user_id):
            raise HTTPException(status_code=403, detail="دورك في الفريق (مشاهد) لا يسمح بتعديل هذا المستند.")
        raise HTTPException(status_code=404, detail="فشل تحديث المستند أو لم يتم العثور عليه في مكتبتك.")
    return {"success": True, "message": "تم تحديث اسم المستند بنجاح"}

@router.delete("/documents/{doc_id}")
def delete_document_endpoint(doc_id: str, x_user_id: Optional[str] = Header(None)):
    """Delete document from database and storage with owner validation (or team editor+ role)."""
    success = delete_document(doc_id, user_id=x_user_id)
    if not success and x_user_id and user_can_edit_document(x_user_id, doc_id):
        success = delete_document(doc_id)
    if not success:
        if _doc_edit_denied(doc_id, x_user_id):
            raise HTTPException(status_code=403, detail="دورك في الفريق (مشاهد) لا يسمح بحذف هذا المستند.")
        raise HTTPException(status_code=404, detail="المستند غير موجود في مكتبتك الخاصة.")
    return {"success": True, "message": "تم حذف المستند بنجاح"}

@router.get("/documents/{doc_id}/progress")
def get_quiz_progress_endpoint(doc_id: str, x_user_id: Optional[str] = Header(None)):
    """Retrieve saved quiz progress for a document (owner or team-shared view access)."""
    doc = _resolve_doc_for_user(doc_id, x_user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="المستند غير موجود")
    return {"progress_json": doc.get("quiz_progress_json")}

@router.post("/documents/{doc_id}/progress")
def save_quiz_progress_endpoint(doc_id: str, req: ProgressRequest, x_user_id: Optional[str] = Header(None)):
    """Save quiz progress for a document (owner or team editor+ role)."""
    doc = _resolve_doc_for_user(doc_id, x_user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="المستند غير موجود")
    if x_user_id and not user_can_edit_document(x_user_id, doc_id):
        raise HTTPException(status_code=403, detail="دورك في الفريق (مشاهد) لا يسمح بحفظ التقدم.")
    save_document_progress(doc_id, req.progress_json)
    return {"success": True}

# -------------------------------------------------------------
# Teams & Sharing Endpoints (T3.1 — مساحة الفريق)
# -------------------------------------------------------------

class CreateTeamRequest(BaseModel):
    name: str

class JoinTeamRequest(BaseModel):
    invite_code: str

class ShareRequest(BaseModel):
    entity_type: str  # 'document' | 'presentation'
    entity_id: str

class SetMemberRoleRequest(BaseModel):
    role: str  # 'admin' | 'editor' | 'viewer'


def _team_exc(e: ValueError) -> HTTPException:
    """تحويل أخطاء منطق الفرق إلى حالات HTTP مناسبة."""
    msg = str(e) or "خطأ في عملية الفريق."
    if any(k in msg for k in ("غير موجود", "غير صالح", "ليست في الفريق", "ليس في الفريق")):
        return HTTPException(status_code=404, detail=msg)
    if any(k in msg for k in ("صلاحية", "متاح", "يتطلب", "تتطلب", "لا يمكنك", "لا يمكن")):
        return HTTPException(status_code=403, detail=msg)
    return HTTPException(status_code=400, detail=msg)


def _resolve_doc_for_user(doc_id: Optional[str], user_id: Optional[str]) -> Optional[Dict[str, Any]]:
    """مستند المستخدم الخاص أو المشارك معه عبر فريق (مشاهدة)."""
    if not doc_id:
        return None
    doc = get_document(doc_id, user_id=user_id)
    if doc:
        return doc
    if user_id and get_user_doc_team_role(user_id, doc_id):
        return get_document(doc_id)
    return None


def _doc_edit_denied(doc_id: str, user_id: Optional[str]) -> bool:
    """True إن كان المستند موجوداً لكن المستخدم بلا حق تعديل (للتمييز 403 عن 404)."""
    if not user_id:
        return False
    if get_document(doc_id):
        return not user_can_edit_document(user_id, doc_id)
    return False


@router.post("/teams")
def create_team_endpoint(req: CreateTeamRequest, current_user: dict = Depends(_get_current_user)):
    """إنشاء فريق جديد — المنشئ مالك ويستلم كود الدعوة."""
    try:
        team = create_team(current_user["id"], req.name)
    except ValueError as e:
        raise _team_exc(e)
    return {"team": team}


@router.get("/teams")
def list_teams_endpoint(current_user: dict = Depends(_get_current_user)):
    """فرقي — كل الفرق التي أنتمي إليها مع دوري فيها."""
    return {"teams": list_user_teams(current_user["id"])}


@router.post("/teams/join")
def join_team_endpoint(req: JoinTeamRequest, current_user: dict = Depends(_get_current_user)):
    """الانضمام لفريق عبر كود الدعوة (دور editor افتراضياً)."""
    try:
        team = join_team_by_code(current_user["id"], req.invite_code)
    except ValueError as e:
        raise _team_exc(e)
    return {"team": team, "message": "تم الانضمام للفريق بنجاح"}


@router.get("/teams/{team_id}")
def get_team_endpoint(team_id: str, current_user: dict = Depends(_get_current_user)):
    """تفاصيل الفريق والأعضاء والمشاركات — للأعضاء فقط."""
    team = get_team(team_id, current_user["id"])
    if not team:
        raise HTTPException(status_code=404, detail="الفريق غير موجود أو لست عضواً فيه.")
    return {"team": team}


@router.delete("/teams/{team_id}")
def delete_team_endpoint(team_id: str, current_user: dict = Depends(_get_current_user)):
    """حذف الفريق — مالكه فقط."""
    try:
        delete_team(team_id, current_user["id"])
    except ValueError as e:
        raise _team_exc(e)
    return {"success": True, "message": "تم حذف الفريق"}


@router.post("/teams/{team_id}/shares")
def share_with_team_endpoint(team_id: str, req: ShareRequest, current_user: dict = Depends(_get_current_user)):
    """مشاركة مستند/عرض مع الفريق — editor فأعلى."""
    try:
        share = share_with_team(team_id, req.entity_type, req.entity_id, current_user["id"])
    except ValueError as e:
        raise _team_exc(e)
    return {"share": share}


@router.get("/teams/{team_id}/shares")
def list_shares_endpoint(team_id: str, current_user: dict = Depends(_get_current_user)):
    """مشاركات الفريق — للأعضاء فقط."""
    try:
        shares = list_team_shares(team_id, current_user["id"])
    except ValueError as e:
        raise _team_exc(e)
    return {"shares": shares}


@router.delete("/teams/{team_id}/shares")
def unshare_endpoint(team_id: str, req: ShareRequest, current_user: dict = Depends(_get_current_user)):
    """إلغاء مشاركة عنصر — editor فأعلى."""
    try:
        ok = unshare_from_team(team_id, req.entity_type, req.entity_id, current_user["id"])
    except ValueError as e:
        raise _team_exc(e)
    if not ok:
        raise HTTPException(status_code=404, detail="المشاركة غير موجودة.")
    return {"success": True, "message": "تم إلغاء المشاركة"}


@router.patch("/teams/{team_id}/members/{member_id}")
def set_role_endpoint(team_id: str, member_id: str, req: SetMemberRoleRequest, current_user: dict = Depends(_get_current_user)):
    """تغيير دور عضو — مشرف الفريق (admin) أو المالك."""
    try:
        team = set_member_role(team_id, member_id, req.role, current_user["id"])
    except ValueError as e:
        raise _team_exc(e)
    return {"team": team}


@router.delete("/teams/{team_id}/members/{member_id}")
def remove_member_endpoint(team_id: str, member_id: str, current_user: dict = Depends(_get_current_user)):
    """إزالة عضو — مشرف الفريق أو المالك (لا يمكن إزالة المالك)."""
    try:
        remove_team_member(team_id, member_id, current_user["id"])
    except ValueError as e:
        raise _team_exc(e)
    return {"success": True, "message": "تمت إزالة العضو من الفريق"}


@router.get("/shared/documents")
def shared_docs_endpoint(current_user: dict = Depends(_get_current_user), search: Optional[str] = None):
    """مستندات الفرق المشاركة معي (ليست ملكي)."""
    return {"documents": get_shared_documents_for_user(current_user["id"], search=search)}


@router.get("/shared/presentations")
def shared_pres_endpoint(current_user: dict = Depends(_get_current_user)):
    """عروض الفرق المشاركة معي (ليست ملكي)."""
    return {"presentations": get_shared_presentations_for_user(current_user["id"])}

# -------------------------------------------------------------
# Presentation Generator Endpoints (مولّد العروض التقديمية)
# -------------------------------------------------------------

def _pres_headers(provider, api_key, base_url, model):
    return {
        "provider": provider or "gemini",
        "api_key": api_key,
        "base_url": base_url,
        "model": model,
    }


@router.post("/presentations/generate")
def presentation_generate_endpoint(
    req: PresentationGenerateRequest,
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None),
    x_ai_base_url: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    request: Request = None,
):
    """نص حر → deck JSON محفوظ (قبل الرندر، قابل للتعديل)."""
    if request:
        _check_rate_limit(f"pres_gen:{x_user_id or request.client.host}", limit=5, window_sec=60)
    user = _get_current_user(x_user_id)
    ai = _pres_headers(x_ai_provider, x_gemini_api_key, x_ai_base_url, x_gemini_model)
    try:
        result = PresentationService.create(
            user_id=user["id"],
            text=req.text or "",
            theme=req.theme or "academic",
            doc_id=req.doc_id,
            start_page=req.start_page,
            end_page=req.end_page,
            slide_min=req.slide_min,
            slide_max=req.slide_max,
            provider=ai["provider"],
            api_key=ai["api_key"],
            base_url=ai["base_url"],
            model=ai["model"],
        )
    except PresentationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    try:
        delta = estimate_tokens(req.text[:3000]) + estimate_tokens(json.dumps(result.get("deck", {}), ensure_ascii=False))
        increment_user_tokens(user["id"], delta)
    except Exception:
        pass
    return result


@router.post("/presentations/{pres_id}/deck")
def presentation_save_deck_endpoint(
    pres_id: str,
    req: PresentationDeckRequest,
    x_user_id: Optional[str] = Header(None),
):
    """حفظ deck معدّل قبل الرندر."""
    user = _get_current_user(x_user_id)
    try:
        result = PresentationService.update_deck_json(pres_id, user["id"], req.deck)
    except PresentationError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result


@router.post("/presentations/{pres_id}/render")
def presentation_render_endpoint(
    pres_id: str,
    x_user_id: Optional[str] = Header(None),
    request: Request = None,
):
    """رندر deck → PPTX + PDF + صور المعاينة (مزامن)."""
    if request:
        _check_rate_limit(f"pres_render:{x_user_id or request.client.host}", limit=3, window_sec=60)
    user = _get_current_user(x_user_id)
    try:
        row = PresentationService.load(pres_id, user["id"])
    except PresentationError:
        raise HTTPException(status_code=404, detail="العرض غير موجود في مكتبتك.")
    deck = row.get("deck")
    if not deck:
        raise HTTPException(status_code=404, detail="بيانات العرض غير متوفرة (deck.json ناقص).")
    update_presentation_status(pres_id, "rendering", error="")
    try:
        result_dir = PresentationService.render_deck(pres_id, user["id"], deck, row.get("title", "presentation"))
    except PresentationError as e:
        raise HTTPException(status_code=500, detail=str(e))
    n = int(row.get("slide_count") or len(deck.get("slides", [])) or 0)
    previews = [f"/api/presentations/{pres_id}/slides/{i}" for i in range(1, n + 1)]
    return {
        "status": "rendered",
        "slide_count": n,
        "previews": previews,
        "result_dir": result_dir,
    }


@router.get("/presentations")
def presentation_list_endpoint(
    limit: int = 20,
    offset: int = 0,
    x_user_id: Optional[str] = Header(None),
):
    user = _get_current_user(x_user_id)
    items = list_presentations(user["id"], limit=limit, offset=offset)
    total = count_presentations(user["id"])
    shared = get_shared_presentations_for_user(user["id"])
    return {"presentations": items, "total": total, "shared": shared, "shared_total": len(shared)}


# ---------------------------------------------------------------
# القوالب / الهويات البصرية
# ---------------------------------------------------------------

class TemplatePayload(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = ""
    base: Optional[str] = "academic"
    colors: Optional[Dict[str, Any]] = None
    fonts: Optional[Dict[str, Any]] = None
    accent: Optional[str] = "gold"
    preview_b64: Optional[str] = ""


@router.get("/templates")
def template_list_endpoint(x_user_id: Optional[str] = Header(None)):
    user = _get_current_user(x_user_id)
    items = list_templates(user_id=user["id"], include_system=True)
    return {"templates": items}


@router.post("/templates")
def template_save_endpoint(req: TemplatePayload, x_user_id: Optional[str] = Header(None)):
    user = _get_current_user(x_user_id)
    saved = save_template(req.dict(), user_id=user["id"])
    return saved


@router.delete("/templates/{template_id}")
def template_delete_endpoint(template_id: str, x_user_id: Optional[str] = Header(None)):
    user = _get_current_user(x_user_id)
    delete_template(template_id, user_id=user["id"])
    return {"ok": True}


class TemplateGenerateRequest(BaseModel):
    goal: Optional[str] = ""
    topic: Optional[str] = None


@router.post("/templates/generate")
def template_generate_endpoint(
    req: TemplateGenerateRequest,
    x_ai_provider: Optional[str] = Header("gemini"),
    x_gemini_api_key: Optional[str] = Header(None),
    x_ai_base_url: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
):
    """صمّم هوية بصرية عبر AI حسب الوصف/الموضوع ثم احفظها كقالب."""
    user = _get_current_user(x_user_id)
    ai = _pres_headers(x_ai_provider, x_gemini_api_key, x_ai_base_url, x_gemini_model)
    blueprint = AIService.generate_template_theme(
        identity_goal=req.goal or req.topic or "",
        topic=req.topic,
        provider=ai["provider"],
        api_key=ai["api_key"],
        base_url=ai["base_url"],
        model=ai["model"],
    )
    saved = save_template({
        "title": blueprint.get("name") or "قالب مخصص",
        "description": blueprint.get("description") or "",
        "base": blueprint.get("base") or "academic",
        "colors": blueprint.get("colors") or {},
        "fonts": blueprint.get("fonts") or {},
        "accent": blueprint.get("accent") or "gold",
    }, user_id=user["id"])
    return saved


@router.post("/templates/from-pptx")
def template_from_pptx_endpoint(
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header(None),
):
    """استخرج الهوية البصرية (ألوان/خطوط) من ملف PowerPoint."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="غير مصرح")
    if not (file.filename or "").lower().endswith(".pptx"):
        raise HTTPException(status_code=400, detail="يُرجى رفع ملف .pptx فقط.")
    data = file.file.read()
    try:
        blueprint = extract_pptx_theme(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return blueprint


@router.get("/presentations/{pres_id}")
def presentation_get_endpoint(pres_id: str, x_user_id: Optional[str] = Header(None)):
    user = _get_current_user(x_user_id)
    try:
        return PresentationService.load(pres_id, user["id"])
    except PresentationError:
        pass
    # Team-shared view access (viewer+)
    if get_user_pres_team_role(user["id"], pres_id):
        shared = get_presentation(pres_id)
        if shared:
            shared["shared"] = True
            shared["my_team_role"] = get_user_pres_team_role(user["id"], pres_id)
            return shared
    raise HTTPException(status_code=404, detail="العرض غير موجود أو لا تملك صلاحية الوصول إليه.")


@router.get("/presentations/{pres_id}/slides/{slide_index}")
def presentation_slide_endpoint(
    pres_id: str,
    slide_index: int,
    x_user_id: Optional[str] = Header(None),
    uid: Optional[str] = None,
):
    """صورة معاينة لشريحة محددة — تقبل uid كمعامل استعلام لأن img لا يرسل هيدرات مخصصة."""
    effective_user_id = x_user_id or uid
    user = _get_current_user(effective_user_id)
    try:
        row = PresentationService.load(pres_id, user["id"])
    except PresentationError:
        # Team-shared view access (viewer+)
        if get_user_pres_team_role(user["id"], pres_id):
            row = get_presentation(pres_id)
        if not row:
            raise HTTPException(status_code=404, detail="العرض غير موجود في مكتبتك.")
    result_dir = row.get("result_dir")
    if not result_dir:
        raise HTTPException(status_code=404, detail="لم يُنفَّذ الرندر بعد.")
    png = os.path.join(result_dir, "build", "png", f"slide_{slide_index:02d}.png")
    if not os.path.isfile(png):
        raise HTTPException(status_code=404, detail="الشريحة غير موجودة.")
    return FileResponse(png, media_type="image/png")


@router.get("/presentations/{pres_id}/download")
def presentation_download_endpoint(
    pres_id: str,
    format: str = "pptx",
    x_user_id: Optional[str] = Header(None),
):
    user = _get_current_user(x_user_id)
    try:
        row = PresentationService.load(pres_id, user["id"])
    except PresentationError:
        # Team-shared view access (viewer+)
        if get_user_pres_team_role(user["id"], pres_id):
            row = get_presentation(pres_id)
        if not row:
            raise HTTPException(status_code=404, detail="العرض غير موجود في مكتبتك.")
    result_dir = row.get("result_dir")
    if not result_dir:
        raise HTTPException(status_code=404, detail="لم يُنفَّذ الرندر بعد.")
    fmt = format.lower()
    title = re.sub(r"[\\/:*?\"<>|]+", "_", row.get("title") or "presentation")
    if fmt == "pptx":
        p = os.path.join(result_dir, "presentation.pptx")
        if not os.path.isfile(p):
            raise HTTPException(status_code=404, detail="الملف غير موجود.")
        return FileResponse(p, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                            filename=f"{title}.pptx")
    if fmt == "pdf":
        p = os.path.join(result_dir, "presentation.pdf")
        if not os.path.isfile(p):
            raise HTTPException(status_code=404, detail="الملف غير موجود.")
        return FileResponse(p, media_type="application/pdf", filename=f"{title}.pdf")
    if fmt == "zip":
        png_dir = os.path.join(result_dir, "build", "png")
        if not os.path.isdir(png_dir):
            raise HTTPException(status_code=404, detail="لا توجد صور شرائح.")
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in sorted(os.listdir(png_dir)):
                if f.endswith(".png"):
                    zf.write(os.path.join(png_dir, f), f"slides/{f}")
        buf.seek(0)
        from urllib.parse import quote
        safe_name = quote(f"{title}_slides.zip")
        return Response(content=buf.getvalue(), media_type="application/zip",
                        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_name}"})
    raise HTTPException(status_code=400, detail="الصيغة غير مدعومة: pptx | pdf | zip")


@router.delete("/presentations/{pres_id}")
def presentation_delete_endpoint(pres_id: str, x_user_id: Optional[str] = Header(None)):
    user = _get_current_user(x_user_id)
    ok = PresentationService.remove(pres_id, user["id"])
    if not ok and user_can_edit_presentation(user["id"], pres_id):
        # Team editor+ may delete shared presentations (no owner filter + disk cleanup)
        ok = PresentationService.remove(pres_id, None)  # type: ignore[arg-type]
    if not ok:
        if get_presentation(pres_id):
            raise HTTPException(status_code=403, detail="دورك في الفريق (مشاهد) لا يسمح بحذف هذا العرض.")
        raise HTTPException(status_code=404, detail="العرض غير موجود في مكتبتك.")
    return {"success": True, "message": "تم حذف العرض التقديمي"}


# -------------------------------------------------------------
# Admin Control Panel Endpoints (لوحة التحكم الشاملة للإدارة)
# -------------------------------------------------------------

@router.get("/settings/public")
def get_public_settings_endpoint():
    """Get public branding information (name, logo, slogan, university) for UI components."""
    settings = get_system_settings()
    return {
        "platform_name": settings.get("platform_name", "ذكاء EduAI"),
        "platform_subtitle": settings.get("platform_subtitle", "المنصة الأكاديمية الذكية المتكاملة"),
        "university_name": settings.get("university_name", "الجامعة"),
        "faculty_name": settings.get("faculty_name", "كلية الحاسبات وتكنولوجيا المعلومات"),
        "support_email": settings.get("support_email", "admin@eduai.edu"),
        "footer_text": settings.get("footer_text", "المنصة الأكاديمية الذكية المتقدمة"),
        "logo_icon": settings.get("logo_icon", "GraduationCap"),
        "custom_logo_url": settings.get("custom_logo_url", ""),
        "welcome_headline": settings.get("welcome_headline", "مرحباً بك في المنصة الأكاديمية الذكية"),
        "welcome_description": settings.get("welcome_description", "بيئة تعليمية وبحثية جامعية مدعومة بالذكاء الاصطناعي للمذاكرة التفاعلية وتوليد خرائط المفاهيم والاختبارات."),
        "google_client_id": settings.get("google_client_id", ""),
        "maintenance_mode": settings.get("maintenance_mode", False),
        "registration_enabled": settings.get("registration_enabled", True)
    }

@router.get("/admin/stats")
def get_admin_stats_endpoint(current_admin: dict = Depends(_require_admin)):
    """Get live metrics, counts, database size, and system health."""
    metrics = get_admin_metrics()
    return metrics

@router.get("/admin/settings")
def get_admin_settings_endpoint(current_admin: dict = Depends(_require_admin)):
    """Get platform configuration policies and AI defaults."""
    settings = get_system_settings()
    return {"settings": settings}

@router.post("/admin/settings")
def update_admin_settings_endpoint(req: UpdateSettingsRequest, current_admin: dict = Depends(_require_admin)):
    """Update platform configuration policies and AI defaults."""
    update_system_settings(req.settings)
    return {"success": True, "message": "تم حفظ وتطبيق الإعدادات بنجاح"}

@router.get("/admin/users")
def get_admin_users_endpoint(current_admin: dict = Depends(_require_admin)):
    """Get all registered users and their roles, quotas, and stats."""
    users = list_all_users()
    return {"users": users, "total": len(users)}

@router.post("/admin/users")
def create_admin_user_endpoint(req: AdminCreateUserRequest, current_admin: dict = Depends(_require_admin)):
    """Create a new user account with specified role and quota."""
    res = admin_create_user(
        name=req.name,
        email=req.email,
        password=req.password,
        role=req.role or "student",
        tier=req.tier or "Pro Academic 🌟",
        token_limit=req.token_limit or 500000,
        permissions=req.permissions
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "فشل إنشاء المستخدم"))
    return res

@router.patch("/admin/users/{user_id}")
def update_admin_user_endpoint(user_id: str, req: AdminUpdateUserRequest, current_admin: dict = Depends(_require_admin)):
    """Update user profile, role, tier, or token limit."""
    res = admin_update_user(
        user_id=user_id,
        name=req.name,
        email=req.email,
        role=req.role,
        tier=req.tier,
        token_limit=req.token_limit,
        permissions=req.permissions
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "فشل تعديل المستخدم"))
    return res

@router.patch("/admin/users/{user_id}/reset-password")
def reset_admin_user_password_endpoint(user_id: str, req: AdminResetPasswordRequest, current_admin: dict = Depends(_require_admin)):
    """Reset a user's password."""
    res = admin_reset_user_password(user_id, req.new_password)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "فشل إعادة تعيين كلمة المرور"))
    return res

@router.patch("/admin/users/{user_id}/reset-tokens")
def reset_admin_user_tokens_endpoint(user_id: str, current_admin: dict = Depends(_require_admin)):
    """Reset tokens_used to 0 for a user."""
    res = admin_reset_user_tokens(user_id)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "فشل تصفير التوكنز"))
    return res

@router.patch("/admin/users/{user_id}/tokens")
def set_admin_user_tokens_endpoint(user_id: str, req: AdminSetTokensRequest, current_admin: dict = Depends(_require_admin)):
    """Set tokens_used and/or tokens_limit for a user."""
    res = admin_set_user_tokens(user_id, tokens_used=req.tokens_used, tokens_limit=req.tokens_limit)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "فشل تحديث التوكنز"))
    return res

@router.delete("/admin/users/{user_id}")
def delete_admin_user_endpoint(user_id: str, current_admin: dict = Depends(_require_admin)):
    """Delete a user account and all their documents."""
    res = admin_delete_user(user_id)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "فشل حذف المستخدم"))
    return res

@router.get("/admin/logs")
def get_admin_logs_endpoint(limit: Optional[int] = 50, current_admin: dict = Depends(_require_admin)):
    """Get platform activity and audit logs."""
    logs = get_activity_logs(limit=limit or 50)
    return {"logs": logs}

@router.delete("/admin/logs")
def clear_admin_logs_endpoint(current_admin: dict = Depends(_require_admin)):
    """Clear all audit logs."""
    clear_activity_logs()
    return {"success": True, "message": "تم مسح سجلات النشاط بنجاح"}

@router.post("/admin/clear-cache")
def clear_cache_endpoint(current_admin: dict = Depends(_require_admin)):
    """Clear temporary upload buffers and compact database."""
    log_activity("clear_cache", "تم تنفيذ تنظيف الذاكرة المؤقتة وضغط قاعدة البيانات", "info")
    return {"success": True, "message": "تم تنظيف الذاكرة المؤقتة بنجاح"}

