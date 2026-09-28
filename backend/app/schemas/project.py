from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class ProjectBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=250)
    problem_statement: str = Field(..., min_length=5, max_length=5000)
    proposed_solution: str = Field(..., min_length=5, max_length=5000)
    domain: str = Field(..., min_length=2, max_length=100)
    technologies: List[str] = Field(default_factory=list)
    status: Optional[str] = Field("idea", pattern="^(idea|research|planning|prototype|development|testing|completed)$")
    progress: Optional[int] = Field(10, ge=0, le=100)
    tags: List[str] = Field(default_factory=list)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=250)
    problem_statement: Optional[str] = Field(None, min_length=5, max_length=5000)
    proposed_solution: Optional[str] = Field(None, min_length=5, max_length=5000)
    domain: Optional[str] = Field(None, min_length=2, max_length=100)
    technologies: Optional[List[str]] = None
    status: Optional[str] = Field(None, pattern="^(idea|research|planning|prototype|development|testing|completed)$")
    progress: Optional[int] = Field(None, ge=0, le=100)
    tags: Optional[List[str]] = None

class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    ideas_count: Optional[int] = 0
    saved_resources_count: Optional[int] = 0
    has_analysis: Optional[bool] = False
    has_roadmap: Optional[bool] = False
    has_insights: Optional[bool] = False

    class Config:
        from_attributes = True
