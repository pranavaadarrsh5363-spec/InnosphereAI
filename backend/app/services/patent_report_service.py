import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.patent import PatentSearch, PatentSearchResult, PatentDocument, SavedPriorArt, PatentOverlap
from app.schemas.patent import LEGAL_SAFETY_DISCLAIMER


class PatentReportService:
    """
    Generates structured, exportable Prior-Art Intelligence Reports
    in Markdown, JSON, CSV, and Vector SVG formats.
    """

    @classmethod
    def generate_report(
        cls, db: Session, project_id: int, format_type: str = "markdown"
    ) -> Dict[str, str]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project #{project_id} not found")

        search = (
            db.query(PatentSearch)
            .filter(PatentSearch.project_id == project_id)
            .order_by(PatentSearch.created_at.desc())
            .first()
        )

        results = search.results if search else []
        saved_items = (
            db.query(SavedPriorArt)
            .filter(SavedPriorArt.project_id == project_id)
            .all()
        )
        overlaps = (
            db.query(PatentOverlap)
            .filter(PatentOverlap.project_id == project_id)
            .all()
        )

        fmt = format_type.lower().strip()
        filename_base = f"prior_art_report_project_{project_id}"

        if fmt == "json":
            payload = {
                "project": {
                    "id": project.id,
                    "title": project.title,
                    "domain": project.domain,
                    "problem_statement": project.problem_statement,
                    "proposed_solution": project.proposed_solution,
                },
                "search_meta": {
                    "query": search.query_text if search else "",
                    "coverage_score": search.search_coverage_score if search else 0.0,
                    "providers_used": search.providers_used if search else [],
                    "stages_searched": search.stages_searched if search else [],
                },
                "prior_art_results": [
                    {
                        "publication_number": r.patent.publication_number,
                        "title": r.patent.title,
                        "jurisdiction": r.patent.jurisdiction,
                        "publication_date": r.patent.publication_date,
                        "technical_similarity": r.technical_similarity_score,
                        "feature_overlap": r.feature_overlap_level,
                        "why_similar": r.why_similar,
                        "potential_differences": r.potential_differences,
                    }
                    for r in results if r.patent
                ],
                "overlaps": [
                    {
                        "area": o.overlap_area,
                        "category": o.category,
                        "detail": o.technical_detail,
                        "evidence": o.evidence_source,
                    }
                    for o in overlaps
                ],
                "saved_prior_art_count": len(saved_items),
                "legal_disclaimer": LEGAL_SAFETY_DISCLAIMER,
            }
            return {
                "format": "json",
                "content_type": "application/json",
                "filename": f"{filename_base}.json",
                "data": json.dumps(payload, indent=2),
                "legal_disclaimer": LEGAL_SAFETY_DISCLAIMER,
            }

        elif fmt == "csv":
            csv_lines = [
                "Publication_Number,Title,Jurisdiction,Publication_Date,Assignee,Technical_Similarity_Score,Feature_Overlap_Level,Evidence_Status"
            ]
            for r in results:
                if not r.patent:
                    continue
                p = r.patent
                p_title = p.title.replace('"', '""')
                assignee_str = (", ".join(p.assignees)).replace('"', '""') if p.assignees else "N/A"
                csv_lines.append(
                    f'"{p.publication_number}","{p_title}","{p.jurisdiction}","{p.publication_date or "N/A"}","{assignee_str}",{r.technical_similarity_score},"{r.feature_overlap_level}","{r.evidence_status}"'
                )
            return {
                "format": "csv",
                "content_type": "text/csv",
                "filename": f"{filename_base}.csv",
                "data": "\n".join(csv_lines),
                "legal_disclaimer": LEGAL_SAFETY_DISCLAIMER,
            }

        elif fmt in ["svg", "image/svg+xml"]:
            svg_data = cls._generate_vector_svg(project.title, results, overlaps)
            return {
                "format": "svg",
                "content_type": "image/svg+xml",
                "filename": f"{filename_base}.svg",
                "data": svg_data,
                "legal_disclaimer": LEGAL_SAFETY_DISCLAIMER,
            }

        else: # Markdown report default
            md_parts = [
                f"# Prior-Art Intelligence & Technical Similarity Report",
                f"**Project:** {project.title} (Domain: {project.domain})",
                f"**Generated:** {search.created_at.strftime('%Y-%m-%d %H:%M UTC') if search else 'Recent'}",
                f"**Search Coverage:** {search.search_coverage_score if search else 75.0}%",
                "",
                "> **LEGAL & SCIENTIFIC SAFETY DISCLAIMER:**",
                f"> {LEGAL_SAFETY_DISCLAIMER}",
                "",
                "## 1. Project Innovation Concept & Extracted Features",
                f"- **Problem Statement:** {project.problem_statement}",
                f"- **Proposed Solution:** {project.proposed_solution}",
                f"- **Technology Stack:** {', '.join(project.technologies or ['Edge AI', 'IoT'])}",
                "",
                "## 2. Multi-Stage Prior-Art Search Results",
                f"Total Prior-Art Documents Analyzed: **{len(results)}**",
                "",
            ]

            for idx, r in enumerate(results[:8]):
                if not r.patent:
                    continue
                p = r.patent
                md_parts.extend([
                    f"### {idx+1}. [{p.publication_number}] {p.title}",
                    f"- **Jurisdiction:** {p.jurisdiction} | **Publication Date:** {p.publication_date or 'N/A'} | **Priority Date:** {p.priority_date or 'N/A'}",
                    f"- **Assignee:** {', '.join(p.assignees) if p.assignees else 'Not disclosed'}",
                    f"- **AI Technical Similarity:** `{r.technical_similarity_score}%` ({r.feature_overlap_level})",
                    f"- **Why Similar:** {'; '.join(r.why_similar) if r.why_similar else 'General technical overlap'}",
                    f"- **Potential Differentiation:** {'; '.join(r.potential_differences) if r.potential_differences else 'Architectural variations'}",
                    f"- **Source URL:** {p.source_url or p.official_url or 'Google Patents'}",
                    ""
                ])

            md_parts.extend([
                "## 3. Potential Technical Overlap & Differentiation Areas",
            ])
            for o in overlaps:
                md_parts.append(f"- **{o.overlap_area}** ({o.category}): {o.technical_detail} — *Opportunity:* {o.differentiation_opportunity}")

            md_parts.extend([
                "",
                "## 4. Search Limitations & Non-Exhaustiveness",
                "- Search is bounded by accessible public open patent databases and queried technical terminology.",
                "- Technical similarity calculations are statistical & semantic indicators, not legal opinions.",
                "- Unpublished patent applications subject to statutory 18-month secrecy periods are not indexed.",
            ])

            return {
                "format": "markdown",
                "content_type": "text/markdown",
                "filename": f"{filename_base}.md",
                "data": "\n".join(md_parts),
                "legal_disclaimer": LEGAL_SAFETY_DISCLAIMER,
            }

    @classmethod
    def _generate_vector_svg(
        cls, project_title: str, results: List[PatentSearchResult], overlaps: List[PatentOverlap]
    ) -> str:
        width = 1200
        height = 800
        svg = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">',
            '  <defs>',
            '    <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '      <stop offset="0%" stop-color="#0F172A" />',
            '      <stop offset="100%" stop-color="#1E293B" />',
            '    </linearGradient>',
            '  </defs>',
            f'  <rect width="{width}" height="{height}" fill="url(#pGrad)" rx="16" />',
            f'  <text x="40" y="55" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#F8FAFC">{project_title} — Prior-Art Intelligence Landscape</text>',
            '  <text x="40" y="85" font-family="system-ui, sans-serif" font-size="13" fill="#94A3B8">InnoSphere AI • AI-Assisted Prior-Art Exploration • Research & Innovation Use Only</text>',
            '  <g id="cards" transform="translate(40, 120)">',
        ]

        y_offset = 0
        for r in results[:6]:
            if not r.patent:
                continue
            p = r.patent
            sim = r.technical_similarity_score
            badge_color = "#10B981" if sim < 50 else ("#F59E0B" if sim < 75 else "#EF4444")
            svg.append(f'    <g transform="translate(0, {y_offset})">')
            svg.append(f'      <rect width="1120" height="85" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1.5" />')
            svg.append(f'      <text x="20" y="30" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#F1F5F9">[{p.publication_number}] {p.title[:65]}...</text>')
            svg.append(f'      <text x="20" y="54" font-family="system-ui, sans-serif" font-size="12" fill="#94A3B8">{p.jurisdiction} • {p.publication_date or "Recent"} • {", ".join(p.assignees[:1]) if p.assignees else "Open Source"}</text>')
            svg.append(f'      <text x="20" y="72" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Why: {r.why_similar[0] if r.why_similar else "General technical overlap"}</text>')
            svg.append(f'      <rect x="960" y="25" width="135" height="32" rx="8" fill="#0F172A" stroke="{badge_color}" stroke-width="1.5" />')
            svg.append(f'      <text x="1027" y="46" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="{badge_color}">Sim: {sim}%</text>')
            svg.append('    </g>')
            y_offset += 98

        svg.append('  </g>')
        svg.append(f'  <text x="40" y="765" font-family="system-ui, sans-serif" font-size="10" fill="#64748B">DISCLAIMER: {LEGAL_SAFETY_DISCLAIMER[:130]}...</text>')
        svg.append('</svg>')
        return "\n".join(svg)
