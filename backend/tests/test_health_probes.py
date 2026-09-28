import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestHealthAndSecurityHeaders(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_endpoint(self):
        """Verify root endpoint returns online status."""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("version", data)

    def test_health_liveness_probe(self):
        """Verify GET /health, /api/v1/health, and /api/v1/health/live."""
        for ep in ["/health", "/api/v1/health"]:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["status"], "healthy")

        for ep in ["/health/live", "/api/v1/health/live"]:
            res_live = self.client.get(ep)
            self.assertEqual(res_live.status_code, 200)
            self.assertEqual(res_live.json()["status"], "alive")

    def test_readiness_probe(self):
        """Verify GET /health/ready and /api/v1/health/ready check DB connectivity."""
        for ep in ["/health/ready", "/api/v1/health/ready"]:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "ready")
            self.assertEqual(data["database"], "connected")

    def test_security_headers_present(self):
        """Verify HTTP security headers are attached to responses."""
        res = self.client.get("/health")
        headers = res.headers
        self.assertEqual(headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(headers.get("x-frame-options"), "DENY")
        self.assertIn("x-request-id", headers)
        self.assertIn("x-process-time-ms", headers)

if __name__ == "__main__":
    unittest.main()
