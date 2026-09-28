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
from app.models.research import ResearchDocument
from app.models.validation import InnovationClaim, CompetitionChecklistItem
from app.api.auth import create_access_token


class TestCompetitionAndPresentation(unittest.TestCase):
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
            email="competitor@innosphere.edu",
            full_name="Eva Competitor",
            hashed_password="hashed_pw_test",
            role="student",
            is_active=True
        )
        self.project = Project(
            id=1,
            title="BioSense: Autonomous Water Quality Guardian",
            problem_statement="Municipal water distribution systems in rural regions lack continuous bio-threat detection.",
            proposed_solution="Dual-wavelength optical scattering sensor coupled with a micro-neural classifier on RISC-V hardware.",
            domain="Health & Environmental IoT",
            technologies=["C++", "FreeRTOS", "PyTorch", "LoRaWAN", "FastAPI"],
            status="experimentation",
            progress=80,
            user_id=1
        )
        # Add a simulated hardware device
        self.device = HardwareDevice(
            id=1,
            project_id=1,
            name="BioSense-Core-Node",
            device_type="ESP32-S3",
            status="online",
            is_simulating=True,
            network_protocol="LoRaWAN"
        )
        # Add a completed experiment
        self.experiment = Experiment(
            id=1,
            project_id=1,
            name="Optical Turbidity Classification Benchmarking",
            objective="Evaluate dual-wavelength optical classifier against traditional nephelometric turbidity units.",
            hypothesis="Dual-wavelength optical analysis identifies bacterial turbidity faster than single-beam meters.",
            dataset_used="WHO Potability Benchmark 2024",
            baseline_model="Single-Beam Linear Nephelometer",
            proposed_method="Dual-Wavelength Micro-CNN on RISC-V",
            status="COMPLETED",
            reproducibility_score=94.5
        )
        # Add research document
        self.research_doc = ResearchDocument(
            id=1,
            project_id=1,
            title="BioSense: Autonomous Real-Time Optical Water Quality Guardian",
            abstract="We present an autonomous, edge-intelligent sensing node for bacterial anomaly detection in rural municipal water supplies.",
            doc_type="research_paper",
            status="draft",
            methodology="Dual-beam optical scattered light analysis.",
            results="Initial accuracy: 96.5%."
        )
        # Add a claim
        self.claim = InnovationClaim(
            id=1,
            project_id=1,
            title="Optical Discrimination Accuracy",
            claim="Achieves 97.2% accuracy in distinguishing biological turbidity from inorganic sediment.",
            category="Accuracy",
            validation_question="Can the dual-wavelength model filter out sediment false-alarms?",
            evidence_requirement="Confusion matrix on 500 multi-sample test set.",
            status="VALIDATED",
            confidence_indicator="HIGH",
            validation_type="DIGITAL_TESTBED",
            observed_result="Empirical validation yielded 97.2% precision and 96.8% recall across 500 test vectors."
        )

        db.add_all([self.student, self.project, self.device, self.experiment, self.research_doc, self.claim])
        db.commit()
        db.close()

        self.student_token = create_access_token(data={"sub": "1", "email": "competitor@innosphere.edu", "role": "student"})
        self.student_headers = {"Authorization": f"Bearer {self.student_token}"}

    def tearDown(self):
        Base.metadata.drop_all(bind=self.engine)
        app.dependency_overrides.clear()

    def test_competition_readiness_evaluation(self):
        res = self.client.get("/api/v1/projects/1/competition-readiness", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], 1)
        self.assertIn(data["readiness_verdict"], ["EXEMPLARY_COMPETITION_READY", "STRONG_EVIDENCE_PROFILE", "PRELIMINARY_EVIDENCE_GAPS", "CRITICAL_EVIDENCE_MISSING"])
        self.assertGreaterEqual(data["overall_readiness_pct"], 0)
        self.assertEqual(len(data["pillars"]), 8)
        self.assertGreaterEqual(len(data["checklist"]), 8)

    def test_checklist_toggle(self):
        # Initial call generates checklist items
        res_init = self.client.get("/api/v1/projects/1/competition-readiness", headers=self.student_headers)
        item_id = res_init.json()["checklist"][0]["id"]

        # Toggle checklist item
        toggle_res = self.client.post(
            f"/api/v1/projects/1/competition-checklist/{item_id}/toggle",
            json={"status": "READY", "evidence_link": "https://innosphere.local/demo"},
            headers=self.student_headers
        )
        self.assertEqual(toggle_res.status_code, 200)
        updated = toggle_res.json()
        self.assertEqual(updated["status"], "READY")
        self.assertEqual(updated["evidence_link"], "https://innosphere.local/demo")

    def test_demo_readiness_probe(self):
        res = self.client.get("/api/v1/projects/1/demo-readiness", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], 1)
        self.assertTrue(data["is_demo_ready"])
        self.assertEqual(len(data["guided_steps"]), 8)
        steps = [s["step_number"] for s in data["guided_steps"]]
        self.assertEqual(steps, list(range(1, 9)))

    def test_presentation_outline_and_speaker_notes(self):
        res = self.client.post("/api/v1/projects/1/presentation/generate", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_slides"], 21)
        self.assertEqual(len(data["slides"]), 21)

        # Verify Slide Structure & Grounded Speaker Notes
        for slide in data["slides"]:
            self.assertIn("slide_number", slide)
            self.assertIn("title", slide)
            self.assertIn("bullet_points", slide)
            self.assertIn("speaker_notes", slide)
            self.assertGreater(len(slide["bullet_points"]), 0)
            self.assertGreater(len(slide["speaker_notes"]), 0)

        # Verify Slide 10 is Technology Stack & Slide 13 is Empirical Results
        slide_10 = next(s for s in data["slides"] if s["slide_number"] == 10)
        self.assertIn("Technology Stack", slide_10["title"])

        slide_13 = next(s for s in data["slides"] if s["slide_number"] == 13)
        self.assertIn("Empirical Results", slide_13["title"])

    def test_competition_workspace_full_consolidation(self):
        res = self.client.get("/api/v1/projects/1/competition/workspace", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        ws = res.json()

        # Check all core sections exist
        self.assertIn("project_overview", ws)
        self.assertIn("problem_definition", ws)
        self.assertIn("research_foundation", ws)
        self.assertIn("innovation_gap", ws)
        self.assertIn("proposed_solution", ws)
        self.assertIn("experimental_proof", ws)
        self.assertIn("validation_matrix", ws)
        self.assertIn("innovation_proof", ws)
        self.assertIn("hardware_readiness", ws)
        self.assertIn("impact", ws)
        self.assertIn("project_readiness", ws)
        self.assertIn("readiness_gaps", ws)
        self.assertIn("evaluator_questions", ws)
        self.assertIn("presentation", ws)
        self.assertIn("final_report", ws)
        self.assertIn("exports", ws)

        # Verify 21 slides in presentation
        self.assertEqual(ws["presentation"]["total_slides"], 21)
        self.assertEqual(len(ws["presentation"]["slides"]), 21)

        # Verify 16 sections in final report
        self.assertEqual(len(ws["final_report"]["sections"]), 16)

        # Verify hardware simulation disclaimer
        self.assertIn("simulation_disclaimer", ws["hardware_readiness"])

    def test_competition_workspace_idor_protection(self):
        # Create Student B
        db = self.TestingSessionLocal()
        student_b = User(
            id=2,
            email="other_student@innosphere.edu",
            full_name="Bob Other",
            hashed_password="hashed_pw_test",
            role="student",
            is_active=True
        )
        db.add(student_b)
        db.commit()
        db.close()

        b_token = create_access_token(data={"sub": "2", "email": "other_student@innosphere.edu", "role": "student"})
        b_headers = {"Authorization": f"Bearer {b_token}"}

        # Student B attempts to access Student A's project (ID: 1)
        res = self.client.get("/api/v1/projects/1/competition/workspace", headers=b_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("not authorized", res.json()["detail"].lower())

    def test_research_paper_sync(self):
        # Execute Sync
        res_sync = self.client.post(
            "/api/v1/projects/1/validation/sync-research",
            json={"target_doc_type": "research_paper", "overwrite_sections": False},
            headers=self.student_headers
        )
        self.assertEqual(res_sync.status_code, 200)
        sync_data = res_sync.json()
        self.assertEqual(sync_data["project_id"], 1)
        self.assertEqual(sync_data["claims_synced_count"], 1)
        self.assertIn("Optical Discrimination Accuracy", sync_data["markdown_validation_matrix"])
        self.assertIn("Optical Discrimination Accuracy", sync_data["latex_validation_matrix"])


if __name__ == "__main__":
    unittest.main()
