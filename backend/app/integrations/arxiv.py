import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
from app.integrations.base import BaseConnector, logger

from app.config import settings

class ArxivConnector(BaseConnector):
    def __init__(self):
        super().__init__(name="arXiv", source_type="research_paper")
        self.base_url = "https://export.arxiv.org/api/query"

    async def search(self, query: str, limit: int = 10, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        try:
            search_query = f"all:{query}"
            params = {
                "search_query": search_query,
                "start": 0,
                "max_results": limit,
                "sortBy": "relevance",
                "sortOrder": "descending"
            }
            async with httpx.AsyncClient(timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS) as client:
                response = await client.get(self.base_url, params=params)
                if response.status_code == 200:
                    root = ET.fromstring(response.text)
                    # arXiv uses Atom namespace
                    ns = {"atom": "http://www.w3.org/2005/Atom"}
                    for entry in root.findall("atom:entry", ns):
                        title = entry.find("atom:title", ns)
                        summary = entry.find("atom:summary", ns)
                        id_elem = entry.find("atom:id", ns)
                        published = entry.find("atom:published", ns)
                        
                        authors = []
                        for author in entry.findall("atom:author", ns):
                            name = author.find("atom:name", ns)
                            if name is not None and name.text:
                                authors.append(name.text.strip())

                        title_text = title.text.replace("\n", " ").strip() if title is not None and title.text else "Research Publication"
                        summary_text = summary.text.replace("\n", " ").strip() if summary is not None and summary.text else ""
                        paper_url = id_elem.text.strip() if id_elem is not None and id_elem.text else f"https://arxiv.org/abs/{query}"
                        pub_date = published.text[:10] if published is not None and published.text else "2025"

                        results.append(self.normalize(
                            title=title_text,
                            description=summary_text[:350] + ("..." if len(summary_text) > 350 else ""),
                            resource_type="research_paper",
                            source="arXiv",
                            url=paper_url,
                            authors=authors[:4],
                            technologies=["Deep Learning", "Algorithms", "Machine Learning"],
                            domain=domain or "Computer Science",
                            published_date=pub_date,
                            difficulty="Advanced",
                            is_open_source=True,
                            is_free=True,
                            metadata={"full_summary": summary_text}
                        ))
        except Exception as e:
            logger.warning(f"arXiv connector encountered error: {e}")
        return results
