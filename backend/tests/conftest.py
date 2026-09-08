import os
import sys
import uuid
from pathlib import Path

import pytest

project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

os.environ.setdefault("GEMINI_API_KEY", "")
os.environ.setdefault("GEMINI_MODEL", "gemini-1.5-flash")
os.environ.setdefault("PORT", "8001")
os.environ.setdefault("ADMIN_MASTER_KEY", "test_admin_key_for_testing_only")
os.environ.setdefault("ADMIN_INITIAL_PASSWORD", "TestAdminPass123!")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    import backend.database as db_module
    from backend.database import DB_PATH, init_db

    test_db = DB_PATH.parent / "test_eduai.db"
    original_db_path = db_module.DB_PATH
    db_module.DB_PATH = test_db

    if test_db.exists():
        test_db.unlink()

    init_db()

    yield

    db_module.DB_PATH = original_db_path
    if test_db.exists():
        test_db.unlink()


@pytest.fixture
def client():
    from backend.main import app
    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user():
    from backend.database import register_user
    uid = str(uuid.uuid4())[:8]
    result = register_user(
        name=f"Test Student {uid}",
        email=f"test_{uid}@example.com",
        password="TestPass123!",
        role="student"
    )
    user_id = result["user"]["id"]
    return {"user_id": user_id, **result}


@pytest.fixture
def test_admin():
    from backend.database import register_user
    uid = str(uuid.uuid4())[:8]
    result = register_user(
        name=f"Test Admin {uid}",
        email=f"admin_{uid}@example.com",
        password="AdminPass123!",
        role="admin"
    )
    user_id = result["user"]["id"]
    return {"user_id": user_id, **result}


@pytest.fixture
def auth_headers(test_user):
    return {"X-User-Id": str(test_user["user_id"])}


@pytest.fixture
def admin_headers(test_admin):
    return {"X-User-Id": str(test_admin["user_id"])}
