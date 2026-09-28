import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.services.knowledge_graph_service import KnowledgeGraphService


class TestKnowledgeGraphEngine(unittest.TestCase):
    """
    Automated test suite for Interactive AI Knowledge Graph Engine in InnoSphere AI.
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

    # =========================================================================
    # Test Cases
    # =========================================================================

    def test_01_get_knowledge_graph_generation(self):
        """1. Verifies knowledge graph auto-generation with nodes, edges, stats, and Mermaid."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["project_id"], self.project_id)
        self.assertIn("nodes", data)
        self.assertIn("edges", data)
        self.assertIn("stats", data)
        self.assertIn("diagnostics", data)
        self.assertIn("insights", data)
        self.assertGreater(len(data["nodes"]), 0)
        self.assertGreater(len(data["edges"]), 0)
        self.assertIn("graph TD", data["mermaid_source"])

    def test_02_node_category_extraction(self):
        """2. Verifies canonical entity extraction across categories (IDEA, PROBLEM, TECHNOLOGY, etc.)."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        nodes = res.json()["nodes"]
        categories = {n["category"] for n in nodes}

        self.assertIn("IDEA", categories)
        self.assertIn("PROBLEM", categories)
        self.assertTrue(any(cat in categories for cat in ["TECHNOLOGY", "HARDWARE", "RESEARCH_PAPER", "SKILL"]))

    def test_03_relationship_types_and_provenance(self):
        """3. Verifies semantic relationships and evidence provenance."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        edges = res.json()["edges"]
        rel_types = {e["relationship_type"] for e in edges}
        
        self.assertIn("ADDRESSES", rel_types)
        for e in edges:
            self.assertIn(e["provenance"], ["DIRECT", "DERIVED", "AI_SUGGESTED", "EMPIRICAL"])
            self.assertGreaterEqual(e["confidence"], 0.0)
            self.assertLessEqual(e["confidence"], 1.0)

    def test_04_graph_statistics_and_density(self):
        """4. Verifies topological graph metrics (density, degrees, connected components)."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        stats = res.json()["stats"]
        self.assertGreater(stats["total_nodes"], 0)
        self.assertGreater(stats["total_edges"], 0)
        self.assertGreaterEqual(stats["density"], 0.0)
        self.assertGreaterEqual(stats["average_degree"], 0.0)
        self.assertGreaterEqual(stats["connected_components_count"], 1)

    def test_05_diagnostics_and_completeness(self):
        """5. Verifies structural diagnostics and evidence grounding completeness."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph/diagnostics",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("completeness_score", data)
        self.assertGreaterEqual(data["completeness_score"], 0)
        self.assertLessEqual(data["completeness_score"], 100)
        self.assertIn("validation_coverage", data)
        self.assertIn("evidence_grounding_score", data)
        self.assertIn("recommendations", data)

    def test_06_ai_insights_and_critical_path(self):
        """6. Verifies AI graph insights, central nodes, and critical innovation paths."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph/insights",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("central_nodes", data)
        self.assertIn("critical_path", data)
        self.assertIn("key_hubs", data)
        self.assertIn("innovation_threads", data)
        self.assertIn("summary", data)
        self.assertGreater(len(data["critical_path"]), 0)

    def test_07_filtered_nodes_and_edges(self):
        """7. Verifies querying filtered nodes and edges."""
        # Query nodes by category
        res_nodes = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph/nodes?category=IDEA",
            headers=self.student_headers
        )
        self.assertEqual(res_nodes.status_code, 200)
        nodes = res_nodes.json()
        for n in nodes:
            self.assertEqual(n["category"], "IDEA")

        # Query edges
        res_edges = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph/edges",
            headers=self.student_headers
        )
        self.assertEqual(res_edges.status_code, 200)
        self.assertIsInstance(res_edges.json(), list)

    def test_08_multi_format_exports(self):
        """8. Verifies multi-format export endpoints (JSON, Mermaid, CSV, SVG)."""
        formats = ["json", "mermaid", "csv", "svg"]
        for fmt in formats:
            res = self.client.get(
                f"/api/v1/projects/{self.project_id}/knowledge-graph/export/{fmt}",
                headers=self.student_headers
            )
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["format"], fmt)
            self.assertIn("data", data)
            self.assertGreater(len(data["data"]), 10)

    def test_09_versioning_and_snapshots(self):
        """9. Verifies graph generation creates snapshots and lists version history."""
        # Force refresh to trigger new version snapshot
        res_gen = self.client.post(
            f"/api/v1/projects/{self.project_id}/knowledge-graph/generate",
            json={"force_refresh": True, "include_ai_suggestions": True},
            headers=self.student_headers
        )
        self.assertEqual(res_gen.status_code, 200)

        # Get versions
        res_ver = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph/versions",
            headers=self.student_headers
        )
        self.assertEqual(res_ver.status_code, 200)
        versions = res_ver.json()
        self.assertGreater(len(versions), 0)
        self.assertIn("content_hash", versions[0])
        self.assertIn("version_number", versions[0])

    def test_10_flagship_and_categories_endpoints(self):
        """10. Verifies global categories metadata and flagship project discovery endpoints."""
        res_cat = self.client.get("/api/v1/knowledge-graph/categories")
        self.assertEqual(res_cat.status_code, 200)
        cat_data = res_cat.json()
        self.assertIn("categories", cat_data)
        self.assertIn("relationships", cat_data)
        self.assertGreaterEqual(len(cat_data["categories"]), 16)

        res_flag = self.client.get("/api/v1/knowledge-graph/flagship", headers=self.student_headers)
        self.assertEqual(res_flag.status_code, 200)
        self.assertIn("nodes", res_flag.json())

    def test_11_idor_authorization(self):
        """11. Enforces IDOR authorization and invalid token checks."""
        # Non-existent project returns 404
        res_404 = self.client.get(
            "/api/v1/projects/999999/knowledge-graph",
            headers=self.student_headers
        )
        self.assertEqual(res_404.status_code, 404)

        # Invalid token returns 401
        res_invalid = self.client.get(
            f"/api/v1/projects/{self.project_id}/knowledge-graph",
            headers={"Authorization": "Bearer invalid_malformed_token"}
        )
        self.assertEqual(res_invalid.status_code, 401)


if __name__ == "__main__":
    unittest.main()
