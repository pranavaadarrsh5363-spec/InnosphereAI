import unittest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.services.semantic_search_service import semantic_search_service
from app.services.embedding_service import embedding_service

class TestSemanticSearch(unittest.TestCase):
    """
    Automated integration tests for Semantic, Hybrid, and Keyword search endpoints,
    score breakdowns, why-relevant explanations, and diagnostics.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_semantic_search_endpoint_post(self):
        """Verify POST /api/v1/resources/semantic-search executes hybrid vector search."""
        payload = {
            "query": "Predicting drinking water contamination with edge IoT sensor telemetry",
            "search_mode": "hybrid",
            "domain": "Healthcare",
            "limit": 10
        }
        res = self.client.post("/api/v1/resources/semantic-search", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn("results", data)
        self.assertIn("total", data)
        self.assertIn("latency_ms", data)
        self.assertIn("embedding_provider", data)
        self.assertGreater(data["total"], 0)

        # Check top result properties
        first = data["results"][0]
        self.assertIn("relevance_score", first)
        self.assertIn("relevance_breakdown", first)
        self.assertIn("why_relevant_points", first)
        self.assertGreaterEqual(first["relevance_score"], 60)
        self.assertLessEqual(first["relevance_score"], 98)

        # Breakdown checks
        breakdown = first["relevance_breakdown"]
        self.assertIn("semantic_similarity", breakdown)
        self.assertIn("domain_match", breakdown)
        self.assertIn("technology_match", breakdown)
        self.assertIn("keyword_relevance", breakdown)
        self.assertIn("quality_signal", breakdown)

    def test_discover_get_with_search_modes(self):
        """Verify GET /api/v1/resources/discover supports hybrid, semantic, and keyword modes."""
        for mode in ["hybrid", "semantic", "keyword"]:
            res = self.client.get(f"/api/v1/resources/discover?query=cardiac+arrhythmia+ECG&search_mode={mode}&limit=5")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["search_mode"], mode)
            self.assertGreater(len(data["results"]), 0)

    def test_vector_diagnostics_endpoint(self):
        """Verify GET /api/v1/resources/diagnostics returns operational metrics."""
        res = self.client.get("/api/v1/resources/diagnostics")
        self.assertEqual(res.status_code, 200)
        diag = res.json()

        self.assertTrue(diag["vector_search_available"])
        self.assertIn("embedding_provider", diag)
        self.assertIn("embedding_model", diag)
        self.assertEqual(diag["dimensions"], 768)
        self.assertIn("cache_size", diag)
        self.assertIn("cache_hit_rate_pct", diag)
        self.assertIn("generation_count", diag)

    def test_filtering_and_pagination(self):
        """Verify domain and resource_type filters along with pagination bounds."""
        res = self.client.get("/api/v1/resources/discover?query=data&resource_type=dataset&limit=2&offset=0")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertLessEqual(len(data["results"]), 2)
        for item in data["results"]:
            self.assertEqual(item["resource_type"], "dataset")

if __name__ == "__main__":
    unittest.main()
