import abc
import asyncio
import hashlib
import logging
import math
import re
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings
from app.utils.validators import sanitize_text

logger = logging.getLogger("inno_sphere.embedding_service")

def get_utc_now() -> datetime:
    """Returns timezone-aware UTC datetime without deprecation warnings."""
    return datetime.now(timezone.utc)

# ==============================================================================
# Pure Python Vector Math & Normalization Utilities
# ==============================================================================

def vector_dot_product(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes dot product between two float vectors."""
    min_len = min(len(vec_a), len(vec_b))
    return sum(vec_a[i] * vec_b[i] for i in range(min_len))

def vector_l2_norm(vec: List[float]) -> float:
    """Computes Euclidean (L2) norm of a vector."""
    return math.sqrt(sum(x * x for x in vec))

def vector_normalize(vec: List[float]) -> List[float]:
    """Normalizes a vector to unit length (L2 norm = 1.0)."""
    norm = vector_l2_norm(vec)
    if norm == 0.0 or math.isnan(norm):
        return [0.0] * len(vec)
    return [x / norm for x in vec]

def cosine_similarity(vec_a: Optional[List[float]], vec_b: Optional[List[float]]) -> float:
    """
    Computes cosine similarity between two vectors in range [-1.0, 1.0].
    Returns 0.0 if either vector is empty, None, or zero-magnitude.
    """
    if not vec_a or not vec_b:
        return 0.0
    dot = vector_dot_product(vec_a, vec_b)
    norm_a = vector_l2_norm(vec_a)
    norm_b = vector_l2_norm(vec_b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    sim = dot / (norm_a * norm_b)
    return max(-1.0, min(1.0, float(sim)))


# ==============================================================================
# Abstract Embedding Provider Interface
# ==============================================================================

class EmbeddingProvider(abc.ABC):
    """Abstract interface for all semantic embedding providers."""

    @property
    @abc.abstractmethod
    def provider_name(self) -> str:
        """Unique identifier of the embedding provider."""
        pass

    @property
    @abc.abstractmethod
    def model_name(self) -> str:
        """Name of the underlying embedding model."""
        pass

    @property
    @abc.abstractmethod
    def dimensions(self) -> int:
        """Dimension count of generated embedding vectors."""
        pass

    @abc.abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        """Generate a normalized embedding vector for single input text."""
        pass

    @abc.abstractmethod
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate normalized embedding vectors for a batch of input texts."""
        pass


# ==============================================================================
# Google Gemini Embedding Provider
# ==============================================================================

class GeminiEmbeddingProvider(EmbeddingProvider):
    """
    Gemini API Embedding Provider using text-embedding-004 or gemini-embedding-001.
    """

    def __init__(self, api_key: str, model: str = "text-embedding-004", dimensions: int = 768):
        self._api_key = api_key
        self._model = model
        self._dimensions = dimensions

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def dimensions(self) -> int:
        return self._dimensions

    async def embed_text(self, text: str) -> List[float]:
        results = await self.embed_batch([text])
        return results[0] if results else [0.0] * self._dimensions

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not self._api_key or not texts:
            return [[0.0] * self._dimensions for _ in texts]

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self._api_key)
            cleaned_texts = [sanitize_text(t, max_length=2000) for t in texts]

            async def _call_api():
                # Call embed_content on client.models
                response = client.models.embed_content(
                    model=self._model,
                    contents=cleaned_texts if len(cleaned_texts) > 1 else cleaned_texts[0],
                )
                if hasattr(response, "embeddings") and response.embeddings:
                    return [vector_normalize(emb.values) for emb in response.embeddings]
                elif hasattr(response, "embedding") and response.embedding:
                    return [vector_normalize(response.embedding.values)]
                return None

            embeddings = await asyncio.wait_for(_call_api(), timeout=settings.AI_TIMEOUT_SECONDS)
            if embeddings and len(embeddings) == len(texts):
                return embeddings
        except Exception as e:
            logger.warning(f"Gemini embedding API call failed: {e}. Activating deterministic semantic provider.")

        # Graceful fallback to deterministic provider if API fails
        fallback_provider = DeterministicSemanticEmbeddingProvider(dimensions=self._dimensions)
        return await fallback_provider.embed_batch(texts)


# ==============================================================================
# Deterministic Semantic Embedding Provider (Fast, Offline & Testable)
# ==============================================================================

class DeterministicSemanticEmbeddingProvider(EmbeddingProvider):
    """
    High-fidelity deterministic semantic vectorizer.
    Maps domain taxonomy, semantic concepts, technology stacks, and n-gram sub-word
    hashing into unit-normalized 768-dimensional dense vector space.
    
    Ensures zero external network dependencies, instantaneous test execution,
    and strong semantic proximity for related concepts (e.g. 'IoT water contamination'
    and 'potable water quality anomaly prediction').
    """

    def __init__(self, model_name: str = "deterministic-semantic-v1", dimensions: int = 768):
        self._model = model_name
        self._dimensions = dimensions

        # Semantic concept cluster offsets for high semantic overlap
        self.semantic_clusters: Dict[str, List[str]] = {
            "water_quality_iot": [
                "water", "drinking", "potability", "contamination", "turbidity", "ph", "tds",
                "coliform", "pathogen", "epidemiology", "chlorination", "sensor", "sensors",
                "telemetry", "iot", "esp32", "lorawan", "water-borne", "anomaly", "prediction"
            ],
            "computer_vision_agriculture": [
                "agriculture", "crop", "plant", "leaf", "blight", "pest", "fungal", "harvest",
                "yolo", "yolov8", "yolov10", "vision", "opencv", "camera", "detection", "segmentation"
            ],
            "healthcare_cardiac_telemetry": [
                "healthcare", "medical", "patient", "vital", "cardiac", "arrhythmia", "ecg", "eeg",
                "clinical", "mimic", "telemetry", "hospital", "physionet", "diagnostic", "1d-cnn"
            ],
            "urban_mobility_traffic": [
                "traffic", "mobility", "urban", "signal", "congestion", "vehicle", "pedestrian",
                "transit", "reinforcement", "learning", "q-learning", "simulation", "sumo"
            ],
            "machine_learning_core": [
                "machine", "learning", "deep", "neural", "network", "pytorch", "tensorflow",
                "transformer", "model", "training", "dataset", "accuracy", "benchmark", "loss"
            ],
            "backend_cloud_systems": [
                "fastapi", "python", "backend", "api", "rest", "websocket", "docker", "postgres",
                "postgresql", "timescaledb", "database", "redis", "scalable", "microservice"
            ],
            "frontend_ui_dashboards": [
                "react", "nextjs", "next.js", "typescript", "tailwind", "dashboard", "frontend",
                "component", "recharts", "gis", "ui", "ux", "interactive"
            ],
            "edge_hardware_embedded": [
                "hardware", "microcontroller", "esp32", "arduino", "lora", "lorawan", "sensor",
                "adc", "i2c", "spi", "analog", "probe", "packet", "edge", "firmware"
            ]
        }

    @property
    def provider_name(self) -> str:
        return "deterministic"

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def dimensions(self) -> int:
        return self._dimensions

    def _generate_vector_for_text(self, text: str) -> List[float]:
        vec = [0.0] * self._dimensions
        if not text:
            return vec

        text_lower = text.lower()
        tokens = re.findall(r'\b[a-z0-9\-\_\.]{2,}\b', text_lower)
        if not tokens:
            return vec

        # 1. Semantic Cluster Density Activation (Dimensions 0 - 383)
        cluster_names = list(self.semantic_clusters.keys())
        token_set = set(tokens)
        for c_idx, (cluster_name, keywords) in enumerate(self.semantic_clusters.items()):
            base_slot = (c_idx * 48) % 384
            overlap = 0.0
            for kw in keywords:
                if kw in token_set or (len(kw) > 4 and kw in text_lower):
                    overlap += 1.0

            if overlap > 0:
                activation = (overlap ** 0.8) * 4.0
                for offset in range(48):
                    slot = (base_slot + offset) % 384
                    # Positive bell curve kernel
                    kernel = 0.5 + 0.5 * math.cos(offset * math.pi / 24)
                    vec[slot] += activation * kernel

        # 2. Signed Token Feature Hashing & N-grams (Dimensions 384 - 639)
        for i, token in enumerate(tokens):
            h_int = int(hashlib.md5(token.encode("utf-8")).hexdigest()[:8], 16)
            slot = 384 + (h_int % 256)
            sign = 1.0 if (h_int & 1) else -1.0
            weight = math.log(len(token) + 2) * 0.8
            vec[slot] += sign * weight

            # Bigrams
            if i < len(tokens) - 1:
                bigram = f"{token}_{tokens[i+1]}"
                bi_hash = int(hashlib.sha256(bigram.encode("utf-8")).hexdigest()[:8], 16)
                bi_slot = 384 + (bi_hash % 256)
                bi_sign = 1.0 if (bi_hash & 1) else -1.0
                vec[bi_slot] += bi_sign * weight * 1.2

        # 3. Signed Positional & Character Trigram Saliency (Dimensions 640 - 767)
        for i in range(min(len(text_lower) - 2, 200)):
            trigram = text_lower[i:i+3]
            tri_hash = int(hashlib.sha1(trigram.encode("utf-8")).hexdigest()[:6], 16)
            slot = 640 + (tri_hash % 128)
            tri_sign = 1.0 if (tri_hash & 1) else -1.0
            vec[slot] += tri_sign * 0.3

        return vector_normalize(vec)

    async def embed_text(self, text: str) -> List[float]:
        return self._generate_vector_for_text(text)

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self._generate_vector_for_text(t) for t in texts]


# ==============================================================================
# Embedding Service Orchestrator
# ==============================================================================

class EmbeddingService:
    """
    Central embedding service orchestrating provider selection, normalization,
    SHA-256 deduplication hashing, vector generation, and cache management.
    """

    def __init__(self):
        self.provider = self._select_provider()
        self._query_cache: Dict[str, Tuple[List[float], float]] = {} # hash -> (vector, timestamp)
        self._cache_ttl_seconds = 3600
        
        # Operational Metrics
        self.metrics = {
            "embedding_generation_count": 0,
            "embedding_generation_failures": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "total_vector_comparisons": 0,
            "last_index_update": get_utc_now().isoformat()
        }

    def _select_provider(self) -> EmbeddingProvider:
        """Selects the active embedding provider based on application configuration."""
        configured_provider = settings.EMBEDDING_PROVIDER.lower()
        dim = settings.EMBEDDING_DIMENSIONS

        if configured_provider == "gemini" and settings.GEMINI_API_KEY:
            logger.info("Initializing GeminiEmbeddingProvider for semantic search.")
            return GeminiEmbeddingProvider(
                api_key=settings.GEMINI_API_KEY,
                model=settings.EMBEDDING_MODEL,
                dimensions=dim
            )
        elif configured_provider == "auto":
            if settings.GEMINI_API_KEY:
                logger.info("Auto-selected GeminiEmbeddingProvider (API key found).")
                return GeminiEmbeddingProvider(
                    api_key=settings.GEMINI_API_KEY,
                    model=settings.EMBEDDING_MODEL,
                    dimensions=dim
                )
            else:
                logger.info("Auto-selected DeterministicSemanticEmbeddingProvider (offline/test mode).")
                return DeterministicSemanticEmbeddingProvider(dimensions=dim)
        else:
            logger.info("Using DeterministicSemanticEmbeddingProvider.")
            return DeterministicSemanticEmbeddingProvider(dimensions=dim)

    @staticmethod
    def compute_text_hash(text: str) -> str:
        """Calculates deterministic SHA-256 hash of semantic text for deduplication."""
        clean = (text or "").strip().lower()
        return hashlib.sha256(clean.encode("utf-8")).hexdigest()

    @staticmethod
    def build_resource_semantic_text(resource_data: Dict[str, Any]) -> str:
        """
        Constructs normalized, high-signal semantic representation text from resource fields.
        Avoids database noise and includes Title, Description, Domain, Type, Technologies, and Topics.
        """
        title = resource_data.get("title", "") or ""
        desc = resource_data.get("description", "") or ""
        domain = resource_data.get("domain", "") or ""
        res_type = (resource_data.get("resource_type", "") or "").replace("_", " ")
        source = resource_data.get("source", "") or ""
        
        techs = resource_data.get("technologies", []) or []
        if isinstance(techs, list):
            tech_str = ", ".join(str(t) for t in techs if t)
        else:
            tech_str = str(techs)

        authors = resource_data.get("authors", []) or []
        if isinstance(authors, list):
            author_str = ", ".join(str(a) for a in authors[:3] if a)
        else:
            author_str = str(authors)

        meta = resource_data.get("metadata_json", {}) or {}
        topics = meta.get("topics", [])
        if isinstance(topics, list):
            topic_str = ", ".join(str(tp) for tp in topics if tp)
        else:
            topic_str = ""

        parts = [
            f"Title: {title}",
            f"Description: {desc}",
            f"Domain: {domain}",
            f"Resource Type: {res_type}",
            f"Source: {source}",
        ]
        if tech_str:
            parts.append(f"Technologies: {tech_str}")
        if topic_str:
            parts.append(f"Topics: {topic_str}")
        if author_str:
            parts.append(f"Authors: {author_str}")

        return "\n".join(parts)

    async def get_query_embedding(self, query_text: str) -> List[float]:
        """
        Retrieves or generates a normalized embedding vector for a search query.
        Uses in-memory cache with SHA-256 query hashing.
        """
        clean_text = sanitize_text(query_text, max_length=1000)
        if not clean_text:
            return [0.0] * self.provider.dimensions

        q_hash = self.compute_text_hash(clean_text)
        now = time.time()

        if q_hash in self._query_cache:
            vec, ts = self._query_cache[q_hash]
            if now - ts < self._cache_ttl_seconds:
                self.metrics["cache_hits"] += 1
                return vec

        self.metrics["cache_misses"] += 1
        try:
            vec = await self.provider.embed_text(clean_text)
            self._query_cache[q_hash] = (vec, now)
            self.metrics["embedding_generation_count"] += 1
            return vec
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            self.metrics["embedding_generation_failures"] += 1
            fallback = DeterministicSemanticEmbeddingProvider(dimensions=self.provider.dimensions)
            return await fallback.embed_text(clean_text)

    async def ensure_resource_embedding(self, resource_obj: Any, db_session: Optional[Any] = None) -> Optional[List[float]]:
        """
        Ensures a database Resource has a valid up-to-date embedding.
        Checks SHA-256 hash. If changed or missing, generates and updates embedding.
        """
        res_data = {
            "title": getattr(resource_obj, "title", ""),
            "description": getattr(resource_obj, "description", ""),
            "domain": getattr(resource_obj, "domain", ""),
            "resource_type": getattr(resource_obj, "resource_type", ""),
            "source": getattr(resource_obj, "source", ""),
            "technologies": getattr(resource_obj, "technologies", []),
            "authors": getattr(resource_obj, "authors", []),
            "metadata_json": getattr(resource_obj, "metadata_json", {}) or {}
        }
        semantic_text = self.build_resource_semantic_text(res_data)
        current_hash = self.compute_text_hash(semantic_text)

        existing_embedding = getattr(resource_obj, "embedding", None)
        existing_hash = getattr(resource_obj, "embedding_text_hash", None)

        # Reuse existing embedding if hash matches
        if existing_embedding and existing_hash == current_hash and isinstance(existing_embedding, list) and len(existing_embedding) > 0:
            return existing_embedding

        # Generate new embedding
        try:
            vec = await self.provider.embed_text(semantic_text)
            if hasattr(resource_obj, "embedding"):
                resource_obj.embedding = vec
                resource_obj.embedding_model = self.provider.model_name
                resource_obj.embedding_version = "v1"
                resource_obj.embedding_created_at = get_utc_now()
                resource_obj.embedding_text_hash = current_hash
                resource_obj.embedding_status = "completed"

                if db_session:
                    try:
                        db_session.add(resource_obj)
                        db_session.commit()
                    except Exception as commit_err:
                        logger.warning(f"Failed to persist resource embedding to DB: {commit_err}")
                        db_session.rollback()

            self.metrics["embedding_generation_count"] += 1
            self.metrics["last_index_update"] = get_utc_now().isoformat()
            return vec
        except Exception as e:
            logger.error(f"Failed to generate embedding for resource '{res_data.get('title')}': {e}")
            if hasattr(resource_obj, "embedding_status"):
                resource_obj.embedding_status = "failed"
                if db_session:
                    try:
                        db_session.commit()
                    except Exception:
                        db_session.rollback()
            self.metrics["embedding_generation_failures"] += 1
            return None

    def get_diagnostics(self) -> Dict[str, Any]:
        """Returns safe operational status and telemetry for System Diagnostics."""
        return {
            "vector_search_available": True,
            "embedding_provider": self.provider.provider_name,
            "embedding_model": self.provider.model_name,
            "dimensions": self.provider.dimensions,
            "cache_size": len(self._query_cache),
            "cache_hits": self.metrics["cache_hits"],
            "cache_misses": self.metrics["cache_misses"],
            "cache_hit_rate_pct": round(
                (self.metrics["cache_hits"] / max(1, self.metrics["cache_hits"] + self.metrics["cache_misses"])) * 100, 1
            ),
            "generation_count": self.metrics["embedding_generation_count"],
            "generation_failures": self.metrics["embedding_generation_failures"],
            "last_index_update": self.metrics["last_index_update"]
        }

embedding_service = EmbeddingService()
