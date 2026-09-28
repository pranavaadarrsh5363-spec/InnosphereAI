import unittest
from fastapi.testclient import TestClient

from app.main import app


class TestResourceMatchmakerEngine(unittest.TestCase):
    """
    Automated test suite for AI Resource Matchmaker & Intelligent Resource Allocation Engine.
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

        cls.created_req_id = None
        cls.created_plan_id = None

    # =========================================================================
    # Test Cases
    # =========================================================================

    def test_01_global_flagship_and_health(self):
        """1. Verifies health diagnostics and flagship resource workspace."""
        res_health = self.client.get("/api/v1/resource-matchmaker/health")
        self.assertEqual(res_health.status_code, 200)
        health = res_health.json()
        self.assertIn("status", health)
        self.assertIn("components", health)
        self.assertIn("requirement_extraction", health["components"])

        res_flag = self.client.get("/api/v1/resource-matchmaker/flagship", headers=self.student_headers)
        self.assertEqual(res_flag.status_code, 200)
        flag = res_flag.json()
        self.assertIn("project_title", flag)
        self.assertIn("profile", flag)
        self.assertIn("matches", flag)
        self.assertIn("bundles", flag)
        self.assertIn("budget_summary", flag)
        self.assertIn("kpis", flag)

    def test_02_workspace_initialization_and_requirements(self):
        """2. Verifies complete workspace retrieval and auto-extracted requirements."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        ws = res.json()
        self.assertIn("profile", ws)
        self.assertIn("requirements", ws)
        self.assertIn("matches", ws)
        self.assertIn("bundles", ws)
        self.assertIn("budget_summary", ws)
        self.assertIn("readiness", ws)

        # Requirements endpoint
        res_req = self.client.get(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/requirements",
            headers=self.student_headers
        )
        self.assertEqual(res_req.status_code, 200)
        reqs = res_req.json()
        self.assertIsInstance(reqs, list)
        self.assertGreater(len(reqs), 0)

    def test_03_create_and_update_custom_requirement(self):
        """3. Verifies adding, updating, and deleting custom resource requirements."""
        payload = {
            "name": "Low-Power LoRa Transceiver Module (SX1262)",
            "category": "HARDWARE",
            "description": "Long range RF communication link for rural crop sensing",
            "priority": "HIGH",
            "is_hard_constraint": True,
            "status": "USER_CONFIRMED",
            "specs_json": {"voltage": "3.3V", "frequency": "868/915 MHz"}
        }
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/requirements",
            json=payload,
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        req = res.json()
        self.assertEqual(req["name"], payload["name"])
        self.assertEqual(req["status"], "USER_CONFIRMED")
        TestResourceMatchmakerEngine.created_req_id = req["id"]

        # Update requirement
        res_up = self.client.put(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/requirements/{req['id']}",
            json={"priority": "CRITICAL", "description": "Critical long range RF link"},
            headers=self.student_headers
        )
        self.assertEqual(res_up.status_code, 200)
        self.assertEqual(res_up.json()["priority"], "CRITICAL")

    def test_04_profile_update_and_budget_constraints(self):
        """4. Verifies updating student profile, compute preferences, owned hardware, and skills."""
        profile_data = {
            "total_budget": 5000.0,
            "currency": "INR",
            "hardware_budget": 3000.0,
            "software_budget": 0.0,
            "cloud_budget": 500.0,
            "dataset_budget": 0.0,
            "monthly_recurring_budget": 200.0,
            "open_source_preference": "STRICT_OPEN_SOURCE",
            "offline_preference": "OFFLINE_FIRST",
            "compute_preferences_json": {"target": "Edge / Microcontroller", "ram_min_mb": 512},
            "owned_hardware": [
                {
                    "name": "ESP32 DevKit V1",
                    "category": "Microcontroller",
                    "quantity": 1,
                    "condition": "GOOD",
                    "ownership_status": "OWNED",
                    "interfaces_json": ["GPIO", "I2C", "SPI", "UART", "WiFi", "BLE"],
                    "specs_json": {"flash_mb": 4, "sram_kb": 520}
                }
            ],
            "skills": [
                {
                    "skill_name": "C++ / Arduino",
                    "proficiency_level": "INTERMEDIATE",
                    "willing_to_learn": True
                },
                {
                    "skill_name": "Python / MicroPython",
                    "proficiency_level": "ADVANCED",
                    "willing_to_learn": True
                }
            ]
        }
        res = self.client.put(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/profile",
            json=profile_data,
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        prof = res.json()
        self.assertEqual(prof["total_budget"], 5000.0)
        self.assertEqual(prof["open_source_preference"], "STRICT_OPEN_SOURCE")
        self.assertEqual(len(prof["owned_hardware"]), 1)
        self.assertEqual(len(prof["skills"]), 2)

    def test_05_execute_resource_matching_and_scoring(self):
        """5. Verifies executing multi-dimensional matching engine and evaluating match scores."""
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/match",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        matches = res.json()
        self.assertIsInstance(matches, list)
        self.assertGreater(len(matches), 0)

        # Check multi-dimensional score components on top match
        top_match = matches[0]
        self.assertIn("resource_name", top_match)
        self.assertIn("overall_match_score", top_match)
        self.assertIn("project_relevance_score", top_match)
        self.assertIn("budget_fit_score", top_match)
        self.assertIn("hardware_fit_score", top_match)
        self.assertIn("skill_fit_score", top_match)
        self.assertIn("why_matched_json", top_match)
        self.assertIn("price_evidence_status", top_match)
        self.assertIn("match_category", top_match)
        self.assertIsInstance(top_match["why_matched_json"], list)
        self.assertGreater(len(top_match["why_matched_json"]), 0)

    def test_06_get_matches_and_alternatives(self):
        """6. Verifies retrieving ranked matches and open-source / low-cost substitute recommendations."""
        res_matches = self.client.get(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/matches",
            headers=self.student_headers
        )
        self.assertEqual(res_matches.status_code, 200)
        matches = res_matches.json()
        self.assertGreater(len(matches), 0)

        res_alts = self.client.get(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/alternatives",
            headers=self.student_headers
        )
        self.assertEqual(res_alts.status_code, 200)
        alts = res_alts.json()
        self.assertIsInstance(alts, list)

    def test_07_curated_resource_bundles(self):
        """7. Verifies Low-Cost, Balanced, and High-Performance curated resource bundles."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/bundles",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        bundles = res.json()
        self.assertIsInstance(bundles, list)
        bundle_types = [b["bundle_type"] for b in bundles]
        self.assertIn("LOW_COST", bundle_types)
        self.assertIn("BALANCED", bundle_types)
        self.assertIn("HIGH_PERFORMANCE", bundle_types)

        low_cost = next(b for b in bundles if b["bundle_type"] == "LOW_COST")
        self.assertIn("items_json", low_cost)
        self.assertGreater(len(low_cost["items_json"]), 0)

    def test_08_budget_tracker_and_category_breakdown(self):
        """8. Verifies budget planner breakdown, category allocation, and utilization."""
        res = self.client.get(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/budget",
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        b = res.json()
        self.assertIn("total_budget", b)
        self.assertIn("allocated_budget", b)
        self.assertIn("remaining_budget", b)
        self.assertIn("breakdown_by_category", b)
        self.assertIn("recurring_monthly_total", b)
        self.assertIn("potential_savings_via_alternatives", b)

    def test_09_resource_plan_items_crud_and_linkages(self):
        """9. Verifies CRUD operations for actionable resource plan items with foreign linkages."""
        plan_payload = {
            "resource_name": "DHT22 Digital Temperature & Humidity Sensor",
            "resource_category": "HARDWARE",
            "purpose": "Precise atmospheric temperature & humidity logging",
            "quantity": 1,
            "estimated_cost": 380.0,
            "currency": "INR",
            "source_name": "Open Hardware",
            "source_url": "https://www.adafruit.com/product/385",
            "availability_status": "PURCHASE_REQUIRED",
            "plan_status": "RECOMMENDED",
            "notes": "Verified compatible with 3.3V GPIO on ESP32."
        }
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/plan",
            json=plan_payload,
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        plan_item = res.json()
        self.assertEqual(plan_item["resource_name"], plan_payload["resource_name"])
        TestResourceMatchmakerEngine.created_plan_id = plan_item["id"]

        # Update status
        res_up = self.client.put(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/plan/{plan_item['id']}",
            json={"plan_status": "SHORTLISTED", "notes": "Shortlisted for procurement in phase 1"},
            headers=self.student_headers
        )
        self.assertEqual(res_up.status_code, 200)
        self.assertEqual(res_up.json()["plan_status"], "SHORTLISTED")

        # List plan items
        res_list = self.client.get(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/plan",
            headers=self.student_headers
        )
        self.assertEqual(res_list.status_code, 200)
        self.assertGreater(len(res_list.json()), 0)

    def test_10_what_if_scenario_simulation(self):
        """10. Verifies dynamic recalculation of allocations under hypothetical constraints."""
        what_if_query = {
            "scenario_name": "Budget Cut to ₹3,000",
            "adjusted_budget": 3000.0,
            "open_source_only": True,
            "offline_only": True,
            "student_skill_level": "BEGINNER"
        }
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/what-if",
            json=what_if_query,
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        sim = res.json()
        self.assertIn("scenario_description", sim)
        self.assertIn("budget_impact", sim)
        self.assertIn("capability_changes", sim)
        self.assertIn("recommended_stack", sim)
        self.assertIn("tradeoffs", sim)

    def test_11_ai_resource_matchmaker_assistant(self):
        """11. Verifies grounded AI Assistant responses for resource allocation queries."""
        query_payload = {
            "prompt": "Can I run this machine learning model locally on an ESP32 or Raspberry Pi within my INR 5,000 budget?",
            "context_resource_name": "ESP32 Board"
        }
        res = self.client.post(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker/assistant",
            json=query_payload,
            headers=self.student_headers
        )
        self.assertEqual(res.status_code, 200)
        ans = res.json()
        self.assertIn("answer", ans)
        self.assertIn("suggested_actions", ans)
        self.assertIn("evidence_disclaimer", ans)
        self.assertGreater(len(ans["answer"]), 20)

    def test_12_multi_format_exports(self):
        """12. Verifies export formats: Markdown, JSON, CSV, SVG."""
        for fmt in ["markdown", "json", "csv", "svg"]:
            res = self.client.get(
                f"/api/v1/projects/{self.project_id}/resource-matchmaker/export/{fmt}",
                headers=self.student_headers
            )
            self.assertEqual(res.status_code, 200)
            exp = res.json()
            self.assertEqual(exp["format"], fmt)
            self.assertIn("data", exp)
            self.assertGreater(len(exp["data"]), 0)

    def test_13_idor_and_access_control(self):
        """13. Verifies unauthorized users cannot manipulate or view another student's resource workspace."""
        # Unauthenticated request with invalid token
        res_unauth = self.client.get(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker",
            headers={"Authorization": "Bearer invalid_expired_or_forged_jwt_token"}
        )
        self.assertEqual(res_unauth.status_code, 401)

        # Faculty should have read/write access to supervise
        res_fac = self.client.get(
            f"/api/v1/projects/{self.project_id}/resource-matchmaker",
            headers=self.faculty_headers
        )
        self.assertEqual(res_fac.status_code, 200)

        # Non-existent project
        res_not_found = self.client.get(
            "/api/v1/projects/999999/resource-matchmaker",
            headers=self.student_headers
        )
        self.assertEqual(res_not_found.status_code, 404)


if __name__ == "__main__":
    unittest.main()
