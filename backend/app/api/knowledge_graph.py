from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.knowledge_graph import (
    KnowledgeGraph,
    KnowledgeGraphNode,
    KnowledgeGraphEdge,
    KnowledgeGraphSnapshot,
)
from app.schemas.knowledge_graph import (
    KnowledgeGraphPayload,
    KnowledgeGraphNodeRead,
    KnowledgeGraphEdgeRead,
    KnowledgeGraphStatistics,
    KnowledgeGraphDiagnostics,
    KnowledgeGraphInsights,
    KnowledgeGraphSnapshotRead,
    KnowledgeGraphExportPayload,
    KnowledgeGraphGenerateRequest,
)
from app.services.knowledge_graph_service import KnowledgeGraphService
from app.utils.security import get_current_user

router = APIRouter(tags=["Interactive Knowledge Graph"])


def _authorize_project_access(project_id: int, current_user: User, db: Session) -> Project:
    """Enforce IDOR protection: only project owner, faculty/mentor, or admin can access knowledge graph."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )
    if project.user_id != current_user.id and current_user.role not in ["mentor", "faculty", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access knowledge graph for this project."
        )
    return project


@router.get(
    "/projects/{project_id}/knowledge-graph",
    response_model=KnowledgeGraphPayload,
    summary="Get Project Knowledge Graph"
)
async def get_project_knowledge_graph(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the comprehensive Knowledge Graph for a project.
    Generates it dynamically if it does not yet exist.
    """
    project = _authorize_project_access(project_id, current_user, db)
    graph = KnowledgeGraphService.get_or_create_knowledge_graph(
        db=db, project_id=project.id, force_refresh=False
    )
    
    # Structure payload
    g_json = graph.graph_json or {}
    nodes_data = g_json.get("nodes", [])
    edges_data = g_json.get("edges", [])
    stats_data = g_json.get("stats", {})
    diag_data = graph.diagnostics or g_json.get("diagnostics", {})
    ins_data = graph.insights or g_json.get("insights", {})

    return KnowledgeGraphPayload(
        id=graph.id,
        project_id=graph.project_id,
        name=graph.name,
        version=graph.version,
        nodes=[KnowledgeGraphNodeRead(**n) for n in nodes_data],
        edges=[KnowledgeGraphEdgeRead(**e) for e in edges_data],
        stats=KnowledgeGraphStatistics(**stats_data),
        diagnostics=KnowledgeGraphDiagnostics(**diag_data),
        insights=KnowledgeGraphInsights(**ins_data),
        mermaid_source=graph.mermaid_source,
        created_at=graph.created_at,
        updated_at=graph.updated_at,
    )


@router.post(
    "/projects/{project_id}/knowledge-graph/generate",
    response_model=KnowledgeGraphPayload,
    summary="Generate or Force-Refresh Knowledge Graph"
)
async def generate_project_knowledge_graph(
    project_id: int,
    req: Optional[KnowledgeGraphGenerateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regenerates the Knowledge Graph from latest project state, recomputing all entity relationships.
    """
    project = _authorize_project_access(project_id, current_user, db)
    force = req.force_refresh if req else True
    include_ai = req.include_ai_suggestions if req else True

    graph = KnowledgeGraphService.get_or_create_knowledge_graph(
        db=db, project_id=project.id, force_refresh=force, include_ai_suggestions=include_ai
    )

    g_json = graph.graph_json or {}
    nodes_data = g_json.get("nodes", [])
    edges_data = g_json.get("edges", [])
    stats_data = g_json.get("stats", {})
    diag_data = graph.diagnostics or g_json.get("diagnostics", {})
    ins_data = graph.insights or g_json.get("insights", {})

    return KnowledgeGraphPayload(
        id=graph.id,
        project_id=graph.project_id,
        name=graph.name,
        version=graph.version,
        nodes=[KnowledgeGraphNodeRead(**n) for n in nodes_data],
        edges=[KnowledgeGraphEdgeRead(**e) for e in edges_data],
        stats=KnowledgeGraphStatistics(**stats_data),
        diagnostics=KnowledgeGraphDiagnostics(**diag_data),
        insights=KnowledgeGraphInsights(**ins_data),
        mermaid_source=graph.mermaid_source,
        created_at=graph.created_at,
        updated_at=graph.updated_at,
    )


@router.get(
    "/projects/{project_id}/knowledge-graph/nodes",
    response_model=List[KnowledgeGraphNodeRead],
    summary="List Knowledge Graph Nodes"
)
async def get_knowledge_graph_nodes(
    project_id: int,
    category: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns filtered nodes of the project's knowledge graph.
    """
    project = _authorize_project_access(project_id, current_user, db)
    graph = KnowledgeGraphService.get_or_create_knowledge_graph(db=db, project_id=project.id)
    nodes = graph.graph_json.get("nodes", [])

    filtered = []
    for n in nodes:
        if category and n.get("category", "").upper() != category.upper():
            continue
        if status_filter and n.get("status", "").upper() != status_filter.upper():
            continue
        if search:
            query = search.lower()
            label = n.get("label", "").lower()
            desc = n.get("description", "").lower() if n.get("description") else ""
            if query not in label and query not in desc:
                continue
        filtered.append(KnowledgeGraphNodeRead(**n))

    return filtered


@router.get(
    "/projects/{project_id}/knowledge-graph/edges",
    response_model=List[KnowledgeGraphEdgeRead],
    summary="List Knowledge Graph Edges"
)
async def get_knowledge_graph_edges(
    project_id: int,
    relationship_type: Optional[str] = None,
    source_key: Optional[str] = None,
    target_key: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns filtered edges of the project's knowledge graph.
    """
    project = _authorize_project_access(project_id, current_user, db)
    graph = KnowledgeGraphService.get_or_create_knowledge_graph(db=db, project_id=project.id)
    edges = graph.graph_json.get("edges", [])

    filtered = []
    for e in edges:
        if relationship_type and e.get("relationship_type", "").upper() != relationship_type.upper():
            continue
        if source_key and e.get("source_node_key") != source_key:
            continue
        if target_key and e.get("target_node_key") != target_key:
            continue
        filtered.append(KnowledgeGraphEdgeRead(**e))

    return filtered


@router.get(
    "/projects/{project_id}/knowledge-graph/insights",
    response_model=KnowledgeGraphInsights,
    summary="Get AI Graph Insights"
)
async def get_knowledge_graph_insights(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns AI-generated insights, critical innovation pathways, and central hub metrics.
    """
    project = _authorize_project_access(project_id, current_user, db)
    graph = KnowledgeGraphService.get_or_create_knowledge_graph(db=db, project_id=project.id)
    ins_data = graph.insights or graph.graph_json.get("insights", {})
    return KnowledgeGraphInsights(**ins_data)


@router.get(
    "/projects/{project_id}/knowledge-graph/diagnostics",
    response_model=KnowledgeGraphDiagnostics,
    summary="Get Graph Diagnostics"
)
async def get_knowledge_graph_diagnostics(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns completeness diagnostics, missing evidence links, and actionable graph recommendations.
    """
    project = _authorize_project_access(project_id, current_user, db)
    graph = KnowledgeGraphService.get_or_create_knowledge_graph(db=db, project_id=project.id)
    diag_data = graph.diagnostics or graph.graph_json.get("diagnostics", {})
    return KnowledgeGraphDiagnostics(**diag_data)


@router.get(
    "/projects/{project_id}/knowledge-graph/versions",
    response_model=List[KnowledgeGraphSnapshotRead],
    summary="List Knowledge Graph Version History"
)
async def get_knowledge_graph_versions(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the list of historical snapshots and versions saved for this graph.
    """
    project = _authorize_project_access(project_id, current_user, db)
    snapshots = (
        db.query(KnowledgeGraphSnapshot)
        .filter(KnowledgeGraphSnapshot.project_id == project.id)
        .order_by(KnowledgeGraphSnapshot.version_number.desc())
        .all()
    )
    return [
        KnowledgeGraphSnapshotRead(
            id=s.id,
            project_id=s.project_id,
            version_number=s.version_number,
            change_summary=s.change_summary,
            content_hash=s.content_hash,
            created_by=s.created_by,
            created_at=s.created_at,
        )
        for s in snapshots
    ]


@router.get(
    "/projects/{project_id}/knowledge-graph/export/{format_type}",
    response_model=KnowledgeGraphExportPayload,
    summary="Export Knowledge Graph (JSON, Mermaid, CSV, SVG, PNG)"
)
async def export_project_knowledge_graph(
    project_id: int,
    format_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exports the Knowledge Graph into the specified format (json, mermaid, csv, svg, png).
    """
    project = _authorize_project_access(project_id, current_user, db)
    try:
        export_res = KnowledgeGraphService.export_graph(
            db=db, project_id=project.id, format_type=format_type
        )
        return KnowledgeGraphExportPayload(**export_res)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/knowledge-graph/categories",
    summary="Get Supported Graph Entity Categories & Styles"
)
async def get_knowledge_graph_categories():
    """
    Returns metadata on all 17 canonical entity categories, colors, icons, and shapes.
    """
    categories_meta = []
    for cat in KnowledgeGraphService.CATEGORIES:
        style = KnowledgeGraphService.CATEGORY_STYLES.get(cat, {})
        categories_meta.append({
            "category": cat,
            "label": cat.replace("_", " ").title(),
            "color": style.get("color", "#64748B"),
            "bg": style.get("bg", "#F8FAFC"),
            "border": style.get("border", "#94A3B8"),
            "shape": style.get("shape", "rect"),
        })
    return {
        "categories": categories_meta,
        "relationships": KnowledgeGraphService.RELATIONSHIPS,
    }


@router.get(
    "/knowledge-graph/flagship",
    summary="Get Flagship Innovation Knowledge Graph"
)
async def get_flagship_knowledge_graph(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the flagship knowledge graph for discovery and exploration.
    """
    # Pick user's latest project or any accessible project
    project = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
        .first()
    )
    if not project:
        project = db.query(Project).order_by(Project.id.asc()).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No projects available for flagship knowledge graph view."
        )

    graph = KnowledgeGraphService.get_or_create_knowledge_graph(db=db, project_id=project.id)
    g_json = graph.graph_json or {}
    nodes_data = g_json.get("nodes", [])
    edges_data = g_json.get("edges", [])
    stats_data = g_json.get("stats", {})
    diag_data = graph.diagnostics or g_json.get("diagnostics", {})
    ins_data = graph.insights or g_json.get("insights", {})

    return KnowledgeGraphPayload(
        id=graph.id,
        project_id=graph.project_id,
        name=graph.name,
        version=graph.version,
        nodes=[KnowledgeGraphNodeRead(**n) for n in nodes_data],
        edges=[KnowledgeGraphEdgeRead(**e) for e in edges_data],
        stats=KnowledgeGraphStatistics(**stats_data),
        diagnostics=KnowledgeGraphDiagnostics(**diag_data),
        insights=KnowledgeGraphInsights(**ins_data),
        mermaid_source=graph.mermaid_source,
        created_at=graph.created_at,
        updated_at=graph.updated_at,
    )
