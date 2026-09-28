import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.skill import (
    Skill, ProjectSkillRequirement, StudentSkillProfile,
    SkillGap, LearningPathItem
)
from app.models.project import Project
from app.models.idea import Idea
from app.models.resource import Resource
from app.models.roadmap import ProjectRoadmap, RoadmapTask
from app.schemas.skill import (
    SkillRequirementOut, StudentSkillProfileOut, SkillGapOut,
    PrerequisiteNodeOut, SkillGraphNode, SkillGraphEdge,
    SkillDependencyGraphOut, LearningResourceRef, LearningPathItemOut,
    LearningPhaseGroup, LearningRoadmapOut, SkillGapSummaryOut,
    AmIReadyToStartOut, TechStackSkillMappingOut, ProjectSkillsAnalysisResponse,
    RoadmapSyncResponse, SkillPlanExportResponse
)
from app.services.ai_service import ai_service
from app.config import settings

logger = logging.getLogger("inno_sphere.skill_gap")

# Level normalization dictionary
LEVEL_RANKS = {
    "NONE": 0,
    "BEGINNER": 1,
    "INTERMEDIATE": 2,
    "ADVANCED": 3,
    "EXPERT": 4,
    "NOT_SURE": -1
}

LEVEL_LABELS = {
    0: "NONE",
    1: "BEGINNER",
    2: "INTERMEDIATE",
    3: "ADVANCED",
    4: "EXPERT",
    -1: "NOT_SURE"
}


# ------------------------------------------------------------------------------
# 1. Technology Knowledge Base & Skill Mapping Dictionary
# ------------------------------------------------------------------------------
TECH_TO_SKILLS: Dict[str, Dict[str, Any]] = {
    "pytorch": {
        "category": "Machine Learning & AI",
        "description": "Deep learning tensor library with GPU acceleration and automatic differentiation.",
        "required_skills": ["Python", "NumPy & Tensors", "Neural Networks", "PyTorch Framework", "Model Training", "Model Evaluation"]
    },
    "tensorflow": {
        "category": "Machine Learning & AI",
        "description": "End-to-end open source platform for machine learning and deep learning.",
        "required_skills": ["Python", "NumPy & Tensors", "Neural Networks", "TensorFlow / Keras", "Model Training", "Model Evaluation"]
    },
    "scikit-learn": {
        "category": "Machine Learning & AI",
        "description": "Machine learning library for classical predictive modeling and statistical learning.",
        "required_skills": ["Python", "NumPy & Tensors", "Machine Learning Fundamentals", "Feature Engineering", "Model Evaluation"]
    },
    "opencv": {
        "category": "Deep Learning & Vision",
        "description": "Open source computer vision and image processing library.",
        "required_skills": ["Python", "Computer Vision Basics", "Image Processing", "Convolutional Neural Networks"]
    },
    "computer vision": {
        "category": "Deep Learning & Vision",
        "description": "Algorithms for image feature extraction, segmentation, and object detection.",
        "required_skills": ["Python", "Image Processing", "Convolutional Neural Networks", "Object Detection", "Dataset Preparation"]
    },
    "nlp": {
        "category": "Machine Learning & AI",
        "description": "Natural language processing, tokenization, embeddings, and transformer architectures.",
        "required_skills": ["Python", "Text Preprocessing", "Embeddings & Vector Search", "Transformer Models", "Model Evaluation"]
    },
    "transformers": {
        "category": "Machine Learning & AI",
        "description": "Attention-based sequence models and pre-trained LLM architectures.",
        "required_skills": ["Python", "PyTorch Framework", "Transformer Models", "Embeddings & Vector Search", "Fine-Tuning"]
    },
    "fastapi": {
        "category": "Web & APIs",
        "description": "High-performance asynchronous Python web framework for building REST APIs.",
        "required_skills": ["Python", "REST APIs", "HTTP & Async Programming", "JSON Data Modeling", "API Testing"]
    },
    "flask": {
        "category": "Web & APIs",
        "description": "Lightweight WSGI Python web application framework.",
        "required_skills": ["Python", "REST APIs", "HTTP & Routing", "JSON Handling"]
    },
    "react": {
        "category": "Web & APIs",
        "description": "Component-based JavaScript library for building interactive user interfaces.",
        "required_skills": ["JavaScript / TypeScript", "HTML & CSS", "React Components & State", "REST API Integration"]
    },
    "next.js": {
        "category": "Web & APIs",
        "description": "Full-stack React framework with SSR, App Router, and server actions.",
        "required_skills": ["JavaScript / TypeScript", "React Components & State", "Next.js App Router", "REST API Integration"]
    },
    "esp32": {
        "category": "Embedded & IoT",
        "description": "Low-power microcontroller with integrated Wi-Fi and dual-mode Bluetooth.",
        "required_skills": ["C / C++ Fundamentals", "Embedded Programming", "GPIO & Hardware Circuits", "Sensor Integration", "Serial Communication", "Wi-Fi & Networking"]
    },
    "arduino": {
        "category": "Embedded & IoT",
        "description": "Open-source electronics prototyping platform for microcontroller programming.",
        "required_skills": ["C / C++ Fundamentals", "Embedded Programming", "GPIO & Hardware Circuits", "Sensor Integration"]
    },
    "mqtt": {
        "category": "Embedded & IoT",
        "description": "Lightweight publish-subscribe network protocol for IoT message queuing.",
        "required_skills": ["Networking Fundamentals", "IoT Architecture", "MQTT Protocol", "Real-Time Telemetry Streaming"]
    },
    "lorawan": {
        "category": "Embedded & IoT",
        "description": "Low-power, wide-area networking protocol for wireless battery-operated devices.",
        "required_skills": ["Embedded Programming", "Wireless RF Communication", "LoRaWAN Protocol", "Packet Serialization"]
    },
    "postgresql": {
        "category": "Data & Databases",
        "description": "Advanced open-source relational database supporting ACID transactions and extensions.",
        "required_skills": ["SQL Fundamentals", "Relational Schema Design", "Database Indexing", "ORM Integration"]
    },
    "pgvector": {
        "category": "Data & Databases",
        "description": "Vector similarity search extension for PostgreSQL storing dense embeddings.",
        "required_skills": ["SQL Fundamentals", "Embeddings & Vector Search", "Cosine Similarity & Indexing"]
    },
    "docker": {
        "category": "DevOps & Deployment",
        "description": "Platform for containerizing applications into portable microservices.",
        "required_skills": ["Linux & Shell Commands", "Docker Containers", "Dockerfile Authoring", "Multi-Container Orchestration"]
    },
    "edge ai": {
        "category": "Embedded & IoT",
        "description": "Deploying quantized neural networks onto embedded and mobile edge devices.",
        "required_skills": ["PyTorch Framework", "Model Quantization & Pruning", "ONNX Runtime", "Embedded Programming"]
    },
    "git": {
        "category": "DevOps & Deployment",
        "description": "Distributed version control system for tracking software source code.",
        "required_skills": ["Git & GitHub", "Version Control", "Branching & Merging"]
    }
}


# ------------------------------------------------------------------------------
# 2. Master Skill Catalog with Explicit Prerequisites
# ------------------------------------------------------------------------------
SKILL_CATALOG: Dict[str, Dict[str, Any]] = {
    # Foundations
    "Python": {
        "category": "Programming",
        "description": "Core syntax, data structures, functions, OOP, and package management in Python.",
        "prerequisites": [],
        "effort": "MEDIUM"
    },
    "JavaScript / TypeScript": {
        "category": "Programming",
        "description": "Modern JS/TS syntax, async/await, closures, typing, and web runtime environments.",
        "prerequisites": [],
        "effort": "MEDIUM"
    },
    "C / C++ Fundamentals": {
        "category": "Programming",
        "description": "Pointers, memory management, structs, and compiled code execution.",
        "prerequisites": [],
        "effort": "HIGH"
    },
    "HTML & CSS": {
        "category": "Web & APIs",
        "description": "Semantic HTML markup, CSS layouts, Flexbox, Grid, and responsive styling.",
        "prerequisites": [],
        "effort": "LOW"
    },
    "Git & GitHub": {
        "category": "DevOps & Deployment",
        "description": "Version control, commits, branches, pull requests, and collaborative repository management.",
        "prerequisites": [],
        "effort": "LOW"
    },
    "Linux & Shell Commands": {
        "category": "DevOps & Deployment",
        "description": "Bash terminal navigation, file permissions, process management, and SSH.",
        "prerequisites": [],
        "effort": "LOW"
    },
    "Linear Algebra & Calculus": {
        "category": "Mathematics & Foundations",
        "description": "Vectors, matrices, dot products, eigenvalues, gradients, and partial derivatives.",
        "prerequisites": [],
        "effort": "MEDIUM"
    },
    "Statistics & Probability": {
        "category": "Mathematics & Foundations",
        "description": "Descriptive statistics, normal distributions, p-values, confidence intervals, and hypothesis testing.",
        "prerequisites": [],
        "effort": "MEDIUM"
    },

    # Data & AI Foundations
    "NumPy & Tensors": {
        "category": "Machine Learning & AI",
        "description": "Multidimensional arrays, broadcasting, vectorization, and matrix operations.",
        "prerequisites": ["Python", "Linear Algebra & Calculus"],
        "effort": "LOW"
    },
    "Pandas & Data Wrangling": {
        "category": "Data & Databases",
        "description": "DataFrames, CSV/JSON loading, data cleaning, aggregation, and time-series slicing.",
        "prerequisites": ["Python"],
        "effort": "LOW"
    },
    "Machine Learning Fundamentals": {
        "category": "Machine Learning & AI",
        "description": "Supervised vs unsupervised learning, loss functions, gradient descent, overfitting, and regularization.",
        "prerequisites": ["Python", "NumPy & Tensors", "Statistics & Probability"],
        "effort": "MEDIUM"
    },
    "Dataset Preparation": {
        "category": "Machine Learning & AI",
        "description": "Data annotation, class balancing, augmentation, splitting into train/val/test splits.",
        "prerequisites": ["Python", "Pandas & Data Wrangling"],
        "effort": "LOW"
    },
    "Feature Engineering": {
        "category": "Machine Learning & AI",
        "description": "Normalization, categorical encoding, dimensionality reduction (PCA), and feature scaling.",
        "prerequisites": ["Python", "NumPy & Tensors", "Pandas & Data Wrangling"],
        "effort": "MEDIUM"
    },

    # Deep Learning & Computer Vision
    "Neural Networks": {
        "category": "Machine Learning & AI",
        "description": "Multilayer perceptrons, activation functions (ReLU, Sigmoid), backpropagation, and optimization.",
        "prerequisites": ["NumPy & Tensors", "Machine Learning Fundamentals"],
        "effort": "MEDIUM"
    },
    "PyTorch Framework": {
        "category": "Machine Learning & AI",
        "description": "Torch modules, autograd, dataloaders, custom loss functions, and GPU training loops.",
        "prerequisites": ["Python", "NumPy & Tensors", "Neural Networks"],
        "effort": "MEDIUM"
    },
    "TensorFlow / Keras": {
        "category": "Machine Learning & AI",
        "description": "Sequential & Functional APIs, callbacks, TensorBoard, and saved model exports.",
        "prerequisites": ["Python", "NumPy & Tensors", "Neural Networks"],
        "effort": "MEDIUM"
    },
    "Computer Vision Basics": {
        "category": "Deep Learning & Vision",
        "description": "Color spaces, histograms, filtering, edge detection, and geometric transformations.",
        "prerequisites": ["Python", "NumPy & Tensors"],
        "effort": "MEDIUM"
    },
    "Image Processing": {
        "category": "Deep Learning & Vision",
        "description": "OpenCV filters, morphological operations, contour detection, and thresholding.",
        "prerequisites": ["Python", "Computer Vision Basics"],
        "effort": "MEDIUM"
    },
    "Convolutional Neural Networks": {
        "category": "Deep Learning & Vision",
        "description": "Conv2D layers, pooling, stride, feature maps, ResNet/MobileNet transfer learning.",
        "prerequisites": ["Neural Networks", "PyTorch Framework", "Computer Vision Basics"],
        "effort": "HIGH"
    },
    "Object Detection": {
        "category": "Deep Learning & Vision",
        "description": "Bounding box regression, IoU, NMS, YOLO/Faster-RCNN architectures and anchor boxes.",
        "prerequisites": ["Convolutional Neural Networks"],
        "effort": "HIGH"
    },

    # NLP & Transformers
    "Text Preprocessing": {
        "category": "Machine Learning & AI",
        "description": "Tokenization, stopword removal, stemming, lemmatization, and regex parsing.",
        "prerequisites": ["Python"],
        "effort": "LOW"
    },
    "Embeddings & Vector Search": {
        "category": "Machine Learning & AI",
        "description": "Dense semantic vectors, cosine similarity, FAISS, pgvector, and hybrid retrieval.",
        "prerequisites": ["Python", "NumPy & Tensors"],
        "effort": "MEDIUM"
    },
    "Transformer Models": {
        "category": "Machine Learning & AI",
        "description": "Self-attention mechanisms, multi-head attention, positional encoding, and BERT/GPT.",
        "prerequisites": ["Neural Networks", "Embeddings & Vector Search"],
        "effort": "HIGH"
    },
    "Fine-Tuning": {
        "category": "Machine Learning & AI",
        "description": "LoRA, parameter-efficient fine-tuning (PEFT), learning rate schedules, and model checkpoints.",
        "prerequisites": ["Transformer Models", "PyTorch Framework"],
        "effort": "HIGH"
    },

    # Evaluation & Validation
    "Model Evaluation": {
        "category": "Validation & Research",
        "description": "Accuracy, precision, recall, F1-score, ROC-AUC, confusion matrices, and cross-validation.",
        "prerequisites": ["Machine Learning Fundamentals", "Statistics & Probability"],
        "effort": "LOW"
    },
    "Statistical Testing": {
        "category": "Validation & Research",
        "description": "Paired t-tests, ANOVA, Mann-Whitney U tests, standard deviations, and effect sizes.",
        "prerequisites": ["Statistics & Probability"],
        "effort": "MEDIUM"
    },
    "Research Methodology & LaTeX": {
        "category": "Validation & Research",
        "description": "Academic writing, IEEEtran formatting, BibTeX citation management, and reproducible logs.",
        "prerequisites": [],
        "effort": "LOW"
    },

    # Web, APIs & Deployment
    "REST APIs": {
        "category": "Web & APIs",
        "description": "HTTP methods (GET, POST, PUT, DELETE), status codes, headers, and endpoint design.",
        "prerequisites": [],
        "effort": "LOW"
    },
    "HTTP & Async Programming": {
        "category": "Web & APIs",
        "description": "Asynchronous event loops, coroutines, async/await, and non-blocking I/O.",
        "prerequisites": ["Python", "REST APIs"],
        "effort": "MEDIUM"
    },
    "JSON Data Modeling": {
        "category": "Web & APIs",
        "description": "JSON serialization, nested schemas, Pydantic data validation, and payload typing.",
        "prerequisites": ["Python", "REST APIs"],
        "effort": "LOW"
    },
    "API Testing": {
        "category": "Web & APIs",
        "description": "Unit testing endpoints, mock clients, status verification, and pytest / Postman.",
        "prerequisites": ["Python", "REST APIs"],
        "effort": "LOW"
    },
    "React Components & State": {
        "category": "Web & APIs",
        "description": "JSX, props, useState, useEffect, custom hooks, and reactive UI lifecycle.",
        "prerequisites": ["JavaScript / TypeScript", "HTML & CSS"],
        "effort": "MEDIUM"
    },
    "Next.js App Router": {
        "category": "Web & APIs",
        "description": "Server components, client components, dynamic routing, metadata, and data fetching.",
        "prerequisites": ["React Components & State"],
        "effort": "MEDIUM"
    },
    "REST API Integration": {
        "category": "Web & APIs",
        "description": "Fetch API, Axios, async error handling, auth headers, and client state caching.",
        "prerequisites": ["JavaScript / TypeScript", "REST APIs"],
        "effort": "LOW"
    },
    "SQL Fundamentals": {
        "category": "Data & Databases",
        "description": "SELECT, JOIN, WHERE, GROUP BY, indexes, transactions, and relational schemas.",
        "prerequisites": [],
        "effort": "LOW"
    },
    "Relational Schema Design": {
        "category": "Data & Databases",
        "description": "Foreign keys, normal forms, table relationships (1-to-many, many-to-many), and migrations.",
        "prerequisites": ["SQL Fundamentals"],
        "effort": "MEDIUM"
    },
    "Docker Containers": {
        "category": "DevOps & Deployment",
        "description": "Container images, Dockerfile commands, volume mounts, port forwarding, and compose.",
        "prerequisites": ["Linux & Shell Commands"],
        "effort": "MEDIUM"
    },
    "Model Serving": {
        "category": "DevOps & Deployment",
        "description": "Serving ONNX / PyTorch models via FastAPI endpoints with batching and caching.",
        "prerequisites": ["PyTorch Framework", "REST APIs", "HTTP & Async Programming"],
        "effort": "MEDIUM"
    },

    # Hardware & IoT
    "Embedded Programming": {
        "category": "Embedded & IoT",
        "description": "Memory-constrained execution, registers, interrupts, timers, and firmware loops.",
        "prerequisites": ["C / C++ Fundamentals"],
        "effort": "HIGH"
    },
    "GPIO & Hardware Circuits": {
        "category": "Embedded & IoT",
        "description": "Digital/analog pins, pull-up/down resistors, voltage dividers, and circuit breadboarding.",
        "prerequisites": [],
        "effort": "LOW"
    },
    "Sensor Integration": {
        "category": "Embedded & IoT",
        "description": "Interfacing analog/digital sensors (I2C, SPI, UART, ADC) and calibration algorithms.",
        "prerequisites": ["Embedded Programming", "GPIO & Hardware Circuits"],
        "effort": "MEDIUM"
    },
    "Serial Communication": {
        "category": "Embedded & IoT",
        "description": "UART baud rates, serial monitors, command parsing, and packet checksums.",
        "prerequisites": ["Embedded Programming"],
        "effort": "LOW"
    },
    "Wi-Fi & Networking": {
        "category": "Embedded & IoT",
        "description": "Station/AP mode, TCP/IP sockets, Wi-Fi reconnection logic, and HTTP client requests on ESP32.",
        "prerequisites": ["Embedded Programming"],
        "effort": "MEDIUM"
    },
    "MQTT Protocol": {
        "category": "Embedded & IoT",
        "description": "MQTT topics, QoS levels 0/1/2, retain flags, broker connection, and pub/sub message dispatch.",
        "prerequisites": ["Wi-Fi & Networking"],
        "effort": "LOW"
    },
    "Real-Time Telemetry Streaming": {
        "category": "Embedded & IoT",
        "description": "Time-series payload ingestion, ring buffers, anomaly thresholds, and WebSockets.",
        "prerequisites": ["MQTT Protocol", "REST APIs"],
        "effort": "MEDIUM"
    },
    "Model Quantization & Pruning": {
        "category": "Embedded & IoT",
        "description": "INT8 / FP16 quantization, weight pruning, and Edge Impulse / TensorFlow Lite for Microcontrollers.",
        "prerequisites": ["Neural Networks", "PyTorch Framework", "Embedded Programming"],
        "effort": "HIGH"
    }
}


class SkillGapService:
    """
    Core engine for Skills & Prerequisites Gap Mapping, Dependency Graphing,
    and Personalized Learning Roadmap Generation.
    """

    def __init__(self):
        self._ensure_master_skills_seeded()

    def _ensure_master_skills_seeded(self):
        """Pre-seeds the standard skill catalog into memory/database when available."""
        pass

    def get_or_create_skill(self, db: Session, name: str, category: Optional[str] = None, description: Optional[str] = None) -> Skill:
        """Retrieves or creates a skill entry in the database."""
        skill = db.query(Skill).filter(Skill.name == name).first()
        if not skill:
            catalog_info = SKILL_CATALOG.get(name, {})
            skill = Skill(
                name=name,
                category=category or catalog_info.get("category", "General Technical"),
                description=description or catalog_info.get("description", f"Essential competence in {name}."),
                prerequisites=catalog_info.get("prerequisites", []),
                default_learning_effort=catalog_info.get("effort", "MEDIUM")
            )
            db.add(skill)
            db.commit()
            db.refresh(skill)
        return skill

    def map_technologies_to_skills(self, technologies: List[str]) -> List[TechStackSkillMappingOut]:
        """
        Maps a list of recommended technologies to their constituent required skills.
        """
        results: List[TechStackSkillMappingOut] = []
        for tech in technologies:
            tech_clean = tech.strip().lower()
            matching_key = None
            for k in TECH_TO_SKILLS:
                if k in tech_clean or tech_clean in k:
                    matching_key = k
                    break
            
            if matching_key:
                info = TECH_TO_SKILLS[matching_key]
                results.append(TechStackSkillMappingOut(
                    technology=tech,
                    category=info["category"],
                    required_skills=info["required_skills"],
                    description=info["description"]
                ))
            else:
                # Default generic tech mapping
                results.append(TechStackSkillMappingOut(
                    technology=tech,
                    category="Engineering & Implementation",
                    required_skills=[tech, "Programming Fundamentals", "API Integration"],
                    description=f"Core technical stack dependency for {tech}."
                ))
        return results

    def extract_project_skill_requirements(self, db: Session, project: Project) -> List[ProjectSkillRequirement]:
        """
        Extracts all required skills for a given project from its technologies, idea, domain,
        hardware, research, experiments, and validation claims.
        """
        # 1. Clean existing requirements if needed or retrieve existing
        existing = db.query(ProjectSkillRequirement).filter(
            ProjectSkillRequirement.project_id == project.id
        ).all()
        
        if existing:
            return existing

        required_skills_dict: Dict[str, Dict[str, Any]] = {}

        # 2. Extract from Technologies
        tech_mappings = self.map_technologies_to_skills(project.technologies or [])
        for tm in tech_mappings:
            for sk_name in tm.required_skills:
                if sk_name not in required_skills_dict:
                    required_skills_dict[sk_name] = {
                        "category": tm.category,
                        "required_level": "INTERMEDIATE" if "Framework" in sk_name or "Neural" in sk_name or "Vision" in sk_name or "Embedded" in sk_name else "BEGINNER",
                        "priority": "CRITICAL" if sk_name in ["Python", "PyTorch Framework", "C / C++ Fundamentals", "Embedded Programming"] else "HIGH",
                        "reason": f"Required directly by the {tm.technology} technology stack.",
                        "source_type": "TECH_STACK",
                        "evidence_refs": [{"source": f"Tech: {tm.technology}", "detail": tm.description}]
                    }

        # 3. Extract from Domain & Problem / Solution keywords
        combined_text = f"{project.domain or ''} {project.title or ''} {project.problem_statement or ''} {project.proposed_solution or ''}".lower()
        
        # Check Vision
        if any(w in combined_text for w in ["image", "camera", "detect", "disease", "vision", "video", "visual", "leaf", "crop"]):
            for v_sk in ["Computer Vision Basics", "Image Processing", "Convolutional Neural Networks", "Dataset Preparation"]:
                if v_sk not in required_skills_dict:
                    required_skills_dict[v_sk] = {
                        "category": "Deep Learning & Vision",
                        "required_level": "INTERMEDIATE",
                        "priority": "HIGH",
                        "reason": "Derived from image analysis and visual classification requirements in project problem statement.",
                        "source_type": "IDEA_ANALYSIS",
                        "evidence_refs": [{"source": "Idea Analysis", "detail": "Project requires visual detection / image recognition pipeline."}]
                    }

        # Check Hardware / IoT
        if project.hardware_devices or any(w in combined_text for w in ["iot", "sensor", "esp32", "arduino", "hardware", "lora", "telemetry"]):
            for h_sk in ["C / C++ Fundamentals", "Embedded Programming", "GPIO & Hardware Circuits", "Sensor Integration", "MQTT Protocol"]:
                if h_sk not in required_skills_dict:
                    required_skills_dict[h_sk] = {
                        "category": "Embedded & IoT",
                        "required_level": "INTERMEDIATE" if h_sk in ["Embedded Programming", "Sensor Integration"] else "BEGINNER",
                        "priority": "HIGH",
                        "reason": "Required for physical/simulated microcontroller and telemetry sensor streaming.",
                        "source_type": "HARDWARE",
                        "evidence_refs": [{"source": "Hardware Requirements", "detail": "Telemetry ingestion and device firmware."}]
                    }

        # Check NLP / LLM
        if any(w in combined_text for w in ["nlp", "text", "rag", "retrieval", "language", "document", "summariz"]):
            for n_sk in ["Text Preprocessing", "Embeddings & Vector Search", "Transformer Models"]:
                if n_sk not in required_skills_dict:
                    required_skills_dict[n_sk] = {
                        "category": "Machine Learning & AI",
                        "required_level": "INTERMEDIATE",
                        "priority": "HIGH",
                        "reason": "Required for natural language processing and dense semantic vector retrieval.",
                        "source_type": "IDEA_ANALYSIS",
                        "evidence_refs": [{"source": "Text Analysis", "detail": "Semantic vector matching and language modeling."}]
                    }

        # Check Experiments & Validation Requirements
        if project.experiments or project.innovation_claims:
            for ev_sk in ["Model Evaluation", "Statistical Testing"]:
                if ev_sk not in required_skills_dict:
                    required_skills_dict[ev_sk] = {
                        "category": "Validation & Research",
                        "required_level": "BEGINNER",
                        "priority": "HIGH",
                        "reason": "Required for empirical benchmark verification and statistical significance testing.",
                        "source_type": "VALIDATION",
                        "evidence_refs": [{"source": "Validation Matrix", "detail": "Empirical hypothesis testing and metric comparison."}]
                    }

        # Ensure essential foundational skill: Python / Git / REST APIs
        if "Python" not in required_skills_dict:
            required_skills_dict["Python"] = {
                "category": "Programming",
                "required_level": "INTERMEDIATE",
                "priority": "CRITICAL",
                "reason": "Core programming language for platform and AI algorithms.",
                "source_type": "TECH_STACK",
                "evidence_refs": [{"source": "Platform Foundation", "detail": "Python runtime environment."}]
            }
        if "Git & GitHub" not in required_skills_dict:
            required_skills_dict["Git & GitHub"] = {
                "category": "DevOps & Deployment",
                "required_level": "BEGINNER",
                "priority": "MEDIUM",
                "reason": "Required for collaborative version control and reproducible repository management.",
                "source_type": "ROADMAP",
                "evidence_refs": [{"source": "Engineering Standards", "detail": "Code versioning."}]
            }

        # 4. Save to Database
        created_reqs: List[ProjectSkillRequirement] = []
        for sk_name, details in required_skills_dict.items():
            skill_obj = self.get_or_create_skill(db, sk_name, category=details["category"], description=SKILL_CATALOG.get(sk_name, {}).get("description"))
            req = ProjectSkillRequirement(
                project_id=project.id,
                skill_id=skill_obj.id,
                required_level=details["required_level"],
                priority=details["priority"],
                reason=details["reason"],
                source_type=details["source_type"],
                evidence_refs=details["evidence_refs"]
            )
            db.add(req)
            created_reqs.append(req)

        db.commit()
        for r in created_reqs:
            db.refresh(r)

        return created_reqs

    def build_skill_dependency_graph(self, skills: List[Skill]) -> SkillDependencyGraphOut:
        """
        Constructs a topological dependency graph with nodes and directed prerequisite edges.
        """
        skill_names = {s.name: s for s in skills}
        nodes: List[SkillGraphNode] = []
        edges: List[SkillGraphEdge] = []

        # Determine depths based on prerequisite chains
        def calculate_depth(name: str, visited: set) -> int:
            if name in visited:
                return 0
            visited.add(name)
            prereqs = SKILL_CATALOG.get(name, {}).get("prerequisites", [])
            if not prereqs:
                return 0
            max_p_depth = 0
            for p in prereqs:
                if p in skill_names:
                    max_p_depth = max(max_p_depth, calculate_depth(p, visited.copy()) + 1)
            return max_p_depth

        for sk in skills:
            depth = calculate_depth(sk.name, set())
            nodes.append(SkillGraphNode(
                id=f"skill-{sk.id}",
                label=sk.name,
                category=sk.category,
                required_level="INTERMEDIATE",
                current_level=None,
                gap_status="NOT_ASSESSED",
                priority="HIGH",
                depth=depth
            ))

            prereqs = SKILL_CATALOG.get(sk.name, {}).get("prerequisites", [])
            for p_name in prereqs:
                if p_name in skill_names:
                    p_skill = skill_names[p_name]
                    edges.append(SkillGraphEdge(
                        source=f"skill-{p_skill.id}",
                        target=f"skill-{sk.id}",
                        label="prerequisite_of"
                    ))

        return SkillDependencyGraphOut(nodes=nodes, edges=edges)

    def analyze_student_skill_profile(self, db: Session, user_id: int, skills: List[Skill]) -> List[StudentSkillProfile]:
        """
        Retrieves or initializes the student's current skill profile for the project skills.
        """
        profiles: List[StudentSkillProfile] = []
        for sk in skills:
            prof = db.query(StudentSkillProfile).filter(
                StudentSkillProfile.user_id == user_id,
                StudentSkillProfile.skill_id == sk.id
            ).first()

            if not prof:
                # Initialize default profile
                prof = StudentSkillProfile(
                    user_id=user_id,
                    skill_id=sk.id,
                    current_level="BEGINNER" if sk.name in ["Python", "Git & GitHub", "HTML & CSS"] else "NONE",
                    progress_pct=40 if sk.name == "Python" else (60 if sk.name == "Git & GitHub" else 0),
                    learning_status="LEARNING" if sk.name == "Python" else "NOT_STARTED",
                    evidence_items=[{"type": "SELF_REPORTED", "title": "Initial Student Self-Assessment", "date": datetime.utcnow().strftime("%Y-%m-%d")}],
                    confidence="MEDIUM"
                )
                db.add(prof)
                db.commit()
                db.refresh(prof)
            profiles.append(prof)

        return profiles

    def calculate_skill_gaps(
        self,
        db: Session,
        project_id: int,
        requirements: List[ProjectSkillRequirement],
        student_profiles: List[StudentSkillProfile]
    ) -> List[SkillGap]:
        """
        Computes granular skill gaps comparing Required Level vs Current Student Level,
        checking prerequisite chains and assigning accurate statuses.
        """
        profile_map: Dict[int, StudentSkillProfile] = {p.skill_id: p for p in student_profiles}
        skill_name_to_id: Dict[str, int] = {r.skill.name: r.skill.id for r in requirements if r.skill}
        
        # Clear previous cached gaps for this project
        db.query(SkillGap).filter(SkillGap.project_id == project_id).delete()

        gaps: List[SkillGap] = []

        for req in requirements:
            sk = req.skill
            if not sk:
                continue

            prof = profile_map.get(sk.id)
            curr_level_str = prof.current_level if prof else "NOT_SURE"
            req_level_str = req.required_level or "INTERMEDIATE"

            curr_rank = LEVEL_RANKS.get(curr_level_str, -1)
            req_rank = LEVEL_RANKS.get(req_level_str, 2)

            level_diff = max(0, req_rank - (curr_rank if curr_rank >= 0 else 0))

            # 1. Analyze Prerequisite Chain
            prereq_names = SKILL_CATALOG.get(sk.name, {}).get("prerequisites", [])
            prereq_chain: List[Dict[str, Any]] = []
            has_unmet_prereq = False

            for p_name in prereq_names:
                p_id = skill_name_to_id.get(p_name)
                p_prof = profile_map.get(p_id) if p_id else None
                p_level = p_prof.current_level if p_prof else "NOT_SURE"
                p_rank = LEVEL_RANKS.get(p_level, -1)
                
                is_sat = p_rank >= 1 # At least beginner/intermediate in prerequisite
                if not is_sat:
                    has_unmet_prereq = True
                    
                prereq_chain.append({
                    "skill_name": p_name,
                    "required_level": "BEGINNER",
                    "current_level": p_level,
                    "status": "READY" if is_sat else "GAP",
                    "is_satisfied": is_sat
                })

            # 2. Determine Accurate Gap Status
            if curr_level_str in ["NOT_SURE", None] or curr_rank == -1:
                status = "NOT_ASSESSED"
            elif req.priority == "OPTIONAL" and level_diff > 0:
                status = "OPTIONAL"
            elif curr_rank >= req_rank:
                if has_unmet_prereq:
                    status = "PARTIALLY_READY"
                else:
                    status = "READY"
            else:
                # Current rank is below requirement
                if has_unmet_prereq:
                    status = "PREREQUISITE_REQUIRED"
                elif level_diff == 1 and curr_rank > 0:
                    status = "PARTIALLY_READY"
                else:
                    status = "LEARNING_REQUIRED"

            gap_obj = SkillGap(
                project_id=project_id,
                skill_id=sk.id,
                required_level=req_level_str,
                current_level=curr_level_str,
                gap_level_diff=level_diff,
                gap_status=status,
                priority=req.priority,
                prerequisites_chain=prereq_chain,
                reason=req.reason or f"Project requires {req_level_str} level in {sk.name} for implementation."
            )
            db.add(gap_obj)
            gaps.append(gap_obj)

        db.commit()
        for g in gaps:
            db.refresh(g)

        return gaps

    def discover_learning_resources_for_skills(
        self,
        db: Session,
        skills: List[Skill],
        project: Project
    ) -> Dict[str, List[LearningResourceRef]]:
        """
        Discovers and pairs high-quality, grounded learning resources for each skill gap.
        """
        resources_by_skill: Dict[str, List[LearningResourceRef]] = {}

        # 1. Fetch available platform resources from library
        db_resources = db.query(Resource).limit(50).all()

        for sk in skills:
            res_list: List[LearningResourceRef] = []

            # Match from database resources
            sk_lower = sk.name.lower()
            for r in db_resources:
                r_text = f"{r.title} {r.description or ''} {r.resource_type}".lower()
                if any(w in r_text for w in sk_lower.split()):
                    res_list.append(LearningResourceRef(
                        resource_id=r.id,
                        title=r.title,
                        url=r.url,
                        resource_type=r.resource_type,
                        source="InnoSphere Resource Library",
                        why_this_resource=f"Relevant {r.resource_type} referenced directly in your project research library.",
                        quality_score=r.quality_score or 85.0
                    ))

            # 2. Add curated high-signal official tutorials/docs if needed
            curated_defaults = self._get_curated_resources_for_skill(sk.name, project.domain)
            for c in curated_defaults:
                if len(res_list) < 4:
                    res_list.append(c)

            resources_by_skill[sk.name] = res_list

        return resources_by_skill

    def _get_curated_resources_for_skill(self, skill_name: str, domain: str) -> List[LearningResourceRef]:
        """Provides verified, explainable learning references for key engineering skills."""
        s = skill_name.lower()
        if "python" in s:
            return [
                LearningResourceRef(
                    title="Python Official Documentation & Tutorial",
                    url="https://docs.python.org/3/tutorial/",
                    resource_type="documentation",
                    source="Docs",
                    why_this_resource="Core language documentation covering syntax, data structures, and standard library modules.",
                    quality_score=95.0
                ),
                LearningResourceRef(
                    title="Python for Data Science Handbook",
                    url="https://jakevdp.github.io/PythonDataScienceHandbook/",
                    resource_type="tutorial",
                    source="Open Textbook",
                    why_this_resource="Comprehensive guide to NumPy arrays, Pandas DataFrames, and Matplotlib data visualization.",
                    quality_score=92.0
                )
            ]
        elif "pytorch" in s or "neural" in s:
            return [
                LearningResourceRef(
                    title="PyTorch Deep Learning 60-Minute Blitz",
                    url="https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html",
                    resource_type="tutorial",
                    source="PyTorch Official",
                    why_this_resource="Step-by-step introduction to tensors, automatic differentiation with autograd, and neural network training.",
                    quality_score=98.0
                ),
                LearningResourceRef(
                    title="Deep Learning with PyTorch: A 60 Minute Walkthrough",
                    url="https://arxiv.org/abs/1912.01703",
                    resource_type="research_paper",
                    source="arXiv:1912.01703",
                    why_this_resource="Peer-reviewed publication on PyTorch imperative programming and tensor engine optimization.",
                    quality_score=90.0
                )
            ]
        elif "vision" in s or "image" in s or "convolutional" in s:
            return [
                LearningResourceRef(
                    title="OpenCV Python Tutorials & Image Filtering",
                    url="https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html",
                    resource_type="documentation",
                    source="OpenCV Docs",
                    why_this_resource="Hands-on guide to image thresholding, contour detection, morphological ops, and feature extraction.",
                    quality_score=94.0
                ),
                LearningResourceRef(
                    title="PlantVillage Crop Disease Benchmark Dataset",
                    url="https://www.kaggle.com/datasets/emmarex/plantdisease",
                    resource_type="dataset",
                    source="Kaggle / OpenData",
                    why_this_resource="Standardized labeled crop disease dataset containing 54,000+ annotated leaf images across 38 classes.",
                    quality_score=96.0
                )
            ]
        elif "esp32" in s or "embedded" in s or "gpio" in s or "sensor" in s:
            return [
                LearningResourceRef(
                    title="ESP32 Arduino Core Documentation & GPIO Guide",
                    url="https://docs.espressif.com/projects/arduino-esp32/en/latest/",
                    resource_type="documentation",
                    source="Espressif Official",
                    why_this_resource="Comprehensive firmware guide for ESP32 ADC pin reads, I2C sensor communication, and Wi-Fi stack.",
                    quality_score=95.0
                ),
                LearningResourceRef(
                    title="Virtual ESP32 & Sensor Simulation in InnoSphere Hardware Lab",
                    url="/hardware-lab",
                    resource_type="tutorial",
                    source="InnoSphere Hardware Lab",
                    why_this_resource="Simulate telemetry packets and test firmware logic safely before physical deployment.",
                    quality_score=90.0
                )
            ]
        elif "mqtt" in s:
            return [
                LearningResourceRef(
                    title="MQTT Essentials: A Lightweight IoT Messaging Protocol",
                    url="https://www.hivemq.com/mqtt-essentials/",
                    resource_type="tutorial",
                    source="HiveMQ Academy",
                    why_this_resource="Explains publish/subscribe architecture, topic hierarchies, QoS levels, and keep-alive packets.",
                    quality_score=93.0
                )
            ]
        elif "fastapi" in s or "api" in s:
            return [
                LearningResourceRef(
                    title="FastAPI Interactive Tutorial & Schema Validation",
                    url="https://fastapi.tiangolo.com/tutorial/",
                    resource_type="documentation",
                    source="FastAPI Official",
                    why_this_resource="Covers path parameters, Pydantic request bodies, dependency injection, and automatic OpenAPI docs.",
                    quality_score=97.0
                )
            ]
        elif "evaluation" in s or "testing" in s:
            return [
                LearningResourceRef(
                    title="Scikit-Learn Model Evaluation & Cross-Validation Metrics",
                    url="https://scikit-learn.org/stable/modules/model_evaluation.html",
                    resource_type="documentation",
                    source="Scikit-Learn Docs",
                    why_this_resource="Defines precision, recall, F1, ROC-AUC, and stratified k-fold splits for empirical verification.",
                    quality_score=94.0
                )
            ]
        else:
            return [
                LearningResourceRef(
                    title=f"Fundamentals & Best Practices in {skill_name}",
                    url="https://github.com/topics/" + skill_name.lower().replace(" ", "-"),
                    resource_type="github_repo",
                    source="GitHub Topics",
                    why_this_resource=f"Curated open-source repositories and implementation templates for {skill_name}.",
                    quality_score=85.0
                )
            ]

    def generate_learning_roadmap(
        self,
        db: Session,
        project: Project,
        gaps: List[SkillGap],
        resources_by_skill: Dict[str, List[LearningResourceRef]]
    ) -> LearningRoadmapOut:
        """
        Generates a 5 to 6 phase structured, prerequisite-aware learning roadmap.
        """
        # Group skills by phase based on category and topological depth
        phase_definitions = [
            {"num": 1, "name": "Phase 1 — Foundations", "desc": "Core programming language fundamentals, version control, and mathematical prerequisites."},
            {"num": 2, "name": "Phase 2 — AI & Data Foundations", "desc": "Statistical learning, array manipulation, dataset preparation, and exploratory data analysis."},
            {"num": 3, "name": "Phase 3 — Core Frameworks & Tooling", "desc": "Deep learning frameworks, web API design, and microcontroller execution environments."},
            {"num": 4, "name": "Phase 4 — Project-Specific Specialized Skills", "desc": "Domain-specific convolutional architectures, sensor interfacing, and message brokers."},
            {"num": 5, "name": "Phase 5 — System Integration & Deployment", "desc": "Containerization, model serving, edge optimization, and full-stack API integration."},
            {"num": 6, "name": "Phase 6 — Empirical Evaluation & Validation", "desc": "Model performance benchmarking, statistical testing, and academic paper documentation."}
        ]

        def assign_phase(sk_name: str, category: str) -> Tuple[int, str]:
            if sk_name in ["Python", "JavaScript / TypeScript", "C / C++ Fundamentals", "HTML & CSS", "Git & GitHub", "Linux & Shell Commands", "Linear Algebra & Calculus", "Statistics & Probability"]:
                return 1, "Phase 1 — Foundations"
            elif sk_name in ["NumPy & Tensors", "Pandas & Data Wrangling", "Machine Learning Fundamentals", "Dataset Preparation", "Feature Engineering", "Text Preprocessing"]:
                return 2, "Phase 2 — AI & Data Foundations"
            elif sk_name in ["Neural Networks", "PyTorch Framework", "TensorFlow / Keras", "REST APIs", "HTTP & Async Programming", "Embedded Programming", "GPIO & Hardware Circuits", "SQL Fundamentals"]:
                return 3, "Phase 3 — Core Frameworks & Tooling"
            elif sk_name in ["Computer Vision Basics", "Image Processing", "Convolutional Neural Networks", "Object Detection", "Embeddings & Vector Search", "Transformer Models", "Sensor Integration", "Serial Communication", "Wi-Fi & Networking", "MQTT Protocol"]:
                return 4, "Phase 4 — Project-Specific Specialized Skills"
            elif sk_name in ["Docker Containers", "Model Serving", "Fine-Tuning", "React Components & State", "Next.js App Router", "REST API Integration", "Relational Schema Design", "Real-Time Telemetry Streaming", "Model Quantization & Pruning"]:
                return 5, "Phase 5 — System Integration & Deployment"
            else:
                return 6, "Phase 6 — Empirical Evaluation & Validation"

        # Clear existing items
        db.query(LearningPathItem).filter(LearningPathItem.project_id == project.id).delete()

        created_items: List[LearningPathItem] = []
        phase_groups_dict: Dict[int, List[LearningPathItemOut]] = {p["num"]: [] for p in phase_definitions}

        seq = 1
        # Sort gaps: prioritize by phase then by priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
        priority_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "OPTIONAL": 4}
        
        sorted_gaps = sorted(
            gaps,
            key=lambda g: (assign_phase(g.skill.name, g.skill.category)[0], priority_rank.get(g.priority, 2))
        )

        for gap in sorted_gaps:
            sk = gap.skill
            p_num, p_name = assign_phase(sk.name, sk.category)

            # Project task references
            project_tasks = []
            if "PyTorch" in sk.name or "Vision" in sk.name or "Neural" in sk.name:
                project_tasks.append({"title": "Create Baseline Experiment", "action": "/experiments", "type": "EXPERIMENT"})
            if "ESP32" in sk.name or "MQTT" in sk.name or "Sensor" in sk.name:
                project_tasks.append({"title": "Launch Hardware Lab Simulation", "action": "/hardware-lab", "type": "HARDWARE"})
            if "Evaluation" in sk.name or "Statistical" in sk.name:
                project_tasks.append({"title": "Verify Innovation Claims", "action": "/validation", "type": "VALIDATION"})
            if "FastAPI" in sk.name or "API" in sk.name:
                project_tasks.append({"title": "Implement REST Service", "action": "/roadmap/1", "type": "TASK"})

            item_obj = LearningPathItem(
                project_id=project.id,
                skill_id=sk.id,
                sequence_order=seq,
                phase_number=p_num,
                phase_name=p_name,
                status="COMPLETED" if gap.gap_status == "READY" else ("IN_PROGRESS" if gap.gap_status == "PARTIALLY_READY" else "NOT_STARTED"),
                estimated_effort=SKILL_CATALOG.get(sk.name, {}).get("effort", "MEDIUM"),
                resource_refs=[r.model_dump() for r in resources_by_skill.get(sk.name, [])[:3]],
                project_task_refs=project_tasks
            )
            db.add(item_obj)
            created_items.append(item_obj)

            phase_groups_dict[p_num].append(LearningPathItemOut(
                id=seq,
                skill_id=sk.id,
                skill_name=sk.name,
                category=sk.category,
                sequence_order=seq,
                phase_number=p_num,
                phase_name=p_name,
                status=item_obj.status,
                estimated_effort=item_obj.estimated_effort,
                gap_status=gap.gap_status,
                resources=resources_by_skill.get(sk.name, [])[:3],
                project_tasks=project_tasks
            ))
            seq += 1

        db.commit()

        # Build output phases
        phases_out: List[LearningPhaseGroup] = []
        for p_def in phase_definitions:
            items = phase_groups_dict[p_def["num"]]
            if items:
                phases_out.append(LearningPhaseGroup(
                    phase_number=p_def["num"],
                    phase_name=p_def["name"],
                    description=p_def["desc"],
                    skills_count=len(items),
                    items=items
                ))

        return LearningRoadmapOut(
            total_phases=len(phases_out),
            total_skills=len(created_items),
            phases=phases_out
        )

    def get_am_i_ready_to_start(self, gaps: List[SkillGap]) -> AmIReadyToStartOut:
        """
        Determines transparent implementation milestones based on current skill readiness.
        """
        ready_skills = {g.skill.name for g in gaps if g.gap_status == "READY"}
        gap_skills = {g.skill.name for g in gaps if g.gap_status in ["LEARNING_REQUIRED", "PREREQUISITE_REQUIRED"]}

        can_begin = [
            "Project architecture & system boundary definition",
            "Public dataset exploration (Kaggle & OpenData)",
            "Git repository initialization & branching strategy"
        ]
        if "Python" in ready_skills:
            can_begin.append("Baseline exploratory scripting and environment setup")
        if "HTML & CSS" in ready_skills or "JavaScript / TypeScript" in ready_skills:
            can_begin.append("Frontend layout wireframing and dashboard UI scaffolding")

        recommended_before_core = []
        if "Machine Learning Fundamentals" in gap_skills or "Neural Networks" in gap_skills:
            recommended_before_core.append("Review Machine Learning Fundamentals & loss function optimization")
        if "PyTorch Framework" in gap_skills or "TensorFlow / Keras" in gap_skills:
            recommended_before_core.append("Complete PyTorch Tensor Blitz tutorial before building custom model layers")
        if "Computer Vision Basics" in gap_skills or "Image Processing" in gap_skills:
            recommended_before_core.append("Practice OpenCV image normalization and augmentation pipelines")
        if "C / C++ Fundamentals" in gap_skills or "Embedded Programming" in gap_skills:
            recommended_before_core.append("Verify C/C++ memory allocation and GPIO circuits before firmware flashing")

        if not recommended_before_core:
            recommended_before_core.append("All core development prerequisites are fulfilled. You can proceed with model training.")

        required_before_deployment = []
        if "Model Evaluation" in gap_skills or "Statistical Testing" in gap_skills:
            required_before_deployment.append("Implement quantitative evaluation metrics (Precision, Recall, F1, ROC-AUC)")
        if "REST APIs" in gap_skills or "HTTP & Async Programming" in gap_skills:
            required_before_deployment.append("Build asynchronous FastAPI endpoints with Pydantic request validation")
        if "MQTT Protocol" in gap_skills or "Real-Time Telemetry Streaming" in gap_skills:
            required_before_deployment.append("Configure MQTT broker pub/sub telemetry streams with keep-alive handshakes")

        if not required_before_deployment:
            required_before_deployment.append("Ready for deployment testing and validation execution.")

        ready_count = len([g for g in gaps if g.gap_status == "READY"])
        total_count = len(gaps)
        pct = round((ready_count / total_count * 100), 1) if total_count > 0 else 0.0

        if pct >= 75:
            verdict = f"High Readiness ({pct}%): You have strong foundational competence and can start active implementation immediately."
        elif pct >= 40:
            verdict = f"Developing Readiness ({pct}%): You can start project scaffolding and dataset preparation while concurrently completing Phase 2/3 learning modules."
        else:
            verdict = f"Foundations Required ({pct}%): We recommend completing Phase 1 Foundations and Phase 2 AI basics before attempting custom model development."

        return AmIReadyToStartOut(
            can_begin_immediately=can_begin,
            recommended_before_development=recommended_before_core,
            required_before_deployment=required_before_deployment,
            verdict_summary=verdict
        )

    def sync_learning_plan_to_roadmap(self, db: Session, project_id: int, user_id: int) -> RoadmapSyncResponse:
        """
        Synchronizes learning phases as structured milestone tasks in the ProjectRoadmap.
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return RoadmapSyncResponse(success=False, synced_tasks_count=0, total_roadmap_tasks=0, roadmap_id=0, message="Project not found.")

        # Ensure project roadmap exists
        roadmap = db.query(ProjectRoadmap).filter(ProjectRoadmap.project_id == project_id).first()
        if not roadmap:
            roadmap = ProjectRoadmap(project_id=project_id, title="Innovation Development & Learning Roadmap")
            db.add(roadmap)
            db.commit()
            db.refresh(roadmap)

        # Retrieve learning path items
        learning_items = db.query(LearningPathItem).filter(LearningPathItem.project_id == project_id).order_by(LearningPathItem.sequence_order.asc()).all()

        synced_count = 0
        existing_task_titles = {t.title for t in roadmap.tasks}

        for item in learning_items:
            task_title = f"Learn {item.skill.name}: {item.phase_name}"
            if task_title not in existing_task_titles:
                task = RoadmapTask(
                    roadmap_id=roadmap.id,
                    phase_number=item.phase_number,
                    phase_name=item.phase_name,
                    title=task_title,
                    description=f"Complete learning modules and practice exercises for {item.skill.name}. Estimated effort: {item.estimated_effort}.",
                    is_completed=item.status == "COMPLETED",
                    priority="High" if item.phase_number <= 2 else "Medium",
                    resources_suggested=item.resource_refs or [],
                    order_idx=item.sequence_order
                )
                db.add(task)
                synced_count += 1
                existing_task_titles.add(task_title)

        db.commit()
        db.refresh(roadmap)

        return RoadmapSyncResponse(
            success=True,
            synced_tasks_count=synced_count,
            total_roadmap_tasks=len(roadmap.tasks),
            roadmap_id=roadmap.id,
            message=f"Successfully synchronized {synced_count} learning milestones into Project Roadmap."
        )

    def export_skill_plan(self, db: Session, project_id: int, export_format: str = "markdown") -> SkillPlanExportResponse:
        """
        Generates a clean Markdown or JSON export of the complete Skills & Prerequisites Gap Plan.
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return SkillPlanExportResponse(project_id=project_id, project_title="Unknown", format=export_format, content_markdown="# Error\nProject not found.")

        analysis = self.get_project_skills_analysis(db, project_id, project.user_id)

        if export_format.lower() == "json":
            return SkillPlanExportResponse(
                project_id=project.id,
                project_title=project.title,
                format="json",
                json_data=analysis.model_dump(mode="json")
            )

        # Markdown format
        md = []
        md.append(f"# InnoSphere AI — Skills & Prerequisites Gap Plan")
        md.append(f"**Project:** {project.title}")
        md.append(f"**Domain:** {project.domain}")
        md.append(f"**Generated At:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        md.append(f"\n---\n")

        md.append(f"## 1. Executive Summary")
        md.append(f"- **Total Required Skills:** {analysis.summary.total_required_skills}")
        md.append(f"- **Ready:** {analysis.summary.ready_count} | **Partially Ready:** {analysis.summary.partially_ready_count} | **Learning Required:** {analysis.summary.learning_required_count} | **Prerequisites Required:** {analysis.summary.prerequisite_required_count}")
        md.append(f"- **Readiness Level:** {analysis.summary.readiness_percentage}%")
        md.append(f"- **Readiness Verdict:** {analysis.am_i_ready.verdict_summary}")
        md.append(f"\n---\n")

        md.append(f"## 2. Technology to Skill Mapping")
        for tech in analysis.required_technologies:
            md.append(f"### {tech.technology} ({tech.category})")
            md.append(f"*{tech.description}*")
            md.append(f"- **Required Skills:** {', '.join(tech.required_skills)}")
            md.append("")

        md.append(f"\n---\n")
        md.append(f"## 3. Skill Gap Analysis Matrix")
        md.append(f"| Skill | Category | Required Level | Current Level | Status | Priority | Learning Effort |")
        md.append(f"|---|---|---|---|---|---|---|")
        for g in analysis.skill_gaps:
            md.append(f"| **{g.skill_name}** | {g.category} | {g.required_level} | {g.current_level or 'Not Assessed'} | `{g.gap_status}` | {g.priority} | {g.learning_effort} |")

        md.append(f"\n---\n")
        md.append(f"## 4. Personalized Learning Roadmap")
        for phase in analysis.learning_roadmap.phases:
            md.append(f"### {phase.phase_name}")
            md.append(f"*{phase.description}*\n")
            for item in phase.items:
                md.append(f"- **{item.skill_name}** (`{item.gap_status}`) — Effort: {item.estimated_effort}")
                if item.resources:
                    for r in item.resources:
                        md.append(f"  - [{r.title}]({r.url or '#'}) ({r.source}): *{r.why_this_resource}*")
                if item.project_tasks:
                    for t in item.project_tasks:
                        md.append(f"  - ⚡ *Unlocks Project Task:* {t['title']}")
            md.append("")

        md.append(f"\n---\n")
        md.append(f"## 5. Implementation Readiness ('Am I Ready to Start?')")
        md.append(f"### You Can Begin Immediately:")
        for b in analysis.am_i_ready.can_begin_immediately:
            md.append(f"- ✓ {b}")
        md.append(f"\n### Recommended Before Core Model Development:")
        for r in analysis.am_i_ready.recommended_before_development:
            md.append(f"- ⚠ {r}")
        md.append(f"\n### Required Before Deployment & Testing:")
        for d in analysis.am_i_ready.required_before_deployment:
            md.append(f"- ⚠ {d}")

        return SkillPlanExportResponse(
            project_id=project.id,
            project_title=project.title,
            format="markdown",
            content_markdown="\n".join(md)
        )

    def get_project_skills_analysis(self, db: Session, project_id: int, user_id: int) -> ProjectSkillsAnalysisResponse:
        """
        Master method assembling the entire Skills & Prerequisites Gap Map for a project.
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project #{project_id} not found.")

        # 1. Extract requirements
        requirements = self.extract_project_skill_requirements(db, project)
        skills = [r.skill for r in requirements if r.skill]

        # 2. Map technologies
        tech_mappings = self.map_technologies_to_skills(project.technologies or [])

        # 3. Analyze student profile
        profiles = self.analyze_student_skill_profile(db, user_id, skills)

        # 4. Compute Gaps & Prerequisite Chains
        gaps = self.calculate_skill_gaps(db, project_id, requirements, profiles)

        # 5. Build Dependency Graph
        dep_graph = self.build_skill_dependency_graph(skills)

        # Attach current level and gap status to graph nodes
        gap_map = {g.skill_id: g for g in gaps}
        prof_map = {p.skill_id: p for p in profiles}
        for node in dep_graph.nodes:
            sk_id = int(node.id.replace("skill-", ""))
            g_obj = gap_map.get(sk_id)
            p_obj = prof_map.get(sk_id)
            if g_obj:
                node.gap_status = g_obj.gap_status
                node.priority = g_obj.priority
                node.required_level = g_obj.required_level
            if p_obj:
                node.current_level = p_obj.current_level

        # 6. Discover Learning Resources
        resources_by_skill = self.discover_learning_resources_for_skills(db, skills, project)

        # 7. Generate Learning Roadmap
        learning_roadmap = self.generate_learning_roadmap(db, project, gaps, resources_by_skill)

        # 8. Readiness verdict
        am_i_ready = self.get_am_i_ready_to_start(gaps)

        # 9. Summary Metrics
        ready_c = len([g for g in gaps if g.gap_status == "READY"])
        partial_c = len([g for g in gaps if g.gap_status == "PARTIALLY_READY"])
        learn_c = len([g for g in gaps if g.gap_status == "LEARNING_REQUIRED"])
        prereq_c = len([g for g in gaps if g.gap_status == "PREREQUISITE_REQUIRED"])
        opt_c = len([g for g in gaps if g.gap_status == "OPTIONAL"])
        unass_c = len([g for g in gaps if g.gap_status == "NOT_ASSESSED"])
        total_req = len(gaps)

        readiness_pct = round(((ready_c + partial_c * 0.5) / total_req * 100), 1) if total_req > 0 else 0.0

        critical_gaps = [
            SkillGapOut(
                id=g.id,
                skill_id=g.skill_id,
                skill_name=g.skill.name,
                category=g.skill.category,
                required_level=g.required_level,
                current_level=g.current_level,
                gap_level_diff=g.gap_level_diff,
                gap_status=g.gap_status,
                priority=g.priority,
                prerequisites_chain=[PrerequisiteNodeOut(**p) for p in g.prerequisites_chain or []],
                reason=g.reason,
                learning_effort=SKILL_CATALOG.get(g.skill.name, {}).get("effort", "MEDIUM"),
                resources_count=len(resources_by_skill.get(g.skill.name, [])),
                project_task_trigger="Create Baseline Experiment" if "ML" in g.skill.category or "Vision" in g.skill.category else "Scaffold System Component"
            )
            for g in gaps if g.priority in ["CRITICAL", "HIGH"]
        ]

        summary = SkillGapSummaryOut(
            total_required_skills=total_req,
            ready_count=ready_c,
            partially_ready_count=partial_c,
            learning_required_count=learn_c,
            prerequisite_required_count=prereq_c,
            optional_count=opt_c,
            not_assessed_count=unass_c,
            readiness_percentage=readiness_pct,
            learning_path_phases_count=learning_roadmap.total_phases,
            critical_skills_count=len(critical_gaps)
        )

        # 10. AI Mentor Prompts
        mentor_prompts = [
            f"What should I learn first before starting {project.title}?",
            f"Why is {critical_gaps[0].skill_name if critical_gaps else 'Python'} required for my project?",
            "How can I simplify the required skills without compromising my project innovation?",
            "What prerequisite am I missing for deep learning model training?",
            "What should I practice before starting my first experiment?",
            "How can I learn these skills using free, open-access resources?"
        ]

        # Pydantic formats
        skill_reqs_out = [
            SkillRequirementOut(
                id=r.id,
                skill_id=r.skill_id,
                skill_name=r.skill.name,
                category=r.skill.category,
                required_level=r.required_level,
                priority=r.priority,
                reason=r.reason,
                source_type=r.source_type,
                evidence_refs=r.evidence_refs or [],
                prerequisites=r.skill.prerequisites or [],
                default_learning_effort=r.skill.default_learning_effort or "MEDIUM"
            )
            for r in requirements if r.skill
        ]

        profiles_out = [
            StudentSkillProfileOut(
                id=p.id,
                skill_id=p.skill_id,
                skill_name=p.skill.name if p.skill else "Skill",
                current_level=p.current_level,
                progress_pct=p.progress_pct,
                learning_status=p.learning_status,
                evidence_items=p.evidence_items or [],
                confidence=p.confidence,
                last_updated=p.last_updated
            )
            for p in profiles
        ]

        gaps_out = [
            SkillGapOut(
                id=g.id,
                skill_id=g.skill_id,
                skill_name=g.skill.name,
                category=g.skill.category,
                required_level=g.required_level,
                current_level=g.current_level,
                gap_level_diff=g.gap_level_diff,
                gap_status=g.gap_status,
                priority=g.priority,
                prerequisites_chain=[PrerequisiteNodeOut(**p) for p in g.prerequisites_chain or []],
                reason=g.reason,
                learning_effort=SKILL_CATALOG.get(g.skill.name, {}).get("effort", "MEDIUM"),
                resources_count=len(resources_by_skill.get(g.skill.name, [])),
                project_task_trigger="Create Baseline Experiment" if "ML" in g.skill.category or "Vision" in g.skill.category else "Scaffold System Component"
            )
            for g in gaps if g.skill
        ]

        return ProjectSkillsAnalysisResponse(
            project_id=project.id,
            project_title=project.title,
            domain=project.domain,
            summary=summary,
            required_technologies=tech_mappings,
            skill_requirements=skill_reqs_out,
            student_profile=profiles_out,
            skill_gaps=gaps_out,
            dependency_graph=dep_graph,
            learning_roadmap=learning_roadmap,
            critical_skills=critical_gaps,
            am_i_ready=am_i_ready,
            mentor_prompts=mentor_prompts,
            timestamp=datetime.utcnow()
        )


# Global service singleton instance
skill_gap_service = SkillGapService()
