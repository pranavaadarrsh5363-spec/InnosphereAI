import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.project import Project

class TestAIAndHardware(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        student_res = cls.client.post("/api/v1/auth/demo-login/student").json()
        cls.student_headers = {"Authorization": f"Bearer {student_res['access_token']}"}

    def test_ai_idea_submission_and_analysis(self):
        """Verify idea submission with AI analysis generation."""
        payload = {
            "title": "Smart Solar Agricultural Irrigation & Moisture Telemetry",
            "problem_description": "Smallholder farmers over-irrigate crops during heatwaves, depleting groundwater tables.",
            "proposed_solution": "Low-power ESP32 soil moisture probes controlling solar water pumps via dynamic PPO policy.",
            "domain": "Agriculture",
            "target_users": "Farming cooperatives and irrigation managers",
            "technologies_known": ["Python", "C++"],
            "technologies_interested": ["FastAPI", "PyTorch", "LoRaWAN"],
            "expected_impact": "Conserves 40% groundwater",
            "available_resources": "ESP32 microcontrollers, university farm plot"
        }
        res = self.client.post("/api/v1/ideas/submit", headers=self.student_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("idea", data)
        self.assertIn("analysis", data)
        self.assertIn("feasibility_score", data["analysis"])
        self.assertGreaterEqual(data["analysis"]["feasibility_score"], 70)

    def test_assistant_query_execution(self):
        """Verify conversational AI mentor responds accurately."""
        res = self.client.post(
            "/api/v1/assistant/query",
            headers=self.student_headers,
            json={"message": "What is the recommended technology stack for this project?"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("reply", data)
        self.assertIn("Technology Stack", data["reply"])

    def test_hardware_anomaly_injection_and_alert(self):
        """Verify anomaly injection generates critical alert."""
        with SessionLocal() as db:
            p = db.query(Project).first()
            self.assertIsNotNone(p)
            proj_id = p.id

        # Get overview
        overview = self.client.get(f"/api/v1/hardware/projects/{proj_id}", headers=self.student_headers).json()
        self.assertIn("devices", overview)
        if overview["devices"] and overview["devices"][0].get("sensors"):
            device_id = overview["devices"][0]["id"]
            sensor_id = overview["devices"][0]["sensors"][0]["id"]

            res = self.client.post("/api/v1/hardware/anomalies/inject", json={
                "device_id": device_id,
                "sensor_id": sensor_id,
                "anomaly_type": "sudden_spike",
                "spike_multiplier": 2.5
            })
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "anomaly_injected")
            self.assertIn("alert_id", data)

            # Resolve alert
            res_resolve = self.client.post(f"/api/v1/hardware/alerts/{data['alert_id']}/resolve")
            self.assertEqual(res_resolve.status_code, 200)
            self.assertEqual(res_resolve.json()["status"], "resolved")

if __name__ == "__main__":
    unittest.main()
