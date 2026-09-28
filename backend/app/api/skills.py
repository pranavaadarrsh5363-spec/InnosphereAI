from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.skill import Skill, ProjectSkillRequirement, StudentSkillProfile, SkillGap, LearningPathItem
from app.schemas.skill import (
    SkillRequirementOut, StudentSkillProfileUpdate, StudentSkillProfileBatchUpdate,
    StudentSkillProfileOut, SkillGapOut, SkillDependencyGraphOut,
    LearningResourceRef, LearningRoadmapOut, ProjectSkillsAnalysisResponse,
    RoadmapSyncResponse, SkillPlanExportResponse
)
from app.services.skill_gap_service import skill_gap_service
from app.utils.security import get_current_user
from app.utils.rate_limiter import rate_limit
from app.config import settings

router = APIRouter(tags=["Skills & Prerequisites Gap Map"])


def _authorize_project_access(project_id: int, current_user: User, db: Session) -> Project:
    """Enforce IDOR protection: only project owner, faculty/mentor, or admin can access skill analysis."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )
    if project.user_id != current_user.id and current_user.role not in ["mentor", "faculty", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access skill and learning analysis for this project."
        )
    return project


# -----------------------------------------------------------------------------
# 1. Complete Skills & Prerequisites Analysis
# -----------------------------------------------------------------------------
@router.get(
    "/projects/{project_id}/skills",
    response_model=ProjectSkillsAnalysisResponse,
    summary="Get Project Skills & Prerequisites Gap Map",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="skills_get"))]
)
async def get_project_skills(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns complete Skills & Prerequisites Gap Map including:
    - Required technologies to skills mapping
    - Skill requirements and sources
    - Student skill profile and self-assessment
    - Detailed skill gaps and prerequisite chains
    - Topological skill dependency graph
    - 6-phase personalized learning roadmap with grounded resources
    - 'Am I Ready to Start?' implementation milestones
    """
    project = _authorize_project_access(project_id, current_user, db)
    try:
        return skill_gap_service.get_project_skills_analysis(db, project.id, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating skill gap analysis: {str(e)}"
        )


@router.post(
    "/projects/{project_id}/skills/analyze",
    response_model=ProjectSkillsAnalysisResponse,
    summary="Trigger Project Skills Analysis & Requirement Extraction",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="skills_analyze"))]
)
async def analyze_project_skills(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Triggers/re-extracts project skill requirements and updates the gap analysis."""
    project = _authorize_project_access(project_id, current_user, db)
    # Clear requirement cache to force re-extraction
    db.query(ProjectSkillRequirement).filter(ProjectSkillRequirement.project_id == project.id).delete()
    db.commit()
    return skill_gap_service.get_project_skills_analysis(db, project.id, current_user.id)


# -----------------------------------------------------------------------------
# 2. Granular Requirements, Gaps & Prerequisites
# -----------------------------------------------------------------------------
@router.get(
    "/projects/{project_id}/skills/requirements",
    response_model=List[SkillRequirementOut],
    summary="Get Required Project Skills",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_reqs"))]
)
async def get_project_skill_requirements(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the list of required skills with priority, source type, and rationale."""
    project = _authorize_project_access(project_id, current_user, db)
    reqs = skill_gap_service.extract_project_skill_requirements(db, project)
    return [
        SkillRequirementOut(
            id=r.id,
            skill_id=r.skill_id,
            skill_name=r.skill.name,
            category=r.skill.category,
            required_level=r.required_level,
            priority=r.priority,
            reason=r.reason,
            source_type=r.source_type,
            evidence_refs=r.evidence_refs or [],
            prerequisites=r.skill.prerequisites or [],
            default_learning_effort=r.skill.default_learning_effort or "MEDIUM"
        )
        for r in reqs if r.skill
    ]


@router.get(
    "/projects/{project_id}/skills/gaps",
    response_model=List[SkillGapOut],
    summary="Get Specific Skill Gaps",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_gaps"))]
)
async def get_project_skill_gaps(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns identified skill gaps with required vs current levels and prerequisite chains."""
    project = _authorize_project_access(project_id, current_user, db)
    analysis = skill_gap_service.get_project_skills_analysis(db, project.id, current_user.id)
    return analysis.skill_gaps


@router.get(
    "/projects/{project_id}/skills/prerequisites",
    response_model=SkillDependencyGraphOut,
    summary="Get Skill Dependency Graph",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_prereqs"))]
)
async def get_project_skill_prerequisites(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns topological skill dependency graph with nodes, levels, and prerequisite edges."""
    project = _authorize_project_access(project_id, current_user, db)
    analysis = skill_gap_service.get_project_skills_analysis(db, project.id, current_user.id)
    return analysis.dependency_graph


@router.get(
    "/projects/{project_id}/skills/resources",
    response_model=Dict[str, List[LearningResourceRef]],
    summary="Get Discovered Learning Resources by Skill",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_resources"))]
)
async def get_project_learning_resources(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns discovered academic, tutorial, GitHub, and dataset resources grouped by skill gap."""
    project = _authorize_project_access(project_id, current_user, db)
    reqs = skill_gap_service.extract_project_skill_requirements(db, project)
    skills = [r.skill for r in reqs if r.skill]
    return skill_gap_service.discover_learning_resources_for_skills(db, skills, project)


@router.get(
    "/projects/{project_id}/skills/learning-path",
    response_model=LearningRoadmapOut,
    summary="Get Structured Learning Roadmap",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_path"))]
)
async def get_project_learning_path(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns ordered multi-phase learning roadmap respecting prerequisite dependencies."""
    project = _authorize_project_access(project_id, current_user, db)
    analysis = skill_gap_service.get_project_skills_analysis(db, project.id, current_user.id)
    return analysis.learning_roadmap


# -----------------------------------------------------------------------------
# 3. Student Skill Profile & Questionnaire Updates
# -----------------------------------------------------------------------------
@router.post(
    "/projects/{project_id}/skills/profile",
    response_model=List[StudentSkillProfileOut],
    summary="Update or Onboard Student Skill Profile for Project",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_profile_post"))]
)
async def update_student_skill_profile_batch(
    project_id: int,
    payload: StudentSkillProfileBatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Batch updates student skill levels from onboarding questionnaire."""
    project = _authorize_project_access(project_id, current_user, db)

    for item in payload.profiles:
        skill = skill_gap_service.get_or_create_skill(db, item.skill_name)
        prof = db.query(StudentSkillProfile).filter(
            StudentSkillProfile.user_id == current_user.id,
            StudentSkillProfile.skill_id == skill.id
        ).first()

        if not prof:
            prof = StudentSkillProfile(
                user_id=current_user.id,
                skill_id=skill.id,
                current_level=item.current_level,
                progress_pct=item.progress_pct or 0,
                learning_status=item.learning_status or "NOT_STARTED",
                evidence_items=item.evidence_items or [{"type": "SELF_REPORTED", "title": "Onboarding Questionnaire", "date": datetime.utcnow().strftime("%Y-%m-%d")}],
                confidence=item.confidence or "MEDIUM"
            )
            db.add(prof)
        else:
            prof.current_level = item.current_level
            if item.progress_pct is not None:
                prof.progress_pct = item.progress_pct
            if item.learning_status:
                prof.learning_status = item.learning_status
            if item.evidence_items:
                prof.evidence_items = item.evidence_items
            if item.confidence:
                prof.confidence = item.confidence
            prof.last_updated = datetime.utcnow()

    db.commit()

    # Recalculate analysis
    analysis = skill_gap_service.get_project_skills_analysis(db, project.id, current_user.id)
    return analysis.student_profile


@router.put(
    "/projects/{project_id}/skills/profile",
    response_model=StudentSkillProfileOut,
    summary="Update Specific Skill Profile Entry",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_profile_put"))]
)
async def update_single_skill_profile(
    project_id: int,
    item: StudentSkillProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates a single skill level or adds evidence."""
    project = _authorize_project_access(project_id, current_user, db)
    skill = skill_gap_service.get_or_create_skill(db, item.skill_name)

    prof = db.query(StudentSkillProfile).filter(
        StudentSkillProfile.user_id == current_user.id,
        StudentSkillProfile.skill_id == skill.id
    ).first()

    if not prof:
        prof = StudentSkillProfile(
            user_id=current_user.id,
            skill_id=skill.id,
            current_level=item.current_level,
            progress_pct=item.progress_pct or 0,
            learning_status=item.learning_status or "NOT_STARTED",
            evidence_items=item.evidence_items or [],
            confidence=item.confidence or "MEDIUM"
        )
        db.add(prof)
    else:
        prof.current_level = item.current_level
        if item.progress_pct is not None:
            prof.progress_pct = item.progress_pct
        if item.learning_status:
            prof.learning_status = item.learning_status
        if item.evidence_items:
            existing_ev = prof.evidence_items or []
            existing_ev.extend(item.evidence_items)
            prof.evidence_items = existing_ev
        if item.confidence:
            prof.confidence = item.confidence
        prof.last_updated = datetime.utcnow()

    db.commit()
    db.refresh(prof)

    return StudentSkillProfileOut(
        id=prof.id,
        skill_id=prof.skill_id,
        skill_name=skill.name,
        current_level=prof.current_level,
        progress_pct=prof.progress_pct,
        learning_status=prof.learning_status,
        evidence_items=prof.evidence_items or [],
        confidence=prof.confidence,
        last_updated=prof.last_updated
    )


# -----------------------------------------------------------------------------
# 4. Roadmap Sync, Refresh & Export
# -----------------------------------------------------------------------------
@router.post(
    "/projects/{project_id}/skills/sync-roadmap",
    response_model=RoadmapSyncResponse,
    summary="Synchronize Learning Plan into Project Roadmap",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_sync"))]
)
async def sync_skills_to_roadmap(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Synchronizes learning phases as structured milestone tasks in the Project Roadmap."""
    project = _authorize_project_access(project_id, current_user, db)
    return skill_gap_service.sync_learning_plan_to_roadmap(db, project.id, current_user.id)


@router.post(
    "/projects/{project_id}/skills/refresh",
    response_model=ProjectSkillsAnalysisResponse,
    summary="Refresh Project Skill Analysis",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="skills_refresh"))]
)
async def refresh_project_skills(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Forces complete re-evaluation of project skill requirements and gap calculations."""
    project = _authorize_project_access(project_id, current_user, db)
    return skill_gap_service.get_project_skills_analysis(db, project.id, current_user.id)


@router.post(
    "/projects/{project_id}/skills/export",
    response_model=SkillPlanExportResponse,
    summary="Export Skills & Learning Plan",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_export"))]
)
async def export_project_skills(
    project_id: int,
    format: str = Query("markdown", description="Export format: 'markdown' or 'json'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports structured learning and skill prerequisite plan in Markdown or JSON format."""
    project = _authorize_project_access(project_id, current_user, db)
    return skill_gap_service.export_skill_plan(db, project.id, export_format=format)


# -----------------------------------------------------------------------------
# 5. Global / Flagship Skills Overview
# -----------------------------------------------------------------------------
@router.get(
    "/skills/flagship",
    summary="Get Global Flagship Project Skills Overview",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_GLOBAL_PER_MIN, category="skills_flagship"))]
)
async def get_flagship_skills_overview(
    db: Session = Depends(get_db)
):
    """Returns flagship project ID and summary for the public / global /skills route."""
    first_project = db.query(Project).order_by(Project.id.asc()).first()
    if not first_project:
        return {"flagship_project_id": 1, "title": "InnoSphere Flagship Innovation"}
    return {
        "flagship_project_id": first_project.id,
        "title": first_project.title,
        "domain": first_project.domain
    }
