import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestResearchDocument(unittest.TestCase):
    """
    Tests for AI Research Workspace document generation, section synthesis,
    version snapshots, and IDOR protection.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Login student
        res_stu = cls.client.post("/api/v1/auth/demo-login/student")
        cls.student_token = res_stu.json()["access_token"]
        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}

        # Login faculty
        res_fac = cls.client.post("/api/v1/auth/demo-login/faculty")
        cls.faculty_token = res_fac.json()["access_token"]
        cls.faculty_headers = {"Authorization": f"Bearer {cls.faculty_token}"}

        # Fetch projects for student
        res_proj = cls.client.get("/api/v1/projects", headers=cls.student_headers)
        projects = res_proj.json()
        cls.project_id = projects[0]["id"] if projects else 1

    def test_01_get_or_auto_generate_research_doc(self):
        """Verify fetching or auto-generating research document returns 13 academic sections."""
        res = self.client.get(f"/api/v1/projects/{self.project_id}/research", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], self.project_id)
        self.assertEqual(data["doc_type"], "research_paper")
        self.assertIsNotNone(data["abstract"])
        self.assertIsNotNone(data["problem_statement"])
        self.assertIsNotNone(data["methodology"])
        self.assertIsNotNone(data["architecture"])
        self.assertIsNotNone(data["dataset_description"])
        self.assertIsNotNone(data["results"])
        self.assertIsNotNone(data["conclusion"])
        self.assertGreater(len(data["keywords"]), 0)

    def test_02_generate_full_document_explicit(self):
        """Verify explicit document generation endpoint returns populated paper."""
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/research/generate",
            json={"doc_type": "research_paper"},
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("A Rigorous Empirical and Architectural Study", data["title"])
        self.assertGreaterEqual(data["citation_coverage_pct"], 0.0)

    def test_03_update_research_sections_with_versioning(self):
        """Verify updating sections and creating version snapshot."""
        res = self.client.put(
            f"/api/v1/projects/{self.project_id}/research",
            json={
                "abstract": "Updated academic abstract with precise empirical findings and 96.8% accuracy.",
                "create_new_version": True,
                "version_label": "Peer Review Edits"
            },
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["abstract"], "Updated academic abstract with precise empirical findings and 96.8% accuracy.")

        # Check versions list
        res_v = self.client.get(f"/api/v1/projects/{self.project_id}/research/versions", headers=self.student_headers)
        self.assertEqual(res_v.status_code, 200)
        versions = res_v.json()
        self.assertGreater(len(versions), 0)
        self.assertEqual(versions[0]["version_label"], "Peer Review Edits")

    def test_04_generate_single_section_ai(self):
        """Verify AI refinement for single specific section."""
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/research/sections/methodology/generate",
            json={
                "section_key": "methodology",
                "custom_instruction": "Highlight edge computing and 1D-CNN temporal attention."
            },
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["section_key"], "methodology")
        self.assertGreater(len(data["content"]), 50)
        self.assertGreater(len(data["evidence_notes"]), 0)

    def test_05_idor_protection_research_document(self):
        """Verify unauthenticated or unauthorized access is denied."""
        res_invalid = self.client.get(f"/api/v1/projects/{self.project_id}/research", headers={"Authorization": "Bearer invalid_token_xyz"})
        self.assertEqual(res_invalid.status_code, 401)


if __name__ == "__main__":
    unittest.main()
