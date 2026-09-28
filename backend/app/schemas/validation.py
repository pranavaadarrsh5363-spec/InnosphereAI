from pydantic import BaseModel, Field, model_validator
from typing import List, Dict, Any, Optional
from datetime import datetime


# -------------------------------------------------------------
# Innovation Claims & Evidence Schemas
# -------------------------------------------------------------
class InnovationClaimCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    claim: str = Field(..., min_length=5)
    category: str = Field("Performance", max_length=100)
    description: Optional[str] = ""
    existing_solution: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    expected_advantage: Optional[str] = ""
    validation_question: str = Field(..., min_length=5)
    evidence_requirement: Optional[str] = ""
    status: Optional[str] = "NOT_TESTED"
    confidence_indicator: Optional[str] = "PRELIMINARY"
    validation_type: Optional[str] = "SIMULATED"
    linked_experiment_id: Optional[int] = None
    linked_benchmark_id: Optional[int] = None
    observed_result: Optional[str] = ""
    notes: Optional[str] = ""

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            if "claim_title" in data and "title" not in data:
                data["title"] = data["claim_title"]
            if "claim_statement" in data and "claim" not in data:
                data["claim"] = data["claim_statement"]
            if "confidence_score" in data and "confidence_indicator" not in data:
                cs = float(data["confidence_score"])
                data["confidence_indicator"] = "HIGH" if cs >= 0.8 else "MEDIUM" if cs >= 0.5 else "LOW"
            if "evidence_summary" in data and not data.get("observed_result"):
                data["observed_result"] = data["evidence_summary"]
            if "metrics_observed" in data and isinstance(data["metrics_observed"], dict) and not data.get("observed_result"):
                data["observed_result"] = str(data["metrics_observed"])
        return data


class InnovationClaimUpdate(BaseModel):
    title: Optional[str] = None
    claim: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    existing_solution: Optional[str] = None
    proposed_solution: Optional[str] = None
    expected_advantage: Optional[str] = None
    validation_question: Optional[str] = None
    evidence_requirement: Optional[str] = None
    status: Optional[str] = None
    confidence_indicator: Optional[str] = None
    validation_type: Optional[str] = None
    linked_experiment_id: Optional[int] = None
    linked_benchmark_id: Optional[int] = None
    observed_result: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            if "claim_title" in data and "title" not in data:
                data["title"] = data["claim_title"]
            if "claim_statement" in data and "claim" not in data:
                data["claim"] = data["claim_statement"]
        return data


class ValidationEvidenceCreate(BaseModel):
    claim_id: Optional[int] = None
    evidence_type: str = "experiment_run"
    title: str = Field(..., min_length=2)
    description: Optional[str] = ""
    source_uri: Optional[str] = ""
    source_reference_id: Optional[str] = ""
    verification_status: Optional[str] = "VERIFIED"
    validation_type: Optional[str] = "SIMULATED"


class ValidationEvidenceResponse(BaseModel):
    id: int
    project_id: int
    claim_id: Optional[int] = None
    evidence_type: str
    title: str
    description: Optional[str] = ""
    source_uri: Optional[str] = ""
    source_reference_id: Optional[str] = ""
    verification_status: str
    validation_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class InnovationClaimResponse(BaseModel):
    id: int
    project_id: int
    title: str
    claim: str
    category: str
    description: Optional[str] = ""
    existing_solution: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    expected_advantage: Optional[str] = ""
    validation_question: str
    evidence_requirement: Optional[str] = ""
    status: str
    confidence_indicator: str
    validation_type: str
    linked_experiment_id: Optional[int] = None
    linked_benchmark_id: Optional[int] = None
    observed_result: Optional[str] = ""
    notes: Optional[str] = ""
    created_at: datetime
    updated_at: datetime
    evidence_items: List[ValidationEvidenceResponse] = []

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# Validation Scorecard & Gaps
# -------------------------------------------------------------
class ValidationDimensionScore(BaseModel):
    key: str
    name: str
    status: str # READY, PARTIAL, MISSING, SIMULATED, NOT_TESTED
    score: float # 0 - 100
    evidence_count: int
    summary: str
    strengths: List[str] = []
    missing_validation: List[str] = []


class ValidationGapResponse(BaseModel):
    id: int
    project_id: int
    claim_id: Optional[int] = None
    claim_title: Optional[str] = None
    gap_title: str
    reason: str
    required_evidence: str
    severity: str # CRITICAL, HIGH, MEDIUM, LOW
    suggested_action: str
    linked_experiment_id: Optional[int] = None
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ValidationMatrixResponse(BaseModel):
    project_id: int
    total_claims: int
    validated_claims: int
    partially_validated_claims: int
    inconclusive_claims: int
    not_validated_claims: int
    not_tested_claims: int
    evidence_coverage_pct: float
    coverage_label: str
    dimensions: List[ValidationDimensionScore]
    scorecard: Optional[Dict[str, Any]] = None
    claims: List[InnovationClaimResponse]
    gaps: List[ValidationGapResponse]
    disclaimer: str

    @model_validator(mode="before")
    @classmethod
    def populate_scorecard(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "scorecard" not in data or data["scorecard"] is None:
                sc = {}
                dims = data.get("dimensions", [])
                for d in dims:
                    k = d.get("key") if isinstance(d, dict) else getattr(d, "key", "")
                    sc[k] = d
                    # Backward-compatible dimension aliases
                    if k == "problem_validation":
                        sc["problem_statement"] = d
                    elif k == "technical_validation":
                        sc["technical_feasibility"] = d
                    elif k == "experimental_validation":
                        sc["experimental_validation"] = d
                    elif k == "benchmark_validation":
                        sc["benchmark_superiority"] = d
                    elif k == "hardware_validation":
                        sc["hardware_realization"] = d
                    elif k == "research_validation":
                        sc["academic_grounding"] = d
                    elif k == "reproducibility_validation":
                        sc["reproducibility"] = d
                    elif k == "stakeholder_validation":
                        sc["stakeholder_validation"] = d
                sc["overall_score"] = data.get("evidence_coverage_pct", 0.0)
                data["scorecard"] = sc
        return data


# -------------------------------------------------------------
# Innovation Differentiation Matrix
# -------------------------------------------------------------
class DifferentiationRow(BaseModel):
    dimension: str # Architecture, Algorithm, Dataset, Hardware, Latency, Cost, Accessibility, Scalability
    existing_approach: str
    proposed_approach: str
    evidence_state: str # Verified, Partially Supported, Hypothesis, Not Tested
    evidence_source: str
    evidence_type: str # published_paper, recorded_experiment, student_assumption, ai_suggestion
    category: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def populate_category(cls, data: Any) -> Any:
        if isinstance(data, dict):
            dim = data.get("dimension", "")
            data["category"] = dim
            if dim == "System Architecture":
                data["category"] = "Core Architecture / Methodology"
        return data


class InnovationDifferentiationMatrixResponse(BaseModel):
    project_id: int
    project_title: str
    domain: str
    rows: List[DifferentiationRow]
    novelty_disclaimer: str


# -------------------------------------------------------------
# Competition Readiness & Checklist
# -------------------------------------------------------------
class CompetitionChecklistItemResponse(BaseModel):
    id: int
    project_id: int
    category: str
    title: str
    description: Optional[str] = ""
    status: str # READY, PARTIAL, MISSING
    is_custom: bool
    evidence_link: Optional[str] = None
    order_idx: int
    created_at: datetime

    class Config:
        from_attributes = True


class CompetitionChecklistToggle(BaseModel):
    status: str = Field(..., max_length=50) # READY, PARTIAL, MISSING
    evidence_link: Optional[str] = None
    notes: Optional[str] = None


class CompetitionPillarStatus(BaseModel):
    pillar: str # Problem, Innovation, Technology, Evidence, Impact, Demonstration, Research, Presentation
    status: str # READY, PARTIAL, MISSING
    score_pct: float
    completed_items: List[str] = []
    missing_items: List[str] = []


class CompetitionReadinessResponse(BaseModel):
    project_id: int
    project_title: str
    overall_readiness_pct: float
    readiness_score: Optional[float] = None
    readiness_verdict: str
    readiness_level: Optional[str] = None
    pillars: List[CompetitionPillarStatus]
    checklist: List[CompetitionChecklistItemResponse]
    strengths: List[str] = []
    critical_missing_items: List[str] = []
    disclaimer: str

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "readiness_score" not in data or data["readiness_score"] is None:
                data["readiness_score"] = data.get("overall_readiness_pct", 0.0)
            if "readiness_level" not in data or data["readiness_level"] is None:
                score = data.get("overall_readiness_pct", 0.0)
                data["readiness_level"] = "HIGH" if score >= 75 else "MODERATE" if score >= 50 else "EARLY_STAGE"
        return data


# -------------------------------------------------------------
# Demo Readiness & Presentation Generator
# -------------------------------------------------------------
class DemoReadinessCheck(BaseModel):
    key: str
    label: str
    status: str # OPERATIONAL, READY, DEGRADED, NOT_CONFIGURED
    details: str


class DemoStepItem(BaseModel):
    step_number: int
    title: str
    description: str
    route_target: str
    highlight_element: str


class DemoReadinessResponse(BaseModel):
    project_id: int
    is_demo_ready: bool
    hardware_simulator_active: Optional[bool] = True
    completed_experiments_count: Optional[int] = 0
    total_checks: int
    passed_checks: int
    checks: List[DemoReadinessCheck]
    guided_steps: List[DemoStepItem]
    guided_demo_steps: Optional[List[DemoStepItem]] = None
    demo_steps: Optional[List[DemoStepItem]] = None

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            steps = data.get("guided_steps", [])
            data["guided_demo_steps"] = steps
            data["demo_steps"] = steps
        return data


class PresentationSlide(BaseModel):
    slide_number: int
    title: str
    subtitle: str
    bullet_points: List[str]
    visual_layout: str # split_left_chart, kpi_deck, architecture_flow, table_comparison, callout_metric
    evidence_source: Optional[str] = None
    speaker_notes: str
    qa_defense_prompts: Optional[List[str]] = []
    grounded_evidence_refs: Optional[List[str]] = []

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "qa_defense_prompts" not in data or not data["qa_defense_prompts"]:
                data["qa_defense_prompts"] = [
                    "Q: What is the primary empirical baseline?",
                    "Q: How is real-time performance verified on edge hardware?"
                ]
            if "grounded_evidence_refs" not in data or not data["grounded_evidence_refs"]:
                data["grounded_evidence_refs"] = [data.get("evidence_source") or "Project Evidence Record"]
        return data


class PresentationOutlineResponse(BaseModel):
    project_id: int
    project_title: str
    total_slides: int
    theme: str
    slides: List[PresentationSlide]
    disclaimer: str


# -------------------------------------------------------------
# Cost & Scalability Validation
# -------------------------------------------------------------
class ProjectCostItemCreate(BaseModel):
    category: str = "Hardware"
    item_name: str = Field(..., min_length=2)
    quantity: int = 1
    unit_cost: float = 0.0
    total_cost: Optional[float] = None
    is_recurring: bool = False
    recurring_period: str = "monthly"
    is_estimated: bool = True
    source_or_vendor: Optional[str] = ""
    currency: str = "INR"
    notes: Optional[str] = ""

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            if "total_cost" in data and "unit_cost" not in data:
                data["unit_cost"] = data["total_cost"]
        return data


class ProjectCostItemResponse(BaseModel):
    id: int
    project_id: int
    category: str
    item_name: str
    quantity: int
    unit_cost: float
    total_cost: float
    is_recurring: bool
    recurring_period: str
    is_estimated: bool
    source_or_vendor: Optional[str] = ""
    currency: str
    notes: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectCostAnalysisResponse(BaseModel):
    project_id: int
    currency: str
    total_prototype_cost: float
    prototype_unit_bom: Optional[float] = None
    total_deployment_cost: float
    recurring_monthly_cost: float
    items: List[ProjectCostItemResponse]
    cost_status_label: str
    disclaimer: str

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "prototype_unit_bom" not in data or data["prototype_unit_bom"] is None:
                data["prototype_unit_bom"] = data.get("total_prototype_cost", 0.0)
        return data


class ScalabilityDimension(BaseModel):
    dimension: str
    current_capacity: str
    documented_limit: str
    bottleneck_risk: str
    evidence_backing: str


class ScalabilityAssessmentResponse(BaseModel):
    project_id: int
    project_title: str
    overall_scalability_score: float
    dimensions: List[ScalabilityDimension]
    empirical_observations: List[str]
    disclaimer: str


# -------------------------------------------------------------
# Stakeholder Reviews
# -------------------------------------------------------------
class StakeholderReviewCreate(BaseModel):
    reviewer_name: str = Field(..., min_length=2)
    reviewer_role: str = "mentor" # mentor, faculty, target_user, industry_expert, student_peer
    problem_clarity_score: Optional[float] = None
    solution_feasibility_score: Optional[float] = None
    innovation_score: Optional[float] = None
    usability_score: Optional[float] = None
    feedback_text: str = Field(..., min_length=5)
    recommendations: List[str] = []
    evidence_attachment_url: Optional[str] = None
    score: Optional[float] = None
    decision: Optional[str] = None
    verified_claims: Optional[List[str]] = []
    review_type: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            if "reviewer_type" in data and "reviewer_role" not in data:
                data["reviewer_role"] = data["reviewer_type"]
            if "score" in data and data["score"] is not None:
                s = float(data["score"])
                if "innovation_score" not in data or data["innovation_score"] is None:
                    data["innovation_score"] = s
                if "solution_feasibility_score" not in data or data["solution_feasibility_score"] is None:
                    data["solution_feasibility_score"] = s
            if "feedback" in data and "feedback_text" not in data:
                data["feedback_text"] = data["feedback"]
            if "comments" in data and "feedback_text" not in data:
                data["feedback_text"] = data["comments"]
            if "verified_claims" in data and isinstance(data["verified_claims"], list):
                if "recommendations" not in data or not data["recommendations"]:
                    data["recommendations"] = [f"Verified: {vc}" for vc in data["verified_claims"]]
            if "evidence_attachment" in data and "evidence_attachment_url" not in data:
                data["evidence_attachment_url"] = str(data["evidence_attachment"])
        return data


class StakeholderReviewResponse(BaseModel):
    id: int
    project_id: int
    reviewer_name: str
    reviewer_role: str
    review_date: datetime
    problem_clarity_score: Optional[float] = None
    solution_feasibility_score: Optional[float] = None
    innovation_score: Optional[float] = None
    usability_score: Optional[float] = None
    score: Optional[float] = None
    feedback_text: str
    recommendations: List[str] = []
    evidence_attachment_url: Optional[str] = None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if hasattr(data, "innovation_score"):
            pass
        elif isinstance(data, dict):
            if "score" not in data or data["score"] is None:
                data["score"] = data.get("innovation_score") or data.get("solution_feasibility_score")
        return data

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# Research Paper Synchronization
# -------------------------------------------------------------
class ValidationSyncResearchRequest(BaseModel):
    target_doc_type: str = "research_paper"
    overwrite_sections: bool = False


class ValidationSyncResearchResponse(BaseModel):
    project_id: int
    document_id: int
    claims_synced_count: int
    evidence_items_count: int
    updated_sections: List[str]
    markdown_validation_matrix: str
    latex_validation_matrix: str
    summary_text: str
    success: Optional[bool] = True
    message: str
    updated_document: Optional[Dict[str, Any]] = None
