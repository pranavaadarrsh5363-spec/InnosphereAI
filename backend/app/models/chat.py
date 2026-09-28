from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    role = Column(String, nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    context_data = Column(JSON, default=dict) # references, citations, query tokens
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="messages")
    project = relationship("Project", back_populates="messages")

class MentorReview(Base):
    __tablename__ = "mentor_reviews"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    feedback = Column(Text, nullable=False)
    rating = Column(Integer, default=5) # 1 - 5
    strengths = Column(JSON, default=list)
    areas_for_improvement = Column(JSON, default=list)
    recommended_technologies = Column(JSON, default=list)
    status = Column(String, default="Reviewed") # Pending, Reviewed, Approved
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="reviews")
    mentor = relationship("User", back_populates="mentor_reviews")
