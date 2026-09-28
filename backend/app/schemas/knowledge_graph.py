from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


class KnowledgeGraphNodeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    node_key: str
    label: str
    category: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    description: Optional[str] = None
    status: str = "ACTIVE"
    source_type: str = "DIRECT"
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    in_degree: int = 0
    out_degree: int = 0
    total_degree: int = 0
    tags: List[str] = Field(default_factory=list)


class KnowledgeGraphEdgeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    source_node_key: str
    target_node_key: str
    relationship_type: str
    description: Optional[str] = None
    confidence: float = 1.0
    provenance: str = "DIRECT"
    evidence_refs: List[Any] = Field(default_factory=list)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeGraphStatistics(BaseModel):
    total_nodes: int = 0
    total_edges: int = 0
    category_counts: Dict[str, int] = Field(default_factory=dict)
    relationship_counts: Dict[str, int] = Field(default_factory=dict)
    density: float = 0.0
    average_degree: float = 0.0
    isolated_nodes_count: int = 0
    connected_components_count: int = 0
    depth_layers: int = 0


class KnowledgeGraphDiagnostics(BaseModel):
    completeness_score: int = 100
    missing_links: List[Dict[str, Any]] = Field(default_factory=list)
    orphaned_nodes: List[str] = Field(default_factory=list)
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    validation_coverage: float = 0.0
    evidence_grounding_score: float = 0.0


class KnowledgeGraphInsights(BaseModel):
    central_nodes: List[Dict[str, Any]] = Field(default_factory=list)
    critical_path: List[Dict[str, Any]] = Field(default_factory=list)
    key_hubs: List[Dict[str, Any]] = Field(default_factory=list)
    innovation_threads: List[Dict[str, Any]] = Field(default_factory=list)
    summary: str = ""


class KnowledgeGraphPayload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str = "Project Knowledge Graph"
    version: int = 1
    nodes: List[KnowledgeGraphNodeRead] = Field(default_factory=list)
    edges: List[KnowledgeGraphEdgeRead] = Field(default_factory=list)
    stats: KnowledgeGraphStatistics = Field(default_factory=KnowledgeGraphStatistics)
    diagnostics: KnowledgeGraphDiagnostics = Field(default_factory=KnowledgeGraphDiagnostics)
    insights: KnowledgeGraphInsights = Field(default_factory=KnowledgeGraphInsights)
    mermaid_source: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class KnowledgeGraphSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    version_number: int
    change_summary: str
    content_hash: str
    created_by: str = "AI_ENGINE"
    created_at: Optional[datetime] = None


class KnowledgeGraphExportPayload(BaseModel):
    format: str
    content_type: str
    filename: str
    data: str


class KnowledgeGraphGenerateRequest(BaseModel):
    force_refresh: bool = False
    include_ai_suggestions: bool = True
    max_depth: int = 3
