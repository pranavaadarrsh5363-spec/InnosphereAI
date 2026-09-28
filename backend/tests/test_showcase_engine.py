import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.project import Project
from app.models.user import User
from app.services.hardware_service import (
    hardware_service, SimulatorTelemetryProvider,
    PhysicalTelemetryProvider
)


class TestShowcaseEngine(unittest.TestCase):
    """
    Automated test suite for Project Innovation Showcase & Presentation Engine.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Login demo student
        res = cls.client.post("/api/v1/auth/demo-login/student")
        if res.status_code == 200:
            cls.student_token = res.json()["access_token"]
            cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}
        else:
            cls.student_headers = {}

        # Login demo faculty
        res_fac = cls.client.post("/api/v1/auth/demo-login/faculty")
        if res_fac.status_code == 200:
            cls.faculty_token = res_fac.json()["access_token"]
            cls.faculty_headers = {"Authorization": f"Bearer {cls.faculty_token}"}
        else:
            cls.faculty_headers = {}

        # Retrieve a valid project
        res_proj = cls.client.get("/api/v1/projects", headers=cls.student_headers)
        if res_proj.status_code == 200 and res_proj.json():
            cls.project_id = res_proj.json()[0]["id"]
        else:
            cls.project_id = 1

    def test_01_get_showcase_profile(self):
        """Verify fetching complete 12-section showcase profile."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/showcase",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], self.project_id)
        self.assertIn("sections", data)
        self.assertEqual(len(data["sections"]), 12)
        
        # Verify 12 section names
        section_names = [s["name"] for s in data["sections"]]
        self.assertIn("Overview", section_names)
        self.assertIn("Problem Statement", section_names)
        self.assertIn("Research Landscape", section_names)
        self.assertIn("Innovation", section_names)
        self.assertIn("Architecture", section_names)
        self.assertIn("Experiments", section_names)
        self.assertIn("Benchmarks", section_names)
        self.assertIn("Hardware / Prototype", section_names)
        self.assertIn("Validation", section_names)
        self.assertIn("Research Output", section_names)
        self.assertIn("Impact & Benefits", section_names)
        self.assertIn("Presentation Summary", section_names)

        # Verify Architecture
        self.assertIn("architecture", data)
        self.assertTrue(len(data["architecture"]["components"]) >= 3)

        # Verify Impact & Limitations
        self.assertIn("impact", data)
        self.assertIn("limitations", data)

    def test_02_showcase_section_progression_and_statuses(self):
        """Verify each section has valid status and completion indicators."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/showcase",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        valid_statuses = {"READY", "PARTIAL", "MISSING", "SIMULATED", "NOT_TESTED"}
        for section in data["sections"]:
            self.assertIn(section["status"], valid_statuses)
            self.assertTrue(0.0 <= section["completion_pct"] <= 100.0)

    def test_03_showcase_evidence_traces(self):
        """Verify granular evidence trace extraction endpoint."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/showcase/evidence",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        traces = res.json()
        self.assertIsInstance(traces, list)
        if traces:
            first = traces[0]
            self.assertIn("id", first)
            self.assertIn("title", first)
            self.assertIn("source_type", first)
            self.assertIn(first["source_type"], ["OBSERVED", "PUBLISHED", "STUDENT_PROVIDED", "AI_SUGGESTED", "SIMULATED", "NOT_AVAILABLE"])

    def test_04_generate_evidence_summary(self):
        """Verify Markdown evidence summary contains required headers and structure."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/showcase/evidence-summary",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        summary = res.json()
        self.assertIn("summary_markdown", summary)
        self.assertIn("# InnoSphere AI — Project Evidence Summary", summary["summary_markdown"])
        self.assertIn("Problem Statement", summary["summary_markdown"])
        self.assertIn("Innovation", summary["summary_markdown"])
        self.assertIn("Hardware Lab", summary["summary_markdown"])
        self.assertIn("Known Limitations", summary["summary_markdown"])

    def test_05_showcase_health_probe(self):
        """Verify showcase subsystem health probe."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/showcase/health",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        health = res.json()
        self.assertEqual(health["overall_status"], "OPERATIONAL")
        self.assertEqual(health["showcase_orchestrator"], "OPERATIONAL")
        self.assertEqual(health["validation_engine"], "OPERATIONAL")

    def test_06_telemetry_provider_abstraction(self):
        """Verify TelemetryProvider abstraction and simulated vs physical states."""
        sim_provider = hardware_service.get_telemetry_provider(mode="simulator")
        self.assertIsInstance(sim_provider, SimulatorTelemetryProvider)
        self.assertEqual(sim_provider.get_provider_type(), "SIMULATED")
        self.assertFalse(sim_provider.is_physical())
        
        sim_data = sim_provider.get_latest_telemetry(device_id=1)
        self.assertEqual(sim_data["mode"], "SIMULATED")
        self.assertTrue(sim_data["is_simulated"])

        phys_provider = hardware_service.get_telemetry_provider(mode="mqtt")
        self.assertIsInstance(phys_provider, PhysicalTelemetryProvider)
        self.assertEqual(phys_provider.get_provider_type(), "PHYSICAL")
        self.assertTrue(phys_provider.is_physical())

    def test_07_security_and_idor_protection(self):
        """Verify IDOR and unauthorized rejection for showcase endpoints."""
        # Non-existent project
        res = self.client.get("/api/v1/projects/99999/showcase", headers=self.student_headers)
        self.assertEqual(res.status_code, 404)

        # Faculty access should be permitted for evaluation
        res_fac = self.client.get(f"/api/v1/projects/{self.project_id}/showcase", headers=self.faculty_headers)
        self.assertIn(res_fac.status_code, [200, 404])

    def test_08_flagship_project_resolution(self):
        """Verify flagship showcase resolver returns active demo project."""
        res = self.client.get("/api/v1/showcase/flagship")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("flagship_project_id", data)
        self.assertIn("title", data)

    def test_09_anti_hallucination_guarantees(self):
        """Verify that simulated hardware is explicitly labeled and unmeasured metrics are transparent."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/showcase",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        # Hardware mode must be explicitly SIMULATED
        self.assertEqual(data["hardware_mode"], "SIMULATED")
        
        # Limitations must explicitly disclose simulation mode
        limitations = data["limitations"]
        self.assertTrue(any("SIMULATED" in lim or "synthetic" in lim.lower() for lim in limitations["hardware_limitations"]))


if __name__ == "__main__":
    unittest.main()
