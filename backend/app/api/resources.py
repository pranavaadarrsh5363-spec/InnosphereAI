from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.models.user import User
from app.models.resource import Resource, SavedResource
from app.models.project import Project
from app.schemas.resource import (
    ResourceResponse, SavedResourceCreate, SavedResourceUpdate,
    SavedResourceResponse, ResourceCompareRequest, SemanticSearchRequest,
    SemanticSearchResponse, VectorDiagnosticsResponse
)
from app.utils.security import get_current_user, get_optional_current_user
from app.utils.rate_limiter import rate_limit
from app.utils.validators import sanitize_text
from app.services.semantic_search_service import semantic_search_service
from app.services.embedding_service import embedding_service
from app.config import settings

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get(
    "/discover",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_SEARCH_PER_MIN, category="resource_search"))]
)
async def discover_resources(
    query: Optional[str] = Query(None, max_length=500, description="Natural language or project search query"),
    search_mode: Optional[str] = Query("hybrid", description="Search strategy: hybrid | semantic | keyword"),
    domain: Optional[str] = Query(None, max_length=100),
    resource_type: Optional[str] = Query(None, max_length=50),
    difficulty: Optional[str] = Query(None, max_length=50),
    is_open_source: Optional[bool] = Query(None),
    is_free: Optional[bool] = Query(None),
    min_relevance: Optional[int] = Query(None, ge=0, le=100),
    project_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Intelligent Semantic & Multi-Source Resource Discovery endpoint.
    Retrieves from arXiv, OpenAlex, GitHub, HuggingFace, Crossref, and Curated Index,
    ranking items via dense vector cosine similarity and explainable hybrid score fusion.
    """
    clean_query = sanitize_text(query, max_length=500) if query else ""
    clean_domain = sanitize_text(domain, max_length=100) if domain else None
    clean_type = sanitize_text(resource_type, max_length=50) if resource_type else None
    clean_diff = sanitize_text(difficulty, max_length=50) if difficulty else None

    search_result = await semantic_search_service.search_and_rank(
        query=clean_query,
        search_mode=search_mode or "hybrid",
        domain=clean_domain,
        resource_type=clean_type,
        difficulty=clean_diff,
        is_open_source=is_open_source,
        is_free=is_free,
        min_relevance=min_relevance,
        project_id=project_id,
        db=db,
        user_id=current_user.id if current_user else None,
        limit=limit,
        offset=offset
    )
    return search_result

@router.post(
    "/semantic-search",
    response_model=SemanticSearchResponse,
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_SEARCH_PER_MIN, category="resource_search"))]
)
async def semantic_search_post(
    body: SemanticSearchRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Dedicated POST semantic vector and hybrid search endpoint supporting rich query payloads.
    """
    clean_query = sanitize_text(body.query, max_length=500)
    clean_domain = sanitize_text(body.domain, max_length=100) if body.domain else None
    clean_type = sanitize_text(body.resource_type, max_length=50) if body.resource_type else None
    clean_diff = sanitize_text(body.difficulty, max_length=50) if body.difficulty else None

    search_result = await semantic_search_service.search_and_rank(
        query=clean_query,
        search_mode=body.search_mode or "hybrid",
        domain=clean_domain,
        resource_type=clean_type,
        difficulty=clean_diff,
        is_open_source=body.is_open_source,
        is_free=body.is_free,
        min_relevance=body.min_relevance,
        project_id=body.project_id,
        db=db,
        user_id=current_user.id if current_user else None,
        limit=body.limit or 50,
        offset=body.offset or 0
    )
    return search_result

@router.get("/diagnostics", response_model=VectorDiagnosticsResponse)
def get_vector_search_diagnostics():
    """
    Returns operational diagnostics for semantic search, vector cache, and embedding models.
    """
    return embedding_service.get_diagnostics()

@router.post("/save")
def save_resource(
    item: SavedResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify resource exists
    res = db.query(Resource).filter(Resource.id == item.resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")

    # If project_id provided, check project ownership
    if item.project_id:
        proj = db.query(Project).filter(Project.id == item.project_id).first()
        if not proj or (proj.user_id != current_user.id and current_user.role not in ["mentor", "admin"]):
            raise HTTPException(status_code=403, detail="Not authorized to bookmark to this project.")

    existing = db.query(SavedResource).filter(
        SavedResource.user_id == current_user.id,
        SavedResource.resource_id == item.resource_id
    ).first()

    clean_category = sanitize_text(item.category or "General", max_length=100)
    clean_tags = [sanitize_text(t, max_length=50) for t in (item.tags or []) if t]
    clean_notes = sanitize_text(item.notes, max_length=5000) if item.notes else None
    clean_explanation = sanitize_text(item.relevance_explanation, max_length=3000) if item.relevance_explanation else None

    if existing:
        existing.project_id = item.project_id or existing.project_id
        existing.category = clean_category
        existing.tags = clean_tags
        existing.notes = clean_notes
        db.commit()
        db.refresh(existing)
        return {"message": "Resource bookmark updated", "id": existing.id}

    saved = SavedResource(
        user_id=current_user.id,
        resource_id=item.resource_id,
        project_id=item.project_id,
        category=clean_category,
        tags=clean_tags,
        notes=clean_notes,
        rating=item.rating or 5,
        relevance_score=item.relevance_score or 90,
        relevance_explanation=clean_explanation
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return {"message": "Resource saved successfully to your library", "id": saved.id}

@router.get("/library")
def get_saved_library(
    project_id: Optional[int] = None,
    category: Optional[str] = None,
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SavedResource).filter(SavedResource.user_id == current_user.id)
    if project_id:
        query = query.filter(SavedResource.project_id == project_id)
    if category and category != "all":
        clean_cat = sanitize_text(category, max_length=100)
        query = query.filter(SavedResource.category == clean_cat)

    offset = (page - 1) * page_size
    saved_items = query.order_by(SavedResource.created_at.desc()).offset(offset).limit(page_size).all()
    results = []
    for s in saved_items:
        res = s.resource
        if not res:
            continue
        if resource_type and resource_type != "all" and res.resource_type != resource_type:
            continue
        if search:
            clean_s = search.lower()
            if clean_s not in res.title.lower() and clean_s not in (s.notes or "").lower():
                continue

        results.append({
            "id": s.id,
            "resource_id": res.id,
            "project_id": s.project_id,
            "category": s.category,
            "tags": s.tags or [],
            "notes": s.notes,
            "rating": s.rating,
            "relevance_score": s.relevance_score,
            "relevance_explanation": s.relevance_explanation,
            "created_at": s.created_at,
            "resource": {
                "id": res.id,
                "title": res.title,
                "description": res.description,
                "resource_type": res.resource_type,
                "source": res.source,
                "url": res.url,
                "authors": res.authors or [],
                "technologies": res.technologies or [],
                "domain": res.domain,
                "difficulty": res.difficulty,
                "is_open_source": res.is_open_source,
                "is_free": res.is_free,
                "published_date": res.published_date,
                "metadata_json": res.metadata_json or {},
                "doi": res.doi,
                "external_id": res.external_id
            }
        })
    return results

@router.put("/saved/{saved_id}")
def update_saved_resource(
    saved_id: int,
    data: SavedResourceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved = db.query(SavedResource).filter(SavedResource.id == saved_id, SavedResource.user_id == current_user.id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved resource not found")

    for k, v in data.dict(exclude_unset=True).items():
        if isinstance(v, str):
            v = sanitize_text(v, max_length=5000)
        elif isinstance(v, list):
            v = [sanitize_text(item, max_length=100) if isinstance(item, str) else item for item in v]
        setattr(saved, k, v)

    db.commit()
    return {"message": "Resource updated successfully"}

@router.delete("/saved/{saved_id}")
def delete_saved_resource(
    saved_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved = db.query(SavedResource).filter(SavedResource.id == saved_id, SavedResource.user_id == current_user.id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved resource not found")

    db.delete(saved)
    db.commit()
    return {"message": "Resource removed from library", "id": saved_id}

@router.post("/compare")
def compare_resources(
    body: ResourceCompareRequest,
    db: Session = Depends(get_db)
):
    """
    Generates side-by-side multi-dimensional comparative metrics across selected resources.
    """
    if len(body.resource_ids) > 10:
        raise HTTPException(status_code=400, detail="Cannot compare more than 10 resources at once.")

    resources = db.query(Resource).filter(Resource.id.in_(body.resource_ids)).all()
    if not resources:
        raise HTTPException(status_code=404, detail="No resources found for comparison")

    comparison_matrix = []
    for r in resources:
        comparison_matrix.append({
            "id": r.id,
            "title": r.title,
            "resource_type": r.resource_type,
            "source": r.source,
            "technologies": r.technologies,
            "cost": "Free (Open Access)" if r.is_free else "Paid / Subscription",
            "open_source": "Yes (Public Repo / Open weights)" if r.is_open_source else "No (Proprietary)",
            "difficulty": r.difficulty,
            "domain": r.domain,
            "url": r.url,
            "integration_complexity": "Low (Direct REST/pip)" if "api" in r.resource_type or "tool" in r.resource_type else "Medium (Requires modeling/training)",
            "community_adoption": f"{r.metadata_json.get('stars', 'High')} stars / {r.metadata_json.get('citations', 'Strong')} citations" if r.metadata_json else "Widely adopted",
            "best_for": f"Rapid implementation & benchmarking for {r.domain} applications"
        })

    return {
        "total_compared": len(comparison_matrix),
        "comparison": comparison_matrix
    }
