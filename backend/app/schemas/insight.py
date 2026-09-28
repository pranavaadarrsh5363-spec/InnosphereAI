from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AIInsightBase(BaseModel):
    key_insights: List[Dict[str, Any]] = []
    technology_trends: List[Dict[str, Any]] = []
    research_trends: List[Dict[str, Any]] = []
    innovation_gaps: List[Dict[str, Any]] = []
    opportunity_areas: List[Dict[str, Any]] = []
    similar_solutions: List[Dict[str, Any]] = []

class AIInsightCreate(AIInsightBase):
    project_id: int

class AIInsightResponse(AIInsightBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
