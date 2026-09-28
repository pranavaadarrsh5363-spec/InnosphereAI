import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.rate_limiter import limiter

class TestRateLimiter(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_sliding_window_rate_limiter_logic(self):
        """Verify limiter detects threshold breaches and calculates retry-after."""
        test_key = "test_client_burst"
        # Reset limiter for key
        limiter._records[test_key] = []

        # First 5 allowed
        for i in range(5):
            is_limited, _ = limiter.is_rate_limited(test_key, max_requests=5, window_seconds=60.0)
            self.assertFalse(is_limited)

        # 6th should be limited
        is_limited, retry_after = limiter.is_rate_limited(test_key, max_requests=5, window_seconds=60.0)
        self.assertTrue(is_limited)
        self.assertGreaterEqual(retry_after, 1)

if __name__ == "__main__":
    unittest.main()
