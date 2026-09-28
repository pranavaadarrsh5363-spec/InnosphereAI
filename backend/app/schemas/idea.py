from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class IdeaBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=250)
    problem_description: str = Field(..., min_length=5, max_length=5000)
    proposed_solution: str = Field(..., min_length=5, max_length=5000)
    domain: str = Field(..., min_length=2, max_length=100)
    target_users: str = Field(..., min_length=2, max_length=500)
    technologies_known: List[str] = Field(default_factory=list)
    technologies_interested: List[str] = Field(default_factory=list)
    expected_impact: Optional[str] = Field("", max_length=1000)
    available_resources: Optional[str] = Field(None, max_length=1000)
    project_stage: Optional[str] = Field("Concept", max_length=100)
    project_id: Optional[int] = None

class IdeaCreate(IdeaBase):
    pass

class IdeaResponse(IdeaBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    has_analysis: Optional[bool] = False

    class Config:
        from_attributes = True
