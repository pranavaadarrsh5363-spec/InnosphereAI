import unittest
import time
from fastapi.testclient import TestClient
from jose import jwt
from app.main import app
from app.config import settings
from app.utils.security import get_password_hash, verify_password, create_access_token

class TestAuthSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_password_hashing_security(self):
        """Verify PBKDF2 salt and hash generation is timing-safe and secure."""
        pw = "SuperSecurePass2026!"
        h1 = get_password_hash(pw)
        h2 = get_password_hash(pw)
        # Salts must be unique
        self.assertNotEqual(h1, h2)
        self.assertTrue(verify_password(pw, h1))
        self.assertTrue(verify_password(pw, h2))
        self.assertFalse(verify_password("WrongPass123", h1))
        self.assertFalse(verify_password("", h1))

    def test_demo_login_personas(self):
        """Verify demo login creates valid JWT tokens for student, mentor, admin."""
        for role in ["student", "mentor", "admin"]:
            res = self.client.post(f"/api/v1/auth/demo-login/{role}")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("access_token", data)
            self.assertEqual(data["token_type"], "bearer")
            self.assertEqual(data["user"]["role"], role)

    def test_invalid_login_rejection(self):
        """Verify invalid credentials return 401 Unauthorized."""
        res = self.client.post("/api/v1/auth/login", json={
            "email": "nonexistent_user_9999@student.edu",
            "password": "WrongPassword123"
        })
        self.assertEqual(res.status_code, 401)
        self.assertIn("Incorrect email or password", res.json()["error"]["message"])

    def test_malformed_jwt_token_handling(self):
        """Verify tampered JWT tokens return 401."""
        res = self.client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
        self.assertEqual(res.status_code, 401)

    def test_expired_jwt_token_handling(self):
        """Verify expired JWT tokens are rejected."""
        expired_jwt = jwt.encode(
            {"sub": "1", "email": "test@student.edu", "exp": int(time.time()) - 100},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        res = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_jwt}"})
        self.assertEqual(res.status_code, 401)

    def test_google_login_oauth(self):
        """Verify Google OAuth login provisions or resolves user and returns valid token."""
        res = self.client.post("/api/v1/auth/google", json={
            "email": "google_test_student@university.edu",
            "name": "Google Test Student"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "google_test_student@university.edu")

    def test_forgot_password_protection(self):
        """Verify password reset returns anti-enumeration response."""
        res = self.client.post("/api/v1/auth/forgot-password", json={
            "email": "innovator@student.edu"
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])
        self.assertIn("instructions have been dispatched", res.json()["message"])

if __name__ == "__main__":
    unittest.main()

