import unittest
from app.database import SessionLocal
from app.models.project import Project
from app.services.project_intelligence_service import project_intelligence_service

class TestProjectHealthAndRisksService(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_compute_state_hash_consistency(self):
        project = self.db.query(Project).filter(Project.id == 1).first()
        self.assertIsNotNone(project)
        hash1 = project_intelligence_service.compute_state_hash(project)
        hash2 = project_intelligence_service.compute_state_hash(project)
        self.assertEqual(hash1, hash2)
        self.assertEqual(len(hash1), 64) # Valid SHA-256

    def test_multidimensional_evaluation_logic(self):
        project = self.db.query(Project).filter(Project.id == 1).first()
        self.assertIsNotNone(project)
        
        evaluation = project_intelligence_service._evaluate_project_state(project, self.db)
        
        self.assertIn("overall_health_score", evaluation)
        self.assertIn("health_status", evaluation)
        self.assertIn("maturity_dimensions", evaluation)
        self.assertIn("risks", evaluation)
        self.assertIn("next_best_action", evaluation)
        self.assertIn("research_clusters", evaluation)

        dimensions = evaluation["maturity_dimensions"]
        self.assertEqual(len(dimensions), 7)
        
        # Verify scores are bounded between 0 and 100
        for dim in dimensions:
            self.assertGreaterEqual(dim["score"], 0)
            self.assertLessEqual(dim["score"], 100)
            self.assertGreater(dim["weight"], 0.0)
            self.assertTrue(len(dim["evidence"]) > 0)

    def test_risk_detection_output(self):
        project = self.db.query(Project).filter(Project.id == 1).first()
        self.assertIsNotNone(project)
        
        evaluation = project_intelligence_service._evaluate_project_state(project, self.db)
        risks = evaluation["risks"]
        self.assertIsInstance(risks, list)
        
        for risk in risks:
            self.assertIn(risk["severity"], ["CRITICAL", "HIGH", "MEDIUM", "LOW"])
            self.assertIn(risk["category"], ["Technical", "Research", "Execution", "Dataset", "Hardware", "Security"])
            self.assertTrue(len(risk["mitigation"]) > 5)

    def test_next_best_action_synthesis(self):
        project = self.db.query(Project).filter(Project.id == 1).first()
        self.assertIsNotNone(project)
        
        evaluation = project_intelligence_service._evaluate_project_state(project, self.db)
        nba = evaluation["next_best_action"]
        
        self.assertIn("title", nba)
        self.assertIn("rationale", nba)
        self.assertIn("impact_score", nba)
        self.assertGreaterEqual(nba["impact_score"], 1)
        self.assertIsInstance(nba["actionable_steps"], list)
        self.assertGreater(len(nba["actionable_steps"]), 0)

if __name__ == "__main__":
    unittest.main()
