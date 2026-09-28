import csv
import io
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.experiment import Experiment, ExperimentRun, ExperimentResult, BenchmarkReference, ExperimentEvidence
from app.models.hardware import HardwareDevice
from app.schemas.experiment import (
    ExperimentCreate, ExperimentUpdate, ExperimentResponse, ExperimentDetailResponse,
    ExperimentRunCreate, ExperimentRunUpdate, ExperimentRunResponse,
    ExperimentResultCreate, ExperimentResultResponse,
    BenchmarkReferenceCreate, BenchmarkReferenceResponse,
    ExperimentEvidenceCreate, ExperimentEvidenceResponse,
    ReproducibilityReportResponse, ExperimentSummaryResponse,
    ExperimentSuggestionRequest, ExperimentSuggestionResponse,
    ExperimentImportRequest, ExperimentImportResponse,
    ExperimentSyncResearchRequest, ExperimentSyncResearchResponse
)
from app.services.experiment_service import experiment_service
from app.api.auth import get_current_user

logger = logging.getLogger("inno_sphere.api.experiments")

router = APIRouter(tags=["Experimentation & Benchmarking Engine"])


def _verify_project_access(project_id: int, current_user: User, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if current_user.role not in ("admin", "mentor") and project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project's experiments")
    return project


def _verify_experiment_access(experiment_id: int, current_user: User, db: Session) -> Experiment:
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found")
    _verify_project_access(experiment.project_id, current_user, db)
    return experiment


# -------------------------------------------------------------
# Project-Level Experiment Endpoints
# -------------------------------------------------------------
@router.get("/projects/{project_id}/experiments", response_model=List[ExperimentResponse])
def list_project_experiments(
    project_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all experiments for a project with optional status filter."""
    _verify_project_access(project_id, current_user, db)
    query = db.query(Experiment).filter(Experiment.project_id == project_id)
    if status_filter:
        query = query.filter(Experiment.status.ilike(status_filter))
    if search:
        query = query.filter(Experiment.name.ilike(f"%{search}%") | Experiment.hypothesis.ilike(f"%{search}%"))

    experiments = query.order_by(Experiment.created_at.desc()).all()
    results = []
    for exp in experiments:
        exp_dict = {
            "id": exp.id,
            "project_id": exp.project_id,
            "research_document_id": exp.research_document_id,
            "research_gap_id": exp.research_gap_id,
            "research_gap_title": exp.research_gap_title,
            "name": exp.name,
            "objective": exp.objective,
            "hypothesis": exp.hypothesis,
            "independent_variables": exp.independent_variables or [],
            "dependent_variables": exp.dependent_variables or [],
            "controlled_variables": exp.controlled_variables or [],
            "dataset_used": exp.dataset_used,
            "dataset_version": exp.dataset_version or "v1.0",
            "dataset_source": exp.dataset_source or "OpenData",
            "preprocessing_notes": exp.preprocessing_notes or "",
            "baseline_model": exp.baseline_model,
            "proposed_method": exp.proposed_method,
            "model_algorithm": exp.model_algorithm or "",
            "hardware_environment": exp.hardware_environment or "",
            "software_environment": exp.software_environment or "",
            "parameters": exp.parameters or {},
            "hyperparameters": exp.hyperparameters or {},
            "random_seed": exp.random_seed,
            "evaluation_metrics": exp.evaluation_metrics or [],
            "expected_outcome": exp.expected_outcome or "",
            "actual_outcome": exp.actual_outcome or "",
            "metrics": exp.metrics or {},
            "results_summary": exp.results_summary or "",
            "status": exp.status or "PLANNED",
            "evidence_notes": exp.evidence_notes or "",
            "is_simulated": exp.is_simulated or False,
            "hardware_device_id": exp.hardware_device_id,
            "reproducibility_score": exp.reproducibility_score or 0.0,
            "created_at": exp.created_at,
            "started_at": exp.started_at,
            "completed_at": exp.completed_at,
            "runs_count": len(exp.runs),
            "results_count": len(exp.results),
            "benchmarks_count": len(exp.benchmarks),
            "evidence_count": len(exp.evidence_links)
        }
        results.append(exp_dict)
    return results


@router.post("/projects/{project_id}/experiments", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
def create_experiment(
    project_id: int,
    payload: ExperimentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new experiment within a project."""
    _verify_project_access(project_id, current_user, db)

    exp = Experiment(
        project_id=project_id,
        research_document_id=payload.research_document_id,
        research_gap_id=payload.research_gap_id,
        research_gap_title=payload.research_gap_title,
        name=payload.name,
        objective=payload.objective,
        hypothesis=payload.hypothesis,
        independent_variables=payload.independent_variables or [],
        dependent_variables=payload.dependent_variables or [],
        controlled_variables=payload.controlled_variables or [],
        dataset_used=payload.dataset_used,
        dataset_version=payload.dataset_version or "v1.0",
        dataset_source=payload.dataset_source or "Kaggle / OpenData",
        preprocessing_notes=payload.preprocessing_notes or "",
        baseline_model=payload.baseline_model,
        proposed_method=payload.proposed_method,
        model_algorithm=payload.model_algorithm or "",
        hardware_environment=payload.hardware_environment or "ESP32 + Host GPU",
        software_environment=payload.software_environment or "Python 3.11, PyTorch 2.2",
        parameters=payload.parameters or {},
        hyperparameters=payload.hyperparameters or {},
        random_seed=payload.random_seed or 42,
        evaluation_metrics=payload.evaluation_metrics or ["Accuracy", "F1-Score", "Inference Latency"],
        expected_outcome=payload.expected_outcome or "",
        actual_outcome=payload.actual_outcome or "",
        metrics=payload.metrics or {},
        results_summary=payload.results_summary or "",
        status=payload.status or "PLANNED",
        evidence_notes=payload.evidence_notes or "",
        is_simulated=payload.is_simulated or False,
        hardware_device_id=payload.hardware_device_id,
        completed_at=datetime.utcnow() if payload.status and payload.status.lower() == "completed" else None
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    # Calculate initial reproducibility coverage
    repro = experiment_service.evaluate_reproducibility(exp)
    exp.reproducibility_score = repro.coverage_percentage
    db.commit()
    db.refresh(exp)

    return exp


@router.get("/projects/{project_id}/experiments/summary", response_model=ExperimentSummaryResponse)
def get_project_experiments_summary(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregate global experimentation KPIs and telemetry for a project."""
    _verify_project_access(project_id, current_user, db)
    return experiment_service.get_project_experiments_summary(db, project_id)


@router.post("/projects/{project_id}/experiments/suggest", response_model=ExperimentSuggestionResponse)
def suggest_experiment_from_gap(
    project_id: int,
    payload: ExperimentSuggestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate structured experiment proposal from an innovation gap or domain context."""
    project = _verify_project_access(project_id, current_user, db)
    return experiment_service.suggest_experiment_from_gap(
        project,
        gap_title=payload.research_gap_title,
        gap_desc=payload.research_gap_description,
        exp_type=payload.experiment_type or "machine_learning"
    )


@router.post("/projects/{project_id}/experiments/from-hardware", response_model=ExperimentDetailResponse)
def create_experiment_from_hardware(
    project_id: int,
    device_id: int = Query(...),
    experiment_name: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an empirical experiment directly linked to Hardware Lab device and telemetry."""
    _verify_project_access(project_id, current_user, db)
    try:
        exp = experiment_service.create_from_hardware_device(
            db, project_id, device_id, experiment_name=experiment_name
        )
        repro = experiment_service.evaluate_reproducibility(exp)
        return ExperimentDetailResponse(
            id=exp.id,
            project_id=exp.project_id,
            research_document_id=exp.research_document_id,
            research_gap_id=exp.research_gap_id,
            research_gap_title=exp.research_gap_title,
            name=exp.name,
            objective=exp.objective,
            hypothesis=exp.hypothesis,
            independent_variables=exp.independent_variables or [],
            dependent_variables=exp.dependent_variables or [],
            controlled_variables=exp.controlled_variables or [],
            dataset_used=exp.dataset_used,
            dataset_version=exp.dataset_version or "v1.0",
            dataset_source=exp.dataset_source or "OpenData",
            preprocessing_notes=exp.preprocessing_notes or "",
            baseline_model=exp.baseline_model,
            proposed_method=exp.proposed_method,
            model_algorithm=exp.model_algorithm or "",
            hardware_environment=exp.hardware_environment or "",
            software_environment=exp.software_environment or "",
            parameters=exp.parameters or {},
            hyperparameters=exp.hyperparameters or {},
            random_seed=exp.random_seed,
            evaluation_metrics=exp.evaluation_metrics or [],
            expected_outcome=exp.expected_outcome or "",
            actual_outcome=exp.actual_outcome or "",
            metrics=exp.metrics or {},
            results_summary=exp.results_summary or "",
            status=exp.status or "COMPLETED",
            evidence_notes=exp.evidence_notes or "",
            is_simulated=exp.is_simulated or False,
            hardware_device_id=exp.hardware_device_id,
            reproducibility_score=repro.coverage_percentage,
            created_at=exp.created_at,
            started_at=exp.started_at,
            completed_at=exp.completed_at,
            runs=exp.runs,
            results=exp.results,
            benchmarks=exp.benchmarks,
            evidence_links=exp.evidence_links,
            reproducibility=repro
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/projects/{project_id}/experiments/sync-research", response_model=ExperimentSyncResearchResponse)
def sync_experiments_to_research(
    project_id: int,
    payload: ExperimentSyncResearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Synchronize completed experiments and empirical tables to the Research Workspace."""
    _verify_project_access(project_id, current_user, db)
    sync_res = experiment_service.sync_experiments_to_research_paper(
        db,
        project_id,
        target_doc_type=payload.target_doc_type,
        overwrite_sections=payload.overwrite_sections
    )
    return ExperimentSyncResearchResponse(**sync_res)


# -------------------------------------------------------------
# Individual Experiment Detail & Lifecycle
# -------------------------------------------------------------
@router.get("/experiments/{experiment_id}", response_model=ExperimentDetailResponse)
def get_experiment_detail(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch complete experiment details including runs, results, benchmarks, and reproducibility scorecard."""
    exp = _verify_experiment_access(experiment_id, current_user, db)
    repro = experiment_service.evaluate_reproducibility(exp)

    return ExperimentDetailResponse(
        id=exp.id,
        project_id=exp.project_id,
        research_document_id=exp.research_document_id,
        research_gap_id=exp.research_gap_id,
        research_gap_title=exp.research_gap_title,
        name=exp.name,
        objective=exp.objective,
        hypothesis=exp.hypothesis,
        independent_variables=exp.independent_variables or [],
        dependent_variables=exp.dependent_variables or [],
        controlled_variables=exp.controlled_variables or [],
        dataset_used=exp.dataset_used,
        dataset_version=exp.dataset_version or "v1.0",
        dataset_source=exp.dataset_source or "OpenData",
        preprocessing_notes=exp.preprocessing_notes or "",
        baseline_model=exp.baseline_model,
        proposed_method=exp.proposed_method,
        model_algorithm=exp.model_algorithm or "",
        hardware_environment=exp.hardware_environment or "",
        software_environment=exp.software_environment or "",
        parameters=exp.parameters or {},
        hyperparameters=exp.hyperparameters or {},
        random_seed=exp.random_seed,
        evaluation_metrics=exp.evaluation_metrics or [],
        expected_outcome=exp.expected_outcome or "",
        actual_outcome=exp.actual_outcome or "",
        metrics=exp.metrics or {},
        results_summary=exp.results_summary or "",
        status=exp.status or "PLANNED",
        evidence_notes=exp.evidence_notes or "",
        is_simulated=exp.is_simulated or False,
        hardware_device_id=exp.hardware_device_id,
        reproducibility_score=repro.coverage_percentage,
        created_at=exp.created_at,
        started_at=exp.started_at,
        completed_at=exp.completed_at,
        runs=exp.runs,
        results=exp.results,
        benchmarks=exp.benchmarks,
        evidence_links=exp.evidence_links,
        reproducibility=repro
    )


@router.put("/experiments/{experiment_id}", response_model=ExperimentResponse)
def update_experiment(
    experiment_id: int,
    payload: ExperimentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update experiment parameters, hypotheses, or status."""
    exp = _verify_experiment_access(experiment_id, current_user, db)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(exp, key, value)

    # Re-evaluate reproducibility
    repro = experiment_service.evaluate_reproducibility(exp)
    exp.reproducibility_score = repro.coverage_percentage
    exp.reproducibility_checklist = {it.key: it.is_recorded for it in repro.items}

    db.commit()
    db.refresh(exp)
    return exp


@router.delete("/experiments/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an experiment and all associated runs and evidence."""
    exp = _verify_experiment_access(experiment_id, current_user, db)
    db.delete(exp)
    db.commit()
    return None


@router.put("/projects/{project_id}/experiments/{experiment_id}", response_model=ExperimentResponse)
def update_project_experiment_alias(
    project_id: int,
    experiment_id: int,
    payload: ExperimentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Project-scoped update experiment alias for backward compatibility."""
    _verify_project_access(project_id, current_user, db)
    return update_experiment(experiment_id, payload, current_user, db)


@router.delete("/projects/{project_id}/experiments/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_experiment_alias(
    project_id: int,
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Project-scoped delete experiment alias for backward compatibility."""
    _verify_project_access(project_id, current_user, db)
    return delete_experiment(experiment_id, current_user, db)


@router.post("/experiments/{experiment_id}/status", response_model=ExperimentResponse)
def update_experiment_status(
    experiment_id: int,
    new_status: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Transition experiment status (PLANNED, READY, RUNNING, COMPLETED, FAILED, CANCELLED)."""
    valid_statuses = ("PLANNED", "READY", "RUNNING", "COMPLETED", "FAILED", "CANCELLED")
    norm_status = new_status.upper()
    if norm_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{new_status}'. Must be one of: {', '.join(valid_statuses)}"
        )

    exp = _verify_experiment_access(experiment_id, current_user, db)
    exp.status = norm_status
    if norm_status == "RUNNING" and not exp.started_at:
        exp.started_at = datetime.utcnow()
    elif norm_status in ("COMPLETED", "FAILED", "CANCELLED"):
        exp.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(exp)
    return exp


# -------------------------------------------------------------
# Multi-Run Endpoints
# -------------------------------------------------------------
@router.get("/experiments/{experiment_id}/runs", response_model=List[ExperimentRunResponse])
def list_experiment_runs(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all execution runs for an experiment."""
    exp = _verify_experiment_access(experiment_id, current_user, db)
    return db.query(ExperimentRun).filter(ExperimentRun.experiment_id == exp.id).order_by(ExperimentRun.run_number.asc()).all()


@router.post("/experiments/{experiment_id}/runs", response_model=ExperimentRunResponse, status_code=status.HTTP_201_CREATED)
def create_experiment_run(
    experiment_id: int,
    payload: ExperimentRunCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new trial run and update descriptive statistics across all runs."""
    exp = _verify_experiment_access(experiment_id, current_user, db)

    # Determine run number
    existing_count = db.query(ExperimentRun).filter(ExperimentRun.experiment_id == exp.id).count()
    run_num = payload.run_number if payload.run_number > existing_count else existing_count + 1

    run = ExperimentRun(
        experiment_id=exp.id,
        run_number=run_num,
        run_label=payload.run_label or f"Run {run_num}",
        random_seed=payload.random_seed,
        parameters=payload.parameters or {},
        metrics=payload.metrics or {},
        baseline_metrics=payload.baseline_metrics or {},
        execution_time_ms=payload.execution_time_ms,
        status=payload.status or "COMPLETED",
        environment_snapshot=payload.environment_snapshot or {},
        logs_or_notes=payload.logs_or_notes or "",
        completed_at=datetime.utcnow() if payload.status == "COMPLETED" else None
    )
    db.add(run)
    db.flush()

    # Automatically recalculate aggregate metric results across all runs
    all_runs = db.query(ExperimentRun).filter(ExperimentRun.experiment_id == exp.id).all()
    metric_keys = set()
    for r in all_runs:
        if isinstance(r.metrics, dict):
            metric_keys.update(r.metrics.keys())

    for m_key in metric_keys:
        values = []
        base_vals = []
        for r in all_runs:
            if isinstance(r.metrics, dict) and m_key in r.metrics:
                try:
                    values.append(float(r.metrics[m_key]))
                except (ValueError, TypeError):
                    pass
            if isinstance(r.baseline_metrics, dict) and m_key in r.baseline_metrics:
                try:
                    base_vals.append(float(r.baseline_metrics[m_key]))
                except (ValueError, TypeError):
                    pass

        if values:
            stats = experiment_service.calculate_descriptive_stats(values)
            mean_prop = stats["mean"]
            mean_base = sum(base_vals) / len(base_vals) if base_vals else 0.0

            diff, pct_diff, label = experiment_service.compute_metric_difference(mean_base, mean_prop)

            # Check if result already exists for this metric
            existing_res = db.query(ExperimentResult).filter(
                ExperimentResult.experiment_id == exp.id,
                ExperimentResult.metric_name.ilike(m_key)
            ).first()

            if existing_res:
                existing_res.proposed_value = mean_prop
                existing_res.baseline_value = mean_base
                existing_res.difference = diff
                existing_res.percentage_difference = pct_diff
                existing_res.comparison_label = label
                existing_res.statistical_summary = stats
                existing_res.source = "multi_run_aggregator"
            else:
                new_res = ExperimentResult(
                    experiment_id=exp.id,
                    metric_name=m_key.replace("_", " ").title(),
                    metric_type="classification" if "acc" in m_key.lower() or "f1" in m_key.lower() else "edge_iot",
                    baseline_value=mean_base,
                    proposed_value=mean_prop,
                    unit="%" if "acc" in m_key.lower() or "rate" in m_key.lower() else ("ms" if "lat" in m_key.lower() else ""),
                    difference=diff,
                    percentage_difference=pct_diff,
                    comparison_label=label,
                    statistical_summary=stats,
                    source="multi_run_aggregator"
                )
                db.add(new_res)

    db.commit()
    db.refresh(run)
    return run


@router.put("/experiment-runs/{run_id}", response_model=ExperimentRunResponse)
def update_experiment_run(
    run_id: int,
    payload: ExperimentRunUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific execution run."""
    run = db.query(ExperimentRun).filter(ExperimentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment run not found")
    _verify_experiment_access(run.experiment_id, current_user, db)

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(run, k, v)
    db.commit()
    db.refresh(run)
    return run


@router.delete("/experiment-runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment_run(
    run_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an experiment run."""
    run = db.query(ExperimentRun).filter(ExperimentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment run not found")
    _verify_experiment_access(run.experiment_id, current_user, db)
    db.delete(run)
    db.commit()
    return None


# -------------------------------------------------------------
# Metric Results Comparison Endpoints
# -------------------------------------------------------------
@router.get("/experiments/{experiment_id}/results", response_model=List[ExperimentResultResponse])
def list_experiment_results(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all metric comparison results for an experiment."""
    exp = _verify_experiment_access(experiment_id, current_user, db)
    return db.query(ExperimentResult).filter(ExperimentResult.experiment_id == exp.id).all()


@router.post("/experiments/{experiment_id}/results", response_model=ExperimentResultResponse, status_code=status.HTTP_201_CREATED)
def create_experiment_result(
    experiment_id: int,
    payload: ExperimentResultCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a verified metric comparison entry."""
    exp = _verify_experiment_access(experiment_id, current_user, db)

    diff, pct_diff, label = experiment_service.compute_metric_difference(
        payload.baseline_value, payload.proposed_value, payload.direction
    )

    res = ExperimentResult(
        experiment_id=exp.id,
        metric_name=payload.metric_name,
        metric_type=payload.metric_type,
        baseline_value=payload.baseline_value,
        proposed_value=payload.proposed_value,
        unit=payload.unit,
        direction=payload.direction,
        difference=diff,
        percentage_difference=pct_diff,
        comparison_label=label,
        statistical_summary=payload.statistical_summary or {},
        source=payload.source or "manual_entry",
        evidence_reference=payload.evidence_reference or "",
        notes=payload.notes or ""
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return res


@router.delete("/experiment-results/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment_result(
    result_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a metric comparison result."""
    res = db.query(ExperimentResult).filter(ExperimentResult.id == result_id).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment result not found")
    _verify_experiment_access(res.experiment_id, current_user, db)
    db.delete(res)
    db.commit()
    return None


# -------------------------------------------------------------
# Reproducibility Audit Endpoint
# -------------------------------------------------------------
@router.get("/experiments/{experiment_id}/reproducibility", response_model=ReproducibilityReportResponse)
def get_experiment_reproducibility(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Evaluate 10-point reproducibility coverage indicator and missing item checklist."""
    exp = _verify_experiment_access(experiment_id, current_user, db)
    return experiment_service.evaluate_reproducibility(exp)


# -------------------------------------------------------------
# Published Benchmark References Endpoints
# -------------------------------------------------------------
@router.get("/experiments/{experiment_id}/benchmark", response_model=List[BenchmarkReferenceResponse])
def list_experiment_benchmarks(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all published benchmark references linked to this experiment."""
    exp = _verify_experiment_access(experiment_id, current_user, db)
    return db.query(BenchmarkReference).filter(BenchmarkReference.experiment_id == exp.id).all()


@router.post("/projects/{project_id}/benchmarks", response_model=BenchmarkReferenceResponse, status_code=status.HTTP_201_CREATED)
def create_benchmark_reference(
    project_id: int,
    payload: BenchmarkReferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Store verified published benchmark reference."""
    _verify_project_access(project_id, current_user, db)

    ref = BenchmarkReference(
        project_id=project_id,
        experiment_id=payload.experiment_id,
        citation_id=payload.citation_id,
        reference_name=payload.reference_name,
        method_name=payload.method_name,
        dataset_name=payload.dataset_name,
        metric_name=payload.metric_name,
        reported_value=payload.reported_value,
        unit=payload.unit,
        source_citation=payload.source_citation or "",
        source_section_page=payload.source_section_page or "",
        doi=payload.doi,
        evidence_reference=payload.evidence_reference or "",
        is_published_reference=True,
        notes=payload.notes or ""
    )
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref


@router.delete("/benchmarks/{benchmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_benchmark_reference(
    benchmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a benchmark reference."""
    ref = db.query(BenchmarkReference).filter(BenchmarkReference.id == benchmark_id).first()
    if not ref:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Benchmark reference not found")
    _verify_project_access(ref.project_id, current_user, db)
    db.delete(ref)
    db.commit()
    return None


# -------------------------------------------------------------
# Evidence Links Endpoints
# -------------------------------------------------------------
@router.get("/experiments/{experiment_id}/evidence", response_model=List[ExperimentEvidenceResponse])
def list_experiment_evidence(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List traceable evidence links for an experiment."""
    exp = _verify_experiment_access(experiment_id, current_user, db)
    return db.query(ExperimentEvidence).filter(ExperimentEvidence.experiment_id == exp.id).all()


@router.post("/experiments/{experiment_id}/evidence", response_model=ExperimentEvidenceResponse, status_code=status.HTTP_201_CREATED)
def create_experiment_evidence(
    experiment_id: int,
    payload: ExperimentEvidenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Attach verifiable evidence to an experiment."""
    exp = _verify_experiment_access(experiment_id, current_user, db)

    ev = ExperimentEvidence(
        experiment_id=exp.id,
        evidence_type=payload.evidence_type,
        title=payload.title,
        source_url=payload.source_url,
        reference_id=payload.reference_id,
        verification_status=payload.verification_status or "SYSTEM_LOGGED",
        notes=payload.notes or ""
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.delete("/experiment-evidence/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment_evidence(
    evidence_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an evidence link."""
    ev = db.query(ExperimentEvidence).filter(ExperimentEvidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence item not found")
    _verify_experiment_access(ev.experiment_id, current_user, db)
    db.delete(ev)
    db.commit()
    return None


# -------------------------------------------------------------
# Secure Result Importer (CSV & JSON)
# -------------------------------------------------------------
@router.post("/experiments/{experiment_id}/import-results", response_model=ExperimentImportResponse)
def import_experiment_results(
    experiment_id: int,
    payload: ExperimentImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import empirical experiment results from structured JSON or CSV.
    Validates types, prevents code injection, and calculates comparative metrics.
    """
    exp = _verify_experiment_access(experiment_id, current_user, db)
    created_results: List[ExperimentResult] = []
    warnings: List[str] = []
    metrics_count = 0
    runs_count = 0

    if payload.format_type == "json":
        items = payload.json_data or []
        if not items and payload.raw_content:
            try:
                items = json.loads(payload.raw_content)
            except Exception as e:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid JSON content: {str(e)}")

        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                warnings.append(f"Row {idx+1} skipped: not a dictionary object.")
                continue

            m_name = item.get("metric_name") or item.get("metric") or f"Metric {idx+1}"
            try:
                base_v = float(item.get("baseline_value", item.get("baseline", 0.0)))
                prop_v = float(item.get("proposed_value", item.get("proposed", 0.0)))
            except (ValueError, TypeError):
                warnings.append(f"Metric '{m_name}' skipped: non-numeric values.")
                continue

            unit = str(item.get("unit", "%"))
            direction = str(item.get("direction", "higher_is_better"))
            diff, pct_diff, label = experiment_service.compute_metric_difference(base_v, prop_v, direction)

            res = ExperimentResult(
                experiment_id=exp.id,
                metric_name=m_name,
                metric_type=str(item.get("metric_type", "classification")),
                baseline_value=base_v,
                proposed_value=prop_v,
                unit=unit,
                direction=direction,
                difference=diff,
                percentage_difference=pct_diff,
                comparison_label=label,
                source="json_import",
                notes=str(item.get("notes", "Imported via JSON upload."))
            )
            db.add(res)
            created_results.append(res)
            metrics_count += 1

    elif payload.format_type == "csv":
        if not payload.raw_content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing raw_content for CSV import.")

        try:
            reader = csv.DictReader(io.StringIO(payload.raw_content.strip()))
            for idx, row in enumerate(reader):
                m_name = row.get("metric_name") or row.get("metric") or f"Metric {idx+1}"
                try:
                    base_v = float(row.get("baseline_value", row.get("baseline", 0.0)))
                    prop_v = float(row.get("proposed_value", row.get("proposed", 0.0)))
                except (ValueError, TypeError):
                    warnings.append(f"Row {idx+1} '{m_name}' skipped: non-numeric values.")
                    continue

                unit = str(row.get("unit", "%"))
                direction = str(row.get("direction", "higher_is_better"))
                diff, pct_diff, label = experiment_service.compute_metric_difference(base_v, prop_v, direction)

                res = ExperimentResult(
                    experiment_id=exp.id,
                    metric_name=m_name,
                    metric_type=str(row.get("metric_type", "classification")),
                    baseline_value=base_v,
                    proposed_value=prop_v,
                    unit=unit,
                    direction=direction,
                    difference=diff,
                    percentage_difference=pct_diff,
                    comparison_label=label,
                    source="csv_import",
                    notes=str(row.get("notes", "Imported via CSV upload."))
                )
                db.add(res)
                created_results.append(res)
                metrics_count += 1
        except Exception as csv_err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to parse CSV: {str(csv_err)}")

    db.commit()
    for r in created_results:
        db.refresh(r)

    return ExperimentImportResponse(
        success=True,
        imported_metrics_count=metrics_count,
        imported_runs_count=runs_count,
        created_results=created_results,
        validation_warnings=warnings
    )
