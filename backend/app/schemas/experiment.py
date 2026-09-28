from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


# -------------------------------------------------------------
# Experiment Run Schemas
# -------------------------------------------------------------
class ExperimentRunBase(BaseModel):
    run_number: int = 1
    run_label: str = "Run 1"
    random_seed: int = 42
    parameters: Dict[str, Any] = Field(default_factory=dict)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    baseline_metrics: Dict[str, Any] = Field(default_factory=dict)
    execution_time_ms: float = 0.0
    status: str = "COMPLETED" # PLANNED, RUNNING, COMPLETED, FAILED
    environment_snapshot: Dict[str, Any] = Field(default_factory=dict)
    logs_or_notes: Optional[str] = ""


class ExperimentRunCreate(ExperimentRunBase):
    pass


class ExperimentRunUpdate(BaseModel):
    run_label: Optional[str] = None
    random_seed: Optional[int] = None
    parameters: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    baseline_metrics: Optional[Dict[str, Any]] = None
    execution_time_ms: Optional[float] = None
    status: Optional[str] = None
    environment_snapshot: Optional[Dict[str, Any]] = None
    logs_or_notes: Optional[str] = None


class ExperimentRunResponse(ExperimentRunBase):
    id: int
    experiment_id: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Experiment Result Comparison Schemas
# -------------------------------------------------------------
class ExperimentResultBase(BaseModel):
    metric_name: str
    metric_type: str = "classification" # classification, regression, detection, nlp, edge_iot, hardware
    baseline_value: float
    proposed_value: float
    unit: str = "%"
    direction: str = "higher_is_better" # higher_is_better, lower_is_better
    difference: Optional[float] = None
    percentage_difference: Optional[float] = None
    comparison_label: Optional[str] = "Improved" # Improved, Similar, Lower, Higher, Not comparable, Insufficient data
    statistical_summary: Optional[Dict[str, Any]] = Field(default_factory=dict)
    source: str = "manual_entry"
    evidence_reference: Optional[str] = ""
    notes: Optional[str] = ""


class ExperimentResultCreate(ExperimentResultBase):
    pass


class ExperimentResultResponse(ExperimentResultBase):
    id: int
    experiment_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Published Benchmark Reference Schemas
# -------------------------------------------------------------
class BenchmarkReferenceBase(BaseModel):
    reference_name: str
    method_name: str
    dataset_name: str
    metric_name: str
    reported_value: float
    unit: str = "%"
    source_citation: Optional[str] = ""
    source_section_page: Optional[str] = ""
    doi: Optional[str] = None
    citation_id: Optional[int] = None
    evidence_reference: Optional[str] = ""
    is_published_reference: bool = True
    notes: Optional[str] = ""


class BenchmarkReferenceCreate(BenchmarkReferenceBase):
    experiment_id: Optional[int] = None


class BenchmarkReferenceResponse(BenchmarkReferenceBase):
    id: int
    project_id: int
    experiment_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Experiment Evidence Schemas
# -------------------------------------------------------------
class ExperimentEvidenceBase(BaseModel):
    evidence_type: str # dataset, source_paper, code_repository, hardware_telemetry, experiment_run, manual_observation, uploaded_result_file, mentor_verification
    title: str
    source_url: Optional[str] = None
    reference_id: Optional[str] = None
    verification_status: str = "SYSTEM_LOGGED"
    notes: Optional[str] = ""


class ExperimentEvidenceCreate(ExperimentEvidenceBase):
    pass


class ExperimentEvidenceResponse(ExperimentEvidenceBase):
    id: int
    experiment_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Reproducibility Checklist & Scoring Schemas
# -------------------------------------------------------------
class ReproducibilityCheckItem(BaseModel):
    key: str
    name: str
    is_recorded: bool
    detail: str
    recommendation: Optional[str] = None


class ReproducibilityReportResponse(BaseModel):
    experiment_id: int
    coverage_score: int # e.g. 8 (out of 10)
    total_checks: int = 10
    coverage_percentage: float # e.g. 80.0%
    status: str # "HIGH_COVERAGE", "MODERATE_COVERAGE", "INCOMPLETE"
    items: List[ReproducibilityCheckItem]
    summary_notes: str
    disclaimer: str = "Reproducibility coverage indicator evaluates completeness of documented variables, seeds, and datasets. It is an empirical coverage indicator, not an automated reproduction execution guarantee."


# -------------------------------------------------------------
# Core Experiment Schemas
# -------------------------------------------------------------
class ExperimentBase(BaseModel):
    name: str
    objective: str
    hypothesis: str
    independent_variables: Optional[List[str]] = Field(default_factory=list)
    dependent_variables: Optional[List[str]] = Field(default_factory=list)
    controlled_variables: Optional[List[str]] = Field(default_factory=list)
    
    dataset_used: str = "WHO Potability Telemetry"
    dataset_version: Optional[str] = "v1.0"
    dataset_source: Optional[str] = "Kaggle / OpenData"
    preprocessing_notes: Optional[str] = ""
    
    baseline_model: str = "Linear Logistic Regression Baseline"
    proposed_method: str = "Edge 1D-CNN + Timescale Temporal Features"
    model_algorithm: Optional[str] = ""
    
    hardware_environment: Optional[str] = "ESP32 Microcontroller + Host GPU"
    software_environment: Optional[str] = "Python 3.11, PyTorch 2.2, FastAPI"
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    hyperparameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    random_seed: Optional[int] = 42
    evaluation_metrics: Optional[List[str]] = Field(default_factory=list)
    
    expected_outcome: Optional[str] = ""
    actual_outcome: Optional[str] = ""
    metrics: Optional[Dict[str, Any]] = Field(default_factory=dict)
    results_summary: Optional[str] = ""
    status: Optional[str] = "PLANNED" # PLANNED, READY, RUNNING, COMPLETED, FAILED, CANCELLED
    evidence_notes: Optional[str] = ""
    is_simulated: Optional[bool] = False
    hardware_device_id: Optional[int] = None
    research_document_id: Optional[int] = None
    research_gap_id: Optional[int] = None
    research_gap_title: Optional[str] = None


class ExperimentCreate(ExperimentBase):
    pass


class ExperimentUpdate(BaseModel):
    name: Optional[str] = None
    objective: Optional[str] = None
    hypothesis: Optional[str] = None
    independent_variables: Optional[List[str]] = None
    dependent_variables: Optional[List[str]] = None
    controlled_variables: Optional[List[str]] = None
    dataset_used: Optional[str] = None
    dataset_version: Optional[str] = None
    dataset_source: Optional[str] = None
    preprocessing_notes: Optional[str] = None
    baseline_model: Optional[str] = None
    proposed_method: Optional[str] = None
    model_algorithm: Optional[str] = None
    hardware_environment: Optional[str] = None
    software_environment: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    hyperparameters: Optional[Dict[str, Any]] = None
    random_seed: Optional[int] = None
    evaluation_metrics: Optional[List[str]] = None
    expected_outcome: Optional[str] = None
    actual_outcome: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    results_summary: Optional[str] = None
    status: Optional[str] = None
    evidence_notes: Optional[str] = None
    is_simulated: Optional[bool] = None
    hardware_device_id: Optional[int] = None
    research_document_id: Optional[int] = None
    research_gap_id: Optional[int] = None
    research_gap_title: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ExperimentResponse(ExperimentBase):
    id: int
    project_id: int
    reproducibility_score: float = 0.0
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    runs_count: int = 0
    results_count: int = 0
    benchmarks_count: int = 0
    evidence_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ExperimentDetailResponse(ExperimentResponse):
    runs: List[ExperimentRunResponse] = Field(default_factory=list)
    results: List[ExperimentResultResponse] = Field(default_factory=list)
    benchmarks: List[BenchmarkReferenceResponse] = Field(default_factory=list)
    evidence_links: List[ExperimentEvidenceResponse] = Field(default_factory=list)
    reproducibility: Optional[ReproducibilityReportResponse] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Summary & Statistical Dashboards
# -------------------------------------------------------------
class ExperimentSummaryResponse(BaseModel):
    project_id: int
    total_experiments: int
    completed_count: int
    running_count: int
    planned_count: int
    failed_count: int
    avg_reproducibility_pct: float
    evidence_coverage_pct: float
    total_runs: int
    total_benchmarks: int
    hardware_experiments_count: int
    best_result: Optional[Dict[str, Any]] = None


# -------------------------------------------------------------
# Suggestion & Gap-to-Experiment Proposal Schemas
# -------------------------------------------------------------
class ExperimentSuggestionRequest(BaseModel):
    research_gap_title: Optional[str] = None
    research_gap_description: Optional[str] = None
    experiment_type: Optional[str] = "machine_learning" # machine_learning, regression, computer_vision, iot_edge, hardware


class ExperimentSuggestionResponse(BaseModel):
    name: str
    objective: str
    hypothesis: str
    baseline_model: str
    proposed_method: str
    suggested_dataset: str
    dataset_version: str
    suggested_metrics: List[str]
    suggested_parameters: Dict[str, Any]
    suggested_hyperparameters: Dict[str, Any]
    hardware_recommendations: str
    controlled_variables: List[str]
    is_ai_generated: bool = True
    notice: str = "AI-generated experiment proposal based on identified research gaps. Review and calibrate before executing."


# -------------------------------------------------------------
# CSV / JSON Import & Research Paper Sync Schemas
# -------------------------------------------------------------
class ExperimentImportRequest(BaseModel):
    format_type: str = "json" # json, csv
    raw_content: Optional[str] = None
    json_data: Optional[List[Dict[str, Any]]] = None


class ExperimentImportResponse(BaseModel):
    success: bool
    imported_metrics_count: int
    imported_runs_count: int
    created_results: List[ExperimentResultResponse]
    validation_warnings: List[str] = Field(default_factory=list)


class ExperimentSyncResearchRequest(BaseModel):
    target_doc_type: str = "research_paper" # research_paper, technical_report
    overwrite_sections: bool = False # If false, generates preview diff


class ExperimentSyncResearchResponse(BaseModel):
    project_id: int
    document_id: int
    experiments_synced_count: int
    updated_sections: List[str] # ["experimental_methodology", "results", "discussion", "limitations"]
    latex_table_preview: str
    markdown_table_preview: str
    reproducibility_summary: str
    message: str
