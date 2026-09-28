"""
Authoritative Scoring Formulas and Weight Definitions for InnoSphere AI.
Shared across backend evaluation engines and frontend explanatory tooltips.
"""
from typing import Dict, Any, List

SCORING_FORMULAS: Dict[str, Dict[str, Any]] = {
    "feasibility": {
        "title": "Feasibility Score",
        "description": "Measures technical viability, stack availability, and execution probability on a standard academic timeline.",
        "factors": [
            {"name": "Technical Stack Availability", "weight": 25, "desc": "Maturity of open-source frameworks, libraries, and runtime stability."},
            {"name": "Hardware & Data Accessibility", "weight": 25, "desc": "Access to required sensors, datasets, compute, and physical lab testbeds."},
            {"name": "Timeline & Execution Complexity", "weight": 20, "desc": "Prerequisite depth and deliverability within typical capstone cycles."},
            {"name": "Problem Scope Clarity", "weight": 15, "desc": "Precision of problem definition, boundary conditions, and target metrics."},
            {"name": "Team Skill Alignment", "weight": 15, "desc": "Compatibility with student background and prerequisite learning curves."}
        ],
        "formula": "Feasibility = 0.25*(TechStack) + 0.25*(DataHardware) + 0.20*(Timeline) + 0.15*(ScopeClarity) + 0.15*(SkillFit)"
    },
    "novelty": {
        "title": "Novelty & Innovation Score",
        "description": "Evaluates conceptual originality against published literature, patent prior art, and open-source implementations.",
        "factors": [
            {"name": "Literature Gap & Differentiation", "weight": 35, "desc": "Semantic divergence from indexed arXiv, OpenAlex, and Crossref papers."},
            {"name": "Patent & Prior Art Distance", "weight": 30, "desc": "Absence of conflicting patent claims and prior commercial filings."},
            {"name": "Architectural Uniqueness", "weight": 20, "desc": "Novelty in component orchestration, edge adaptations, or loss formulations."},
            {"name": "Open-Source Differentiation", "weight": 15, "desc": "Improvement over existing public GitHub / Hugging Face baselines."}
        ],
        "formula": "Novelty = 0.35*(LiteratureGap) + 0.30*(PatentDistance) + 0.20*(ArchitectureNovelty) + 0.15*(BaselineImprovement)"
    },
    "market_potential": {
        "title": "Market & Social Impact Potential",
        "description": "Quantifies stakeholder utility, addressable beneficiaries, scalability, and practical field deployment viability.",
        "factors": [
            {"name": "Stakeholder Impact & Relevance", "weight": 35, "desc": "Direct benefit to identified target communities, hospitals, or industries."},
            {"name": "Problem Severity & Demand", "weight": 30, "desc": "Urgency and economic or social cost of the addressed bottleneck."},
            {"name": "Field Deployment Viability", "weight": 20, "desc": "Affordability, maintenance requirements, and edge infrastructure fit."},
            {"name": "Scalability & Reproducibility", "weight": 15, "desc": "Ease of replicating the solution across regional test sites."}
        ],
        "formula": "MarketPotential = 0.35*(StakeholderImpact) + 0.30*(ProblemSeverity) + 0.20*(DeploymentViability) + 0.15*(Scalability)"
    },
    "risk": {
        "title": "Project Risk Profile",
        "description": "Assesses potential failure vectors, dependency bottlenecks, empirical validation deficits, and security exposures.",
        "factors": [
            {"name": "Technical & Algorithmic Complexity Risk", "weight": 35, "desc": "Risk of convergence failure, unquantized latency, or compute starvation."},
            {"name": "Hardware & Component Supply Risk", "weight": 25, "desc": "Sensor calibration drift, component lead times, and power limits."},
            {"name": "Empirical Validation Deficit", "weight": 25, "desc": "Lack of controlled ground truth trials and reproducible baselines."},
            {"name": "Security & Regulatory Compliance", "weight": 15, "desc": "Data privacy, clinical ethics, or hazardous environment safety."}
        ],
        "formula": "Risk = 0.35*(TechnicalRisk) + 0.25*(HardwareRisk) + 0.25*(ValidationDeficit) + 0.15*(SecurityCompliance)"
    }
}
