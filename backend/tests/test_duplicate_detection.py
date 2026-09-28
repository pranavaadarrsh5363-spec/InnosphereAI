import unittest
from app.services.deduplication_service import DeduplicationService

class TestDuplicateDetection(unittest.TestCase):
    """
    Automated tests for entity resolution, canonical URL normalization,
    DOI matching, arXiv parsing, and metadata merging.
    """

    def setUp(self):
        self.service = DeduplicationService()

    def test_canonical_url_normalization(self):
        """Verify tracking parameters, trailing slashes, and upper cases are normalized."""
        url1 = "https://arxiv.org/abs/2301.04153/?utm_source=twitter&utm_medium=social"
        url2 = "https://ARXIV.ORG/abs/2301.04153"
        url3 = "http://github.com/tiangolo/fastapi/?ref=innosphere#readme"

        norm1 = self.service.normalize_url(url1)
        norm2 = self.service.normalize_url(url2)
        norm3 = self.service.normalize_url(url3)

        self.assertEqual(norm1, "https://arxiv.org/abs/2301.04153")
        self.assertEqual(norm2, "https://arxiv.org/abs/2301.04153")
        self.assertEqual(norm1, norm2)
        self.assertEqual(norm3, "http://github.com/tiangolo/fastapi")

    def test_doi_and_arxiv_extraction(self):
        """Verify extraction of DOI and arXiv identifiers from various metadata fields."""
        res_doi = {"url": "https://link.springer.com/article/10.1007/s11270-023-06589-x"}
        self.assertEqual(self.service.extract_doi(res_doi), "10.1007/s11270-023-06589-x")

        res_arxiv = {"url": "https://arxiv.org/pdf/2401.0892v2.pdf"}
        self.assertEqual(self.service.extract_arxiv_id(res_arxiv), "2401.0892v2")

        res_gh = {"url": "https://github.com/ultralytics/yolov8"}
        self.assertEqual(self.service.extract_github_repo(res_gh), "ultralytics/yolov8")

    def test_duplicate_detection_and_metadata_merge(self):
        """Verify that duplicates from multiple sources merge citations and authors without data loss."""
        record_arxiv = {
            "title": "Deep Learning for Real-Time Cardiac Arrhythmia Detection from ECG",
            "url": "https://arxiv.org/abs/2301.04153",
            "source": "arXiv",
            "resource_type": "research_paper",
            "authors": ["A. Hannun", "P. Rajpurkar"],
            "technologies": ["PyTorch"],
            "metadata_json": {"citations": 1200}
        }

        record_crossref = {
            "title": "Deep Learning for Real-Time Cardiac Arrhythmia Detection from ECG",
            "url": "https://doi.org/10.1038/s41591-018-0268-3",
            "source": "Crossref",
            "resource_type": "research_paper",
            "authors": ["A. Hannun", "A. Ng"],
            "technologies": ["Transformers"],
            "metadata_json": {"citations": 1240, "doi": "10.1038/s41591-018-0268-3"}
        }

        # Check duplicate identity
        is_dup, reason = self.service.are_duplicates(record_arxiv, record_crossref)
        self.assertTrue(is_dup)

        merged = self.service.deduplicate_and_merge([record_arxiv, record_crossref])
        self.assertEqual(len(merged), 1)

        primary = merged[0]
        # Citations merged to max (1240)
        self.assertEqual(primary["metadata_json"]["citations"], 1240)
        # Authors merged
        self.assertIn("P. Rajpurkar", primary["authors"])
        self.assertIn("A. Ng", primary["authors"])
        # Technologies merged
        self.assertIn("PyTorch", primary["technologies"])
        self.assertIn("Transformers", primary["technologies"])
        # Alternate source tracked
        self.assertIn("Crossref", primary.get("alternate_sources", []))

if __name__ == "__main__":
    unittest.main()
