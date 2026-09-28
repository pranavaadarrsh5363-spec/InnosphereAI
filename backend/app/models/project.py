from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    problem_statement = Column(Text, nullable=False)
    proposed_solution = Column(Text, nullable=False)
    domain = Column(String, nullable=False, index=True) # AI, Healthcare, Agriculture, etc.
    technologies = Column(JSON, default=list) # ["Python", "FastAPI", "React", "PyTorch"]
    status = Column(String, default="idea", index=True) # idea, research, planning, prototype, development, testing, completed
    progress = Column(Integer, default=10) # 0 - 100 percentage
    tags = Column(JSON, default=list)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="projects")
    ideas = relationship("Idea", back_populates="project", cascade="all, delete-orphan")
    saved_resources = relationship("SavedResource", back_populates="project", cascade="all, delete-orphan")
    roadmap = relationship("ProjectRoadmap", back_populates="project", uselist=False, cascade="all, delete-orphan")
    insights = relationship("AIInsight", back_populates="project", uselist=False, cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="project", cascade="all, delete-orphan")
    reviews = relationship("MentorReview", back_populates="project", cascade="all, delete-orphan")
    hardware_devices = relationship("HardwareDevice", back_populates="project", cascade="all, delete-orphan")
    hardware_alerts = relationship("HardwareAlert", back_populates="project", cascade="all, delete-orphan")
    hardware_experiments = relationship("HardwareExperiment", back_populates="project", cascade="all, delete-orphan")
    intelligence_snapshots = relationship("ProjectIntelligenceSnapshot", back_populates="project", cascade="all, delete-orphan", order_by="ProjectIntelligenceSnapshot.created_at.desc()")
    research_documents = relationship("ResearchDocument", back_populates="project", cascade="all, delete-orphan", order_by="ResearchDocument.updated_at.desc()")
    experiments = relationship("Experiment", back_populates="project", cascade="all, delete-orphan", order_by="Experiment.created_at.desc()")
    benchmark_references = relationship("BenchmarkReference", back_populates="project", cascade="all, delete-orphan", order_by="BenchmarkReference.created_at.desc()")
    innovation_claims = relationship("InnovationClaim", back_populates="project", cascade="all, delete-orphan", order_by="InnovationClaim.created_at.desc()")
    competition_checklists = relationship("CompetitionChecklistItem", cascade="all, delete-orphan", order_by="CompetitionChecklistItem.order_idx.asc()")
    cost_items = relationship("ProjectCostItem", cascade="all, delete-orphan", order_by="ProjectCostItem.created_at.asc()")
    stakeholder_reviews = relationship("StakeholderReview", cascade="all, delete-orphan", order_by="StakeholderReview.created_at.desc()")
    skill_requirements = relationship("ProjectSkillRequirement", back_populates="project", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="project", cascade="all, delete-orphan")
    learning_path_items = relationship("LearningPathItem", back_populates="project", cascade="all, delete-orphan", order_by="LearningPathItem.sequence_order.asc()")
    architectures = relationship("Architecture", back_populates="project", cascade="all, delete-orphan")
    architecture_versions = relationship("ArchitectureVersion", back_populates="project", cascade="all, delete-orphan", order_by="ArchitectureVersion.version_number.desc()")
    knowledge_graphs = relationship("KnowledgeGraph", back_populates="project", cascade="all, delete-orphan")
    knowledge_graph_snapshots = relationship("KnowledgeGraphSnapshot", back_populates="project", cascade="all, delete-orphan", order_by="KnowledgeGraphSnapshot.version_number.desc()")
    patent_searches = relationship("PatentSearch", back_populates="project", cascade="all, delete-orphan", order_by="PatentSearch.created_at.desc()")
    saved_prior_art = relationship("SavedPriorArt", back_populates="project", cascade="all, delete-orphan", order_by="SavedPriorArt.created_at.desc()")
    patent_overlaps = relationship("PatentOverlap", back_populates="project", cascade="all, delete-orphan", order_by="PatentOverlap.created_at.desc()")

