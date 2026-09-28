from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float, Boolean
from sqlalchemy.orm import relationship as sa_relationship
from datetime import datetime
from app.database import Base


class KnowledgeGraph(Base):
    __tablename__ = "knowledge_graphs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, default="Project Knowledge Graph")
    version = Column(Integer, nullable=False, default=1)
    
    # Serialized graph structure: { nodes: [...], edges: [...], stats: {...}, metadata: {...} }
    graph_json = Column(JSON, nullable=False, default=dict)
    mermaid_source = Column(Text, nullable=False, default="")
    diagnostics = Column(JSON, default=dict) # { completeness_score, missing_links, orphaned_nodes, recommendations }
    insights = Column(JSON, default=dict) # { central_nodes, critical_path, key_hubs, innovation_threads }
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = sa_relationship("Project", back_populates="knowledge_graphs")
    nodes = sa_relationship("KnowledgeGraphNode", back_populates="knowledge_graph", cascade="all, delete-orphan")
    edges = sa_relationship("KnowledgeGraphEdge", back_populates="knowledge_graph", cascade="all, delete-orphan")
    snapshots = sa_relationship("KnowledgeGraphSnapshot", back_populates="knowledge_graph", cascade="all, delete-orphan")


class KnowledgeGraphNode(Base):
    __tablename__ = "knowledge_graph_nodes"

    id = Column(Integer, primary_key=True, index=True)
    graph_id = Column(Integer, ForeignKey("knowledge_graphs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    node_key = Column(String, nullable=False, index=True) # e.g. "idea:1", "tech:fastapi", "skill:3", "exp:1"
    label = Column(String, nullable=False) # e.g. "Real-time Telemetry Processing"
    category = Column(String, nullable=False, index=True)
    # IDEA, PROBLEM, RESEARCH_PAPER, DATASET, TECHNOLOGY, HARDWARE, EXISTING_SOLUTION,
    # INNOVATION_GAP, EXPERIMENT, BENCHMARK, VALIDATION_EVIDENCE, INNOVATION_CLAIM,
    # SKILL, ARCHITECTURE_COMPONENT, RESOURCE, ROADMAP_ITEM, CITATION
    
    entity_type = Column(String, nullable=True) # e.g. "Resource", "Experiment", "HardwareDevice", "SkillRequirement"
    entity_id = Column(Integer, nullable=True) # Underlying DB model id if applicable
    
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="ACTIVE")
    # IMPLEMENTED, CONFIGURED, SIMULATED, PLANNED, VALIDATED, PROPOSED, ACTIVE, IDENTIFIED
    
    source_type = Column(String, nullable=False, default="DIRECT")
    # DIRECT, DERIVED, AI_SUGGESTED, EMPIRICAL
    
    metadata_json = Column(JSON, default=dict)
    # { metrics: {...}, url: "...", confidence: 0.95, tags: [...], badge: "..." }
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    knowledge_graph = sa_relationship("KnowledgeGraph", back_populates="nodes")


class KnowledgeGraphEdge(Base):
    __tablename__ = "knowledge_graph_edges"

    id = Column(Integer, primary_key=True, index=True)
    graph_id = Column(Integer, ForeignKey("knowledge_graphs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    source_node_key = Column(String, nullable=False, index=True)
    target_node_key = Column(String, nullable=False, index=True)
    relationship_type = Column(String, nullable=False, index=True)
    # BASED_ON, SUPPORTS, USES, REQUIRES, DEPENDS_ON, IMPLEMENTS, ADDRESSES,
    # TESTS, BENCHMARKS, VALIDATES, PRODUCES, CITES, BUILDS_ON, CONNECTS_TO, INFORMS
    
    description = Column(String, nullable=True)
    confidence = Column(Float, default=1.0)
    provenance = Column(String, default="DIRECT") # DIRECT, DERIVED, AI_SUGGESTED
    evidence_refs = Column(JSON, default=list)
    metadata_json = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    knowledge_graph = sa_relationship("KnowledgeGraph", back_populates="edges")


class KnowledgeGraphSnapshot(Base):
    __tablename__ = "knowledge_graph_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    graph_id = Column(Integer, ForeignKey("knowledge_graphs.id", ondelete="CASCADE"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    version_number = Column(Integer, nullable=False, default=1)
    graph_json = Column(JSON, nullable=False)
    mermaid_source = Column(Text, nullable=False)
    change_summary = Column(Text, nullable=False)
    content_hash = Column(String, nullable=False)
    created_by = Column(String, default="AI_ENGINE") # AI_ENGINE, STUDENT, SYSTEM
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    knowledge_graph = sa_relationship("KnowledgeGraph", back_populates="snapshots")
    project = sa_relationship("Project", back_populates="knowledge_graph_snapshots")
