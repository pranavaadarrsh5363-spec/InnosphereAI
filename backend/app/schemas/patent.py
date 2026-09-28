from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


LEGAL_SAFETY_DISCLAIMER = (
    "This tool provides AI-assisted prior-art discovery and technical similarity analysis for "
    "research and innovation purposes. It does not provide legal advice, patentability opinions, "
    "freedom-to-operate opinions, infringement opinions, or legal conclusions. Patent decisions "
    "should be reviewed by a qualified patent professional."
)


class PatentClaimRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    patent_id: int
    claim_number: int
    claim_text: str
    is_independent: bool = True
    dependent_on_claim: Optional[int] = None
    claim_category: str = "System"
    extracted_features: List[str] = Field(default_factory=list)


class PatentFamilyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    family_id: str
    title: str
    earliest_priority_date: Optional[str] = None
    jurisdictions: List[str] = Field(default_factory=list)
    member_publication_numbers: List[str] = Field(default_factory=list)


class PatentDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    publication_number: str
    application_number: Optional[str] = None
    title: str
    abstract: str
    filing_date: Optional[str] = None
    publication_date: Optional[str] = None
    priority_date: Optional[str] = None
    grant_date: Optional[str] = None
    status: str = "PUBLISHED"
    jurisdiction: str = "US"
    inventors: List[str] = Field(default_factory=list)
    assignees: List[str] = Field(default_factory=list)
    applicants: List[str] = Field(default_factory=list)
    patent_family_id: Optional[int] = None
    source: str = "Google Patents"
    source_url: Optional[str] = None
    official_url: Optional[str] = None
    full_text_available: bool = True
    claims_available: bool = True
    technical_fields: List[str] = Field(default_factory=list)
    ipc_cpc_classes: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    claims: Optional[List[PatentClaimRead]] = None
    family: Optional[PatentFamilyRead] = None


class PatentSearchConceptRead(BaseModel):
    problem: str = ""
    technical_objective: str = ""
    technologies: List[str] = Field(default_factory=list)
    components: List[str] = Field(default_factory=list)
    methods: List[str] = Field(default_factory=list)
    inputs: List[str] = Field(default_factory=list)
    outputs: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    deployment_environment: str = ""
    target_application: str = ""
    novel_features: List[str] = Field(default_factory=list)
    differentiating_features: List[str] = Field(default_factory=list)
    generated_search_queries: List[Dict[str, Any]] = Field(default_factory=list)
    legal_disclaimer: str = LEGAL_SAFETY_DISCLAIMER


class PatentSearchResultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    search_id: int
    patent_id: int
    patent: Optional[PatentDocumentRead] = None
    technical_similarity_score: float = 0.0 # 0.0 - 100.0 indicator
    feature_overlap_level: str = "MODERATE" # HIGH, MODERATE, LOW, MINIMAL
    abstract_similarity_score: float = 0.0
    claim_similarity_score: float = 0.0
    overlap_summary: str = ""
    differentiation_summary: str = ""
    matched_features: List[Dict[str, Any]] = Field(default_factory=list)
    why_similar: List[str] = Field(default_factory=list)
    potential_differences: List[str] = Field(default_factory=list)
    evidence_status: str = "PATENT_ANALYSIS"
    is_saved: bool = False


class PatentSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    query_text: str
    search_concepts: Dict[str, Any] = Field(default_factory=dict)
    stages_searched: List[str] = Field(default_factory=list)
    providers_used: List[str] = Field(default_factory=list)
    result_count: int = 0
    search_coverage_score: float = 0.0
    search_status: str = "COMPLETED"
    search_limitations: List[str] = Field(default_factory=list)
    results: List[PatentSearchResultRead] = Field(default_factory=list)
    legal_disclaimer: str = LEGAL_SAFETY_DISCLAIMER
    created_at: Optional[datetime] = None


class PatentSearchRequest(BaseModel):
    query_text: Optional[str] = None
    custom_concepts: Optional[List[str]] = None
    providers: Optional[List[str]] = None
    jurisdictions: Optional[List[str]] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    limit: int = 20
    force_refresh: bool = False


class SavedPriorArtCreate(BaseModel):
    why_saved: Optional[str] = ""
    relevant_features: List[str] = Field(default_factory=list)
    notes: Optional[str] = ""
    tags: List[str] = Field(default_factory=list)
    saved_to_research: bool = False


class SavedPriorArtRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    patent_id: int
    patent: Optional[PatentDocumentRead] = None
    why_saved: str = ""
    relevant_features: List[str] = Field(default_factory=list)
    notes: str = ""
    tags: List[str] = Field(default_factory=list)
    saved_to_research: bool = False
    synced_citation_id: Optional[int] = None
    created_at: Optional[datetime] = None


class PatentOverlapRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    project_id: int
    patent_id: int
    patent_title: Optional[str] = None
    publication_number: Optional[str] = None
    category: str
    overlap_area: str
    technical_detail: str
    evidence_source: str
    confidence_score: float = 0.85
    differentiation_opportunity: str = ""


class PatentComparisonRow(BaseModel):
    feature_name: str
    student_project_value: str
    patent_values: Dict[str, str] = Field(default_factory=dict) # { "US-10928374-B2": "Present", ... }


class PatentComparisonMatrix(BaseModel):
    project_id: int
    project_title: str
    compared_patents: List[Dict[str, str]] = Field(default_factory=list) # [{ publication_number, title }]
    rows: List[PatentComparisonRow] = Field(default_factory=list)
    legal_disclaimer: str = LEGAL_SAFETY_DISCLAIMER


class PatentTimelineItem(BaseModel):
    publication_number: str
    title: str
    event_type: str # PRIORITY, FILING, PUBLICATION, GRANT, STUDENT_PROJECT
    date: str
    assignee_or_source: str
    technical_focus: str
    is_project_milestone: bool = False


class PatentTimelineResponse(BaseModel):
    project_id: int
    events: List[PatentTimelineItem] = Field(default_factory=list)
    summary: str = ""
    legal_disclaimer: str = LEGAL_SAFETY_DISCLAIMER


class PatentLandscapeResponse(BaseModel):
    project_id: int
    clusters: List[Dict[str, Any]] = Field(default_factory=list) # { cluster_name, patent_count, key_technologies, patents: [...] }
    technology_distribution: Dict[str, int] = Field(default_factory=dict)
    jurisdiction_distribution: Dict[str, int] = Field(default_factory=dict)
    total_patents_analyzed: int = 0
    legal_disclaimer: str = LEGAL_SAFETY_DISCLAIMER


class PatentSearchCoverageResponse(BaseModel):
    project_id: int
    coverage_score: float
    stages: List[Dict[str, Any]] = Field(default_factory=list) # [{ name, status, query_count, hit_count }]
    providers_status: List[Dict[str, Any]] = Field(default_factory=list) # [{ name, status, latency_ms }]
    limitations: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    legal_disclaimer: str = LEGAL_SAFETY_DISCLAIMER


class PatentAssistantQuery(BaseModel):
    prompt: str
    context_patent_id: Optional[int] = None


class PatentAssistantResponse(BaseModel):
    answer: str
    grounded_patents: List[Dict[str, Any]] = Field(default_factory=list)
    suggested_search_terms: List[str] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
    legal_disclaimer: str = LEGAL_SAFETY_DISCLAIMER


class PatentExportResponse(BaseModel):
    format: str
    content_type: str
    filename: str
    data: str
    legal_disclaimer: str = LEGAL_SAFETY_DISCLAIMER


class PatentProviderStatus(BaseModel):
    provider_name: str
    status: str # ONLINE, DEGRADED, UNAVAILABLE
    latency_ms: float
    description: str
    supported_jurisdictions: List[str] = Field(default_factory=list)
