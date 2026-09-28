import httpx
from typing import List, Dict, Any, Optional
from app.integrations.base import BaseConnector, logger

class OpenAlexConnector(BaseConnector):
    def __init__(self):
        super().__init__(name="OpenAlex", source_type="research_paper")
        self.base_url = "https://api.openalex.org/works"

    async def search(self, query: str, limit: int = 10, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        try:
            params = {
                "search": query,
                "per-page": limit,
                "sort": "relevance_score:desc"
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.base_url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    works = data.get("results", [])
                    for work in works:
                        title = work.get("display_name") or work.get("title") or "Academic Paper"
                        abstract = work.get("abstract") or "Open access scientific paper exploring novel techniques and methodology."
                        doi_url = work.get("doi") or work.get("landing_page_url") or f"https://openalex.org/{work.get('id')}"
                        pub_year = str(work.get("publication_year") or 2025)
                        
                        authorships = work.get("authorships", [])
                        authors = [a.get("author", {}).get("display_name") for a in authorships if a.get("author", {}).get("display_name")][:4]

                        # Extract concept keywords as technologies
                        concepts = [c.get("display_name") for c in work.get("concepts", [])][:3]

                        results.append(self.normalize(
                            title=title,
                            description=abstract[:350] + ("..." if len(abstract) > 350 else ""),
                            resource_type="research_paper",
                            source="OpenAlex",
                            url=doi_url,
                            authors=authors,
                            technologies=concepts if concepts else ["Research", "Methodology"],
                            domain=domain or "Interdisciplinary",
                            published_date=pub_year,
                            difficulty="Advanced",
                            is_open_source=work.get("open_access", {}).get("is_oa", True),
                            is_free=True,
                            metadata={"cited_by_count": work.get("cited_by_count", 0)}
                        ))
        except Exception as e:
            logger.warning(f"OpenAlex connector error: {e}")
        return results
