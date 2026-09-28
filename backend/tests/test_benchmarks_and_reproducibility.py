import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.project import Project
from app.models.experiment import Experiment, ExperimentRun, ExperimentResult, BenchmarkReference, ExperimentEvidence
from app.services.experiment_service import experiment_service
from app.api.auth import create_access_token


class TestBenchmarksAndReproducibility(unittest.TestCase):
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
            email="student@innosphere.edu",
            full_name="Alice Student",
            hashed_password="hashed_pw_test",
            role="student",
            is_active=True
        )
        self.project = Project(
            id=1,
            title="Reproducibility Test Project",
            problem_statement="Problem statement text",
            proposed_solution="Proposed solution text",
            domain="AI / IoT",
            technologies=["Python", "PyTorch"],
            status="research",
            progress=60,
            user_id=1
        )
        self.experiment = Experiment(
            id=1,
            project_id=1,
            name="Comprehensive Reproducibility & Benchmark Study",
            objective="Document full experimental setup and test against published baselines",
            hypothesis="Model surpasses baseline with rigorous variable controls",
            dataset_used="WHO Potability Telemetry 2023",
            dataset_version="v2.0",
            dataset_source="Kaggle Verified",
            preprocessing_notes="Stratified 80/10/10 split with z-score normalization on turbidity and pH.",
            baseline_model="Random Forest (100 Trees)",
            proposed_method="Quantized 1D-CNN",
            model_algorithm="1D Convolutional Neural Network (3 Blocks + Attention)",
            hardware_environment="ESP32-S3 @ 240MHz, 512KB SRAM",
            software_environment="Python 3.11.8, PyTorch 2.2.0, CUDA 12.1",
            parameters={"window_size": 24, "stride": 4},
            hyperparameters={"learning_rate": 0.001, "batch_size": 32, "epochs": 50, "optimizer": "AdamW"},
            random_seed=42,
            evaluation_metrics=["Accuracy", "F1-Score", "Inference Latency"],
            status="COMPLETED"
        )
        db.add_all([self.student, self.project, self.experiment])
        db.commit()
        db.close()

        self.token = create_access_token(data={"sub": "1", "email": "student@innosphere.edu", "role": "student"})
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        Base.metadata.drop_all(bind=self.engine)
        app.dependency_overrides.clear()

    def test_reproducibility_checklist_evaluation(self):
        """Test 10-point reproducibility coverage indicator."""
        # Initial check without runs/evidence
        resp = self.client.get("/api/v1/experiments/1/reproducibility", headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["total_checks"], 10)
        self.assertGreaterEqual(data["coverage_score"], 8)
        self.assertIn("coverage_percentage", data)
        self.assertIn("disclaimer", data)

        # Attach an evidence link and run to achieve 10/10 coverage
        ev_payload = {
            "evidence_type": "dataset",
            "title": "Kaggle Ground Truth Water Telemetry",
            "source_url": "https://kaggle.com/datasets/water-quality",
            "reference_id": "dataset-v2.0",
            "verification_status": "SYSTEM_LOGGED",
            "notes": "Verified checksum matches."
        }
        ev_res = self.client.post("/api/v1/experiments/1/evidence", json=ev_payload, headers=self.headers)
        self.assertEqual(ev_res.status_code, 201)

        run_payload = {
            "run_number": 1,
            "run_label": "Trial 1",
            "random_seed": 42,
            "metrics": {"accuracy": 94.5, "f1_score": 0.941},
            "status": "COMPLETED"
        }
        run_res = self.client.post("/api/v1/experiments/1/runs", json=run_payload, headers=self.headers)
        self.assertEqual(run_res.status_code, 201)

        # Re-evaluate
        resp2 = self.client.get("/api/v1/experiments/1/reproducibility", headers=self.headers)
        data2 = resp2.json()
        self.assertEqual(data2["coverage_score"], 10)
        self.assertEqual(data2["coverage_percentage"], 100.0)
        self.assertEqual(data2["status"], "HIGH_COVERAGE")

    def test_benchmark_references_management(self):
        """Test adding and retrieving verified published benchmark references."""
        payload = {
            "reference_name": "State-of-the-Art Baseline (Smith et al. 2024)",
            "method_name": "Dual-Branch ResNet + Attention",
            "dataset_name": "WHO Potability Benchmark 2023",
            "metric_name": "F1-Score",
            "reported_value": 89.4,
            "unit": "%",
            "source_citation": "[1] Smith et al., IEEE T-IoT 2024",
            "source_section_page": "Section IV-B, Table 2, Page 6",
            "doi": "10.1109/TIOT.2024.1234567",
            "experiment_id": 1,
            "notes": "Published comparative benchmark."
        }
        create_resp = self.client.post("/api/v1/projects/1/benchmarks", json=payload, headers=self.headers)
        self.assertEqual(create_resp.status_code, 201)
        bench_id = create_resp.json()["id"]

        list_resp = self.client.get("/api/v1/experiments/1/benchmark", headers=self.headers)
        self.assertEqual(list_resp.status_code, 200)
        benchmarks = list_resp.json()
        self.assertEqual(len(benchmarks), 1)
        self.assertEqual(benchmarks[0]["reported_value"], 89.4)
        self.assertTrue(benchmarks[0]["is_published_reference"])

        # Delete benchmark
        del_resp = self.client.delete(f"/api/v1/benchmarks/{bench_id}", headers=self.headers)
        self.assertEqual(del_resp.status_code, 204)

    def test_json_and_csv_results_import(self):
        """Test importing results via JSON and CSV."""
        # JSON import
        json_payload = {
            "format_type": "json",
            "json_data": [
                {
                    "metric_name": "Precision",
                    "baseline_value": 84.0,
                    "proposed_value": 91.2,
                    "unit": "%",
                    "direction": "higher_is_better"
                },
                {
                    "metric_name": "Recall",
                    "baseline_value": 82.5,
                    "proposed_value": 90.8,
                    "unit": "%",
                    "direction": "higher_is_better"
                }
            ]
        }
        j_resp = self.client.post("/api/v1/experiments/1/import-results", json=json_payload, headers=self.headers)
        self.assertEqual(j_resp.status_code, 200)
        self.assertEqual(j_resp.json()["imported_metrics_count"], 2)

        # CSV import
        csv_content = "metric_name,baseline_value,proposed_value,unit,direction\nInference Latency,120.0,42.5,ms,lower_is_better\nPacket Loss Rate,4.2,0.8,%,lower_is_better"
        csv_payload = {
            "format_type": "csv",
            "raw_content": csv_content
        }
        c_resp = self.client.post("/api/v1/experiments/1/import-results", json=csv_payload, headers=self.headers)
        self.assertEqual(c_resp.status_code, 200)
        self.assertEqual(c_resp.json()["imported_metrics_count"], 2)

        # Verify all 4 imported results exist
        all_results = self.client.get("/api/v1/experiments/1/results", headers=self.headers).json()
        self.assertEqual(len(all_results), 4)


if __name__ == "__main__":
    unittest.main()
