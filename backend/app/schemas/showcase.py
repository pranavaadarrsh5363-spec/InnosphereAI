from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class EvidenceTraceItem(BaseModel):
    id: str
    title: str
    source_type: str = "OBSERVED"  # OBSERVED, PUBLISHED, STUDENT_PROVIDED, AI_SUGGESTED, SIMULATED, NOT_AVAILABLE
    source_id: Optional[str] = None
    run_id: Optional[int] = None
    citation_key: Optional[str] = None
    doi_or_url: Optional[str] = None
    verification_status: str = "VERIFIED"  # VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED
    observed_data: Optional[Dict[str, Any]] = None
    summary: str
    timestamp: Optional[str] = None


class ShowcaseSection(BaseModel):
    id: str
    section_number: int
    name: str
    title: str
    status: str = "READY"  # READY, PARTIAL, MISSING, SIMULATED, NOT_TESTED
    summary: str
    completion_pct: float = 100.0
    evidence_count: int = 0
    evidence_items: List[EvidenceTraceItem] = Field(default_factory=list)
    section_data: Dict[str, Any] = Field(default_factory=dict)


class ArchitectureNode(BaseModel):
    id: str
    name: str
    layer: str
    technology: str
    purpose: str
    evidence_ref: Optional[str] = None
    implementation_status: str = "WORKING_PROTOTYPE"  # WORKING_PROTOTYPE, SIMULATED, DESIGN_SPEC, PLANNED
    is_simulated: bool = False


class ShowcaseArchitecture(BaseModel):
    components: List[ArchitectureNode] = Field(default_factory=list)
    data_flow_description: str
    is_simulated: bool = True


class ShowcaseImpact(BaseModel):
    social: Dict[str, Any] = Field(default_factory=dict)
    economic: Dict[str, Any] = Field(default_factory=dict)
    environmental: Dict[str, Any] = Field(default_factory=dict)
    educational: Dict[str, Any] = Field(default_factory=dict)
    technical: Dict[str, Any] = Field(default_factory=dict)
    operational: Dict[str, Any] = Field(default_factory=dict)
    has_quantified_metrics: bool = False


class ShowcaseLimitations(BaseModel):
    hardware_limitations: List[str] = Field(default_factory=list)
    validation_gaps: List[Dict[str, Any]] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)
    unvalidated_assumptions: List[str] = Field(default_factory=list)


class ProjectEvidenceSummaryResponse(BaseModel):
    project_id: int
    project_title: str
    summary_markdown: str
    claims_count: int
    experiments_count: int
    citations_count: int
    benchmarks_count: int
    hardware_status: str
    validation_status: str
    generated_at: str


class ShowcaseResponse(BaseModel):
    project_id: int
    title: str
    domain: str
    status: str
    progress: int
    sections: List[ShowcaseSection] = Field(default_factory=list)
    architecture: ShowcaseArchitecture
    impact: ShowcaseImpact
    limitations: ShowcaseLimitations
    evidence_traces: List[EvidenceTraceItem] = Field(default_factory=list)
    hardware_mode: str = "SIMULATED"


class ShowcaseHealthResponse(BaseModel):
    backend: str = "OPERATIONAL"
    database: str = "OPERATIONAL"
    ai_provider: str = "OPERATIONAL"
    semantic_search: str = "OPERATIONAL"
    research_apis: str = "OPERATIONAL"
    experiment_engine: str = "OPERATIONAL"
    hardware_simulator: str = "OPERATIONAL"
    validation_engine: str = "OPERATIONAL"
    research_workspace: str = "OPERATIONAL"
    presentation_generator: str = "OPERATIONAL"
    showcase_orchestrator: str = "OPERATIONAL"
    overall_status: str = "OPERATIONAL"
