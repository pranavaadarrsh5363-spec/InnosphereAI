from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.insight import AIInsight
from app.utils.security import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.get("/project/{project_id}")
def get_project_insights(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    insights = project.insights
    if not insights:
        raise HTTPException(status_code=404, detail="No AI insights generated yet for this project")

    return {
        "id": insights.id,
        "project_id": project_id,
        "project_title": project.title,
        "domain": project.domain,
        "key_insights": insights.key_insights,
        "technology_trends": insights.technology_trends,
        "research_trends": insights.research_trends,
        "innovation_gaps": insights.innovation_gaps,
        "opportunity_areas": insights.opportunity_areas,
        "similar_solutions": insights.similar_solutions,
        "created_at": insights.created_at
    }

@router.post("/generate/{project_id}")
async def generate_project_insights(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    insights_res = await ai_service.generate_insights({"title": project.title, "domain": project.domain, "problem_statement": project.problem_statement})

    insights = project.insights
    if not insights:
        insights = AIInsight(project_id=project.id)
        db.add(insights)

    insights.key_insights = insights_res.get("key_insights", [])
    insights.technology_trends = insights_res.get("technology_trends", [])
    insights.research_trends = insights_res.get("research_trends", [])
    insights.innovation_gaps = insights_res.get("innovation_gaps", [])
    insights.opportunity_areas = insights_res.get("opportunity_areas", [])
    insights.similar_solutions = insights_res.get("similar_solutions", [])

    db.commit()
    db.refresh(insights)
    return {"message": "AI Insights refreshed successfully", "id": insights.id}
