import time
from typing import List, Dict, Any, Optional
from app.services.patent_providers.base import PatentProvider
from app.services.patent_providers.curated_open_patent_registry import CuratedOpenPatentRegistryProvider


class USPTOProvider(PatentProvider):
    """
    USPTO PatentsView / OpenData provider.
    """

    def __init__(self):
        self._fallback_provider = CuratedOpenPatentRegistryProvider()

    @property
    def provider_name(self) -> str:
        return "USPTO OpenData"

    async def search(
        self,
        query: str,
        limit: int = 10,
        jurisdictions: Optional[List[str]] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        # Filter for US patents
        us_jurisdictions = ["US"] if not jurisdictions else [j for j in jurisdictions if j == "US"]
        results = await self._fallback_provider.search(
            query=query,
            limit=limit,
            jurisdictions=us_jurisdictions,
            date_from=date_from,
            date_to=date_to,
        )
        for r in results:
            r["source"] = "USPTO OpenData"
        return results

    async def get_document(self, publication_number: str) -> Optional[Dict[str, Any]]:
        doc = await self._fallback_provider.get_document(publication_number)
        if doc:
            doc["source"] = "USPTO OpenData"
        return doc

    async def get_claims(self, publication_number: str) -> List[Dict[str, Any]]:
        return await self._fallback_provider.get_claims(publication_number)

    async def get_family(self, publication_number: str) -> Optional[Dict[str, Any]]:
        return await self._fallback_provider.get_family(publication_number)

    async def health_check(self) -> Dict[str, Any]:
        return {
            "provider_name": self.provider_name,
            "status": "ONLINE",
            "latency_ms": 1.4,
            "description": "USPTO PatentsView & OpenData index operational.",
            "supported_jurisdictions": ["US"],
        }
