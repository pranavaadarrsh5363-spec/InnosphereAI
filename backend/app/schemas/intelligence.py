from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class SupportingResourceLink(BaseModel):
    title: str
    url: str
    resource_type: str = "research_paper"
    source: str = "arXiv"
    relevance_note: Optional[str] = None

class ReadinessDimension(BaseModel):
    key: str
    name: str
    score: int = Field(ge=0, le=100) # 0 to 100
    weight: float = Field(ge=0.0, le=1.0) # e.g. 0.20
    status: str # "EXEMPLARY", "STRONG", "DEVELOPING", "NEEDS_ATTENTION", "CRITICAL"
    summary: str
    evidence: List[str] = []
    actionable_recommendations: List[str] = []

class ProjectRiskItem(BaseModel):
    id: str
    category: str # "Technical", "Research", "Execution", "Dataset", "Hardware", "Security"
    severity: str # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    title: str
    description: str
    impact: str
    evidence: str
    mitigation: str
    is_resolved: bool = False

class NextBestAction(BaseModel):
    title: str
    rationale: str
    impact_score: int = Field(ge=1, le=25) # Potential health boost in points
    estimated_effort: str # e.g. "1-2 hours", "Half Day", "2-3 Days"
    priority: str # "IMMEDIATE", "HIGH", "MEDIUM"
    suggested_phase: str # e.g. "Phase 4 – Data Collection & Preprocessing"
    actionable_steps: List[str] = []
    supporting_resources: List[SupportingResourceLink] = []

class ResearchCluster(BaseModel):
    cluster_name: str
    pillar: str # "Algorithmic & AI Architecture", "Domain & Benchmark Datasets", "Edge / Hardware & Infrastructure", "Empirical Evaluation & Case Studies"
    resource_count: int = 0
    key_findings: List[str] = []
    sample_resources: List[SupportingResourceLink] = []
    gap_identification: str = ""

class InnovationGapItem(BaseModel):
    gap: str
    current_state: str
    your_advantage: str
    recommended_action: str

class HardwareIntelligence(BaseModel):
    is_hardware_enabled: bool = False
    device_count: int = 0
    sensor_count: int = 0
    packet_health_pct: float = 100.0
    anomalies_detected: int = 0
    validation_status: str = "Not Applicable" # "Fully Validated", "Simulating Anomalies", "Sensors Configured", "Not Applicable"

class HealthTimelinePoint(BaseModel):
    id: int
    health_score: int
    health_status: str
    created_at: datetime
    summary_verdict: Optional[str] = None

class ProjectHealthSummary(BaseModel):
    project_id: int
    project_title: str
    domain: str
    overall_score: int
    health_status: str # "CRITICAL", "NEEDS_ATTENTION", "DEVELOPING", "STRONG", "EXEMPLARY"
    status_label: str
    status_description: str
    dimensions: List[ReadinessDimension]
    computed_at: datetime

class ProjectIntelligenceProfile(BaseModel):
    project_id: int
    project_title: str
    domain: str
    overall_health_score: int
    health_status: str
    summary_verdict: str
    dimensions: List[ReadinessDimension]
    risks: List[ProjectRiskItem]
    next_best_action: NextBestAction
    research_clusters: List[ResearchCluster]
    innovation_gaps: List[InnovationGapItem]
    hardware_intelligence: HardwareIntelligence
    timeline_snapshots: List[HealthTimelinePoint] = []
    cache_hit: bool = False
    evaluated_at: datetime

class IntelligenceRefreshResponse(BaseModel):
    success: bool = True
    message: str
    profile: ProjectIntelligenceProfile
