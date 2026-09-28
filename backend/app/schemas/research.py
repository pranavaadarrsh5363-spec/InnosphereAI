from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# -------------------------------------------------------------
# Citation Schemas
# -------------------------------------------------------------
class ResearchCitationCreate(BaseModel):
    title: str
    citation_key: Optional[str] = None
    authors: List[str] = []
    year: Optional[int] = None
    venue: Optional[str] = None
    publisher: Optional[str] = None
    doi: Optional[str] = None
    arxiv_id: Optional[str] = None
    openalex_id: Optional[str] = None
    url: Optional[str] = None
    source: str = "arXiv"
    resource_type: str = "research_paper"
    resource_id: Optional[int] = None
    claim_tags: List[str] = []

class ResearchCitationResponse(BaseModel):
    id: int
    document_id: int
    project_id: int
    resource_id: Optional[int] = None
    citation_key: str
    title: str
    authors: List[str] = []
    year: Optional[int] = None
    venue: Optional[str] = None
    publisher: Optional[str] = None
    doi: Optional[str] = None
    arxiv_id: Optional[str] = None
    openalex_id: Optional[str] = None
    url: Optional[str] = None
    bibtex: Optional[str] = None
    ieee_text: Optional[str] = None
    apa_text: Optional[str] = None
    source: str
    resource_type: str
    claim_tags: List[str] = []
    is_verified: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

# -------------------------------------------------------------
# Experiment Schemas (Gap -> Hypothesis -> Experiment -> Evidence)
# -------------------------------------------------------------
class ExperimentCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=250)
    hypothesis: str = Field(..., min_length=10)
    objective: str = Field(..., min_length=10)
    dataset_used: str = "WHO Potability Telemetry Benchmark"
    baseline_model: str = "Linear Logistic Regression Baseline"
    proposed_method: str = "1D-CNN + Temporal Feature Engineering"
    research_gap_title: Optional[str] = None
    parameters: Dict[str, Any] = {}
    metrics: Dict[str, Any] = {}
    results_summary: Optional[str] = ""
    status: str = "planned" # planned, running, completed, failed
    evidence_notes: Optional[str] = ""

class ExperimentUpdate(BaseModel):
    name: Optional[str] = None
    hypothesis: Optional[str] = None
    objective: Optional[str] = None
    dataset_used: Optional[str] = None
    baseline_model: Optional[str] = None
    proposed_method: Optional[str] = None
    research_gap_title: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    results_summary: Optional[str] = None
    status: Optional[str] = None
    evidence_notes: Optional[str] = None

class ExperimentResponse(BaseModel):
    id: int
    project_id: int
    research_document_id: Optional[int] = None
    research_gap_title: Optional[str] = None
    name: str
    hypothesis: str
    objective: str
    dataset_used: str
    baseline_model: str
    proposed_method: str
    parameters: Dict[str, Any] = {}
    metrics: Dict[str, Any] = {}
    results_summary: str = ""
    status: str
    evidence_notes: str = ""
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# -------------------------------------------------------------
# Research Document Schemas
# -------------------------------------------------------------
class ResearchDocumentCreate(BaseModel):
    doc_type: str = "research_paper" # research_paper, technical_report
    title: Optional[str] = None

class ResearchDocumentUpdate(BaseModel):
    title: Optional[str] = None
    doc_type: Optional[str] = None
    abstract: Optional[str] = None
    keywords: Optional[List[str]] = None
    problem_statement: Optional[str] = None
    objectives: Optional[str] = None
    related_work: Optional[str] = None
    research_gap: Optional[str] = None
    methodology: Optional[str] = None
    architecture: Optional[str] = None
    technology_stack: Optional[str] = None
    dataset_description: Optional[str] = None
    experimental_methodology: Optional[str] = None
    results: Optional[str] = None
    discussion: Optional[str] = None
    limitations: Optional[str] = None
    conclusion: Optional[str] = None
    future_work: Optional[str] = None
    status: Optional[str] = None
    version_label: Optional[str] = None
    create_new_version: bool = False

class ResearchDocumentVersionResponse(BaseModel):
    id: int
    document_id: int
    version_number: str
    version_label: str
    doc_type: str
    title: str
    content_snapshot: Dict[str, Any]
    changelog: Optional[str] = None
    created_by_user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ResearchDocumentResponse(BaseModel):
    id: int
    project_id: int
    doc_type: str
    title: str
    abstract: Optional[str] = None
    keywords: List[str] = []
    problem_statement: Optional[str] = None
    objectives: Optional[str] = None
    related_work: Optional[str] = None
    research_gap: Optional[str] = None
    methodology: Optional[str] = None
    architecture: Optional[str] = None
    technology_stack: Optional[str] = None
    dataset_description: Optional[str] = None
    experimental_methodology: Optional[str] = None
    results: Optional[str] = None
    discussion: Optional[str] = None
    limitations: Optional[str] = None
    conclusion: Optional[str] = None
    future_work: Optional[str] = None
    status: str
    version: str
    citation_coverage_pct: float = 0.0
    quality_summary: Dict[str, Any] = {}
    citations_count: int = 0
    experiments_count: int = 0
    created_at: datetime
    updated_at: datetime
    generated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# -------------------------------------------------------------
# Section Generation Request & Response
# -------------------------------------------------------------
class SectionGenerateRequest(BaseModel):
    section_key: str # abstract, related_work, methodology, dataset, etc.
    custom_instruction: Optional[str] = None
    focus_topic: Optional[str] = None

class SectionGenerateResponse(BaseModel):
    section_key: str
    content: str
    supporting_citations: List[ResearchCitationResponse] = []
    evidence_notes: List[str] = []
    generated_at: datetime

# -------------------------------------------------------------
# Quality & Evidence Reports
# -------------------------------------------------------------
class QualityFinding(BaseModel):
    vector_name: str
    status: str # READY, STRONG, NEEDS_DETAILS, INCOMPLETE, DEVELOPING, MISSING
    score: int
    findings: List[str] = []
    recommendations: List[str] = []

class ResearchQualityReport(BaseModel):
    document_id: int
    project_id: int
    overall_readiness_score: int
    readiness_label: str
    structure_quality: QualityFinding
    evidence_quality: QualityFinding
    literature_diversity: QualityFinding
    reproducibility: QualityFinding
    technical_completeness: QualityFinding
    citation_coverage_pct: float
    supported_claims_count: int
    unsupported_claims_count: int
    disclaimer: str = "Citation coverage indicator based on available project evidence."

class EvidenceMapItem(BaseModel):
    section: str
    claim_summary: str
    evidence_type: str # paper, dataset, experiment, telemetry, mentor_rubric
    source_title: str
    source_url: Optional[str] = None
    doi: Optional[str] = None
    confidence_level: str # HIGH, MEDIUM, AI_SYNTHESIS

class EvidenceMappingResponse(BaseModel):
    project_id: int
    document_id: int
    total_evidence_links: int
    evidence_items: List[EvidenceMapItem] = []

# -------------------------------------------------------------
# Export Schemas
# -------------------------------------------------------------
class LaTeXExportResponse(BaseModel):
    main_tex: str
    references_bib: str
    readme_md: str
    template_type: str = "IEEEtran"
    filename: str = "research_paper.tex"

class BibTeXExportResponse(BaseModel):
    bibtex_content: str
    total_citations: int
    filename: str = "references.bib"

class MarkdownExportResponse(BaseModel):
    markdown_content: str
    title: str
    doc_type: str
    filename: str = "paper_draft.md"

class TechnicalReportExportResponse(BaseModel):
    report_markdown: str
    total_sections: int = 19
    project_title: str
    filename: str = "technical_report.md"
