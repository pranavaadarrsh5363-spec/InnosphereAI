from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    key_insights = Column(JSON, default=list) # [{"title": "...", "detail": "...", "impact": "High"}]
    technology_trends = Column(JSON, default=list) # [{"tech": "...", "adoption": "Growing", "reason": "..."}]
    research_trends = Column(JSON, default=list) # [{"topic": "...", "recent_breakthrough": "..."}]
    innovation_gaps = Column(JSON, default=list) # [{"gap": "...", "current_state": "...", "your_advantage": "..."}]
    opportunity_areas = Column(JSON, default=list) # [{"area": "...", "actionable_step": "..."}]
    similar_solutions = Column(JSON, default=list) # [{"name": "...", "similarity": "...", "difference": "...", "url": "..."}]
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="insights")
