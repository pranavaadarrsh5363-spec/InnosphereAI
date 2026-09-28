/**
 * Authoritative Scoring Formulas and Factor Weights for InnoSphere AI.
 * Keeps frontend explanatory score tooltips synchronized with backend evaluation logic.
 */

export interface ScoringFactor {
  name: string;
  weight: number; // percentage (e.g. 25 for 25%)
  desc: string;
}

export interface ScoreFormulaConfig {
  key: string;
  title: string;
  description: string;
  formula: string;
  factors: ScoringFactor[];
}

export const SCORING_FORMULAS: Record<string, ScoreFormulaConfig> = {
  feasibility: {
    key: 'feasibility',
    title: 'Feasibility Score',
    description: 'Measures technical viability, stack availability, and execution probability on a standard academic timeline.',
    formula: 'Feasibility = 25% Stack + 25% Data/HW + 20% Timeline + 15% Scope + 15% Skills',
    factors: [
      { name: 'Technical Stack Availability', weight: 25, desc: 'Maturity of open-source frameworks, libraries, and runtime stability.' },
      { name: 'Hardware & Data Accessibility', weight: 25, desc: 'Access to required sensors, datasets, compute, and physical lab testbeds.' },
      { name: 'Timeline & Execution Complexity', weight: 20, desc: 'Prerequisite depth and deliverability within typical capstone cycles.' },
      { name: 'Problem Scope Clarity', weight: 15, desc: 'Precision of problem definition, boundary conditions, and target metrics.' },
      { name: 'Team Skill Alignment', weight: 15, desc: 'Compatibility with student background and prerequisite learning curves.' },
    ],
  },
  novelty: {
    key: 'novelty',
    title: 'Novelty & Innovation Score',
    description: 'Evaluates conceptual originality against published literature, patent prior art, and open-source implementations.',
    formula: 'Novelty = 35% Literature Gap + 30% Prior Art + 20% Architecture + 15% Baseline Lift',
    factors: [
      { name: 'Literature Gap & Differentiation', weight: 35, desc: 'Semantic divergence from indexed arXiv, OpenAlex, and Crossref papers.' },
      { name: 'Patent & Prior Art Distance', weight: 30, desc: 'Absence of conflicting patent claims and prior commercial filings.' },
      { name: 'Architectural Uniqueness', weight: 20, desc: 'Novelty in component orchestration, edge adaptations, or loss formulations.' },
      { name: 'Open-Source Differentiation', weight: 15, desc: 'Improvement over existing public GitHub and Hugging Face baselines.' },
    ],
  },
  market_potential: {
    key: 'market_potential',
    title: 'Market & Social Impact Potential',
    description: 'Quantifies stakeholder utility, addressable beneficiaries, scalability, and practical field deployment viability.',
    formula: 'Market Potential = 35% Impact + 30% Problem Severity + 20% Field Viability + 15% Scalability',
    factors: [
      { name: 'Stakeholder Impact & Relevance', weight: 35, desc: 'Direct benefit to identified target communities, hospitals, or industries.' },
      { name: 'Problem Severity & Demand', weight: 30, desc: 'Urgency and economic or social cost of the addressed bottleneck.' },
      { name: 'Field Deployment Viability', weight: 20, desc: 'Affordability, maintenance requirements, and edge infrastructure fit.' },
      { name: 'Scalability & Reproducibility', weight: 15, desc: 'Ease of replicating the solution across regional test sites.' },
    ],
  },
  risk: {
    key: 'risk',
    title: 'Project Risk Profile',
    description: 'Assesses potential failure vectors, dependency bottlenecks, empirical validation deficits, and security exposures.',
    formula: 'Risk = 35% Technical Complexity + 25% Hardware/Supply + 25% Validation Deficit + 15% Compliance',
    factors: [
      { name: 'Technical & Algorithmic Complexity', weight: 35, desc: 'Risk of convergence failure, unquantized latency, or compute starvation.' },
      { name: 'Hardware & Component Supply', weight: 25, desc: 'Sensor calibration drift, component lead times, and power limits.' },
      { name: 'Empirical Validation Deficit', weight: 25, desc: 'Lack of controlled ground truth trials and reproducible baselines.' },
      { name: 'Security & Regulatory Compliance', weight: 15, desc: 'Data privacy, clinical ethics, or hazardous environment safety.' },
    ],
  },
};
