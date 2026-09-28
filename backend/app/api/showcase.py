import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.utils.security import get_current_active_user, get_current_user_optional
from app.schemas.showcase import (
    ShowcaseResponse, ShowcaseHealthResponse,
    EvidenceTraceItem, ProjectEvidenceSummaryResponse
)
from app.services.showcase_service import showcase_service

logger = logging.getLogger("inno_sphere.api.showcase")

router = APIRouter(prefix="", tags=["Project Innovation Showcase"])


def _verify_project_access(project_id: int, current_user: Optional[User], db: Session) -> Project:
    """Verifies project exists and checks access permissions."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )
    if current_user and current_user.role not in ["mentor", "faculty", "admin"] and project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this project's showcase."
        )
    return project


@router.get("/showcase/flagship")
def get_flagship_showcase_project(
    db: Session = Depends(get_db)
):
    """
    Returns the flagship showcase project ID and summary for quick presentation launch.
    """
    flagship = db.query(Project).filter(
        Project.title.ilike("%water%") | Project.title.ilike("%health%") | Project.title.ilike("%iot%")
    ).first()

    if not flagship:
        flagship = db.query(Project).first()

    if not flagship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No showcase projects available."
        )

    return {
        "flagship_project_id": flagship.id,
        "title": flagship.title,
        "domain": flagship.domain,
        "status": flagship.status,
        "progress": flagship.progress
    }


@router.get("/projects/{project_id}/showcase", response_model=ShowcaseResponse)
@router.get("/showcase/{project_id}", response_model=ShowcaseResponse)
def get_project_showcase(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns complete integrated project showcase profile and evidence catalog.
    """
    _verify_project_access(project_id, current_user, db)
    try:
        return showcase_service.get_showcase_profile(project_id, db)
    except Exception as e:
        logger.error(f"Error generating showcase profile for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate showcase profile: {str(e)}"
        )


@router.get("/projects/{project_id}/showcase/health", response_model=ShowcaseHealthResponse)
def get_project_showcase_health(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns live operational health status for all integrated showcase subsystems.
    """
    _verify_project_access(project_id, current_user, db)
    return showcase_service.get_showcase_health(project_id, db)


@router.get("/projects/{project_id}/showcase/evidence", response_model=List[EvidenceTraceItem])
def get_project_showcase_evidence(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns granular catalog of all evidence traces (experiments, runs, citations, validation claims).
    """
    _verify_project_access(project_id, current_user, db)
    profile = showcase_service.get_showcase_profile(project_id, db)
    return profile.evidence_traces


@router.get("/projects/{project_id}/showcase/evidence-summary", response_model=ProjectEvidenceSummaryResponse)
def get_project_evidence_summary(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Generates a unified Markdown & JSON Project Evidence Summary.
    """
    _verify_project_access(project_id, current_user, db)
    return showcase_service.generate_evidence_summary(project_id, db)
