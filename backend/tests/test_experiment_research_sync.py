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
from app.models.research import ResearchDocument
from app.api.auth import create_access_token


class TestExperimentResearchSync(unittest.TestCase):
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
            title="IoT Drinking Water Anomaly Detection",
            problem_statement="Problem statement text",
            proposed_solution="Proposed solution text",
            domain="Environmental IoT / Edge AI",
            technologies=["Python", "PyTorch", "ESP32"],
            status="research",
            progress=65,
            user_id=1
        )
        self.doc = ResearchDocument(
            id=1,
            project_id=1,
            doc_type="research_paper",
            title="IoT Drinking Water Anomaly Detection: An Empirical Study",
            abstract="Empirical evaluation abstract for IoT water monitoring.",
            status="draft"
        )
        self.experiment = Experiment(
            id=1,
            project_id=1,
            research_document_id=1,
            name="Quantized 1D-CNN vs Random Forest",
            objective="Evaluate edge classification latency and F1 score",
            hypothesis="Quantized 1D-CNN achieves >94% F1 with sub-30ms latency",
            dataset_used="WHO Potability Telemetry 2023",
            dataset_version="v2.0",
            baseline_model="Random Forest Baseline (100 Trees)",
            proposed_method="Edge 1D-CNN + Temporal Feature Layer",
            hardware_environment="ESP32-S3 @ 240MHz",
            software_environment="Python 3.11, PyTorch 2.2, C++ FreeRTOS",
            random_seed=42,
            evaluation_metrics=["Accuracy", "F1-Score", "Inference Latency"],
            status="COMPLETED"
        )
        self.res1 = ExperimentResult(
            id=1,
            experiment_id=1,
            metric_name="Accuracy",
            metric_type="classification",
            baseline_value=84.2,
            proposed_value=94.8,
            unit="%",
            direction="higher_is_better",
            difference=10.6,
            percentage_difference=12.59,
            comparison_label="Improved"
        )
        self.res2 = ExperimentResult(
            id=2,
            experiment_id=1,
            metric_name="Inference Latency",
            metric_type="edge_iot",
            baseline_value=95.0,
            proposed_value=24.2,
            unit="ms",
            direction="lower_is_better",
            difference=-70.8,
            percentage_difference=-74.53,
            comparison_label="Improved"
        )
        self.bench = BenchmarkReference(
            id=1,
            project_id=1,
            experiment_id=1,
            reference_name="SOTA ResNet Baseline (Smith 2024)",
            method_name="Dual-Branch ResNet",
            dataset_name="WHO Potability Benchmark 2023",
            metric_name="Accuracy",
            reported_value=88.5,
            unit="%",
            is_published_reference=True
        )
        db.add_all([self.student, self.project, self.doc, self.experiment, self.res1, self.res2, self.bench])
        db.commit()
        db.close()

        self.token = create_access_token(data={"sub": "1", "email": "student@innosphere.edu", "role": "student"})
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        Base.metadata.drop_all(bind=self.engine)
        app.dependency_overrides.clear()

    def test_sync_experiments_to_research_preview(self):
        """Test preview mode without overwriting existing research sections."""
        payload = {
            "target_doc_type": "research_paper",
            "overwrite_sections": False
        }
        res = self.client.post("/api/v1/projects/1/experiments/sync-research", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["experiments_synced_count"], 1)
        self.assertIn("\\begin{table}", data["latex_table_preview"])
        self.assertIn("Accuracy", data["markdown_table_preview"])
        self.assertIn("experimental_methodology", data["updated_sections"])

    def test_sync_experiments_to_research_overwrite(self):
        """Test active overwrite synchronization updating the research document."""
        payload = {
            "target_doc_type": "research_paper",
            "overwrite_sections": True
        }
        res = self.client.post("/api/v1/projects/1/experiments/sync-research", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["experiments_synced_count"], 1)

        # Inspect updated research document directly
        doc_resp = self.client.get("/api/v1/projects/1/research?doc_type=research_paper", headers=self.headers)
        self.assertEqual(doc_resp.status_code, 200)
        doc_data = doc_resp.json()
        self.assertIn("Empirical Hypothesis", doc_data["experimental_methodology"])
        self.assertIn("Empirical Benchmark Comparisons", doc_data["results"])
        self.assertIn("Accuracy", doc_data["results"])

    def test_project_experiments_summary_kpi(self):
        """Test the global experimentation summary KPI endpoint."""
        res = self.client.get("/api/v1/projects/1/experiments/summary", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_experiments"], 1)
        self.assertEqual(data["completed_count"], 1)
        self.assertEqual(data["total_benchmarks"], 1)
        self.assertGreaterEqual(data["avg_reproducibility_pct"], 70.0)


if __name__ == "__main__":
    unittest.main()
