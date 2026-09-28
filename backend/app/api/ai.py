import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.chat import ChatMessage
from app.utils.security import get_current_user
from app.utils.rate_limiter import rate_limit
from app.utils.validators import sanitize_text
from app.services.gemini_service import gemini_service
from app.services.embedding_service import embedding_service
from app.services.semantic_search_service import semantic_search_service

logger = logging.getLogger("inno_sphere.ai_api")

router = APIRouter(prefix="/ai", tags=["Google Gemini AI Engine"])

class MentorChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="Student query or problem statement")
    project_id: Optional[int] = Field(None, description="Optional active project ID for grounded context")
    context_type: Optional[str] = Field("general", description="Context type (general, architecture, literature, roadmap)")
    history: Optional[List[Dict[str, str]]] = Field(None, description="Optional recent chat history")

class MentorChatResponse(BaseModel):
    reply: str
    role: str = "assistant"
    project_id: Optional[int] = None
    model: str
    rag_citations_count: int = 0

@router.get("/status")
def get_ai_status():
    """
    Returns safe operational status and configuration of the central Gemini AI engine.
    Never exposes API keys or secrets.
    """
    is_configured = gemini_service.is_configured()
    emb_diag = embedding_service.get_diagnostics()

    return {
        "status": "operational" if is_configured else "fallback_ready",
        "provider": "google-gemini",
        "gemini_configured": is_configured,
        "gemini_model": gemini_service.model,
        "embedding_model": gemini_service.embedding_model,
        "embedding_provider": emb_diag.get("embedding_provider"),
        "dimensions": emb_diag.get("dimensions", 768),
        "vector_search_ready": emb_diag.get("vector_search_available", True),
        "timeout_seconds": gemini_service.timeout_seconds
    }

@router.post(
    "/test-connection",
    dependencies=[Depends(rate_limit(max_requests=10, category="ai_test"))]
)
async def test_gemini_connection(
    current_user: User = Depends(get_current_user)
):
    """
    Executes a live probe to Google Gemini API to test end-to-end connectivity and latency.
    Requires authenticated user.
    """
    result = await gemini_service.test_connection()
    return result

@router.post(
    "/mentor/chat",
    response_model=MentorChatResponse,
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="ai_mentor"))]
)
async def mentor_chat(
    body: MentorChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Direct endpoint for AI Mentor conversation powered by Google Gemini and RAG grounding.
    Enforces JWT authentication, project authorization (IDOR protection), and evidence retrieval.
    """
    clean_message = sanitize_text(body.message, max_length=4000)
    if not clean_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    project_ctx = None
    p_title = ""
    p_domain = "Technology"

    if body.project_id:
        proj = db.query(Project).filter(Project.id == body.project_id).first()
        if proj:
            # IDOR Check: user must own the project or be mentor/admin
            if proj.user_id != current_user.id and current_user.role not in ["mentor", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You do not have permission to access this project's AI context."
                )
            p_title = proj.title or ""
            p_domain = proj.domain or "Technology"
            project_ctx = {
                "id": proj.id,
                "title": proj.title,
                "domain": proj.domain,
                "problem_statement": proj.problem_statement,
                "proposed_solution": proj.proposed_solution,
                "status": proj.status,
                "progress": proj.progress,
                "technologies": proj.technologies or []
            }

    # Retrieve RAG Evidence from scientific literature & verified databases
    retrieved_evidence: List[Dict[str, Any]] = []
    try:
        rag_res = await semantic_search_service.search_and_rank(
            query=f"{clean_message} {p_title} {p_domain}",
            search_mode="hybrid",
            domain=p_domain if p_domain != "Technology" else None,
            limit=4,
            db=db,
            user_id=current_user.id
        )
        retrieved_evidence = rag_res.get("results", [])
    except Exception as rag_err:
        logger.warning(f"RAG retrieval during mentor chat encountered warning: {rag_err}")

    # Record User Message
    user_msg = ChatMessage(
        user_id=current_user.id,
        project_id=body.project_id,
        role="user",
        content=clean_message,
        context_data={"context_type": sanitize_text(body.context_type or "general", max_length=50)}
    )
    db.add(user_msg)
    db.flush()

    # Generate Advice via Gemini Service
    reply_text = await gemini_service.generate_mentor_advice(
        student_query=clean_message,
        project_context=project_ctx,
        retrieved_evidence=retrieved_evidence,
        chat_history=body.history
    )

    # Fallback if Gemini is not configured or fails
    if not reply_text:
        from app.services.ai_service import ai_service
        reply_text = await ai_service.chat_assistant(
            message=clean_message,
            project_context=project_ctx,
            chat_history=body.history
        )

    # Record Assistant Message
    asst_msg = ChatMessage(
        user_id=current_user.id,
        project_id=body.project_id,
        role="assistant",
        content=reply_text,
        context_data={"project_id": body.project_id, "model": gemini_service.model}
    )
    db.add(asst_msg)
    db.commit()

    return MentorChatResponse(
        reply=reply_text,
        role="assistant",
        project_id=body.project_id,
        model=gemini_service.model,
        rag_citations_count=len(retrieved_evidence)
    )
