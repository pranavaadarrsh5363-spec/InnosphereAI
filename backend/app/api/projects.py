from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.idea import Idea
from app.models.analysis import AIAnalysis
from app.models.roadmap import ProjectRoadmap, RoadmapTask
from app.models.insight import AIInsight
from app.models.resource import SavedResource
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.utils.security import get_current_user
from app.utils.rate_limiter import rate_limit
from app.utils.validators import sanitize_text
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def get_projects(
    domain: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    if current_user.role != "mentor" and current_user.role != "admin":
        query = query.filter(Project.user_id == current_user.id)

    if domain and domain != "all":
        clean_domain = sanitize_text(domain, max_length=100)
        query = query.filter(Project.domain.ilike(f"%{clean_domain}%"))
    if status_filter and status_filter != "all":
        clean_status = sanitize_text(status_filter, max_length=50)
        query = query.filter(Project.status == clean_status)
    if search:
        clean_search = sanitize_text(search, max_length=100)
        query = query.filter(Project.title.ilike(f"%{clean_search}%") | Project.problem_statement.ilike(f"%{clean_search}%"))

    offset = (page - 1) * page_size
    projects = query.order_by(Project.updated_at.desc()).offset(offset).limit(page_size).all()
    results = []
    for p in projects:
        p_dict = {
            "id": p.id,
            "title": p.title,
            "problem_statement": p.problem_statement,
            "proposed_solution": p.proposed_solution,
            "domain": p.domain,
            "technologies": p.technologies or [],
            "status": p.status,
            "progress": p.progress,
            "tags": p.tags or [],
            "user_id": p.user_id,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "ideas_count": len(p.ideas),
            "saved_resources_count": len(p.saved_resources),
            "has_analysis": any(i.analysis is not None for i in p.ideas),
            "has_roadmap": p.roadmap is not None,
            "has_insights": p.insights is not None
        }
        results.append(ProjectResponse(**p_dict))
    return results

@router.post(
    "",
    response_model=ProjectResponse,
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="create_project"))]
)
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_title = sanitize_text(project_in.title, max_length=250)
    clean_problem = sanitize_text(project_in.problem_statement, max_length=5000)
    clean_solution = sanitize_text(project_in.proposed_solution, max_length=5000)
    clean_domain = sanitize_text(project_in.domain, max_length=100)
    clean_techs = [sanitize_text(t, max_length=50) for t in (project_in.technologies or []) if t]
    clean_tags = [sanitize_text(t, max_length=50) for t in (project_in.tags or []) if t]

    project = Project(
        title=clean_title,
        problem_statement=clean_problem,
        proposed_solution=clean_solution,
        domain=clean_domain,
        technologies=clean_techs,
        status=project_in.status or "idea",
        progress=project_in.progress or 15,
        tags=clean_tags,
        user_id=current_user.id
    )
    db.add(project)
    db.flush()

    # Automatically generate default 10-phase roadmap
    try:
        roadmap_tasks_data = await ai_service.generate_roadmap({"title": project.title, "domain": project.domain})
        roadmap = ProjectRoadmap(
            project_id=project.id,
            title=f"10-Phase Innovation Roadmap: {project.title}",
            total_phases=10,
            completion_percentage=0
        )
        db.add(roadmap)
        db.flush()

        for task_data in roadmap_tasks_data:
            t = RoadmapTask(
                roadmap_id=roadmap.id,
                phase_number=task_data["phase_number"],
                phase_name=task_data["phase_name"],
                title=task_data["title"],
                description=task_data["description"],
                is_completed=False,
                deadline=task_data["deadline"],
                order_idx=task_data["order_idx"],
                priority=task_data["priority"],
                resources_suggested=task_data["resources_suggested"]
            )
            db.add(t)

        # Generate baseline AI insights
        insights_res = await ai_service.generate_insights({"title": project.title, "domain": project.domain})
        ai_insight = AIInsight(
            project_id=project.id,
            key_insights=insights_res["key_insights"],
            technology_trends=insights_res["technology_trends"],
            research_trends=insights_res["research_trends"],
            innovation_gaps=insights_res["innovation_gaps"],
            opportunity_areas=insights_res["opportunity_areas"],
            similar_solutions=insights_res["similar_solutions"]
        )
        db.add(ai_insight)
    except Exception:
        pass

    db.commit()
    db.refresh(project)

    return ProjectResponse(
        id=project.id,
        title=project.title,
        problem_statement=project.problem_statement,
        proposed_solution=project.proposed_solution,
        domain=project.domain,
        technologies=project.technologies or [],
        status=project.status,
        progress=project.progress,
        tags=project.tags or [],
        user_id=project.user_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        ideas_count=0,
        saved_resources_count=0,
        has_analysis=False,
        has_roadmap=True,
        has_insights=True
    )

@router.get("/{project_id}")
def get_project_detail(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Authorize owner, mentor or admin (IDOR Defense)
    if project.user_id != current_user.id and current_user.role not in ["mentor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this project.")

    # Gather nested entities
    ideas_list = []
    for idea in project.ideas:
        analysis_data = None
        if idea.analysis:
            analysis_data = {
                "id": idea.analysis.id,
                "summary": idea.analysis.summary,
                "problem_identified": idea.analysis.problem_identified,
                "target_users": idea.analysis.target_users,
                "required_technologies": idea.analysis.required_technologies,
                "required_resources": idea.analysis.required_resources,
                "innovation_opportunities": idea.analysis.innovation_opportunities,
                "potential_challenges": idea.analysis.potential_challenges,
                "ai_suggestions": idea.analysis.ai_suggestions,
                "feasibility_score": idea.analysis.feasibility_score,
                "innovation_score": idea.analysis.innovation_score,
                "complexity_level": idea.analysis.complexity_level
            }
        ideas_list.append({
            "id": idea.id,
            "title": idea.title,
            "problem_description": idea.problem_description,
            "proposed_solution": idea.proposed_solution,
            "domain": idea.domain,
            "target_users": idea.target_users,
            "technologies_known": idea.technologies_known,
            "technologies_interested": idea.technologies_interested,
            "expected_impact": idea.expected_impact,
            "available_resources": idea.available_resources,
            "project_stage": idea.project_stage,
            "created_at": idea.created_at,
            "analysis": analysis_data
        })

    saved_resources_list = []
    for sr in project.saved_resources:
        res = sr.resource
        if not res:
            continue
        saved_resources_list.append({
            "id": sr.id,
            "category": sr.category,
            "tags": sr.tags,
            "notes": sr.notes,
            "rating": sr.rating,
            "relevance_score": sr.relevance_score,
            "relevance_explanation": sr.relevance_explanation,
            "resource": {
                "id": res.id,
                "title": res.title,
                "description": res.description,
                "resource_type": res.resource_type,
                "source": res.source,
                "url": res.url,
                "authors": res.authors,
                "technologies": res.technologies,
                "domain": res.domain,
                "difficulty": res.difficulty,
                "is_open_source": res.is_open_source,
                "is_free": res.is_free,
                "metadata_json": res.metadata_json
            }
        })

    roadmap_data = None
    if project.roadmap:
        roadmap_data = {
            "id": project.roadmap.id,
            "title": project.roadmap.title,
            "completion_percentage": project.roadmap.completion_percentage,
            "tasks": [
                {
                    "id": t.id,
                    "phase_number": t.phase_number,
                    "phase_name": t.phase_name,
                    "title": t.title,
                    "description": t.description,
                    "is_completed": t.is_completed,
                    "deadline": t.deadline,
                    "notes": t.notes,
                    "priority": t.priority,
                    "order_idx": t.order_idx,
                    "resources_suggested": t.resources_suggested
                }
                for t in project.roadmap.tasks
            ]
        }

    insights_data = None
    if project.insights:
        insights_data = {
            "id": project.insights.id,
            "key_insights": project.insights.key_insights,
            "technology_trends": project.insights.technology_trends,
            "research_trends": project.insights.research_trends,
            "innovation_gaps": project.insights.innovation_gaps,
            "opportunity_areas": project.insights.opportunity_areas,
            "similar_solutions": project.insights.similar_solutions
        }

    reviews_data = [
        {
            "id": r.id,
            "mentor_name": r.mentor.full_name if r.mentor else "Faculty Mentor",
            "feedback": r.feedback,
            "rating": r.rating,
            "strengths": r.strengths,
            "areas_for_improvement": r.areas_for_improvement,
            "recommended_technologies": r.recommended_technologies,
            "created_at": r.created_at
        }
        for r in project.reviews
    ]

    return {
        "id": project.id,
        "title": project.title,
        "problem_statement": project.problem_statement,
        "proposed_solution": project.proposed_solution,
        "domain": project.domain,
        "technologies": project.technologies or [],
        "status": project.status,
        "progress": project.progress,
        "tags": project.tags or [],
        "user_id": project.user_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "ideas": ideas_list,
        "saved_resources": saved_resources_list,
        "roadmap": roadmap_data,
        "insights": insights_data,
        "reviews": reviews_data
    }

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this project.")

    for field, val in project_in.dict(exclude_unset=True).items():
        if isinstance(val, str):
            val = sanitize_text(val, max_length=5000)
        elif isinstance(val, list):
            val = [sanitize_text(item, max_length=100) if isinstance(item, str) else item for item in val]
        setattr(project, field, val)

    db.commit()
    db.refresh(project)
    return ProjectResponse(
        id=project.id,
        title=project.title,
        problem_statement=project.problem_statement,
        proposed_solution=project.proposed_solution,
        domain=project.domain,
        technologies=project.technologies or [],
        status=project.status,
        progress=project.progress,
        tags=project.tags or [],
        user_id=project.user_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        ideas_count=len(project.ideas),
        saved_resources_count=len(project.saved_resources),
        has_analysis=any(i.analysis is not None for i in project.ideas),
        has_roadmap=project.roadmap is not None,
        has_insights=project.insights is not None
    )

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this project.")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully", "id": project_id}
