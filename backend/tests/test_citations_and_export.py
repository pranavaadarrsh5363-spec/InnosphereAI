import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestCitationsAndExport(unittest.TestCase):
    """
    Tests for scientific citation sync/formatting (IEEE, APA, BibTeX) and
    document exporters (LaTeX IEEEtran package, Markdown, Technical Report).
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

        # Ensure research doc exists
        cls.client.get(f"/api/v1/projects/{cls.project_id}/research", headers=cls.student_headers)

    def test_01_add_and_sync_citations(self):
        """Verify adding manual citation and automatic IEEE/APA/BibTeX generation."""
        cit_payload = {
            "title": "Attention Mechanisms for Temporal Telemetry Anomalies in IoT Networks",
            "authors": ["J. Vaswani", "A. Gomez", "L. Kaiser"],
            "year": 2024,
            "venue": "IEEE Transactions on Neural Networks and Learning Systems",
            "doi": "10.1109/TNNLS.2024.3389102",
            "source": "IEEE Xplore",
            "resource_type": "research_paper",
            "claim_tags": ["architecture", "temporal_attention"]
        }
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/research/citations",
            json=cit_payload,
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["title"], cit_payload["title"])
        self.assertIn("10.1109/TNNLS.2024.3389102", data["ieee_text"])
        self.assertIn("@article", data["bibtex"])
        self.assertTrue(data["is_verified"])

        # Check citation list
        res_list = self.client.get(f"/api/v1/projects/{self.project_id}/research/citations", headers=self.student_headers)
        self.assertEqual(res_list.status_code, 200)
        self.assertGreater(len(res_list.json()), 0)

    def test_02_export_latex_package(self):
        """Verify IEEEtran LaTeX package export with main.tex, references.bib, README.md."""
        res = self.client.post(f"/api/v1/projects/{self.project_id}/research/export/latex", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["template_type"], "IEEEtran")
        self.assertIn("\\documentclass[conference]{IEEEtran}", data["main_tex"])
        self.assertIn("\\section{Introduction}", data["main_tex"])
        self.assertIn("\\bibliography{references}", data["main_tex"])
        self.assertIn("@", data["references_bib"])
        self.assertIn("pdflatex main.tex", data["readme_md"])

    def test_03_export_bibtex(self):
        """Verify BibTeX export endpoint returns clean bibliography."""
        res = self.client.post(f"/api/v1/projects/{self.project_id}/research/export/bibtex", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total_citations"], 0)
        self.assertIn("references.bib", data["filename"])
        self.assertIn("@", data["bibtex_content"])

    def test_04_export_markdown(self):
        """Verify clean GitHub-flavored Markdown export."""
        res = self.client.post(f"/api/v1/projects/{self.project_id}/research/export/markdown", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("## Abstract", data["markdown_content"])
        self.assertIn("## 1. Introduction", data["markdown_content"])
        self.assertIn("## References", data["markdown_content"])

    def test_05_export_technical_report_19_sections(self):
        """Verify 19-section Institutional Technical Project Report generation."""
        res = self.client.post(f"/api/v1/projects/{self.project_id}/research/export/technical-report", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_sections"], 19)
        report = data["report_markdown"]
        self.assertIn("INSTITUTIONAL TECHNICAL PROJECT REPORT", report)
        self.assertIn("## 1. Executive Summary", report)
        self.assertIn("## 8. Hardware & Embedded Design", report)
        self.assertIn("## 14. Cost Analysis & Bill of Materials (BOM)", report)
        self.assertIn("## 19. Appendices", report)


if __name__ == "__main__":
    unittest.main()
