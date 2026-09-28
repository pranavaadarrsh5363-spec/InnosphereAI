from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.roadmap import ProjectRoadmap, RoadmapTask
from app.schemas.roadmap import RoadmapTaskCreate, RoadmapTaskUpdate, RoadmapTaskResponse, ProjectRoadmapResponse
from app.utils.security import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/roadmaps", tags=["Roadmaps"])

@router.get("/project/{project_id}")
def get_project_roadmap(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    roadmap = project.roadmap
    if not roadmap:
        # Create empty roadmap container
        roadmap = ProjectRoadmap(project_id=project_id, title=f"10-Phase Roadmap: {project.title}")
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)

    tasks_by_phase = {}
    completed_count = 0
    total_count = len(roadmap.tasks)

    for task in roadmap.tasks:
        if task.is_completed:
            completed_count += 1
        p_num = task.phase_number
        if p_num not in tasks_by_phase:
            tasks_by_phase[p_num] = {
                "phase_number": p_num,
                "phase_name": task.phase_name,
                "description": task.description,
                "tasks": []
            }
        tasks_by_phase[p_num]["tasks"].append({
            "id": task.id,
            "title": task.title,
            "is_completed": task.is_completed,
            "deadline": task.deadline,
            "notes": task.notes,
            "priority": task.priority,
            "order_idx": task.order_idx,
            "resources_suggested": task.resources_suggested or []
        })

    completion_percentage = int((completed_count / total_count * 100)) if total_count > 0 else 0
    if roadmap.completion_percentage != completion_percentage:
        roadmap.completion_percentage = completion_percentage
        project.progress = completion_percentage
        db.commit()

    return {
        "id": roadmap.id,
        "project_id": project_id,
        "project_title": project.title,
        "completion_percentage": completion_percentage,
        "total_tasks": total_count,
        "completed_tasks": completed_count,
        "phases": list(tasks_by_phase.values())
    }

@router.put("/tasks/{task_id}")
def update_roadmap_task(
    task_id: int,
    data: RoadmapTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RoadmapTask).filter(RoadmapTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for k, v in data.dict(exclude_unset=True).items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)

    # Recalculate roadmap completion
    roadmap = task.roadmap
    total = len(roadmap.tasks)
    completed = sum(1 for t in roadmap.tasks if t.is_completed)
    pct = int((completed / total) * 100) if total > 0 else 0
    roadmap.completion_percentage = pct
    if roadmap.project:
        roadmap.project.progress = pct
    db.commit()

    return {
        "message": "Task updated successfully",
        "task_id": task.id,
        "is_completed": task.is_completed,
        "completion_percentage": pct
    }

@router.post("/tasks")
def add_custom_task(
    task_in: RoadmapTaskCreate,
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.roadmap:
        raise HTTPException(status_code=404, detail="Project or roadmap not found")

    task = RoadmapTask(
        roadmap_id=project.roadmap.id,
        phase_number=task_in.phase_number,
        phase_name=task_in.phase_name,
        title=task_in.title,
        description=task_in.description,
        is_completed=task_in.is_completed or False,
        deadline=task_in.deadline,
        notes=task_in.notes,
        priority=task_in.priority or "Medium",
        order_idx=task_in.order_idx or 99
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"message": "Custom task added to phase", "task_id": task.id}

@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(RoadmapTask).filter(RoadmapTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    roadmap = task.roadmap
    db.delete(task)
    db.commit()

    # Recalculate
    total = len(roadmap.tasks)
    completed = sum(1 for t in roadmap.tasks if t.is_completed)
    pct = int((completed / total) * 100) if total > 0 else 0
    roadmap.completion_percentage = pct
    if roadmap.project:
        roadmap.project.progress = pct
    db.commit()

    return {"message": "Task deleted successfully", "completion_percentage": pct}
