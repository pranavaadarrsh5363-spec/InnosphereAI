import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestProjectIntelligenceEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Login as demo student to get valid JWT token
        resp = self.client.post("/api/v1/auth/demo-login/student")
        self.assertEqual(resp.status_code, 200)
        self.token = resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_projects_list(self):
        resp = self.client.get("/api/v1/projects", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        projects = resp.json()
        self.assertGreater(len(projects), 0)
        self.project_id = projects[0]["id"]

    def test_get_project_intelligence_profile(self):
        # Fetch project 1 intelligence
        resp = self.client.get("/api/v1/projects/1/intelligence", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        
        self.assertEqual(data["project_id"], 1)
        self.assertIn("overall_health_score", data)
        self.assertGreaterEqual(data["overall_health_score"], 0)
        self.assertLessEqual(data["overall_health_score"], 100)
        self.assertIn(data["health_status"], ["CRITICAL", "NEEDS_ATTENTION", "DEVELOPING", "STRONG", "EXEMPLARY"])
        
        # Verify 7 readiness dimensions exist
        self.assertIn("dimensions", data)
        self.assertGreaterEqual(len(data["dimensions"]), 6)
        keys = [d["key"] for d in data["dimensions"]]
        self.assertIn("problem_clarity", keys)
        self.assertIn("research_readiness", keys)
        self.assertIn("technology_stack", keys)
        self.assertIn("resource_readiness", keys)
        self.assertIn("execution_progress", keys)

        # Verify Next Best Action
        self.assertIn("next_best_action", data)
        self.assertIn("title", data["next_best_action"])
        self.assertIn("rationale", data["next_best_action"])
        self.assertIn("impact_score", data["next_best_action"])
        self.assertIn("actionable_steps", data["next_best_action"])

        # Verify Research Clusters
        self.assertIn("research_clusters", data)
        self.assertGreaterEqual(len(data["research_clusters"]), 2)

    def test_refresh_project_intelligence(self):
        resp = self.client.post("/api/v1/projects/1/intelligence/refresh", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertIn("profile", data)
        self.assertEqual(data["profile"]["project_id"], 1)

    def test_get_project_health_summary(self):
        resp = self.client.get("/api/v1/projects/1/health", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["project_id"], 1)
        self.assertIn("overall_score", data)
        self.assertIn("status_label", data)
        self.assertIn("status_description", data)
        self.assertIn("dimensions", data)

    def test_get_next_best_action(self):
        resp = self.client.get("/api/v1/projects/1/next-action", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("title", data)
        self.assertIn("rationale", data)
        self.assertIn("priority", data)
        self.assertIn("suggested_phase", data)

    def test_get_project_risks(self):
        resp = self.client.get("/api/v1/projects/1/risks", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        for risk in data:
            self.assertIn("category", risk)
            self.assertIn("severity", risk)
            self.assertIn("mitigation", risk)

    def test_get_research_landscape(self):
        resp = self.client.get("/api/v1/projects/1/research-landscape", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("research_clusters", data)
        self.assertIn("innovation_gaps", data)

    def test_get_health_history(self):
        resp = self.client.get("/api/v1/projects/1/health-history", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn("health_score", data[0])

    def test_idor_protection_on_intelligence(self):
        # Non-existent project
        resp = self.client.get("/api/v1/projects/99999/intelligence", headers=self.headers)
        self.assertEqual(resp.status_code, 404)

if __name__ == "__main__":
    unittest.main()
