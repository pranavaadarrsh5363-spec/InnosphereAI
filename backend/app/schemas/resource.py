from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class RelevanceBreakdown(BaseModel):
    semantic_similarity: int = Field(..., ge=0, le=100, description="Dense vector cosine similarity percentage")
    domain_match: int = Field(..., ge=0, le=100, description="Domain alignment score")
    technology_match: int = Field(..., ge=0, le=100, description="Tech stack intersection score")
    skill_match: int = Field(..., ge=0, le=100, description="Student profile skill alignment score")
    keyword_relevance: int = Field(..., ge=0, le=100, description="Lexical token and phrase overlap score")
    quality_signal: int = Field(..., ge=0, le=100, description="Citations, stars, and license quality indicator")

class ResourceBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=500)
    description: str = Field(..., max_length=10000)
    resource_type: str = Field(..., max_length=100) # research_paper, dataset, api, github_repo, tool, course, ai_model, documentation
    source: str = Field(..., max_length=100) # arXiv, OpenAlex, GitHub, HuggingFace, Kaggle, Crossref, Official Docs
    url: str = Field(..., max_length=1000)
    authors: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    domain: str = Field(..., max_length=100)
    difficulty: Optional[str] = Field("Intermediate", max_length=50) # Beginner, Intermediate, Advanced
    is_open_source: bool = True
    is_free: bool = True
    published_date: Optional[str] = None
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    doi: Optional[str] = Field(None, max_length=255)
    external_id: Optional[str] = Field(None, max_length=255)

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: int
    created_at: Any
    updated_at: Any
    relevance_score: Optional[int] = 88
    relevance_explanation: Optional[str] = None
    why_relevant_points: Optional[List[str]] = Field(default_factory=list)
    relevance_breakdown: Optional[Dict[str, int]] = None
    search_mode: Optional[str] = "hybrid"
    embedding_status: Optional[str] = "completed"
    is_saved: Optional[bool] = False
    is_demo: Optional[bool] = False

    class Config:
        from_attributes = True

class SavedResourceBase(BaseModel):
    resource_id: int
    project_id: Optional[int] = None
    category: Optional[str] = Field("General", max_length=100)
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=5000)
    rating: Optional[int] = Field(5, ge=1, le=5)
    relevance_score: Optional[int] = Field(90, ge=0, le=100)
    relevance_explanation: Optional[str] = Field(None, max_length=3000)

class SavedResourceCreate(SavedResourceBase):
    pass

class SavedResourceUpdate(BaseModel):
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=5000)
    rating: Optional[int] = Field(None, ge=1, le=5)
    project_id: Optional[int] = None

class SavedResourceResponse(SavedResourceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    resource: ResourceResponse

    class Config:
        from_attributes = True

class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Natural language semantic search or project query")
    search_mode: Optional[str] = Field("hybrid", description="Retrieval strategy: hybrid | semantic | keyword")
    domain: Optional[str] = Field(None, max_length=100)
    resource_type: Optional[str] = Field(None, max_length=50)
    difficulty: Optional[str] = Field(None, max_length=50)
    is_open_source: Optional[bool] = None
    is_free: Optional[bool] = None
    min_relevance: Optional[int] = Field(None, ge=0, le=100)
    project_id: Optional[int] = None
    limit: Optional[int] = Field(50, ge=1, le=100)
    offset: Optional[int] = Field(0, ge=0)

class SemanticSearchResponse(BaseModel):
    total: int
    query: str
    domain: Optional[str] = None
    search_mode: str
    latency_ms: float
    embedding_provider: str
    results: List[ResourceResponse]

class ResourceFilterParams(BaseModel):
    query: Optional[str] = Field(None, max_length=500)
    search_mode: Optional[str] = Field("hybrid")
    resource_type: Optional[str] = Field(None, max_length=50)
    domain: Optional[str] = Field(None, max_length=100)
    technology: Optional[str] = Field(None, max_length=100)
    difficulty: Optional[str] = Field(None, max_length=50)
    source: Optional[str] = Field(None, max_length=100)
    is_open_source: Optional[bool] = None
    is_free: Optional[bool] = None
    min_relevance: Optional[int] = Field(None, ge=0, le=100)
    project_id: Optional[int] = None

class ResourceCompareRequest(BaseModel):
    resource_ids: List[int] = Field(..., min_length=1, max_length=10)
    idea_context: Optional[str] = Field(None, max_length=1000)

class VectorDiagnosticsResponse(BaseModel):
    vector_search_available: bool
    embedding_provider: str
    embedding_model: str
    dimensions: int
    cache_size: int
    cache_hits: int
    cache_misses: int
    cache_hit_rate_pct: float
    generation_count: int
    generation_failures: int
    last_index_update: str
