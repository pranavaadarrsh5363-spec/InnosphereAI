from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatMessageBase(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=5000)
    context_data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ChatMessageCreate(ChatMessageBase):
    project_id: Optional[int] = None

class ChatMessageResponse(ChatMessageBase):
    id: int
    user_id: int
    project_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AssistantQueryRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=3000)
    project_id: Optional[int] = None
    context_type: Optional[str] = Field("general", max_length=100)

class MentorReviewBase(BaseModel):
    feedback: str = Field(..., min_length=3, max_length=5000)
    rating: int = Field(5, ge=1, le=5)
    strengths: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)
    recommended_technologies: List[str] = Field(default_factory=list)
    status: Optional[str] = Field("Reviewed", max_length=50)

class MentorReviewCreate(MentorReviewBase):
    project_id: int

class MentorReviewResponse(MentorReviewBase):
    id: int
    project_id: int
    mentor_id: int
    mentor_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
