import asyncio
import re
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from app.integrations.arxiv import ArxivConnector
from app.integrations.openalex import OpenAlexConnector
from app.integrations.github import GitHubConnector
from app.integrations.huggingface import HuggingFaceConnector
from app.integrations.semantic_scholar import SemanticScholarConnector
from app.integrations.crossref import CrossrefConnector
from app.integrations.mock_adapter import MockAdapter
from app.services.ranking_service import RankingService
from app.models.resource import Resource, SavedResource
from app.models.project import Project

class SearchService:
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

    def extract_natural_language_concepts(self, text: str) -> Dict[str, Any]:
        """
        Extracts semantic concepts, domain entities, technological terms,
        and distilled search queries from conversational/natural language user input.
        """
        if not text:
            return {"search_queries": ["artificial intelligence"], "concepts": []}

        stop_words = {
            "i", "want", "to", "build", "develop", "create", "make", "an", "a", "the",
            "for", "in", "on", "with", "using", "by", "that", "which", "system", "platform",
            "solution", "how", "what", "is", "of", "and", "or", "project", "help", "me"
        }

        # Match multi-word domain concepts
        concept_patterns = {
            "water_borne": ["water-borne", "water borne", "water contamination", "drinking water", "potable water"],
            "disease_prediction": ["disease prediction", "outbreak prediction", "epidemiology", "early warning", "disease outbreaks"],
            "rural_health": ["rural healthcare", "rural communities", "primary healthcare", "telemedicine", "remote clinics"],
            "crop_vision": ["crop disease", "plant disease", "leaf disease", "pest detection", "agriculture vision"],
            "waste_segregation": ["waste management", "waste segregation", "recyclable sorting", "optical sorting", "landfill diversion"],
            "traffic_control": ["traffic management", "traffic signal optimization", "urban mobility", "adaptive signal", "traffic light"],
            "skill_recommendation": ["skill recommendation", "career gap", "curriculum alignment", "resume matching", "job taxonomy"],
            "iot_sensing": ["iot sensors", "sensor telemetry", "esp32", "embedded systems", "lorawan"],
            "reinforcement_learning": ["reinforcement learning", "ppo", "q-learning", "agent optimization"],
            "deep_learning": ["deep learning", "neural network", "transformers", "pytorch", "tensorflow", "yolo", "cnn"]
        }

        extracted_concepts = []
        text_lower = text.lower()

        for category, synonyms in concept_patterns.items():
            if any(syn in text_lower for syn in synonyms):
                extracted_concepts.append(synonyms[0])

        # Tokenize and filter stop words
        words = re.findall(r'\b[a-zA-Z\-]{3,}\b', text_lower)
        keywords = [w for w in words if w not in stop_words]

        # Formulate synthesized focused search queries
        queries = []
        if extracted_concepts:
            queries.append(" ".join(extracted_concepts[:3]))
        if len(keywords) >= 2:
            queries.append(" ".join(keywords[:4]))
        if not queries:
            queries.append(text[:60])

        return {
            "primary_query": queries[0],
            "fallback_query": queries[1] if len(queries) > 1 else queries[0],
            "concepts": extracted_concepts if extracted_concepts else keywords[:4]
        }

    async def search_and_rank(
        self,
        query: str,
        domain: Optional[str] = None,
        resource_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        is_open_source: Optional[bool] = None,
        is_free: Optional[bool] = None,
        min_relevance: Optional[int] = None,
        project_id: Optional[int] = None,
        db: Optional[Session] = None,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        # Fetch active project context if provided
        project = None
        idea_title = query or ""
        problem_desc = query or ""
        idea_domain = domain or ""
        techs_interested = []

        if project_id and db:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                idea_title = project.title
                problem_desc = project.problem_statement
                idea_domain = project.domain
                techs_interested = project.technologies or []

        # Natural language concept extraction
        semantic_info = self.extract_natural_language_concepts(query or idea_title or problem_desc)
        search_term = semantic_info["primary_query"]

        # Execute connectors concurrently
        tasks = []
        limit_per_source = 6
        for conn in self.connectors:
            # Check source type filtering
            if resource_type and resource_type not in ["all", ""]:
                if resource_type == "research_paper" and conn.source_type not in ["research_paper", "multi_source"]:
                    continue
                if resource_type in ["github_repo", "tool"] and conn.source_type not in ["github_repo", "multi_source"]:
                    continue
                if resource_type == "ai_model" and conn.source_type not in ["ai_model", "multi_source"]:
                    continue
            
            tasks.append(conn.search(query=search_term, limit=limit_per_source, domain=idea_domain or domain))

        results_by_source = await asyncio.gather(*tasks, return_exceptions=True)
        raw_resources = []
        for res_list in results_by_source:
            if isinstance(res_list, list):
                raw_resources.extend(res_list)

        # Fallback to Curated Adapter if live APIs are rate-limited or return few items
        if len(raw_resources) < 3:
            mock_conn = MockAdapter()
            curated = await mock_conn.search(query=search_term, limit=12, domain=domain or idea_domain)
            raw_resources.extend(curated)

        # Deduplicate and rank resources
        seen_urls = set()
        ranked_resources = []

        # Check saved resources for user if logged in
        saved_resource_ids = set()
        if user_id and db:
            saved_rows = db.query(SavedResource.resource_id).filter(SavedResource.user_id == user_id).all()
            saved_resource_ids = {r[0] for r in saved_rows}

        for item in raw_resources:
            url = item.get("url", "")
            if url in seen_urls:
                continue
            seen_urls.add(url)

            # Persist resource metadata in DB
            db_res = None
            if db:
                db_res = db.query(Resource).filter(Resource.url == url).first()
                if not db_res:
                    db_res = Resource(
                        title=item.get("title"),
                        description=item.get("description"),
                        resource_type=item.get("resource_type"),
                        source=item.get("source"),
                        url=item.get("url"),
                        authors=item.get("authors", []),
                        technologies=item.get("technologies", []),
                        domain=item.get("domain", domain or "Technology"),
                        difficulty=item.get("difficulty", "Intermediate"),
                        is_open_source=item.get("is_open_source", True),
                        is_free=item.get("is_free", True),
                        published_date=item.get("published_date"),
                        metadata_json=item.get("metadata_json", {})
                    )
                    db.add(db_res)
                    try:
                        db.commit()
                        db.refresh(db_res)
                    except Exception:
                        db.rollback()
                        db_res = db.query(Resource).filter(Resource.url == url).first()

            # Compute AI-grounded relevance score and explanation
            score, explanation = RankingService.calculate_score_and_explanation(
                resource=item,
                idea_title=idea_title,
                idea_domain=idea_domain or domain or "",
                problem_desc=problem_desc,
                technologies_interested=techs_interested
            )

            # Apply filters
            if resource_type and resource_type not in ["all", ""] and item.get("resource_type") != resource_type:
                continue
            if difficulty and difficulty not in ["all", ""] and item.get("difficulty") != difficulty:
                continue
            if is_open_source is not None and item.get("is_open_source") != is_open_source:
                continue
            if is_free is not None and item.get("is_free") != is_free:
                continue
            if min_relevance and score < min_relevance:
                continue

            res_id = db_res.id if db_res else len(ranked_resources) + 1
            is_saved = res_id in saved_resource_ids
            is_demo = item.get("source") in ["CuratedIndex", "PhysioNet / MIT", "TACO Project", "ESCO"] or not item.get("metadata_json", {}).get("is_live_api", False)

            ranked_resources.append({
                "id": res_id,
                "title": item.get("title"),
                "description": item.get("description"),
                "resource_type": item.get("resource_type"),
                "source": item.get("source"),
                "url": item.get("url"),
                "authors": item.get("authors", []),
                "technologies": item.get("technologies", []),
                "domain": item.get("domain", "Technology"),
                "difficulty": item.get("difficulty", "Intermediate"),
                "is_open_source": item.get("is_open_source", True),
                "is_free": item.get("is_free", True),
                "published_date": item.get("published_date"),
                "metadata_json": item.get("metadata_json", {}),
                "relevance_score": score,
                "relevance_explanation": explanation,
                "is_saved": is_saved,
                "is_demo": is_demo,
                "created_at": item.get("published_date", "2025-01-01"),
                "updated_at": item.get("published_date", "2025-01-01")
            })

        # Sort by relevance score descending
        ranked_resources.sort(key=lambda x: x["relevance_score"], reverse=True)
        return ranked_resources

search_service = SearchService()
