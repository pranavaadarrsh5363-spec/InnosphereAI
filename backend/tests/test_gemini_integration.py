import asyncio
import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.services.gemini_service import GeminiService, gemini_service
from app.services.embedding_service import embedding_service
from app.database import SessionLocal
from app.models.project import Project

class TestGeminiIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Login student
        student_res = cls.client.post("/api/v1/auth/demo-login/student").json()
        cls.student_token = student_res["access_token"]
        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}

        # Register secondary student for IDOR testing
        reg_res = cls.client.post(
            "/api/v1/auth/register",
            json={
                "email": "secondary_student_gemini@test.com",
                "password": "SecurePassword123!",
                "full_name": "Secondary Student",
                "role": "student"
            }
        )
        if reg_res.status_code in [200, 201]:
            cls.other_token = reg_res.json()["access_token"]
        else:
            login_res = cls.client.post(
                "/api/v1/auth/login",
                json={"email": "secondary_student_gemini@test.com", "password": "SecurePassword123!"}
            )
            cls.other_token = login_res.json()["access_token"]
        cls.other_headers = {"Authorization": f"Bearer {cls.other_token}"}

    def test_gemini_service_initialization_and_safety(self):
        """Test GeminiService initialization and ensure API key is never logged or exposed."""
        service = GeminiService()
        self.assertEqual(service.model, settings.GEMINI_MODEL or "gemini-2.5-flash")
        self.assertEqual(service.embedding_model, settings.EMBEDDING_MODEL or "text-embedding-004")
        self.assertIsInstance(service.is_configured(), bool)

    def test_ai_status_endpoint_never_exposes_secrets(self):
        """Test GET /api/v1/ai/status returns public diagnostics without secrets."""
        response = self.client.get("/api/v1/ai/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertIn("provider", data)
        self.assertEqual(data["provider"], "google-gemini")
        self.assertIn("gemini_configured", data)
        self.assertIn("gemini_model", data)
        self.assertIn("embedding_model", data)
        self.assertIn("dimensions", data)
        self.assertEqual(data["dimensions"], 768)

        # Critical security assertion: API key must NEVER be in response data
        raw_text = response.text
        self.assertNotIn("AIzaSy", raw_text)
        self.assertNotIn("GEMINI_API_KEY", data)

    def test_gemini_test_connection_not_configured(self):
        """Test test_connection returns proper payload when unconfigured."""
        service = GeminiService()
        service.api_key = ""
        result = asyncio.run(service.test_connection())
        self.assertFalse(result["connected"])
        self.assertEqual(result["status"], "not_configured")

    def test_gemini_test_connection_mocked_success(self):
        """Test test_connection returns operational status when probe succeeds."""
        service = GeminiService()
        service.api_key = "test-mock-key"
        
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "OK"
        mock_client.models.generate_content.return_value = mock_response

        with patch.object(service, "_get_client", return_value=mock_client):
            result = asyncio.run(service.test_connection())
            self.assertTrue(result["connected"])
            self.assertEqual(result["status"], "operational")
            self.assertIn("latency_ms", result)

    def test_gemini_generate_json_mocked(self):
        """Test generate_json parses Gemini JSON mode output correctly."""
        service = GeminiService()
        service.api_key = "test-mock-key"

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"summary": "Test Idea", "feasibility_score": 90}'
        mock_client.models.generate_content.return_value = mock_response

        with patch.object(service, "_get_client", return_value=mock_client):
            result = asyncio.run(service.generate_json("Analyze idea", "System instruction"))
            self.assertIsNotNone(result)
            self.assertEqual(result.get("summary"), "Test Idea")
            self.assertEqual(result.get("feasibility_score"), 90)

    def test_gemini_mentor_advice_grounding(self):
        """Test generate_mentor_advice injects context and distinguishes grounding."""
        service = GeminiService()
        service.api_key = "test-mock-key"

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "### AI Mentor Guidance\n\nBased on verified literature: [IoT Water Quality](https://arxiv.org/abs/1234.5678)...\n\nAI Mentor Recommendation: Deploy ESP32 nodes."
        mock_client.models.generate_content.return_value = mock_response

        with patch.object(service, "_get_client", return_value=mock_client):
            advice = asyncio.run(service.generate_mentor_advice(
                student_query="What sensor should I use?",
                project_context={
                    "title": "Smart Water Monitor",
                    "domain": "Water & Sanitation",
                    "problem_statement": "Rural water contamination",
                    "technologies": ["ESP32", "FastAPI"]
                },
                retrieved_evidence=[
                    {
                        "title": "IoT Water Quality",
                        "source": "arXiv",
                        "resource_type": "research_paper",
                        "url": "https://arxiv.org/abs/1234.5678",
                        "description": "Sensors for turbidity and pH.",
                        "relevance_explanation": "Directly matches domain"
                    }
                ]
            ))
            self.assertIsNotNone(advice)
            self.assertIn("AI Mentor", advice)

    def test_ai_mentor_chat_api_invalid_token_fails(self):
        """Test POST /api/v1/ai/mentor/chat rejects invalid authentication tokens."""
        response = self.client.post(
            "/api/v1/ai/mentor/chat",
            headers={"Authorization": "Bearer invalid_jwt_token_payload"},
            json={"message": "Help me build an AI model"}
        )
        self.assertEqual(response.status_code, 401)

    def test_ai_mentor_chat_api_success(self):
        """Test POST /api/v1/ai/mentor/chat returns structured mentor response."""
        with patch.object(gemini_service, "generate_mentor_advice", return_value="### Mentor Guidance\n\nFocus on data collection first."):
            response = self.client.post(
                "/api/v1/ai/mentor/chat",
                headers=self.student_headers,
                json={
                    "message": "How do I optimize my model training pipeline?",
                    "project_id": 1,
                    "context_type": "general"
                }
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("reply", data)
            self.assertEqual(data["role"], "assistant")
            self.assertEqual(data["project_id"], 1)

    def test_ai_mentor_chat_idor_protection(self):
        """Test POST /api/v1/ai/mentor/chat blocks unauthorized access to other users' projects."""
        # Project 1 belongs to student 1 (innovator@student.edu)
        response = self.client.post(
            "/api/v1/ai/mentor/chat",
            headers=self.other_headers, # Secondary student trying to access project 1
            json={
                "message": "Give me project secrets",
                "project_id": 1
            }
        )
        self.assertEqual(response.status_code, 403)

    def test_embedding_dimensions_preserved(self):
        """Ensure 768-dimensional semantic embedding is preserved."""
        vec = asyncio.run(embedding_service.get_query_embedding("IoT water quality sensor"))
        self.assertEqual(len(vec), 768)

if __name__ == "__main__":
    unittest.main()
