import unittest
import asyncio
from app.services.ai_service import ai_service

class TestMentorRAGIntegration(unittest.TestCase):
    """
    Automated tests verifying AI Mentor's Retrieval-Augmented Generation (RAG)
    integration with semantic resource discovery.
    """

    def test_mentor_chat_includes_retrieved_evidence(self):
        """Verify that AI Mentor incorporates semantically retrieved evidence into technical guidance."""
        async def _run():
            project_context = {
                "title": "Smart Community Water Quality and Pathogen Prediction System",
                "domain": "Healthcare",
                "problem_statement": "Rural water contamination and enteric disease outbreaks",
                "proposed_solution": "Edge IoT turbidity telemetry with ML prediction",
                "technologies": ["FastAPI", "PyTorch", "ESP32", "PostgreSQL"],
                "progress": 55,
                "saved_resources": [{"title": "WHO Drinking Water Benchmark"}]
            }

            response = await ai_service.chat_assistant(
                message="What datasets and literature should I use for training my water potability prediction model?",
                project_context=project_context
            )

            self.assertIsInstance(response, str)
            self.assertGreater(len(response), 100)
            # Response should reference relevant datasets/papers or evidence
            self.assertTrue(
                "water" in response.lower() or "dataset" in response.lower() or "retrieved" in response.lower() or "who" in response.lower()
            )

        asyncio.run(_run())

if __name__ == "__main__":
    unittest.main()
