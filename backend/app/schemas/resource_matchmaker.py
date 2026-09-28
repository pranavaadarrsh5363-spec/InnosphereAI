from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


# ==============================================================================
# Hardware & Skills Schemas
# ==============================================================================

class StudentOwnedHardwareBase(BaseModel):
    name: str
    category: str = "Microcontroller"
    quantity: int = 1
    condition: str = "GOOD"
    ownership_status: str = "OWNED" # OWNED, BORROWED, LAB_AVAILABLE
    interfaces_json: List[str] = Field(default_factory=list)
    specs_json: Dict[str, Any] = Field(default_factory=dict)
    availability_status: str = "AVAILABLE"
    notes: Optional[str] = None


class StudentOwnedHardwareCreate(StudentOwnedHardwareBase):
    pass


class StudentOwnedHardwareRead(StudentOwnedHardwareBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    profile_id: int
    created_at: Optional[datetime] = None


class StudentSkillItemBase(BaseModel):
    skill_name: str
    proficiency_level: str = "INTERMEDIATE" # BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    willing_to_learn: bool = True


class StudentSkillItemCreate(StudentSkillItemBase):
    pass


class StudentSkillItemRead(StudentSkillItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    profile_id: int
    created_at: Optional[datetime] = None


# ==============================================================================
# Profile Schemas
# ==============================================================================

class ResourceMatchProfileUpdate(BaseModel):
    total_budget: Optional[float] = None
    currency: Optional[str] = "INR"
    hardware_budget: Optional[float] = None
    software_budget: Optional[float] = None
    cloud_budget: Optional[float] = None
    dataset_budget: Optional[float] = None
    monthly_recurring_budget: Optional[float] = None
    project_stage: Optional[str] = None
    location_country: Optional[str] = None
    location_region: Optional[str] = None
    location_city: Optional[str] = None
    institution_name: Optional[str] = None
    open_source_preference: Optional[str] = None
    offline_preference: Optional[str] = None
    learning_willingness: Optional[str] = None
    compute_preferences_json: Optional[Dict[str, Any]] = None
    owned_hardware: Optional[List[StudentOwnedHardwareCreate]] = None
    skills: Optional[List[StudentSkillItemCreate]] = None


class ResourceMatchProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    total_budget: float = 10000.0
    currency: str = "INR"
    hardware_budget: float = 6000.0
    software_budget: float = 0.0
    cloud_budget: float = 1000.0
    dataset_budget: float = 0.0
    monthly_recurring_budget: float = 500.0
    project_stage: str = "PROTOTYPING"
    location_country: str = "India"
    location_region: Optional[str] = None
    location_city: Optional[str] = None
    institution_name: Optional[str] = None
    open_source_preference: str = "PREFERRED"
    offline_preference: str = "PREFERRED"
    learning_willingness: str = "HIGH"
    compute_preferences_json: Dict[str, Any] = Field(default_factory=dict)
    owned_hardware: List[StudentOwnedHardwareRead] = Field(default_factory=list)
    skills: List[StudentSkillItemRead] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ==============================================================================
# Requirement Schemas
# ==============================================================================

class ProjectResourceRequirementBase(BaseModel):
    name: str
    category: str # HARDWARE, SOFTWARE, AI_ML, CLOUD_COMPUTE, DATA, SERVICE, RESEARCH
    description: Optional[str] = None
    priority: str = "HIGH" # CRITICAL, HIGH, MEDIUM, LOW
    is_hard_constraint: bool = True
    status: str = "AI_INFERRED" # AI_INFERRED, USER_CONFIRMED, EDITED, REJECTED
    specs_json: Dict[str, Any] = Field(default_factory=dict)


class ProjectResourceRequirementCreate(ProjectResourceRequirementBase):
    pass


class ProjectResourceRequirementUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    is_hard_constraint: Optional[bool] = None
    status: Optional[str] = None
    specs_json: Optional[Dict[str, Any]] = None


class ProjectResourceRequirementRead(ProjectResourceRequirementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ==============================================================================
# Alternative & Match Schemas
# ==============================================================================

class ResourceAlternativeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    match_record_id: int
    alternative_name: str
    alternative_category: str
    substitute_reason: str
    estimated_cost: float = 0.0
    cost_savings: float = 0.0
    tradeoffs_json: List[str] = Field(default_factory=list)
    performance_comparison: Optional[str] = None
    compatibility_status: str = "COMPATIBLE"
    created_at: Optional[datetime] = None


class ResourceMatchRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    resource_id: Optional[int] = None
    requirement_id: Optional[int] = None
    resource_name: str
    resource_category: str
    match_category: str # BEST_MATCH, GOOD_MATCH, POSSIBLE_MATCH, CONDITIONAL_MATCH, NOT_RECOMMENDED, INSUFFICIENT_DATA
    overall_match_score: float = 85.0
    project_relevance_score: float = 90.0
    budget_fit_score: float = 90.0
    hardware_fit_score: float = 85.0
    skill_fit_score: float = 80.0
    availability_score: float = 85.0
    compute_fit_score: float = 85.0
    open_source_score: float = 100.0
    estimated_cost: float = 0.0
    currency: str = "INR"
    cost_type: str = "ESTIMATE" # FREE, ONE_TIME, RECURRING, ESTIMATE, UNAVAILABLE
    price_evidence_status: str = "ESTIMATED" # SOURCE_VERIFIED, USER_PROVIDED, ESTIMATED, UNVERIFIED
    availability_status: str = "AVAILABILITY_UNKNOWN" # USER_OWNED, USER_BORROWED, INSTITUTION_AVAILABLE, ONLINE_AVAILABLE, PURCHASE_REQUIRED, AVAILABILITY_VERIFIED, AVAILABILITY_UNKNOWN, UNAVAILABLE
    why_matched_json: List[str] = Field(default_factory=list)
    tradeoffs_json: List[str] = Field(default_factory=list)
    confidence: str = "HIGH"
    confidence_reason: Optional[str] = None
    is_shortlisted: bool = False
    alternatives: List[ResourceAlternativeRead] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ==============================================================================
# Bundle & Plan Schemas
# ==============================================================================

class ResourceBundleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    bundle_type: str # LOW_COST, BALANCED, HIGH_PERFORMANCE
    name: str
    description: Optional[str] = None
    total_estimated_cost: float = 0.0
    monthly_recurring_cost: float = 0.0
    currency: str = "INR"
    items_json: List[Dict[str, Any]] = Field(default_factory=list)
    suitable_for_stage: str = "PROTOTYPING"
    tradeoff_summary: Optional[str] = None
    created_at: Optional[datetime] = None


class ProjectResourcePlanItemCreate(BaseModel):
    resource_name: str
    resource_category: str
    purpose: Optional[str] = None
    quantity: int = 1
    estimated_cost: float = 0.0
    actual_cost: Optional[float] = None
    currency: str = "INR"
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    availability_status: str = "PURCHASE_REQUIRED"
    plan_status: str = "RECOMMENDED" # RECOMMENDED, SHORTLISTED, AVAILABLE, OWNED, BORROWED, PURCHASE_REQUIRED, UNAVAILABLE, REPLACED, IMPLEMENTED
    linked_roadmap_phase_id: Optional[int] = None
    linked_experiment_id: Optional[int] = None
    linked_hardware_device_id: Optional[int] = None
    linked_validation_claim_id: Optional[int] = None
    notes: Optional[str] = None


class ProjectResourcePlanItemUpdate(BaseModel):
    resource_name: Optional[str] = None
    resource_category: Optional[str] = None
    purpose: Optional[str] = None
    quantity: Optional[int] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    currency: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    availability_status: Optional[str] = None
    plan_status: Optional[str] = None
    linked_roadmap_phase_id: Optional[int] = None
    linked_experiment_id: Optional[int] = None
    linked_hardware_device_id: Optional[int] = None
    linked_validation_claim_id: Optional[int] = None
    notes: Optional[str] = None


class ProjectResourcePlanItemRead(ProjectResourcePlanItemCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ==============================================================================
# High-Level Workspace & KPI Schemas
# ==============================================================================

class BudgetSummaryRead(BaseModel):
    total_budget: float
    allocated_budget: float
    remaining_budget: float
    currency: str
    utilization_percentage: float
    breakdown_by_category: Dict[str, float]
    recurring_monthly_total: float
    potential_savings_via_alternatives: float


class ResourceReadinessRead(BaseModel):
    hardware_readiness: str # READY, PARTIAL, NOT_REQUIRED, BLOCKED
    software_readiness: str
    dataset_readiness: str
    compute_readiness: str
    cloud_readiness: str
    skills_readiness: str
    overall_readiness: str
    readiness_notes: List[str] = Field(default_factory=list)


class ResourceRiskItem(BaseModel):
    risk_category: str # Budget, Availability, Compatibility, Compute, Skill, Licensing
    severity: str # HIGH, MEDIUM, LOW
    evidence: str
    impact: str
    mitigation: str


class ResourceMatchmakerAnalysisResponse(BaseModel):
    project_id: int
    project_title: str
    profile: ResourceMatchProfileRead
    requirements: List[ProjectResourceRequirementRead]
    matches: List[ResourceMatchRecordRead]
    alternatives: List[ResourceAlternativeRead]
    bundles: List[ResourceBundleRead]
    budget_summary: BudgetSummaryRead
    readiness: ResourceReadinessRead
    plan_items: List[ProjectResourcePlanItemRead]
    risks: List[ResourceRiskItem]
    optimization_insights: List[str]
    waste_warnings: List[str]
    assumptions_and_limitations: List[str]
    kpis: Dict[str, Any]


# ==============================================================================
# What-If & Assistant Schemas
# ==============================================================================

class ResourceWhatIfRequest(BaseModel):
    scenario_name: Optional[str] = None
    adjusted_budget: Optional[float] = None
    hardware_available: Optional[List[str]] = None
    gpu_available: Optional[bool] = None
    open_source_only: Optional[bool] = None
    offline_only: Optional[bool] = None
    student_skill_level: Optional[str] = None # BEGINNER, INTERMEDIATE, ADVANCED


class ResourceWhatIfResponse(BaseModel):
    project_id: int
    scenario_description: str
    budget_impact: Dict[str, Any]
    capability_changes: List[str]
    adjusted_matches: List[Dict[str, Any]]
    recommended_stack: Dict[str, Any]
    tradeoffs: List[str]
    risk_shifts: List[str]


class ResourceAssistantQuery(BaseModel):
    prompt: str
    context_resource_name: Optional[str] = None


class ResourceAssistantResponse(BaseModel):
    answer: str
    grounded_resources: List[Dict[str, Any]] = Field(default_factory=list)
    detected_constraints: Dict[str, Any] = Field(default_factory=dict)
    suggested_actions: List[str] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
    evidence_disclaimer: str = (
        "Recommendations are AI-generated based on current project constraints and public resource metadata. "
        "Estimated prices, availability, and cloud quotas must be verified with respective vendors/providers."
    )


class ResourceMatchReportResponse(BaseModel):
    format: str # markdown, json, csv, svg
    content_type: str
    filename: str
    data: str
    evidence_disclaimer: str


class ResourceMatchmakerHealthResponse(BaseModel):
    status: str # ONLINE, DEGRADED, UNAVAILABLE
    latency_ms: float
    components: Dict[str, Any]
