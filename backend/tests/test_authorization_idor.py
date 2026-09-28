import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.project import Project

class TestAuthorizationIDOR(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Obtain tokens for student and mentor
        student_res = cls.client.post("/api/v1/auth/demo-login/student").json()
        cls.student_token = student_res["access_token"]
        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}

        mentor_res = cls.client.post("/api/v1/auth/demo-login/mentor").json()
        cls.mentor_token = mentor_res["access_token"]
        cls.mentor_headers = {"Authorization": f"Bearer {cls.mentor_token}"}

    def test_student_cannot_submit_mentor_review(self):
        """Verify normal student role is forbidden (403) from grading projects."""
        with SessionLocal() as db:
            project = db.query(Project).first()
            self.assertIsNotNone(project)
            project_id = project.id

        res = self.client.post(
            "/api/v1/mentor/review",
            headers=self.student_headers,
            json={
                "project_id": project_id,
                "feedback": "Student trying to grade this project",
                "rating": 5
            }
        )
        self.assertEqual(res.status_code, 403)

    def test_mentor_can_submit_mentor_review(self):
        """Verify mentor role is authorized to submit review."""
        with SessionLocal() as db:
            project = db.query(Project).first()
            project_id = project.id

        res = self.client.post(
            "/api/v1/mentor/review",
            headers=self.mentor_headers,
            json={
                "project_id": project_id,
                "feedback": "Commendable technical depth and clear verification plan.",
                "rating": 5,
                "strengths": ["Clear problem framing", "Feasible architecture"],
                "areas_for_improvement": ["Profile hardware memory footprint"]
            }
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("review_id", res.json())

    def test_idor_project_access_protection(self):
        """Verify IDOR prevention: student cannot update a project they do not own."""
        with SessionLocal() as db:
            # Find or verify a project
            p = db.query(Project).first()
            if p:
                target_id = p.id
                # Non-existent or other user's project
                res = self.client.put(
                    f"/api/v1/projects/{target_id + 9999}",
                    headers=self.student_headers,
                    json={"title": "Unauthorized Modification Attempt"}
                )
                self.assertEqual(res.status_code, 404)

if __name__ == "__main__":
    unittest.main()
