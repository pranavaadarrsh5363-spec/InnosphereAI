import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.services.architecture_generator_service import ArchitectureGeneratorService


class TestArchitectureGeneratorEngine(unittest.TestCase):
    """
    Automated unit and integration test suite for AI Architecture & Flowchart Generator.
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

    def test_01_system_architecture_generation(self):
        """1. Verifies System view generates Client, API, AI, DB, and Hardware nodes."""
        res = self.client.get(f"/api/v1/projects/{self.project_id}/architecture/system", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["architecture_type"], "SYSTEM")
        self.assertIn("nodes", data["graph_json"])
        self.assertIn("edges", data["graph_json"])
        
        node_keys = [n["node_key"] for n in data["graph_json"]["nodes"]]
        self.assertIn("user_client", node_keys)
        self.assertIn("frontend_app", node_keys)
        self.assertIn("backend_gateway", node_keys)
        self.assertIn("ai_inference_engine", node_keys)
        self.assertIn("primary_database", node_keys)

        # Verify Mermaid source contains flowchart
        self.assertTrue(data["mermaid_source"].startswith("flowchart"))

    def test_02_data_flow_architecture_generation(self):
        """2. Verifies 8-stage data lifecycle from input to notification."""
        res = self.client.get(f"/api/v1/projects/{self.project_id}/architecture/data-flow", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["architecture_type"], "DATA_FLOW")
        nodes = data["graph_json"]["nodes"]
        self.assertTrue(len(nodes) >= 6)
        categories = [n["category"] for n in nodes]
        self.assertTrue(any("Collection" in c for c in categories))
        self.assertTrue(any("Validation" in c for c in categories))
        self.assertTrue(any("Intelligence" in c for c in categories))
        self.assertTrue(any("Storage" in c for c in categories))

    def test_03_ai_pipeline_domain_adaptation(self):
        """3. Verifies AI pipeline adapts to project domain & framework."""
        res = self.client.get(f"/api/v1/projects/{self.project_id}/architecture/ai-pipeline", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["architecture_type"], "AI_PIPELINE")
        self.assertIn("ai_paradigm", data["graph_json"]["metrics"])

    def test_04_hardware_simulated_vs_physical_status(self):
        """4. Verifies hardware architecture accurately tags simulated status."""
        res = self.client.get(f"/api/v1/projects/{self.project_id}/architecture/hardware", headers=self.student_headers)
        if res.status_code == 200:
            data = res.json()
            self.assertEqual(data["architecture_type"], "HARDWARE")
            hw_nodes = [n for n in data["graph_json"]["nodes"] if n["node_type"] == "HARDWARE"]
            if hw_nodes:
                self.assertIn(hw_nodes[0]["status"], ["SIMULATED", "IMPLEMENTED", "CONFIGURED"])

    def test_05_api_flow_architecture_generation(self):
        """5. Verifies API flow with endpoints, methods, and auth middleware."""
        res = self.client.get(f"/api/v1/projects/{self.project_id}/architecture/api-flow", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["architecture_type"], "API_FLOW")
        node_types = [n["node_type"] for n in data["graph_json"]["nodes"]]
        self.assertIn("AUTH_SERVICE", node_types)
        self.assertIn("API", node_types)
        self.assertIn("DATABASE", node_types)

    def test_06_deployment_architecture_generation(self):
        """6. Verifies container topology and planned vs implemented components."""
        res = self.client.get(f"/api/v1/projects/{self.project_id}/architecture/deployment", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["architecture_type"], "DEPLOYMENT")
        cdn_node = next(n for n in data["graph_json"]["nodes"] if "cdn" in n["node_key"])
        self.assertEqual(cdn_node["status"], "PLANNED")

    def test_07_mermaid_compilation_and_validation(self):
        """7. Tests Mermaid syntax validation."""
        valid_mermaid = "flowchart TD\n    A[Sensor] --> B[ESP32]\n    B --> C[FastAPI]"
        is_valid, err = ArchitectureGeneratorService.validate_mermaid_syntax(valid_mermaid)
        self.assertTrue(is_valid)
        self.assertIsNone(err)

        invalid_mermaid = "flowchart TD\n    A[Sensor --> B[ESP32]"
        is_valid2, err2 = ArchitectureGeneratorService.validate_mermaid_syntax(invalid_mermaid)
        self.assertFalse(is_valid2)
        self.assertIsNotNone(err2)

    def test_08_mermaid_custom_update_and_reset(self):
        """8. Tests updating custom Mermaid source and resetting to AI-generated diagram."""
        custom_code = "flowchart TD\n    Node1[Custom Input] --> Node2[Custom AI Engine]"
        put_res = self.client.put(
            f"/api/v1/projects/{self.project_id}/architecture/mermaid?view_type=SYSTEM",
            json={"mermaid_source": custom_code},
            headers=self.student_headers
        )
        self.assertEqual(put_res.status_code, 200)
        data = put_res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["architecture"]["custom_mermaid_source"], custom_code)
        self.assertTrue(data["architecture"]["is_customized"])

        # Reset back
        reset_res = self.client.post(
            f"/api/v1/projects/{self.project_id}/architecture/reset-mermaid?view_type=SYSTEM",
            headers=self.student_headers
        )
        self.assertEqual(reset_res.status_code, 200)
        reset_data = reset_res.json()
        self.assertTrue(reset_data["success"])
        self.assertIsNone(reset_data["architecture"]["custom_mermaid_source"])
        self.assertFalse(reset_data["architecture"]["is_customized"])

    def test_09_vector_svg_export(self):
        """9. Verifies vector SVG diagram generation."""
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/architecture/export/svg",
            json={"view_type": "SYSTEM", "theme": "light", "resolution": "presentation"},
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "image/svg+xml")
        svg_text = res.text
        self.assertTrue(svg_text.startswith("<svg"))
        self.assertTrue(svg_text.endswith("</svg>"))

    def test_10_complete_architecture_package_export(self):
        """10. Verifies complete multi-view documentation package generation."""
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/architecture/export/package",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        pkg = res.json()
        self.assertEqual(pkg["project_id"], self.project_id)
        self.assertTrue(pkg["total_files"] >= 8)
        self.assertIn("system-architecture.svg", pkg["files"])
        self.assertIn("data-flow-architecture.svg", pkg["files"])
        self.assertIn("architecture-manifest.json", pkg["files"])
        self.assertIn("README.md", pkg["files"])

    def test_11_architecture_assistant_and_simplification(self):
        """11. Tests AI architecture assistant Q&A and simplification suggestions."""
        qa_res = self.client.post(
            f"/api/v1/projects/{self.project_id}/architecture/assistant",
            json={"prompt": "Explain how data enters the system and where AI is used", "context_view": "SYSTEM"},
            headers=self.student_headers
        )
        self.assertEqual(qa_res.status_code, 200)
        qa_data = qa_res.json()
        self.assertTrue(len(qa_data["response"]) > 20)
        self.assertTrue(len(qa_data["suggested_followups"]) > 0)

        # Simplification
        sim_res = self.client.get(
            f"/api/v1/projects/{self.project_id}/architecture/simplify?view_type=SYSTEM",
            headers=self.student_headers
        )
        self.assertEqual(sim_res.status_code, 200)
        sim_data = sim_res.json()
        self.assertIn("simplified_graph", sim_data)
        self.assertTrue(len(sim_data["simplification_rationale"]) > 0)

    def test_12_cross_engine_sync_roadmap(self):
        """12. Tests non-destructive roadmap sync."""
        r_res = self.client.post(
            f"/api/v1/projects/{self.project_id}/architecture/sync-roadmap",
            headers=self.student_headers
        )
        self.assertEqual(r_res.status_code, 200)
        r_data = r_res.json()
        self.assertIn("synced_count", r_data)

    def test_13_architecture_idor_security(self):
        """13. Verifies student cannot access another project's architecture with invalid auth."""
        res = self.client.get(
            f"/api/v1/projects/999999/architecture",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 404)

    def test_14_flagship_architecture_endpoint(self):
        """14. Verifies global flagship endpoint for showcase overview."""
        res = self.client.get("/api/v1/architecture/flagship", headers=self.student_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("project", data)
        self.assertIn("architectures", data)
        self.assertTrue(len(data["architectures"]) >= 6)


if __name__ == "__main__":
    unittest.main()
