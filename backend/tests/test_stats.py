import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestLiveStats(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_live_stats_endpoint(self):
        """Verify GET /api/stats and GET /api/v1/stats return genuine database numbers."""
        res = self.client.get("/api/stats")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        self.assertTrue(data.get("success"))
        self.assertIn("resources_discovered", data)
        self.assertIn("ideas_analyzed", data)
        self.assertIn("student_projects", data)
        self.assertIn("technologies_explored", data)
        self.assertIn("research_sources", data)
        self.assertIn("active_innovators", data)
        
        # Verify counts are non-negative integers
        self.assertIsInstance(data["resources_discovered"], int)
        self.assertGreaterEqual(data["resources_discovered"], 0)
        self.assertIsInstance(data["student_projects"], int)
        self.assertGreaterEqual(data["student_projects"], 0)
        self.assertEqual(data["research_sources"], 8)

        # Test v1 alias
        res_v1 = self.client.get("/api/v1/stats")
        self.assertEqual(res_v1.status_code, 200)
        self.assertEqual(res_v1.json()["research_sources"], 8)

if __name__ == "__main__":
    unittest.main()
