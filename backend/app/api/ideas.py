from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.idea import Idea
from app.models.analysis import AIAnalysis
from app.models.roadmap import ProjectRoadmap, RoadmapTask
from app.models.insight import AIInsight
from app.schemas.idea import IdeaCreate, IdeaResponse
from app.schemas.analysis import AIAnalysisResponse
from app.utils.security import get_current_user
from app.utils.rate_limiter import rate_limit
from app.utils.validators import sanitize_text
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/ideas", tags=["Ideas"])

@router.get("", response_model=List[IdeaResponse])
def get_ideas(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Idea)
    if current_user.role != "mentor" and current_user.role != "admin":
        query = query.filter(Idea.user_id == current_user.id)
    if project_id:
        query = query.filter(Idea.project_id == project_id)

    ideas = query.order_by(Idea.created_at.desc()).all()
    results = []
    for idea in ideas:
        results.append(IdeaResponse(
            id=idea.id,
            title=idea.title,
            problem_description=idea.problem_description,
            proposed_solution=idea.proposed_solution,
            domain=idea.domain,
            target_users=idea.target_users,
            technologies_known=idea.technologies_known or [],
            technologies_interested=idea.technologies_interested or [],
            expected_impact=idea.expected_impact,
            available_resources=idea.available_resources,
            project_stage=idea.project_stage,
            project_id=idea.project_id,
            user_id=idea.user_id,
            created_at=idea.created_at,
            updated_at=idea.updated_at,
            has_analysis=idea.analysis is not None
        ))
    return results

@router.post(
    "/submit",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="idea_submission"))]
)
async def submit_and_analyze_idea(
    idea_in: IdeaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a student innovation idea, triggers deep AI analysis, creates or links a project,
    and returns the idea with the complete generated AI Analysis payload.
    """
    clean_title = sanitize_text(idea_in.title, max_length=250)
    clean_problem = sanitize_text(idea_in.problem_description, max_length=5000)
    clean_solution = sanitize_text(idea_in.proposed_solution, max_length=5000)
    clean_domain = sanitize_text(idea_in.domain, max_length=100)
    clean_target_users = sanitize_text(idea_in.target_users, max_length=500)
    clean_known = [sanitize_text(t, max_length=50) for t in (idea_in.technologies_known or []) if t]
    clean_interested = [sanitize_text(t, max_length=50) for t in (idea_in.technologies_interested or []) if t]
    clean_impact = sanitize_text(idea_in.expected_impact, max_length=1000)
    clean_resources = sanitize_text(idea_in.available_resources, max_length=1000) if idea_in.available_resources else None
    clean_stage = sanitize_text(idea_in.project_stage or "Concept", max_length=100)

    # 1. Check or Create Project
    project_id = idea_in.project_id
    if project_id:
        existing_proj = db.query(Project).filter(Project.id == project_id).first()
        if not existing_proj:
            raise HTTPException(status_code=404, detail="Specified project does not exist.")
        if existing_proj.user_id != current_user.id and current_user.role not in ["mentor", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized to link idea to this project.")
    else:
        project = Project(
            title=clean_title,
            problem_statement=clean_problem,
            proposed_solution=clean_solution,
            domain=clean_domain,
            technologies=clean_known + clean_interested,
            status="idea",
            progress=15,
            tags=[clean_domain, clean_stage],
            user_id=current_user.id
        )
        db.add(project)
        db.flush()
        project_id = project.id

        # Generate default 10-phase roadmap
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

            # Generate baseline insights
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
        except Exception as e:
            # Non-blocking roadmap/insights generation error
            pass

    # 2. Create Idea
    idea = Idea(
        title=clean_title,
        problem_description=clean_problem,
        proposed_solution=clean_solution,
        domain=clean_domain,
        target_users=clean_target_users,
        technologies_known=clean_known,
        technologies_interested=clean_interested,
        expected_impact=clean_impact,
        available_resources=clean_resources,
        project_stage=clean_stage,
        user_id=current_user.id,
        project_id=project_id
    )
    db.add(idea)
    db.flush()

    # 3. Trigger Deep AI Idea Analysis
    analysis_dict = await ai_service.analyze_idea({
        "title": clean_title,
        "problem_description": clean_problem,
        "proposed_solution": clean_solution,
        "domain": clean_domain,
        "target_users": clean_target_users,
        "technologies_known": clean_known,
        "technologies_interested": clean_interested,
        "expected_impact": clean_impact,
        "available_resources": clean_resources,
        "project_stage": clean_stage
    })
    
    ai_analysis = AIAnalysis(
        idea_id=idea.id,
        summary=analysis_dict.get("summary", f"AI Analysis of {idea.title}"),
        problem_identified=analysis_dict.get("problem_identified", idea.problem_description),
        target_users=analysis_dict.get("target_users", idea.target_users),
        required_technologies=analysis_dict.get("required_technologies", []),
        required_resources=analysis_dict.get("required_resources", {}),
        innovation_opportunities=analysis_dict.get("innovation_opportunities", []),
        potential_challenges=analysis_dict.get("potential_challenges", {}),
        ai_suggestions=analysis_dict.get("ai_suggestions", []),
        feasibility_score=analysis_dict.get("feasibility_score", 85),
        innovation_score=analysis_dict.get("innovation_score", 90),
        market_potential_score=analysis_dict.get("market_potential_score", 82),
        complexity_level=analysis_dict.get("complexity_level", "Intermediate")
    )
    db.add(ai_analysis)
    db.commit()
    db.refresh(idea)
    db.refresh(ai_analysis)

    return {
        "idea": {
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
            "project_id": idea.project_id,
            "created_at": idea.created_at
        },
        "analysis": {
            "id": ai_analysis.id,
            "idea_id": ai_analysis.idea_id,
            "summary": ai_analysis.summary,
            "problem_identified": ai_analysis.problem_identified,
            "target_users": ai_analysis.target_users,
            "required_technologies": ai_analysis.required_technologies,
            "required_resources": ai_analysis.required_resources,
            "innovation_opportunities": ai_analysis.innovation_opportunities,
            "potential_challenges": ai_analysis.potential_challenges,
            "ai_suggestions": ai_analysis.ai_suggestions,
            "feasibility_score": ai_analysis.feasibility_score,
            "innovation_score": ai_analysis.innovation_score,
            "market_potential_score": ai_analysis.market_potential_score,
            "complexity_level": ai_analysis.complexity_level,
            "created_at": ai_analysis.created_at
        },
        "project_id": project_id
    }

@router.get("/{idea_id}")
def get_idea(
    idea_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    # IDOR Protection
    if idea.user_id != current_user.id and current_user.role not in ["mentor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this idea.")

    analysis_data = None
    if idea.analysis:
        analysis_data = {
            "id": idea.analysis.id,
            "idea_id": idea.analysis.idea_id,
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
            "market_potential_score": idea.analysis.market_potential_score,
            "complexity_level": idea.analysis.complexity_level,
            "created_at": idea.analysis.created_at
        }

    return {
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
        "project_id": idea.project_id,
        "created_at": idea.created_at,
        "analysis": analysis_data
    }
