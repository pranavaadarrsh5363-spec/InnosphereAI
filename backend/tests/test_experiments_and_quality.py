import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestExperimentsAndQuality(unittest.TestCase):
    """
    Tests for Experiment Tracker (gap -> hypothesis -> metrics -> results) and
    5-vector research quality radar & evidence traceability matrix.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        res_stu = cls.client.post("/api/v1/auth/demo-login/student")
        cls.student_token = res_stu.json()["access_token"]
        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}

        res_proj = cls.client.get("/api/v1/projects", headers=cls.student_headers)
        projects = res_proj.json()
        cls.project_id = projects[0]["id"] if projects else 1

        cls.client.get(f"/api/v1/projects/{cls.project_id}/research", headers=cls.student_headers)

    def test_01_create_and_update_experiment(self):
        """Verify recording empirical experiment with baseline vs proposed metrics."""
        exp_payload = {
            "name": "Benchmarking 1D-CNN vs Random Forest on Potability Telemetry",
            "hypothesis": "1D-CNN temporal attention improves outlier classification F1-score by >5% over Random Forest.",
            "objective": "Determine statistical accuracy gains on physical sensor telemetry stream.",
            "dataset_used": "WHO 10,000 Water Potability Telemetry Trace",
            "baseline_model": "Random Forest (100 Trees)",
            "proposed_method": "InnoSphere 1D-CNN + Temporal Attention",
            "parameters": {"epochs": 50, "batch_size": 32, "lr": 0.001},
            "metrics": {"accuracy": "96.8%", "f1_score": "0.962", "latency_ms": "22.4 ms"},
            "results_summary": "1D-CNN achieved 0.962 F1-score compared to 0.874 for Random Forest baseline.",
            "status": "completed",
            "evidence_notes": "Validated against 10-fold cross validation on held-out test split."
        }
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/experiments",
            json=exp_payload,
            headers=self.student_headers
        )
        self.assertIn(res.status_code, [200, 201])
        data = res.json()
        self.assertEqual(data["name"], exp_payload["name"])
        self.assertEqual(data["status"], "completed")
        self.assertIsNotNone(data["completed_at"])
        exp_id = data["id"]

        # List experiments
        res_list = self.client.get(f"/api/v1/projects/{self.project_id}/experiments", headers=self.student_headers)
        self.assertEqual(res_list.status_code, 200)
        self.assertGreater(len(res_list.json()), 0)

        # Update experiment
        res_up = self.client.put(
            f"/api/v1/projects/{self.project_id}/experiments/{exp_id}",
            json={"results_summary": "Updated summary: confirmed 96.8% accuracy."},
            headers=self.student_headers
        )
        self.assertEqual(res_up.status_code, 200)
        self.assertEqual(res_up.json()["results_summary"], "Updated summary: confirmed 96.8% accuracy.")

    def test_02_compute_research_quality_radar(self):
        """Verify 5-vector research quality evaluation and citation coverage percentage."""
        res = self.client.get(f"/api/v1/projects/{self.project_id}/research/quality", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["overall_readiness_score"], 35)
        self.assertIn("readiness_label", data)
        self.assertGreaterEqual(data["citation_coverage_pct"], 50.0)
        self.assertIn("structure_quality", data)
        self.assertIn("evidence_quality", data)
        self.assertIn("literature_diversity", data)
        self.assertIn("reproducibility", data)
        self.assertIn("technical_completeness", data)

    def test_03_get_evidence_traceability_matrix(self):
        """Verify evidence mapping matrix connects sections to papers and experiments."""
        res = self.client.get(f"/api/v1/projects/{self.project_id}/research/evidence", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total_evidence_links"], 0)
        self.assertGreater(len(data["evidence_items"]), 0)
        first_item = data["evidence_items"][0]
        self.assertIn("section", first_item)
        self.assertIn("claim_summary", first_item)
        self.assertIn("confidence_level", first_item)


if __name__ == "__main__":
    unittest.main()
