import httpx
from typing import List, Dict, Any, Optional
from app.config import settings
from app.integrations.base import BaseConnector, logger

class GitHubConnector(BaseConnector):
    def __init__(self):
        super().__init__(name="GitHub", source_type="github_repo")
        self.base_url = "https://api.github.com/search/repositories"

    async def search(self, query: str, limit: int = 10, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        try:
            headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "InnoSphere-App"}
            if settings.GITHUB_TOKEN:
                headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

            params = {
                "q": f"{query} stars:>5",
                "sort": "stars",
                "order": "desc",
                "per_page": limit
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.base_url, params=params, headers=headers)
                if response.status_code == 200:
                    items = response.json().get("items", [])
                    for repo in items:
                        name = repo.get("full_name") or repo.get("name")
                        desc = repo.get("description") or "Open source implementation and codebase."
                        url = repo.get("html_url")
                        owner = repo.get("owner", {}).get("login", "")
                        stars = repo.get("stargazers_count", 0)
                        language = repo.get("language")
                        topics = repo.get("topics", [])
                        techs = [language] if language else []
                        if topics:
                            techs.extend(topics[:3])

                        results.append(self.normalize(
                            title=name,
                            description=desc[:350] + ("..." if len(desc) > 350 else ""),
                            resource_type="github_repo",
                            source="GitHub",
                            url=url,
                            authors=[owner] if owner else ["Open Source Community"],
                            technologies=techs or ["Python", "JavaScript"],
                            domain=domain or "Software & Systems",
                            published_date=repo.get("updated_at", "2025")[:10],
                            difficulty="Intermediate",
                            is_open_source=True,
                            is_free=True,
                            metadata={"stars": stars, "forks": repo.get("forks_count", 0), "license": repo.get("license", {}).get("name") if repo.get("license") else "MIT"}
                        ))
        except Exception as e:
            logger.warning(f"GitHub connector error: {e}")
        return results
