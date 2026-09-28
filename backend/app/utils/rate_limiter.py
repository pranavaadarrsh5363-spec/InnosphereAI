import time
import threading
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException, status
from app.config import settings

class RateLimiter:
    """
    In-memory thread-safe sliding-window rate limiter.
    Tracks request timestamps per client IP / auth token.
    """
    def __init__(self):
        self._lock = threading.Lock()
        # Maps key -> list of timestamps
        self._records: Dict[str, list] = {}
        self._last_cleanup = time.time()

    def _cleanup_old_records(self, now: float, window_seconds: float = 60.0):
        """Periodically prune stale records to avoid memory leaks."""
        if now - self._last_cleanup < 30.0:
            return
        self._last_cleanup = now
        cutoff = now - window_seconds
        keys_to_delete = []
        for key, timestamps in self._records.items():
            valid_ts = [t for t in timestamps if t > cutoff]
            if valid_ts:
                self._records[key] = valid_ts
            else:
                keys_to_delete.append(key)
        for k in keys_to_delete:
            del self._records[k]

    def is_rate_limited(self, key: str, max_requests: int, window_seconds: float = 60.0) -> Tuple[bool, int]:
        """
        Returns (is_limited, retry_after_seconds).
        """
        if not settings.RATE_LIMIT_ENABLED:
            return False, 0

        now = time.time()
        with self._lock:
            self._cleanup_old_records(now, window_seconds)
            cutoff = now - window_seconds
            timestamps = self._records.get(key, [])
            # Filter timestamps within current window
            valid_ts = [t for t in timestamps if t > cutoff]

            if len(valid_ts) >= max_requests:
                oldest_in_window = valid_ts[0]
                retry_after = max(1, int(window_seconds - (now - oldest_in_window)))
                self._records[key] = valid_ts
                return True, retry_after

            valid_ts.append(now)
            self._records[key] = valid_ts
            return False, 0

limiter = RateLimiter()

def get_client_identifier(request: Request) -> str:
    """Extracts a unique client identifier from auth header or client IP."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # Use token signature suffix as identifier
        token = auth_header.split(" ", 1)[1]
        return f"token:{token[-16:]}"
    
    # Fallback to client IP
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "127.0.0.1"
    return f"ip:{client_ip}"

def rate_limit(max_requests: int, window_seconds: float = 60.0, category: str = "general"):
    """
    FastAPI dependency factory for rate limiting specific endpoint categories.
    """
    def dependency(request: Request):
        client_id = f"{category}:{get_client_identifier(request)}"
        is_limited, retry_after = limiter.is_rate_limited(client_id, max_requests, window_seconds)
        if is_limited:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {category} requests. Please retry in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )
    return dependency
