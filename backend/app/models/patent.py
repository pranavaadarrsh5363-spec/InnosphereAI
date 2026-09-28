from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float, Boolean
from sqlalchemy.orm import relationship as sa_relationship
from datetime import datetime
from app.database import Base


class PatentFamily(Base):
    __tablename__ = "patent_families"

    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(String, unique=True, index=True, nullable=False) # e.g. "FAM-US10928374"
    title = Column(String, nullable=False)
    earliest_priority_date = Column(String, nullable=True)
    jurisdictions = Column(JSON, default=list) # ["US", "EP", "WO", "IN"]
    member_publication_numbers = Column(JSON, default=list) # ["US-10928374-B2", "EP-3819201-A1"]
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patents = sa_relationship("PatentDocument", back_populates="family", cascade="all, delete-orphan")


class PatentDocument(Base):
    __tablename__ = "patent_documents"

    id = Column(Integer, primary_key=True, index=True)
    publication_number = Column(String, unique=True, index=True, nullable=False) # e.g. "US-10928374-B2", "EP-3819201-A1"
    application_number = Column(String, index=True, nullable=True) # e.g. "US-16/123456"
    title = Column(String, nullable=False)
    abstract = Column(Text, nullable=False)
    
    filing_date = Column(String, nullable=True) # "YYYY-MM-DD"
    publication_date = Column(String, nullable=True) # "YYYY-MM-DD"
    priority_date = Column(String, nullable=True) # "YYYY-MM-DD"
    grant_date = Column(String, nullable=True) # "YYYY-MM-DD"
    
    status = Column(String, default="PUBLISHED", index=True) # PUBLISHED, GRANTED, APPLICATION, EXPIRED, WITHDRAWN
    jurisdiction = Column(String, default="US", index=True) # US, EP, WO, IN, JP, CN, etc.
    
    inventors = Column(JSON, default=list) # ["Jane Doe, Ph.D.", "John Smith"]
    assignees = Column(JSON, default=list) # ["Apex Sensor Technologies Inc.", "University of Tech"]
    applicants = Column(JSON, default=list)
    
    patent_family_id = Column(Integer, ForeignKey("patent_families.id", ondelete="SET NULL"), nullable=True, index=True)
    
    source = Column(String, default="Google Patents", index=True) # Google Patents, USPTO OpenData, EPO Espacenet, WIPO, Open Patent Registry
    source_url = Column(String, nullable=True)
    official_url = Column(String, nullable=True)
    
    full_text_available = Column(Boolean, default=True)
    claims_available = Column(Boolean, default=True)
    
    technical_fields = Column(JSON, default=list) # ["IoT", "Edge Computing", "Water Quality", "Sensor Telemetry"]
    ipc_cpc_classes = Column(JSON, default=list) # ["G01N33/18", "G06N3/04", "H04L67/12"]
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    family = sa_relationship("PatentFamily", back_populates="patents")
    claims = sa_relationship("PatentClaim", back_populates="patent", cascade="all, delete-orphan", order_by="PatentClaim.claim_number.asc()")
    search_results = sa_relationship("PatentSearchResult", back_populates="patent", cascade="all, delete-orphan")
    saved_items = sa_relationship("SavedPriorArt", back_populates="patent", cascade="all, delete-orphan")
    overlaps = sa_relationship("PatentOverlap", back_populates="patent", cascade="all, delete-orphan")


class PatentClaim(Base):
    __tablename__ = "patent_claims"

    id = Column(Integer, primary_key=True, index=True)
    patent_id = Column(Integer, ForeignKey("patent_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    claim_number = Column(Integer, nullable=False) # 1, 2, 3...
    claim_text = Column(Text, nullable=False)
    is_independent = Column(Boolean, default=True)
    dependent_on_claim = Column(Integer, nullable=True) # e.g. 1
    claim_category = Column(String, default="System") # System, Method, Apparatus, Composition of Matter
    extracted_features = Column(JSON, default=list) # ["continuous turbidity sampling", "sub-100ms local trigger"]
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patent = sa_relationship("PatentDocument", back_populates="claims")


class PatentSearch(Base):
    __tablename__ = "patent_searches"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    query_text = Column(String, nullable=False)
    search_concepts = Column(JSON, default=dict) 
    # { "problem": "...", "tech": "...", "methods": [...], "components": [...], "queries": [...] }
    
    stages_searched = Column(JSON, default=list) # ["EXACT_CONCEPT", "TECHNICAL_COMPONENTS", "FUNCTIONAL_SIMILARITY", "BROADER_PRIOR_ART"]
    providers_used = Column(JSON, default=list) # ["Google Patents", "USPTO", "Open Patent Registry"]
    
    result_count = Column(Integer, default=0)
    search_coverage_score = Column(Float, default=0.0) # 0 - 100 percentage
    search_status = Column(String, default="COMPLETED") # COMPLETED, IN_PROGRESS, FAILED, PARTIAL
    search_hash = Column(String, index=True, nullable=True) # Cache hash key
    
    search_limitations = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = sa_relationship("Project", back_populates="patent_searches")
    results = sa_relationship("PatentSearchResult", back_populates="search", cascade="all, delete-orphan", order_by="PatentSearchResult.technical_similarity_score.desc()")


class PatentSearchResult(Base):
    __tablename__ = "patent_search_results"

    id = Column(Integer, primary_key=True, index=True)
    search_id = Column(Integer, ForeignKey("patent_searches.id", ondelete="CASCADE"), nullable=False, index=True)
    patent_id = Column(Integer, ForeignKey("patent_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    technical_similarity_score = Column(Float, nullable=False, default=0.0) # 0.0 - 100.0 (AI technical similarity indicator)
    feature_overlap_level = Column(String, default="MODERATE") # HIGH, MODERATE, LOW, MINIMAL
    abstract_similarity_score = Column(Float, default=0.0)
    claim_similarity_score = Column(Float, default=0.0)
    
    overlap_summary = Column(Text, default="")
    differentiation_summary = Column(Text, default="")
    
    matched_features = Column(JSON, default=list) # [{"student_feature": "...", "patent_feature": "...", "similarity": 0.92}]
    why_similar = Column(JSON, default=list) # ["Both monitor water turbidity using multi-sensor probes", "Both deploy wireless telemetry"]
    potential_differences = Column(JSON, default=list) # ["Student project utilizes on-device 1D-CNN", "Patent uses cloud batch inference"]
    
    evidence_status = Column(String, default="PATENT_ANALYSIS") # PATENT_ANALYSIS, SOURCE_DERIVED, AI_SUGGESTION
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    search = sa_relationship("PatentSearch", back_populates="results")
    patent = sa_relationship("PatentDocument", back_populates="search_results")


class SavedPriorArt(Base):
    __tablename__ = "saved_prior_art"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    patent_id = Column(Integer, ForeignKey("patent_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    why_saved = Column(Text, default="")
    relevant_features = Column(JSON, default=list) # ["Sensor arrangement", "Edge classification pipeline"]
    notes = Column(Text, default="")
    tags = Column(JSON, default=list) # ["CORE_TECHNOLOGY", "SIMILAR_HARDWARE", "IMPORTANT_DIFFERENTIATION", "RESEARCH_REFERENCE"]
    
    saved_to_research = Column(Boolean, default=False)
    synced_citation_id = Column(Integer, nullable=True) # Linked research_citations.id if synced
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = sa_relationship("Project", back_populates="saved_prior_art")
    patent = sa_relationship("PatentDocument", back_populates="saved_items")


class PatentOverlap(Base):
    __tablename__ = "patent_overlaps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    patent_id = Column(Integer, ForeignKey("patent_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String, default="Core Functionality") # Core Functionality, Hardware, AI Method, Data Processing, Sensor Arrangement, Communication, Deployment
    overlap_area = Column(String, nullable=False) # e.g. "Continuous Multiparametric Water Telemetry"
    technical_detail = Column(Text, nullable=False)
    evidence_source = Column(String, default="Patent Abstract & Claim 1")
    confidence_score = Column(Float, default=0.85) # AI Evidence-supported Matching Confidence (Not legal confidence)
    
    differentiation_opportunity = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = sa_relationship("Project", back_populates="patent_overlaps")
    patent = sa_relationship("PatentDocument", back_populates="overlaps")
