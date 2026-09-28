import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.project import Project
from app.models.experiment import Experiment, ExperimentRun, ExperimentResult
from app.services.experiment_service import experiment_service
from app.api.auth import create_access_token


class TestExperimentRunsAndStats(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

        def override_get_db():
            db = self.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        db = self.TestingSessionLocal()
        self.student = User(
            id=1,
            email="alice@innosphere.edu",
            full_name="Alice Student",
            hashed_password="hashed_pw_test",
            role="student",
            is_active=True
        )
        self.project = Project(
            id=1,
            title="Edge Anomaly Benchmarking",
            problem_statement="Problem statement text",
            proposed_solution="Proposed solution text",
            domain="Edge AI",
            technologies=["Python", "FastAPI"],
            status="research",
            progress=50,
            user_id=1
        )
        self.experiment = Experiment(
            id=1,
            project_id=1,
            name="Quantized 1D-CNN Multi-Run Benchmark",
            objective="Evaluate variance across 5 stochastic runs",
            hypothesis="Mean F1 exceeds 90% across 5 random seeds",
            dataset_used="WHO Water Quality 2023",
            baseline_model="Random Forest Baseline",
            proposed_method="1D-CNN Quantized",
            status="RUNNING"
        )
        db.add_all([self.student, self.project, self.experiment])
        db.commit()
        db.close()

        self.token = create_access_token(data={"sub": "1", "email": "alice@innosphere.edu", "role": "student"})
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        Base.metadata.drop_all(bind=self.engine)
        app.dependency_overrides.clear()

    def test_multi_run_creation_and_auto_statistics(self):
        """Test creating 5 experimental runs and verifying automated statistical calculation."""
        accuracy_samples = [88.5, 89.2, 90.1, 89.8, 90.4]
        latency_samples = [24.1, 23.8, 24.5, 24.0, 23.6]

        for i, (acc, lat) in enumerate(zip(accuracy_samples, latency_samples), start=1):
            run_payload = {
                "run_number": i,
                "run_label": f"Trial {i} (Seed {40 + i})",
                "random_seed": 40 + i,
                "metrics": {"accuracy": acc, "latency_ms": lat},
                "baseline_metrics": {"accuracy": 82.0, "latency_ms": 75.0},
                "execution_time_ms": 1500.0,
                "status": "COMPLETED"
            }
            resp = self.client.post("/api/v1/experiments/1/runs", json=run_payload, headers=self.headers)
            self.assertEqual(resp.status_code, 201)

        # Check that 5 runs were saved
        runs_resp = self.client.get("/api/v1/experiments/1/runs", headers=self.headers)
        self.assertEqual(runs_resp.status_code, 200)
        self.assertEqual(len(runs_resp.json()), 5)

        # Check results aggregated automatically
        res_resp = self.client.get("/api/v1/experiments/1/results", headers=self.headers)
        self.assertEqual(res_resp.status_code, 200)
        results = res_resp.json()
        self.assertGreaterEqual(len(results), 2)

        acc_res = next(r for r in results if "accuracy" in r["metric_name"].lower())
        self.assertAlmostEqual(acc_res["proposed_value"], sum(accuracy_samples) / 5.0, places=2)
        self.assertEqual(acc_res["baseline_value"], 82.0)
        self.assertEqual(acc_res["comparison_label"], "Improved")
        self.assertIn("statistical_summary", acc_res)
        self.assertEqual(acc_res["statistical_summary"]["count"], 5)
        self.assertGreater(acc_res["statistical_summary"]["std_dev"], 0.0)

    def test_descriptive_stats_calculator_edge_cases(self):
        """Test descriptive stats utility with single observation, empty array, and zero division."""
        # Empty list
        empty_res = experiment_service.calculate_descriptive_stats([])
        self.assertEqual(empty_res["count"], 0)
        self.assertEqual(empty_res["mean"], 0.0)
        self.assertFalse(empty_res["is_statistically_valid"])

        # Single observation
        single_res = experiment_service.calculate_descriptive_stats([92.5])
        self.assertEqual(single_res["count"], 1)
        self.assertEqual(single_res["mean"], 92.5)
        self.assertEqual(single_res["std_dev"], 0.0)
        self.assertFalse(single_res["is_statistically_valid"])

        # 3 observations
        multi_res = experiment_service.calculate_descriptive_stats([10.0, 20.0, 30.0])
        self.assertEqual(multi_res["count"], 3)
        self.assertEqual(multi_res["mean"], 20.0)
        self.assertEqual(multi_res["median"], 20.0)
        self.assertEqual(multi_res["min"], 10.0)
        self.assertEqual(multi_res["max"], 30.0)
        self.assertEqual(multi_res["std_dev"], 10.0)
        self.assertTrue(multi_res["is_statistically_valid"])

    def test_metric_difference_neutral_labeling(self):
        """Test neutral difference labeling for higher_is_better and lower_is_better."""
        # Higher is better: improved
        d, pct, label = experiment_service.compute_metric_difference(80.0, 88.0, "higher_is_better")
        self.assertEqual(label, "Improved")
        self.assertEqual(d, 8.0)
        self.assertEqual(pct, 10.0)

        # Higher is better: lower
        d, pct, label = experiment_service.compute_metric_difference(88.0, 80.0, "higher_is_better")
        self.assertEqual(label, "Lower")

        # Lower is better (latency): improved
        d, pct, label = experiment_service.compute_metric_difference(100.0, 30.0, "lower_is_better")
        self.assertEqual(label, "Improved")
        self.assertEqual(d, -70.0)
        self.assertEqual(pct, -70.0)


if __name__ == "__main__":
    unittest.main()
