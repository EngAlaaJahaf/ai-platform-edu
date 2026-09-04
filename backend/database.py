import sqlite3
import json
import uuid
import os
import hashlib
import secrets
import hmac
import re
from pathlib import Path
from typing import Dict, Any, Optional, List

DB_PATH = Path(__file__).resolve().parent / "eduai.db"

# --- Password hashing (pbkdf2_sha256, stdlib only, no extra deps) ---
def _hash_password(password: str) -> str:
    if not password:
        return ""
    salt = secrets.token_hex(16)
    iterations = 150000
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${dk.hex()}"

def _verify_password(password: str, stored: str) -> bool:
    if not stored:
        return not password
    # Legacy plaintext support - will be upgraded on next successful login
    if not stored.startswith("pbkdf2_sha256$"):
        return hmac.compare_digest(password, stored)
    try:
        _, iter_s, salt, hash_hex = stored.split("$", 3)
        iterations = int(iter_s)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False

def _needs_rehash(stored: str) -> bool:
    return not stored.startswith("pbkdf2_sha256$")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        api_key TEXT DEFAULT '',
        provider TEXT DEFAULT 'gemini',
        base_url TEXT DEFAULT '',
        preferred_model TEXT DEFAULT 'gemini-1.5-flash',
        subscription_tier TEXT DEFAULT 'Pro Academic 🌟',
        tokens_used INTEGER DEFAULT 0,
        tokens_limit INTEGER DEFAULT 500000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        pages_count INTEGER NOT NULL,
        words_count INTEGER NOT NULL,
        full_text TEXT NOT NULL,
        chunks_json TEXT NOT NULL,
        summary_json TEXT,
        quiz_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # Try to add new columns to existing documents table (ignore errors if they exist)
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN summary_json TEXT;")
    except sqlite3.OperationalError:
        pass
        
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN quiz_progress_json TEXT;")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN quiz_json TEXT;")
    except sqlite3.OperationalError:
        pass
    
    # Prompts Bank table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'system',
        category TEXT NOT NULL, -- 'quiz', 'summary', 'chat', 'proofread'
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        system_prompt TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Seed default bilingual exam prompt
    bilingual_quiz_prompt = (
        "أنت أستاذ جامعي وخبير معتمد في إعداد امتحانات MCQ ثنائية اللغة (Bilingual English/Arabic) متوافقة مع تطبيقات الامتحانات. "
        "استناداً إلى النص المرفق حصراً، أنشئ أسئلة اختيار من متعدد (A, B, C, D) مع الترجمة العربية الموازية، وتحديد الحرف الصحيح (A, B, C, D)، والشرح العلمي باللغتين (EXPLANATION_EN و EXPLANATION_AR)."
    )

    cursor.execute("UPDATE prompts SET system_prompt = ? WHERE id = 'p_quiz_mcq_standard'", (bilingual_quiz_prompt,))
    
    # System Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Activity Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        level TEXT DEFAULT 'info', -- 'info', 'warn', 'error', 'success'
        doc_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Safe Schema Migrations for users table (role & password_hash)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';")
    except sqlite3.OperationalError:
        pass # Column already exists

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT '';")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN permissions_json TEXT DEFAULT '{}';")
    except sqlite3.OperationalError:
        pass

    # Ensure Default System Admin exists (password from env, hashed)
    cursor.execute("SELECT * FROM users WHERE email = 'admin@eduai.edu' OR role = 'admin'")
    admin_exists = cursor.fetchone()
    if not admin_exists:
        # Use env ADMIN_INITIAL_PASSWORD if set, else generate secure random and log
        initial_admin_pass = os.getenv("ADMIN_INITIAL_PASSWORD", "AdminEduAI2026!")
        hashed = _hash_password(initial_admin_pass)
        cursor.execute("""
            INSERT OR REPLACE INTO users (id, google_id, email, name, picture, role, subscription_tier, password_hash)
            VALUES ('usr_admin_001', 'admin_sys_id', 'admin@eduai.edu', 'مدير النظام (Super Admin)', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin', 'admin', 'Enterprise Master 👑', ?)
        """, (hashed,))
    else:
        # Migrate legacy plaintext admin password to hash if needed
        try:
            row = admin_exists
            ph = row["password_hash"] if isinstance(row, dict) or hasattr(row, "keys") else None
            # sqlite3.Row access
            if admin_exists and _needs_rehash(admin_exists["password_hash"] or ""):
                new_hash = _hash_password(admin_exists["password_hash"] or "AdminEduAI2026!")
                cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, admin_exists["id"]))
        except Exception:
            pass

    conn.commit()
    conn.close()

# Database Functions
def get_or_create_user(google_id: str, email: str, name: str, picture: str, role: str = 'student') -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE google_id = ? OR email = ?", (google_id, email))
    user = cursor.fetchone()
    
    # Auto-grant admin role if email matches admin pattern or already admin
    user_role = role
    if email in ['admin@eduai.edu', 'superadmin@eduai.edu'] or (user and user.get('role') == 'admin'):
        user_role = 'admin'

    if user:
        cursor.execute("UPDATE users SET name = ?, picture = ?, role = COALESCE(?, role) WHERE id = ?", (name, picture, user_role, user["id"]))
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user["id"],))
        user = cursor.fetchone()
    else:
        user_id = f"usr_{google_id[:12]}"
        cursor.execute("""
            INSERT INTO users (id, google_id, email, name, picture, role, subscription_tier)
            VALUES (?, ?, ?, ?, ?, ?, 'Pro Academic 🌟')
        """, (user_id, google_id, email, name, picture, user_role))
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
    user_dict = dict(user)
    conn.close()
    return user_dict

def authenticate_admin(admin_key: str) -> Dict[str, Any]:
    """
    Authenticate administrator using Master Key (env) or Admin Password (hashed).
    """
    cleaned_key = admin_key.strip()
    # Master key from env - لا يوجد قيم افتراضية ضعيفة
    env_master = os.getenv("ADMIN_MASTER_KEY", "").strip()
    valid_env_keys = [k for k in [env_master] if k]
    # Legacy support only if env not set: allow sk_admin_ prefix but not weak defaults
    if valid_env_keys and cleaned_key in valid_env_keys:
        admin_user = get_or_create_user(
            google_id="admin_master_sys",
            email="admin@eduai.edu",
            name="مدير النظام (Super Admin)",
            picture="https://api.dicebear.com/7.x/bottts/svg?seed=admin_eduai",
            role="admin"
        )
        return {"success": True, "user": admin_user, "message": "تم تفعيل وضع المدير بنجاح 👑"}
    if not valid_env_keys and cleaned_key.startswith('sk_admin_') and len(cleaned_key) > 20:
        admin_user = get_or_create_user(
            google_id="admin_master_sys",
            email="admin@eduai.edu",
            name="مدير النظام (Super Admin)",
            picture="https://api.dicebear.com/7.x/bottts/svg?seed=admin_eduai",
            role="admin"
        )
        return {"success": True, "user": admin_user, "message": "تم تفعيل وضع المدير بنجاح 👑"}
    
    # Check against database password_hash (hashed comparison)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE role = 'admin' OR email = 'admin@eduai.edu'")
    rows = cursor.fetchall()
    for r in rows:
        stored = r["password_hash"] or ""
        if _verify_password(cleaned_key, stored):
            # Upgrade legacy hash if needed
            if _needs_rehash(stored):
                try:
                    new_hash = _hash_password(cleaned_key)
                    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, r["id"]))
                    conn.commit()
                except Exception:
                    pass
            conn.close()
            return {"success": True, "user": dict(r), "message": "تم تسجيل دخول المشرف بنجاح 👑"}
    conn.close()

    return {"success": False, "error": "رمز التحقق أو كلمة مرور المدير غير صحيحة"}

def register_user(name: str, email: str, password: str, role: str = 'student') -> Dict[str, Any]:
    """
    Register a new user in the SQLite database.
    """
    clean_email = email.strip().lower()
    clean_name = name.strip()
    
    if not clean_email or not clean_name:
        return {"success": False, "error": "الرجاء إدخال الاسم والبريد الإلكتروني"}
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (clean_email,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {"success": False, "error": "هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول"}

    user_id = f"usr_{uuid.uuid4().hex[:10]}" if 'uuid' in globals() else f"usr_{clean_email.replace('@', '_').replace('.', '_')[:12]}"
    user_role = 'admin' if clean_email in ['admin@eduai.edu', 'superadmin@eduai.edu'] else role
    picture = f"https://api.dicebear.com/7.x/avataaars/svg?seed={clean_email}"

    hashed_pw = _hash_password(password)
    cursor.execute("""
        INSERT INTO users (id, google_id, email, name, picture, role, password_hash, subscription_tier)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pro Academic 🌟')
    """, (user_id, f"local_{user_id}", clean_email, clean_name, picture, user_role, hashed_pw))
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    new_user = cursor.fetchone()
    conn.close()
    
    log_activity("register_user", f"تسجيل مستخدم جديد: {clean_name} ({clean_email})", "success")
    return {"success": True, "user": dict(new_user)}

def login_user(email_or_username: str, password: str) -> Dict[str, Any]:
    """
    Login user via email and password.
    """
    clean_input = email_or_username.strip().lower()
    
    # Check Admin Quick Access via env master key only
    env_master = os.getenv("ADMIN_MASTER_KEY", "").strip()
    if clean_input in ['admin', 'admin@eduai.edu'] and env_master and password.strip() == env_master:
        return authenticate_admin(password.strip())
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? OR id = ?", (clean_input, clean_input))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return {"success": False, "error": "الحساب غير موجود، يرجى إنشاء حساب جديد"}
        
    user_dict = dict(user)
    saved_pass = user_dict.get("password_hash", "")
    
    if saved_pass and not _verify_password(password, saved_pass):
        conn.close()
        return {"success": False, "error": "كلمة المرور غير صحيحة"}
    # Auto-migrate legacy plaintext to hash
    if saved_pass and _needs_rehash(saved_pass):
        try:
            new_hash = _hash_password(password)
            cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_dict["id"]))
            conn.commit()
        except Exception:
            pass
    conn.close()
        
    log_activity("login_user", f"تسجيل دخول: {user_dict.get('name')} ({user_dict.get('email')})", "info")
    return {"success": True, "user": user_dict}

def list_all_users() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, google_id, email, name, picture, role, subscription_tier, tokens_used, tokens_limit, created_at, permissions_json FROM users ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    if not user_id:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def increment_user_tokens(user_id: Optional[str], delta: int):
    if not user_id or not delta or delta <= 0:
        return
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE users SET tokens_used = COALESCE(tokens_used,0) + ? WHERE id = ?", (int(delta), user_id))
        conn.commit()
        conn.close()
    except Exception:
        pass

def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    # تقريب: كل 4 أحرف ≈ توكن واحد (عربي/إنجليزي)
    return max(1, len(text) // 4)

def admin_create_user(name: str, email: str, password: str, role: str = 'student', tier: str = 'Pro Academic 🌟', token_limit: int = 500000, permissions: Dict[str, Any] = None) -> Dict[str, Any]:
    clean_email = email.strip().lower()
    clean_name = name.strip()
    permissions_json = json.dumps(permissions or {}, ensure_ascii=False)
    
    if not clean_email or not clean_name:
        return {"success": False, "error": "الرجاء إدخال الاسم والبريد الإلكتروني"}
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (clean_email,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {"success": False, "error": "هذا البريد الإلكتروني مسجل مسبقاً"}

    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    picture = f"https://api.dicebear.com/7.x/avataaars/svg?seed={clean_email}"

    hashed_pw = _hash_password(password)
    cursor.execute("""
        INSERT INTO users (id, google_id, email, name, picture, role, password_hash, subscription_tier, tokens_limit, permissions_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, f"local_{user_id}", clean_email, clean_name, picture, role, hashed_pw, tier, token_limit, permissions_json))
    conn.commit()
    cursor.execute("SELECT id, email, name, role FROM users WHERE id = ?", (user_id,))
    new_user = cursor.fetchone()
    conn.close()
    
    log_activity("admin_create_user", f"إنشاء مستخدم جديد من الإدارة: {clean_name} ({clean_email})", "success")
    return {"success": True, "user": dict(new_user)}

def admin_update_user(user_id: str, name: str, email: str, role: str, tier: str, token_limit: int, permissions: Dict[str, Any] = None) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ? AND id != ?", (email.strip().lower(), user_id))
    if cursor.fetchone():
        conn.close()
        return {"success": False, "error": "البريد الإلكتروني مستخدم لحساب آخر"}
        
    # Get existing permissions if new ones are not provided
    if permissions is not None:
        permissions_json = json.dumps(permissions, ensure_ascii=False)
        cursor.execute("""
            UPDATE users 
            SET name = ?, email = ?, role = ?, subscription_tier = ?, tokens_limit = ?, permissions_json = ?
            WHERE id = ?
        """, (name.strip(), email.strip().lower(), role, tier, token_limit, permissions_json, user_id))
    else:
        cursor.execute("""
            UPDATE users 
            SET name = ?, email = ?, role = ?, subscription_tier = ?, tokens_limit = ?
            WHERE id = ?
        """, (name.strip(), email.strip().lower(), role, tier, token_limit, user_id))
    
    if cursor.rowcount == 0:
        conn.close()
        return {"success": False, "error": "المستخدم غير موجود"}
        
    conn.commit()
    conn.close()
    
    log_activity("admin_update_user", f"تعديل بيانات المستخدم: {name}", "info")
    return {"success": True, "message": "تم تعديل المستخدم بنجاح"}

def admin_reset_user_password(user_id: str, new_password: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    hashed = _hash_password(new_password)
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed, user_id))
    
    if cursor.rowcount == 0:
        conn.close()
        return {"success": False, "error": "المستخدم غير موجود"}
        
    conn.commit()
    conn.close()
    
    log_activity("admin_reset_password", f"إعادة تعيين كلمة مرور للمستخدم: {user_id}", "warn")
    return {"success": True, "message": "تم إعادة تعيين كلمة المرور بنجاح"}

def admin_reset_user_tokens(user_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET tokens_used = 0 WHERE id = ?", (user_id,))
    if cursor.rowcount == 0:
        conn.close()
        return {"success": False, "error": "المستخدم غير موجود"}
    conn.commit()
    conn.close()
    log_activity("admin_reset_tokens", f"تصفير استهلاك التوكنز للمستخدم: {user_id}", "warn")
    return {"success": True, "message": "تم تصفير الاستهلاك بنجاح"}

def admin_set_user_tokens(user_id: str, tokens_used: Optional[int] = None, tokens_limit: Optional[int] = None) -> Dict[str, Any]:
    if tokens_used is None and tokens_limit is None:
        return {"success": False, "error": "لا يوجد ما يتم تحديثه"}
    conn = get_db_connection()
    cursor = conn.cursor()
    if tokens_used is not None and tokens_limit is not None:
        cursor.execute("UPDATE users SET tokens_used = ?, tokens_limit = ? WHERE id = ?", (int(tokens_used), int(tokens_limit), user_id))
    elif tokens_used is not None:
        cursor.execute("UPDATE users SET tokens_used = ? WHERE id = ?", (int(tokens_used), user_id))
    else:
        cursor.execute("UPDATE users SET tokens_limit = ? WHERE id = ?", (int(tokens_limit), user_id))
    if cursor.rowcount == 0:
        conn.close()
        return {"success": False, "error": "المستخدم غير موجود"}
    conn.commit()
    conn.close()
    log_activity("admin_set_tokens", f"تعديل التوكنز للمستخدم {user_id}: used={tokens_used} limit={tokens_limit}", "info")
    return {"success": True, "message": "تم تحديث التوكنز بنجاح"}

def admin_delete_user(user_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT file_path FROM documents WHERE user_id = ?", (user_id,))
    docs = cursor.fetchall()
    for doc in docs:
        file_path = doc["file_path"]
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
            
    cursor.execute("DELETE FROM documents WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        return {"success": False, "error": "المستخدم غير موجود"}
        
    conn.commit()
    conn.close()
    
    log_activity("admin_delete_user", f"تم حذف المستخدم: {user_id}", "error")
    return {"success": True, "message": "تم حذف المستخدم وجميع ملفاته بنجاح"}

def save_document(doc_id: str, filename: str, file_path: str, pages_count: int, words_count: int, full_text: str, chunks: List[Dict[str, Any]], user_id: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO documents (id, user_id, filename, file_path, pages_count, words_count, full_text, chunks_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (doc_id, user_id, filename, file_path, pages_count, words_count, full_text, json.dumps(chunks, ensure_ascii=False)))
    conn.commit()
    conn.close()
    log_activity("upload_document", f"تم رفع وفهرسة المستند: {filename} ({pages_count} صفحة، {words_count} كلمة)", "success", doc_id)

def get_document(doc_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM documents WHERE id = ? AND (user_id = ? OR user_id IS NULL OR user_id = '')", (doc_id, user_id))
    else:
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["doc_id"] = d["id"]
    d["chunks"] = json.loads(d["chunks_json"]) if d.get("chunks_json") else []
    try:
        d["summary_data"] = json.loads(d["summary_json"]) if d.get("summary_json") else None
    except Exception:
        d["summary_data"] = None
    try:
        d["quiz_data"] = json.loads(d["quiz_json"]) if d.get("quiz_json") else None
    except Exception:
        d["quiz_data"] = None
    return d

def list_all_documents(user_id: Optional[str] = None, limit: int = 50, offset: int = 0, search: Optional[str] = None) -> List[Dict[str, Any]]:
    # Clamp pagination
    limit = max(1, min(100, int(limit) if limit else 50))
    offset = max(0, int(offset) if offset else 0)
    conn = get_db_connection()
    cursor = conn.cursor()
    # Build dynamic WHERE
    where_clauses = []
    params: List[Any] = []
    if user_id:
        where_clauses.append("user_id = ?")
        params.append(user_id)
    if search:
        where_clauses.append("(filename LIKE ? OR substr(full_text,1,1000) LIKE ?)")
        like = f"%{search}%"
        params.extend([like, like])
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    # Add pagination params at end
    params.extend([limit, offset])
    query = f"""
            SELECT id, user_id, filename, file_path, pages_count, words_count, 
                   substr(full_text, 1, 300) as preview_text,
                   created_at, length(chunks_json) as chunks_size,
                   summary_json, quiz_json
            FROM documents 
            {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    docs = []
    for r in rows:
        d = dict(r)
        d["doc_id"] = d["id"]
        try:
            d["summary_data"] = json.loads(d["summary_json"]) if d.get("summary_json") else None
        except Exception:
            d["summary_data"] = None
        try:
            d["quiz_data"] = json.loads(d["quiz_json"]) if d.get("quiz_json") else None
        except Exception:
            d["quiz_data"] = None
        docs.append(d)
    return docs

def count_documents(user_id: Optional[str] = None, search: Optional[str] = None) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    where_clauses = []
    params: List[Any] = []
    if user_id:
        where_clauses.append("user_id = ?")
        params.append(user_id)
    if search:
        where_clauses.append("(filename LIKE ? OR substr(full_text,1,1000) LIKE ?)")
        like = f"%{search}%"
        params.extend([like, like])
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    cursor.execute(f"SELECT COUNT(*) FROM documents {where_sql}", tuple(params))
    total = cursor.fetchone()[0] or 0
    conn.close()
    return total

def get_latest_document(user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", (user_id,))
    else:
        cursor.execute("SELECT * FROM documents ORDER BY created_at DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["doc_id"] = d["id"]
    d["chunks"] = json.loads(d["chunks_json"]) if d.get("chunks_json") else []
    try:
        d["summary_data"] = json.loads(d["summary_json"]) if d.get("summary_json") else None
    except Exception:
        d["summary_data"] = None
    try:
        d["quiz_data"] = json.loads(d["quiz_json"]) if d.get("quiz_json") else None
    except Exception:
        d["quiz_data"] = None
    return d

def update_document_title(doc_id: str, new_title: str, user_id: Optional[str] = None) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("UPDATE documents SET filename = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)", (new_title, doc_id, user_id))
    else:
        cursor.execute("UPDATE documents SET filename = ? WHERE id = ?", (new_title, doc_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    if affected > 0:
        log_activity("rename_document", f"تم تعديل اسم المستند إلى: {new_title}", "info", doc_id)
    return affected > 0

def save_document_summary(doc_id: str, summary_data: dict) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    summary_json = json.dumps(summary_data, ensure_ascii=False)
    cursor.execute("UPDATE documents SET summary_json = ? WHERE id = ?", (summary_json, doc_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def save_document_quiz(doc_id: str, quiz_data: dict) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    quiz_json = json.dumps(quiz_data, ensure_ascii=False)
    cursor.execute("UPDATE documents SET quiz_json = ? WHERE id = ?", (quiz_json, doc_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def save_document_progress(doc_id: str, progress_json: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE documents SET quiz_progress_json = ? WHERE id = ?", (progress_json, doc_id))
    conn.commit()
    conn.close()

def delete_document(doc_id: str, user_id: Optional[str] = None) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT filename, file_path FROM documents WHERE id = ? AND (user_id = ? OR user_id IS NULL)", (doc_id, user_id))
    else:
        cursor.execute("SELECT filename, file_path FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
    filename = row["filename"]
    file_path = row["file_path"]
    
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()
    
    # Try deleting physical file if exists
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass
        
    log_activity("delete_document", f"تم حذف المستند: {filename}", "warn", doc_id)
    return True

def list_prompts(category: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if category:
        cursor.execute("SELECT * FROM prompts WHERE category = ? ORDER BY is_default DESC, created_at DESC", (category,))
    else:
        cursor.execute("SELECT * FROM prompts ORDER BY category, is_default DESC, created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_prompt(prompt_id: str, category: str, title: str, description: str, system_prompt: str, user_id: str = "custom") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO prompts (id, user_id, category, title, description, system_prompt, is_default)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    """, (prompt_id, user_id, category, title, description, system_prompt))
    conn.commit()
    cursor.execute("SELECT * FROM prompts WHERE id = ?", (prompt_id,))
    row = cursor.fetchone()
    conn.close()
    log_activity("save_prompt", f"تم حفظ قالب التوجيه: {title} ({category})", "info")
    return dict(row)

def delete_prompt(prompt_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM prompts WHERE id = ? AND is_default = 0", (prompt_id,))
    conn.commit()
    conn.close()
    log_activity("delete_prompt", f"تم حذف قالب التوجيه {prompt_id}", "warn")

# -------------------------------------------------------------
# System Settings & Activity Logs
# -------------------------------------------------------------

def _sanitize_log(details: str) -> str:
    if not details:
        return details
    try:
        # Redact common secrets
        details = re.sub(r'sk-[a-zA-Z0-9_\-]{8,}', 'sk-***', details)
        details = re.sub(r'AIza[0-9A-Za-z_\-]{20,}', 'AIza***', details)
        details = re.sub(r'Bearer\s+[a-zA-Z0-9_\-\.]+', 'Bearer ***', details, flags=re.I)
        details = re.sub(r'(api_key|apikey|password|passwd|secret|token)["\']?\s*[:=]\s*["\']?[^"\'\s,;]+', r'\1=***', details, flags=re.I)
        # Truncate very long details
        if len(details) > 800:
            details = details[:800] + " ...[truncated]"
        return details
    except Exception:
        return details

def log_activity(action: str, details: str, level: str = "info", doc_id: Optional[str] = None):
    try:
        details = _sanitize_log(details)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO activity_logs (action, details, level, doc_id)
            VALUES (?, ?, ?, ?)
        """, (action, details, level, doc_id))
        conn.commit()
        conn.close()
    except Exception:
        pass

def get_activity_logs(limit: int = 40) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def clear_activity_logs() -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM activity_logs")
    conn.commit()
    conn.close()
    log_activity("clear_logs", "تم مسح جميع السجلات من قبل الإدارة", "warn")

def get_system_settings() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value_json FROM system_settings")
    rows = cursor.fetchall()
    conn.close()
    
    settings = {
        "platform_name": "ذكاء EduAI",
        "platform_subtitle": "المنصة الأكاديمية الذكية المتكاملة",
        "university_name": "الجامعة",
        "faculty_name": "كلية الحاسبات وتكنولوجيا المعلومات",
        "support_email": "admin@eduai.edu",
        "footer_text": "المنصة الأكاديمية الذكية المتقدمة",
        "logo_icon": "GraduationCap",
        "custom_logo_url": "",
        "welcome_headline": "مرحباً بك في المنصة الأكاديمية الذكية",
        "welcome_description": "بيئة تعليمية وبحثية جامعية مدعومة بالذكاء الاصطناعي للمذاكرة التفاعلية وتوليد خرائط المفاهيم والاختبارات.",
        "default_provider": "gemini",
        "default_model": "gemini-1.5-flash",
        "temperature": 0.3,
        "max_upload_size_mb": 50,
        "allowed_formats": [".pdf", ".docx", ".pptx", ".txt", ".md", ".xlsx", ".csv"],
        "enable_quiz": True,
        "enable_summary": True,
        "enable_proofread": True,
        "enable_chat": True,
        "enable_translate": True,
        "maintenance_mode": False,
        "registration_enabled": True,
        "default_student_token_limit": 500000,
        "default_subscription_tier": "Pro Academic 🌟",
        "auto_rag_chunks": 4,
        "system_notice": "المنصة تعمل بأعلى كفاءة لخدمة الطلاب والباحثين والأكاديميين.",
        "google_client_id": "",
        "enable_base_rules": True
    }
    
    for r in rows:
        try:
            settings[r["key"]] = json.loads(r["value_json"])
        except Exception:
            settings[r["key"]] = r["value_json"]
            
    return settings

def update_system_settings(new_settings: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    for key, val in new_settings.items():
        val_json = json.dumps(val, ensure_ascii=False)
        cursor.execute("""
            INSERT OR REPLACE INTO system_settings (key, value_json)
            VALUES (?, ?)
        """, (key, val_json))
    conn.commit()
    conn.close()
    log_activity("update_settings", "تم تعديل وحفظ إعدادات الهوية والسياسات الخاصة بالمنصة بنجاح ⚙️", "success")

def get_admin_metrics() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*), SUM(pages_count), SUM(words_count) FROM documents")
    doc_stats = cursor.fetchone()
    total_docs = doc_stats[0] or 0
    total_pages = doc_stats[1] or 0
    total_words = doc_stats[2] or 0
    
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM prompts")
    total_prompts = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM activity_logs")
    total_activities = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT SUM(tokens_used) FROM users")
    total_tokens = cursor.fetchone()[0] or 0
    
    # DB File Size
    db_size_kb = round(DB_PATH.stat().st_size / 1024, 1) if DB_PATH.exists() else 0
    
    conn.close()
    
    return {
        "total_documents": total_docs,
        "total_pages": total_pages,
        "total_words": total_words,
        "total_users": total_users,
        "total_tokens": total_tokens,
        "total_prompts": total_prompts,
        "total_activities": total_activities,
        "database_size_kb": db_size_kb,
        "server_status": "healthy",
        "system_version": "2.4.0 (Enterprise Academic)"
    }

# Initialize database
init_db()
