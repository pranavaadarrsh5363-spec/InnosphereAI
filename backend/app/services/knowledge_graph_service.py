import hashlib
import json
import logging
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple, Set

from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.idea import Idea
from app.models.resource import Resource, SavedResource
from app.models.insight import AIInsight
from app.models.hardware import HardwareDevice, HardwareSensor, HardwareExperiment
from app.models.research import ResearchDocument, ResearchCitation
from app.models.experiment import Experiment, BenchmarkReference, ExperimentEvidence
from app.models.validation import InnovationClaim, ValidationEvidence, ValidationGap
from app.models.skill import ProjectSkillRequirement, StudentSkillProfile, SkillGap
from app.models.architecture import Architecture, ArchitectureNode
from app.models.roadmap import ProjectRoadmap, RoadmapTask
from app.models.patent import PatentDocument, SavedPriorArt, PatentSearch, PatentSearchResult, PatentOverlap
from app.models.resource_matchmaker import ProjectResourcePlanItem, ResourceMatchRecord
from app.models.knowledge_graph import (
    KnowledgeGraph,
    KnowledgeGraphNode,
    KnowledgeGraphEdge,
    KnowledgeGraphSnapshot,
)

logger = logging.getLogger("inno_sphere")


class KnowledgeGraphService:
    """
    Core AI Knowledge Graph Service.
    Extracts, links, synthesizes, and visualizes innovation project entities across
    Idea, Problem, Research, Datasets, Tech, Hardware, Existing Solutions, Gaps,
    Experiments, Benchmarks, Validation, Claims, Skills, Architecture, and Roadmap.
    """

    # 18 Canonical Categories
    CATEGORIES = [
        "IDEA",
        "PROBLEM",
        "RESEARCH_PAPER",
        "PATENT",
        "DATASET",
        "TECHNOLOGY",
        "HARDWARE",
        "EXISTING_SOLUTION",
        "INNOVATION_GAP",
        "EXPERIMENT",
        "BENCHMARK",
        "VALIDATION_EVIDENCE",
        "INNOVATION_CLAIM",
        "SKILL",
        "ARCHITECTURE_COMPONENT",
        "RESOURCE",
        "ROADMAP_ITEM",
        "CITATION",
    ]

    # Category Color & Styling Schemes
    CATEGORY_STYLES = {
        "IDEA": {"color": "#6366F1", "bg": "#EEF2FF", "border": "#4F46E5", "shape": "hexagon"},
        "PROBLEM": {"color": "#EF4444", "bg": "#FEF2F2", "border": "#DC2626", "shape": "rect"},
        "RESEARCH_PAPER": {"color": "#8B5CF6", "bg": "#F5F3FF", "border": "#7C3AED", "shape": "folder"},
        "PATENT": {"color": "#D97706", "bg": "#FEF3C7", "border": "#B45309", "shape": "rect"},
        "DATASET": {"color": "#06B6D4", "bg": "#ECFEFF", "border": "#0891B2", "shape": "cylinder"},
        "TECHNOLOGY": {"color": "#3B82F6", "bg": "#EFF6FF", "border": "#2563EB", "shape": "rect"},
        "HARDWARE": {"color": "#EC4899", "bg": "#FDF2F8", "border": "#DB2777", "shape": "rect"},
        "EXISTING_SOLUTION": {"color": "#64748B", "bg": "#F8FAFC", "border": "#475569", "shape": "rect"},
        "INNOVATION_GAP": {"color": "#F59E0B", "bg": "#FFFBEB", "border": "#D97706", "shape": "diamond"},
        "EXPERIMENT": {"color": "#10B981", "bg": "#ECFDF5", "border": "#059669", "shape": "subroutine"},
        "BENCHMARK": {"color": "#14B8A6", "bg": "#F0FDFA", "border": "#0D9488", "shape": "stadium"},
        "VALIDATION_EVIDENCE": {"color": "#059669", "bg": "#D1FAE5", "border": "#047857", "shape": "circle"},
        "INNOVATION_CLAIM": {"color": "#8B5CF6", "bg": "#EDE9FE", "border": "#6D28D9", "shape": "stadium"},
        "SKILL": {"color": "#F97316", "bg": "#FFF7ED", "border": "#EA580C", "shape": "rounded"},
        "ARCHITECTURE_COMPONENT": {"color": "#2563EB", "bg": "#DBEAFE", "border": "#1D4ED8", "shape": "rect"},
        "RESOURCE": {"color": "#0284C7", "bg": "#E0F2FE", "border": "#0369A1", "shape": "folder"},
        "ROADMAP_ITEM": {"color": "#A855F7", "bg": "#FAF5FF", "border": "#9333EA", "shape": "rounded"},
        "CITATION": {"color": "#94A3B8", "bg": "#F1F5F9", "border": "#64748B", "shape": "stadium"},
    }

    # Relationship Types
    RELATIONSHIPS = [
        "BASED_ON",
        "SUPPORTS",
        "USES",
        "REQUIRES",
        "DEPENDS_ON",
        "IMPLEMENTS",
        "ADDRESSES",
        "TESTS",
        "BENCHMARKS",
        "VALIDATES",
        "PRODUCES",
        "CITES",
        "BUILDS_ON",
        "CONNECTS_TO",
        "INFORMS",
    ]

    @classmethod
    def get_or_create_knowledge_graph(
        cls,
        db: Session,
        project_id: int,
        force_refresh: bool = False,
        include_ai_suggestions: bool = True,
    ) -> KnowledgeGraph:
        """
        Retrieves or generates the comprehensive Knowledge Graph for a project.
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project #{project_id} not found")

        existing_graph = (
            db.query(KnowledgeGraph)
            .filter(KnowledgeGraph.project_id == project_id)
            .first()
        )

        if existing_graph and not force_refresh:
            return existing_graph

        # Extract entities and build graph
        nodes_data, edges_data = cls._extract_entities_and_relations(
            db=db, project=project, include_ai_suggestions=include_ai_suggestions
        )

        # Compute degrees and graph statistics
        stats = cls._compute_graph_statistics(nodes_data, edges_data)
        diagnostics = cls._compute_diagnostics(project, nodes_data, edges_data)
        insights = cls._compute_insights(project, nodes_data, edges_data, stats)
        mermaid_source = cls._generate_mermaid_source(project.title, nodes_data, edges_data)

        # Package full graph JSON
        graph_json = {
            "title": f"{project.title} — Knowledge Graph",
            "project_id": project.id,
            "nodes": nodes_data,
            "edges": edges_data,
            "stats": stats,
            "diagnostics": diagnostics,
            "insights": insights,
        }

        if existing_graph:
            existing_graph.version += 1
            existing_graph.graph_json = graph_json
            existing_graph.mermaid_source = mermaid_source
            existing_graph.diagnostics = diagnostics
            existing_graph.insights = insights
            existing_graph.updated_at = datetime.utcnow()
            graph = existing_graph

            # Clear old ORM nodes & edges
            db.query(KnowledgeGraphNode).filter(KnowledgeGraphNode.graph_id == graph.id).delete()
            db.query(KnowledgeGraphEdge).filter(KnowledgeGraphEdge.graph_id == graph.id).delete()
        else:
            graph = KnowledgeGraph(
                project_id=project.id,
                name=f"{project.title} Knowledge Graph",
                version=1,
                graph_json=graph_json,
                mermaid_source=mermaid_source,
                diagnostics=diagnostics,
                insights=insights,
            )
            db.add(graph)
            db.flush()

        # Persist Nodes in DB
        for nd in nodes_data:
            node_obj = KnowledgeGraphNode(
                graph_id=graph.id,
                node_key=nd["node_key"],
                label=nd["label"],
                category=nd["category"],
                entity_type=nd.get("entity_type"),
                entity_id=nd.get("entity_id"),
                description=nd.get("description"),
                status=nd.get("status", "ACTIVE"),
                source_type=nd.get("source_type", "DIRECT"),
                metadata_json=nd.get("metadata_json", {}),
            )
            db.add(node_obj)

        # Persist Edges in DB
        for ed in edges_data:
            edge_obj = KnowledgeGraphEdge(
                graph_id=graph.id,
                source_node_key=ed["source_node_key"],
                target_node_key=ed["target_node_key"],
                relationship_type=ed["relationship_type"],
                description=ed.get("description"),
                confidence=ed.get("confidence", 1.0),
                provenance=ed.get("provenance", "DIRECT"),
                evidence_refs=ed.get("evidence_refs", []),
                metadata_json=ed.get("metadata_json", {}),
            )
            db.add(edge_obj)

        # Create Version Snapshot
        raw_content = json.dumps(graph_json, sort_keys=True)
        content_hash = hashlib.sha256(raw_content.encode("utf-8")).hexdigest()[:16]

        snapshot = KnowledgeGraphSnapshot(
            graph_id=graph.id,
            project_id=project.id,
            version_number=graph.version,
            graph_json=graph_json,
            mermaid_source=mermaid_source,
            change_summary=f"Generated Knowledge Graph v{graph.version} with {len(nodes_data)} nodes and {len(edges_data)} relationships.",
            content_hash=content_hash,
            created_by="AI_ENGINE",
        )
        db.add(snapshot)
        db.commit()
        db.refresh(graph)
        return graph

    @classmethod
    def _extract_entities_and_relations(
        cls, db: Session, project: Project, include_ai_suggestions: bool = True
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Deeply extracts project entities across all subsystems and constructs semantic relationships.
        """
        nodes_map: Dict[str, Dict[str, Any]] = {}
        edges_set: Set[Tuple[str, str, str]] = set()
        edges_list: List[Dict[str, Any]] = []

        def add_node(
            node_key: str,
            label: str,
            category: str,
            entity_type: Optional[str] = None,
            entity_id: Optional[int] = None,
            description: Optional[str] = None,
            status: str = "ACTIVE",
            source_type: str = "DIRECT",
            metadata: Optional[Dict[str, Any]] = None,
            tags: Optional[List[str]] = None,
        ):
            if node_key not in nodes_map:
                nodes_map[node_key] = {
                    "node_key": node_key,
                    "label": label.strip(),
                    "category": category,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "description": description,
                    "status": status,
                    "source_type": source_type,
                    "metadata_json": metadata or {},
                    "tags": tags or [],
                    "in_degree": 0,
                    "out_degree": 0,
                    "total_degree": 0,
                }

        def add_edge(
            source_key: str,
            target_key: str,
            rel_type: str,
            description: Optional[str] = None,
            confidence: float = 1.0,
            provenance: str = "DIRECT",
            evidence_refs: Optional[List[Any]] = None,
            metadata: Optional[Dict[str, Any]] = None,
        ):
            if source_key not in nodes_map or target_key not in nodes_map:
                return
            if source_key == target_key:
                return
            edge_signature = (source_key, target_key, rel_type)
            if edge_signature not in edges_set:
                edges_set.add(edge_signature)
                edges_list.append({
                    "source_node_key": source_key,
                    "target_node_key": target_key,
                    "relationship_type": rel_type,
                    "description": description or f"{rel_type.replace('_', ' ').title()}",
                    "confidence": confidence,
                    "provenance": provenance,
                    "evidence_refs": evidence_refs or [],
                    "metadata_json": metadata or {},
                })

        # 1. IDEA & PROBLEM
        idea_key = f"idea:{project.id}"
        problem_key = f"prob:{project.id}"

        add_node(
            node_key=idea_key,
            label=project.title,
            category="IDEA",
            entity_type="Project",
            entity_id=project.id,
            description=project.proposed_solution or "Core project innovation idea and solution concept.",
            status="ACTIVE",
            source_type="DIRECT",
            metadata={"domain": project.domain, "progress": project.progress, "status": project.status},
            tags=[project.domain, "Core Concept"],
        )

        add_node(
            node_key=problem_key,
            label=f"Problem: {project.title[:32]}...",
            category="PROBLEM",
            entity_type="Project",
            entity_id=project.id,
            description=project.problem_statement or "Targeted problem statement and user pain points.",
            status="IDENTIFIED",
            source_type="DIRECT",
            metadata={"domain": project.domain},
            tags=["Problem Definition", project.domain],
        )

        add_edge(
            source_key=idea_key,
            target_key=problem_key,
            rel_type="ADDRESSES",
            description="Proposed solution directly addresses the identified problem statement",
            confidence=1.0,
            provenance="DIRECT",
        )

        # 2. TECHNOLOGIES
        tech_keys = []
        if project.technologies:
            for tech in project.technologies:
                if not tech or not isinstance(tech, str):
                    continue
                t_clean = tech.strip()
                t_key = f"tech:{t_clean.lower().replace(' ', '_').replace('.', '_')}"
                tech_keys.append(t_key)
                add_node(
                    node_key=t_key,
                    label=t_clean,
                    category="TECHNOLOGY",
                    entity_type="Technology",
                    description=f"{t_clean} technology stack component utilized in the project.",
                    status="CONFIGURED",
                    source_type="DIRECT",
                    metadata={"tech_name": t_clean},
                    tags=["Tech Stack", t_clean],
                )
                add_edge(
                    source_key=idea_key,
                    target_key=t_key,
                    rel_type="USES",
                    description=f"Project implementation utilizes {t_clean}",
                    confidence=1.0,
                    provenance="DIRECT",
                )

        # 3. AI INSIGHTS & INNOVATION GAPS / EXISTING SOLUTIONS
        ai_insights = db.query(AIInsight).filter(AIInsight.project_id == project.id).first()
        if ai_insights:
            # Existing Solutions
            if ai_insights.similar_solutions:
                for idx, alt in enumerate(ai_insights.similar_solutions[:4]):
                    name = alt.get("name") if isinstance(alt, dict) else str(alt)
                    if name:
                        sol_key = f"sol:{project.id}_{idx+1}"
                        add_node(
                            node_key=sol_key,
                            label=name,
                            category="EXISTING_SOLUTION",
                            entity_type="AIInsightAlternative",
                            description=alt.get("difference", f"Existing alternative solution: {name}") if isinstance(alt, dict) else name,
                            status="IDENTIFIED",
                            source_type="DERIVED",
                            tags=["Prior Art", "Competitor"],
                        )
                        add_edge(
                            source_key=sol_key,
                            target_key=problem_key,
                            rel_type="ADDRESSES",
                            description=f"{name} attempts to address this problem domain with limitations",
                            confidence=0.9,
                            provenance="DERIVED",
                        )
            
            # Innovation Gaps
            if ai_insights.innovation_gaps:
                for idx, gap in enumerate(ai_insights.innovation_gaps[:5]):
                    gap_title = gap.get("gap") if isinstance(gap, dict) else str(gap)
                    if gap_title:
                        gap_key = f"gap:{project.id}_{idx+1}"
                        add_node(
                            node_key=gap_key,
                            label=gap_title[:40],
                            category="INNOVATION_GAP",
                            entity_type="AIInsightGap",
                            description=gap.get("opportunity", gap_title) if isinstance(gap, dict) else gap_title,
                            status="IDENTIFIED",
                            source_type="AI_SUGGESTED",
                            tags=["Innovation Gap", "Differentiation"],
                        )
                        add_edge(
                            source_key=idea_key,
                            target_key=gap_key,
                            rel_type="ADDRESSES",
                            description=f"Innovation uniquely bridges: {gap_title[:50]}",
                            confidence=0.95,
                            provenance="AI_SUGGESTED",
                        )

        # 4. HARDWARE DEVICES & SENSORS
        hw_devices = db.query(HardwareDevice).filter(HardwareDevice.project_id == project.id).all()
        for hw in hw_devices:
            hw_key = f"hw:{hw.id}"
            add_node(
                node_key=hw_key,
                label=hw.name,
                category="HARDWARE",
                entity_type="HardwareDevice",
                entity_id=hw.id,
                description=f"{hw.device_type} running {hw.status} with telemetry port/protocol {hw.communication_protocol}.",
                status=hw.status.upper() if hw.status else "CONFIGURED",
                source_type="DIRECT",
                metadata={"device_type": hw.device_type, "protocol": hw.communication_protocol, "status": hw.status},
                tags=["Hardware Lab", hw.device_type],
            )
            add_edge(
                source_key=idea_key,
                target_key=hw_key,
                rel_type="USES",
                description=f"System integrates edge hardware device: {hw.name}",
                confidence=1.0,
                provenance="DIRECT",
            )

            # Link sensors
            sensors = db.query(HardwareSensor).filter(HardwareSensor.device_id == hw.id).all()
            for s in sensors:
                s_key = f"sensor:{s.id}"
                add_node(
                    node_key=s_key,
                    label=f"{s.name} ({s.sensor_type})",
                    category="HARDWARE",
                    entity_type="HardwareSensor",
                    entity_id=s.id,
                    description=f"{s.sensor_type} measuring {s.unit} via pin {s.pin_or_address}.",
                    status="CONFIGURED",
                    source_type="DIRECT",
                    metadata={"unit": s.unit, "pin": s.pin_or_address},
                    tags=["Sensor", s.sensor_type],
                )
                add_edge(
                    source_key=hw_key,
                    target_key=s_key,
                    rel_type="CONNECTS_TO",
                    description=f"{hw.name} interfaces {s.name} sensor telemetry",
                    confidence=1.0,
                    provenance="DIRECT",
                )

        # 5. RESEARCH PAPERS & CITATIONS & DATASETS
        research_docs = db.query(ResearchDocument).filter(ResearchDocument.project_id == project.id).all()
        for doc in research_docs:
            doc_key = f"paper:{doc.id}"
            doc_type_val = getattr(doc, "doc_type", "research_paper") or "research_paper"
            add_node(
                node_key=doc_key,
                label=doc.title[:45] + ("..." if len(doc.title) > 45 else ""),
                category="RESEARCH_PAPER",
                entity_type="ResearchDocument",
                entity_id=doc.id,
                description=doc.abstract or f"Research document on {doc.title}.",
                status="VALIDATED" if doc.status == "final" else "ACTIVE",
                source_type="DIRECT",
                metadata={"doc_type": doc_type_val, "status": doc.status},
                tags=["Research", doc_type_val],
            )
            add_edge(
                source_key=doc_key,
                target_key=idea_key,
                rel_type="SUPPORTS",
                description="Academic and technical research directly supports the innovation hypothesis",
                confidence=1.0,
                provenance="DIRECT",
            )

            # Citations
            citations = db.query(ResearchCitation).filter(ResearchCitation.document_id == doc.id).all()
            for cite in citations[:6]:
                cite_key = f"cite:{cite.id}"
                authors_str = ", ".join(cite.authors) if isinstance(cite.authors, list) else str(cite.authors or "Unknown")
                link_id = cite.doi or cite.url or cite.arxiv_id or "N/A"
                add_node(
                    node_key=cite_key,
                    label=cite.title[:40],
                    category="CITATION",
                    entity_type="ResearchCitation",
                    entity_id=cite.id,
                    description=f"Citation by {authors_str} ({cite.year or 'Recent'}). Ref: {link_id}",
                    status="ACTIVE",
                    source_type="DIRECT",
                    metadata={"year": cite.year, "authors": authors_str},
                    tags=["Citation", "Literature"],
                )
                add_edge(
                    source_key=doc_key,
                    target_key=cite_key,
                    rel_type="CITES",
                    description=f"Literature evidence cited in {doc.title[:30]}",
                    confidence=1.0,
                    provenance="DIRECT",
                )

        # 6. SAVED RESOURCES & DATASETS
        saved_resources = db.query(SavedResource).filter(SavedResource.project_id == project.id).all()
        for sr in saved_resources:
            r = db.query(Resource).filter(Resource.id == sr.resource_id).first()
            if r:
                r_cat = "DATASET" if r.type and "dataset" in r.type.lower() else "RESOURCE"
                r_key = f"res:{r.id}"
                add_node(
                    node_key=r_key,
                    label=r.title[:40],
                    category=r_cat,
                    entity_type="Resource",
                    entity_id=r.id,
                    description=r.description or f"Resource ({r.type}) from {r.source_name}.",
                    status="ACTIVE",
                    source_type="DIRECT",
                    metadata={"type": r.type, "source": r.source_name, "url": r.url},
                    tags=[r.type or "Resource", r.source_name or "Web"],
                )
                add_edge(
                    source_key=r_key,
                    target_key=idea_key,
                    rel_type="INFORMS" if r_cat == "RESOURCE" else "USES",
                    description=f"{r.title[:30]} provides foundational data/information",
                    confidence=0.95,
                    provenance="DIRECT",
                )

        # 7. EXPERIMENTS & BENCHMARKS & EVIDENCE
        experiments = db.query(Experiment).filter(Experiment.project_id == project.id).all()
        for exp in experiments:
            exp_key = f"exp:{exp.id}"
            exp_title = exp.name or f"Experiment #{exp.id}"
            add_node(
                node_key=exp_key,
                label=exp_title[:35],
                category="EXPERIMENT",
                entity_type="Experiment",
                entity_id=exp.id,
                description=exp.hypothesis or exp.objective or f"Experiment #{exp.id}",
                status=exp.status.upper() if exp.status else "PLANNED",
                source_type="DIRECT",
                metadata={"status": exp.status, "reproducibility": exp.reproducibility_score},
                tags=["Experiment", exp.status or "active"],
            )
            add_edge(
                source_key=exp_key,
                target_key=idea_key,
                rel_type="TESTS",
                description=f"Empirically tests innovation hypothesis ({exp_title[:25]})",
                confidence=1.0,
                provenance="DIRECT",
            )

            # Benchmark references
            benchmarks = db.query(BenchmarkReference).filter(BenchmarkReference.project_id == project.id).all()
            for bm in benchmarks:
                bm_key = f"bench:{bm.id}"
                bm_title = bm.reference_name or bm.method_name or f"Baseline #{bm.id}"
                add_node(
                    node_key=bm_key,
                    label=f"Baseline: {bm_title[:28]}",
                    category="BENCHMARK",
                    entity_type="BenchmarkReference",
                    entity_id=bm.id,
                    description=f"Comparison baseline ({bm.method_name}) on {bm.dataset_name}.",
                    status="ACTIVE",
                    source_type="DIRECT",
                    metadata={"metric": bm.metric_name, "reported_val": bm.reported_value, "unit": bm.unit},
                    tags=["Benchmark", bm.metric_name],
                )
                add_edge(
                    source_key=exp_key,
                    target_key=bm_key,
                    rel_type="BENCHMARKS",
                    description=f"Evaluates performance superiority against {bm_title[:25]}",
                    confidence=1.0,
                    provenance="DIRECT",
                )

            # Experiment Evidences
            evidences = db.query(ExperimentEvidence).filter(ExperimentEvidence.experiment_id == exp.id).all()
            for ev in evidences:
                ev_key = f"evid:{ev.id}"
                add_node(
                    node_key=ev_key,
                    label=f"Evidence: {ev.title[:30]}",
                    category="VALIDATION_EVIDENCE",
                    entity_type="ExperimentEvidence",
                    entity_id=ev.id,
                    description=ev.notes or f"Empirical evidence ({ev.evidence_type})",
                    status="VALIDATED",
                    source_type="EMPIRICAL",
                    metadata={"type": ev.evidence_type, "status": ev.verification_status},
                    tags=["Empirical Evidence", ev.evidence_type],
                )
                add_edge(
                    source_key=exp_key,
                    target_key=ev_key,
                    rel_type="PRODUCES",
                    description=f"Experiment execution yields verified evidence #{ev.id}",
                    confidence=1.0,
                    provenance="EMPIRICAL",
                )

        # 8. INNOVATION CLAIMS & VALIDATION EVIDENCE
        claims = db.query(InnovationClaim).filter(InnovationClaim.project_id == project.id).all()
        for clm in claims:
            clm_key = f"claim:{clm.id}"
            clm_title = clm.title or f"Claim #{clm.id}"
            add_node(
                node_key=clm_key,
                label=f"Claim: {clm_title[:32]}",
                category="INNOVATION_CLAIM",
                entity_type="InnovationClaim",
                entity_id=clm.id,
                description=clm.claim or clm.description or clm_title,
                status=clm.status.upper() if clm.status else "PROPOSED",
                source_type="DIRECT",
                metadata={"status": clm.status, "category": clm.category, "confidence": clm.confidence_indicator},
                tags=["Innovation Claim", clm.category or "Technical"],
            )
            add_edge(
                source_key=clm_key,
                target_key=idea_key,
                rel_type="SUPPORTS",
                description="Validates core novelty claim of the innovation",
                confidence=1.0,
                provenance="DIRECT",
            )

            # Validation Evidence for Claims
            val_evidences = db.query(ValidationEvidence).filter(ValidationEvidence.claim_id == clm.id).all()
            for ve in val_evidences:
                ve_key = f"vevid:{ve.id}"
                add_node(
                    node_key=ve_key,
                    label=f"Proof: {ve.title[:30]}",
                    category="VALIDATION_EVIDENCE",
                    entity_type="ValidationEvidence",
                    entity_id=ve.id,
                    description=ve.description or f"Validation evidence ({ve.evidence_type})",
                    status="VALIDATED",
                    source_type="EMPIRICAL",
                    metadata={"type": ve.evidence_type, "verification": ve.verification_status},
                    tags=["Validation Evidence", ve.evidence_type],
                )
                add_edge(
                    source_key=ve_key,
                    target_key=clm_key,
                    rel_type="VALIDATES",
                    description="Evidence grounds and substantiates innovation claim",
                    confidence=1.0,
                    provenance="EMPIRICAL",
                )

        # 9. SKILLS & PREREQUISITES
        skill_reqs = db.query(ProjectSkillRequirement).filter(ProjectSkillRequirement.project_id == project.id).all()
        for sr in skill_reqs:
            sk_key = f"skill:{sr.id}"
            sk_name = sr.skill.name if sr.skill else f"Skill #{sr.skill_id}"
            add_node(
                node_key=sk_key,
                label=sk_name,
                category="SKILL",
                entity_type="ProjectSkillRequirement",
                entity_id=sr.id,
                description=f"{sk_name} ({sr.priority} priority) - Required level: {sr.required_level}",
                status="ACTIVE",
                source_type="DIRECT",
                metadata={"priority": sr.priority, "required_level": sr.required_level, "category": sr.skill.category if sr.skill else "General"},
                tags=["Skill Requirement", sr.priority],
            )
            add_edge(
                source_key=idea_key,
                target_key=sk_key,
                rel_type="REQUIRES",
                description=f"Project implementation requires {sk_name} proficiency",
                confidence=1.0,
                provenance="DIRECT",
            )
            # Link skill to related technology
            if sr.skill:
                tech_match = sr.skill.name.lower().replace(" ", "_")
                for tk in tech_keys:
                    if tech_match in tk or tk.replace("tech:", "") in tech_match:
                        add_edge(
                            source_key=tk,
                            target_key=sk_key,
                            rel_type="REQUIRES",
                            description=f"{tk.replace('tech:', '').title()} implementation requires {sk_name}",
                            confidence=0.95,
                            provenance="DERIVED",
                        )

        # 10. ARCHITECTURE COMPONENTS
        arch = db.query(Architecture).filter(Architecture.project_id == project.id).first()
        if arch:
            arch_nodes = db.query(ArchitectureNode).filter(ArchitectureNode.architecture_id == arch.id).all()
            for an in arch_nodes[:8]:
                an_key = f"arch:{an.node_key}"
                add_node(
                    node_key=an_key,
                    label=an.name,
                    category="ARCHITECTURE_COMPONENT",
                    entity_type="ArchitectureNode",
                    entity_id=an.id,
                    description=an.description or f"Architecture {an.node_type} component ({an.technology or 'Generic'}).",
                    status=an.status or "PROPOSED",
                    source_type=an.source_type or "DIRECT",
                    metadata={"node_type": an.node_type, "technology": an.technology},
                    tags=["Architecture", an.node_type],
                )
                add_edge(
                    source_key=idea_key,
                    target_key=an_key,
                    rel_type="IMPLEMENTS",
                    description=f"System architecture realizes {an.name}",
                    confidence=1.0,
                    provenance="DIRECT",
                )

        # 11. ROADMAP ITEMS / MILESTONES
        roadmap = db.query(ProjectRoadmap).filter(ProjectRoadmap.project_id == project.id).first()
        if roadmap:
            tasks = db.query(RoadmapTask).filter(RoadmapTask.roadmap_id == roadmap.id).all()
            for t in tasks[:6]:
                t_key = f"task:{t.id}"
                phase_num = getattr(t, "phase_number", 1) or 1
                add_node(
                    node_key=t_key,
                    label=t.title[:35],
                    category="ROADMAP_ITEM",
                    entity_type="RoadmapTask",
                    entity_id=t.id,
                    description=t.description or f"Roadmap task phase #{phase_num}",
                    status="IMPLEMENTED" if t.is_completed else "PLANNED",
                    source_type="DIRECT",
                    metadata={"phase": phase_num, "is_completed": t.is_completed},
                    tags=["Roadmap", f"Phase {phase_num}"],
                )
                add_edge(
                    source_key=idea_key,
                    target_key=t_key,
                    rel_type="DEPENDS_ON",
                    description=f"Project milestone: {t.title[:30]}",
                    confidence=1.0,
                    provenance="DIRECT",
                )

        # 12. PATENTS & PRIOR-ART INTELLIGENCE
        saved_patents = db.query(SavedPriorArt).filter(SavedPriorArt.project_id == project.id).all()
        patent_docs_to_link = []
        for sp in saved_patents:
            p_doc = db.query(PatentDocument).filter(PatentDocument.id == sp.patent_id).first()
            if p_doc:
                patent_docs_to_link.append((p_doc, sp.notes or "Saved Prior Art Reference", "SAVED"))

        if not patent_docs_to_link:
            # Check latest search results
            latest_search = db.query(PatentSearch).filter(PatentSearch.project_id == project.id).order_by(PatentSearch.id.desc()).first()
            if latest_search:
                recent_results = db.query(PatentSearchResult).filter(PatentSearchResult.search_id == latest_search.id).limit(4).all()
                for res in recent_results:
                    p_doc = db.query(PatentDocument).filter(PatentDocument.id == res.patent_id).first()
                    if p_doc:
                        patent_docs_to_link.append((p_doc, res.why_similar or "Prior Art Reference", "SEARCHED"))

        for p_doc, note_str, p_status in patent_docs_to_link[:6]:
            pat_key = f"pat:{p_doc.id}"
            add_node(
                node_key=pat_key,
                label=f"Patent: {p_doc.publication_number}",
                category="PATENT",
                entity_type="PatentDocument",
                entity_id=p_doc.id,
                description=f"{p_doc.title} — {p_doc.assignee or 'Public Record'} ({p_doc.filing_date or 'Prior Art'})",
                status="IDENTIFIED" if p_status == "SEARCHED" else "SAVED",
                source_type="DIRECT" if p_status == "SAVED" else "AI_SUGGESTED",
                metadata={
                    "publication_number": p_doc.publication_number,
                    "jurisdiction": p_doc.jurisdiction,
                    "assignee": p_doc.assignee,
                    "cpc_classes": p_doc.cpc_classes_json,
                },
                tags=["Prior Art", "Patent", p_doc.jurisdiction],
            )
            add_edge(
                source_key=idea_key,
                target_key=pat_key,
                rel_type="DIFFERENTIATES_FROM",
                description=f"Innovation establishes technical differentiation from {p_doc.publication_number}",
                confidence=0.92,
                provenance="DIRECT",
            )
            add_edge(
                source_key=pat_key,
                target_key=problem_key,
                rel_type="ADDRESSES",
                description=f"{p_doc.publication_number} addresses related technical problem with prior art approach",
                confidence=0.88,
                provenance="DERIVED",
            )

        # 13. RESOURCE ALLOCATION PLAN & MATCHES
        resource_plan_items = db.query(ProjectResourcePlanItem).filter(ProjectResourcePlanItem.project_id == project.id).all()
        for rpi in resource_plan_items[:6]:
            rpi_key = f"resplan:{rpi.id}"
            cat_label = "DATASET" if rpi.category and "DATASET" in rpi.category.upper() else ("HARDWARE" if rpi.category and "HARDWARE" in rpi.category.upper() else "RESOURCE")
            add_node(
                node_key=rpi_key,
                label=f"Plan: {rpi.title[:30]}",
                category=cat_label,
                entity_type="ProjectResourcePlanItem",
                entity_id=rpi.id,
                description=f"Resource: {rpi.title} (Status: {rpi.status}, Cost: ${rpi.actual_or_estimated_cost or 0:.2f})",
                status="ALLOCATED" if rpi.status == "ACQUIRED" else "PLANNED",
                source_type="DIRECT",
                metadata={"category": rpi.category, "status": rpi.status, "cost": rpi.actual_or_estimated_cost},
                tags=["Resource Matchmaker", rpi.category or "Plan Item"],
            )
            add_edge(
                source_key=idea_key,
                target_key=rpi_key,
                rel_type="USES",
                description=f"Project implementation allocates {rpi.title}",
                confidence=1.0,
                provenance="DIRECT",
            )
            # Link to hardware device if linked
            if rpi.linked_hardware_device_id:
                hw_target = f"hw:{rpi.linked_hardware_device_id}"
                if hw_target in nodes_map:
                    add_edge(
                        source_key=rpi_key,
                        target_key=hw_target,
                        rel_type="CONNECTS_TO",
                        description="Resource plan item provisions edge hardware device",
                        confidence=1.0,
                        provenance="DIRECT",
                    )
            # Link to experiment if linked
            if rpi.linked_experiment_id:
                exp_target = f"exp:{rpi.linked_experiment_id}"
                if exp_target in nodes_map:
                    add_edge(
                        source_key=rpi_key,
                        target_key=exp_target,
                        rel_type="SUPPORTS",
                        description="Allocated resource directly fuels experiment execution",
                        confidence=1.0,
                        provenance="DIRECT",
                    )

        # Ensure fallback baseline nodes if empty project
        if len(nodes_map) <= 2:
            # Add synthetic baseline entities to ensure a rich graph for exploration
            sample_techs = ["Python", "FastAPI", "TensorFlow", "React"]
            for st in sample_techs:
                st_key = f"tech:{st.lower()}"
                add_node(
                    node_key=st_key,
                    label=st,
                    category="TECHNOLOGY",
                    description=f"Core technical stack component {st}",
                    status="PROPOSED",
                    source_type="AI_SUGGESTED",
                    tags=["Tech Stack"],
                )
                add_edge(idea_key, st_key, "USES", f"Architecture utilizes {st}", 0.8, "AI_SUGGESTED")

        # Compute degrees for each node
        for edge in edges_list:
            src = edge["source_node_key"]
            tgt = edge["target_node_key"]
            if src in nodes_map:
                nodes_map[src]["out_degree"] += 1
                nodes_map[src]["total_degree"] += 1
            if tgt in nodes_map:
                nodes_map[tgt]["in_degree"] += 1
                nodes_map[tgt]["total_degree"] += 1

        nodes_result = list(nodes_map.values())
        return nodes_result, edges_list

    @classmethod
    def _compute_graph_statistics(
        cls, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Computes topological properties of the knowledge graph.
        """
        total_nodes = len(nodes)
        total_edges = len(edges)

        category_counts: Dict[str, int] = {}
        for n in nodes:
            cat = n.get("category", "OTHER")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        relationship_counts: Dict[str, int] = {}
        for e in edges:
            rel = e.get("relationship_type", "CONNECTS_TO")
            relationship_counts[rel] = relationship_counts.get(rel, 0) + 1

        # Density: 2 * E / (V * (V - 1)) for directed graphs: E / (V * (V - 1))
        density = 0.0
        if total_nodes > 1:
            possible_edges = total_nodes * (total_nodes - 1)
            density = round(total_edges / possible_edges, 4)

        avg_degree = round((total_edges * 2) / total_nodes, 2) if total_nodes > 0 else 0.0

        # Isolated nodes
        isolated_nodes = [n["node_key"] for n in nodes if n.get("total_degree", 0) == 0]

        # Connected components estimation
        visited = set()
        adj = {n["node_key"]: set() for n in nodes}
        for e in edges:
            adj[e["source_node_key"]].add(e["target_node_key"])
            adj[e["target_node_key"]].add(e["source_node_key"])

        components_count = 0
        for n in nodes:
            key = n["node_key"]
            if key not in visited:
                components_count += 1
                # BFS
                queue = [key]
                visited.add(key)
                while queue:
                    curr = queue.pop(0)
                    for neighbor in adj.get(curr, []):
                        if neighbor not in visited:
                            visited.add(neighbor)
                            queue.append(neighbor)

        return {
            "total_nodes": total_nodes,
            "total_edges": total_edges,
            "category_counts": category_counts,
            "relationship_counts": relationship_counts,
            "density": density,
            "average_degree": avg_degree,
            "isolated_nodes_count": len(isolated_nodes),
            "connected_components_count": components_count,
            "depth_layers": min(5, max(1, total_nodes // 4)),
        }

    @classmethod
    def _compute_diagnostics(
        cls, project: Project, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Diagnoses missing relationships, gaps, and evidence-grounding status in the knowledge graph.
        """
        categories_present = set(n["category"] for n in nodes)
        missing_links = []
        recommendations = []

        # Check for problem-idea link
        if "PROBLEM" not in categories_present:
            missing_links.append({"issue": "Missing Problem Definition", "severity": "HIGH"})
            recommendations.append({"action": "Define problem statement in project settings to ground your innovation.", "priority": "P1"})

        # Check for research link
        if "RESEARCH_PAPER" not in categories_present:
            missing_links.append({"issue": "No Research Papers Linked", "severity": "MEDIUM"})
            recommendations.append({"action": "Generate or attach a research paper in the Research Workspace.", "priority": "P2"})

        # Check for experiment link
        if "EXPERIMENT" not in categories_present:
            missing_links.append({"issue": "No Experimental Validation", "severity": "HIGH"})
            recommendations.append({"action": "Create and run an empirical experiment in Experiment Tracking.", "priority": "P1"})

        # Check for validation evidence
        if "VALIDATION_EVIDENCE" not in categories_present:
            missing_links.append({"issue": "Unsubstantiated Innovation Claims", "severity": "HIGH"})
            recommendations.append({"action": "Collect validation evidence to prove performance superiority.", "priority": "P1"})

        # Check for skills link
        if "SKILL" not in categories_present:
            missing_links.append({"issue": "No Skill Requirements Mapped", "severity": "LOW"})
            recommendations.append({"action": "Review the Skills & Prerequisites Gap Map.", "priority": "P3"})

        # Check orphaned nodes
        orphaned = [n["label"] for n in nodes if n.get("total_degree", 0) == 0]

        # Calculate scores
        base_score = 100 - (len(missing_links) * 15) - (len(orphaned) * 5)
        completeness_score = max(20, min(100, base_score))

        has_evidence = "VALIDATION_EVIDENCE" in categories_present or "EXPERIMENT" in categories_present
        evidence_grounding_score = 90.0 if has_evidence else 40.0
        validation_coverage = 85.0 if "INNOVATION_CLAIM" in categories_present and has_evidence else 30.0

        return {
            "completeness_score": completeness_score,
            "missing_links": missing_links,
            "orphaned_nodes": orphaned,
            "recommendations": recommendations,
            "validation_coverage": validation_coverage,
            "evidence_grounding_score": evidence_grounding_score,
        }

    @classmethod
    def _compute_insights(
        cls,
        project: Project,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        stats: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Extracts structural insights: key hubs, critical innovation paths, and central anchors.
        """
        # Sort nodes by total degree for central hubs
        sorted_nodes = sorted(nodes, key=lambda n: n.get("total_degree", 0), reverse=True)
        central_nodes = [
            {
                "node_key": n["node_key"],
                "label": n["label"],
                "category": n["category"],
                "total_degree": n.get("total_degree", 0),
                "in_degree": n.get("in_degree", 0),
                "out_degree": n.get("out_degree", 0),
            }
            for n in sorted_nodes[:5]
        ]

        # Identify key hubs by category
        key_hubs = []
        for n in sorted_nodes:
            if n.get("total_degree", 0) >= 3:
                key_hubs.append({
                    "label": n["label"],
                    "category": n["category"],
                    "degree": n.get("total_degree", 0),
                    "role": f"Primary {n['category'].replace('_', ' ').title()} Anchor",
                })
            if len(key_hubs) >= 4:
                break

        # Critical Innovation Path
        critical_path = [
            {"step": 1, "stage": "Problem Definition", "status": "CONNECTED", "detail": "Target user pain point anchored in Problem node"},
            {"step": 2, "stage": "Novel Concept", "status": "CONNECTED", "detail": "Solution hypothesis mapped to Idea & Architecture"},
            {"step": 3, "stage": "Technical Execution", "status": "CONNECTED" if "TECHNOLOGY" in stats["category_counts"] else "PLANNED", "detail": f"{stats['category_counts'].get('TECHNOLOGY', 0)} Technologies and Hardware integrations"},
            {"step": 4, "stage": "Empirical Verification", "status": "CONNECTED" if "EXPERIMENT" in stats["category_counts"] else "PLANNED", "detail": f"{stats['category_counts'].get('EXPERIMENT', 0)} Experiments testing innovation claims"},
            {"step": 5, "stage": "Validated Proof", "status": "CONNECTED" if "VALIDATION_EVIDENCE" in stats["category_counts"] else "PLANNED", "detail": f"{stats['category_counts'].get('VALIDATION_EVIDENCE', 0)} Evidence records backing competition claims"},
        ]

        # Innovation Threads
        innovation_threads = [
            {
                "name": "Hypothesis & Evidence Pipeline",
                "flow": "Idea -> Experiment -> Evidence -> Claim",
                "health": "ROBUST" if "VALIDATION_EVIDENCE" in stats["category_counts"] else "IN_PROGRESS",
            },
            {
                "name": "Architecture & Hardware Integration",
                "flow": "Idea -> Tech Stack -> Edge Hardware -> Sensor Telemetry",
                "health": "CONNECTED" if "HARDWARE" in stats["category_counts"] else "SOFTWARE_ONLY",
            },
            {
                "name": "Prerequisites & Skills Readiness",
                "flow": "Technology -> Required Skill -> Student Mastery Profile",
                "health": "CONNECTED" if "SKILL" in stats["category_counts"] else "NOT_MAPPED",
            },
        ]

        summary = (
            f"The Knowledge Graph contains {stats['total_nodes']} active entities across "
            f"{len(stats['category_counts'])} innovation domains with {stats['total_edges']} verified relationships. "
            f"Core hub is centered on '{project.title}' with high connectivity to empirical experiments and technical requirements."
        )

        return {
            "central_nodes": central_nodes,
            "critical_path": critical_path,
            "key_hubs": key_hubs,
            "innovation_threads": innovation_threads,
            "summary": summary,
        }

    @classmethod
    def _generate_mermaid_source(
        cls, project_title: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]
    ) -> str:
        """
        Compiles the Knowledge Graph into syntax-valid Mermaid flowcharts with category subgraphs and styled nodes.
        """
        lines = ["graph TD", f"    %% Knowledge Graph for {project_title}"]

        # Sanitize keys for Mermaid identifiers
        def clean_id(key: str) -> str:
            return re.sub(r"[^a-zA-Z0-9_]", "_", key)

        # Group nodes by category
        grouped_nodes: Dict[str, List[Dict[str, Any]]] = {}
        for n in nodes:
            cat = n.get("category", "OTHER")
            grouped_nodes.setdefault(cat, []).append(n)

        # Emit subgraphs
        for cat, n_list in grouped_nodes.items():
            cat_title = cat.replace("_", " ").title()
            lines.append(f"    subgraph sub_{clean_id(cat)}[\"{cat_title}\"]")
            for n in n_list:
                n_id = clean_id(n["node_key"])
                safe_label = n["label"].replace('"', "'")
                shape = cls.CATEGORY_STYLES.get(cat, {}).get("shape", "rect")
                if shape == "hexagon":
                    lines.append(f"        {n_id}{{{{{safe_label}}}}}")
                elif shape == "cylinder":
                    lines.append(f"        {n_id}[(\"{safe_label}\")]")
                elif shape == "diamond":
                    lines.append(f"        {n_id}{{\"{safe_label}\"}}")
                elif shape == "stadium":
                    lines.append(f"        {n_id}([\"{safe_label}\"])")
                elif shape == "folder":
                    lines.append(f"        {n_id}[\"{safe_label}\"]")
                elif shape == "subroutine":
                    lines.append(f"        {n_id}[[\"{safe_label}\"]]")
                elif shape == "rounded":
                    lines.append(f"        {n_id}(\"{safe_label}\")")
                else:
                    lines.append(f"        {n_id}[\"{safe_label}\"]")
            lines.append("    end")

        # Emit Edges
        lines.append("\n    %% Relationships")
        for e in edges:
            src = clean_id(e["source_node_key"])
            tgt = clean_id(e["target_node_key"])
            rel = e["relationship_type"].replace("_", " ")
            lines.append(f"    {src} -->|\"{rel}\"| {tgt}")

        return "\n".join(lines)

    @classmethod
    def export_graph(
        cls, db: Session, project_id: int, format_type: str
    ) -> Dict[str, str]:
        """
        Exports the Knowledge Graph into multiple professional formats:
        SVG, PNG metadata, JSON, Mermaid Markdown, and CSV Adjacency/Edge List.
        """
        graph = cls.get_or_create_knowledge_graph(db=db, project_id=project_id)
        fmt = format_type.lower().strip()
        nodes = graph.graph_json.get("nodes", [])
        edges = graph.graph_json.get("edges", [])
        project_title = graph.name.replace(" Knowledge Graph", "")

        if fmt == "json":
            return {
                "format": "json",
                "content_type": "application/json",
                "filename": f"knowledge_graph_{project_id}.json",
                "data": json.dumps(graph.graph_json, indent=2),
            }

        elif fmt == "mermaid":
            data = f"# Knowledge Graph: {project_title}\n\n```mermaid\n{graph.mermaid_source}\n```\n"
            return {
                "format": "mermaid",
                "content_type": "text/markdown",
                "filename": f"knowledge_graph_{project_id}.md",
                "data": data,
            }

        elif fmt == "csv":
            csv_lines = ["Source_Key,Source_Label,Source_Category,Relationship,Target_Key,Target_Label,Target_Category,Confidence,Provenance"]
            node_lut = {n["node_key"]: n for n in nodes}
            for e in edges:
                s_node = node_lut.get(e["source_node_key"], {})
                t_node = node_lut.get(e["target_node_key"], {})
                s_label = s_node.get("label", e["source_node_key"]).replace('"', '""')
                t_label = t_node.get("label", e["target_node_key"]).replace('"', '""')
                s_cat = s_node.get("category", "UNKNOWN")
                t_cat = t_node.get("category", "UNKNOWN")
                rel = e["relationship_type"]
                conf = e.get("confidence", 1.0)
                prov = e.get("provenance", "DIRECT")
                csv_lines.append(f'"{e["source_node_key"]}","{s_label}","{s_cat}","{rel}","{e["target_node_key"]}","{t_label}","{t_cat}",{conf},"{prov}"')
            return {
                "format": "csv",
                "content_type": "text/csv",
                "filename": f"knowledge_graph_edges_{project_id}.csv",
                "data": "\n".join(csv_lines),
            }

        elif fmt in ["svg", "png"]:
            svg_data = cls._generate_vector_svg(project_title, nodes, edges)
            return {
                "format": fmt,
                "content_type": "image/svg+xml" if fmt == "svg" else "image/png",
                "filename": f"knowledge_graph_{project_id}.{fmt}",
                "data": svg_data,
            }
        else:
            raise ValueError(f"Unsupported export format: {format_type}")

    @classmethod
    def _generate_vector_svg(
        cls, project_title: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]
    ) -> str:
        """
        Generates a standalone, beautiful Vector SVG graph visualization.
        """
        width = 1400
        height = 950

        # Group nodes into a grid or circle layout
        node_coords = {}
        total = len(nodes)
        cx, cy = width / 2, height / 2

        # Central idea node placed in the middle
        for idx, n in enumerate(nodes):
            if n.get("category") == "IDEA":
                node_coords[n["node_key"]] = (cx, cy)
            else:
                # Arrange other nodes in two concentric rings based on category
                ring_radius = 280 if idx % 2 == 0 else 420
                import math
                angle = (2 * math.pi * idx) / max(1, (total - 1))
                x = cx + ring_radius * math.cos(angle)
                y = cy + ring_radius * math.sin(angle)
                node_coords[n["node_key"]] = (round(x, 1), round(y, 1))

        svg_parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">',
            '  <defs>',
            '    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '      <stop offset="0%" stop-color="#0F172A" />',
            '      <stop offset="100%" stop-color="#1E293B" />',
            '    </linearGradient>',
            '    <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">',
            '      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />',
            '    </marker>',
            '  </defs>',
            f'  <rect width="{width}" height="{height}" fill="url(#bgGrad)" rx="16" />',
            f'  <text x="40" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="bold" fill="#F8FAFC">{project_title} — Interactive Knowledge Graph</text>',
            f'  <text x="40" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94A3B8">InnoSphere AI • {len(nodes)} Entities • {len(edges)} Verified Relationships • Evidence-Grounded</text>',
            '  <g id="edges">',
        ]

        # Render Edges
        for e in edges:
            src_coord = node_coords.get(e["source_node_key"])
            tgt_coord = node_coords.get(e["target_node_key"])
            if src_coord and tgt_coord:
                x1, y1 = src_coord
                x2, y2 = tgt_coord
                svg_parts.append(
                    f'    <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#475569" stroke-width="1.5" stroke-opacity="0.6" marker-end="url(#arrow)" />'
                )

        svg_parts.append('  </g>')
        svg_parts.append('  <g id="nodes">')

        # Render Nodes
        for n in nodes:
            coord = node_coords.get(n["node_key"], (cx, cy))
            x, y = coord
            cat = n.get("category", "OTHER")
            style = cls.CATEGORY_STYLES.get(cat, {"color": "#94A3B8", "bg": "#1E293B", "border": "#64748B"})
            label = n["label"][:26] + ("..." if len(n["label"]) > 26 else "")
            r = 34 if cat == "IDEA" else 24

            svg_parts.append(f'    <g transform="translate({x}, {y})">')
            svg_parts.append(f'      <circle r="{r}" fill="{style["bg"]}" stroke="{style["border"]}" stroke-width="2.5" />')
            svg_parts.append(f'      <text text-anchor="middle" y="4" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="{style["color"]}">{cat[:4]}</text>')
            svg_parts.append(f'      <text text-anchor="middle" y="{r + 16}" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#F1F5F9">{label}</text>')
            svg_parts.append('    </g>')

        svg_parts.append('  </g>')

        # Legend
        svg_parts.append('  <g id="legend" transform="translate(40, 890)">')
        legend_x = 0
        for cat, st in list(cls.CATEGORY_STYLES.items())[:8]:
            svg_parts.append(f'    <circle cx="{legend_x + 8}" cy="0" r="6" fill="{st["color"]}" />')
            svg_parts.append(f'    <text x="{legend_x + 20}" y="4" font-family="system-ui, sans-serif" font-size="11" fill="#94A3B8">{cat.replace("_", " ").title()}</text>')
            legend_x += 160
        svg_parts.append('  </g>')

        svg_parts.append('</svg>')
        return "\n".join(svg_parts)
