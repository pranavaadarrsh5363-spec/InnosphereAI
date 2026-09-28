import os
import logging
from typing import List

logger = logging.getLogger("inno_sphere.config")

class Settings:
    PROJECT_NAME: str = "InnoSphere AI - Student Innovation & Intelligent Resource Discovery Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment mode
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes") if ENVIRONMENT != "production" else False
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "inno-sphere-super-secret-jwt-key-2026-production-grade")
    ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))) # 7 days
    
    # Database (Defaults to SQLite for instant local execution, PostgreSQL for production)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./innovation_platform.db")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    
    # AI Engine Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini") # gemini | openai | heuristic
    AI_TIMEOUT_SECONDS: float = float(os.getenv("AI_TIMEOUT_SECONDS", "15.0"))
    
    # Semantic & Embedding Configuration
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "auto") # auto | gemini | deterministic
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-004")
    EMBEDDING_DIMENSIONS: int = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))
    VECTOR_SEARCH_BACKEND: str = os.getenv("VECTOR_SEARCH_BACKEND", "auto") # auto | pgvector | in_memory
    
    # Hybrid Search Scoring Weights (Linear Combination)
    HYBRID_WEIGHT_SEMANTIC: float = float(os.getenv("HYBRID_WEIGHT_SEMANTIC", "0.50"))
    HYBRID_WEIGHT_KEYWORD: float = float(os.getenv("HYBRID_WEIGHT_KEYWORD", "0.25"))
    HYBRID_WEIGHT_METADATA: float = float(os.getenv("HYBRID_WEIGHT_METADATA", "0.15"))
    HYBRID_WEIGHT_QUALITY: float = float(os.getenv("HYBRID_WEIGHT_QUALITY", "0.10"))
    AI_RERANK_TOP_N: int = int(os.getenv("AI_RERANK_TOP_N", "10"))

    # External APIs
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    SEMANTIC_SCHOLAR_KEY: str = os.getenv("SEMANTIC_SCHOLAR_KEY", "")
    EXTERNAL_API_TIMEOUT_SECONDS: float = float(os.getenv("EXTERNAL_API_TIMEOUT_SECONDS", "8.0"))
    
    # CORS Configuration
    _cors_env: str = os.getenv("CORS_ORIGINS", "")
    if _cors_env:
        CORS_ORIGINS: List[str] = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
    elif ENVIRONMENT == "production":
        CORS_ORIGINS: List[str] = [
            "https://innosphere.ai",
            "https://app.innosphere.ai"
        ]
    else:
        CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001"
        ]
    
    # Rate Limiting & Safety (requests per minute)
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes")
    RATE_LIMIT_GLOBAL_PER_MIN: int = int(os.getenv("RATE_LIMIT_GLOBAL_PER_MIN", "120"))
    RATE_LIMIT_AUTH_PER_MIN: int = int(os.getenv("RATE_LIMIT_AUTH_PER_MIN", "25"))
    RATE_LIMIT_AI_PER_MIN: int = int(os.getenv("RATE_LIMIT_AI_PER_MIN", "20"))
    RATE_LIMIT_SEARCH_PER_MIN: int = int(os.getenv("RATE_LIMIT_SEARCH_PER_MIN", "40"))
    
    # Pagination & Limits
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    MAX_SEARCH_RESULTS: int = 50
    MOCK_FALLBACK_ENABLED: bool = True
    
    # Hardware Simulator Limits
    MAX_TELEMETRY_BATCH_SIZE: int = 100
    MAX_SENSORS_PER_DEVICE: int = 20
    MAX_EXPERIMENTS_PER_PROJECT: int = 100

    def validate_production_secrets(self):
        """Validates critical security settings for production mode."""
        if self.ENVIRONMENT == "production":
            if not self.SECRET_KEY or self.SECRET_KEY == "inno-sphere-super-secret-jwt-key-2026-production-grade" or len(self.SECRET_KEY) < 32:
                raise ValueError("CRITICAL: In production mode, SECRET_KEY must be set to a strong unique random secret with at least 32 characters.")
            if self.DATABASE_URL.startswith("sqlite"):
                logger.warning("Production mode is active with SQLite database. PostgreSQL is recommended for concurrency.")
            if "*" in self.CORS_ORIGINS:
                raise ValueError("CRITICAL: Wildcard CORS origin ('*') is not allowed in production with credential support enabled.")

settings = Settings()
