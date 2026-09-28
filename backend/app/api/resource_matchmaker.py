from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.resource_matchmaker import (
    ResourceMatchProfile,
    StudentOwnedHardware,
    StudentSkillItem,
    ProjectResourceRequirement,
    ResourceMatchRecord,
    ResourceAlternativeRecord,
    ResourceBundleRecord,
    ProjectResourcePlanItem,
)
from app.schemas.resource_matchmaker import (
    ResourceMatchProfileRead,
    ResourceMatchProfileUpdate,
    StudentOwnedHardwareCreate,
    StudentOwnedHardwareRead,
    StudentSkillItemCreate,
    StudentSkillItemRead,
    ProjectResourceRequirementCreate,
    ProjectResourceRequirementUpdate,
    ProjectResourceRequirementRead,
    ResourceMatchRecordRead,
    ResourceAlternativeRead,
    ResourceBundleRead,
    ProjectResourcePlanItemCreate,
    ProjectResourcePlanItemUpdate,
    ProjectResourcePlanItemRead,
    ResourceMatchmakerAnalysisResponse,
    BudgetSummaryRead,
    ResourceWhatIfRequest,
    ResourceWhatIfResponse,
    ResourceAssistantQuery,
    ResourceAssistantResponse,
    ResourceMatchReportResponse,
    ResourceMatchmakerHealthResponse,
)
from app.services.resource_matchmaker_service import ResourceMatchmakerService
from app.services.resource_requirement_service import ResourceRequirementService
from app.services.resource_cost_service import ResourceCostService
from app.utils.security import get_current_user

router = APIRouter(tags=["AI Resource Matchmaker & Intelligent Allocation Engine"])


def _authorize_project_access(project_id: int, current_user: User, db: Session) -> Project:
    """Enforces IDOR protection: only project owner, faculty/mentor, or admin can access resource data."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID #{project_id} not found."
        )
    if project.user_id != current_user.id and current_user.role not in ["mentor", "faculty", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access resource allocation data for this project."
        )
    return project


# ==============================================================================
# 1. Global Endpoints (Must precede parameterized routes)
# ==============================================================================

@router.get(
    "/resource-matchmaker/health",
    response_model=ResourceMatchmakerHealthResponse,
    summary="Get Resource Matchmaker Health & Diagnostics"
)
async def get_resource_matchmaker_health():
    """Returns operational health diagnostics for Resource Matchmaker subsystems."""
    return ResourceMatchmakerHealthResponse(**ResourceMatchmakerService.get_health_status())


@router.get(
    "/resource-matchmaker/flagship",
    response_model=ResourceMatchmakerAnalysisResponse,
    summary="Get Flagship Resource Matchmaker Demonstration Workspace"
)
async def get_flagship_resource_workspace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the flagship project resource allocation workspace for interactive demonstration."""
    project = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
        .first()
    )
    if not project:
        project = db.query(Project).order_by(Project.id.asc()).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No projects available.")

    workspace = ResourceMatchmakerService.get_or_create_workspace(db, project.id)
    return ResourceMatchmakerAnalysisResponse(**workspace)


# ==============================================================================
# 2. Project Workspace Master Endpoint
# ==============================================================================

@router.get(
    "/projects/{project_id}/resource-matchmaker",
    response_model=ResourceMatchmakerAnalysisResponse,
    summary="Get Project Resource Matchmaker Workspace"
)
async def get_project_resource_workspace(
    project_id: int,
    force_refresh: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full project-aware, budget-aware, skill-aware, hardware-aware resource allocation workspace.
    """
    project = _authorize_project_access(project_id, current_user, db)
    workspace = ResourceMatchmakerService.get_or_create_workspace(db, project.id, force_refresh=force_refresh)
    return ResourceMatchmakerAnalysisResponse(**workspace)


@router.post(
    "/projects/{project_id}/resource-matchmaker/analyze",
    response_model=ResourceMatchmakerAnalysisResponse,
    summary="Trigger Fresh Requirements Extraction & Matching"
)
async def trigger_resource_analysis(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Re-analyzes project idea and triggers fresh matching."""
    project = _authorize_project_access(project_id, current_user, db)
    workspace = ResourceMatchmakerService.get_or_create_workspace(db, project.id, force_refresh=True)
    return ResourceMatchmakerAnalysisResponse(**workspace)


# ==============================================================================
# 3. Profile Endpoints (Budget, Hardware, Skills, Location)
# ==============================================================================

@router.get(
    "/projects/{project_id}/resource-matchmaker/profile",
    response_model=ResourceMatchProfileRead,
    summary="Get Project Resource Profile"
)
async def get_resource_profile(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns student resource constraint profile (budget, owned hardware, skills, location)."""
    project = _authorize_project_access(project_id, current_user, db)
    profile = ResourceRequirementService.get_or_create_profile(db, project.id)
    return ResourceMatchProfileRead.model_validate(profile)


@router.put(
    "/projects/{project_id}/resource-matchmaker/profile",
    response_model=ResourceMatchProfileRead,
    summary="Update Project Resource Profile"
)
async def update_resource_profile(
    project_id: int,
    req: ResourceMatchProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates budget, hardware, skills, stage, and location constraints."""
    project = _authorize_project_access(project_id, current_user, db)
    profile = ResourceRequirementService.get_or_create_profile(db, project.id)

    if req.total_budget is not None:
        profile.total_budget = req.total_budget
    if req.currency is not None:
        profile.currency = req.currency
    if req.hardware_budget is not None:
        profile.hardware_budget = req.hardware_budget
    if req.software_budget is not None:
        profile.software_budget = req.software_budget
    if req.cloud_budget is not None:
        profile.cloud_budget = req.cloud_budget
    if req.dataset_budget is not None:
        profile.dataset_budget = req.dataset_budget
    if req.monthly_recurring_budget is not None:
        profile.monthly_recurring_budget = req.monthly_recurring_budget
    if req.project_stage is not None:
        profile.project_stage = req.project_stage
    if req.location_country is not None:
        profile.location_country = req.location_country
    if req.location_region is not None:
        profile.location_region = req.location_region
    if req.location_city is not None:
        profile.location_city = req.location_city
    if req.institution_name is not None:
        profile.institution_name = req.institution_name
    if req.open_source_preference is not None:
        profile.open_source_preference = req.open_source_preference
    if req.offline_preference is not None:
        profile.offline_preference = req.offline_preference
    if req.learning_willingness is not None:
        profile.learning_willingness = req.learning_willingness
    if req.compute_preferences_json is not None:
        profile.compute_preferences_json = req.compute_preferences_json

    if req.owned_hardware is not None:
        db.query(StudentOwnedHardware).filter(StudentOwnedHardware.profile_id == profile.id).delete()
        for hw in req.owned_hardware:
            db.add(StudentOwnedHardware(profile_id=profile.id, **hw.model_dump()))

    if req.skills is not None:
        db.query(StudentSkillItem).filter(StudentSkillItem.profile_id == profile.id).delete()
        for sk in req.skills:
            db.add(StudentSkillItem(profile_id=profile.id, **sk.model_dump()))

    db.commit()
    db.refresh(profile)
    return ResourceMatchProfileRead.model_validate(profile)


# ==============================================================================
# 4. Requirement Endpoints
# ==============================================================================

@router.get(
    "/projects/{project_id}/resource-matchmaker/requirements",
    response_model=List[ProjectResourceRequirementRead],
    summary="List Project Requirements"
)
async def list_project_requirements(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists structured project requirements."""
    project = _authorize_project_access(project_id, current_user, db)
    reqs = ResourceRequirementService.extract_and_sync_requirements(db, project)
    return [ProjectResourceRequirementRead.model_validate(r) for r in reqs]


@router.post(
    "/projects/{project_id}/resource-matchmaker/requirements",
    response_model=ProjectResourceRequirementRead,
    summary="Add New Project Requirement"
)
async def create_project_requirement(
    project_id: int,
    req_in: ProjectResourceRequirementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds a custom requirement."""
    project = _authorize_project_access(project_id, current_user, db)
    item = ProjectResourceRequirement(
        project_id=project.id,
        name=req_in.name,
        category=req_in.category,
        description=req_in.description,
        priority=req_in.priority,
        is_hard_constraint=req_in.is_hard_constraint,
        status="USER_CONFIRMED",
        specs_json=req_in.specs_json,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ProjectResourceRequirementRead.model_validate(item)


@router.put(
    "/projects/{project_id}/resource-matchmaker/requirements/{req_id}",
    response_model=ProjectResourceRequirementRead,
    summary="Update or Confirm Project Requirement"
)
async def update_project_requirement(
    project_id: int,
    req_id: int,
    req_in: ProjectResourceRequirementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates requirement status (e.g. USER_CONFIRMED, REJECTED) or parameters."""
    project = _authorize_project_access(project_id, current_user, db)
    item = (
        db.query(ProjectResourceRequirement)
        .filter(ProjectResourceRequirement.id == req_id, ProjectResourceRequirement.project_id == project.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found.")

    if req_in.name is not None:
        item.name = req_in.name
    if req_in.category is not None:
        item.category = req_in.category
    if req_in.description is not None:
        item.description = req_in.description
    if req_in.priority is not None:
        item.priority = req_in.priority
    if req_in.is_hard_constraint is not None:
        item.is_hard_constraint = req_in.is_hard_constraint
    if req_in.status is not None:
        item.status = req_in.status
    if req_in.specs_json is not None:
        item.specs_json = req_in.specs_json

    db.commit()
    db.refresh(item)
    return ProjectResourceRequirementRead.model_validate(item)


@router.delete(
    "/projects/{project_id}/resource-matchmaker/requirements/{req_id}",
    summary="Delete Project Requirement"
)
async def delete_project_requirement(
    project_id: int,
    req_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a requirement."""
    project = _authorize_project_access(project_id, current_user, db)
    deleted = (
        db.query(ProjectResourceRequirement)
        .filter(ProjectResourceRequirement.id == req_id, ProjectResourceRequirement.project_id == project.id)
        .delete()
    )
    db.commit()
    return {"success": True, "deleted_count": deleted}


# ==============================================================================
# 5. Matching, Alternatives & Bundles Endpoints
# ==============================================================================

@router.post(
    "/projects/{project_id}/resource-matchmaker/match",
    response_model=List[ResourceMatchRecordRead],
    summary="Execute Resource Matching Engine"
)
async def execute_resource_match(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Runs multi-dimensional matching against candidate catalog."""
    project = _authorize_project_access(project_id, current_user, db)
    profile = ResourceRequirementService.get_or_create_profile(db, project.id)
    reqs = ResourceRequirementService.extract_and_sync_requirements(db, project)
    matches = ResourceMatchmakerService.run_matching_engine(db, project, profile, reqs)
    return [ResourceMatchRecordRead.model_validate(m) for m in matches]


@router.get(
    "/projects/{project_id}/resource-matchmaker/matches",
    response_model=List[ResourceMatchRecordRead],
    summary="Get Ranked Resource Matches"
)
async def get_resource_matches(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists evaluated resource match records."""
    project = _authorize_project_access(project_id, current_user, db)
    matches = db.query(ResourceMatchRecord).filter(ResourceMatchRecord.project_id == project.id).all()
    return [ResourceMatchRecordRead.model_validate(m) for m in matches]


@router.get(
    "/projects/{project_id}/resource-matchmaker/alternatives",
    response_model=List[ResourceAlternativeRead],
    summary="List Open-Source & Low-Cost Alternatives"
)
async def get_resource_alternatives(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists alternatives for expensive or complex items."""
    project = _authorize_project_access(project_id, current_user, db)
    matches = db.query(ResourceMatchRecord).filter(ResourceMatchRecord.project_id == project.id).all()
    alts = []
    for m in matches:
        if m.alternatives:
            alts.extend(m.alternatives)
    return [ResourceAlternativeRead.model_validate(a) for a in alts]


@router.get(
    "/projects/{project_id}/resource-matchmaker/bundles",
    response_model=List[ResourceBundleRead],
    summary="Get Curated Resource Bundles"
)
async def get_resource_bundles(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns Low-Cost, Balanced, and High-Performance bundles."""
    project = _authorize_project_access(project_id, current_user, db)
    profile = ResourceRequirementService.get_or_create_profile(db, project.id)
    matches = db.query(ResourceMatchRecord).filter(ResourceMatchRecord.project_id == project.id).all()
    bundles = ResourceMatchmakerService.get_or_generate_bundles(db, project.id, profile, matches)
    return [ResourceBundleRead.model_validate(b) for b in bundles]


@router.get(
    "/projects/{project_id}/resource-matchmaker/budget",
    response_model=BudgetSummaryRead,
    summary="Get Resource Budget Planner Breakdown"
)
async def get_resource_budget_summary(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns budget utilization, category breakdowns, and potential savings."""
    project = _authorize_project_access(project_id, current_user, db)
    profile = ResourceRequirementService.get_or_create_profile(db, project.id)
    plan_items = db.query(ProjectResourcePlanItem).filter(ProjectResourcePlanItem.project_id == project.id).all()
    matches = db.query(ResourceMatchRecord).filter(ResourceMatchRecord.project_id == project.id).all()
    summary = ResourceCostService.calculate_budget_summary(profile, plan_items, matches)
    return BudgetSummaryRead(**summary)


# ==============================================================================
# 6. Resource Plan Endpoints (Roadmap / Exp / Hardware / Validation linkages)
# ==============================================================================

@router.get(
    "/projects/{project_id}/resource-matchmaker/plan",
    response_model=List[ProjectResourcePlanItemRead],
    summary="Get Project Resource Plan Items"
)
async def get_project_resource_plan(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists items currently in the student's project resource plan."""
    project = _authorize_project_access(project_id, current_user, db)
    items = db.query(ProjectResourcePlanItem).filter(ProjectResourcePlanItem.project_id == project.id).all()
    return [ProjectResourcePlanItemRead.model_validate(i) for i in items]


@router.post(
    "/projects/{project_id}/resource-matchmaker/plan",
    response_model=ProjectResourcePlanItemRead,
    summary="Add Resource to Project Plan"
)
async def add_resource_to_plan(
    project_id: int,
    item_in: ProjectResourcePlanItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds a resource item to project plan with traceable linkages."""
    project = _authorize_project_access(project_id, current_user, db)
    item = ProjectResourcePlanItem(
        project_id=project.id,
        resource_name=item_in.resource_name,
        resource_category=item_in.resource_category,
        purpose=item_in.purpose,
        quantity=item_in.quantity,
        estimated_cost=item_in.estimated_cost,
        actual_cost=item_in.actual_cost,
        currency=item_in.currency,
        source_name=item_in.source_name,
        source_url=item_in.source_url,
        availability_status=item_in.availability_status,
        plan_status=item_in.plan_status,
        linked_roadmap_phase_id=item_in.linked_roadmap_phase_id,
        linked_experiment_id=item_in.linked_experiment_id,
        linked_hardware_device_id=item_in.linked_hardware_device_id,
        linked_validation_claim_id=item_in.linked_validation_claim_id,
        notes=item_in.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ProjectResourcePlanItemRead.model_validate(item)


@router.put(
    "/projects/{project_id}/resource-matchmaker/plan/{item_id}",
    response_model=ProjectResourcePlanItemRead,
    summary="Update Project Resource Plan Item"
)
async def update_resource_plan_item(
    project_id: int,
    item_id: int,
    item_in: ProjectResourcePlanItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates status, costs, or cross-system linkages of a plan item."""
    project = _authorize_project_access(project_id, current_user, db)
    item = (
        db.query(ProjectResourcePlanItem)
        .filter(ProjectResourcePlanItem.id == item_id, ProjectResourcePlanItem.project_id == project.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan item not found.")

    if item_in.resource_name is not None:
        item.resource_name = item_in.resource_name
    if item_in.resource_category is not None:
        item.resource_category = item_in.resource_category
    if item_in.purpose is not None:
        item.purpose = item_in.purpose
    if item_in.quantity is not None:
        item.quantity = item_in.quantity
    if item_in.estimated_cost is not None:
        item.estimated_cost = item_in.estimated_cost
    if item_in.actual_cost is not None:
        item.actual_cost = item_in.actual_cost
    if item_in.currency is not None:
        item.currency = item_in.currency
    if item_in.source_name is not None:
        item.source_name = item_in.source_name
    if item_in.source_url is not None:
        item.source_url = item_in.source_url
    if item_in.availability_status is not None:
        item.availability_status = item_in.availability_status
    if item_in.plan_status is not None:
        item.plan_status = item_in.plan_status
    if item_in.linked_roadmap_phase_id is not None:
        item.linked_roadmap_phase_id = item_in.linked_roadmap_phase_id
    if item_in.linked_experiment_id is not None:
        item.linked_experiment_id = item_in.linked_experiment_id
    if item_in.linked_hardware_device_id is not None:
        item.linked_hardware_device_id = item_in.linked_hardware_device_id
    if item_in.linked_validation_claim_id is not None:
        item.linked_validation_claim_id = item_in.linked_validation_claim_id
    if item_in.notes is not None:
        item.notes = item_in.notes

    db.commit()
    db.refresh(item)
    return ProjectResourcePlanItemRead.model_validate(item)


@router.delete(
    "/projects/{project_id}/resource-matchmaker/plan/{item_id}",
    summary="Remove Resource from Plan"
)
async def delete_resource_plan_item(
    project_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes an item from the project plan."""
    project = _authorize_project_access(project_id, current_user, db)
    deleted = (
        db.query(ProjectResourcePlanItem)
        .filter(ProjectResourcePlanItem.id == item_id, ProjectResourcePlanItem.project_id == project.id)
        .delete()
    )
    db.commit()
    return {"success": True, "deleted_count": deleted}


# ==============================================================================
# 7. What-If Scenario, AI Assistant & Report Exports
# ==============================================================================

@router.post(
    "/projects/{project_id}/resource-matchmaker/what-if",
    response_model=ResourceWhatIfResponse,
    summary="Simulate What-If Resource Scenario"
)
async def simulate_what_if_scenario(
    project_id: int,
    req: ResourceWhatIfRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simulates resource matches and cost impact under adjusted budget, hardware, or compute constraints."""
    project = _authorize_project_access(project_id, current_user, db)
    result = ResourceMatchmakerService.simulate_what_if_scenario(db, project.id, req)
    return ResourceWhatIfResponse(**result)


@router.post(
    "/projects/{project_id}/resource-matchmaker/assistant",
    response_model=ResourceAssistantResponse,
    summary="AI Resource Matchmaker Assistant Query"
)
async def ask_resource_assistant(
    project_id: int,
    query: ResourceAssistantQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Natural-language resource assistant grounded in project budget, hardware, and matched candidates."""
    project = _authorize_project_access(project_id, current_user, db)
    result = ResourceMatchmakerService.answer_assistant_query(db, project.id, query.prompt)
    return ResourceAssistantResponse(**result)


@router.get(
    "/projects/{project_id}/resource-matchmaker/export/{format_type}",
    response_model=ResourceMatchReportResponse,
    summary="Export Resource Strategy Report (Markdown, JSON, CSV, SVG)"
)
async def export_resource_report(
    project_id: int,
    format_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports structured resource strategy and allocation report."""
    project = _authorize_project_access(project_id, current_user, db)
    try:
        report = ResourceMatchmakerService.export_report(db, project.id, format_type)
        return ResourceMatchReportResponse(**report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
