from app.integrations.base import BaseConnector
from app.integrations.arxiv import ArxivConnector
from app.integrations.openalex import OpenAlexConnector
from app.integrations.github import GitHubConnector
from app.integrations.huggingface import HuggingFaceConnector
from app.integrations.semantic_scholar import SemanticScholarConnector
from app.integrations.crossref import CrossrefConnector
from app.integrations.mock_adapter import MockAdapter

__all__ = [
    "BaseConnector",
    "ArxivConnector",
    "OpenAlexConnector",
    "GitHubConnector",
    "HuggingFaceConnector",
    "SemanticScholarConnector",
    "CrossrefConnector",
    "MockAdapter"
]
