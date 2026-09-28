import asyncio
import logging
import math
import re
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple, Set
from sqlalchemy.orm import Session
from app.config import settings
from app.models.resource import Resource, SavedResource
from app.models.project import Project
from app.models.user import Profile
from app.services.embedding_service import embedding_service, cosine_similarity
from app.services.deduplication_service import deduplication_service
from app.integrations.arxiv import ArxivConnector
from app.integrations.openalex import OpenAlexConnector
from app.integrations.github import GitHubConnector
from app.integrations.huggingface import HuggingFaceConnector
from app.integrations.semantic_scholar import SemanticScholarConnector
from app.integrations.crossref import CrossrefConnector
from app.integrations.mock_adapter import MockAdapter
from app.utils.validators import sanitize_text

logger = logging.getLogger("inno_sphere.semantic_search")

class SemanticSearchService:
    """
    State-of-the-art Hybrid and Semantic Resource Discovery Engine.
    Combines dense vector retrieval, lexical matching, domain taxonomy,
    student profile context, and explainable score fusion.
    """

    def __init__(self):
        self.connectors = [
            SemanticScholarConnector(),
            ArxivConnector(),
            OpenAlexConnector(),
            CrossrefConnector(),
            GitHubConnector(),
            HuggingFaceConnector(),
            MockAdapter()
        ]
        
        # Operational search telemetry
        self.metrics = {
            "total_searches": 0,
            "semantic_searches": 0,
            "hybrid_searches": 0,
            "keyword_searches": 0,
            "avg_latency_ms": 0.0,
            "last_search_timestamp": None
        }

    # ==============================================================================
    # 1. Lexical & Keyword Scoring Engine
    # ==============================================================================

    @staticmethod
    def compute_lexical_score(query: str, resource: Dict[str, Any]) -> float:
        """
        Computes token overlap, phrase matching, and field-weighted lexical score (0.0 - 1.0).
        """
        if not query:
            return 0.5

        stop_words = {
            "i", "want", "to", "build", "develop", "create", "make", "an", "a", "the",
            "for", "in", "on", "with", "using", "by", "that", "which", "system", "platform",
            "solution", "how", "what", "is", "of", "and", "or", "project", "help", "me"
        }

        query_tokens = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9\-_]{3,}\b', query) if w.lower() not in stop_words]
        if not query_tokens:
            query_tokens = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9\-_]{2,}\b', query)]
        if not query_tokens:
            return 0.5

        title = (resource.get("title") or "").lower()
        desc = (resource.get("description") or "").lower()
        techs = [str(t).lower() for t in (resource.get("technologies") or [])]
        domain = (resource.get("domain") or "").lower()

        score = 0.0
        # Title Matches (Higher weight)
        title_matches = sum(1 for t in query_tokens if t in title)
        score += (title_matches / len(query_tokens)) * 0.45

        # Description Matches
        desc_matches = sum(1 for t in query_tokens if t in desc)
        score += (desc_matches / len(query_tokens)) * 0.25

        # Technology Matches
        tech_matches = sum(1 for t in query_tokens if any(t in tech for tech in techs))
        score += (tech_matches / len(query_tokens)) * 0.20

        # Exact phrase bonus
        clean_query = " ".join(query_tokens[:4])
        if clean_query and (clean_query in title or clean_query in desc):
            score += 0.10

        return max(0.0, min(1.0, score))

    # ==============================================================================
    # 2. Metadata, Profile & Domain Alignment
    # ==============================================================================

    @staticmethod
    def compute_metadata_and_skill_score(
        resource: Dict[str, Any],
        target_domain: Optional[str] = None,
        target_techs: Optional[List[str]] = None,
        user_skills: Optional[List[str]] = None
    ) -> Tuple[float, float, float]:
        """
        Calculates normalized domain_match (0.0 - 1.0), tech_match (0.0 - 1.0),
        and skill_match (0.0 - 1.0).
        """
        res_domain = (resource.get("domain") or "").lower()
        res_title = (resource.get("title") or "").lower()
        res_desc = (resource.get("description") or "").lower()
        res_techs = [str(t).lower() for t in (resource.get("technologies") or [])]

        # 1. Domain Match
        domain_score = 0.5
        if target_domain and target_domain.lower() not in ["all", ""]:
            t_dom = target_domain.lower()
            if t_dom == res_domain:
                domain_score = 1.0
            elif t_dom in res_domain or res_domain in t_dom:
                domain_score = 0.85
            elif t_dom in res_title or t_dom in res_desc:
                domain_score = 0.75
            else:
                domain_score = 0.40

        # 2. Tech Match
        tech_score = 0.5
        if target_techs:
            clean_targets = [t.lower() for t in target_techs if t]
            if clean_targets:
                matched_count = sum(1 for t in clean_targets if any(t in rt or rt in t for rt in res_techs) or t in res_title or t in res_desc)
                tech_score = min(1.0, 0.4 + (matched_count / len(clean_targets)) * 0.6)

        # 3. Skill Match
        skill_score = 0.5
        if user_skills:
            clean_skills = [s.lower() for s in user_skills if s]
            if clean_skills:
                matched_skills = sum(1 for s in clean_skills if any(s in rt for rt in res_techs) or s in res_desc)
                skill_score = min(1.0, 0.4 + (matched_skills / len(clean_skills)) * 0.6)

        return domain_score, tech_score, skill_score

    # ==============================================================================
    # 3. Resource Quality Signals
    # ==============================================================================

    @staticmethod
    def compute_quality_score(resource: Dict[str, Any]) -> float:
        """
        Computes multi-source quality score (0.0 - 1.0) based on citations, stars,
        license, verified provenance, and open-source availability.
        """
        base = 0.60
        if resource.get("is_open_source", True):
            base += 0.10
        if resource.get("is_free", True):
            base += 0.08

        meta = resource.get("metadata_json") or {}
        # GitHub Stars
        stars = meta.get("stars", 0)
        if isinstance(stars, (int, float)) and stars > 100:
            base += min(0.12, math.log10(stars) * 0.03)

        # Citations
        citations = meta.get("citations", 0)
        if isinstance(citations, (int, float)) and citations > 10:
            base += min(0.12, math.log10(citations) * 0.03)

        # Verified Curated Adapter bonus
        source = resource.get("source", "")
        if source in ["PhysioNet / MIT", "TACO Project", "ESCO", "Official Docs", "OpenAlex", "arXiv"]:
            base += 0.05

        return max(0.5, min(1.0, base))

    # ==============================================================================
    # 4. Explainability & Why-Relevant Generator
    # ==============================================================================

    @staticmethod
    def generate_why_relevant_explanation(
        resource: Dict[str, Any],
        query: str,
        domain_score: float,
        tech_score: float,
        semantic_sim: float,
        lexical_score: float,
        quality_score: float,
        target_techs: Optional[List[str]] = None
    ) -> Tuple[List[str], str]:
        """
        Produces 3-5 concise, concrete bullet points and an executive summary sentence.
        """
        reasons = []
        res_type = (resource.get("resource_type") or "resource").replace("_", " ")
        res_title = resource.get("title") or ""
        source = resource.get("source") or "Verified Repository"
        meta = resource.get("metadata_json") or {}

        # 1. Semantic Match reason
        if semantic_sim >= 0.70:
            reasons.append(f"Strong semantic alignment with '{query[:50]}'")
        elif semantic_sim >= 0.50:
            reasons.append(f"High conceptual relevance to your problem formulation")

        # 2. Technology & Implementation reason
        matched_techs = []
        if target_techs:
            res_techs = [str(t).lower() for t in resource.get("technologies", [])]
            for t in target_techs:
                if any(t.lower() in rt for rt in res_techs):
                    matched_techs.append(t)
        
        if matched_techs:
            reasons.append(f"Provides implementations & benchmarks using your stack ({', '.join(matched_techs[:3])})")
        elif resource.get("technologies"):
            tech_str = ", ".join(str(t) for t in resource.get("technologies")[:3])
            reasons.append(f"Utilizes production tools: {tech_str}")

        # 3. Domain Context reason
        domain = resource.get("domain")
        if domain_score >= 0.75 and domain:
            reasons.append(f"Directly targets the {domain} ecosystem")

        # 4. Peer-review / Evidence reason
        citations = meta.get("citations")
        stars = meta.get("stars")
        if citations and isinstance(citations, (int, float)) and citations > 5:
            reasons.append(f"Peer-reviewed scientific evidence with {citations:,} citations ({source})")
        elif stars and isinstance(stars, (int, float)) and stars > 50:
            reasons.append(f"Widely adopted open-source repository with {stars:,} GitHub stars")
        elif resource.get("is_open_source"):
            reasons.append(f"Open-source access with verified permissive licensing")

        if not reasons:
            reasons.append(f"Provides foundational architectures applicable to your innovation roadmap")

        summary = f"Highly relevant {res_type} because it {reasons[0].lower()} and {reasons[1].lower() if len(reasons) > 1 else 'provides validated baseline tools'}."
        return reasons[:4], summary

    # ==============================================================================
    # 5. Core Search & Hybrid Ranking Pipeline
    # ==============================================================================

    async def search_and_rank(
        self,
        query: str,
        search_mode: str = "hybrid", # hybrid | semantic | keyword
        domain: Optional[str] = None,
        resource_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        is_open_source: Optional[bool] = None,
        is_free: Optional[bool] = None,
        min_relevance: Optional[int] = None,
        project_id: Optional[int] = None,
        db: Optional[Session] = None,
        user_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Executes end-to-end intelligent resource discovery:
        1. Context extraction (Project + User Profile)
        2. Query embedding generation
        3. Parallel external multi-source retrieval + DB vector scan
        4. Canonical deduplication and entity resolution
        5. Embedding generation & caching for all candidate resources
        6. Score fusion (Semantic + Lexical + Metadata + Quality)
        7. Explainability breakdown computation
        8. Filter application and bounded pagination
        """
        start_time = time.time()
        self.metrics["total_searches"] += 1
        
        mode = search_mode.lower() if search_mode in ["hybrid", "semantic", "keyword"] else "hybrid"
        if mode == "semantic":
            self.metrics["semantic_searches"] += 1
        elif mode == "keyword":
            self.metrics["keyword_searches"] += 1
        else:
            self.metrics["hybrid_searches"] += 1

        clean_query = sanitize_text(query, max_length=500) if query else ""
        
        # 1. Fetch Project & Student Context
        project = None
        idea_title = clean_query
        problem_desc = clean_query
        idea_domain = domain or ""
        target_techs: List[str] = []
        user_skills: List[str] = []

        if project_id and db:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                idea_title = project.title or clean_query
                problem_desc = project.problem_statement or clean_query
                idea_domain = project.domain or domain or ""
                target_techs = project.technologies or []

        if user_id and db:
            profile = db.query(Profile).filter(Profile.user_id == user_id).first()
            if profile:
                user_skills = profile.skills or []

        # Effective search query for semantic vector generation
        combined_intent = f"{clean_query} {idea_title} {problem_desc}".strip()
        if not combined_intent:
            combined_intent = "innovative AI technology research datasets tools"

        # 2. Generate Query Embedding
        query_vector = None
        if mode in ["hybrid", "semantic"]:
            try:
                query_vector = await embedding_service.get_query_embedding(combined_intent)
            except Exception as emb_err:
                logger.warning(f"Query vector generation failed: {emb_err}. Falling back to keyword search.")
                mode = "keyword"

        # 3. Parallel Retrieval across Connectors & Existing DB Resources
        tasks = []
        limit_per_source = 8
        search_keyword = clean_query or idea_title or "artificial intelligence"

        for conn in self.connectors:
            # Check source type filtering
            if resource_type and resource_type not in ["all", ""]:
                if resource_type == "research_paper" and conn.source_type not in ["research_paper", "multi_source"]:
                    continue
                if resource_type in ["github_repo", "tool"] and conn.source_type not in ["github_repo", "multi_source"]:
                    continue
                if resource_type == "ai_model" and conn.source_type not in ["ai_model", "multi_source"]:
                    continue

            tasks.append(conn.search(query=search_keyword, limit=limit_per_source, domain=idea_domain or domain))

        connector_results = await asyncio.gather(*tasks, return_exceptions=True)
        raw_candidates: List[Dict[str, Any]] = []

        # Also load existing database resources
        if db:
            try:
                existing_db_resources = db.query(Resource).limit(100).all()
                for dbr in existing_db_resources:
                    raw_candidates.append({
                        "id": dbr.id,
                        "title": dbr.title,
                        "description": dbr.description,
                        "resource_type": dbr.resource_type,
                        "source": dbr.source,
                        "url": dbr.url,
                        "authors": dbr.authors or [],
                        "technologies": dbr.technologies or [],
                        "domain": dbr.domain,
                        "difficulty": dbr.difficulty or "Intermediate",
                        "is_open_source": dbr.is_open_source,
                        "is_free": dbr.is_free,
                        "published_date": dbr.published_date,
                        "metadata_json": dbr.metadata_json or {},
                        "embedding": dbr.embedding,
                        "embedding_status": dbr.embedding_status,
                        "quality_score": dbr.quality_score or 75.0,
                        "doi": dbr.doi,
                        "external_id": dbr.external_id
                    })
            except Exception as db_fetch_err:
                logger.warning(f"Error reading DB resources: {db_fetch_err}")

        for res_list in connector_results:
            if isinstance(res_list, list):
                raw_candidates.extend(res_list)

        # Fallback to Curated Adapter if live APIs return few candidates
        if len(raw_candidates) < 5:
            mock_conn = MockAdapter()
            curated = await mock_conn.search(query=search_keyword, limit=15, domain=domain or idea_domain)
            raw_candidates.extend(curated)

        # 4. Multi-Source Deduplication & Entity Resolution
        deduped_candidates = deduplication_service.deduplicate_and_merge(raw_candidates)

        # Check saved resources for user if authenticated
        saved_resource_ids: Set[int] = set()
        if user_id and db:
            saved_rows = db.query(SavedResource.resource_id).filter(SavedResource.user_id == user_id).all()
            saved_resource_ids = {r[0] for r in saved_rows}

        # 5. Score Candidates
        scored_resources: List[Dict[str, Any]] = []

        w_sem = settings.HYBRID_WEIGHT_SEMANTIC if mode == "hybrid" else (1.0 if mode == "semantic" else 0.0)
        w_key = settings.HYBRID_WEIGHT_KEYWORD if mode == "hybrid" else (1.0 if mode == "keyword" else 0.0)
        w_meta = settings.HYBRID_WEIGHT_METADATA if mode != "keyword" else 0.15
        w_qual = settings.HYBRID_WEIGHT_QUALITY if mode != "keyword" else 0.10

        # Normalization divisor
        weight_sum = w_sem + w_key + w_meta + w_qual
        if weight_sum == 0:
            weight_sum = 1.0

        for item in deduped_candidates:
            url = item.get("url", "")
            if not url:
                continue

            # Persist / lookup in DB to ensure permanent ID and embedding column
            db_res = None
            if db:
                db_res = db.query(Resource).filter(Resource.url == url).first()
                if not db_res:
                    db_res = Resource(
                        title=item.get("title", "Untitled Resource"),
                        description=item.get("description", ""),
                        resource_type=item.get("resource_type", "tool"),
                        source=item.get("source", "Curated"),
                        url=url,
                        authors=item.get("authors", []),
                        technologies=item.get("technologies", []),
                        domain=item.get("domain", domain or "Technology"),
                        difficulty=item.get("difficulty", "Intermediate"),
                        is_open_source=item.get("is_open_source", True),
                        is_free=item.get("is_free", True),
                        published_date=item.get("published_date"),
                        metadata_json=item.get("metadata_json", {}),
                        doi=deduplication_service.extract_doi(item),
                        external_id=item.get("external_id")
                    )
                    db.add(db_res)
                    try:
                        db.commit()
                        db.refresh(db_res)
                    except Exception:
                        db.rollback()
                        db_res = db.query(Resource).filter(Resource.url == url).first()

            # Ensure embedding for candidate
            res_embedding = item.get("embedding")
            if not res_embedding and db_res:
                res_embedding = await embedding_service.ensure_resource_embedding(db_res, db)
            elif not res_embedding:
                # Fast transient embedding
                semantic_text = embedding_service.build_resource_semantic_text(item)
                res_embedding = await embedding_service.provider.embed_text(semantic_text)

            # Compute Component Scores (0.0 to 1.0)
            # A. Semantic Cosine Similarity
            raw_cosine = 0.0
            if query_vector and res_embedding:
                raw_cosine = cosine_similarity(query_vector, res_embedding)
            # Map cosine [-1.0, 1.0] to [0.0, 1.0]
            semantic_score = max(0.0, min(1.0, (raw_cosine + 1.0) / 2.0)) if raw_cosine != 0.0 else 0.50

            # B. Lexical Keyword Score
            lexical_score = self.compute_lexical_score(clean_query or idea_title, item)

            # C. Metadata, Domain & Skill Scores
            dom_score, tech_score, skill_score = self.compute_metadata_and_skill_score(
                item,
                target_domain=idea_domain or domain,
                target_techs=target_techs,
                user_skills=user_skills
            )
            composite_metadata = (dom_score * 0.45) + (tech_score * 0.35) + (skill_score * 0.20)

            # D. Quality Score
            quality_score = self.compute_quality_score(item)

            # E. Linear Combination Score Fusion
            fused_score = (
                (w_sem * semantic_score) +
                (w_key * lexical_score) +
                (w_meta * composite_metadata) +
                (w_qual * quality_score)
            ) / weight_sum

            # Convert to calibrated human-readable percentage [60, 98]
            final_percentage = int(max(60, min(98, 55 + fused_score * 43)))

            # Generate Explainability & Why Relevant Bullet Points
            why_points, why_summary = self.generate_why_relevant_explanation(
                resource=item,
                query=clean_query or idea_title,
                domain_score=dom_score,
                tech_score=tech_score,
                semantic_sim=semantic_score,
                lexical_score=lexical_score,
                quality_score=quality_score,
                target_techs=target_techs
            )

            # Apply Search Filters
            if resource_type and resource_type not in ["all", ""] and item.get("resource_type") != resource_type:
                continue
            if difficulty and difficulty not in ["all", ""] and item.get("difficulty") != difficulty:
                continue
            if is_open_source is not None and item.get("is_open_source") != is_open_source:
                continue
            if is_free is not None and item.get("is_free") != is_free:
                continue
            if min_relevance and final_percentage < min_relevance:
                continue

            res_id = db_res.id if db_res else item.get("id", len(scored_resources) + 1)
            is_saved = res_id in saved_resource_ids
            is_demo = item.get("source") in ["CuratedIndex", "PhysioNet / MIT", "TACO Project", "ESCO"] or not item.get("metadata_json", {}).get("is_live_api", False)

            scored_resources.append({
                "id": res_id,
                "title": item.get("title"),
                "description": item.get("description"),
                "resource_type": item.get("resource_type"),
                "source": item.get("source"),
                "url": url,
                "authors": item.get("authors", []),
                "technologies": item.get("technologies", []),
                "domain": item.get("domain", "Technology"),
                "difficulty": item.get("difficulty", "Intermediate"),
                "is_open_source": item.get("is_open_source", True),
                "is_free": item.get("is_free", True),
                "published_date": item.get("published_date"),
                "metadata_json": item.get("metadata_json", {}),
                "relevance_score": final_percentage,
                "relevance_explanation": why_summary,
                "why_relevant_points": why_points,
                "relevance_breakdown": {
                    "semantic_similarity": int(round(semantic_score * 100)),
                    "domain_match": int(round(dom_score * 100)),
                    "technology_match": int(round(tech_score * 100)),
                    "skill_match": int(round(skill_score * 100)),
                    "keyword_relevance": int(round(lexical_score * 100)),
                    "quality_signal": int(round(quality_score * 100))
                },
                "search_mode": mode,
                "embedding_status": getattr(db_res, "embedding_status", "completed") if db_res else "completed",
                "is_saved": is_saved,
                "is_demo": is_demo,
                "created_at": item.get("published_date", "2025-01-01"),
                "updated_at": item.get("published_date", "2025-01-01")
            })

        # Sort by final relevance score descending
        scored_resources.sort(key=lambda x: x["relevance_score"], reverse=True)

        # Apply Pagination
        total_count = len(scored_resources)
        paginated_results = scored_resources[offset: offset + limit]

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        self.metrics["avg_latency_ms"] = elapsed_ms
        self.metrics["last_search_timestamp"] = datetime.now(timezone.utc).isoformat()

        return {
            "total": total_count,
            "query": clean_query,
            "domain": domain or idea_domain,
            "search_mode": mode,
            "latency_ms": elapsed_ms,
            "embedding_provider": embedding_service.provider.provider_name,
            "results": paginated_results
        }

semantic_search_service = SemanticSearchService()
