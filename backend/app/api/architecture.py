from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.architecture import Architecture, ArchitectureNode, ArchitectureEdge, ArchitectureVersion
from app.schemas.architecture import (
    ArchitectureRead, ArchitectureVersionRead, MermaidUpdatePayload,
    ArchitectureExportPayload, ArchitectureDiagnosticsResponse,
    ArchitectureAssistantQuery, ArchitectureAssistantResponse,
    ArchitectureSimplificationResponse, ArchitectureChangeDetectionResponse
)
from app.services.architecture_generator_service import ArchitectureGeneratorService
from app.utils.security import get_current_user
from app.utils.rate_limiter import rate_limit
from app.config import settings

router = APIRouter(tags=["AI Architecture & Flowchart Generator"])


def _authorize_project_access(project_id: int, current_user: User, db: Session) -> Project:
    """Enforce IDOR protection: only project owner, faculty/mentor, or admin can access/modify architecture."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )
    if project.user_id != current_user.id and current_user.role not in ["mentor", "faculty", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access architecture for this project."
        )
    return project


# -----------------------------------------------------------------------------
# 1. Multi-View Architecture List & Generator
# -----------------------------------------------------------------------------
@router.get(
    "/projects/{project_id}/architecture",
    response_model=List[ArchitectureRead],
    summary="Get All Project Architecture Views"
)
async def get_project_architectures(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all generated architecture views (System, Data Flow, AI Pipeline, Hardware, API, Deployment, etc.).
    """
    project = _authorize_project_access(project_id, current_user, db)
    archs = ArchitectureGeneratorService.get_or_generate_architectures(db, project.id, current_user.id)
    return archs


@router.post(
    "/projects/{project_id}/architecture/generate",
    response_model=List[ArchitectureRead],
    summary="Generate All Architecture Views from Project Context",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="arch_gen"))]
)
async def generate_project_architectures(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers automated multi-view architecture generation from current project context.
    """
    project = _authorize_project_access(project_id, current_user, db)
    archs = ArchitectureGeneratorService.generate_all_architectures(db, project, current_user.id)
    return archs


# -----------------------------------------------------------------------------
# 2. View-Specific Getters
# -----------------------------------------------------------------------------
@router.get("/projects/{project_id}/architecture/system", response_model=ArchitectureRead)
async def get_system_architecture(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, "SYSTEM", current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail="System architecture not found.")
    return arch


@router.get("/projects/{project_id}/architecture/data-flow", response_model=ArchitectureRead)
async def get_data_flow_architecture(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, "DATA_FLOW", current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail="Data flow architecture not found.")
    return arch


@router.get("/projects/{project_id}/architecture/ai-pipeline", response_model=ArchitectureRead)
async def get_ai_pipeline_architecture(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, "AI_PIPELINE", current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail="AI pipeline architecture not found.")
    return arch


@router.get("/projects/{project_id}/architecture/hardware", response_model=ArchitectureRead)
async def get_hardware_architecture(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, "HARDWARE", current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail="Hardware architecture not found.")
    return arch


@router.get("/projects/{project_id}/architecture/api-flow", response_model=ArchitectureRead)
async def get_api_flow_architecture(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, "API_FLOW", current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail="API flow architecture not found.")
    return arch


@router.get("/projects/{project_id}/architecture/deployment", response_model=ArchitectureRead)
async def get_deployment_architecture(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, "DEPLOYMENT", current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail="Deployment architecture not found.")
    return arch


@router.get("/projects/{project_id}/architecture/application-flow", response_model=ArchitectureRead)
async def get_application_flow_architecture(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, "APPLICATION_FLOW", current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail="Application flow architecture not found.")
    return arch


@router.get("/projects/{project_id}/architecture/security", response_model=ArchitectureRead)
async def get_security_architecture(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, "SECURITY", current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail="Security architecture not found.")
    return arch


# -----------------------------------------------------------------------------
# 3. Mermaid Source Management & Custom Edits
# -----------------------------------------------------------------------------
@router.get("/projects/{project_id}/architecture/mermaid")
async def get_mermaid_source(
    project_id: int,
    view_type: str = Query("SYSTEM", description="Architecture view type"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, view_type, current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail=f"Architecture for view {view_type} not found.")
    return {
        "view_type": arch.architecture_type,
        "is_customized": arch.is_customized,
        "mermaid_source": arch.custom_mermaid_source or arch.mermaid_source,
        "generated_mermaid_source": arch.mermaid_source
    }


@router.put("/projects/{project_id}/architecture/mermaid")
async def update_mermaid_source(
    project_id: int,
    payload: MermaidUpdatePayload,
    view_type: str = Query("SYSTEM", description="Architecture view type"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    success, msg, arch = ArchitectureGeneratorService.update_mermaid_source(
        db, project.id, view_type, payload.mermaid_source, current_user.id
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg, "architecture": ArchitectureRead.model_validate(arch)}


@router.post("/projects/{project_id}/architecture/reset-mermaid")
async def reset_mermaid_source(
    project_id: int,
    view_type: str = Query("SYSTEM", description="Architecture view type"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    success, msg, arch = ArchitectureGeneratorService.reset_to_generated(
        db, project.id, view_type, current_user.id
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg, "architecture": ArchitectureRead.model_validate(arch)}


@router.post("/projects/{project_id}/architecture/refresh")
async def refresh_project_architectures(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    archs = ArchitectureGeneratorService.generate_all_architectures(db, project, current_user.id)
    return {"success": True, "refreshed_views_count": len(archs), "architectures": archs}


# -----------------------------------------------------------------------------
# 4. Versioning & Snapshots
# -----------------------------------------------------------------------------
@router.get("/projects/{project_id}/architecture/versions", response_model=List[ArchitectureVersionRead])
async def get_architecture_versions(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    versions = db.query(ArchitectureVersion).filter(
        ArchitectureVersion.project_id == project.id
    ).order_by(ArchitectureVersion.version_number.desc()).all()
    return versions


@router.post("/projects/{project_id}/architecture/versions")
async def create_architecture_version(
    project_id: int,
    view_type: str = Body(default="SYSTEM"),
    change_summary: str = Body(default="Manual snapshot"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, view_type, current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture view not found.")
    ArchitectureGeneratorService._create_version_snapshot(db, project.id, view_type, arch, change_summary)
    return {"success": True, "message": "Snapshot created successfully."}


# -----------------------------------------------------------------------------
# 5. Export Endpoints (SVG, PNG, Package)
# -----------------------------------------------------------------------------
@router.post("/projects/{project_id}/architecture/export/svg")
async def export_architecture_svg(
    project_id: int,
    payload: ArchitectureExportPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    view_type = payload.view_type or "SYSTEM"
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, view_type, current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail=f"Architecture for view {view_type} not found.")

    svg_content = ArchitectureGeneratorService.export_diagram_svg(
        arch, theme=payload.theme or "light", resolution=payload.resolution or "presentation"
    )
    return Response(
        content=svg_content,
        media_type="image/svg+xml",
        headers={"Content-Disposition": f'attachment; filename="{view_type.lower()}-architecture.svg"'}
    )


@router.post("/projects/{project_id}/architecture/export/png")
async def export_architecture_png(
    project_id: int,
    payload: ArchitectureExportPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns high-resolution SVG wrapped with PNG-ready rendering headers.
    """
    project = _authorize_project_access(project_id, current_user, db)
    view_type = payload.view_type or "SYSTEM"
    arch = ArchitectureGeneratorService.get_architecture_by_type(db, project.id, view_type, current_user.id)
    if not arch:
        raise HTTPException(status_code=404, detail=f"Architecture for view {view_type} not found.")

    svg_content = ArchitectureGeneratorService.export_diagram_svg(
        arch, theme=payload.theme or "light", resolution="high_resolution"
    )
    return {
        "filename": f"{view_type.lower()}-architecture.png",
        "format": "png",
        "resolution": payload.resolution or "presentation",
        "svg_source": svg_content,
        "message": "High-resolution vector diagram ready for client-side canvas PNG rendering."
    }


@router.post("/projects/{project_id}/architecture/export/package")
async def export_architecture_package(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    package = ArchitectureGeneratorService.export_complete_package(db, project.id, current_user.id)
    return {
        "project_id": project.id,
        "project_title": project.title,
        "total_files": len(package),
        "files": package
    }


# -----------------------------------------------------------------------------
# 6. AI Assistant & Simplification
# -----------------------------------------------------------------------------
@router.post("/projects/{project_id}/architecture/assistant", response_model=ArchitectureAssistantResponse)
async def ask_architecture_assistant(
    project_id: int,
    query: ArchitectureAssistantQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    res = ArchitectureGeneratorService.answer_assistant_query(
        db, project.id, query.prompt, query.context_view or "SYSTEM", current_user.id
    )
    return res


@router.get("/projects/{project_id}/architecture/simplify", response_model=ArchitectureSimplificationResponse)
async def get_simplified_architecture(
    project_id: int,
    view_type: str = Query("SYSTEM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    res = ArchitectureGeneratorService.get_simplification_proposal(db, project.id, view_type, current_user.id)
    return res


# -----------------------------------------------------------------------------
# 7. Cross-Engine Synchronizations (Roadmap, Research Workspace)
# -----------------------------------------------------------------------------
@router.post("/projects/{project_id}/architecture/sync-roadmap")
async def sync_architecture_to_roadmap(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    res = ArchitectureGeneratorService.sync_to_roadmap(db, project.id, current_user.id)
    return res


@router.post("/projects/{project_id}/architecture/sync-research")
async def sync_architecture_to_research(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = _authorize_project_access(project_id, current_user, db)
    res = ArchitectureGeneratorService.sync_to_research(db, project.id, current_user.id)
    return res


# -----------------------------------------------------------------------------
# 8. Showcase / Flagship Endpoint
# -----------------------------------------------------------------------------
@router.get("/architecture/flagship")
async def get_flagship_architecture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the flagship project's system architecture for quick showcases and global views."""
    flagship_project = db.query(Project).order_by(Project.id.asc()).first()
    if not flagship_project:
        raise HTTPException(status_code=404, detail="No projects found.")
    archs = ArchitectureGeneratorService.get_or_generate_architectures(db, flagship_project.id, current_user.id)
    return {
        "project": {
            "id": flagship_project.id,
            "title": flagship_project.title,
            "domain": flagship_project.domain,
            "technologies": flagship_project.technologies
        },
        "architectures": archs
    }
