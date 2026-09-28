from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    resource_type = Column(String, nullable=False, index=True) # research_paper, dataset, api, github_repo, tool, course, ai_model, documentation
    source = Column(String, nullable=False, index=True) # arXiv, OpenAlex, GitHub, HuggingFace, Kaggle, Crossref, Official Docs
    url = Column(String, nullable=False, index=True)
    authors = Column(JSON, default=list) # ["Author 1", "Author 2"]
    technologies = Column(JSON, default=list) # ["Python", "PyTorch"]
    domain = Column(String, nullable=False, index=True)
    difficulty = Column(String, default="Intermediate") # Beginner, Intermediate, Advanced
    is_open_source = Column(Boolean, default=True)
    is_free = Column(Boolean, default=True)
    published_date = Column(String, nullable=True)
    metadata_json = Column(JSON, default=dict) # stars, citations, downloads, license, etc.
    
    # Semantic Search & Vector Embedding Infrastructure
    doi = Column(String, nullable=True, index=True)
    external_id = Column(String, nullable=True, index=True)
    quality_score = Column(Float, default=75.0)
    embedding = Column(JSON, nullable=True) # Vector float list representation
    embedding_model = Column(String, nullable=True)
    embedding_version = Column(String, default="v1")
    embedding_created_at = Column(DateTime, nullable=True)
    embedding_text_hash = Column(String, nullable=True, index=True)
    embedding_status = Column(String, default="pending", index=True) # pending, completed, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    saved_by = relationship("SavedResource", back_populates="resource", cascade="all, delete-orphan")

class SavedResource(Base):
    __tablename__ = "saved_resources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    category = Column(String, default="General")
    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)
    rating = Column(Integer, default=5)
    relevance_score = Column(Integer, default=90)
    relevance_explanation = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="saved_resources")
    resource = relationship("Resource", back_populates="saved_by")
    project = relationship("Project", back_populates="saved_resources")
