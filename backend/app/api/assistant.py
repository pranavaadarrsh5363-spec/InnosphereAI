from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.chat import ChatMessage
from app.schemas.chat import AssistantQueryRequest, ChatMessageResponse
from app.utils.security import get_current_user
from app.utils.rate_limiter import rate_limit
from app.utils.validators import sanitize_text
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.post(
    "/query",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="ai_assistant"))]
)
async def ask_assistant(
    body: AssistantQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_message = sanitize_text(body.message, max_length=3000)
    if not clean_message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty.")

    project_ctx = None
    if body.project_id:
        proj = db.query(Project).filter(Project.id == body.project_id).first()
        if proj:
            # Check permission: student must own project or be mentor/admin
            if proj.user_id != current_user.id and current_user.role not in ["mentor", "admin"]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this project's context.")
            project_ctx = {
                "id": proj.id,
                "title": proj.title,
                "domain": proj.domain,
                "problem_statement": proj.problem_statement,
                "proposed_solution": proj.proposed_solution,
                "status": proj.status,
                "progress": proj.progress,
                "technologies": proj.technologies
            }

    # Save user message
    user_msg = ChatMessage(
        user_id=current_user.id,
        project_id=body.project_id,
        role="user",
        content=clean_message,
        context_data={"context_type": sanitize_text(body.context_type, max_length=50) if body.context_type else "general"}
    )
    db.add(user_msg)
    db.flush()

    # Query AI Service
    reply_text = await ai_service.chat_assistant(
        message=clean_message,
        project_context=project_ctx
    )

    # Save assistant message
    asst_msg = ChatMessage(
        user_id=current_user.id,
        project_id=body.project_id,
        role="assistant",
        content=reply_text,
        context_data={"project_id": body.project_id}
    )
    db.add(asst_msg)
    db.commit()

    return {
        "reply": reply_text,
        "role": "assistant",
        "project_id": body.project_id
    }

@router.get("/history")
def get_chat_history(
    project_id: Optional[int] = None,
    limit: int = 25,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    safe_limit = min(max(1, limit), 100)
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if project_id:
        query = query.filter(ChatMessage.project_id == project_id)

    messages = query.order_by(ChatMessage.created_at.desc()).limit(safe_limit).all()
    messages = list(reversed(messages))
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at
        }
        for m in messages
    ]
