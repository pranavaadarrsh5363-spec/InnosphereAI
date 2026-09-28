from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ResearchDocument(Base):
    __tablename__ = "research_documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    doc_type = Column(String, default="research_paper", index=True) # research_paper, technical_report
    title = Column(String, nullable=False)
    abstract = Column(Text, nullable=True)
    keywords = Column(JSON, default=list) # ["IoT", "Edge AI", "Water Quality", "Turbidity"]
    
    # Core Academic & Technical Sections
    problem_statement = Column(Text, nullable=True)
    objectives = Column(Text, nullable=True)
    related_work = Column(Text, nullable=True)
    research_gap = Column(Text, nullable=True)
    methodology = Column(Text, nullable=True)
    architecture = Column(Text, nullable=True)
    technology_stack = Column(Text, nullable=True)
    dataset_description = Column(Text, nullable=True)
    experimental_methodology = Column(Text, nullable=True)
    results = Column(Text, nullable=True)
    discussion = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)
    conclusion = Column(Text, nullable=True)
    future_work = Column(Text, nullable=True)
    
    # Metadata & Quality Control
    status = Column(String, default="draft", index=True) # draft, ai_generated, student_edited, under_mentor_review, revision_requested, reviewed, final
    version = Column(String, default="1.0")
    citation_coverage_pct = Column(Float, default=0.0)
    quality_summary = Column(JSON, default=dict) # {"structure": "READY", "evidence": "STRONG", ...}
    content_hash = Column(String, nullable=True, index=True)
    content_markdown = Column(Text, nullable=True, default="")
    content_latex = Column(Text, nullable=True, default="")
    
    last_modified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    generated_at = Column(DateTime, nullable=True)

    def __init__(self, **kwargs):
        if "paper_type" in kwargs and "doc_type" not in kwargs:
            kwargs["doc_type"] = kwargs.pop("paper_type")
        elif "paper_type" in kwargs:
            kwargs.pop("paper_type")
        if "document_type" in kwargs and "doc_type" not in kwargs:
            kwargs["doc_type"] = kwargs.pop("document_type")
        elif "document_type" in kwargs:
            kwargs.pop("document_type")
        super().__init__(**kwargs)

    @property
    def paper_type(self):
        return self.doc_type

    @paper_type.setter
    def paper_type(self, value):
        self.doc_type = value

    @property
    def document_type(self):
        return self.doc_type

    @document_type.setter
    def document_type(self, value):
        self.doc_type = value

    # Relationships
    project = relationship("Project", back_populates="research_documents")
    versions = relationship("ResearchDocumentVersion", back_populates="document", cascade="all, delete-orphan", order_by="ResearchDocumentVersion.created_at.desc()")
    citations = relationship("ResearchCitation", back_populates="document", cascade="all, delete-orphan", order_by="ResearchCitation.id.asc()")
    experiments = relationship("Experiment", back_populates="research_document", cascade="all, delete-orphan")


class ResearchDocumentVersion(Base):
    __tablename__ = "research_document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("research_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    version_number = Column(String, nullable=False) # e.g. "1.0", "1.1", "2.0"
    version_label = Column(String, nullable=False, default="AI Draft") # e.g. "Initial AI Draft", "Added Experiment Results"
    doc_type = Column(String, default="research_paper")
    title = Column(String, nullable=False)
    content_snapshot = Column(JSON, nullable=False) # Full JSON map of all sections
    content_hash = Column(String, nullable=True)
    changelog = Column(Text, nullable=True)
    
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    document = relationship("ResearchDocument", back_populates="versions")


class ResearchCitation(Base):
    __tablename__ = "research_citations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("research_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="SET NULL"), nullable=True, index=True)
    
    citation_key = Column(String, nullable=False, index=True) # e.g. "author2024edge", "who2023water"
    title = Column(String, nullable=False)
    authors = Column(JSON, default=list) # ["Author 1", "Author 2"]
    year = Column(Integer, nullable=True)
    venue = Column(String, nullable=True) # e.g. "IEEE Transactions on Industrial Informatics" / "arXiv:2401.0892"
    publisher = Column(String, nullable=True)
    doi = Column(String, nullable=True, index=True)
    arxiv_id = Column(String, nullable=True, index=True)
    openalex_id = Column(String, nullable=True)
    url = Column(String, nullable=True)
    
    # Formatted Citations
    bibtex = Column(Text, nullable=True)
    ieee_text = Column(Text, nullable=True)
    apa_text = Column(Text, nullable=True)
    
    source = Column(String, default="arXiv") # arXiv, OpenAlex, Semantic Scholar, Crossref, GitHub, Kaggle
    resource_type = Column(String, default="research_paper") # research_paper, dataset, github_repo, tool
    claim_tags = Column(JSON, default=list) # ["related_work", "methodology", "dataset"]
    is_verified = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("ResearchDocument", back_populates="citations")
    project = relationship("Project")
    resource = relationship("Resource")
