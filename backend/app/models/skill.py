from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, index=True, nullable=False) # Programming, Machine Learning, Web & APIs, Embedded & IoT, Data & Databases, etc.
    description = Column(Text, nullable=True)
    prerequisites = Column(JSON, default=list) # ["Python", "Linear Algebra Basics"]
    default_learning_effort = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project_requirements = relationship("ProjectSkillRequirement", back_populates="skill", cascade="all, delete-orphan")
    student_profiles = relationship("StudentSkillProfile", back_populates="skill", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="skill", cascade="all, delete-orphan")
    learning_path_items = relationship("LearningPathItem", back_populates="skill", cascade="all, delete-orphan")


class ProjectSkillRequirement(Base):
    __tablename__ = "project_skill_requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    
    required_level = Column(String, nullable=False, default="INTERMEDIATE") # BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    priority = Column(String, nullable=False, default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW, OPTIONAL
    reason = Column(Text, nullable=True)
    source_type = Column(String, nullable=False, default="TECH_STACK") # IDEA_ANALYSIS, TECH_STACK, ARCHITECTURE, HARDWARE, RESEARCH, EXPERIMENT, VALIDATION, ROADMAP, AI_SUGGESTION
    evidence_refs = Column(JSON, default=list) # [{"source": "Technology: PyTorch", "detail": "Required for model training"}]
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="skill_requirements")
    skill = relationship("Skill", back_populates="project_requirements")


class StudentSkillProfile(Base):
    __tablename__ = "student_skill_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    
    current_level = Column(String, nullable=True, default="BEGINNER") # NONE, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT, NOT_SURE
    progress_pct = Column(Integer, default=0) # 0 - 100
    learning_status = Column(String, default="NOT_STARTED") # NOT_STARTED, LEARNING, PRACTICING, COMPLETED
    evidence_items = Column(JSON, default=list) # [{"type": "SELF_REPORTED"|"PROJECT_EVIDENCE"|"RESOURCE_COMPLETION", "title": "...", "date": "..."}]
    confidence = Column(String, default="MEDIUM") # HIGH, MEDIUM, LOW, UNASSESSED
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="skill_profiles")
    skill = relationship("Skill", back_populates="student_profiles")


class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    
    required_level = Column(String, nullable=False) # BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    current_level = Column(String, nullable=True) # NONE, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT, NOT_SURE
    gap_level_diff = Column(Integer, default=0) # e.g. 1, 2, 3
    gap_status = Column(String, nullable=False, default="LEARNING_REQUIRED") # READY, PARTIALLY_READY, LEARNING_REQUIRED, PREREQUISITE_REQUIRED, OPTIONAL, NOT_ASSESSED
    priority = Column(String, default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW, OPTIONAL
    prerequisites_chain = Column(JSON, default=list) # [{"skill_name": "...", "status": "READY"|"GAP"}]
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="skill_gaps")
    skill = relationship("Skill", back_populates="skill_gaps")


class LearningPathItem(Base):
    __tablename__ = "learning_path_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    
    sequence_order = Column(Integer, nullable=False, default=1)
    phase_number = Column(Integer, nullable=False, default=1) # 1 to 6
    phase_name = Column(String, nullable=False, default="Phase 1 — Foundations")
    status = Column(String, default="NOT_STARTED") # NOT_STARTED, IN_PROGRESS, COMPLETED
    estimated_effort = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH
    resource_refs = Column(JSON, default=list) # [{"resource_id": 1, "title": "...", "why_this_resource": "..."}]
    project_task_refs = Column(JSON, default=list) # [{"title": "Build Baseline Experiment", "type": "EXPERIMENT"}]
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="learning_path_items")
    skill = relationship("Skill", back_populates="learning_path_items")
