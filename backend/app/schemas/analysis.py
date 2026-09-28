from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class RequiredTechItem(BaseModel):
    category: str # e.g. "Core AI", "Backend", "Data Pipeline", "Frontend", "Cloud/DevOps"
    name: str
    why: str
    difficulty: Optional[str] = "Intermediate"

class AIAnalysisBase(BaseModel):
    summary: str
    problem_identified: str
    target_users: str
    required_technologies: List[Dict[str, Any]] = []
    required_resources: Dict[str, Any] = {}
    innovation_opportunities: List[str] = []
    potential_challenges: Dict[str, Any] = {}
    ai_suggestions: List[Dict[str, Any]] = []
    feasibility_score: int = 85
    innovation_score: int = 90
    market_potential_score: int = 80
    complexity_level: str = "Intermediate"

class AIAnalysisCreate(AIAnalysisBase):
    idea_id: int

class AIAnalysisResponse(AIAnalysisBase):
    id: int
    idea_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
