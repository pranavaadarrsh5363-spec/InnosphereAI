from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.research import ResearchDocument, ResearchDocumentVersion, ResearchCitation
from app.models.experiment import Experiment
from app.schemas.research import (
    ResearchCitationCreate, ResearchCitationResponse,
    ExperimentCreate, ExperimentUpdate, ExperimentResponse,
    ResearchDocumentCreate, ResearchDocumentUpdate, ResearchDocumentResponse,
    ResearchDocumentVersionResponse, SectionGenerateRequest, SectionGenerateResponse,
    ResearchQualityReport, EvidenceMappingResponse,
    LaTeXExportResponse, BibTeXExportResponse, MarkdownExportResponse, TechnicalReportExportResponse
)
from app.services.research_generator_service import research_generator_service
from app.utils.security import get_current_user
from app.utils.rate_limiter import rate_limit
from app.config import settings

router = APIRouter(prefix="/projects", tags=["AI Research Workspace"])


def _authorize_project_access(project_id: int, current_user: User, db: Session) -> Project:
    """Enforce IDOR protection: only owner, mentor, or admin can access research data."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )
    if project.user_id != current_user.id and current_user.role not in ["mentor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access research data for this project."
        )
    return project


# -------------------------------------------------------------
# Research Document Lifecycle
# -------------------------------------------------------------
@router.get(
    "/{project_id}/research",
    response_model=ResearchDocumentResponse,
    summary="Get Project Research Document",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="research_get"))]
)
async def get_research_document(
    project_id: int,
    doc_type: str = "research_paper",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve existing research document or auto-generate if requested."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(
        ResearchDocument.project_id == project.id,
        ResearchDocument.doc_type == doc_type
    ).first()

    if not doc or not doc.abstract:
        # Auto-synthesize on initial access so user has immediate draft
        doc = await research_generator_service.generate_full_document(
            db=db, project=project, doc_type=doc_type, user_id=current_user.id
        )

    # Attach dynamic counts
    doc.citations_count = len(doc.citations)
    doc.experiments_count = len(project.experiments)
    return doc


@router.post(
    "/{project_id}/research/generate",
    response_model=ResearchDocumentResponse,
    summary="Generate Full Research Paper Draft",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="research_generate"))]
)
async def generate_research_document(
    project_id: int,
    req: Optional[ResearchDocumentCreate] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Synthesize complete 13-section academic research paper with verified citations and evidence."""
    project = _authorize_project_access(project_id, current_user, db)
    doc_type = req.doc_type if req and req.doc_type else "research_paper"

    doc = await research_generator_service.generate_full_document(
        db=db,
        project=project,
        doc_type=doc_type,
        user_id=current_user.id
    )
    doc.citations_count = len(doc.citations)
    doc.experiments_count = len(project.experiments)
    return doc


@router.put(
    "/{project_id}/research",
    response_model=ResearchDocumentResponse,
    summary="Update Research Document Content",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="research_update"))]
)
async def update_research_document(
    project_id: int,
    req: ResearchDocumentUpdate,
    doc_type: str = "research_paper",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save manual or AI edits to any section, with optional version snapshotting."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(
        ResearchDocument.project_id == project.id,
        ResearchDocument.doc_type == doc_type
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Research document not found. Generate one first.")

    update_data = req.model_dump(exclude_unset=True)
    create_ver = update_data.pop("create_new_version", False)
    ver_label = update_data.pop("version_label", None)

    for field, val in update_data.items():
        if hasattr(doc, field) and val is not None:
            setattr(doc, field, val)

    doc.updated_at = datetime.utcnow()

    # Re-evaluate quality scores
    quality = research_generator_service.compute_quality_report(db, doc)
    doc.citation_coverage_pct = quality.citation_coverage_pct
    doc.quality_summary = {
        "overall_score": quality.overall_readiness_score,
        "readiness_label": quality.readiness_label,
        "supported_claims": quality.supported_claims_count,
        "unsupported_claims": quality.unsupported_claims_count
    }

    if create_ver or ver_label:
        research_generator_service.save_version_snapshot(
            db, doc, label=ver_label or f"Manual Edit {datetime.utcnow().strftime('%H:%M')}",
            changelog="Updated research paper sections", user_id=current_user.id
        )

    db.commit()
    db.refresh(doc)
    doc.citations_count = len(doc.citations)
    doc.experiments_count = len(project.experiments)
    return doc


@router.post(
    "/{project_id}/research/sections/{section_key}/generate",
    response_model=SectionGenerateResponse,
    summary="Generate or Refine Specific Section with AI",
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="section_generate"))]
)
async def generate_single_section(
    project_id: int,
    section_key: str,
    req: SectionGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate or expand a single specific section with custom prompt instructions."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(
        ResearchDocument.project_id == project.id
    ).first()

    if not doc:
        doc = await research_generator_service.generate_full_document(
            db=db, project=project, user_id=current_user.id
        )

    content, citations, evidence_notes = await research_generator_service.generate_single_section(
        db=db,
        doc=doc,
        section_key=section_key,
        custom_instruction=req.custom_instruction
    )

    return SectionGenerateResponse(
        section_key=section_key,
        content=content,
        supporting_citations=[ResearchCitationResponse.model_validate(c) for c in citations],
        evidence_notes=evidence_notes,
        generated_at=datetime.utcnow()
    )


# -------------------------------------------------------------
# Citations Management & Formatting
# -------------------------------------------------------------
@router.get(
    "/{project_id}/research/citations",
    response_model=List[ResearchCitationResponse],
    summary="List Document Citations"
)
async def get_document_citations(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all verified scientific citations linked to the project research paper."""
    _authorize_project_access(project_id, current_user, db)
    citations = db.query(ResearchCitation).filter(
        ResearchCitation.project_id == project_id
    ).order_by(ResearchCitation.created_at.asc()).all()
    return citations


@router.post(
    "/{project_id}/research/citations",
    response_model=ResearchCitationResponse,
    summary="Add New Scientific Citation"
)
async def add_citation(
    project_id: int,
    req: ResearchCitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add manual or custom academic citation with automatic IEEE, APA, and BibTeX formatting."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
    if not doc:
        doc = await research_generator_service.generate_full_document(db, project, user_id=current_user.id)

    key = req.citation_key or research_generator_service.format_citation_key(req.authors, req.year, req.title)
    cit = ResearchCitation(
        document_id=doc.id,
        project_id=project_id,
        resource_id=req.resource_id,
        citation_key=key,
        title=req.title,
        authors=req.authors,
        year=req.year,
        venue=req.venue,
        publisher=req.publisher,
        doi=req.doi,
        arxiv_id=req.arxiv_id,
        openalex_id=req.openalex_id,
        url=req.url,
        source=req.source,
        resource_type=req.resource_type,
        claim_tags=req.claim_tags,
        is_verified=bool(req.doi or req.arxiv_id or req.url)
    )
    cit.ieee_text = research_generator_service.format_ieee_citation(cit)
    cit.apa_text = research_generator_service.format_apa_citation(cit)
    cit.bibtex = research_generator_service.format_bibtex_entry(cit)

    db.add(cit)
    db.commit()
    db.refresh(cit)
    return cit


@router.delete(
    "/{project_id}/research/citations/{citation_id}",
    summary="Delete Citation"
)
async def delete_citation(
    project_id: int,
    citation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a citation from the document."""
    _authorize_project_access(project_id, current_user, db)
    cit = db.query(ResearchCitation).filter(
        ResearchCitation.id == citation_id,
        ResearchCitation.project_id == project_id
    ).first()
    if not cit:
        raise HTTPException(status_code=404, detail="Citation not found.")
    db.delete(cit)
    db.commit()
    return {"message": f"Citation {citation_id} deleted successfully."}


@router.post(
    "/{project_id}/research/citations/sync",
    response_model=List[ResearchCitationResponse],
    summary="Sync Citations from Discovered Resources"
)
async def sync_citations(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Extract citations from saved semantic search resources."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
    if not doc:
        doc = await research_generator_service.generate_full_document(db, project, user_id=current_user.id)

    evidence = research_generator_service.collect_project_evidence(db, project)
    citations = research_generator_service.sync_citations_from_resources(db, doc, evidence)
    return citations


# -------------------------------------------------------------
# Quality Radar & Evidence Mapping
# -------------------------------------------------------------
@router.get(
    "/{project_id}/research/quality",
    response_model=ResearchQualityReport,
    summary="Compute Research Quality & Citation Coverage Radar"
)
async def get_research_quality(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Evaluate 5 quality vectors: structure, evidence, literature diversity, reproducibility, technical completeness."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
    if not doc:
        doc = await research_generator_service.generate_full_document(db, project, user_id=current_user.id)

    return research_generator_service.compute_quality_report(db, doc)


@router.get(
    "/{project_id}/research/evidence",
    response_model=EvidenceMappingResponse,
    summary="Get Section-by-Section Evidence Traceability Matrix"
)
async def get_evidence_matrix(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trace all claims back to papers, recorded experiments, and hardware telemetry."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
    if not doc:
        doc = await research_generator_service.generate_full_document(db, project, user_id=current_user.id)

    return research_generator_service.get_evidence_mapping(db, doc)


# -------------------------------------------------------------
# Experiment Tracker (Gap -> Hypothesis -> Experiment -> Evidence)
# -------------------------------------------------------------
@router.get(
    "/{project_id}/research/experiments",
    response_model=List[ExperimentResponse],
    summary="List Empirical Experiments"
)
async def list_experiments(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all empirical research experiments for benchmarking."""
    _authorize_project_access(project_id, current_user, db)
    return db.query(Experiment).filter(Experiment.project_id == project_id).order_by(Experiment.created_at.desc()).all()


@router.post(
    "/{project_id}/research/experiments",
    response_model=ExperimentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Research Experiment"
)
async def create_experiment(
    project_id: int,
    req: ExperimentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record an empirical research experiment linking hypothesis to baseline metrics."""
    _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()

    exp = Experiment(
        project_id=project_id,
        research_document_id=doc.id if doc else None,
        name=req.name,
        hypothesis=req.hypothesis,
        objective=req.objective,
        dataset_used=req.dataset_used,
        baseline_model=req.baseline_model,
        proposed_method=req.proposed_method,
        research_gap_title=req.research_gap_title,
        parameters=req.parameters,
        metrics=req.metrics,
        results_summary=req.results_summary or "",
        status=req.status,
        evidence_notes=req.evidence_notes or "",
        completed_at=datetime.utcnow() if req.status == "completed" else None
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.put(
    "/{project_id}/research/experiments/{experiment_id}",
    response_model=ExperimentResponse,
    summary="Update Experiment Metrics or Status"
)
async def update_experiment(
    project_id: int,
    experiment_id: int,
    req: ExperimentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update experiment metrics, results summary, or status."""
    _authorize_project_access(project_id, current_user, db)
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.project_id == project_id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if hasattr(exp, k) and v is not None:
            setattr(exp, k, v)

    if req.status == "completed" and not exp.completed_at:
        exp.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(exp)
    return exp


@router.delete(
    "/{project_id}/research/experiments/{experiment_id}",
    summary="Delete Experiment"
)
async def delete_experiment(
    project_id: int,
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an experiment record."""
    _authorize_project_access(project_id, current_user, db)
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.project_id == project_id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    db.delete(exp)
    db.commit()
    return {"message": f"Experiment {experiment_id} deleted successfully."}


# -------------------------------------------------------------
# Exporters (LaTeX, BibTeX, Markdown, Technical Report)
# -------------------------------------------------------------
@router.post(
    "/{project_id}/research/export/latex",
    response_model=LaTeXExportResponse,
    summary="Export Compilable IEEEtran LaTeX Package"
)
async def export_latex(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate IEEEtran LaTeX package (main.tex, references.bib, README.md)."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
    if not doc:
        doc = await research_generator_service.generate_full_document(db, project, user_id=current_user.id)

    pkg = research_generator_service.export_latex_package(db, doc)
    return LaTeXExportResponse(**pkg)


@router.post(
    "/{project_id}/research/export/bibtex",
    response_model=BibTeXExportResponse,
    summary="Export BibTeX References"
)
async def export_bibtex(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export formatted BibTeX bibliography."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
    if not doc:
        doc = await research_generator_service.generate_full_document(db, project, user_id=current_user.id)

    res = research_generator_service.export_bibtex(db, doc)
    return BibTeXExportResponse(**res)


@router.post(
    "/{project_id}/research/export/markdown",
    response_model=MarkdownExportResponse,
    summary="Export GitHub-Flavored Markdown Research Draft"
)
async def export_markdown(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export formatted Markdown academic draft."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
    if not doc:
        doc = await research_generator_service.generate_full_document(db, project, user_id=current_user.id)

    res = research_generator_service.export_markdown(db, doc)
    return MarkdownExportResponse(**res)


@router.post(
    "/{project_id}/research/export/technical-report",
    response_model=TechnicalReportExportResponse,
    summary="Export 19-Section Institutional Technical Project Report"
)
async def export_technical_report(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export comprehensive 19-section engineering technical report."""
    project = _authorize_project_access(project_id, current_user, db)
    res = research_generator_service.export_technical_report(db, project)
    return TechnicalReportExportResponse(**res)


# -------------------------------------------------------------
# Version Control & Rollback
# -------------------------------------------------------------
@router.get(
    "/{project_id}/research/versions",
    response_model=List[ResearchDocumentVersionResponse],
    summary="List Document Version Snapshots"
)
async def list_versions(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List immutable version history snapshots for rollback."""
    _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
    if not doc:
        return []
    return db.query(ResearchDocumentVersion).filter(
        ResearchDocumentVersion.document_id == doc.id
    ).order_by(ResearchDocumentVersion.created_at.desc()).all()


@router.post(
    "/{project_id}/research/versions/{version_id}/restore",
    response_model=ResearchDocumentResponse,
    summary="Rollback to Prior Version Snapshot"
)
async def restore_version(
    project_id: int,
    version_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore document content from a prior version snapshot."""
    project = _authorize_project_access(project_id, current_user, db)
    doc = db.query(ResearchDocument).filter(ResearchDocument.project_id == project_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Research document not found.")

    doc = research_generator_service.restore_version_snapshot(db, doc, version_id)
    doc.citations_count = len(doc.citations)
    doc.experiments_count = len(project.experiments)
    return doc
