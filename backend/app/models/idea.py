from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Idea(Base):
    __tablename__ = "ideas"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    problem_description = Column(Text, nullable=False)
    proposed_solution = Column(Text, nullable=False)
    domain = Column(String, nullable=False, index=True)
    target_users = Column(Text, nullable=False)
    technologies_known = Column(JSON, default=list) # ["Python", "HTML"]
    technologies_interested = Column(JSON, default=list) # ["TensorFlow", "FastAPI"]
    expected_impact = Column(Text, nullable=False)
    available_resources = Column(Text, nullable=True)
    project_stage = Column(String, default="Concept") # Concept, Research, Prototype, Advanced
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="ideas")
    project = relationship("Project", back_populates="ideas")
    analysis = relationship("AIAnalysis", back_populates="idea", uselist=False, cascade="all, delete-orphan")
