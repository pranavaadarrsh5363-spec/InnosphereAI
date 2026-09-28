from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship as sa_relationship
from datetime import datetime
from app.database import Base


class Architecture(Base):
    __tablename__ = "architectures"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, default="Project Architecture")
    architecture_type = Column(String, nullable=False, default="SYSTEM", index=True) 
    # SYSTEM, DATA_FLOW, AI_PIPELINE, HARDWARE, API_FLOW, DEPLOYMENT, APPLICATION_FLOW, SECURITY
    
    graph_json = Column(JSON, nullable=False, default=dict) # { nodes: [...], edges: [...], layers: [...], metadata: {...} }
    mermaid_source = Column(Text, nullable=False)
    custom_mermaid_source = Column(Text, nullable=True)
    is_customized = Column(Boolean, default=False)
    explanation = Column(Text, nullable=True)
    diagnostics = Column(JSON, default=dict) # { checks: [...], warnings: [...], checklist: [...] }
    status = Column(String, default="GENERATED") # GENERATED, VALIDATED, CUSTOMIZED, DRAFT
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = sa_relationship("Project", back_populates="architectures")
    nodes = sa_relationship("ArchitectureNode", back_populates="architecture", cascade="all, delete-orphan")
    edges = sa_relationship("ArchitectureEdge", back_populates="architecture", cascade="all, delete-orphan")
    versions = sa_relationship("ArchitectureVersion", back_populates="architecture", cascade="all, delete-orphan")


class ArchitectureNode(Base):
    __tablename__ = "architecture_nodes"

    id = Column(Integer, primary_key=True, index=True)
    architecture_id = Column(Integer, ForeignKey("architectures.id", ondelete="CASCADE"), nullable=False, index=True)
    
    node_key = Column(String, nullable=False, index=True) # e.g. "sensors_node", "esp32", "fastapi_api"
    name = Column(String, nullable=False) # e.g. "Soil Moisture Sensor", "FastAPI Backend"
    node_type = Column(String, nullable=False) 
    # USER, FRONTEND, BACKEND, API, AI_MODEL, AI_SERVICE, DATABASE, VECTOR_DATABASE, 
    # DATA_SOURCE, DATASET, HARDWARE, SENSOR, ACTUATOR, MESSAGE_BROKER, EXTERNAL_SERVICE, 
    # STORAGE, CACHE, AUTH_SERVICE, MONITORING, DEPLOYMENT
    
    category = Column(String, nullable=True) # e.g. "Client Tier", "Edge Hardware", "Inference Layer"
    technology = Column(String, nullable=True) # e.g. "Next.js", "FastAPI", "PyTorch", "ESP32", "MQTT"
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="PROPOSED") 
    # IMPLEMENTED, CONFIGURED, TESTED, VALIDATED, PLANNED, PROPOSED, SIMULATED, NOT_TESTED
    
    source_type = Column(String, nullable=False, default="AI_SUGGESTION") 
    # PROJECT_FACT, TECH_STACK, IMPLEMENTED, RESEARCH_SUPPORTED, AI_SUGGESTION, PLANNED, SIMULATED
    
    evidence_refs = Column(JSON, default=list) # ["Tech stack recommendation", "Hardware Lab device"]
    required_skills = Column(JSON, default=list) # ["Python", "FastAPI", "Asynchronous Programming"]
    associated_experiments = Column(JSON, default=list) # ["EXP-001 Baseline CNN"]
    validation_status = Column(String, default="NOT_TESTED") # SIMULATED, PARTIALLY_VALIDATED, VALIDATED, NOT_TESTED
    metadata_json = Column(JSON, default=dict) # port, protocol, data_format, pinout, etc.
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    architecture = sa_relationship("Architecture", back_populates="nodes")


class ArchitectureEdge(Base):
    __tablename__ = "architecture_edges"

    id = Column(Integer, primary_key=True, index=True)
    architecture_id = Column(Integer, ForeignKey("architectures.id", ondelete="CASCADE"), nullable=False, index=True)
    
    source_node = Column(String, nullable=False) # source node_key
    target_node = Column(String, nullable=False) # target node_key
    relationship = Column(String, nullable=False, default="SENDS_DATA_TO")
    # CALLS, SENDS_DATA_TO, RECEIVES_DATA_FROM, PUBLISHES_TO, SUBSCRIBES_TO, 
    # STORES_IN, READS_FROM, INFERENCES, AUTHENTICATES, DEPLOYS_TO, TRIGGERS, DEPENDS_ON
    
    protocol = Column(String, nullable=True) # HTTP/REST, MQTT, WebSocket, gRPC, I2C/SPI, SQL, In-Memory
    data_type = Column(String, nullable=True) # Telemetry JSON, Embeddings Vector, JWT Bearer Token, Prediction Record
    description = Column(String, nullable=True)
    direction = Column(String, default="FORWARD") # FORWARD, BIDIRECTIONAL
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    architecture = sa_relationship("Architecture", back_populates="edges")


class ArchitectureVersion(Base):
    __tablename__ = "architecture_versions"

    id = Column(Integer, primary_key=True, index=True)
    architecture_id = Column(Integer, ForeignKey("architectures.id", ondelete="CASCADE"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    version_number = Column(Integer, nullable=False, default=1)
    architecture_type = Column(String, nullable=False, default="SYSTEM")
    graph_snapshot = Column(JSON, nullable=False)
    mermaid_source = Column(Text, nullable=False)
    change_summary = Column(Text, nullable=False)
    content_hash = Column(String, nullable=False)
    created_by = Column(String, default="AI_GENERATOR") # AI_GENERATOR, STUDENT, SYSTEM
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    architecture = sa_relationship("Architecture", back_populates="versions")
    project = sa_relationship("Project", back_populates="architecture_versions")

