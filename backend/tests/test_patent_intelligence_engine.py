import unittest
from fastapi.testclient import TestClient

from app.main import app


class TestPatentIntelligenceEngine(unittest.TestCase):
    """
    Automated test suite for AI Patent & Prior-Art Intelligence Engine in InnoSphere AI.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

        # Login demo student
        res_stu = cls.client.post("/api/v1/auth/demo-login/student")
        if res_stu.status_code == 200:
            cls.student_token = res_stu.json()["access_token"]
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

        cls.sample_patent_id = None
        cls.search_id = None

    # =========================================================================
    # Test Cases
    # =========================================================================

    def test_01_provider_status_and_flagship_patents(self):
        """1. Verifies provider registry status and flagship patent database."""
        res = self.client.get("/api/v1/patents/providers", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        providers = res.json()
        self.assertIsInstance(providers, list)
        self.assertGreater(len(providers), 0)
        provider_names = [p["provider_name"] for p in providers]
        self.assertIn("Open Patent Registry", provider_names)
        self.assertIn("Google Patents", provider_names)

        # Flagship patents search
        res_flag = self.client.get("/api/v1/patents/flagship", headers=self.student_headers)
        self.assertEqual(res_flag.status_code, 200)
        data = res_flag.json()
        self.assertIn("results", data)
        self.assertGreater(len(data["results"]), 0)
        first_patent = data["results"][0]["patent"]
        self.assertIn("publication_number", first_patent)
        self.assertIn("abstract", first_patent)
        TestPatentIntelligenceEngine.sample_patent_id = first_patent["id"]

    def test_02_concept_and_technical_feature_extraction(self):
        """2. Verifies AI technical concept and feature extraction for an innovation project."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/patents/concepts",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("problem", data)
        self.assertIn("technologies", data)
        self.assertIn("components", data)
        self.assertIn("novel_features", data)
        self.assertIn("generated_search_queries", data)
        self.assertIn("legal_disclaimer", data)
        self.assertGreater(len(data["technologies"]), 0)

    def test_03_execute_patent_search_and_similarity(self):
        """3. Verifies multi-stage prior-art search, similarity scoring, and why_similar rationale."""
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/patents/search",
            json={"limit": 8, "force_refresh": True},
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], self.project_id)
        self.assertIn("results", data)
        self.assertIn("legal_disclaimer", data)
        self.assertGreater(len(data["results"]), 0)
        
        TestPatentIntelligenceEngine.search_id = data["id"]
        first_res = data["results"][0]
        self.assertIn("technical_similarity_score", first_res)
        self.assertIn("why_similar", first_res)
        self.assertIn("potential_differences", first_res)
        self.assertIn("feature_overlap_level", first_res)
        self.assertIn(first_res["feature_overlap_level"], ["HIGH", "MODERATE", "LOW", "MINIMAL"])

    def test_04_get_patent_document_details(self):
        """4. Verifies fetching structured patent document with claims and family metadata."""
        if not self.sample_patent_id:
            res_flag = self.client.get("/api/v1/patents/flagship", headers=self.student_headers)
            TestPatentIntelligenceEngine.sample_patent_id = res_flag.json()["results"][0]["patent"]["id"]

        self.assertIsNotNone(self.sample_patent_id)
        res = self.client.get(
            f"/api/v1/patents/{self.sample_patent_id}",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        doc = res.json()
        self.assertEqual(doc["id"], self.sample_patent_id)
        self.assertIn("publication_number", doc)
        self.assertIn("title", doc)

    def test_05_get_patent_claims_tree(self):
        """5. Verifies structured claim extraction, independent vs dependent claim types."""
        if not self.sample_patent_id:
            res_flag = self.client.get("/api/v1/patents/flagship", headers=self.student_headers)
            TestPatentIntelligenceEngine.sample_patent_id = res_flag.json()["results"][0]["patent"]["id"]

        self.assertIsNotNone(self.sample_patent_id)
        res = self.client.get(
            f"/api/v1/patents/{self.sample_patent_id}/claims",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        claims = res.json()
        self.assertIsInstance(claims, list)
        self.assertGreater(len(claims), 0)
        self.assertTrue(claims[0]["is_independent"])
        self.assertIn("extracted_features", claims[0])

    def test_06_get_patent_family_members(self):
        """6. Verifies multi-jurisdictional family resolution across patent offices."""
        if not self.sample_patent_id:
            res_flag = self.client.get("/api/v1/patents/flagship", headers=self.student_headers)
            TestPatentIntelligenceEngine.sample_patent_id = res_flag.json()["results"][0]["patent"]["id"]

        self.assertIsNotNone(self.sample_patent_id)
        res = self.client.get(
            f"/api/v1/patents/{self.sample_patent_id}/family",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        family = res.json()
        if family:
            self.assertIn("family_id", family)
            self.assertIn("jurisdictions", family)

    def test_07_side_by_side_comparison_matrix(self):
        """7. Verifies side-by-side feature comparison matrix between project and prior-art."""
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/patents/compare",
            json={"patent_ids": [self.sample_patent_id] if self.sample_patent_id else []},
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        matrix = res.json()
        self.assertEqual(matrix["project_id"], self.project_id)
        self.assertIn("compared_patents", matrix)
        self.assertIn("rows", matrix)
        self.assertIn("legal_disclaimer", matrix)

    def test_08_prior_art_timeline(self):
        """8. Verifies chronological prior-art evolution timeline."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/patents/timeline",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        timeline = res.json()
        self.assertEqual(timeline["project_id"], self.project_id)
        self.assertIn("events", timeline)
        self.assertIn("summary", timeline)
        self.assertIn("legal_disclaimer", timeline)

    def test_09_technology_landscape(self):
        """9. Verifies technology landscape clustering across CPC classes and assignees."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/patents/landscape",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        landscape = res.json()
        self.assertEqual(landscape["project_id"], self.project_id)
        self.assertIn("clusters", landscape)
        self.assertIn("technology_distribution", landscape)
        self.assertIn("jurisdiction_distribution", landscape)
        self.assertIn("legal_disclaimer", landscape)

    def test_10_saved_prior_art_and_research_citation_sync(self):
        """10. Verifies bookmarking prior-art and 1-click sync to Research Workspace citations."""
        if not self.sample_patent_id:
            res_flag = self.client.get("/api/v1/patents/flagship", headers=self.student_headers)
            TestPatentIntelligenceEngine.sample_patent_id = res_flag.json()["results"][0]["patent"]["id"]

        self.assertIsNotNone(self.sample_patent_id)
        
        # Save prior art
        save_res = self.client.post(
            f"/api/v1/projects/{self.project_id}/patents/{self.sample_patent_id}/save",
            json={"notes": "Key benchmark prior art for edge telemetry anomaly detection", "why_saved": "Relevant baseline"},
            headers=self.student_headers
        )
        self.assertEqual(save_res.status_code, 200)
        saved_item = save_res.json()
        self.assertEqual(saved_item["patent_id"], self.sample_patent_id)

        # Get saved prior art
        list_res = self.client.get(
            f"/api/v1/projects/{self.project_id}/patents/saved",
            headers=self.student_headers
        )
        self.assertEqual(list_res.status_code, 200)
        saved_list = list_res.json()
        self.assertGreater(len(saved_list), 0)

        # 1-Click Sync to Research Citations
        sync_res = self.client.post(
            f"/api/v1/projects/{self.project_id}/patents/{self.sample_patent_id}/sync-research",
            headers=self.student_headers
        )
        self.assertEqual(sync_res.status_code, 200)
        sync_data = sync_res.json()
        self.assertTrue(sync_data["success"])
        self.assertIn("citation_id", sync_data)

    def test_11_search_coverage_and_limitations(self):
        """11. Verifies search coverage score, database audit, and limitation diagnostics."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/patents/coverage",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        cov = res.json()
        self.assertEqual(cov["project_id"], self.project_id)
        self.assertIn("coverage_score", cov)
        self.assertIn("stages", cov)
        self.assertIn("providers_status", cov)
        self.assertIn("limitations", cov)
        self.assertIn("recommendations", cov)
        self.assertIn("legal_disclaimer", cov)

    def test_12_ai_prior_art_assistant(self):
        """12. Verifies AI prior-art Q&A assistant with grounded responses and disclaimers."""
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/patents/assistant",
            json={"prompt": "How does our edge filtering differ from prior art?"},
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        ans = res.json()
        self.assertIn("answer", ans)
        self.assertIn("grounded_patents", ans)
        self.assertIn("legal_disclaimer", ans)

    def test_13_multi_format_exports(self):
        """13. Verifies Markdown, JSON, CSV, and Vector SVG export generators."""
        formats = ["markdown", "json", "csv", "svg"]
        for fmt in formats:
            res = self.client.get(
                f"/api/v1/projects/{self.project_id}/patents/export/{fmt}",
                headers=self.student_headers
            )
            self.assertEqual(res.status_code, 200, f"Export format {fmt} failed")
            data = res.json()
            self.assertEqual(data["format"], fmt)
            self.assertIn("data", data)
            self.assertIn("filename", data)
            self.assertIn("legal_disclaimer", data)
            self.assertGreater(len(data["data"]), 0)

    def test_14_legal_disclaimer_mandatory_presence(self):
        """14. Verifies that legal safety disclaimers are present in responses and exports."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/patents/coverage",
            headers=self.student_headers
        )
        self.assertIn("does not provide legal advice", res.json()["legal_disclaimer"].lower())

        export_res = self.client.get(
            f"/api/v1/projects/{self.project_id}/patents/export/markdown",
            headers=self.student_headers
        )
        self.assertIn("legal", export_res.json()["data"].lower())

    def test_15_authorization_and_unauthorized_access(self):
        """15. Verifies access control and rejection of invalid authentication token."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/patents",
            headers={"Authorization": "Bearer invalid_malformed_token_12345"}
        )
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()
