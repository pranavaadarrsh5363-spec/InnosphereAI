from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


class ArchitectureNodeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    node_key: str
    name: str
    node_type: str
    category: Optional[str] = None
    technology: Optional[str] = None
    description: Optional[str] = None
    status: str = "PROPOSED"
    source_type: str = "AI_SUGGESTION"
    evidence_refs: List[Any] = Field(default_factory=list)
    required_skills: List[str] = Field(default_factory=list)
    associated_experiments: List[str] = Field(default_factory=list)
    validation_status: str = "NOT_TESTED"
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class ArchitectureEdgeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source_node: str
    target_node: str
    relationship: str = "SENDS_DATA_TO"
    protocol: Optional[str] = None
    data_type: Optional[str] = None
    description: Optional[str] = None
    direction: str = "FORWARD"


class ArchitectureLayerSchema(BaseModel):
    name: str
    description: Optional[str] = None
    node_keys: List[str] = Field(default_factory=list)


class ArchitectureGraphSchema(BaseModel):
    architecture_type: str
    title: str
    description: str
    nodes: List[ArchitectureNodeSchema] = Field(default_factory=list)
    edges: List[ArchitectureEdgeSchema] = Field(default_factory=list)
    layers: List[ArchitectureLayerSchema] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    summary: str = ""


class ArchitectureRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    architecture_type: str
    graph_json: Dict[str, Any] = Field(default_factory=dict)
    mermaid_source: str
    custom_mermaid_source: Optional[str] = None
    is_customized: bool = False
    explanation: Optional[str] = None
    diagnostics: Dict[str, Any] = Field(default_factory=dict)
    status: str = "GENERATED"
    created_at: datetime
    updated_at: Optional[datetime] = None
    nodes: List[ArchitectureNodeSchema] = Field(default_factory=list)
    edges: List[ArchitectureEdgeSchema] = Field(default_factory=list)


class ArchitectureVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    architecture_id: Optional[int] = None
    version_number: int
    architecture_type: str
    graph_snapshot: Dict[str, Any] = Field(default_factory=dict)
    mermaid_source: str
    change_summary: str
    content_hash: str
    created_by: str = "AI_GENERATOR"
    created_at: datetime


class MermaidUpdatePayload(BaseModel):
    mermaid_source: str


class ArchitectureExportPayload(BaseModel):
    format: str = "mermaid" # svg, png, mermaid, json, package
    view_type: Optional[str] = "SYSTEM"
    resolution: Optional[str] = "standard" # standard, presentation, high_resolution
    theme: Optional[str] = "light"


class ArchitectureDiagnosticsResponse(BaseModel):
    checks: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[Dict[str, Any]] = Field(default_factory=list)
    readiness_checklist: List[Dict[str, Any]] = Field(default_factory=list)
    completeness_score: int = 85


class ArchitectureAssistantQuery(BaseModel):
    prompt: str
    context_view: Optional[str] = "SYSTEM"


class ArchitectureAssistantResponse(BaseModel):
    response: str
    suggested_followups: List[str] = Field(default_factory=list)
    referenced_nodes: List[str] = Field(default_factory=list)


class ArchitectureSimplificationResponse(BaseModel):
    original_graph: Dict[str, Any] = Field(default_factory=dict)
    simplified_graph: Dict[str, Any] = Field(default_factory=dict)
    original_mermaid: str
    simplified_mermaid: str
    simplification_rationale: List[str] = Field(default_factory=list)


class ArchitectureChangeDetectionResponse(BaseModel):
    has_changes: bool
    changes: List[Dict[str, Any]] = Field(default_factory=list)
    recommendation: str
