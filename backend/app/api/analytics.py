from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.idea import Idea
from app.models.resource import Resource, SavedResource
from app.models.roadmap import RoadmapTask
from app.utils.security import get_optional_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Platform Metrics"])

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    total_ideas = db.query(Idea).count()
    total_resources = db.query(Resource).count()
    total_saved = db.query(SavedResource).count()
    total_users = db.query(User).count()
    
    completed_tasks = db.query(RoadmapTask).filter(RoadmapTask.is_completed == True).count()
    total_tasks = db.query(RoadmapTask).count()

    from app.models.hardware import HardwareDevice, HardwareSensor, HardwareExperiment, HardwareAlert, TelemetryRecord
    total_devices = db.query(HardwareDevice).count()
    total_sensors = db.query(HardwareSensor).count()
    total_experiments = db.query(HardwareExperiment).count()
    total_anomalies = db.query(HardwareAlert).filter(HardwareAlert.alert_level == "CRITICAL").count()
    total_telemetry_points = db.query(TelemetryRecord).count()

    # Domains breakdown
    domain_counts = db.query(Project.domain, func.count(Project.id)).group_by(Project.domain).all()
    domains_data = [{"domain": d[0], "count": d[1]} for d in domain_counts]

    # Status breakdown
    status_counts = db.query(Project.status, func.count(Project.id)).group_by(Project.status).all()
    statuses_data = [{"status": s[0], "count": s[1]} for s in status_counts]

    return {
        "metrics": {
            "resources_discovered": total_resources,
            "ideas_analyzed": total_ideas,
            "technologies_explored": len(set([t for p in db.query(Project.technologies).all() if p[0] for t in p[0]])),
            "research_sources": 8,
            "student_projects": total_projects,
            "active_innovators": total_users,
            "tasks_completed": completed_tasks,
            "total_roadmap_tasks": total_tasks,
            "hardware_devices_active": total_devices,
            "hardware_sensors_configured": total_sensors,
            "experiments_completed": total_experiments,
            "anomalies_detected": total_anomalies,
            "telemetry_packets_simulated": total_telemetry_points,
            "innovation_velocity": f"{round((completed_tasks / max(total_tasks, 1)) * 100, 1)}%"
        },
        "domain_distribution": domains_data,
        "status_distribution": statuses_data,
        "featured_technologies": [
            {"name": "PyTorch", "domain": "AI / ML", "projects_using": 48},
            {"name": "FastAPI", "domain": "Backend Systems", "projects_using": 65},
            {"name": "ESP32 / LoRaWAN", "domain": "Hardware IoT", "projects_using": 38},
            {"name": "YOLOv8 / YOLOv10", "domain": "Computer Vision", "projects_using": 32},
            {"name": "Next.js / Tailwind", "domain": "Frontend", "projects_using": 58},
            {"name": "TimescaleDB / Postgres", "domain": "Telemetry", "projects_using": 41}
        ]
    }

@router.get("/user-stats")
def get_user_stats(current_user: User = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id if current_user else 1
    user_projects = db.query(Project).filter(Project.user_id == user_id).all()
    user_ideas = db.query(Idea).filter(Idea.user_id == user_id).all()
    user_saved = db.query(SavedResource).filter(SavedResource.user_id == user_id).all()
    
    project_ids = [p.id for p in user_projects]
    total_tasks = 0
    completed_tasks = 0
    if project_ids:
        from app.models.roadmap import ProjectRoadmap
        roadmaps = db.query(RoadmapTask).join(ProjectRoadmap, RoadmapTask.roadmap_id == ProjectRoadmap.id).filter(ProjectRoadmap.project_id.in_(project_ids)).all()
        total_tasks = len(roadmaps)
        completed_tasks = sum(1 for t in roadmaps if t.is_completed)

    return {
        "ideas_count": len(user_ideas),
        "projects_count": len(user_projects),
        "saved_resources_count": len(user_saved),
        "tasks_completed": completed_tasks,
        "total_tasks": total_tasks,
        "completion_rate": round((completed_tasks / max(total_tasks, 1)) * 100, 1)
    }
