from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    idea_id = Column(Integer, ForeignKey("ideas.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    summary = Column(Text, nullable=False)
    problem_identified = Column(Text, nullable=False)
    target_users = Column(Text, nullable=False)
    
    # Detailed structured fields
    required_technologies = Column(JSON, default=list) # [{"category": "Backend", "name": "FastAPI", "why": "..."}]
    required_resources = Column(JSON, default=dict) # {"datasets": [...], "apis": [...], "papers": [...], "hardware": [...], "tools": [...]}
    innovation_opportunities = Column(JSON, default=list) # ["Opportunity 1", "Opportunity 2"]
    potential_challenges = Column(JSON, default=dict) # {"technical": [...], "data": [...], "security": [...], "scalability": [...]}
    ai_suggestions = Column(JSON, default=list) # [{"title": "...", "description": "...", "priority": "High"}]
    
    feasibility_score = Column(Integer, default=85) # 0 - 100
    innovation_score = Column(Integer, default=90) # 0 - 100
    market_potential_score = Column(Integer, default=80)
    complexity_level = Column(String, default="Intermediate") # Beginner, Intermediate, Advanced
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    idea = relationship("Idea", back_populates="analysis")
