from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.intelligence import ProjectIntelligenceSnapshot
from app.schemas.intelligence import (
    ProjectIntelligenceProfile, ProjectHealthSummary,
    NextBestAction, ProjectRiskItem, ResearchCluster,
    InnovationGapItem, HealthTimelinePoint, IntelligenceRefreshResponse
)
from app.services.project_intelligence_service import project_intelligence_service
from app.utils.security import get_current_user
from app.utils.rate_limiter import rate_limit
from app.config import settings

router = APIRouter(prefix="/projects", tags=["Project Intelligence"])

def _authorize_project_access(project_id: int, current_user: User, db: Session) -> Project:
    """Enforce IDOR protection: only owner, mentor, or admin can access project intelligence."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )
    if project.user_id != current_user.id and current_user.role not in ["mentor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access intelligence metrics for this project."
        )
    return project

@router.get(
    "/{project_id}/intelligence",
    response_model=ProjectIntelligenceProfile,
    summary="Get Complete Project Intelligence Profile",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="intelligence_profile"))]
)
async def get_project_intelligence(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full AI Project Intelligence profile including 7-dimension maturity matrix,
    composite health score, risk engine findings, highest-leverage next best action,
    and semantic research clusters.
    """
    _authorize_project_access(project_id, current_user, db)
    try:
        profile = await project_intelligence_service.get_or_compute_profile(
            project_id=project_id,
            db=db,
            force_refresh=False
        )
        return profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate project intelligence: {str(e)}"
        )

@router.post(
    "/{project_id}/intelligence/refresh",
    response_model=IntelligenceRefreshResponse,
    summary="Force Recalculate Project Intelligence Snapshot",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="intelligence_refresh"))]
)
async def refresh_project_intelligence(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Forces immediate re-evaluation across all 7 dimensions and persists a new historical snapshot.
    """
    _authorize_project_access(project_id, current_user, db)
    try:
        profile = await project_intelligence_service.get_or_compute_profile(
            project_id=project_id,
            db=db,
            force_refresh=True
        )
        return IntelligenceRefreshResponse(
            success=True,
            message="Project intelligence successfully recalculated and snapshot recorded.",
            profile=profile
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh project intelligence: {str(e)}"
        )

@router.get(
    "/{project_id}/health",
    response_model=ProjectHealthSummary,
    summary="Get Multi-Dimensional Project Health Summary"
)
async def get_project_health(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns composite health score (0-100), transparent status label, and 7 readiness dimensions.
    """
    project = _authorize_project_access(project_id, current_user, db)
    profile = await project_intelligence_service.get_or_compute_profile(project_id, db)
    
    status_descriptions = {
        "EXEMPLARY": "Exemplary maturity across literature, architecture, and execution cadence. Ready for competition presentation.",
        "STRONG": "High maturity and well-grounded theoretical foundation with active milestones.",
        "DEVELOPING": "Solid development progress, pending key dataset acquisition and milestone execution.",
        "NEEDS_ATTENTION": "Gaps identified in research foundation or technical architecture.",
        "CRITICAL": "Early conceptual formulation. Immediate literature review and dataset acquisition required."
    }

    return ProjectHealthSummary(
        project_id=project.id,
        project_title=project.title,
        domain=project.domain,
        overall_score=profile.overall_health_score,
        health_status=profile.health_status,
        status_label=profile.health_status.replace("_", " ").title(),
        status_description=status_descriptions.get(profile.health_status, "Active innovation tracking."),
        dimensions=profile.dimensions,
        computed_at=profile.evaluated_at
    )

@router.get(
    "/{project_id}/next-action",
    response_model=NextBestAction,
    summary="Get Highest-Leverage Next Best Action"
)
async def get_next_best_action(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes the single highest-impact, evidence-backed next action with supporting resource citations.
    """
    _authorize_project_access(project_id, current_user, db)
    profile = await project_intelligence_service.get_or_compute_profile(project_id, db)
    return profile.next_best_action

@router.get(
    "/{project_id}/risks",
    response_model=List[ProjectRiskItem],
    summary="Get Detected Project Risks & Mitigations"
)
async def get_project_risks(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns automated risk detections categorized by Technical, Research, Dataset, Hardware, and Execution.
    """
    _authorize_project_access(project_id, current_user, db)
    profile = await project_intelligence_service.get_or_compute_profile(project_id, db)
    return profile.risks

@router.get(
    "/{project_id}/research-landscape",
    response_model=Dict[str, Any],
    summary="Get Clustered Research Landscape & Innovation Gaps"
)
async def get_research_landscape(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns 4 scientific research clusters and strategic innovation gaps for the project.
    """
    _authorize_project_access(project_id, current_user, db)
    profile = await project_intelligence_service.get_or_compute_profile(project_id, db)
    return {
        "project_id": project_id,
        "project_title": profile.project_title,
        "domain": profile.domain,
        "research_clusters": profile.research_clusters,
        "innovation_gaps": profile.innovation_gaps
    }

@router.get(
    "/{project_id}/health-history",
    response_model=List[HealthTimelinePoint],
    summary="Get Historical Health Snapshots for Timeline"
)
async def get_project_health_history(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns chronological timeline snapshots tracking health score trajectory over time.
    """
    _authorize_project_access(project_id, current_user, db)
    snapshots = (
        db.query(ProjectIntelligenceSnapshot)
        .filter(ProjectIntelligenceSnapshot.project_id == project_id)
        .order_by(ProjectIntelligenceSnapshot.created_at.asc())
        .all()
    )
    if not snapshots:
        # Initialize initial baseline snapshot
        await project_intelligence_service.get_or_compute_profile(project_id, db)
        snapshots = (
            db.query(ProjectIntelligenceSnapshot)
            .filter(ProjectIntelligenceSnapshot.project_id == project_id)
            .order_by(ProjectIntelligenceSnapshot.created_at.asc())
            .all()
        )

    return [
        HealthTimelinePoint(
            id=s.id,
            health_score=s.overall_health_score,
            health_status=s.health_status,
            created_at=s.created_at,
            summary_verdict=s.summary_verdict
        )
        for s in snapshots
    ]
