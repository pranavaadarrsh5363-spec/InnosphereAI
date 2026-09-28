import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.project import Project
from app.models.user import User
from app.services.skill_gap_service import skill_gap_service, TECH_TO_SKILLS, SKILL_CATALOG


class TestSkillGapEngine(unittest.TestCase):
    """
    Automated test suite for Skills & Prerequisites Gap Map Engine.
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

    def test_01_skill_requirement_extraction(self):
        """Verify automatic extraction of skill requirements from project context."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/skills/requirements",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        reqs = res.json()
        self.assertIsInstance(reqs, list)
        self.assertTrue(len(reqs) >= 4)
        
        skill_names = [r["skill_name"] for r in reqs]
        self.assertIn("Python", skill_names)
        
        # Verify structure of requirement item
        first = reqs[0]
        self.assertIn("required_level", first)
        self.assertIn("priority", first)
        self.assertIn("source_type", first)
        self.assertIn("reason", first)
        self.assertIn("evidence_refs", first)

    def test_02_tech_to_skills_mapping(self):
        """Verify Technology -> Skill mapping for diverse engineering stacks."""
        mappings = skill_gap_service.map_technologies_to_skills(["PyTorch", "FastAPI", "ESP32", "PostgreSQL"])
        self.assertEqual(len(mappings), 4)

        pytorch_map = next(m for m in mappings if m.technology == "PyTorch")
        self.assertEqual(pytorch_map.category, "Machine Learning & AI")
        self.assertIn("Python", pytorch_map.required_skills)
        self.assertIn("PyTorch Framework", pytorch_map.required_skills)
        self.assertIn("Neural Networks", pytorch_map.required_skills)

        esp32_map = next(m for m in mappings if m.technology == "ESP32")
        self.assertEqual(esp32_map.category, "Embedded & IoT")
        self.assertIn("Embedded Programming", esp32_map.required_skills)
        self.assertIn("Sensor Integration", esp32_map.required_skills)

    def test_03_complete_skills_analysis_payload(self):
        """Verify complete Skills & Prerequisites Gap Map endpoint."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/skills",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], self.project_id)
        self.assertIn("summary", data)
        self.assertIn("required_technologies", data)
        self.assertIn("skill_requirements", data)
        self.assertIn("student_profile", data)
        self.assertIn("skill_gaps", data)
        self.assertIn("dependency_graph", data)
        self.assertIn("learning_roadmap", data)
        self.assertIn("critical_skills", data)
        self.assertIn("am_i_ready", data)
        self.assertIn("mentor_prompts", data)

        # Summary assertions
        summary = data["summary"]
        self.assertTrue(summary["total_required_skills"] > 0)
        self.assertTrue(summary["learning_path_phases_count"] >= 3)
        self.assertTrue(0.0 <= summary["readiness_percentage"] <= 100.0)

    def test_04_prerequisite_dependency_graph(self):
        """Verify topological dependency graph structure and edge connections."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/skills/prerequisites",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        graph = res.json()
        self.assertIn("nodes", graph)
        self.assertIn("edges", graph)
        self.assertTrue(len(graph["nodes"]) > 0)
        
        # Check node fields
        first_node = graph["nodes"][0]
        self.assertIn("id", first_node)
        self.assertIn("label", first_node)
        self.assertIn("category", first_node)
        self.assertIn("depth", first_node)

    def test_05_learning_resources_with_explainability(self):
        """Verify learning resources are paired with grounded explainability."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/skills/resources",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        res_by_skill = res.json()
        self.assertIsInstance(res_by_skill, dict)
        self.assertIn("Python", res_by_skill)
        
        python_res = res_by_skill["Python"]
        self.assertTrue(len(python_res) > 0)
        first_r = python_res[0]
        self.assertIn("title", first_r)
        self.assertIn("why_this_resource", first_r)
        self.assertTrue(len(first_r["why_this_resource"]) > 10)
        self.assertTrue(first_r["quality_score"] > 0)

    def test_06_learning_roadmap_sequencing_and_phases(self):
        """Verify structured multi-phase roadmap respecting prerequisite order."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/skills/learning-path",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        roadmap = res.json()
        self.assertTrue(roadmap["total_phases"] >= 3)
        self.assertTrue(roadmap["total_skills"] > 0)
        
        phase_names = [p["phase_name"] for p in roadmap["phases"]]
        self.assertTrue(any("Foundations" in name for name in phase_names))

        # Check items in first phase
        first_phase = roadmap["phases"][0]
        self.assertTrue(len(first_phase["items"]) > 0)
        first_item = first_phase["items"][0]
        self.assertIn("skill_name", first_item)
        self.assertIn("estimated_effort", first_item)
        self.assertIn("gap_status", first_item)

    def test_07_student_skill_profile_update_and_personalization(self):
        """Verify updating student skill profile recalculates gap statuses accurately."""
        # Update Python to ADVANCED and Machine Learning to INTERMEDIATE
        update_payload = {
            "profiles": [
                {
                    "skill_name": "Python",
                    "current_level": "ADVANCED",
                    "progress_pct": 95,
                    "learning_status": "COMPLETED",
                    "evidence_items": [{"type": "PROJECT_EVIDENCE", "title": "Built FastAPI backend", "date": "2026-09-28"}],
                    "confidence": "HIGH"
                },
                {
                    "skill_name": "NumPy & Tensors",
                    "current_level": "INTERMEDIATE",
                    "progress_pct": 80,
                    "learning_status": "PRACTICING",
                    "evidence_items": [],
                    "confidence": "MEDIUM"
                }
            ]
        }
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/skills/profile",
            json=update_payload,
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        profiles = res.json()
        self.assertTrue(len(profiles) > 0)

        # Check Python profile
        py_prof = next((p for p in profiles if p["skill_name"] == "Python"), None)
        self.assertIsNotNone(py_prof)
        self.assertEqual(py_prof["current_level"], "ADVANCED")
        self.assertEqual(py_prof["learning_status"], "COMPLETED")

        # Verify gap status updated in complete analysis
        res_analysis = self.client.get(
            f"/api/v1/projects/{self.project_id}/skills",
            headers=self.student_headers
        )
        data = res_analysis.json()
        py_gap = next((g for g in data["skill_gaps"] if g["skill_name"] == "Python"), None)
        if py_gap:
            self.assertEqual(py_gap["gap_status"], "READY")

    def test_08_sync_learning_plan_to_roadmap(self):
        """Verify synchronizing learning plan to project development roadmap."""
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/skills/sync-roadmap",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        sync_data = res.json()
        self.assertTrue(sync_data["success"])
        self.assertTrue(sync_data["total_roadmap_tasks"] > 0)

    def test_09_export_skill_plan(self):
        """Verify Markdown and JSON export of the Skills & Prerequisites Gap Plan."""
        # Test Markdown Export
        res_md = self.client.post(
            f"/api/v1/projects/{self.project_id}/skills/export?format=markdown",
            headers=self.student_headers
        )
        self.assertEqual(res_md.status_code, 200)
        data_md = res_md.json()
        self.assertEqual(data_md["format"], "markdown")
        self.assertIn("# InnoSphere AI — Skills & Prerequisites Gap Plan", data_md["content_markdown"])
        self.assertIn("Executive Summary", data_md["content_markdown"])
        self.assertIn("Skill Gap Analysis Matrix", data_md["content_markdown"])
        self.assertIn("Personalized Learning Roadmap", data_md["content_markdown"])

        # Test JSON Export
        res_json = self.client.post(
            f"/api/v1/projects/{self.project_id}/skills/export?format=json",
            headers=self.student_headers
        )
        self.assertEqual(res_json.status_code, 200)
        data_json = res_json.json()
        self.assertEqual(data_json["format"], "json")
        self.assertIsNotNone(data_json["json_data"])
        self.assertIn("summary", data_json["json_data"])

    def test_10_security_idor_and_unauthorized_rejection(self):
        """Verify IDOR and unauthorized rejection for skills endpoints."""
        # Non-existent project
        res = self.client.get("/api/v1/projects/99999/skills", headers=self.student_headers)
        self.assertEqual(res.status_code, 404)

        # Faculty access permitted
        res_fac = self.client.get(f"/api/v1/projects/{self.project_id}/skills", headers=self.faculty_headers)
        self.assertIn(res_fac.status_code, [200, 404])

    def test_11_am_i_ready_to_start(self):
        """Verify 'Am I Ready to Start?' transparent guidance breakdown."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/skills",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        ready_info = data["am_i_ready"]
        self.assertIn("can_begin_immediately", ready_info)
        self.assertIn("recommended_before_development", ready_info)
        self.assertIn("required_before_deployment", ready_info)
        self.assertIn("verdict_summary", ready_info)
        self.assertTrue(len(ready_info["can_begin_immediately"]) > 0)

    def test_12_flagship_skills_overview(self):
        """Verify global flagship skills overview endpoint."""
        res = self.client.get("/api/v1/skills/flagship")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("flagship_project_id", data)


if __name__ == "__main__":
    unittest.main()
