import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.utils.rate_limiter import rate_limit
from app.utils.validators import sanitize_text
from app.services.preview_service import preview_service

logger = logging.getLogger("inno_sphere.preview_api")

router = APIRouter(tags=["Instant Idea Preview"])

class IdeaPreviewRequest(BaseModel):
    idea: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Raw one-line project idea or innovation hypothesis (capped at 500 characters)"
    )

class ResourceItem(BaseModel):
    title: str = Field(..., description="Title of the research paper, code repo, or dataset")
    source: str = Field(..., description="Source scientific index (e.g. arXiv, GitHub, Kaggle)")
    link: str = Field(..., description="Direct URL to resource")

class IdeaPreviewResponse(BaseModel):
    refined_summary: str = Field(..., description="2-sentence refined idea summary")
    suggested_keywords: List[str] = Field(..., description="3 suggested technical keywords")
    top_resources: List[ResourceItem] = Field(..., description="3 top resources with title, source, link")
    detected_innovation_gap: str = Field(..., description="1 detected unsolved innovation gap")
    # Aliases for flexible frontend consumption
    summary: Optional[str] = None
    keywords: Optional[List[str]] = None
    resources: Optional[List[ResourceItem]] = None
    innovation_gap: Optional[str] = None

@router.post(
    "/preview",
    response_model=IdeaPreviewResponse,
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=3600.0, category="preview"))]
)
async def preview_idea(body: IdeaPreviewRequest):
    """
    Public endpoint providing instant AI-assisted idea analysis for visitors without requiring sign-in.
    Rate limited to 5 requests per client IP per hour (capped at 500 characters).
    """
    clean_text = sanitize_text(body.idea, max_length=500)
    if not clean_text or len(clean_text.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idea description must contain at least 3 characters."
        )

    try:
        result = await preview_service.generate_preview(clean_text)
        return IdeaPreviewResponse(**result)
    except Exception as e:
        logger.error(f"Error generating idea preview: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate idea preview. Please try again."
        )
