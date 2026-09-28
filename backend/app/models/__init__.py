from app.database import Base
from app.models.user import User, Profile
from app.models.project import Project
from app.models.idea import Idea
from app.models.analysis import AIAnalysis
from app.models.resource import Resource, SavedResource
from app.models.insight import AIInsight
from app.models.roadmap import ProjectRoadmap, RoadmapTask
from app.models.chat import ChatMessage, MentorReview
from app.models.hardware import HardwareDevice, HardwareSensor, TelemetryRecord, HardwareAlert, HardwareExperiment
from app.models.intelligence import ProjectIntelligenceSnapshot
from app.models.research import ResearchDocument, ResearchDocumentVersion, ResearchCitation
from app.models.experiment import Experiment, ExperimentRun, ExperimentResult, BenchmarkReference, ExperimentEvidence
from app.models.validation import InnovationClaim, ValidationEvidence, ValidationGap, CompetitionChecklistItem, ProjectCostItem, StakeholderReview
from app.models.skill import Skill, ProjectSkillRequirement, StudentSkillProfile, SkillGap, LearningPathItem
from app.models.architecture import Architecture, ArchitectureNode, ArchitectureEdge, ArchitectureVersion
from app.models.knowledge_graph import KnowledgeGraph, KnowledgeGraphNode, KnowledgeGraphEdge, KnowledgeGraphSnapshot
from app.models.patent import PatentFamily, PatentDocument, PatentClaim, PatentSearch, PatentSearchResult, SavedPriorArt, PatentOverlap
from app.models.resource_matchmaker import (
    ResourceMatchProfile,
    StudentOwnedHardware,
    StudentSkillItem,
    ProjectResourceRequirement,
    ResourceMatchRecord,
    ResourceAlternativeRecord,
    ResourceBundleRecord,
    ProjectResourcePlanItem,
)

__all__ = [
    "Base",
    "User",
    "Profile",
    "Project",
    "Idea",
    "AIAnalysis",
    "Resource",
    "SavedResource",
    "AIInsight",
    "ProjectRoadmap",
    "RoadmapTask",
    "ChatMessage",
    "MentorReview",
    "HardwareDevice",
    "HardwareSensor",
    "TelemetryRecord",
    "HardwareAlert",
    "HardwareExperiment",
    "ProjectIntelligenceSnapshot",
    "ResearchDocument",
    "ResearchDocumentVersion",
    "ResearchCitation",
    "Experiment",
    "ExperimentRun",
    "ExperimentResult",
    "BenchmarkReference",
    "ExperimentEvidence",
    "InnovationClaim",
    "ValidationEvidence",
    "ValidationGap",
    "CompetitionChecklistItem",
    "ProjectCostItem",
    "StakeholderReview",
    "Skill",
    "ProjectSkillRequirement",
    "StudentSkillProfile",
    "SkillGap",
    "LearningPathItem",
    "Architecture",
    "ArchitectureNode",
    "ArchitectureEdge",
    "ArchitectureVersion",
    "KnowledgeGraph",
    "KnowledgeGraphNode",
    "KnowledgeGraphEdge",
    "KnowledgeGraphSnapshot",
    "PatentFamily",
    "PatentDocument",
    "PatentClaim",
    "PatentSearch",
    "PatentSearchResult",
    "SavedPriorArt",
    "PatentOverlap",
    "ResourceMatchProfile",
    "StudentOwnedHardware",
    "StudentSkillItem",
    "ProjectResourceRequirement",
    "ResourceMatchRecord",
    "ResourceAlternativeRecord",
    "ResourceBundleRecord",
    "ProjectResourcePlanItem",
]
