import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.rate_limiter import limiter

class TestIdeaPreview(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        # Clear rate limits before test
        limiter._records.clear()

    def test_preview_happy_path_v1_and_api(self):
        """Verify public access to /api/preview and /api/v1/preview without auth token."""
        payload = {
            "idea": "IoT smart water sensor mesh for rural community outbreak early warning"
        }
        
        # Test /api/v1/preview
        res_v1 = self.client.post("/api/v1/preview", json=payload)
        self.assertEqual(res_v1.status_code, 200, f"Failed: {res_v1.text}")
        data = res_v1.json()
        
        self.assertIn("refined_summary", data)
        self.assertTrue(len(data["refined_summary"]) > 20)
        self.assertIn("suggested_keywords", data)
        self.assertEqual(len(data["suggested_keywords"]), 3)
        self.assertIn("top_resources", data)
        self.assertEqual(len(data["top_resources"]), 3)
        for r in data["top_resources"]:
            self.assertIn("title", r)
            self.assertIn("source", r)
            self.assertIn("link", r)
            self.assertTrue(r["link"].startswith("http"))
        self.assertIn("detected_innovation_gap", data)
        self.assertTrue(len(data["detected_innovation_gap"]) > 10)

        # Test /api/preview alias
        res_api = self.client.post("/api/preview", json={"idea": "Decentralized microgrid solar forecasting"})
        self.assertEqual(res_api.status_code, 200)

    def test_preview_validation_empty_and_too_short(self):
        """Verify rejected if empty or too short."""
        res = self.client.post("/api/preview", json={"idea": "a"})
        self.assertIn(res.status_code, [400, 422])

    def test_preview_validation_capped_at_500_chars(self):
        """Verify input capped at 500 characters (returns 422 if >500)."""
        long_idea = "A" * 501
        res = self.client.post("/api/preview", json={"idea": long_idea})
        self.assertEqual(res.status_code, 422)

    def test_preview_rate_limiting_5_per_hour(self):
        """Verify endpoint is rate limited to 5 requests per IP per hour."""
        payload = {"idea": "Smart traffic flow optimization with computer vision"}
        
        # First 5 should succeed
        for i in range(5):
            res = self.client.post("/api/preview", json=payload)
            self.assertEqual(res.status_code, 200, f"Request {i+1} failed with {res.status_code}")

        # 6th request should trigger 429 Too Many Requests
        res_6 = self.client.post("/api/preview", json=payload)
        self.assertEqual(res_6.status_code, 429)
        self.assertIn("Rate limit exceeded", res_6.json().get("detail", ""))

if __name__ == "__main__":
    unittest.main()
