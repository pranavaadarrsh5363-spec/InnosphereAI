from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class PatentProvider(ABC):
    """
    Abstract base class for patent & prior-art search providers.
    Ensures safe, compliant, rate-limited, and traceable retrieval.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the canonical provider name."""
        pass

    @abstractmethod
    async def search(
        self,
        query: str,
        limit: int = 10,
        jurisdictions: Optional[List[str]] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Executes search against the patent provider and returns normalized document records.
        """
        pass

    @abstractmethod
    async def get_document(self, publication_number: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves full document metadata for a specific publication number.
        """
        pass

    @abstractmethod
    async def get_claims(self, publication_number: str) -> List[Dict[str, Any]]:
        """
        Retrieves claims data for a specific publication number.
        """
        pass

    @abstractmethod
    async def get_family(self, publication_number: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves patent family members and jurisdictional equivalents.
        """
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Returns provider operational health status and response latency.
        """
        pass
