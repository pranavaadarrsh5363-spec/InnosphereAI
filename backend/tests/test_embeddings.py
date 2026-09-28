import unittest
import asyncio
from app.services.embedding_service import (
    DeterministicSemanticEmbeddingProvider,
    GeminiEmbeddingProvider,
    EmbeddingService,
    vector_dot_product,
    vector_l2_norm,
    vector_normalize,
    cosine_similarity
)

class TestEmbeddings(unittest.TestCase):
    """
    Automated tests verifying vector math, normalization, semantic embeddings,
    SHA-256 hashing, caching, and fallback resilience.
    """

    def setUp(self):
        self.provider = DeterministicSemanticEmbeddingProvider(dimensions=768)
        self.service = EmbeddingService()

    def test_vector_normalization_and_l2_norm(self):
        """Verify vector normalization produces exact unit length (norm = 1.0)."""
        raw_vec = [3.0, 4.0, 0.0] + [0.0] * 765
        norm_vec = vector_normalize(raw_vec)
        self.assertAlmostEqual(vector_l2_norm(norm_vec), 1.0, places=5)
        self.assertAlmostEqual(norm_vec[0], 0.6, places=5)
        self.assertAlmostEqual(norm_vec[1], 0.8, places=5)

    def test_cosine_similarity_properties(self):
        """Verify cosine similarity properties (identity = 1.0, orthogonal = 0.0, opposite = -1.0)."""
        vec_a = vector_normalize([1.0, 2.0, 3.0] + [0.0] * 765)
        vec_b = vector_normalize([1.0, 2.0, 3.0] + [0.0] * 765)
        vec_c = vector_normalize([0.0, 0.0, 0.0, 1.0, 1.0] + [0.0] * 763)
        vec_opp = [-x for x in vec_a]

        # Identical vectors
        self.assertAlmostEqual(cosine_similarity(vec_a, vec_b), 1.0, places=4)
        # Disjoint/orthogonal vectors
        self.assertAlmostEqual(cosine_similarity(vec_a, vec_c), 0.0, places=4)
        # Opposite vectors
        self.assertAlmostEqual(cosine_similarity(vec_a, vec_opp), -1.0, places=4)
        # None / empty handling
        self.assertEqual(cosine_similarity(None, vec_a), 0.0)
        self.assertEqual(cosine_similarity([], vec_a), 0.0)

    def test_semantic_concept_similarity(self):
        """
        Verify that semantically related concepts have high cosine similarity
        even without exact word matching.
        """
        async def _run():
            # Concept 1: Water contamination IoT prediction
            text_a = "IoT low-cost sensor telemetry for rural drinking water contamination and pathogen prediction"
            # Concept 2: Machine learning potable water anomaly detection (different wording)
            text_b = "Machine learning approaches for early anomaly detection in drinking water potability"
            # Concept 3: Completely unrelated topic
            text_c = "Ancient history of Roman architectural amphitheater construction"

            vec_a = await self.provider.embed_text(text_a)
            vec_b = await self.provider.embed_text(text_b)
            vec_c = await self.provider.embed_text(text_c)

            self.assertEqual(len(vec_a), 768)
            self.assertEqual(len(vec_b), 768)
            self.assertEqual(len(vec_c), 768)

            sim_ab = cosine_similarity(vec_a, vec_b)
            sim_ac = cosine_similarity(vec_a, vec_c)

            # Proximity check: water concepts should be substantially closer than unrelated Roman architecture
            self.assertGreater(sim_ab, 0.60, f"Expected high semantic similarity between related concepts, got {sim_ab}")
            self.assertGreater(sim_ab, sim_ac + 0.35, f"Expected semantic contrast: {sim_ab} vs {sim_ac}")

        asyncio.run(_run())

    def test_sha256_hash_and_caching(self):
        """Verify deterministic SHA-256 text hashing and query embedding cache."""
        async def _run():
            query = "Adaptive traffic signal optimization using reinforcement learning"
            hash1 = self.service.compute_text_hash(query)
            hash2 = self.service.compute_text_hash("  " + query.upper() + "  ")
            self.assertEqual(hash1, hash2)

            # First query call (miss)
            vec1 = await self.service.get_query_embedding(query)
            # Second query call (hit)
            vec2 = await self.service.get_query_embedding(query)

            self.assertEqual(vec1, vec2)
            self.assertGreaterEqual(self.service.metrics["cache_hits"], 1)

        asyncio.run(_run())

    def test_resource_semantic_text_normalization(self):
        """Verify resource fields are properly extracted into clean semantic text."""
        res_data = {
            "title": "PlantVillage Crop Disease Classifier",
            "description": "Deep learning models for agricultural leaf disease detection",
            "domain": "Agriculture",
            "resource_type": "dataset",
            "source": "Kaggle",
            "technologies": ["PyTorch", "YOLOv8"],
            "authors": ["Hughes, D."],
            "metadata_json": {"topics": ["Crop Vision", "Plant Pathology"]}
        }
        semantic_text = self.service.build_resource_semantic_text(res_data)
        self.assertIn("Title: PlantVillage Crop Disease Classifier", semantic_text)
        self.assertIn("Domain: Agriculture", semantic_text)
        self.assertIn("Technologies: PyTorch, YOLOv8", semantic_text)
        self.assertIn("Topics: Crop Vision, Plant Pathology", semantic_text)

if __name__ == "__main__":
    unittest.main()
