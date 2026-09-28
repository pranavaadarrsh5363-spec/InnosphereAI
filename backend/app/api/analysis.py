from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.idea import Idea
from app.models.analysis import AIAnalysis
from app.schemas.analysis import AIAnalysisResponse
from app.utils.security import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/analysis", tags=["AI Analysis"])

@router.get("/{idea_id}")
def get_analysis_by_idea(
    idea_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    if not idea.analysis:
        raise HTTPException(status_code=404, detail="Analysis not generated for this idea yet")

    analysis = idea.analysis
    return {
        "id": analysis.id,
        "idea_id": analysis.idea_id,
        "idea_title": idea.title,
        "domain": idea.domain,
        "summary": analysis.summary,
        "problem_identified": analysis.problem_identified,
        "target_users": analysis.target_users,
        "required_technologies": analysis.required_technologies,
        "required_resources": analysis.required_resources,
        "innovation_opportunities": analysis.innovation_opportunities,
        "potential_challenges": analysis.potential_challenges,
        "ai_suggestions": analysis.ai_suggestions,
        "feasibility_score": analysis.feasibility_score,
        "innovation_score": analysis.innovation_score,
        "market_potential_score": analysis.market_potential_score,
        "complexity_level": analysis.complexity_level,
        "created_at": analysis.created_at
    }

@router.post("/re-analyze/{idea_id}")
async def reanalyze_idea(
    idea_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    analysis_data = await ai_service.analyze_idea({
        "title": idea.title,
        "problem_description": idea.problem_description,
        "proposed_solution": idea.proposed_solution,
        "domain": idea.domain,
        "target_users": idea.target_users,
        "technologies_known": idea.technologies_known,
        "technologies_interested": idea.technologies_interested,
        "expected_impact": idea.expected_impact
    })

    analysis = idea.analysis
    if not analysis:
        analysis = AIAnalysis(idea_id=idea.id)
        db.add(analysis)

    analysis.summary = analysis_data.get("summary", analysis.summary)
    analysis.problem_identified = analysis_data.get("problem_identified", analysis.problem_identified)
    analysis.target_users = analysis_data.get("target_users", analysis.target_users)
    analysis.required_technologies = analysis_data.get("required_technologies", analysis.required_technologies)
    analysis.required_resources = analysis_data.get("required_resources", analysis.required_resources)
    analysis.innovation_opportunities = analysis_data.get("innovation_opportunities", analysis.innovation_opportunities)
    analysis.potential_challenges = analysis_data.get("potential_challenges", analysis.potential_challenges)
    analysis.ai_suggestions = analysis_data.get("ai_suggestions", analysis.ai_suggestions)
    analysis.feasibility_score = analysis_data.get("feasibility_score", 85)
    analysis.innovation_score = analysis_data.get("innovation_score", 90)
    analysis.market_potential_score = analysis_data.get("market_potential_score", 80)
    analysis.complexity_level = analysis_data.get("complexity_level", "Intermediate")

    db.commit()
    db.refresh(analysis)
    return {"message": "Idea re-analyzed successfully with updated AI weights", "id": analysis.id}
