from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class RoadmapTaskBase(BaseModel):
    phase_number: int
    phase_name: str
    title: str
    description: Optional[str] = None
    is_completed: Optional[bool] = False
    deadline: Optional[str] = None
    notes: Optional[str] = None
    order_idx: Optional[int] = 0
    priority: Optional[str] = "Medium"
    resources_suggested: List[Dict[str, Any]] = []

class RoadmapTaskCreate(RoadmapTaskBase):
    pass

class RoadmapTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None

class RoadmapTaskResponse(RoadmapTaskBase):
    id: int
    roadmap_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectRoadmapBase(BaseModel):
    title: Optional[str] = "Innovation Development Roadmap"
    total_phases: Optional[int] = 10
    completion_percentage: Optional[int] = 0

class ProjectRoadmapResponse(ProjectRoadmapBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
    tasks: List[RoadmapTaskResponse] = []

    class Config:
        from_attributes = True
