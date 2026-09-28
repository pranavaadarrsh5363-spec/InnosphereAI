import httpx
from typing import List, Dict, Any, Optional
from app.integrations.base import BaseConnector, logger

class HuggingFaceConnector(BaseConnector):
    def __init__(self):
        super().__init__(name="HuggingFace", source_type="ai_model")
        self.base_url = "https://huggingface.co/api/models"

    async def search(self, query: str, limit: int = 10, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        try:
            params = {
                "search": query,
                "limit": limit,
                "sort": "downloads",
                "direction": -1
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.base_url, params=params)
                if response.status_code == 200:
                    models = response.json()
                    for model in models:
                        model_id = model.get("id") or model.get("modelId")
                        pipeline_tag = model.get("pipeline_tag") or "machine-learning"
                        downloads = model.get("downloads", 0)
                        likes = model.get("likes", 0)
                        tags = model.get("tags", [])

                        results.append(self.normalize(
                            title=f"HF Model: {model_id}",
                            description=f"Pretrained AI model specialized for {pipeline_tag}. Includes open weights and ready inference pipeline.",
                            resource_type="ai_model",
                            source="HuggingFace",
                            url=f"https://huggingface.co/{model_id}",
                            authors=[model_id.split('/')[0]] if '/' in model_id else ["HuggingFace Hub"],
                            technologies=["PyTorch", "Transformers", pipeline_tag],
                            domain=domain or "Artificial Intelligence",
                            published_date="2025/2026",
                            difficulty="Intermediate",
                            is_open_source=True,
                            is_free=True,
                            metadata={"downloads": downloads, "likes": likes, "pipeline_tag": pipeline_tag}
                        ))
        except Exception as e:
            logger.warning(f"HuggingFace connector error: {e}")
        return results
