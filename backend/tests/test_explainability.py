import unittest
from app.services.semantic_search_service import SemanticSearchService

class TestExplainability(unittest.TestCase):
    """
    Automated tests for score breakdowns, Why-Relevant bullet points,
    and calibrated relevance score bounds.
    """

    def setUp(self):
        self.service = SemanticSearchService()

    def test_why_relevant_explanation_generation(self):
        """Verify generation of informative bullet points and summary sentences."""
        sample_resource = {
            "title": "Predictive Modeling of Water-Borne Epidemics with Edge Telemetry",
            "description": "LSTM and 1D-CNN architectures evaluating turbidity, pH, and precipitation telemetry.",
            "resource_type": "research_paper",
            "source": "arXiv",
            "domain": "Healthcare",
            "technologies": ["PyTorch", "FastAPI"],
            "metadata_json": {"citations": 45}
        }

        points, summary = self.service.generate_why_relevant_explanation(
            resource=sample_resource,
            query="Water quality contamination and pathogen detection",
            domain_score=1.0,
            tech_score=0.9,
            semantic_sim=0.88,
            lexical_score=0.75,
            quality_score=0.90,
            target_techs=["PyTorch", "FastAPI"]
        )

        self.assertGreaterEqual(len(points), 2)
        self.assertTrue(any("semantic" in p.lower() or "water" in p.lower() or "stack" in p.lower() for p in points))
        self.assertTrue(any("peer-reviewed" in p.lower() or "citations" in p.lower() for p in points))
        self.assertIn("Highly relevant", summary)

    def test_score_components_within_bounds(self):
        """Verify all score breakdown values are within 0-100%."""
        res_data = {
            "title": "YOLOv8 Real-time Vision",
            "description": "Object detection for agricultural leaf anomaly classification",
            "domain": "Agriculture",
            "technologies": ["PyTorch", "OpenCV"],
            "is_open_source": True,
            "is_free": True,
            "metadata_json": {"stars": 25000}
        }

        dom_score, tech_score, skill_score = self.service.compute_metadata_and_skill_score(
            res_data, target_domain="Agriculture", target_techs=["PyTorch"]
        )
        lex_score = self.service.compute_lexical_score("crop plant leaf disease detection", res_data)
        qual_score = self.service.compute_quality_score(res_data)

        self.assertGreaterEqual(dom_score, 0.0)
        self.assertLessEqual(dom_score, 1.0)
        self.assertGreaterEqual(tech_score, 0.0)
        self.assertLessEqual(tech_score, 1.0)
        self.assertGreaterEqual(lex_score, 0.0)
        self.assertLessEqual(lex_score, 1.0)
        self.assertGreaterEqual(qual_score, 0.0)
        self.assertLessEqual(qual_score, 1.0)

if __name__ == "__main__":
    unittest.main()
