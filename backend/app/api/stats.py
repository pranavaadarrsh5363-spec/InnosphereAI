import logging
from typing import Dict, Any, Optional, Set
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.idea import Idea
from app.models.resource import Resource, SavedResource
from app.models.experiment import Experiment
from app.models.validation import InnovationClaim
from app.models.roadmap import RoadmapTask
from app.models.hardware import HardwareDevice, HardwareExperiment

logger = logging.getLogger("inno_sphere.stats_api")

router = APIRouter(tags=["Live Platform Stats"])

ACTIVE_CONNECTORS_COUNT = 8  # arXiv, OpenAlex, Crossref, Semantic Scholar, GitHub, Hugging Face, Kaggle, USPTO

def _count_unique_technologies(db: Session) -> int:
    """Extracts genuine unique technologies recorded in the database."""
    unique_techs: Set[str] = set()
    
    # 1. Technologies from projects
    projects = db.query(Project.technologies).all()
    for (techs,) in projects:
        if isinstance(techs, list):
            for t in techs:
                if t and isinstance(t, str) and len(t.strip()) > 0:
                    unique_techs.add(t.strip().lower())

    # 2. Technologies from resources
    resources = db.query(Resource.technologies).all()
    for (techs,) in resources:
        if isinstance(techs, list):
            for t in techs:
                if t and isinstance(t, str) and len(t.strip()) > 0:
                    unique_techs.add(t.strip().lower())

    # 3. Technologies known/interested from ideas
    ideas = db.query(Idea.technologies_known, Idea.technologies_interested).all()
    for known, interested in ideas:
        if isinstance(known, list):
            for t in known:
                if t and isinstance(t, str) and len(t.strip()) > 0:
                    unique_techs.add(t.strip().lower())
        if isinstance(interested, list):
            for t in interested:
                if t and isinstance(t, str) and len(t.strip()) > 0:
                    unique_techs.add(t.strip().lower())

    return len(unique_techs)

@router.get("/stats")
def get_live_platform_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns authentic live statistics computed directly from database tables.
    Returns 0 when data is absent without applying fake floor inflation values.
    """
    total_projects = db.query(Project).count()
    total_ideas = db.query(Idea).count()
    total_resources = db.query(Resource).count()
    total_users = db.query(User).count()
    
    # Count empirical and hardware experiments
    total_experiments = db.query(Experiment).count() + db.query(HardwareExperiment).count()
    
    # Count validated claims
    total_validated_claims = db.query(InnovationClaim).filter(InnovationClaim.status.in_(["VALIDATED", "CONFIRMED"])).count()
    
    # Count unique technologies
    unique_techs_count = _count_unique_technologies(db)
    
    # Completed tasks
    completed_tasks = db.query(RoadmapTask).filter(RoadmapTask.is_completed == True).count()
    total_tasks = db.query(RoadmapTask).count()

    return {
        "success": True,
        "resources_discovered": total_resources,
        "ideas_analyzed": total_ideas,
        "student_projects": total_projects,
        "technologies_explored": unique_techs_count,
        "research_sources": ACTIVE_CONNECTORS_COUNT,
        "active_innovators": total_users,
        "experiments_recorded": total_experiments,
        "claims_validated": total_validated_claims,
        "tasks_completed": completed_tasks,
        "total_tasks": total_tasks,
        # Keep metrics object mapping for compatibility
        "metrics": {
            "resources_discovered": total_resources,
            "ideas_analyzed": total_ideas,
            "student_projects": total_projects,
            "technologies_explored": unique_techs_count,
            "research_sources": ACTIVE_CONNECTORS_COUNT,
            "active_innovators": total_users,
            "experiments_recorded": total_experiments,
            "claims_validated": total_validated_claims,
            "tasks_completed": completed_tasks,
            "total_roadmap_tasks": total_tasks
        }
    }
