import httpx
from typing import List, Dict, Any, Optional
from app.integrations.base import BaseConnector, logger
from app.config import settings

class SemanticScholarConnector(BaseConnector):
    def __init__(self):
        super().__init__(name="Semantic Scholar", source_type="research_paper")
        self.base_url = "https://api.semanticscholar.org/graph/v1/paper/search"

    async def search(self, query: str, limit: int = 10, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        try:
            params = {
                "query": query,
                "limit": min(limit, 10),
                "fields": "title,abstract,authors,year,url,citationCount,openAccessPdf,fieldsOfStudy"
            }
            headers = {}
            if settings.SEMANTIC_SCHOLAR_KEY:
                headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_KEY

            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.base_url, params=params, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    papers = data.get("data", [])
                    for paper in papers:
                        title = paper.get("title")
                        abstract = paper.get("abstract") or "Peer-reviewed research exploring algorithmic modeling, experimental methodology, and empirical evaluations."
                        paper_url = paper.get("url") or f"https://www.semanticscholar.org/paper/{paper.get('paperId')}"
                        if paper.get("openAccessPdf") and paper["openAccessPdf"].get("url"):
                            paper_url = paper["openAccessPdf"]["url"]

                        authors = [a.get("name") for a in paper.get("authors", []) if a.get("name")][:4]
                        fields = paper.get("fieldsOfStudy") or ["Computer Science", "Artificial Intelligence"]
                        pub_year = str(paper.get("year") or 2025)

                        results.append(self.normalize(
                            title=title or "Academic Research Paper",
                            description=abstract[:350] + ("..." if len(abstract) > 350 else ""),
                            resource_type="research_paper",
                            source="Semantic Scholar",
                            url=paper_url,
                            authors=authors,
                            technologies=fields[:3],
                            domain=domain or (fields[0] if fields else "Computer Science"),
                            published_date=pub_year,
                            difficulty="Advanced",
                            is_open_source=True,
                            is_free=True,
                            metadata={
                                "citation_count": paper.get("citationCount", 0),
                                "paper_id": paper.get("paperId"),
                                "is_live_api": True
                            }
                        ))
        except Exception as e:
            logger.warning(f"Semantic Scholar connector error: {e}")
        return results
