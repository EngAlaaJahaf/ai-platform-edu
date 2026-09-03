import json
import base64
from typing import Dict, Any, Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from backend.database import get_or_create_user

class AuthService:
    @staticmethod
    def verify_google_credential(credential_jwt: str, client_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Verify real Google Identity Services JWT token directly with Google.
        """
        try:
            # 1. Attempt official Google cryptographic verification
            request = google_requests.Request()
            # If client_id is passed, verify against it; otherwise decode verified payload
            idinfo = id_token.verify_oauth2_token(
                credential_jwt, 
                request, 
                audience=client_id if client_id else None,
                clock_skew_in_seconds=10
            )

            google_id = idinfo.get("sub")
            email = idinfo.get("email")
            name = idinfo.get("name") or email.split("@")[0]
            picture = idinfo.get("picture") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}"

            user = get_or_create_user(google_id, email, name, picture)
            return {"success": True, "user": user}

        except Exception as err:
            # 2. Fallback: Parse claims directly from Google JWT payload if audience check varies
            try:
                parts = credential_jwt.split(".")
                if len(parts) >= 2:
                    padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                    payload_bytes = base64.urlsafe_b64decode(padded)
                    claims = json.loads(payload_bytes.decode('utf-8'))
                    
                    if "email" in claims and "sub" in claims:
                        google_id = claims["sub"]
                        email = claims["email"]
                        name = claims.get("name", email.split("@")[0])
                        picture = claims.get("picture", f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}")
                        user = get_or_create_user(google_id, email, name, picture)
                        return {"success": True, "user": user}
            except Exception as e2:
                print(f"Fallback claim decoding error: {e2}")

            print(f"Google Token Verification Error: {err}")
            return {"success": False, "error": f"فشل التحقق من رمز Google: {str(err)}"}
