from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import httpx
import logging

logger = logging.getLogger("integrations")

class BaseConnector(ABC):
    """Abstract base connector for external resource discovery APIs."""

    def __init__(self, name: str, source_type: str):
        self.name = name
        self.source_type = source_type

    @abstractmethod
    async def search(self, query: str, limit: int = 10, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search external API and return normalized resource items."""
        pass

    def normalize(
        self,
        title: str,
        description: str,
        resource_type: str,
        source: str,
        url: str,
        authors: Optional[List[str]] = None,
        technologies: Optional[List[str]] = None,
        domain: Optional[str] = None,
        published_date: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        difficulty: str = "Intermediate",
        is_open_source: bool = True,
        is_free: bool = True
    ) -> Dict[str, Any]:
        """Normalize external record into the standard InnoSphere schema."""
        return {
            "title": title.strip() if title else "Untitled Resource",
            "description": description.strip() if description else "No description provided.",
            "resource_type": resource_type,
            "source": source,
            "url": url,
            "authors": authors or [],
            "technologies": technologies or [],
            "domain": domain or "Technology",
            "published_date": published_date or "2025/2026",
            "difficulty": difficulty,
            "is_open_source": is_open_source,
            "is_free": is_free,
            "metadata_json": metadata or {}
        }
