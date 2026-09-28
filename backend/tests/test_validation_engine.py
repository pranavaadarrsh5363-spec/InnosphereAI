import unittest
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
from app.models.validation import InnovationClaim, ValidationGap, ProjectCostItem, StakeholderReview
from app.api.auth import create_access_token


class TestValidationEngine(unittest.TestCase):
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
            full_name="Alice Innovator",
            hashed_password="hashed_pw_test",
            role="student",
            is_active=True
        )
        self.other_user = User(
            id=2,
            email="bob@innosphere.edu",
            full_name="Bob Unauthorized",
            hashed_password="hashed_pw_test",
            role="student",
            is_active=True
        )
        self.mentor = User(
            id=3,
            email="dr.smith@innosphere.edu",
            full_name="Dr. Smith Mentor",
            hashed_password="hashed_pw_test",
            role="mentor",
            is_active=True
        )
        self.project = Project(
            id=1,
            title="Solar Edge Water Anomaly Detector",
            problem_statement="Rural communities lack affordable bacterial anomaly detection in water distribution.",
            proposed_solution="Ultra-low power TinyML MCU with optical turbidity & conductivity sensing.",
            domain="Environmental IoT & Edge AI",
            technologies=["Python", "FastAPI", "TensorFlow Lite", "ESP32", "LoRaWAN"],
            status="experimentation",
            progress=65,
            user_id=1
        )
        db.add_all([self.student, self.other_user, self.mentor, self.project])
        db.commit()
        db.close()

        self.student_token = create_access_token(data={"sub": "1", "email": "alice@innosphere.edu", "role": "student"})
        self.student_headers = {"Authorization": f"Bearer {self.student_token}"}

        self.other_token = create_access_token(data={"sub": "2", "email": "bob@innosphere.edu", "role": "student"})
        self.other_headers = {"Authorization": f"Bearer {self.other_token}"}

        self.mentor_token = create_access_token(data={"sub": "3", "email": "dr.smith@innosphere.edu", "role": "mentor"})
        self.mentor_headers = {"Authorization": f"Bearer {self.mentor_token}"}

    def tearDown(self):
        Base.metadata.drop_all(bind=self.engine)
        app.dependency_overrides.clear()

    def test_create_and_get_claim(self):
        claim_payload = {
            "title": "Sub-50ms Inference on MCU",
            "claim": "The quantized 1D-CNN runs within 45ms per inference cycle on ESP32-S3.",
            "category": "Performance",
            "existing_solution": "Cloud-based telemetry processing takes 1200ms latency.",
            "proposed_solution": "Edge quantized 8-bit inference directly on microcontroller.",
            "expected_advantage": "26x faster anomaly detection and alert triggering.",
            "validation_question": "Does peak inference latency stay below 50ms across 100 consecutive runs?",
            "evidence_requirement": "Statistical telemetry latency measurements from ESP32.",
            "status": "VALIDATED",
            "confidence_indicator": "HIGH",
            "validation_type": "DIGITAL_TESTBED",
            "observed_result": "Observed mean latency of 42.4ms (+- 1.8ms) across 150 test cycles."
        }
        res = self.client.post("/api/v1/projects/1/validation/claims", json=claim_payload, headers=self.student_headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["title"], "Sub-50ms Inference on MCU")
        self.assertEqual(data["status"], "VALIDATED")
        self.assertEqual(data["validation_type"], "DIGITAL_TESTBED")
        claim_id = data["id"]

        # Get specific claim
        res_get = self.client.get(f"/api/v1/validation/claims/{claim_id}", headers=self.student_headers)
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["id"], claim_id)

    def test_claim_idor_protection(self):
        # Create claim as Alice
        claim_payload = {
            "title": "Energy Autonomy Claim",
            "claim": "System runs indefinitely on 2W solar panel under typical solar irradiance.",
            "category": "Feasibility",
            "validation_question": "Is daily energy intake > daily consumption in field operation?",
            "evidence_requirement": "Power profiling logs from continuous 7-day operation."
        }
        res = self.client.post("/api/v1/projects/1/validation/claims", json=claim_payload, headers=self.student_headers)
        self.assertEqual(res.status_code, 201)
        claim_id = res.json()["id"]

        # Bob (other user) tries to modify claim -> should be 403 Forbidden
        update_payload = {"title": "Hacked Title"}
        res_bob = self.client.put(f"/api/v1/validation/claims/{claim_id}", json=update_payload, headers=self.other_headers)
        self.assertEqual(res_bob.status_code, 403)

        # Bob tries to delete claim -> 403
        res_del_bob = self.client.delete(f"/api/v1/validation/claims/{claim_id}", headers=self.other_headers)
        self.assertEqual(res_del_bob.status_code, 403)

        # Bob tries to access validation matrix -> 403
        res_mat_bob = self.client.get("/api/v1/projects/1/validation", headers=self.other_headers)
        self.assertEqual(res_mat_bob.status_code, 403)

    def test_validation_matrix_evaluation(self):
        # Add 3 claims with different statuses
        c1 = {
            "title": "Claim 1: Accuracy",
            "claim": "Accuracy exceeds 95% on turbidity anomaly benchmark.",
            "category": "Accuracy",
            "validation_question": "Does accuracy exceed 95%?",
            "status": "VALIDATED",
            "confidence_indicator": "HIGH",
            "validation_type": "SOFTWARE_PROTOTYPE"
        }
        c2 = {
            "title": "Claim 2: Battery Life",
            "claim": "Battery lasts 14 days without sun under deep sleep profile.",
            "category": "Sustainability",
            "validation_question": "Does standby power allow 14 days runtime?",
            "status": "PARTIALLY_VALIDATED",
            "confidence_indicator": "MEDIUM",
            "validation_type": "SIMULATED"
        }
        c3 = {
            "title": "Claim 3: Cost Advantage",
            "claim": "Unit costs less than 25 USD in batch production.",
            "category": "Cost",
            "validation_question": "Can BOM be sourced below 25 USD?",
            "status": "NOT_TESTED",
            "confidence_indicator": "PRELIMINARY",
            "validation_type": "LITERATURE_SUPPORTED"
        }
        self.client.post("/api/v1/projects/1/validation/claims", json=c1, headers=self.student_headers)
        self.client.post("/api/v1/projects/1/validation/claims", json=c2, headers=self.student_headers)
        self.client.post("/api/v1/projects/1/validation/claims", json=c3, headers=self.student_headers)

        # Fetch Validation Matrix
        res = self.client.get("/api/v1/projects/1/validation", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["total_claims"], 3)
        self.assertEqual(data["validated_claims"], 1)
        self.assertEqual(data["partially_validated_claims"], 1)
        self.assertEqual(data["not_tested_claims"], 1)
        # Coverage: (1 + 0.5*1) / 3 * 100 = 50.0%
        self.assertEqual(data["evidence_coverage_pct"], 50.0)

        # Verify 8-dimensional Scorecard dimensions are present
        dimensions = {d["key"]: d for d in data["dimensions"]}
        self.assertIn("problem_validation", dimensions)
        self.assertIn("technical_validation", dimensions)
        self.assertIn("experimental_validation", dimensions)
        self.assertIn("benchmark_validation", dimensions)
        self.assertIn("hardware_validation", dimensions)
        self.assertIn("research_validation", dimensions)
        self.assertIn("reproducibility_validation", dimensions)
        self.assertIn("stakeholder_validation", dimensions)

        # Verify Gaps are identified
        self.assertGreaterEqual(len(data["gaps"]), 1)

    def test_differentiation_matrix(self):
        res = self.client.get("/api/v1/projects/1/innovation-comparison", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], 1)
        self.assertEqual(len(data["rows"]), 8)
        dimensions = [r["dimension"] for r in data["rows"]]
        self.assertIn("System Architecture", dimensions)
        self.assertIn("Detection Algorithm", dimensions)
        self.assertIn("Hardware Testbed", dimensions)

    def test_cost_and_scalability(self):
        # Add a cost item
        cost_payload = {
            "category": "Hardware",
            "item_name": "ESP32-S3 Microcontroller Module",
            "quantity": 2,
            "unit_cost": 450.0,
            "is_recurring": False,
            "is_estimated": False,
            "source_or_vendor": "Authorized Distributor",
            "currency": "INR",
            "notes": "Verified bulk pricing."
        }
        res = self.client.post("/api/v1/projects/1/validation/cost", json=cost_payload, headers=self.student_headers)
        self.assertEqual(res.status_code, 201)

        # Get cost analysis
        res_costs = self.client.get("/api/v1/projects/1/validation/cost", headers=self.student_headers)
        self.assertEqual(res_costs.status_code, 200)
        cdata = res_costs.json()
        self.assertGreaterEqual(cdata["total_prototype_cost"], 900.0)

        # Get scalability
        res_scale = self.client.get("/api/v1/projects/1/validation/scalability", headers=self.student_headers)
        self.assertEqual(res_scale.status_code, 200)
        sdata = res_scale.json()
        self.assertEqual(sdata["project_id"], 1)
        self.assertEqual(len(sdata["dimensions"]), 4)

    def test_stakeholder_reviews(self):
        review_payload = {
            "reviewer_name": "Dr. Sarah Johnson",
            "reviewer_role": "faculty",
            "problem_clarity_score": 9.0,
            "solution_feasibility_score": 8.5,
            "innovation_score": 8.8,
            "usability_score": 8.0,
            "feedback_text": "Strong experimental formulation with rigorous edge timing verification and sound hardware constraints.",
            "recommendations": ["Conduct field testing across multiple water sources", "Add battery temperature telemetry"],
            "evidence_attachment_url": "https://example.edu/reviews/sarah-review.pdf"
        }
        res = self.client.post("/api/v1/projects/1/validation/reviews", json=review_payload, headers=self.mentor_headers)
        self.assertEqual(res.status_code, 201)
        rdata = res.json()
        self.assertEqual(rdata["reviewer_name"], "Dr. Sarah Johnson")
        self.assertEqual(rdata["innovation_score"], 8.8)

        # List reviews
        res_list = self.client.get("/api/v1/projects/1/validation/reviews", headers=self.student_headers)
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()), 1)


if __name__ == "__main__":
    unittest.main()
