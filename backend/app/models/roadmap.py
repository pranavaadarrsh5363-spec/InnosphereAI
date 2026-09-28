from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ProjectRoadmap(Base):
    __tablename__ = "project_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    title = Column(String, default="Innovation Development Roadmap")
    total_phases = Column(Integer, default=10)
    completion_percentage = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="roadmap")
    tasks = relationship("RoadmapTask", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapTask.phase_number, RoadmapTask.order_idx")

class RoadmapTask(Base):
    __tablename__ = "roadmap_tasks"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("project_roadmaps.id", ondelete="CASCADE"), nullable=False)
    
    phase_number = Column(Integer, nullable=False) # 1 to 10
    phase_name = Column(String, nullable=False) # e.g. "Phase 1 - Problem Research"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    deadline = Column(String, nullable=True) # e.g. "2026-10-15"
    notes = Column(Text, nullable=True)
    order_idx = Column(Integer, default=0)
    priority = Column(String, default="Medium") # High, Medium, Low
    resources_suggested = Column(JSON, default=list) # [{"title": "...", "url": "..."}]
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    roadmap = relationship("ProjectRoadmap", back_populates="tasks")
