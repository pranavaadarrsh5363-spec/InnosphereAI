from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Experiment(Base):
    __tablename__ = "project_experiments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    research_document_id = Column(Integer, ForeignKey("research_documents.id", ondelete="SET NULL"), nullable=True, index=True)
    research_gap_id = Column(Integer, nullable=True, index=True)
    research_gap_title = Column(String, nullable=True)
    
    name = Column(String, nullable=False) # e.g. "1D-CNN vs Baseline Anomaly Classification"
    objective = Column(Text, nullable=False)
    hypothesis = Column(Text, nullable=False)
    
    # Controlled Experiment Variables
    independent_variables = Column(JSON, default=list) # e.g. ["model_architecture", "window_size"]
    dependent_variables = Column(JSON, default=list) # e.g. ["accuracy", "f1_score", "latency_ms"]
    controlled_variables = Column(JSON, default=list) # e.g. ["dataset_split=80/10/10", "seed=42"]
    
    # Dataset & Environment Configuration
    dataset_used = Column(String, nullable=False, default="WHO Potability Telemetry")
    dataset_version = Column(String, default="v1.0")
    dataset_source = Column(String, default="Kaggle / OpenData")
    preprocessing_notes = Column(Text, default="")
    
    baseline_model = Column(String, nullable=False, default="Linear Logistic Regression Baseline")
    proposed_method = Column(String, nullable=False, default="Edge 1D-CNN + Timescale Temporal Features")
    model_algorithm = Column(String, default="")
    
    hardware_environment = Column(String, default="ESP32 Microcontroller + Host GPU")
    software_environment = Column(String, default="Python 3.11, PyTorch 2.2, FastAPI")
    parameters = Column(JSON, default=dict)
    hyperparameters = Column(JSON, default=dict) # e.g. {"lr": 0.001, "batch_size": 32, "epochs": 50, "optimizer": "AdamW"}
    random_seed = Column(Integer, default=42)
    evaluation_metrics = Column(JSON, default=list) # ["accuracy", "precision", "recall", "f1_score", "latency_ms"]
    
    expected_outcome = Column(Text, default="")
    actual_outcome = Column(Text, default="")
    metrics = Column(JSON, default=dict) # Legacy & direct dictionary access
    results_summary = Column(Text, default="")
    
    status = Column(String, default="PLANNED", index=True) # PLANNED, READY, RUNNING, COMPLETED, FAILED, CANCELLED
    evidence_notes = Column(Text, default="")
    
    # Hardware & Telemetry Integration
    is_simulated = Column(Boolean, default=False)
    hardware_device_id = Column(Integer, ForeignKey("hardware_devices.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Reproducibility Coverage Indicator (0-100% and 10-point checklist)
    reproducibility_score = Column(Float, default=0.0)
    reproducibility_checklist = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    def __init__(self, **kwargs):
        if "title" in kwargs and "name" not in kwargs:
            kwargs["name"] = kwargs.pop("title")
        elif "title" in kwargs:
            kwargs.pop("title")
        super().__init__(**kwargs)

    @property
    def title(self):
        return self.name

    @title.setter
    def title(self, value):
        self.name = value

    # Relationships
    project = relationship("Project", back_populates="experiments")
    research_document = relationship("ResearchDocument", back_populates="experiments")
    runs = relationship("ExperimentRun", back_populates="experiment", cascade="all, delete-orphan", order_by="ExperimentRun.run_number.asc()")
    results = relationship("ExperimentResult", back_populates="experiment", cascade="all, delete-orphan", order_by="ExperimentResult.id.asc()")
    benchmarks = relationship("BenchmarkReference", back_populates="experiment")
    evidence_links = relationship("ExperimentEvidence", back_populates="experiment", cascade="all, delete-orphan")
    hardware_device = relationship("HardwareDevice", foreign_keys=[hardware_device_id])


class ExperimentRun(Base):
    __tablename__ = "experiment_runs"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("project_experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    
    run_number = Column(Integer, default=1)
    run_label = Column(String, default="Run 1") # e.g. "Trial 1 (Seed 42)"
    random_seed = Column(Integer, default=42)
    parameters = Column(JSON, default=dict)
    
    # Recorded Metrics for this specific run
    metrics = Column(JSON, default=dict) # e.g. {"accuracy": 89.6, "f1_score": 0.892, "precision": 88.4, "recall": 90.1, "latency_ms": 78.0}
    baseline_metrics = Column(JSON, default=dict) # e.g. {"accuracy": 84.2, "f1_score": 0.823, "precision": 82.7, "recall": 81.9, "latency_ms": 120.0}
    
    execution_time_ms = Column(Float, default=0.0)
    status = Column(String, default="COMPLETED", index=True) # PLANNED, RUNNING, COMPLETED, FAILED
    environment_snapshot = Column(JSON, default=dict) # {"os": "Linux x86_64", "python": "3.11.8"}
    logs_or_notes = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    experiment = relationship("Experiment", back_populates="runs")


class ExperimentResult(Base):
    __tablename__ = "experiment_results"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("project_experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    
    metric_name = Column(String, nullable=False, index=True) # "Accuracy", "F1-Score", "Inference Latency", "Precision", "Recall"
    metric_type = Column(String, default="classification") # classification, regression, detection, nlp, edge_iot, hardware
    baseline_value = Column(Float, nullable=False, default=0.0)
    proposed_value = Column(Float, nullable=False, default=0.0)
    unit = Column(String, default="%") # %, ms, MB, score, NTU, PPM
    direction = Column(String, default="higher_is_better") # higher_is_better, lower_is_better
    
    difference = Column(Float, default=0.0) # proposed - baseline
    percentage_difference = Column(Float, nullable=True) # ((proposed - baseline) / baseline) * 100
    comparison_label = Column(String, default="Improved") # Improved, Similar, Lower, Higher, Not comparable, Insufficient data
    
    # Statistical Summary across multi-runs
    statistical_summary = Column(JSON, default=dict) # {"mean": 89.6, "median": 89.6, "min": 88.9, "max": 90.2, "std_dev": 0.52, "runs_count": 5}
    
    source = Column(String, default="manual_entry") # manual_entry, multi_run_aggregator, telemetry_import, csv_import, json_import
    evidence_reference = Column(String, default="")
    notes = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    experiment = relationship("Experiment", back_populates="results")


class BenchmarkReference(Base):
    __tablename__ = "benchmark_references"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id = Column(Integer, ForeignKey("project_experiments.id", ondelete="SET NULL"), nullable=True, index=True)
    citation_id = Column(Integer, ForeignKey("research_citations.id", ondelete="SET NULL"), nullable=True, index=True)
    
    reference_name = Column(String, nullable=False) # e.g. "State-of-the-Art Baseline (Smith et al. 2024)"
    method_name = Column(String, nullable=False) # "Dual-Branch ResNet + Attention"
    dataset_name = Column(String, nullable=False) # "WHO Potability Benchmark 2023"
    metric_name = Column(String, nullable=False) # "F1-Score"
    reported_value = Column(Float, nullable=False) # 0.884 or 88.4
    unit = Column(String, default="%") # %, score, ms
    
    source_citation = Column(String, default="") # "[1] Smith et al., IEEE T-IoT 2024"
    source_section_page = Column(String, default="") # "Section IV-B, Table 2, Page 6"
    doi = Column(String, nullable=True)
    evidence_reference = Column(String, default="")
    is_published_reference = Column(Boolean, default=True) # Always True to distinguish from project experiment results
    notes = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="benchmark_references")
    experiment = relationship("Experiment", back_populates="benchmarks")
    citation = relationship("ResearchCitation")


class ExperimentEvidence(Base):
    __tablename__ = "experiment_evidence"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("project_experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    
    evidence_type = Column(String, nullable=False) # dataset, source_paper, code_repository, hardware_telemetry, experiment_run, manual_observation, uploaded_result_file, mentor_verification
    title = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    reference_id = Column(String, nullable=True) # e.g. "run-1", "telemetry-device-1", "citation-4"
    verification_status = Column(String, default="SYSTEM_LOGGED") # SYSTEM_LOGGED, VERIFIED_BY_STUDENT, VERIFIED_BY_MENTOR
    notes = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    experiment = relationship("Experiment", back_populates="evidence_links")
