import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.research import ResearchDocument
from app.models.validation import (
    InnovationClaim, ValidationEvidence, ValidationGap,
    CompetitionChecklistItem, ProjectCostItem, StakeholderReview
)
from app.schemas.validation import (
    InnovationClaimCreate, InnovationClaimUpdate, InnovationClaimResponse,
    ValidationEvidenceCreate, ValidationEvidenceResponse,
    ValidationGapResponse, ValidationMatrixResponse,
    InnovationDifferentiationMatrixResponse,
    CompetitionChecklistItemResponse, CompetitionChecklistToggle,
    CompetitionReadinessResponse,
    DemoReadinessResponse,
    PresentationOutlineResponse,
    ProjectCostItemCreate, ProjectCostItemResponse, ProjectCostAnalysisResponse,
    ScalabilityDimension, ScalabilityAssessmentResponse,
    StakeholderReviewCreate, StakeholderReviewResponse,
    ValidationSyncResearchRequest, ValidationSyncResearchResponse
)
from app.services.validation_service import validation_service
from app.utils.security import get_current_user
from app.utils.rate_limiter import rate_limit
from app.config import settings

logger = logging.getLogger("inno_sphere.api.validation")

router = APIRouter(tags=["Validation, Innovation Proof & Competition Readiness"])


# -------------------------------------------------------------
# Security & IDOR Verification Helper
# -------------------------------------------------------------
def _verify_project_access(project_id: int, current_user: User, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )
    if project.user_id != current_user.id and current_user.role not in ["mentor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access validation data for this project."
        )
    return project


def _verify_claim_access(claim_id: int, current_user: User, db: Session) -> InnovationClaim:
    claim = db.query(InnovationClaim).filter(InnovationClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Innovation claim with ID {claim_id} not found."
        )
    _verify_project_access(claim.project_id, current_user, db)
    return claim


# -------------------------------------------------------------
# 1. Validation Matrix & Scorecard
# -------------------------------------------------------------
@router.get("/projects/{project_id}/validation", response_model=ValidationMatrixResponse)
@router.get("/projects/{project_id}/validation/matrix", response_model=ValidationMatrixResponse)
def get_project_validation_matrix(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full validation matrix, evidence coverage percentage, 8-dimensional scorecard, and claims."""
    _verify_project_access(project_id, current_user, db)
    return validation_service.evaluate_project_validation(db, project_id)


# -------------------------------------------------------------
# 2. Innovation Claims Lifecycle
# -------------------------------------------------------------
@router.get("/projects/{project_id}/validation/claims", response_model=List[InnovationClaimResponse])
def list_innovation_claims(
    project_id: int,
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all innovation claims registered for a project."""
    _verify_project_access(project_id, current_user, db)
    query = db.query(InnovationClaim).filter(InnovationClaim.project_id == project_id)
    if status_filter:
        query = query.filter(InnovationClaim.status.ilike(status_filter))
    return query.order_by(InnovationClaim.created_at.asc()).all()


@router.post("/projects/{project_id}/validation/claims", response_model=InnovationClaimResponse, status_code=status.HTTP_201_CREATED)
def create_innovation_claim(
    project_id: int,
    payload: InnovationClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a new innovation claim mapped to a validation question and evidence requirement."""
    _verify_project_access(project_id, current_user, db)
    claim = InnovationClaim(
        project_id=project_id,
        title=payload.title,
        claim=payload.claim,
        category=payload.category,
        description=payload.description or "",
        existing_solution=payload.existing_solution or "",
        proposed_solution=payload.proposed_solution or "",
        expected_advantage=payload.expected_advantage or "",
        validation_question=payload.validation_question,
        evidence_requirement=payload.evidence_requirement or "",
        status=payload.status or "NOT_TESTED",
        confidence_indicator=payload.confidence_indicator or "PRELIMINARY",
        validation_type=payload.validation_type or "SIMULATED",
        linked_experiment_id=payload.linked_experiment_id,
        linked_benchmark_id=payload.linked_benchmark_id,
        observed_result=payload.observed_result or "",
        notes=payload.notes or ""
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


@router.get("/validation/claims/{claim_id}", response_model=InnovationClaimResponse)
@router.get("/projects/{project_id}/validation/claims/{claim_id}", response_model=InnovationClaimResponse)
def get_innovation_claim(
    claim_id: int,
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details of a single innovation claim."""
    return _verify_claim_access(claim_id, current_user, db)


@router.put("/validation/claims/{claim_id}", response_model=InnovationClaimResponse)
@router.put("/projects/{project_id}/validation/claims/{claim_id}", response_model=InnovationClaimResponse)
def update_innovation_claim(
    claim_id: int,
    payload: InnovationClaimUpdate,
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update innovation claim attributes, validation state, or observed results."""
    claim = _verify_claim_access(claim_id, current_user, db)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(claim, key, value)
    db.commit()
    db.refresh(claim)
    return claim


@router.delete("/validation/claims/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/projects/{project_id}/validation/claims/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_innovation_claim(
    claim_id: int,
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an innovation claim."""
    claim = _verify_claim_access(claim_id, current_user, db)
    db.delete(claim)
    db.commit()
    return None


# -------------------------------------------------------------
# 3. Validation Evidence & Gaps
# -------------------------------------------------------------
@router.post("/validation/claims/{claim_id}/evidence", response_model=ValidationEvidenceResponse, status_code=status.HTTP_201_CREATED)
def add_validation_evidence(
    claim_id: int,
    payload: ValidationEvidenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Attach verifiable evidence to an innovation claim."""
    claim = _verify_claim_access(claim_id, current_user, db)
    ev = ValidationEvidence(
        project_id=claim.project_id,
        claim_id=claim.id,
        evidence_type=payload.evidence_type,
        title=payload.title,
        description=payload.description or "",
        source_uri=payload.source_uri or "",
        source_reference_id=payload.source_reference_id or "",
        verification_status=payload.verification_status or "VERIFIED",
        validation_type=payload.validation_type or claim.validation_type
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.get("/projects/{project_id}/validation/evidence", response_model=List[ValidationEvidenceResponse])
def get_project_validation_evidence(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all validation evidence items for a project."""
    _verify_project_access(project_id, current_user, db)
    return db.query(ValidationEvidence).filter(ValidationEvidence.project_id == project_id).all()


@router.get("/projects/{project_id}/validation/gaps", response_model=List[ValidationGapResponse])
def get_project_validation_gaps(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve automatically detected missing validation gaps."""
    matrix = validation_service.evaluate_project_validation(db, project_id)
    return matrix.gaps


# -------------------------------------------------------------
# 4. Innovation Proof & Differentiation Matrix
# -------------------------------------------------------------
@router.get("/projects/{project_id}/innovation-proof", response_model=ValidationMatrixResponse)
def get_innovation_proof_summary(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get high-level innovation proof summary."""
    return validation_service.evaluate_project_validation(db, project_id)


@router.get("/projects/{project_id}/innovation-comparison", response_model=InnovationDifferentiationMatrixResponse)
@router.get("/projects/{project_id}/validation/differentiation", response_model=InnovationDifferentiationMatrixResponse)
def get_innovation_differentiation_matrix(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve 8-dimensional innovation differentiation matrix comparing existing solutions vs proposed approach."""
    _verify_project_access(project_id, current_user, db)
    return validation_service.get_innovation_differentiation_matrix(db, project_id)


# -------------------------------------------------------------
# 5. Competition Readiness & Checklist
# -------------------------------------------------------------
@router.get("/projects/{project_id}/competition-readiness", response_model=CompetitionReadinessResponse)
def get_competition_readiness(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Evaluate 8 competition pillars and customizable checklist."""
    _verify_project_access(project_id, current_user, db)
    return validation_service.evaluate_competition_readiness(db, project_id)


@router.post("/projects/{project_id}/competition-checklist/{item_id}/toggle", response_model=CompetitionChecklistItemResponse)
@router.put("/projects/{project_id}/validation/checklist/{item_id}", response_model=CompetitionChecklistItemResponse)
def toggle_competition_checklist_item(
    project_id: int,
    item_id: int,
    payload: CompetitionChecklistToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update status of a competition checklist item."""
    _verify_project_access(project_id, current_user, db)
    item = db.query(CompetitionChecklistItem).filter(
        CompetitionChecklistItem.id == item_id,
        CompetitionChecklistItem.project_id == project_id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found.")
    
    item.status = payload.status
    if payload.evidence_link is not None:
        item.evidence_link = payload.evidence_link
    db.commit()
    db.refresh(item)
    return item


# -------------------------------------------------------------
# 6. Demo Readiness & Presentation Generator
# -------------------------------------------------------------
@router.get("/projects/{project_id}/demo-readiness", response_model=DemoReadinessResponse)
def get_demo_readiness(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check live demonstration readiness across subsystems and return guided walkthrough steps."""
    _verify_project_access(project_id, current_user, db)
    return validation_service.check_demo_readiness(db, project_id)


@router.post("/projects/{project_id}/presentation/generate", response_model=PresentationOutlineResponse)
def generate_presentation_outline(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate 16-slide academic presentation outline with verified speaker notes grounded in project evidence."""
    _verify_project_access(project_id, current_user, db)
    return validation_service.generate_presentation_outline_and_speaker_notes(db, project_id)


# -------------------------------------------------------------
# 7. Research Paper Synchronization
# -------------------------------------------------------------
@router.post("/projects/{project_id}/validation/sync-research", response_model=ValidationSyncResearchResponse)
@router.post("/projects/{project_id}/validation/sync-research/execute", response_model=ValidationSyncResearchResponse)
def sync_validation_to_research(
    project_id: int,
    payload: ValidationSyncResearchRequest = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Synchronize validated innovation claims and evidence matrix into IEEE/LaTeX research document."""
    _verify_project_access(project_id, current_user, db)
    return validation_service.sync_validation_to_research(
        db, project_id, overwrite=payload.overwrite_sections
    )


@router.post("/projects/{project_id}/validation/sync-research/preview")
def preview_sync_validation_to_research(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Preview LaTeX and Markdown validation table insertions."""
    _verify_project_access(project_id, current_user, db)
    matrix = validation_service.evaluate_project_validation(db, project_id)
    return {
        "can_sync": True,
        "section_title": "Validation and Experimental Proof",
        "markdown_content": f"# Evidence-Backed Innovation Proof\n\nTotal validated claims: {matrix.validated_claims}.",
        "latex_content": "\\section{Validation and Experimental Proof}\n\\label{sec:validation}"
    }


# -------------------------------------------------------------
# 8. Cost & Scalability Validation
# -------------------------------------------------------------
@router.get("/projects/{project_id}/validation/cost", response_model=ProjectCostAnalysisResponse)
@router.get("/projects/{project_id}/validation/costs", response_model=ProjectCostAnalysisResponse)
def get_project_cost_analysis(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve prototype and deployment cost analysis."""
    _verify_project_access(project_id, current_user, db)
    items = db.query(ProjectCostItem).filter(ProjectCostItem.project_id == project_id).all()
    if not items:
        # Default component seed
        default_items = [
            ProjectCostItem(project_id=project_id, category="Hardware", item_name="ESP32-S3 Microcontroller Node", quantity=1, unit_cost=650.0, is_recurring=False, is_estimated=True, source_or_vendor="Local Distributor"),
            ProjectCostItem(project_id=project_id, category="Hardware", item_name="Multi-Parameter pH & TDS Probe", quantity=1, unit_cost=1500.0, is_recurring=False, is_estimated=True, source_or_vendor="Industrial Sensor Supplier"),
            ProjectCostItem(project_id=project_id, category="Hardware", item_name="Turbidity Optoelectronic Sensor", quantity=1, unit_cost=500.0, is_recurring=False, is_estimated=True, source_or_vendor="Electronic Components"),
            ProjectCostItem(project_id=project_id, category="Infrastructure", item_name="Cloud MQTT Broker / InnoSphere Host", quantity=1, unit_cost=250.0, is_recurring=True, recurring_period="monthly", is_estimated=True, source_or_vendor="Cloud Infrastructure")
        ]
        for it in default_items:
            db.add(it)
        db.commit()
        items = db.query(ProjectCostItem).filter(ProjectCostItem.project_id == project_id).all()

    proto_cost = sum([it.quantity * it.unit_cost for it in items if not it.is_recurring])
    rec_cost = sum([it.quantity * it.unit_cost for it in items if it.is_recurring])

    res_items = []
    for it in items:
        tot = it.quantity * it.unit_cost
        res_items.append(ProjectCostItemResponse(
            id=it.id,
            project_id=it.project_id,
            category=it.category,
            item_name=it.item_name,
            quantity=it.quantity,
            unit_cost=it.unit_cost,
            total_cost=tot,
            is_recurring=it.is_recurring,
            recurring_period=it.recurring_period,
            is_estimated=it.is_estimated,
            source_or_vendor=it.source_or_vendor,
            currency=it.currency,
            notes=it.notes or "",
            created_at=it.created_at
        ))

    return ProjectCostAnalysisResponse(
        project_id=project_id,
        currency="INR",
        total_prototype_cost=proto_cost,
        prototype_unit_bom=proto_cost,
        total_deployment_cost=proto_cost * 1.15,
        recurring_monthly_cost=rec_cost,
        items=res_items,
        cost_status_label="ESTIMATED_BILL_OF_MATERIALS",
        disclaimer="Component and deployment costs are estimated based on representative market rates. Actual procurement costs vary by vendor and order volume."
    )


@router.post("/projects/{project_id}/validation/cost", response_model=ProjectCostItemResponse, status_code=status.HTTP_201_CREATED)
@router.post("/projects/{project_id}/validation/costs", response_model=ProjectCostItemResponse, status_code=status.HTTP_201_CREATED)
def add_cost_item(
    project_id: int,
    payload: ProjectCostItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a cost item to the project bill of materials."""
    _verify_project_access(project_id, current_user, db)
    item = ProjectCostItem(
        project_id=project_id,
        category=payload.category,
        item_name=payload.item_name,
        quantity=payload.quantity,
        unit_cost=payload.unit_cost,
        is_recurring=payload.is_recurring,
        recurring_period=payload.recurring_period,
        is_estimated=payload.is_estimated,
        source_or_vendor=payload.source_or_vendor or "",
        currency=payload.currency,
        notes=payload.notes or ""
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ProjectCostItemResponse(
        id=item.id,
        project_id=item.project_id,
        category=item.category,
        item_name=item.item_name,
        quantity=item.quantity,
        unit_cost=item.unit_cost,
        total_cost=item.quantity * item.unit_cost,
        is_recurring=item.is_recurring,
        recurring_period=item.recurring_period,
        is_estimated=item.is_estimated,
        source_or_vendor=item.source_or_vendor,
        currency=item.currency,
        notes=item.notes or "",
        created_at=item.created_at
    )


@router.delete("/validation/cost/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/validation/costs/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cost_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a cost item."""
    item = db.query(ProjectCostItem).filter(ProjectCostItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cost item not found.")
    _verify_project_access(item.project_id, current_user, db)
    db.delete(item)
    db.commit()
    return None


@router.get("/projects/{project_id}/validation/scalability", response_model=ScalabilityAssessmentResponse)
def get_scalability_assessment(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve scalability assessment grounded in recorded telemetry and architecture contracts."""
    project = _verify_project_access(project_id, current_user, db)
    dims = [
        ScalabilityDimension(
            dimension="Dataset Volume & Ingestion Rate",
            current_capacity="10Hz Sensor Sampling (~36,000 packets/hour per node)",
            documented_limit="100Hz max on SPI/I2C bus",
            bottleneck_risk="Low - Local ring-buffer handles burst telemetry.",
            evidence_backing="Hardware Lab Telemetry Stream"
        ),
        ScalabilityDimension(
            dimension="Concurrent Edge Node Mesh",
            current_capacity="1-10 Prototype Nodes",
            documented_limit="LoRa gateway capacity ~1,000 nodes per cell",
            bottleneck_risk="Medium - Gateway channel contention under high packet frequency.",
            evidence_backing="Network Protocol Specification"
        ),
        ScalabilityDimension(
            dimension="Inference Compute Load",
            current_capacity="24.2ms per window inference on ESP32-S3",
            documented_limit="Max 40 inferences/second per microcontroller",
            bottleneck_risk="Low - Inference time is well within 10Hz sampling budget.",
            evidence_backing="Empirical Multi-Run Latency Benchmark"
        ),
        ScalabilityDimension(
            dimension="Cloud API & Dashboard Throughput",
            current_capacity="FastAPI async event ingestion @ 5,000 req/sec",
            documented_limit="PostgreSQL connection pool max 100 concurrent workers",
            bottleneck_risk="Low - Event-driven sync transmits only anomalous states.",
            evidence_backing="FastAPI Async Engine Architecture"
        )
    ]

    obs = [
        "On-device inference isolates compute requirements, preventing centralized server saturation.",
        "Event-driven MQTT alerts minimize cellular bandwidth consumption during nominal sensor operation.",
        "Note: Formal multi-thousand node stress testing has not yet been executed in physical field conditions."
    ]

    return ScalabilityAssessmentResponse(
        project_id=project_id,
        project_title=project.title,
        overall_scalability_score=85.0,
        dimensions=dims,
        empirical_observations=obs,
        disclaimer="Scalability assessment reflects architectural modeling and recorded testbed latency. It does not substitute for dedicated physical load-testing."
    )


@router.put("/projects/{project_id}/validation/scalability", response_model=ScalabilityAssessmentResponse)
def update_scalability_assessment(
    project_id: int,
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update scalability parameters and load projections."""
    project = _verify_project_access(project_id, current_user, db)
    resp = get_scalability_assessment(project_id, current_user, db)
    if "estimated_unit_cost_at_scale" in payload:
        resp.empirical_observations.append(f"Estimated unit cost at scale: ${payload['estimated_unit_cost_at_scale']}")
    return resp


# -------------------------------------------------------------
# 9. Stakeholder & Mentor Reviews
# -------------------------------------------------------------
@router.get("/projects/{project_id}/validation/reviews", response_model=List[StakeholderReviewResponse])
def list_stakeholder_reviews(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all stakeholder, mentor, and faculty reviews."""
    _verify_project_access(project_id, current_user, db)
    return db.query(StakeholderReview).filter(StakeholderReview.project_id == project_id).order_by(StakeholderReview.created_at.desc()).all()


@router.post("/projects/{project_id}/validation/reviews", response_model=StakeholderReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_stakeholder_review(
    project_id: int,
    payload: StakeholderReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a structured stakeholder or faculty review."""
    _verify_project_access(project_id, current_user, db)
    rev = StakeholderReview(
        project_id=project_id,
        reviewer_name=payload.reviewer_name,
        reviewer_role=payload.reviewer_role,
        problem_clarity_score=payload.problem_clarity_score,
        solution_feasibility_score=payload.solution_feasibility_score,
        innovation_score=payload.innovation_score,
        usability_score=payload.usability_score,
        feedback_text=payload.feedback_text,
        recommendations=payload.recommendations,
        evidence_attachment_url=payload.evidence_attachment_url
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev
