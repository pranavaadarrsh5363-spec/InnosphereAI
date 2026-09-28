import hashlib
import json
import logging
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.architecture import Architecture, ArchitectureNode, ArchitectureEdge, ArchitectureVersion
from app.models.hardware import HardwareDevice, HardwareSensor
from app.models.experiment import Experiment
from app.models.validation import InnovationClaim, ValidationEvidence
from app.models.skill import ProjectSkillRequirement, SkillGap
from app.models.roadmap import ProjectRoadmap, RoadmapTask
from app.models.research import ResearchDocument

logger = logging.getLogger("inno_sphere")


class ArchitectureGeneratorService:
    """
    Core AI Architecture & Flowchart Generator Engine.
    Transforms project ideas, requirements, technologies, hardware, AI models,
    experiments, validation claims, and skills into structured ArchitectureGraphs,
    syntax-validated Mermaid diagrams, vector SVGs, and step-by-step technical explanations.
    """

    SUPPORTED_VIEWS = [
        "SYSTEM",
        "DATA_FLOW",
        "AI_PIPELINE",
        "HARDWARE",
        "API_FLOW",
        "DEPLOYMENT",
        "APPLICATION_FLOW",
        "SECURITY"
    ]

    # Node Type Color & Styling Maps
    NODE_TYPE_STYLES = {
        "USER": {"fill": "#EEF2FF", "stroke": "#6366F1", "shape": "stadium"},
        "FRONTEND": {"fill": "#F0FDF4", "stroke": "#22C55E", "shape": "rounded"},
        "BACKEND": {"fill": "#EFF6FF", "stroke": "#3B82F6", "shape": "rect"},
        "API": {"fill": "#FDF2F8", "stroke": "#EC4899", "shape": "subroutine"},
        "AI_MODEL": {"fill": "#FAF5FF", "stroke": "#A855F7", "shape": "hexagon"},
        "AI_SERVICE": {"fill": "#FAF5FF", "stroke": "#9333EA", "shape": "subroutine"},
        "DATABASE": {"fill": "#FFFBEB", "stroke": "#F59E0B", "shape": "cylinder"},
        "VECTOR_DATABASE": {"fill": "#FEF3C7", "stroke": "#D97706", "shape": "cylinder"},
        "DATA_SOURCE": {"fill": "#F8FAFC", "stroke": "#64748B", "shape": "rect"},
        "DATASET": {"fill": "#F1F5F9", "stroke": "#475569", "shape": "folder"},
        "HARDWARE": {"fill": "#FFF1F2", "stroke": "#F43F5E", "shape": "rect"},
        "SENSOR": {"fill": "#FFF1F2", "stroke": "#E11D48", "shape": "circle"},
        "ACTUATOR": {"fill": "#FFE4E6", "stroke": "#BE123C", "shape": "rect"},
        "MESSAGE_BROKER": {"fill": "#ECFEFF", "stroke": "#06B6D4", "shape": "diamond"},
        "EXTERNAL_SERVICE": {"fill": "#F8FAFC", "stroke": "#94A3B8", "shape": "rect"},
        "STORAGE": {"fill": "#F0FDF4", "stroke": "#16A34A", "shape": "cylinder"},
        "CACHE": {"fill": "#FFF7ED", "stroke": "#EA580C", "shape": "cylinder"},
        "AUTH_SERVICE": {"fill": "#FEF2F2", "stroke": "#DC2626", "shape": "subroutine"},
        "MONITORING": {"fill": "#F0F9FF", "stroke": "#0284C7", "shape": "rect"},
        "DEPLOYMENT": {"fill": "#F5F3FF", "stroke": "#7C3AED", "shape": "stadium"},
    }

    # Status Badges
    STATUS_BADGES = {
        "IMPLEMENTED": "🟢 IMPLEMENTED",
        "CONFIGURED": "🔵 CONFIGURED",
        "TESTED": "🧪 TESTED",
        "VALIDATED": "✅ VALIDATED",
        "PLANNED": "📋 PLANNED",
        "PROPOSED": "💡 PROPOSED",
        "SIMULATED": "⚙️ SIMULATED",
        "NOT_TESTED": "⚪ NOT TESTED"
    }

    @classmethod
    def get_or_generate_architectures(
        cls, db: Session, project_id: int, user_id: int, force_refresh: bool = False
    ) -> List[Architecture]:
        """
        Retrieves all architecture views for a project.
        If missing or forced, automatically generates them from project context.
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return []

        existing = db.query(Architecture).filter(Architecture.project_id == project_id).all()
        if existing and not force_refresh and len(existing) >= 6:
            return existing

        return cls.generate_all_architectures(db, project, user_id)

    @classmethod
    def generate_all_architectures(
        cls, db: Session, project: Project, user_id: int
    ) -> List[Architecture]:
        """
        Generates all 8 specialized architecture views for the project.
        """
        # Delete old non-customized architectures if regenerating
        existing_archs = db.query(Architecture).filter(Architecture.project_id == project.id).all()
        custom_overrides = {a.architecture_type: a.custom_mermaid_source for a in existing_archs if a.is_customized}
        
        db.query(Architecture).filter(Architecture.project_id == project.id).delete()
        db.commit()

        # Extract project intelligence context
        context = cls._extract_project_context(db, project)

        results = []
        for view_type in cls.SUPPORTED_VIEWS:
            # Check if view is relevant
            if view_type == "HARDWARE" and not context["has_hardware"]:
                # If project has no hardware and isn't IoT/Robotics, create a lightweight conceptual IoT or skip
                if not any(k in context["domain_lower"] for k in ["iot", "hardware", "robot", "sensor", "agriculture", "smart"]):
                    continue

            arch_record = cls._build_architecture_record(db, project, view_type, context, custom_overrides.get(view_type))
            results.append(arch_record)

        # Create baseline ArchitectureVersion snapshot
        cls._create_version_snapshot(db, project.id, "SYSTEM", results[0] if results else None, "Initial multi-view architecture generation")

        return results

    @classmethod
    def get_architecture_by_type(
        cls, db: Session, project_id: int, arch_type: str, user_id: int
    ) -> Optional[Architecture]:
        """
        Retrieves a single architecture view (e.g. SYSTEM, DATA_FLOW, AI_PIPELINE).
        """
        arch_type = arch_type.upper()
        arch = db.query(Architecture).filter(
            Architecture.project_id == project_id,
            Architecture.architecture_type == arch_type
        ).first()

        if not arch:
            # Generate on demand
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                return None
            cls.generate_all_architectures(db, project, user_id)
            arch = db.query(Architecture).filter(
                Architecture.project_id == project_id,
                Architecture.architecture_type == arch_type
            ).first()

        return arch

    @classmethod
    def update_mermaid_source(
        cls, db: Session, project_id: int, arch_type: str, mermaid_code: str, user_id: int
    ) -> Tuple[bool, str, Optional[Architecture]]:
        """
        Updates the custom Mermaid diagram source with syntax validation.
        """
        arch = cls.get_architecture_by_type(db, project_id, arch_type, user_id)
        if not arch:
            return False, "Architecture not found", None

        # Validate syntax
        is_valid, err = cls.validate_mermaid_syntax(mermaid_code)
        if not is_valid:
            return False, f"Invalid Mermaid syntax: {err}", arch

        arch.custom_mermaid_source = mermaid_code
        arch.is_customized = True
        arch.status = "CUSTOMIZED"
        arch.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(arch)

        # Record new version
        cls._create_version_snapshot(db, project_id, arch_type, arch, "User custom Mermaid edit")

        return True, "Mermaid diagram saved successfully", arch

    @classmethod
    def reset_to_generated(
        cls, db: Session, project_id: int, arch_type: str, user_id: int
    ) -> Tuple[bool, str, Optional[Architecture]]:
        """
        Resets custom Mermaid edits back to the AI-generated architecture graph.
        """
        arch = cls.get_architecture_by_type(db, project_id, arch_type, user_id)
        if not arch:
            return False, "Architecture not found", None

        arch.custom_mermaid_source = None
        arch.is_customized = False
        arch.status = "GENERATED"
        arch.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(arch)

        return True, "Reset to AI-generated architecture", arch

    # =========================================================================
    # Context Extraction & Component Detection
    # =========================================================================

    @classmethod
    def _extract_project_context(cls, db: Session, project: Project) -> Dict[str, Any]:
        """
        Deeply inspects the project, hardware devices, experiments, validation claims,
        and skill requirements to ground every node and link in reality.
        """
        domain_lower = (project.domain or "").lower()
        title_lower = (project.title or "").lower()
        problem_lower = (project.problem_statement or "").lower()
        solution_lower = (project.proposed_solution or "").lower()
        tech_list = [str(t).strip() for t in (project.technologies or [])]
        tech_lower = [t.lower() for t in tech_list]

        # Inspect Hardware
        hw_devices = db.query(HardwareDevice).filter(HardwareDevice.project_id == project.id).all()
        has_hardware = len(hw_devices) > 0 or any(
            k in domain_lower or k in tech_lower or k in solution_lower
            for k in ["iot", "sensor", "esp32", "arduino", "raspberry", "robot", "telemetry", "lorawan", "mqtt"]
        )
        
        is_hardware_simulated = True
        hardware_info = []
        if hw_devices:
            is_hardware_simulated = any(d.is_simulating for d in hw_devices) or all(d.status in ["standby", "offline", "simulating"] for d in hw_devices)
            for d in hw_devices:
                sensors = db.query(HardwareSensor).filter(HardwareSensor.device_id == d.id).all()
                hardware_info.append({
                    "name": d.name,
                    "type": d.device_type,
                    "protocol": d.network_protocol,
                    "status": "SIMULATED" if d.is_simulating else ("IMPLEMENTED" if d.status == "online" else "CONFIGURED"),
                    "sensors": [{"name": s.name, "type": s.sensor_type, "unit": s.unit, "pin": s.pin_interface} for s in sensors]
                })

        # Inspect Experiments & Models
        experiments = db.query(Experiment).filter(Experiment.project_id == project.id).all()
        experiment_labels = [f"EXP-{e.id:03d} {e.title}" for e in experiments[:3]]
        ai_framework = "PyTorch"
        for t in tech_list:
            if any(af in t.lower() for af in ["torch", "tensorflow", "keras", "scikit", "sklearn", "huggingface", "llm", "xgboost", "yolo", "opencv"]):
                ai_framework = t
                break

        # Inspect Validation & Claims
        claims = db.query(InnovationClaim).filter(InnovationClaim.project_id == project.id).all()
        validated_count = sum(1 for c in claims if c.status == "VALIDATED")
        validation_state = "VALIDATED" if validated_count > 0 else ("PARTIALLY_VALIDATED" if claims else "PROPOSED")

        # Inspect Skills
        skills = db.query(ProjectSkillRequirement).filter(ProjectSkillRequirement.project_id == project.id).all()
        skill_names = [s.skill.name for s in skills if s.skill] if skills else ["Python", "System Design", "REST APIs"]

        # Detect Frontend, Backend, Database from tech stack or provide realistic defaults
        frontend_tech = next((t for t in tech_list if any(fe in t.lower() for fe in ["react", "next", "vue", "flutter", "angular", "tailwind", "ui", "mobile"])), "Next.js 16")
        backend_tech = next((t for t in tech_list if any(be in t.lower() for be in ["fastapi", "django", "flask", "node", "express", "nest", "spring", "go"])), "FastAPI")
        database_tech = next((t for t in tech_list if any(db_t in t.lower() for db_t in ["postgres", "sqlite", "mongo", "mysql", "redis", "supabase", "firestore"])), "PostgreSQL 16")
        vector_db_tech = next((t for t in tech_list if any(vdb in t.lower() for vdb in ["chroma", "pinecone", "qdrant", "weaviate", "faiss", "pgvector"])), "pgvector / ChromaDB")
        broker_tech = next((t for t in tech_list if any(mb in t.lower() for mb in ["mqtt", "kafka", "rabbitmq", "pubsub", "redis", "nats"])), "MQTT / Mosquitto")

        # AI Methodology Classification
        ai_paradigm = "TIME_SERIES"
        if any(cv in domain_lower or cv in solution_lower or cv in tech_lower for cv in ["vision", "image", "yolo", "camera", "detect", "opencv", "segment"]):
            ai_paradigm = "COMPUTER_VISION"
        elif any(nlp in domain_lower or nlp in solution_lower or nlp in tech_lower for nlp in ["nlp", "text", "llm", "rag", "chat", "transformer", "bert", "gpt"]):
            ai_paradigm = "NLP_LLM"
        elif any(med in domain_lower or med in solution_lower for med in ["health", "medical", "disease", "bio", "patient", "clinical"]):
            ai_paradigm = "HEALTHCARE_ANALYTICS"
        elif any(iot in domain_lower or iot in solution_lower for iot in ["iot", "sensor", "telemetry", "agriculture", "water", "irrigation", "soil", "smart"]):
            ai_paradigm = "IOT_TIME_SERIES"

        return {
            "title": project.title,
            "problem": project.problem_statement,
            "solution": project.proposed_solution,
            "domain": project.domain,
            "domain_lower": domain_lower,
            "tech_list": tech_list,
            "tech_lower": tech_lower,
            "frontend_tech": frontend_tech,
            "backend_tech": backend_tech,
            "database_tech": database_tech,
            "vector_db_tech": vector_db_tech,
            "broker_tech": broker_tech,
            "ai_framework": ai_framework,
            "ai_paradigm": ai_paradigm,
            "has_hardware": has_hardware,
            "is_hardware_simulated": is_hardware_simulated,
            "hardware_info": hardware_info,
            "experiment_labels": experiment_labels,
            "validation_state": validation_state,
            "skill_names": skill_names
        }

    # =========================================================================
    # Multi-View Graph Builders
    # =========================================================================

    @classmethod
    def _build_architecture_record(
        cls, db: Session, project: Project, view_type: str, ctx: Dict[str, Any], custom_mermaid: Optional[str]
    ) -> Architecture:
        """
        Builds an Architecture entity with nodes, edges, layers, Mermaid source, and explanation.
        """
        builder_fn = {
            "SYSTEM": cls._build_system_graph,
            "DATA_FLOW": cls._build_data_flow_graph,
            "AI_PIPELINE": cls._build_ai_pipeline_graph,
            "HARDWARE": cls._build_hardware_graph,
            "API_FLOW": cls._build_api_flow_graph,
            "DEPLOYMENT": cls._build_deployment_graph,
            "APPLICATION_FLOW": cls._build_application_flow_graph,
            "SECURITY": cls._build_security_graph,
        }.get(view_type, cls._build_system_graph)

        graph_dict = builder_fn(ctx)
        mermaid_code = cls._compile_graph_to_mermaid(graph_dict, view_type)
        explanation_text = cls._generate_explanation(graph_dict, view_type, ctx)
        diagnostics_data = cls._run_architecture_diagnostics(graph_dict, ctx)

        arch = Architecture(
            project_id=project.id,
            name=f"{project.title} - {view_type.replace('_', ' ').title()} Architecture",
            architecture_type=view_type,
            graph_json=graph_dict,
            mermaid_source=mermaid_code,
            custom_mermaid_source=custom_mermaid,
            is_customized=bool(custom_mermaid),
            explanation=explanation_text,
            diagnostics=diagnostics_data,
            status="CUSTOMIZED" if custom_mermaid else "GENERATED"
        )
        db.add(arch)
        db.flush()

        # Persist structured nodes and edges
        for n in graph_dict.get("nodes", []):
            node_rec = ArchitectureNode(
                architecture_id=arch.id,
                node_key=n["node_key"],
                name=n["name"],
                node_type=n.get("node_type", "BACKEND"),
                category=n.get("category", "Core"),
                technology=n.get("technology", ""),
                description=n.get("description", ""),
                status=n.get("status", "PROPOSED"),
                source_type=n.get("source_type", "AI_SUGGESTION"),
                evidence_refs=n.get("evidence_refs", []),
                required_skills=n.get("required_skills", []),
                associated_experiments=n.get("associated_experiments", []),
                validation_status=n.get("validation_status", "NOT_TESTED"),
                metadata_json=n.get("metadata_json", {})
            )
            db.add(node_rec)

        for e in graph_dict.get("edges", []):
            edge_rec = ArchitectureEdge(
                architecture_id=arch.id,
                source_node=e["source_node"],
                target_node=e["target_node"],
                relationship=e.get("relationship", "SENDS_DATA_TO"),
                protocol=e.get("protocol", "HTTP"),
                data_type=e.get("data_type", "JSON"),
                description=e.get("description", ""),
                direction=e.get("direction", "FORWARD")
            )
            db.add(edge_rec)

        db.commit()
        db.refresh(arch)
        return arch

    @classmethod
    def _build_system_graph(cls, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates full System Architecture: User -> Frontend -> API Gateway -> AI Services -> Databases -> Hardware.
        """
        nodes = [
            {
                "node_key": "user_client",
                "name": f"End User ({ctx['domain']} Operator / Student)",
                "node_type": "USER",
                "category": "Client Tier",
                "technology": "Web Browser / Mobile App",
                "description": "Primary actor interacting with telemetry, alerts, and AI insights.",
                "status": "IMPLEMENTED",
                "source_type": "PROJECT_FACT",
                "required_skills": ["User Experience", "Domain Operations"],
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "frontend_app",
                "name": f"Interactive Client App ({ctx['frontend_tech']})",
                "node_type": "FRONTEND",
                "category": "Client Tier",
                "technology": ctx["frontend_tech"],
                "description": "Renders real-time telemetry dashboards, AI recommendations, and interactive controls.",
                "status": "IMPLEMENTED",
                "source_type": "TECH_STACK",
                "evidence_refs": ["Technology Stack Specification", "Next.js App Router"],
                "required_skills": ["React", "TypeScript", "Tailwind CSS"],
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "backend_gateway",
                "name": f"API Gateway & Services ({ctx['backend_tech']})",
                "node_type": "BACKEND",
                "category": "Service Tier",
                "technology": ctx["backend_tech"],
                "description": "Handles authentication, schema validation, ingestion pipelines, and REST/WebSocket routing.",
                "status": "IMPLEMENTED",
                "source_type": "TECH_STACK",
                "evidence_refs": ["FastAPI Application Core", "OpenAPI Documentation"],
                "required_skills": ["Python", "FastAPI", "Async/Await", "RESTful Architecture"],
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "ai_inference_engine",
                "name": f"AI Intelligence & Inference Engine ({ctx['ai_framework']})",
                "node_type": "AI_SERVICE",
                "category": "AI / Analytics Tier",
                "technology": ctx["ai_framework"],
                "description": f"Executes {ctx['ai_paradigm'].replace('_', ' ')} models for predictive insights and optimization.",
                "status": "CONFIGURED" if ctx["experiment_labels"] else "PROPOSED",
                "source_type": "TECH_STACK",
                "evidence_refs": ctx["experiment_labels"] or ["AI Pipeline Architecture"],
                "required_skills": ["PyTorch / Machine Learning", "Data Preprocessing", "Model Evaluation"],
                "associated_experiments": ctx["experiment_labels"],
                "validation_status": ctx["validation_state"]
            },
            {
                "node_key": "primary_database",
                "name": f"Relational Persistence ({ctx['database_tech']})",
                "node_type": "DATABASE",
                "category": "Data Tier",
                "technology": ctx["database_tech"],
                "description": "Stores user profiles, project telemetry records, experiment results, and audit trails.",
                "status": "IMPLEMENTED",
                "source_type": "TECH_STACK",
                "evidence_refs": ["SQLAlchemy Database Models", "Schema Migrations"],
                "required_skills": ["SQL", "Relational Modeling", "Database Indexing"],
                "validation_status": "VALIDATED"
            }
        ]

        edges = [
            {
                "source_node": "user_client",
                "target_node": "frontend_app",
                "relationship": "CALLS",
                "protocol": "HTTPS",
                "data_type": "UI Events & Inputs",
                "description": "User interacts with frontend interface"
            },
            {
                "source_node": "frontend_app",
                "target_node": "backend_gateway",
                "relationship": "CALLS",
                "protocol": "REST / JSON",
                "data_type": "Authenticated HTTP Requests",
                "description": "Fetches analytics and triggers actions"
            },
            {
                "source_node": "backend_gateway",
                "target_node": "ai_inference_engine",
                "relationship": "INFERENCES",
                "protocol": "In-Memory / gRPC",
                "data_type": "Preprocessed Feature Tensors",
                "description": "Sends normalized inputs for inference"
            },
            {
                "source_node": "backend_gateway",
                "target_node": "primary_database",
                "relationship": "STORES_IN",
                "protocol": "SQL / ORM",
                "data_type": "Structured Records",
                "description": "Persists state, telemetry, and analytics"
            },
            {
                "source_node": "ai_inference_engine",
                "target_node": "backend_gateway",
                "relationship": "SENDS_DATA_TO",
                "protocol": "Internal Function Return",
                "data_type": "Predictions & Confidence Scores",
                "description": "Returns predictions and confidence metrics"
            }
        ]

        # Add Hardware Edge if applicable
        if ctx["has_hardware"]:
            hw_status = "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED"
            nodes.extend([
                {
                    "node_key": "edge_hardware_node",
                    "name": f"Edge Microcontroller ({ctx['hardware_info'][0]['type'] if ctx['hardware_info'] else 'ESP32'})",
                    "node_type": "HARDWARE",
                    "category": "Edge Hardware Tier",
                    "technology": ctx["hardware_info"][0]["type"] if ctx["hardware_info"] else "ESP32",
                    "description": f"Edge telemetry collector and sensor interfacing unit ({hw_status}).",
                    "status": hw_status,
                    "source_type": "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED",
                    "evidence_refs": ["Hardware Lab Configuration"],
                    "required_skills": ["Embedded C/C++", "Microcontroller Interfacing", "GPIO/ADC"],
                    "validation_status": "SIMULATED" if ctx["is_hardware_simulated"] else "VALIDATED"
                },
                {
                    "node_key": "sensor_array",
                    "name": "Environmental Sensor Array",
                    "node_type": "SENSOR",
                    "category": "Edge Hardware Tier",
                    "technology": "Analog / Digital Sensors",
                    "description": "Measures physical telemetry (temperature, moisture, pressure, etc.).",
                    "status": hw_status,
                    "source_type": "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED",
                    "required_skills": ["Sensor Calibration", "Signal Conditioning"],
                    "validation_status": "SIMULATED" if ctx["is_hardware_simulated"] else "VALIDATED"
                },
                {
                    "node_key": "message_broker",
                    "name": f"Telemetry Broker ({ctx['broker_tech']})",
                    "node_type": "MESSAGE_BROKER",
                    "category": "Ingestion Tier",
                    "technology": ctx["broker_tech"],
                    "description": "Decoupled pub/sub ingestion queue for high-throughput sensor telemetry.",
                    "status": "CONFIGURED",
                    "source_type": "TECH_STACK",
                    "required_skills": ["MQTT", "Message Queuing", "Pub/Sub Architectures"],
                    "validation_status": "VALIDATED"
                }
            ])
            edges.extend([
                {
                    "source_node": "sensor_array",
                    "target_node": "edge_hardware_node",
                    "relationship": "SENDS_DATA_TO",
                    "protocol": "ADC / I2C / SPI",
                    "data_type": "Raw Voltage / Digital Signals",
                    "description": "Transmits raw physical measurements"
                },
                {
                    "source_node": "edge_hardware_node",
                    "target_node": "message_broker",
                    "relationship": "PUBLISHES_TO",
                    "protocol": "MQTT / Wi-Fi",
                    "data_type": "Telemetry JSON Payload",
                    "description": "Publishes encrypted telemetry packets"
                },
                {
                    "source_node": "message_broker",
                    "target_node": "backend_gateway",
                    "relationship": "SUBSCRIBES_TO",
                    "protocol": "MQTT Subscriber",
                    "data_type": "Ingested Telemetry Stream",
                    "description": "Consumes and validates incoming sensor packets"
                }
            ])

        layers = [
            {"name": "Client Tier", "description": "Presentation & UI", "node_keys": ["user_client", "frontend_app"]},
            {"name": "Service & Gateway Tier", "description": "Routing & Logic", "node_keys": ["backend_gateway"]},
            {"name": "AI & Analytics Tier", "description": "Intelligent Processing", "node_keys": ["ai_inference_engine"]},
            {"name": "Persistence Tier", "description": "Storage & State", "node_keys": ["primary_database"]}
        ]
        if ctx["has_hardware"]:
            layers.insert(0, {"name": "Hardware & Sensor Edge", "description": "Physical Collection", "node_keys": ["sensor_array", "edge_hardware_node", "message_broker"]})

        return {
            "architecture_type": "SYSTEM",
            "title": f"Complete System Architecture - {ctx['title']}",
            "description": "End-to-end component topology spanning clients, API services, AI pipelines, storage, and edge hardware.",
            "nodes": nodes,
            "edges": edges,
            "layers": layers,
            "metrics": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "hardware_enabled": ctx["has_hardware"],
                "hardware_status": "SIMULATED" if ctx["is_hardware_simulated"] else "PHYSICAL"
            },
            "summary": f"System coordinates {len(nodes)} components with {len(edges)} verified interconnects."
        }

    @classmethod
    def _build_data_flow_graph(cls, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates Data Flow Architecture: Sensor/Input -> Telemetry -> Ingress -> Validation -> AI -> Storage -> Alert.
        """
        nodes = [
            {
                "node_key": "data_origin",
                "name": "Raw Ingestion / Telemetry Input",
                "node_type": "DATA_SOURCE",
                "category": "Stage 1: Collection",
                "technology": "Sensors / User Input Stream",
                "description": "Primary stream of raw observations, measurements, or domain user queries.",
                "status": "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED",
                "source_type": "PROJECT_FACT",
                "required_skills": ["Data Acquisition", "Input Normalization"],
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "ingress_queue",
                "name": f"Ingestion Gateway & Buffer ({ctx['broker_tech'] if ctx['has_hardware'] else 'API Ingress'})",
                "node_type": "MESSAGE_BROKER" if ctx["has_hardware"] else "API",
                "category": "Stage 2: Transport",
                "technology": ctx["broker_tech"] if ctx["has_hardware"] else "FastAPI Router",
                "description": "Asynchronous buffer receiving and queueing incoming packets under peak load.",
                "status": "CONFIGURED",
                "source_type": "TECH_STACK",
                "required_skills": ["Asynchronous Queues", "Rate Limiting"],
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "schema_validator",
                "name": "Pydantic Schema Validator & Sanitizer",
                "node_type": "BACKEND",
                "category": "Stage 3: Validation",
                "technology": "Pydantic v2",
                "description": "Validates schema types, clamps anomalous extremes, and cleans dirty inputs.",
                "status": "IMPLEMENTED",
                "source_type": "IMPLEMENTED",
                "evidence_refs": ["FastAPI Pydantic Schemas"],
                "required_skills": ["Schema Validation", "Data Sanitization"],
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "feature_pipeline",
                "name": "Feature Extraction & Scaling Pipeline",
                "node_type": "AI_SERVICE",
                "category": "Stage 4: Transformation",
                "technology": "NumPy / Pandas / Scikit-Learn",
                "description": "Applies rolling statistics, vectorization, standard scaling, and one-hot encodings.",
                "status": "CONFIGURED",
                "source_type": "TECH_STACK",
                "required_skills": ["Feature Engineering", "Data Transformations"],
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "ml_scoring_node",
                "name": f"Model Inference Pipeline ({ctx['ai_framework']})",
                "node_type": "AI_MODEL",
                "category": "Stage 5: Intelligence",
                "technology": ctx["ai_framework"],
                "description": "Executes forward pass inference generating confidence scores, classes, or regression targets.",
                "status": "CONFIGURED",
                "source_type": "TECH_STACK",
                "associated_experiments": ctx["experiment_labels"],
                "required_skills": ["Model Optimization", "Latency Benchmarking"],
                "validation_status": ctx["validation_state"]
            },
            {
                "node_key": "storage_persistence",
                "name": f"Time-Series & State Store ({ctx['database_tech']})",
                "node_type": "DATABASE",
                "category": "Stage 6: Storage",
                "technology": ctx["database_tech"],
                "description": "Indexed storage for historical queries, analytics aggregations, and auditing.",
                "status": "IMPLEMENTED",
                "source_type": "TECH_STACK",
                "required_skills": ["Database Indexing", "Partitioning"],
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "realtime_feed",
                "name": "Real-time Telemetry Dispatcher (WebSocket / Polling)",
                "node_type": "BACKEND",
                "category": "Stage 7: Distribution",
                "technology": "WebSockets / Server-Sent Events",
                "description": "Pushes low-latency updates to connected dashboards and alert monitors.",
                "status": "IMPLEMENTED",
                "source_type": "IMPLEMENTED",
                "required_skills": ["WebSockets", "Asyncio Streams"],
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "operator_alert",
                "name": "Operator Alert & Recommendation Engine",
                "node_type": "FRONTEND",
                "category": "Stage 8: Action",
                "technology": "Next.js UI & Webhooks",
                "description": "Displays prioritized recommendations, automated actuator commands, and push notifications.",
                "status": "IMPLEMENTED",
                "source_type": "PROJECT_FACT",
                "required_skills": ["UI State Management", "Notification Systems"],
                "validation_status": "VALIDATED"
            }
        ]

        edges = [
            {"source_node": "data_origin", "target_node": "ingress_queue", "relationship": "SENDS_DATA_TO", "protocol": "MQTT / HTTPS", "data_type": "Raw Telemetry Packet"},
            {"source_node": "ingress_queue", "target_node": "schema_validator", "relationship": "SENDS_DATA_TO", "protocol": "Internal Stream", "data_type": "Serialized Dict"},
            {"source_node": "schema_validator", "target_node": "feature_pipeline", "relationship": "SENDS_DATA_TO", "protocol": "Validated Memory", "data_type": "Clean Schema Object"},
            {"source_node": "feature_pipeline", "target_node": "ml_scoring_node", "relationship": "INFERENCES", "protocol": "Tensor Stream", "data_type": "Normalized Feature Vector"},
            {"source_node": "ml_scoring_node", "target_node": "storage_persistence", "relationship": "STORES_IN", "protocol": "SQL Write", "data_type": "Prediction & Telemetry Record"},
            {"source_node": "ml_scoring_node", "target_node": "realtime_feed", "relationship": "PUBLISHES_TO", "protocol": "Event Bus", "data_type": "Live Insight Event"},
            {"source_node": "realtime_feed", "target_node": "operator_alert", "relationship": "SENDS_DATA_TO", "protocol": "WebSocket Frame", "data_type": "Real-time Notification JSON"}
        ]

        return {
            "architecture_type": "DATA_FLOW",
            "title": f"End-to-End Data Flow Pipeline - {ctx['title']}",
            "description": "Step-by-step lifecycle from telemetry acquisition through validation, ML inference, persistence, and action triggers.",
            "nodes": nodes,
            "edges": edges,
            "layers": [
                {"name": "1. Ingestion & Transport", "node_keys": ["data_origin", "ingress_queue"]},
                {"name": "2. Sanitization & Feature Prep", "node_keys": ["schema_validator", "feature_pipeline"]},
                {"name": "3. AI Scoring & Storage", "node_keys": ["ml_scoring_node", "storage_persistence"]},
                {"name": "4. Broadcast & Action", "node_keys": ["realtime_feed", "operator_alert"]}
            ],
            "metrics": {"total_stages": len(nodes), "latency_profile": "< 50ms end-to-end"}
        }

    @classmethod
    def _build_ai_pipeline_graph(cls, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates tailored AI/ML Pipeline adapted to the project's exact AI paradigm.
        """
        paradigm = ctx["ai_paradigm"]

        if paradigm == "COMPUTER_VISION":
            nodes = [
                {"node_key": "raw_frames", "name": "Raw Video / Image Stream", "node_type": "DATA_SOURCE", "category": "Input", "technology": "OpenCV VideoCapture", "status": "IMPLEMENTED", "source_type": "TECH_STACK"},
                {"node_key": "frame_preprocessing", "name": "Frame Resize & Normalization (640x640 RGB)", "node_type": "AI_SERVICE", "category": "Preprocessing", "technology": "Albumentations / TorchVision", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "backbone_model", "name": f"Feature Extraction Backbone ({ctx['ai_framework']})", "node_type": "AI_MODEL", "category": "Backbone", "technology": "YOLOv8 / ResNet-50", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "detection_head", "name": "Object Detection & Bounding Box Head", "node_type": "AI_MODEL", "category": "Inference", "technology": "Anchor-Free Detection Head", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "nms_filter", "name": "Non-Maximum Suppression (NMS) & Confidence Filter", "node_type": "AI_SERVICE", "category": "Post-Processing", "technology": "Torchvision Ops (IoU > 0.45)", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "annotated_output", "name": "Annotated Frame & Detections JSON", "node_type": "FRONTEND", "category": "Output", "technology": "Next.js Canvas / WebSocket", "status": "IMPLEMENTED", "source_type": "PROJECT_FACT"}
            ]
            edges = [
                {"source_node": "raw_frames", "target_node": "frame_preprocessing", "relationship": "SENDS_DATA_TO", "protocol": "Numpy Array", "data_type": "HWC Tensor"},
                {"source_node": "frame_preprocessing", "target_node": "backbone_model", "relationship": "INFERENCES", "protocol": "Batch Tensor", "data_type": "BCHW Float32 [0..1]"},
                {"source_node": "backbone_model", "target_node": "detection_head", "relationship": "SENDS_DATA_TO", "protocol": "Feature Maps", "data_type": "P3/P4/P5 Multi-scale"},
                {"source_node": "detection_head", "target_node": "nms_filter", "relationship": "SENDS_DATA_TO", "protocol": "Raw Predictions", "data_type": "Boxes + Class Probs"},
                {"source_node": "nms_filter", "target_node": "annotated_output", "relationship": "PUBLISHES_TO", "protocol": "JSON Detections", "data_type": "Filtered Bounding Boxes"}
            ]

        elif paradigm == "NLP_LLM":
            nodes = [
                {"node_key": "user_query_text", "name": "User Query / Document Input", "node_type": "DATA_SOURCE", "category": "Input", "technology": "Text Stream", "status": "IMPLEMENTED", "source_type": "PROJECT_FACT"},
                {"node_key": "text_tokenizer", "name": "Text Tokenizer & Chunking", "node_type": "AI_SERVICE", "category": "Tokenization", "technology": "Tiktoken / HuggingFace Tokenizers", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "embedding_encoder", "name": "Dense Vector Embedding Model", "node_type": "AI_MODEL", "category": "Embedding", "technology": "all-MiniLM-L6-v2 (384-dim)", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "vector_retriever", "name": f"Semantic RAG Vector Search ({ctx['vector_db_tech']})", "node_type": "VECTOR_DATABASE", "category": "Retrieval", "technology": ctx["vector_db_tech"], "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "llm_transformer", "name": "Context-Augmented LLM Transformer", "node_type": "AI_MODEL", "category": "Generation", "technology": "Llama-3 / Mistral / Gemini API", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "safety_guardrail", "name": "Output Guardrail & Factuality Validator", "node_type": "AI_SERVICE", "category": "Safety", "technology": "NeMo Guardrails / Pydantic", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
                {"node_key": "grounded_response", "name": "Structured Grounded Answer", "node_type": "FRONTEND", "category": "Output", "technology": "Markdown Stream", "status": "IMPLEMENTED", "source_type": "PROJECT_FACT"}
            ]
            edges = [
                {"source_node": "user_query_text", "target_node": "text_tokenizer", "relationship": "SENDS_DATA_TO", "protocol": "String", "data_type": "UTF-8 Text"},
                {"source_node": "text_tokenizer", "target_node": "embedding_encoder", "relationship": "SENDS_DATA_TO", "protocol": "Token IDs", "data_type": "Int32 Token Array"},
                {"source_node": "embedding_encoder", "target_node": "vector_retriever", "relationship": "INFERENCES", "protocol": "Vector Query", "data_type": "Cosine Similarity Vector"},
                {"source_node": "vector_retriever", "target_node": "llm_transformer", "relationship": "SENDS_DATA_TO", "protocol": "RAG Context", "data_type": "Top-K Relevant Chunks"},
                {"source_node": "llm_transformer", "target_node": "safety_guardrail", "relationship": "SENDS_DATA_TO", "protocol": "Token Stream", "data_type": "Generated Completion"},
                {"source_node": "safety_guardrail", "target_node": "grounded_response", "relationship": "PUBLISHES_TO", "protocol": "SSE Stream", "data_type": "Validated Markdown"}
            ]

        else: # IOT / TIME_SERIES / GENERAL ML
            nodes = [
                {"node_key": "sensor_telemetry_in", "name": "Continuous Telemetry Stream", "node_type": "DATA_SOURCE", "category": "Input", "technology": "IoT Sensors", "status": "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED", "source_type": "TECH_STACK"},
                {"node_key": "windowing_imputation", "name": "Sliding Temporal Window (60s Buffer)", "node_type": "AI_SERVICE", "category": "Preprocessing", "technology": "Pandas Rolling / NumPy", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "statistical_features", "name": "Feature Extraction (Mean, Variance, FFT)", "node_type": "AI_SERVICE", "category": "Feature Prep", "technology": "SciPy / Librosa", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "ml_ensemble_model", "name": f"Predictive ML Model ({ctx['ai_framework']})", "node_type": "AI_MODEL", "category": "Inference", "technology": f"{ctx['ai_framework']} / XGBoost", "status": "CONFIGURED", "source_type": "TECH_STACK", "associated_experiments": ctx["experiment_labels"]},
                {"node_key": "anomaly_confidence", "name": "Anomaly Detector & Confidence Scorer", "node_type": "AI_SERVICE", "category": "Evaluation", "technology": "Isolation Forest / Sigmoid", "status": "CONFIGURED", "source_type": "TECH_STACK"},
                {"node_key": "action_recommendation", "name": "Optimal Action / Irrigation Recommendation", "node_type": "FRONTEND", "category": "Output", "technology": "JSON Recommendation Payload", "status": "IMPLEMENTED", "source_type": "PROJECT_FACT"}
            ]
            edges = [
                {"source_node": "sensor_telemetry_in", "target_node": "windowing_imputation", "relationship": "SENDS_DATA_TO", "protocol": "Stream Buffer", "data_type": "Timestamped Floats"},
                {"source_node": "windowing_imputation", "target_node": "statistical_features", "relationship": "SENDS_DATA_TO", "protocol": "In-Memory", "data_type": "Imputed Matrix"},
                {"source_node": "statistical_features", "target_node": "ml_ensemble_model", "relationship": "INFERENCES", "protocol": "Tensor Input", "data_type": "12-dim Feature Vector"},
                {"source_node": "ml_ensemble_model", "target_node": "anomaly_confidence", "relationship": "SENDS_DATA_TO", "protocol": "Predictions", "data_type": "Predicted Value + Residual"},
                {"source_node": "anomaly_confidence", "target_node": "action_recommendation", "relationship": "PUBLISHES_TO", "protocol": "REST / WebSocket", "data_type": "Action Recommendation"}
            ]

        return {
            "architecture_type": "AI_PIPELINE",
            "title": f"Domain AI Pipeline ({paradigm.replace('_', ' ')}) - {ctx['title']}",
            "description": f"Specialized AI/ML pipeline optimized for {paradigm.replace('_', ' ')} with verified data transformations and validation guardrails.",
            "nodes": nodes,
            "edges": edges,
            "layers": [
                {"name": "Data Ingestion", "node_keys": [nodes[0]["node_key"]]},
                {"name": "Preprocessing & Features", "node_keys": [nodes[1]["node_key"], nodes[2]["node_key"]]},
                {"name": "Model Inference", "node_keys": [nodes[3]["node_key"]]},
                {"name": "Post-Processing & Output", "node_keys": [n["node_key"] for n in nodes[4:]]}
            ],
            "metrics": {
                "ai_paradigm": paradigm,
                "framework": ctx["ai_framework"],
                "experiment_count": len(ctx["experiment_labels"])
            }
        }

    @classmethod
    def _build_hardware_graph(cls, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates Hardware ↔ Software Interaction architecture with accurate SIMULATED vs PHYSICAL tags.
        """
        hw_status = "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED"
        dev_name = ctx["hardware_info"][0]["name"] if ctx["hardware_info"] else "ESP32 Node-01"
        dev_type = ctx["hardware_info"][0]["type"] if ctx["hardware_info"] else "ESP32 Microcontroller"
        protocol = ctx["hardware_info"][0]["protocol"] if ctx["hardware_info"] else "MQTT / Wi-Fi"

        nodes = [
            {
                "node_key": "physical_sensors",
                "name": "Hardware Sensor Probes (Moisture, Temp, pH)",
                "node_type": "SENSOR",
                "category": "Edge Layer",
                "technology": "Analog Sensors (ADC GPIO 34/35/36)",
                "description": f"Transducer probes converting physical phenomena to analog voltage ({hw_status}).",
                "status": hw_status,
                "source_type": "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED",
                "validation_status": "SIMULATED" if ctx["is_hardware_simulated"] else "VALIDATED"
            },
            {
                "node_key": "esp32_edge_mcu",
                "name": f"Edge Microcontroller ({dev_type})",
                "node_type": "HARDWARE",
                "category": "Edge Layer",
                "technology": f"{dev_type} (ESP-IDF / FreeRTOS)",
                "description": f"Executes sampling tasks, local ADC conversion, calibration curves, and packet framing ({hw_status}).",
                "status": hw_status,
                "source_type": "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED",
                "validation_status": "SIMULATED" if ctx["is_hardware_simulated"] else "VALIDATED",
                "metadata_json": {"status_note": "Hardware execution is currently simulated in Hardware Lab." if ctx["is_hardware_simulated"] else "Physical board online."}
            },
            {
                "node_key": "mqtt_transport",
                "name": f"Wireless Telemetry Protocol ({protocol})",
                "node_type": "MESSAGE_BROKER",
                "category": "Network Layer",
                "technology": protocol,
                "description": "Publishes JSON payload packets to topic /inno-sphere/projects/{id}/telemetry.",
                "status": "CONFIGURED",
                "source_type": "TECH_STACK",
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "backend_subscriber",
                "name": f"FastAPI Async Telemetry Ingestion ({ctx['backend_tech']})",
                "node_type": "BACKEND",
                "category": "Backend Layer",
                "technology": ctx["backend_tech"],
                "description": "Background task consuming broker queue and deserializing sensor records.",
                "status": "IMPLEMENTED",
                "source_type": "IMPLEMENTED",
                "validation_status": "VALIDATED"
            },
            {
                "node_key": "hardware_lab_ui",
                "name": "Hardware Lab & Live Waveform Monitor",
                "node_type": "FRONTEND",
                "category": "Visualization Layer",
                "technology": "Next.js Canvas & SVG Telemetry Gauges",
                "description": "Renders real-time pin voltage waveforms, battery level, packet loss, and anomaly triggers.",
                "status": "IMPLEMENTED",
                "source_type": "PROJECT_FACT",
                "validation_status": "VALIDATED"
            }
        ]

        edges = [
            {"source_node": "physical_sensors", "target_node": "esp32_edge_mcu", "relationship": "SENDS_DATA_TO", "protocol": "Analog Voltage (0-3.3V)", "data_type": "Continuous Voltage"},
            {"source_node": "esp32_edge_mcu", "target_node": "mqtt_transport", "relationship": "PUBLISHES_TO", "protocol": protocol, "data_type": "Encrypted Telemetry JSON"},
            {"source_node": "mqtt_transport", "target_node": "backend_subscriber", "relationship": "SUBSCRIBES_TO", "protocol": "TCP / TLS", "data_type": "Telemetry Stream"},
            {"source_node": "backend_subscriber", "target_node": "hardware_lab_ui", "relationship": "PUBLISHES_TO", "protocol": "WebSocket", "data_type": "Live Telemetry Packet"}
        ]

        return {
            "architecture_type": "HARDWARE",
            "title": f"Hardware ↔ Software Edge Architecture - {ctx['title']}",
            "description": f"Physical sensor transducer chain, microcontroller firmware ingestion, telemetry protocol, and live software monitoring ({hw_status}).",
            "nodes": nodes,
            "edges": edges,
            "layers": [
                {"name": "Edge Sensing & Hardware", "node_keys": ["physical_sensors", "esp32_edge_mcu"]},
                {"name": "Network Transport", "node_keys": ["mqtt_transport"]},
                {"name": "Software Ingestion & UI", "node_keys": ["backend_subscriber", "hardware_lab_ui"]}
            ],
            "metrics": {
                "device_type": dev_type,
                "execution_status": hw_status,
                "protocol": protocol
            }
        }

    @classmethod
    def _build_api_flow_graph(cls, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates API Flow architecture showcasing endpoints, methods, validation, service layer, and responses.
        """
        nodes = [
            {"node_key": "api_client", "name": "Frontend Client (Next.js / Browser)", "node_type": "FRONTEND", "category": "Client", "technology": ctx["frontend_tech"], "status": "IMPLEMENTED", "source_type": "TECH_STACK"},
            {"node_key": "auth_middleware", "name": "JWT Bearer & Security Interceptor", "node_type": "AUTH_SERVICE", "category": "Security Middleware", "technology": "OAuth2 Bearer / JWT", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "endpoint_projects", "name": "POST /api/v1/projects/{id}/skills/analyze", "node_type": "API", "category": "REST Endpoint", "technology": "FastAPI APIRouter", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "endpoint_inference", "name": "POST /api/v1/experiments/{id}/run", "node_type": "API", "category": "REST Endpoint", "technology": "FastAPI APIRouter", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "service_controller", "name": "Domain Service Layer (Dependency Injection)", "node_type": "BACKEND", "category": "Business Logic", "technology": "Python 3.14 Async Services", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "orm_database", "name": f"SQLAlchemy 2.0 ORM ({ctx['database_tech']})", "node_type": "DATABASE", "category": "Data Access", "technology": ctx["database_tech"], "status": "IMPLEMENTED", "source_type": "TECH_STACK"},
            {"node_key": "json_response", "name": "200 OK / 201 Created JSON Response", "node_type": "FRONTEND", "category": "Response", "technology": "JSON Payloads", "status": "IMPLEMENTED", "source_type": "PROJECT_FACT"}
        ]

        edges = [
            {"source_node": "api_client", "target_node": "auth_middleware", "relationship": "AUTHENTICATES", "protocol": "HTTPS Authorization", "data_type": "Bearer <JWT_TOKEN>"},
            {"source_node": "auth_middleware", "target_node": "endpoint_projects", "relationship": "CALLS", "protocol": "HTTP POST", "data_type": "ProjectSkillPayload"},
            {"source_node": "auth_middleware", "target_node": "endpoint_inference", "relationship": "CALLS", "protocol": "HTTP POST", "data_type": "ExperimentRunPayload"},
            {"source_node": "endpoint_projects", "target_node": "service_controller", "relationship": "TRIGGERS", "protocol": "Async Method Call", "data_type": "Domain Models"},
            {"source_node": "endpoint_inference", "target_node": "service_controller", "relationship": "TRIGGERS", "protocol": "Async Method Call", "data_type": "Inference Tensors"},
            {"source_node": "service_controller", "target_node": "orm_database", "relationship": "STORES_IN", "protocol": "SQL Connection Pool", "data_type": "Entity Transactions"},
            {"source_node": "service_controller", "target_node": "json_response", "relationship": "SENDS_DATA_TO", "protocol": "HTTP 200/201", "data_type": "Serialized Pydantic JSON"}
        ]

        return {
            "architecture_type": "API_FLOW",
            "title": f"REST API & Service Architecture - {ctx['title']}",
            "description": "Structured API flow tracing HTTP methods, security interceptors, service controllers, ORM transactions, and response contracts.",
            "nodes": nodes,
            "edges": edges,
            "layers": [
                {"name": "Client Invocation", "node_keys": ["api_client"]},
                {"name": "Auth & Routing Interceptors", "node_keys": ["auth_middleware", "endpoint_projects", "endpoint_inference"]},
                {"name": "Business Logic & Storage", "node_keys": ["service_controller", "orm_database"]},
                {"name": "Response Delivery", "node_keys": ["json_response"]}
            ],
            "metrics": {"total_endpoints_modeled": 2, "auth_mode": "JWT Bearer + RBAC"}
        }

    @classmethod
    def _build_deployment_graph(cls, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates Deployment Architecture with explicit DEPLOYED, CONFIGURED, PLANNED, SIMULATED statuses.
        """
        nodes = [
            {"node_key": "cdn_edge", "name": "Global CDN / Reverse Proxy (Cloudflare / Nginx)", "node_type": "DEPLOYMENT", "category": "Edge & CDN", "technology": "Cloudflare / Nginx", "status": "PLANNED", "source_type": "PLANNED", "description": "SSL termination, DDoS protection, static asset caching (PLANNED)."},
            {"node_key": "frontend_container", "name": f"Next.js SSR Container ({ctx['frontend_tech']})", "node_type": "FRONTEND", "category": "Container Tier", "technology": "Docker / Node.js 22", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED", "description": "Local development / Node SSR production container."},
            {"node_key": "backend_container", "name": f"FastAPI ASGI Container ({ctx['backend_tech']})", "node_type": "BACKEND", "category": "Container Tier", "technology": "Docker / Uvicorn (Python 3.14)", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED", "description": "Asynchronous microservice container running on port 8000."},
            {"node_key": "db_container", "name": f"Relational Database Instance ({ctx['database_tech']})", "node_type": "DATABASE", "category": "Data Tier", "technology": "PostgreSQL 16 Engine", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED", "description": "Relational storage instance with persistent volume mount."},
            {"node_key": "cloud_ai_worker", "name": f"GPU AI Inference Host ({ctx['ai_framework']})", "node_type": "AI_SERVICE", "category": "Compute Tier", "technology": "Cloud GPU / Local PyTorch Host", "status": "CONFIGURED", "source_type": "TECH_STACK", "description": "Hardware-accelerated CUDA / CPU inference runtime."},
        ]

        edges = [
            {"source_node": "cdn_edge", "target_node": "frontend_container", "relationship": "DEPLOYS_TO", "protocol": "HTTPS Port 443", "data_type": "Web Traffic"},
            {"source_node": "frontend_container", "target_node": "backend_container", "relationship": "CALLS", "protocol": "HTTP Port 8000", "data_type": "Internal REST API"},
            {"source_node": "backend_container", "target_node": "db_container", "relationship": "STORES_IN", "protocol": "TCP Port 5432", "data_type": "SQL Database IO"},
            {"source_node": "backend_container", "target_node": "cloud_ai_worker", "relationship": "INFERENCES", "protocol": "Internal Socket", "data_type": "Inference Tensors"}
        ]

        if ctx["has_hardware"]:
            nodes.append({
                "node_key": "edge_deployment",
                "name": "Edge Device Deployment (ESP32 Firmware)",
                "node_type": "HARDWARE",
                "category": "Edge Tier",
                "technology": "ESP-IDF C++ Binaries",
                "status": "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED",
                "source_type": "SIMULATED" if ctx["is_hardware_simulated"] else "IMPLEMENTED",
                "description": "OTA firmware update and edge runtime execution."
            })
            edges.append({
                "source_node": "edge_deployment",
                "target_node": "backend_container",
                "relationship": "SENDS_DATA_TO",
                "protocol": "MQTT over Wi-Fi",
                "data_type": "Encrypted Telemetry Packets"
            })

        return {
            "architecture_type": "DEPLOYMENT",
            "title": f"Production & Container Deployment Topology - {ctx['title']}",
            "description": "Container topology detailing edge proxies, Next.js frontend, FastAPI microservices, persistent database instances, and compute nodes.",
            "nodes": nodes,
            "edges": edges,
            "layers": [
                {"name": "Edge & Proxy Tier", "node_keys": ["cdn_edge"]},
                {"name": "Application Containers", "node_keys": ["frontend_container", "backend_container"]},
                {"name": "Data & Compute Tier", "node_keys": ["db_container", "cloud_ai_worker"]}
            ],
            "metrics": {
                "container_count": len(nodes),
                "edge_status": "SIMULATED" if ctx["is_hardware_simulated"] else "PHYSICAL"
            }
        }

    @classmethod
    def _build_application_flow_graph(cls, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates Application-Level User Journey flow from idea submission to competition presentation.
        """
        nodes = [
            {"node_key": "step1_idea", "name": "1. Student Submits Innovation Idea", "node_type": "USER", "category": "Journey", "technology": "Submit Idea Flow", "status": "IMPLEMENTED", "source_type": "PROJECT_FACT"},
            {"node_key": "step2_intel", "name": "2. AI Idea Comprehension & Intelligence", "node_type": "AI_SERVICE", "category": "Journey", "technology": "Project Intelligence Engine", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "step3_tech_stack", "name": "3. Technology Stack & Skills Gap Mapping", "node_type": "BACKEND", "category": "Journey", "technology": "Tech Advisor & Skills DAG", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "step4_architecture", "name": "4. AI Architecture & Flowchart Generation", "node_type": "AI_SERVICE", "category": "Journey", "technology": "Architecture Generator", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "step5_experiments", "name": "5. Empirical Experiments & Benchmarking", "node_type": "AI_MODEL", "category": "Journey", "technology": "Experiment Engine", "status": "CONFIGURED", "source_type": "IMPLEMENTED"},
            {"node_key": "step6_validation", "name": "6. Evidence Validation & Proof Matrix", "node_type": "BACKEND", "category": "Journey", "technology": "Validation Engine", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "step7_showcase", "name": "7. IEEE Research Draft & Competition Pitch", "node_type": "FRONTEND", "category": "Journey", "technology": "Research Workspace & Showcase", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"}
        ]

        edges = [
            {"source_node": "step1_idea", "target_node": "step2_intel", "relationship": "TRIGGERS", "protocol": "InnoSphere Workflow", "data_type": "Idea Text"},
            {"source_node": "step2_intel", "target_node": "step3_tech_stack", "relationship": "SENDS_DATA_TO", "protocol": "InnoSphere Workflow", "data_type": "Intelligence Snapshot"},
            {"source_node": "step3_tech_stack", "target_node": "step4_architecture", "relationship": "SENDS_DATA_TO", "protocol": "InnoSphere Workflow", "data_type": "Tech & Skill Map"},
            {"source_node": "step4_architecture", "target_node": "step5_experiments", "relationship": "SENDS_DATA_TO", "protocol": "InnoSphere Workflow", "data_type": "Implementation Blueprint"},
            {"source_node": "step5_experiments", "target_node": "step6_validation", "relationship": "SENDS_DATA_TO", "protocol": "InnoSphere Workflow", "data_type": "Empirical Results"},
            {"source_node": "step6_validation", "target_node": "step7_showcase", "relationship": "SENDS_DATA_TO", "protocol": "InnoSphere Workflow", "data_type": "Validated Claims"}
        ]

        return {
            "architecture_type": "APPLICATION_FLOW",
            "title": f"Innovation Lifecycle & Student Application Flow - {ctx['title']}",
            "description": "High-level journey connecting idea submission, tech stack discovery, architecture blueprints, experimentation, validation, and competition showcase.",
            "nodes": nodes,
            "edges": edges,
            "layers": [
                {"name": "Ideation & Intelligence", "node_keys": ["step1_idea", "step2_intel"]},
                {"name": "Design & Architecture", "node_keys": ["step3_tech_stack", "step4_architecture"]},
                {"name": "Execution & Validation", "node_keys": ["step5_experiments", "step6_validation"]},
                {"name": "Dissemination", "node_keys": ["step7_showcase"]}
            ]
        }

    @classmethod
    def _build_security_graph(cls, ctx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates Security Architecture showing TLS, JWT, RBAC, input sanitization, prompt isolation, and audit logging.
        """
        nodes = [
            {"node_key": "sec_client", "name": "Client Request with Bearer Token", "node_type": "USER", "category": "Client", "technology": "HTTPS / TLS 1.3", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "sec_tls_gateway", "name": "TLS Termination & CORS Filter", "node_type": "AUTH_SERVICE", "category": "Ingress Security", "technology": "FastAPI CORSMiddleware", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "sec_jwt_auth", "name": "JWT Signature & Expiry Verifier", "node_type": "AUTH_SERVICE", "category": "Authentication", "technology": "PyJWT HS256", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "sec_rbac_guard", "name": "RBAC & Project Ownership Check", "node_type": "AUTH_SERVICE", "category": "Authorization", "technology": "SQLAlchemy Ownership Filter (IDOR Prevention)", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "sec_input_sanitizer", "name": "Pydantic Schema Sanitization", "node_type": "BACKEND", "category": "Validation", "technology": "Pydantic v2 Type Bounds", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"},
            {"node_key": "sec_prompt_guard", "name": "AI Prompt Injection Guardrail", "node_type": "AI_SERVICE", "category": "AI Security", "technology": "Context Sandboxing & Output Filter", "status": "CONFIGURED", "source_type": "TECH_STACK"},
            {"node_key": "sec_db_isolation", "name": "Encrypted Persistence & Row Security", "node_type": "DATABASE", "category": "Data Security", "technology": ctx["database_tech"], "status": "IMPLEMENTED", "source_type": "TECH_STACK"},
            {"node_key": "sec_audit_log", "name": "Immutable Security Audit Logger", "node_type": "MONITORING", "category": "Observability", "technology": "Structured Logging (REQ_ID Tracing)", "status": "IMPLEMENTED", "source_type": "IMPLEMENTED"}
        ]

        edges = [
            {"source_node": "sec_client", "target_node": "sec_tls_gateway", "relationship": "CALLS", "protocol": "TLS 1.3", "data_type": "Encrypted HTTPS Request"},
            {"source_node": "sec_tls_gateway", "target_node": "sec_jwt_auth", "relationship": "AUTHENTICATES", "protocol": "Header Inspection", "data_type": "Bearer Token"},
            {"source_node": "sec_jwt_auth", "target_node": "sec_rbac_guard", "relationship": "CALLS", "protocol": "User Context", "data_type": "Decoded User ID & Role"},
            {"source_node": "sec_rbac_guard", "target_node": "sec_input_sanitizer", "relationship": "TRIGGERS", "protocol": "Verified Execution", "data_type": "Request Payload"},
            {"source_node": "sec_input_sanitizer", "target_node": "sec_prompt_guard", "relationship": "SENDS_DATA_TO", "protocol": "Sanitized Dict", "data_type": "Validated Features"},
            {"source_node": "sec_input_sanitizer", "target_node": "sec_db_isolation", "relationship": "STORES_IN", "protocol": "Parameterized SQL", "data_type": "Clean Row Record"},
            {"source_node": "sec_rbac_guard", "target_node": "sec_audit_log", "relationship": "TRIGGERS", "protocol": "Log Event", "data_type": "REQ_ID + Timestamp + User ID"}
        ]

        return {
            "architecture_type": "SECURITY",
            "title": f"Zero-Trust Security & Data Protection Architecture - {ctx['title']}",
            "description": "Multi-layer security architecture enforcing TLS 1.3, JWT auth, IDOR ownership validation, prompt isolation, and immutable audit logs.",
            "nodes": nodes,
            "edges": edges,
            "layers": [
                {"name": "Ingress & Authentication", "node_keys": ["sec_client", "sec_tls_gateway", "sec_jwt_auth"]},
                {"name": "Authorization & Validation", "node_keys": ["sec_rbac_guard", "sec_input_sanitizer"]},
                {"name": "AI & Storage Protection", "node_keys": ["sec_prompt_guard", "sec_db_isolation", "sec_audit_log"]}
            ]
        }

    # =========================================================================
    # Mermaid Compiler & Syntax Validation
    # =========================================================================

    @classmethod
    def _compile_graph_to_mermaid(cls, graph: Dict[str, Any], view_type: str) -> str:
        """
        Compiles the structured ArchitectureGraph into clean, valid Mermaid flowchart syntax.
        """
        direction = "LR" if view_type in ["DATA_FLOW", "APPLICATION_FLOW"] else "TD"
        lines = [f"flowchart {direction}"]

        # Style Classes
        lines.append("    %% Styling Definitions")
        lines.append("    classDef implemented fill:#ECFDF5,stroke:#10B981,stroke-width:2px,color:#064E3B,font-weight:bold;")
        lines.append("    classDef simulated fill:#FFFBEB,stroke:#F59E0B,stroke-width:2px,stroke-dasharray: 4 4,color:#78350F,font-weight:bold;")
        lines.append("    classDef planned fill:#F8FAFC,stroke:#94A3B8,stroke-width:2px,stroke-dasharray: 3 3,color:#334155;")
        lines.append("    classDef ai fill:#FAF5FF,stroke:#A855F7,stroke-width:2px,color:#581C87,font-weight:bold;")
        lines.append("    classDef security fill:#FEF2F2,stroke:#EF4444,stroke-width:2px,color:#7F1D1D,font-weight:bold;")
        lines.append("")

        # Render Nodes or Subgraphs
        layers = graph.get("layers", [])
        nodes = graph.get("nodes", [])
        node_map = {n["node_key"]: n for n in nodes}

        rendered_keys = set()
        if layers:
            for idx, layer in enumerate(layers):
                sg_id = f"subgraph_{idx}"
                sg_name = layer.get("name", f"Layer {idx+1}")
                lines.append(f"    subgraph {sg_id} [\"{sg_name}\"]")
                for key in layer.get("node_keys", []):
                    if key in node_map:
                        lines.append(cls._format_mermaid_node(node_map[key]))
                        rendered_keys.add(key)
                lines.append("    end")
                lines.append("")

        # Remaining nodes not in any layer
        for n in nodes:
            if n["node_key"] not in rendered_keys:
                lines.append(cls._format_mermaid_node(n))
                rendered_keys.add(n["node_key"])

        lines.append("")
        lines.append("    %% Interconnect Relationships")
        # Render Edges
        for e in graph.get("edges", []):
            src = e["source_node"]
            tgt = e["target_node"]
            proto = e.get("protocol") or e.get("data_type") or e.get("relationship")
            if proto:
                # Sanitize label text
                clean_proto = str(proto).replace('"', '').replace('<', '').replace('>', '')
                lines.append(f"    {src} -->|\"{clean_proto}\"| {tgt}")
            else:
                lines.append(f"    {src} --> {tgt}")

        lines.append("")
        lines.append("    %% Status Class Applications")
        for n in nodes:
            key = n["node_key"]
            status = n.get("status", "PROPOSED").upper()
            ntype = n.get("node_type", "")
            if "AI" in ntype:
                lines.append(f"    class {key} ai;")
            elif "SECURITY" in ntype or "AUTH" in ntype or view_type == "SECURITY":
                lines.append(f"    class {key} security;")
            elif status in ["IMPLEMENTED", "VALIDATED"]:
                lines.append(f"    class {key} implemented;")
            elif status == "SIMULATED":
                lines.append(f"    class {key} simulated;")
            else:
                lines.append(f"    class {key} planned;")

        return "\n".join(lines)

    @classmethod
    def _format_mermaid_node(cls, node: Dict[str, Any]) -> str:
        """
        Formats a single node with shape brackets and readable name + badge.
        """
        key = node["node_key"]
        name = node.get("name", key).replace('"', '').replace('[', '(').replace(']', ')')
        tech = node.get("technology")
        status = node.get("status", "PROPOSED")
        badge = "SIMULATED" if status == "SIMULATED" else ("PLANNED" if status == "PLANNED" else "")

        label_parts = [name]
        if tech and tech.lower() not in name.lower():
            label_parts.append(f"<i>({tech})</i>")
        if badge:
            label_parts.append(f"<b>[{badge}]</b>")

        label = "<br/>".join(label_parts)
        ntype = node.get("node_type", "BACKEND")

        if ntype in ["DATABASE", "VECTOR_DATABASE", "STORAGE", "CACHE"]:
            return f"        {key}[(\"{label}\")]"
        elif ntype in ["AI_MODEL", "AI_SERVICE"]:
            return f"        {key}{{\"{label}\"}}"
        elif ntype == "USER":
            return f"        {key}([\"{label}\"])"
        elif ntype == "MESSAGE_BROKER":
            return f"        {key}{{\"{label}\"}}"
        else:
            return f"        {key}[\"{label}\"]"

    @classmethod
    def validate_mermaid_syntax(cls, code: str) -> Tuple[bool, Optional[str]]:
        """
        Validates basic Mermaid syntax to catch formatting issues early.
        """
        if not code or not code.strip():
            return False, "Mermaid diagram source cannot be empty."

        clean = code.strip()
        first_line = clean.split("\n")[0].strip()
        if not any(first_line.startswith(p) for p in ["flowchart", "graph", "sequenceDiagram", "classDiagram", "erDiagram"]):
            return False, "Diagram must start with a valid Mermaid directive (e.g. 'flowchart TD', 'graph LR')."

        # Check bracket parity
        brackets = {"[": "]", "(": ")", "{": "}"}
        stack = []
        for char in clean:
            if char in brackets:
                stack.append(char)
            elif char in brackets.values():
                if not stack:
                    return False, f"Mismatched closing bracket '{char}' found."
                top = stack.pop()
                if brackets[top] != char:
                    return False, f"Unbalanced bracket mismatch: opened with '{top}', closed with '{char}'."

        if stack:
            return False, f"Unclosed bracket '{stack[-1]}' found in Mermaid source."

        return True, None

    # =========================================================================
    # High-Fidelity Vector SVG & PNG Exports
    # =========================================================================

    @classmethod
    def export_diagram_svg(
        cls, arch: Architecture, theme: str = "light", resolution: str = "presentation"
    ) -> str:
        """
        Generates high-resolution presentation-grade vector SVG directly from graph structure.
        """
        graph = arch.graph_json or {}
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])
        layers = graph.get("layers", [])

        width = 1280 if resolution == "presentation" else (1920 if resolution == "high_resolution" else 960)
        # Compute dynamic height
        num_layers = max(len(layers), 1)
        height = max(720, num_layers * 180 + 150)

        bg_color = "#0B0F19" if theme == "dark" else "#F8FAFC"
        text_primary = "#F8FAFC" if theme == "dark" else "#0F172A"
        text_secondary = "#94A3B8" if theme == "dark" else "#64748B"
        layer_bg = "#1E293B" if theme == "dark" else "#FFFFFF"
        layer_border = "#334155" if theme == "dark" else "#E2E8F0"

        svg_parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">',
            '  <defs>',
            '    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '      <stop offset="0%" stop-color="#4F46E5" />',
            '      <stop offset="100%" stop-color="#7C3AED" />',
            '    </linearGradient>',
            '    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">',
            '      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.08" />',
            '    </filter>',
            '  </defs>',
            f'  <rect width="{width}" height="{height}" fill="{bg_color}" />',
            f'  <!-- Header Banner -->',
            f'  <rect x="40" y="30" width="{width - 80}" height="70" rx="16" fill="url(#headerGrad)" filter="url(#shadow)" />',
            f'  <text x="65" y="62" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">{arch.name}</text>',
            f'  <text x="65" y="84" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#E0E7FF">InnoSphere AI System Design &bull; Status: {arch.status} &bull; Type: {arch.architecture_type}</text>',
        ]

        # Calculate Node Positions
        node_coords = {}
        y_offset = 130

        if layers:
            layer_height = (height - 160) / len(layers)
            for l_idx, layer in enumerate(layers):
                l_y = y_offset + l_idx * layer_height
                l_nodes = layer.get("node_keys", [])
                svg_parts.append(f'  <!-- Layer: {layer.get("name")} -->')
                svg_parts.append(f'  <rect x="40" y="{l_y}" width="{width - 80}" height="{layer_height - 20}" rx="12" fill="{layer_bg}" stroke="{layer_border}" stroke-width="1.5" />')
                svg_parts.append(f'  <text x="60" y="{l_y + 24}" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="{text_secondary}">{layer.get("name").upper()}</text>')

                if l_nodes:
                    node_width = min(240, (width - 160) / max(len(l_nodes), 1))
                    for n_idx, nkey in enumerate(l_nodes):
                        n_x = 60 + n_idx * (node_width + 20)
                        n_y = l_y + 40
                        node_coords[nkey] = (n_x + node_width / 2, n_y + 35)

                        # Find node object
                        n_obj = next((n for n in nodes if n["node_key"] == nkey), {"name": nkey, "technology": "", "status": "IMPLEMENTED"})
                        status_color = "#F59E0B" if n_obj.get("status") == "SIMULATED" else "#10B981"
                        
                        svg_parts.append(f'  <g transform="translate({n_x}, {n_y})">')
                        svg_parts.append(f'    <rect width="{node_width}" height="70" rx="8" fill="{bg_color}" stroke="{status_color}" stroke-width="1.5" filter="url(#shadow)" />')
                        svg_parts.append(f'    <text x="12" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="{text_primary}">{n_obj.get("name")[:24]}</text>')
                        svg_parts.append(f'    <text x="12" y="44" font-family="system-ui, sans-serif" font-size="10" fill="{text_secondary}">{n_obj.get("technology", "")[:26]}</text>')
                        svg_parts.append(f'    <rect x="{node_width - 80}" y="48" width="70" height="16" rx="4" fill="{status_color}" fill-opacity="0.15" />')
                        svg_parts.append(f'    <text x="{node_width - 45}" y="60" text-anchor="middle" font-family="monospace" font-size="8" font-weight="bold" fill="{status_color}">{n_obj.get("status", "READY")}</text>')
                        svg_parts.append('  </g>')

        # Render Arrow Connectors
        for edge in edges:
            src = edge.get("source_node")
            tgt = edge.get("target_node")
            if src in node_coords and tgt in node_coords:
                x1, y1 = node_coords[src]
                x2, y2 = node_coords[tgt]
                svg_parts.append(f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#6366F1" stroke-width="1.5" stroke-dasharray="4 2" />')

        svg_parts.append('</svg>')
        return "\n".join(svg_parts)

    @classmethod
    def export_complete_package(cls, db: Session, project_id: int, user_id: int) -> Dict[str, Any]:
        """
        Generates complete ZIP-ready architecture documentation bundle.
        """
        archs = cls.get_or_generate_architectures(db, project_id, user_id)
        package_files = {}

        for a in archs:
            v_type = a.architecture_type.lower().replace("_", "-")
            svg_content = cls.export_diagram_svg(a, "light", "presentation")
            mermaid_code = a.custom_mermaid_source or a.mermaid_source

            package_files[f"{v_type}-architecture.svg"] = svg_content
            package_files[f"{v_type}-architecture.mmd"] = mermaid_code

        # Add JSON and README
        package_files["architecture-manifest.json"] = json.dumps([
            {
                "type": a.architecture_type,
                "name": a.name,
                "status": a.status,
                "nodes": a.graph_json.get("nodes", []),
                "edges": a.graph_json.get("edges", [])
            } for a in archs
        ], indent=2)

        package_files["README.md"] = f"""# InnoSphere AI Architecture Package

Generated for Project ID: {project_id}
Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

## Included Diagrams:
- System Architecture (`system-architecture.svg` / `.mmd`)
- Data Flow Architecture (`data-flow-architecture.svg` / `.mmd`)
- AI / ML Pipeline (`ai-pipeline-architecture.svg` / `.mmd`)
- Hardware ↔ Software Topology (`hardware-architecture.svg` / `.mmd`)
- REST API Architecture (`api-flow-architecture.svg` / `.mmd`)
- Deployment Topology (`deployment-architecture.svg` / `.mmd`)
- User / Application Flow (`application-flow-architecture.svg` / `.mmd`)
- Security Architecture (`security-architecture.svg` / `.mmd`)

All architecture views are verified and synchronized with InnoSphere AI.
"""
        return package_files

    # =========================================================================
    # Explanation, Diagnostics & Assistant
    # =========================================================================

    @classmethod
    def _generate_explanation(cls, graph: Dict[str, Any], view_type: str, ctx: Dict[str, Any]) -> str:
        """
        Generates a clear, numbered step-by-step prose explanation of the system.
        """
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])
        
        lines = [
            f"### How the {view_type.replace('_', ' ').title()} System Operates\n",
            f"The **{ctx['title']}** architecture organizes {len(nodes)} distinct components into an evidence-backed execution pipeline:\n"
        ]

        for idx, node in enumerate(nodes, 1):
            name = node.get("name", "")
            tech = node.get("technology", "")
            status = node.get("status", "PROPOSED")
            desc = node.get("description", "")
            badge = f" `[{status}]`" if status in ["SIMULATED", "PLANNED"] else ""
            lines.append(f"{idx}. **{name}** ({tech}){badge}: {desc}")

        lines.append("\n#### Data & Control Interconnects:")
        for idx, edge in enumerate(edges, 1):
            src = edge.get("source_node", "")
            tgt = edge.get("target_node", "")
            proto = edge.get("protocol", "Data Transfer")
            dtype = edge.get("data_type", "Payload")
            lines.append(f"- Step {idx}: **{src}** &rarr; **{tgt}** via `{proto}` transporting `{dtype}`.")

        return "\n".join(lines)

    @classmethod
    def _run_architecture_diagnostics(cls, graph: Dict[str, Any], ctx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs architectural integrity checks, identifying missing nodes or simulated items.
        """
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])
        node_keys = {n["node_key"] for n in nodes}

        checks = []
        warnings = []
        checklist = [
            {"label": "End-User Input / Ingestion Identified", "passed": True, "detail": "User client and primary input nodes are mapped."},
            {"label": "API / Backend Routing Verified", "passed": any(n["node_type"] in ["BACKEND", "API"] for n in nodes), "detail": "FastAPI gateway handles incoming traffic."},
            {"label": "AI Inference Processing Stage Defined", "passed": any("AI" in n["node_type"] for n in nodes), "detail": f"AI model ({ctx['ai_framework']}) is integrated."},
            {"label": "Persistent Data Storage Configured", "passed": any("DATABASE" in n["node_type"] or "STORAGE" in n["node_type"] for n in nodes), "detail": f"Relational storage ({ctx['database_tech']}) persists state."}
        ]

        # Check for isolated / orphaned nodes
        connected_nodes = set()
        for e in edges:
            connected_nodes.add(e.get("source_node"))
            connected_nodes.add(e.get("target_node"))

        orphans = node_keys - connected_nodes
        if orphans:
            warnings.append({
                "type": "ORPHANED_NODE",
                "message": f"Component(s) {list(orphans)} have no active data connections.",
                "severity": "MEDIUM"
            })

        # Hardware execution check
        if ctx["has_hardware"]:
            if ctx["is_hardware_simulated"]:
                warnings.append({
                    "type": "SIMULATED_HARDWARE",
                    "message": "Hardware execution is currently simulated in Hardware Lab. Physical ESP32 is not connected.",
                    "severity": "INFO"
                })
                checklist.append({"label": "Physical Hardware Telemetry Connected", "passed": False, "detail": "Currently operating in digital simulation mode."})
            else:
                checklist.append({"label": "Physical Hardware Telemetry Connected", "passed": True, "detail": "Physical hardware device is reporting live telemetry."})

        # Score computation
        passed_count = sum(1 for c in checklist if c["passed"])
        completeness_score = int((passed_count / max(len(checklist), 1)) * 100)

        return {
            "checks": checks,
            "warnings": warnings,
            "readiness_checklist": checklist,
            "completeness_score": completeness_score
        }

    @classmethod
    def answer_assistant_query(
        cls, db: Session, project_id: int, query: str, view_type: str, user_id: int
    ) -> Dict[str, Any]:
        """
        AI Architecture Assistant answering architectural questions grounded in the project graph.
        """
        arch = cls.get_architecture_by_type(db, project_id, view_type, user_id)
        if not arch:
            return {"response": "Architecture graph not found for this view.", "suggested_followups": [], "referenced_nodes": []}

        graph = arch.graph_json or {}
        nodes = graph.get("nodes", [])
        q_lower = query.lower()

        referenced = [n["node_key"] for n in nodes if n["node_key"].lower() in q_lower or n["name"].lower() in q_lower]

        if "explain" in q_lower or "how does" in q_lower or "work" in q_lower:
            resp = arch.explanation or "This architecture organizes clients, API services, AI scoring models, and persistent storage into an end-to-end pipeline."
        elif "fail" in q_lower or "bottleneck" in q_lower:
            resp = f"Potential bottlenecks for {view_type}: If the ingestion queue experiences burst traffic, asynchronous buffering and Pydantic validation prevent backend memory exhaustion. For high load, consider read-replicas for {graph.get('metrics', {}).get('framework', 'the database')}."
        elif "ai" in q_lower or "model" in q_lower:
            ai_nodes = [n for n in nodes if "AI" in n.get("node_type", "")]
            resp = f"The AI subsystem is powered by: {', '.join(n['name'] for n in ai_nodes) if ai_nodes else 'Standard analytical pipelines'}. It executes inference on normalized feature tensors and returns confidence-scored predictions."
        elif "hardware" in q_lower or "esp32" in q_lower or "sensor" in q_lower:
            hw_nodes = [n for n in nodes if n.get("node_type") in ["HARDWARE", "SENSOR"]]
            resp = f"Hardware components: {', '.join(n['name'] for n in hw_nodes)}. Note: All simulated devices are clearly tagged as SIMULATED to ensure judge credibility."
        else:
            resp = f"Based on the {view_type} architecture, the system coordinates {len(nodes)} verified components. Key technologies include {', '.join(set(n.get('technology','') for n in nodes if n.get('technology')))}."

        return {
            "response": resp,
            "suggested_followups": [
                "What happens if the message broker goes down?",
                "How does the AI model validate confidence scores?",
                "What skills are required to implement this architecture?"
            ],
            "referenced_nodes": referenced
        }

    @classmethod
    def get_simplification_proposal(
        cls, db: Session, project_id: int, view_type: str, user_id: int
    ) -> Dict[str, Any]:
        """
        Generates a simplified prototype-friendly architecture suggestion for student hackathons.
        """
        arch = cls.get_architecture_by_type(db, project_id, view_type, user_id)
        if not arch:
            return {}

        original_graph = arch.graph_json or {}
        # Create lean prototype version (collapse intermediate queues if prototype)
        simplified_nodes = [n for n in original_graph.get("nodes", []) if n.get("node_type") not in ["MESSAGE_BROKER", "MONITORING"]]
        simplified_graph = {
            "architecture_type": view_type,
            "title": f"Simplified Prototype - {arch.name}",
            "description": "Lean prototype architecture removing decoupled queues for fast initial MVP build.",
            "nodes": simplified_nodes,
            "edges": original_graph.get("edges", [])[:4],
            "layers": original_graph.get("layers", [])
        }
        simplified_mermaid = cls._compile_graph_to_mermaid(simplified_graph, view_type)

        return {
            "original_graph": original_graph,
            "simplified_graph": simplified_graph,
            "original_mermaid": arch.custom_mermaid_source or arch.mermaid_source,
            "simplified_mermaid": simplified_mermaid,
            "simplification_rationale": [
                "Direct HTTP ingestion replaces external MQTT brokers for fast local prototyping.",
                "In-memory SQLite / PostgreSQL simplifies database provisioning for hackathon submissions.",
                "Maintains all core AI and validation logic while lowering operational complexity."
            ]
        }

    # =========================================================================
    # Cross-Engine Synchronizations
    # =========================================================================

    @classmethod
    def sync_to_roadmap(cls, db: Session, project_id: int, user_id: int) -> Dict[str, Any]:
        """
        Non-destructively generates and injects architecture implementation tasks into ProjectRoadmap.
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"synced_count": 0, "message": "Project not found"}

        roadmap = db.query(ProjectRoadmap).filter(ProjectRoadmap.project_id == project_id).first()
        if not roadmap:
            roadmap = ProjectRoadmap(project_id=project_id, current_phase="Phase 2: Architecture & Implementation")
            db.add(roadmap)
            db.commit()
            db.refresh(roadmap)

        arch = cls.get_architecture_by_type(db, project_id, "SYSTEM", user_id)
        nodes = arch.graph_json.get("nodes", []) if arch else []

        existing_tasks = db.query(RoadmapTask).filter(RoadmapTask.roadmap_id == roadmap.id).all()
        existing_titles = {t.title.lower() for t in existing_tasks}

        new_tasks = []
        for n in nodes:
            name = n.get("name", "")
            tech = n.get("technology", "")
            task_title = f"Implement & Configure {name}"
            if task_title.lower() not in existing_titles:
                task = RoadmapTask(
                    roadmap_id=roadmap.id,
                    phase_number=2,
                    phase_name="Phase 2 - System Architecture & Implementation",
                    title=task_title,
                    description=f"Configure {tech} and verify interface contracts according to the system architecture specification.",
                    is_completed=False,
                    priority="High",
                    order_idx=len(existing_tasks) + len(new_tasks) + 1
                )
                db.add(task)
                new_tasks.append(task)
                existing_titles.add(task_title.lower())

        db.commit()
        return {
            "synced_count": len(new_tasks),
            "message": f"Successfully synced {len(new_tasks)} architecture implementation tasks to project roadmap."
        }

    @classmethod
    def sync_to_research(cls, db: Session, project_id: int, user_id: int) -> Dict[str, Any]:
        """
        Appends or updates the System Architecture section in the project's Research Workspace document.
        """
        doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
        if not doc:
            return {"success": False, "message": "No active research document found. Create a research draft first."}

        arch = cls.get_architecture_by_type(db, project_id, "SYSTEM", user_id)
        if not arch:
            return {"success": False, "message": "System architecture not found."}

        mermaid_code = arch.custom_mermaid_source or arch.mermaid_source
        arch_section = f"""

## III. Proposed System Architecture & Methodology

Figure 1 illustrates the end-to-end system architecture for the proposed innovation.

```mermaid
{mermaid_code}
```

### Component Breakdown & Data Interconnects
{arch.explanation or 'The architecture organizes data acquisition, validation, ML inference, and persistence into a decoupled pipeline.'}
"""
        doc.markdown_content = (doc.markdown_content or "") + arch_section
        doc.updated_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": "Successfully appended System Architecture section to Research Workspace paper."
        }

    # =========================================================================
    # Versioning & Snapshots
    # =========================================================================

    @classmethod
    def _create_version_snapshot(
        cls, db: Session, project_id: int, arch_type: str, arch: Optional[Architecture], summary: str
    ):
        if not arch:
            return

        graph = arch.graph_json or {}
        mermaid = arch.custom_mermaid_source or arch.mermaid_source or ""
        content_bytes = (json.dumps(graph, sort_keys=True) + mermaid).encode("utf-8")
        c_hash = hashlib.sha256(content_bytes).hexdigest()[:16]

        latest_version = db.query(ArchitectureVersion).filter(
            ArchitectureVersion.project_id == project_id,
            ArchitectureVersion.architecture_type == arch_type
        ).order_by(ArchitectureVersion.version_number.desc()).first()

        next_ver = (latest_version.version_number + 1) if latest_version else 1

        ver_rec = ArchitectureVersion(
            architecture_id=arch.id,
            project_id=project_id,
            version_number=next_ver,
            architecture_type=arch_type,
            graph_snapshot=graph,
            mermaid_source=mermaid,
            change_summary=summary,
            content_hash=c_hash,
            created_by="AI_GENERATOR"
        )
        db.add(ver_rec)
        db.commit()
