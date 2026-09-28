from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class SkillBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    prerequisites: List[str] = []
    default_learning_effort: str = "MEDIUM"


class SkillOut(SkillBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SkillRequirementOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    category: str
    required_level: str
    priority: str
    reason: Optional[str] = None
    source_type: str
    evidence_refs: List[Dict[str, Any]] = []
    prerequisites: List[str] = []
    default_learning_effort: str = "MEDIUM"

    class Config:
        from_attributes = True


class StudentSkillProfileUpdate(BaseModel):
    skill_name: str
    current_level: str # "NONE", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "NOT_SURE"
    progress_pct: Optional[int] = 0
    learning_status: Optional[str] = "NOT_STARTED"
    evidence_items: Optional[List[Dict[str, Any]]] = []
    confidence: Optional[str] = "MEDIUM"


class StudentSkillProfileBatchUpdate(BaseModel):
    profiles: List[StudentSkillProfileUpdate]


class StudentSkillProfileOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    current_level: Optional[str] = "NOT_SURE"
    progress_pct: int = 0
    learning_status: str = "NOT_STARTED"
    evidence_items: List[Dict[str, Any]] = []
    confidence: str = "MEDIUM"
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True


class PrerequisiteNodeOut(BaseModel):
    skill_name: str
    required_level: str
    current_level: Optional[str] = None
    status: str # READY, GAP, NOT_ASSESSED
    is_satisfied: bool


class SkillGapOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    category: str
    required_level: str
    current_level: Optional[str] = None
    gap_level_diff: int = 0
    gap_status: str # READY, PARTIALLY_READY, LEARNING_REQUIRED, PREREQUISITE_REQUIRED, OPTIONAL, NOT_ASSESSED
    priority: str # CRITICAL, HIGH, MEDIUM, LOW, OPTIONAL
    prerequisites_chain: List[PrerequisiteNodeOut] = []
    reason: Optional[str] = None
    learning_effort: str = "MEDIUM"
    resources_count: int = 0
    project_task_trigger: Optional[str] = None

    class Config:
        from_attributes = True


class SkillGraphNode(BaseModel):
    id: str
    label: str
    category: str
    required_level: str
    current_level: Optional[str] = None
    gap_status: str
    priority: str
    depth: int = 0


class SkillGraphEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = "prerequisite_of"


class SkillDependencyGraphOut(BaseModel):
    nodes: List[SkillGraphNode] = []
    edges: List[SkillGraphEdge] = []


class LearningResourceRef(BaseModel):
    resource_id: Optional[int] = None
    title: str
    url: Optional[str] = None
    resource_type: str # research_paper, github_repo, tutorial, dataset, documentation
    source: str # arXiv, OpenAlex, GitHub, Hugging Face, Kaggle, Docs
    why_this_resource: str
    quality_score: float = 80.0


class LearningPathItemOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    category: str
    sequence_order: int
    phase_number: int
    phase_name: str
    status: str
    estimated_effort: str
    gap_status: str
    resources: List[LearningResourceRef] = []
    project_tasks: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True


class LearningPhaseGroup(BaseModel):
    phase_number: int
    phase_name: str
    description: str
    skills_count: int
    items: List[LearningPathItemOut] = []


class LearningRoadmapOut(BaseModel):
    total_phases: int
    total_skills: int
    phases: List[LearningPhaseGroup] = []


class SkillGapSummaryOut(BaseModel):
    total_required_skills: int
    ready_count: int
    partially_ready_count: int
    learning_required_count: int
    prerequisite_required_count: int
    optional_count: int
    not_assessed_count: int
    readiness_percentage: float
    learning_path_phases_count: int
    critical_skills_count: int


class AmIReadyToStartOut(BaseModel):
    can_begin_immediately: List[str] = []
    recommended_before_development: List[str] = []
    required_before_deployment: List[str] = []
    verdict_summary: str


class TechStackSkillMappingOut(BaseModel):
    technology: str
    category: str
    required_skills: List[str]
    description: str


class ProjectSkillsAnalysisResponse(BaseModel):
    project_id: int
    project_title: str
    domain: str
    summary: SkillGapSummaryOut
    required_technologies: List[TechStackSkillMappingOut] = []
    skill_requirements: List[SkillRequirementOut] = []
    student_profile: List[StudentSkillProfileOut] = []
    skill_gaps: List[SkillGapOut] = []
    dependency_graph: SkillDependencyGraphOut
    learning_roadmap: LearningRoadmapOut
    critical_skills: List[SkillGapOut] = []
    am_i_ready: AmIReadyToStartOut
    mentor_prompts: List[str] = []
    timestamp: datetime


class RoadmapSyncResponse(BaseModel):
    success: bool
    synced_tasks_count: int
    total_roadmap_tasks: int
    roadmap_id: int
    message: str


class SkillPlanExportResponse(BaseModel):
    project_id: int
    project_title: str
    format: str # markdown, json
    content_markdown: Optional[str] = None
    json_data: Optional[Dict[str, Any]] = None
