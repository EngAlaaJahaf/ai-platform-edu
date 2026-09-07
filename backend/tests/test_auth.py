

class TestHealthCheck:
    def test_health_endpoint(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "provider" in data


class TestPublicSettings:
    def test_get_public_settings(self, client):
        response = client.get("/api/settings/public")
        assert response.status_code == 200
        data = response.json()
        assert "platform_name" in data
        assert "registration_enabled" in data


class TestRegister:
    def test_register_success(self, client):
        response = client.post("/api/auth/register", json={
            "name": "New User",
            "email": "newuser_register@test.com",
            "password": "StrongPass123!",
            "role": "student"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True

    def test_register_duplicate_email(self, client, test_user):
        response = client.post("/api/auth/register", json={
            "name": "Duplicate",
            "email": test_user["user"]["email"],
            "password": "Pass123!",
            "role": "student"
        })
        assert response.status_code in (200, 400)

    def test_register_missing_fields(self, client):
        response = client.post("/api/auth/register", json={
            "name": "Incomplete"
        })
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client, test_user):
        response = client.post("/api/auth/login", json={
            "email": test_user["user"]["email"],
            "password": "TestPass123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True

    def test_login_wrong_password(self, client, test_user):
        response = client.post("/api/auth/login", json={
            "email": "test_student@example.com",
            "password": "WrongPassword!"
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "Pass123!"
        })
        assert response.status_code == 401


class TestStudentLogin:
    def test_student_login_success(self, client):
        response = client.post("/api/auth/student-login", json={
            "email": "quick_student@test.com",
            "name": "Quick Student"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "user" in data

    def test_student_login_auto_create(self, client):
        response = client.post("/api/auth/student-login", json={
            "email": "auto_created@test.com"
        })
        assert response.status_code == 200


class TestUserProfile:
    def test_get_profile_success(self, client, auth_headers):
        response = client.get("/api/user/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "password_hash" not in data.get("user", {})

    def test_get_profile_no_auth(self, client):
        response = client.get("/api/user/me")
        assert response.status_code == 401

    def test_get_profile_invalid_user(self, client):
        response = client.get("/api/user/me", headers={"X-User-Id": "nonexistent_id_12345"})
        assert response.status_code == 404


class TestDocuments:
    def test_list_documents_empty(self, client, auth_headers):
        response = client.get("/api/documents", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert "total" in data

    def test_get_document_not_found(self, client, auth_headers):
        response = client.get("/api/documents/nonexistent123", headers=auth_headers)
        assert response.status_code == 404

    def test_update_document_not_found(self, client, auth_headers):
        response = client.patch(
            "/api/documents/nonexistent123",
            headers=auth_headers,
            json={"title": "New Title"}
        )
        assert response.status_code == 404

    def test_delete_document_not_found(self, client, auth_headers):
        response = client.delete("/api/documents/nonexistent123", headers=auth_headers)
        assert response.status_code == 404


class TestLatestDocument:
    def test_get_latest_no_documents(self, client, auth_headers):
        response = client.get("/api/documents/latest", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("document") is None


class TestPrompts:
    def test_list_prompts(self, client):
        response = client.get("/api/prompts")
        assert response.status_code == 200
        data = response.json()
        assert "prompts" in data

    def test_create_prompt(self, client):
        response = client.post("/api/prompts", json={
            "category": "test",
            "title": "Test Prompt",
            "description": "A test prompt",
            "system_prompt": "You are a test assistant"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "prompt" in data


class TestAdminEndpointProtection:
    def test_admin_stats_requires_admin(self, client, auth_headers):
        response = client.get("/api/admin/stats", headers=auth_headers)
        assert response.status_code == 403

    def test_admin_users_requires_admin(self, client, auth_headers):
        response = client.get("/api/admin/users", headers=auth_headers)
        assert response.status_code == 403

    def test_admin_settings_requires_admin(self, client, auth_headers):
        response = client.get("/api/admin/settings", headers=auth_headers)
        assert response.status_code == 403

    def test_admin_logs_requires_admin(self, client, auth_headers):
        response = client.get("/api/admin/logs", headers=auth_headers)
        assert response.status_code == 403

    def test_admin_no_auth(self, client):
        response = client.get("/api/admin/stats")
        assert response.status_code == 401


class TestTemplates:
    def test_list_templates_no_auth(self, client):
        response = client.get("/api/templates")
        assert response.status_code == 401

    def test_list_templates_with_auth(self, client, auth_headers):
        response = client.get("/api/templates", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data


class TestPresentations:
    def test_list_presentations_no_auth(self, client):
        response = client.get("/api/presentations")
        assert response.status_code == 401

    def test_list_presentations_with_auth(self, client, auth_headers):
        response = client.get("/api/presentations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "presentations" in data
        assert "total" in data
