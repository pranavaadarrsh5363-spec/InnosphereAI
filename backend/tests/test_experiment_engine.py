import unittest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.project import Project
from app.models.hardware import HardwareDevice, HardwareSensor, TelemetryRecord
from app.models.experiment import Experiment, ExperimentRun, ExperimentResult
from app.api.auth import create_access_token


class TestExperimentEngine(unittest.TestCase):
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

        # Seed test users and project
        db = self.TestingSessionLocal()
        self.student = User(
            id=1,
            email="student@innosphere.edu",
            full_name="Alice Student",
            hashed_password="hashed_pw_test",
            role="student",
            is_active=True
        )
        self.other_user = User(
            id=2,
            email="other@innosphere.edu",
            full_name="Bob Other",
            hashed_password="hashed_pw_test",
            role="student",
            is_active=True
        )
        self.project = Project(
            id=1,
            title="IoT Drinking Water Anomaly Detection",
            problem_statement="Rural communities lack automated, affordable early-detection of bacterial contamination in municipal wells.",
            proposed_solution="A solar-powered edge IoT telemetry node with 1D-CNN temporal anomaly filtering and LoRaWAN connectivity.",
            domain="Environmental IoT / Edge AI",
            technologies=["Python", "FastAPI", "PyTorch", "ESP32", "LoRaWAN"],
            status="research",
            progress=45,
            user_id=1
        )
        # Seed a hardware device
        self.device = HardwareDevice(
            id=1,
            project_id=1,
            name="ESP32-Water-Node-01",
            device_type="ESP32-S3",
            status="online",
            is_simulating=True,
            packet_loss_rate=0.8,
            network_protocol="LoRaWAN / MQTT"
        )
        self.sensor = HardwareSensor(
            id=1,
            device_id=1,
            name="Turbidity Sensor",
            sensor_type="turbidity",
            unit="NTU"
        )
        db.add_all([self.student, self.other_user, self.project, self.device, self.sensor])
        db.commit()

        # Seed telemetry samples
        for i in range(10):
            db.add(TelemetryRecord(
                device_id=1,
                sensor_id=1,
                value=3.2 + i * 0.1,
                raw_payload={"turbidity": 3.2 + i * 0.1, "ph": 7.1}
            ))
        db.commit()
        db.close()

        self.token = create_access_token(data={"sub": "1", "email": "student@innosphere.edu", "role": "student"})
        self.headers = {"Authorization": f"Bearer {self.token}"}

        self.other_token = create_access_token(data={"sub": "2", "email": "other@innosphere.edu", "role": "student"})
        self.other_headers = {"Authorization": f"Bearer {self.other_token}"}

    def tearDown(self):
        Base.metadata.drop_all(bind=self.engine)
        app.dependency_overrides.clear()

    def test_create_and_get_experiment(self):
        """Test creating an empirical experiment and fetching its details."""
        payload = {
            "name": "1D-CNN vs Baseline Anomaly Detection",
            "objective": "Evaluate accuracy and inference latency of quantized 1D-CNN on temporal windowed water telemetry.",
            "hypothesis": "Deploying a 1D-CNN on edge microcontrollers achieves >=94% F1 with <30ms latency.",
            "dataset_used": "WHO Potability Benchmark 2023",
            "dataset_version": "v2.1",
            "baseline_model": "Linear Logistic Regression Baseline",
            "proposed_method": "Edge 1D-CNN with Multi-Scale Temporal Convolutions",
            "model_algorithm": "1D-CNN",
            "hardware_environment": "ESP32-S3 + Host GPU",
            "software_environment": "Python 3.11, PyTorch 2.2",
            "random_seed": 42,
            "evaluation_metrics": ["Accuracy", "F1-Score", "Inference Latency (ms)"],
            "status": "PLANNED"
        }

        resp = self.client.post("/api/v1/projects/1/experiments", json=payload, headers=self.headers)
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["name"], payload["name"])
        self.assertEqual(data["project_id"], 1)
        exp_id = data["id"]

        # Fetch detail
        detail_resp = self.client.get(f"/api/v1/experiments/{exp_id}", headers=self.headers)
        self.assertEqual(detail_resp.status_code, 200)
        detail_data = detail_resp.json()
        self.assertEqual(detail_data["id"], exp_id)
        self.assertIn("reproducibility", detail_data)
        self.assertGreaterEqual(detail_data["reproducibility"]["coverage_score"], 6)

    def test_idor_protection_unauthorized_user(self):
        """Verify that another student cannot access or modify project experiments."""
        # Create experiment as Alice
        payload = {
            "name": "Alice Private Experiment",
            "objective": "Private objective",
            "hypothesis": "Private hypothesis",
            "baseline_model": "Baseline",
            "proposed_method": "Proposed"
        }
        res = self.client.post("/api/v1/projects/1/experiments", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        exp_id = res.json()["id"]

        # Bob attempts to read Alice's project experiments
        list_res = self.client.get("/api/v1/projects/1/experiments", headers=self.other_headers)
        self.assertEqual(list_res.status_code, 403)

        # Bob attempts to read Alice's specific experiment
        get_res = self.client.get(f"/api/v1/experiments/{exp_id}", headers=self.other_headers)
        self.assertEqual(get_res.status_code, 403)

    def test_status_transitions(self):
        """Test status transitions (PLANNED -> READY -> RUNNING -> COMPLETED)."""
        payload = {
            "name": "Status Lifecycle Test",
            "objective": "Lifecycle test",
            "hypothesis": "Hypothesis",
            "baseline_model": "Baseline",
            "proposed_method": "Proposed"
        }
        res = self.client.post("/api/v1/projects/1/experiments", json=payload, headers=self.headers)
        exp_id = res.json()["id"]

        # Transition to RUNNING
        t_res = self.client.post(f"/api/v1/experiments/{exp_id}/status", json={"new_status": "RUNNING"}, headers=self.headers)
        self.assertEqual(t_res.status_code, 200)
        self.assertEqual(t_res.json()["status"], "RUNNING")
        self.assertIsNotNone(t_res.json()["started_at"])

        # Transition to COMPLETED
        t_res2 = self.client.post(f"/api/v1/experiments/{exp_id}/status", json={"new_status": "COMPLETED"}, headers=self.headers)
        self.assertEqual(t_res2.status_code, 200)
        self.assertEqual(t_res2.json()["status"], "COMPLETED")
        self.assertIsNotNone(t_res2.json()["completed_at"])

    def test_suggest_experiment_from_gap(self):
        """Test AI / deterministic suggestion of an experiment from a research gap."""
        payload = {
            "research_gap_title": "Real-time edge telemetry anomaly filtering",
            "research_gap_description": "Lack of low-latency on-device bacterial contamination detection.",
            "experiment_type": "iot_edge"
        }
        res = self.client.post("/api/v1/projects/1/experiments/suggest", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("name", data)
        self.assertIn("hypothesis", data)
        self.assertIn("suggested_metrics", data)
        self.assertTrue(data["is_ai_generated"])

    def test_create_experiment_from_hardware(self):
        """Test creating an empirical experiment from an existing Hardware Lab device and telemetry."""
        res = self.client.post("/api/v1/projects/1/experiments/from-hardware?device_id=1", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["hardware_device_id"], 1)
        self.assertGreater(len(data["results"]), 0)
        self.assertGreater(len(data["evidence_links"]), 0)
        self.assertEqual(data["evidence_links"][0]["evidence_type"], "hardware_telemetry")


if __name__ == "__main__":
    unittest.main()
