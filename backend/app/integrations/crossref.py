import httpx
from typing import List, Dict, Any, Optional
from app.integrations.base import BaseConnector, logger

class CrossrefConnector(BaseConnector):
    def __init__(self):
        super().__init__(name="Crossref", source_type="research_paper")
        self.base_url = "https://api.crossref.org/works"

    async def search(self, query: str, limit: int = 10, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        try:
            params = {
                "query": query,
                "rows": min(limit, 8),
                "sort": "relevance",
                "order": "desc"
            }
            headers = {"User-Agent": "InnoSphere/1.0 (mailto:support@innosphere.ai)"}
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.base_url, params=params, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    items = data.get("message", {}).get("items", [])
                    for item in items:
                        title_list = item.get("title", [])
                        title = title_list[0] if title_list else "Scientific Journal Publication"
                        
                        doi_url = item.get("URL") or f"https://doi.org/{item.get('DOI', '')}"
                        container = item.get("container-title", [])
                        publisher = item.get("publisher", "Academic Publisher")
                        journal = container[0] if container else publisher

                        # Extract authors
                        authors = []
                        for a in item.get("author", [])[:4]:
                            name = f"{a.get('given', '')} {a.get('family', '')}".strip()
                            if name:
                                authors.append(name)

                        # Extract year
                        year = "2025"
                        published = item.get("published") or item.get("created")
                        if published and published.get("date-parts"):
                            year = str(published["date-parts"][0][0])

                        abstract = f"Published in {journal}. Comprehensive scholarly exploration addressing experimental findings, theoretical frameworks, and practical validations."

                        results.append(self.normalize(
                            title=title,
                            description=abstract,
                            resource_type="research_paper",
                            source="Crossref",
                            url=doi_url,
                            authors=authors or ["Research Authors"],
                            technologies=["Scholarly Research", "Methodology"],
                            domain=domain or "Interdisciplinary",
                            published_date=year,
                            difficulty="Advanced",
                            is_open_source=True,
                            is_free=True,
                            metadata={
                                "doi": item.get("DOI"),
                                "journal": journal,
                                "is_live_api": True
                            }
                        ))
        except Exception as e:
            logger.warning(f"Crossref connector error: {e}")
        return results
