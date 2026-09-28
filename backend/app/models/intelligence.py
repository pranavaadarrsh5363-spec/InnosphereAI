from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ProjectIntelligenceSnapshot(Base):
    __tablename__ = "project_intelligence_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    overall_health_score = Column(Integer, nullable=False, default=70) # 0 - 100
    health_status = Column(String, nullable=False, default="DEVELOPING") # CRITICAL, NEEDS_ATTENTION, DEVELOPING, STRONG, EXEMPLARY
    summary_verdict = Column(Text, nullable=True)
    
    # Detailed structured matrices
    maturity_dimensions = Column(JSON, default=list) # List of 7 dimension objects
    risks = Column(JSON, default=list) # List of detected risk items
    next_best_action = Column(JSON, default=dict) # High leverage next action
    research_clusters = Column(JSON, default=list) # Clustered research pillars
    innovation_gaps = Column(JSON, default=list) # Strategic gaps & opportunities
    hardware_intelligence = Column(JSON, default=dict) # Telemetry & device metrics
    
    content_hash = Column(String, nullable=True, index=True) # SHA-256 for caching
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    project = relationship("Project", back_populates="intelligence_snapshots")
