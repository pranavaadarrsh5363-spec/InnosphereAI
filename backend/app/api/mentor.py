from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.chat import MentorReview
from app.schemas.chat import MentorReviewCreate, MentorReviewResponse
from app.utils.security import get_current_user, require_mentor_or_admin
from app.utils.validators import sanitize_text

router = APIRouter(prefix="/mentor", tags=["Mentor & Admin Evaluation"])

@router.get("/projects")
def get_all_student_projects(
    domain: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    if domain:
        clean_domain = sanitize_text(domain, max_length=100)
        query = query.filter(Project.domain.ilike(f"%{clean_domain}%"))
    if status:
        clean_status = sanitize_text(status, max_length=50)
        query = query.filter(Project.status == clean_status)

    projects = query.order_by(Project.updated_at.desc()).all()
    results = []
    for p in projects:
        owner = p.user
        results.append({
            "id": p.id,
            "title": p.title,
            "domain": p.domain,
            "status": p.status,
            "progress": p.progress,
            "technologies": p.technologies or [],
            "student_name": owner.full_name if owner else "Student Innovator",
            "institution": owner.profile.institution if owner and owner.profile else "NIT / University",
            "ideas_count": len(p.ideas),
            "has_roadmap": p.roadmap is not None,
            "reviews_count": len(p.reviews),
            "updated_at": p.updated_at
        })
    return results

@router.post("/review")
def submit_mentor_review(
    review_in: MentorReviewCreate,
    current_user: User = Depends(require_mentor_or_admin),
    db: Session = Depends(get_db)
):
    """
    Submits a faculty evaluation review. Protected: only verified mentors and admins can grade.
    """
    project = db.query(Project).filter(Project.id == review_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    review = MentorReview(
        project_id=review_in.project_id,
        mentor_id=current_user.id,
        feedback=sanitize_text(review_in.feedback, max_length=5000),
        rating=review_in.rating,
        strengths=[sanitize_text(s, max_length=200) for s in (review_in.strengths or [])],
        areas_for_improvement=[sanitize_text(s, max_length=200) for s in (review_in.areas_for_improvement or [])],
        recommended_technologies=[sanitize_text(s, max_length=100) for s in (review_in.recommended_technologies or [])],
        status=review_in.status or "Reviewed"
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"message": "Mentor review submitted successfully", "review_id": review.id}
