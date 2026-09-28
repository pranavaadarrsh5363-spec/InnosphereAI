export type UserRole = 'student' | 'mentor' | 'admin';

export interface UserProfile {
  id: number;
  user_id: number;
  institution?: string;
  course?: string;
  department?: string;
  skills: string[];
  interests: string[];
  innovation_domains: string[];
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  profile?: UserProfile;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  problem_statement: string;
  proposed_solution: string;
  domain: string;
  technologies: string[];
  status: 'idea' | 'research' | 'planning' | 'prototype' | 'development' | 'testing' | 'completed';
  progress: number;
  tags: string[];
  user_id: number;
  created_at: string;
  updated_at: string;
  ideas_count?: number;
  saved_resources_count?: number;
  has_analysis?: boolean;
  has_roadmap?: boolean;
  has_insights?: boolean;
}

export interface Idea {
  id: number;
  title: string;
  problem_description: string;
  proposed_solution: string;
  domain: string;
  target_users: string;
  technologies_known: string[];
  technologies_interested: string[];
  expected_impact: string;
  available_resources?: string;
  project_stage?: string;
  project_id?: number;
  user_id: number;
  created_at: string;
  has_analysis?: boolean;
  analysis?: AIAnalysis;
}

export interface RequiredTechnology {
  category: string;
  name: string;
  why: string;
  difficulty?: string;
}

export interface AIAnalysis {
  id: number;
  idea_id: number;
  summary: string;
  problem_identified: string;
  target_users: string;
  required_technologies: RequiredTechnology[];
  required_resources: {
    datasets?: string[];
    apis?: string[];
    papers?: string[];
    hardware?: string[];
    tools?: string[];
    frameworks?: string[];
    [key: string]: any;
  };
  innovation_opportunities: string[];
  potential_challenges: {
    technical?: string[];
    data?: string[];
    security?: string[];
    scalability?: string[];
    [key: string]: any;
  };
  ai_suggestions: {
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
  feasibility_score: number;
  innovation_score: number;
  market_potential_score: number;
  complexity_level: string;
  created_at: string;
}

export type ResourceType =
  | 'research_paper'
  | 'dataset'
  | 'api'
  | 'github_repo'
  | 'tool'
  | 'course'
  | 'ai_model'
  | 'documentation';

export interface RelevanceBreakdown {
  semantic_similarity: number;
  domain_match: number;
  technology_match: number;
  skill_match: number;
  keyword_relevance: number;
  quality_signal: number;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  resource_type: ResourceType;
  source: string;
  url: string;
  authors: string[];
  technologies: string[];
  domain: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  is_open_source: boolean;
  is_free: boolean;
  published_date?: string;
  metadata_json?: Record<string, any>;
  extra_metadata?: Record<string, any>;
  relevance_score?: number;
  relevance_explanation?: string;
  why_relevant_points?: string[];
  relevance_breakdown?: RelevanceBreakdown;
  search_mode?: 'hybrid' | 'semantic' | 'keyword';
  doi?: string;
  external_id?: string;
  is_saved?: boolean;
  is_demo?: boolean;
}

export interface VectorDiagnostics {
  vector_search_available: boolean;
  embedding_provider: string;
  embedding_model: string;
  dimensions: number;
  cache_size: number;
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate_pct: number;
  generation_count: number;
  generation_failures: number;
  last_index_update: string;
}

export interface SavedResource {
  id: number;
  resource_id: number;
  project_id?: number;
  category: string;
  tags: string[];
  notes?: string;
  rating: number;
  relevance_score: number;
  relevance_explanation?: string;
  created_at: string;
  resource: Resource;
}

export interface RoadmapTask {
  id: number;
  phase_number: number;
  phase_name: string;
  title: string;
  description?: string;
  is_completed: boolean;
  deadline?: string;
  notes?: string;
  priority: 'High' | 'Medium' | 'Low';
  order_idx: number;
  resources_suggested: { title: string; url: string }[];
}

export interface RoadmapPhase {
  phase_number: number;
  phase_name: string;
  description?: string;
  tasks: RoadmapTask[];
}

export interface ProjectRoadmap {
  id: number;
  project_id: number;
  project_title: string;
  completion_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  phases: RoadmapPhase[];
}

export interface KeyInsight {
  title: string;
  detail: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface AIInsight {
  id: number;
  project_id: number;
  project_title: string;
  domain: string;
  key_insights: KeyInsight[];
  technology_trends: { tech: string; adoption: string; reason: string }[];
  research_trends: { topic: string; recent_breakthrough: string }[];
  innovation_gaps: { gap: string; current_state: string; your_advantage: string }[];
  opportunity_areas: { area: string; actionable_step: string }[];
  similar_solutions: { name: string; similarity: string; difference: string; url: string }[];
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface MentorReview {
  id: number;
  mentor_name: string;
  feedback: string;
  rating: number;
  strengths: string[];
  areas_for_improvement: string[];
  recommended_technologies: string[];
  created_at: string;
}

export interface AnalyticsOverview {
  metrics: {
    resources_discovered: number;
    ideas_analyzed: number;
    technologies_explored: number;
    research_sources: number;
    student_projects: number;
    active_innovators: number;
    tasks_completed: number;
    total_roadmap_tasks: number;
    hardware_devices_active?: number;
    hardware_sensors_configured?: number;
    experiments_completed?: number;
    anomalies_detected?: number;
    telemetry_packets_simulated?: number;
    innovation_velocity: string;
  };
  domain_distribution: { domain: string; count: number }[];
  status_distribution: { status: string; count: number }[];
  featured_technologies: { name: string; domain: string; projects_using: number }[];
}

export interface HardwareSensor {
  id: number;
  device_id: number;
  name: string;
  sensor_type: string;
  unit: string;
  min_val: number;
  max_val: number;
  sampling_interval_ms: number;
  normal_range_min: number;
  normal_range_max: number;
  warning_threshold: number;
  critical_threshold: number;
  current_val: number;
  status: 'normal' | 'warning' | 'critical' | 'anomaly' | 'offline';
  pin_interface?: string;
  created_at?: string;
}

export interface HardwareDevice {
  id: number;
  project_id: number;
  name: string;
  device_type: string;
  network_protocol: string;
  location_label: string;
  firmware_version: string;
  status: 'online' | 'offline' | 'standby' | 'error';
  is_simulating: boolean;
  battery_level: number;
  signal_strength_dbm: number;
  packet_loss_rate: number;
  device_temp_c: number;
  uptime_seconds: number;
  sensors: HardwareSensor[];
  created_at: string;
  updated_at: string;
}

export interface TelemetryRecord {
  id: number;
  device_id: number;
  sensor_id: number;
  value: number;
  timestamp: string;
  is_anomaly: boolean;
  anomaly_type?: string;
}

export interface HardwareAlert {
  id: number;
  project_id: number;
  device_id: number;
  sensor_id?: number;
  alert_level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  sensor_name: string;
  recorded_value: number;
  threshold_exceeded: number;
  is_resolved: boolean;
  timestamp: string;
}

export interface HardwareExperiment {
  id: number;
  project_id: number;
  name: string;
  objective: string;
  status: 'draft' | 'running' | 'completed' | 'archived';
  duration_seconds: number;
  sensors_tested: string[];
  anomalies_detected: number;
  packets_transmitted: number;
  packet_loss_pct: number;
  observations: string;
  ai_evaluation?: string;
  result_summary: string;
  created_at: string;
  completed_at?: string;
}

export interface HardwareOverview {
  project_id: number;
  project_title: string;
  domain: string;
  devices: HardwareDevice[];
  recent_alerts: HardwareAlert[];
  experiments: HardwareExperiment[];
  recommended_hardware_resources: {
    title: string;
    category: string;
    source: string;
    description: string;
    url: string;
    tags: string[];
  }[];
}

export interface SupportingResourceLink {
  title: string;
  url: string;
  resource_type: string;
  source: string;
  relevance_note?: string;
}

export interface ReadinessDimension {
  key: string;
  name: string;
  score: number;
  weight: number;
  status: 'EXEMPLARY' | 'STRONG' | 'DEVELOPING' | 'NEEDS_ATTENTION' | 'CRITICAL';
  summary: string;
  evidence: string[];
  actionable_recommendations: string[];
}

export interface ProjectRiskItem {
  id: string;
  category: 'Technical' | 'Research' | 'Execution' | 'Dataset' | 'Hardware' | 'Security';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impact: string;
  evidence: string;
  mitigation: string;
  is_resolved: boolean;
}

export interface NextBestAction {
  title: string;
  rationale: string;
  impact_score: number;
  estimated_effort: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
  suggested_phase: string;
  actionable_steps: string[];
  supporting_resources: SupportingResourceLink[];
}

export interface ResearchCluster {
  cluster_name: string;
  pillar: string;
  resource_count: number;
  key_findings: string[];
  sample_resources: SupportingResourceLink[];
  gap_identification: string;
}

export interface InnovationGapItem {
  gap: string;
  current_state: string;
  your_advantage: string;
  recommended_action: string;
}

export interface HardwareIntelligence {
  is_hardware_enabled: boolean;
  device_count: number;
  sensor_count: number;
  packet_health_pct: number;
  anomalies_detected: number;
  validation_status: string;
}

export interface HealthTimelinePoint {
  id: number;
  health_score: number;
  health_status: string;
  created_at: string;
  summary_verdict?: string;
}

export interface ProjectHealthSummary {
  project_id: number;
  project_title: string;
  domain: string;
  overall_score: number;
  health_status: string;
  status_label: string;
  status_description: string;
  dimensions: ReadinessDimension[];
  computed_at: string;
}

export interface ProjectIntelligenceProfile {
  project_id: number;
  project_title: string;
  domain: string;
  overall_health_score: number;
  health_status: 'EXEMPLARY' | 'STRONG' | 'DEVELOPING' | 'NEEDS_ATTENTION' | 'CRITICAL';
  summary_verdict: string;
  dimensions: ReadinessDimension[];
  risks: ProjectRiskItem[];
  next_best_action: NextBestAction;
  research_clusters: ResearchCluster[];
  innovation_gaps: InnovationGapItem[];
  hardware_intelligence: HardwareIntelligence;
  timeline_snapshots: HealthTimelinePoint[];
  cache_hit: boolean;
  evaluated_at: string;
}

// -------------------------------------------------------------
// AI Research Workspace & Technical Document Suite Types
// -------------------------------------------------------------
export interface ResearchCitation {
  id: number;
  document_id: number;
  project_id: number;
  resource_id?: number;
  citation_key: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  publisher?: string;
  doi?: string;
  arxiv_id?: string;
  openalex_id?: string;
  url?: string;
  bibtex?: string;
  ieee_text?: string;
  apa_text?: string;
  source: string;
  resource_type: string;
  claim_tags: string[];
  is_verified: boolean;
  created_at: string;
}

export interface ExperimentRun {
  id: number;
  experiment_id: number;
  run_number: number;
  run_label?: string;
  random_seed?: number;
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  baseline_metrics?: Record<string, number>;
  execution_time_ms?: number;
  status: 'running' | 'completed' | 'failed';
  environment_snapshot?: Record<string, any>;
  logs_or_notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface MetricStatisticalSummary {
  run_count?: number;
  mean?: number;
  median?: number;
  min_val?: number;
  max_val?: number;
  std_dev?: number;
}

export interface ExperimentResult {
  id: number;
  experiment_id: number;
  run_id?: number;
  metric_name: string;
  metric_type: string;
  baseline_value?: number;
  proposed_value?: number;
  unit?: string;
  direction: 'higher_is_better' | 'lower_is_better' | 'neutral';
  difference?: number;
  percentage_difference?: number;
  comparison_label?: 'Improved' | 'Similar' | 'Lower' | 'Higher' | 'Not comparable' | string;
  statistical_summary?: MetricStatisticalSummary;
  source: 'computed' | 'manual' | 'hardware_telemetry' | 'benchmark' | string;
  notes?: string;
  created_at: string;
}

export interface BenchmarkReference {
  id: number;
  project_id: number;
  experiment_id?: number;
  reference_name: string;
  method_name: string;
  dataset_name?: string;
  metric_name: string;
  reported_value: number;
  unit?: string;
  source_citation?: string;
  source_section_page?: string;
  doi?: string;
  is_published_reference: boolean;
  created_at: string;
}

export interface ExperimentEvidence {
  id: number;
  experiment_id: number;
  evidence_type: 'run_log' | 'metric_chart' | 'confusion_matrix' | 'hardware_telemetry' | 'dataset_sample' | 'published_paper' | 'code_repo' | string;
  title: string;
  description?: string;
  file_path_or_url?: string;
  reference_id?: string;
  verification_status: 'verified' | 'unverified' | 'needs_review' | string;
  created_at: string;
}

export interface ReproducibilityItem {
  key: string;
  label: string;
  description: string;
  is_recorded: boolean;
  notes: string;
}

export interface ReproducibilityReportResponse {
  experiment_id: number;
  experiment_name: string;
  coverage_percentage: number;
  items_recorded: number;
  total_items: number;
  status_label: 'HIGH_REPRODUCIBILITY' | 'MODERATE_REPRODUCIBILITY' | 'LOW_REPRODUCIBILITY' | 'INSUFFICIENT_DETAILS' | string;
  items: ReproducibilityItem[];
  recommendations: string[];
  disclaimer: string;
}

export interface Experiment {
  id: number;
  project_id: number;
  research_document_id?: number;
  research_gap_id?: number;
  research_gap_title?: string;
  name: string;
  objective?: string;
  hypothesis?: string;
  independent_variables?: string[];
  dependent_variables?: string[];
  controlled_variables?: string[];
  dataset_used?: string;
  dataset_version?: string;
  dataset_source?: string;
  preprocessing_notes?: string;
  baseline_model?: string;
  proposed_method?: string;
  model_algorithm?: string;
  hardware_environment?: string;
  software_environment?: string;
  parameters?: Record<string, any>;
  hyperparameters?: Record<string, any>;
  random_seed?: number;
  evaluation_metrics?: string[];
  expected_outcome?: string;
  actual_outcome?: string;
  metrics?: Record<string, any>;
  results_summary?: string;
  status: 'planned' | 'running' | 'completed' | 'failed' | 'cancelled' | 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'READY' | string;
  evidence_notes?: string;
  is_simulated?: boolean;
  hardware_device_id?: number;
  reproducibility_score?: number;
  reproducibility_checklist?: Record<string, boolean>;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  runs?: ExperimentRun[];
  results?: ExperimentResult[];
  benchmarks?: BenchmarkReference[];
  evidence_links?: ExperimentEvidence[];
  reproducibility?: ReproducibilityReportResponse;
}

export interface ExperimentSummaryResponse {
  project_id: number;
  total_experiments: number;
  completed_count: number;
  running_count: number;
  planned_count: number;
  total_runs: number;
  total_benchmarks: number;
  total_evidence_links: number;
  avg_reproducibility_pct: number;
  recent_experiments: Experiment[];
}

export interface ExperimentSuggestionResponse {
  suggested_name: string;
  hypothesis: string;
  objective: string;
  research_gap_title: string;
  suggested_baseline: string;
  suggested_proposed_method: string;
  recommended_metrics: string[];
  independent_variables: string[];
  dependent_variables: string[];
  suggested_dataset_source: string;
  evaluation_protocol: string;
}

export interface ExperimentImportResponse {
  experiment_id: number;
  runs_imported: number;
  results_imported: number;
  parsed_metrics: string[];
  status: string;
}

export interface ExperimentSyncResearchResponse {
  project_id: number;
  document_id: number;
  experiments_synced_count: number;
  updated_sections: string[];
  latex_table_preview: string;
  markdown_table_preview: string;
  reproducibility_summary: string;
  message: string;
}

export interface ResearchDocumentVersion {
  id: number;
  document_id: number;
  version_number: string;
  version_label: string;
  doc_type: string;
  title: string;
  content_snapshot: Record<string, any>;
  changelog?: string;
  created_by_user_id?: number;
  created_at: string;
}

export interface ResearchDocument {
  id: number;
  project_id: number;
  doc_type: 'research_paper' | 'technical_report';
  title: string;
  abstract?: string;
  keywords: string[];
  problem_statement?: string;
  objectives?: string;
  related_work?: string;
  research_gap?: string;
  methodology?: string;
  architecture?: string;
  technology_stack?: string;
  dataset_description?: string;
  experimental_methodology?: string;
  results?: string;
  discussion?: string;
  limitations?: string;
  conclusion?: string;
  future_work?: string;
  sections?: Record<string, string>;
  status: string;
  version: string;
  citation_coverage_pct: number;
  quality_summary: Record<string, any>;
  citations_count: number;
  experiments_count: number;
  created_at: string;
  updated_at: string;
  generated_at?: string;
  [key: string]: any;
}

export interface QualityFinding {
  vector_name: string;
  status: 'READY' | 'STRONG' | 'NEEDS_DETAILS' | 'INCOMPLETE' | 'DEVELOPING' | 'MISSING';
  score: number;
  findings: string[];
  recommendations: string[];
}

export interface ResearchQualityReport {
  document_id: number;
  project_id: number;
  overall_readiness_score: number;
  overall_score?: number;
  readiness_label: string;
  structure_quality: QualityFinding;
  evidence_quality: QualityFinding;
  literature_diversity: QualityFinding;
  reproducibility: QualityFinding;
  technical_completeness: QualityFinding;
  citation_coverage_pct: number;
  supported_claims_count: number;
  unsupported_claims_count: number;
  disclaimer: string;
}

export interface EvidenceMapItem {
  section: string;
  claim_summary: string;
  evidence_type: 'paper' | 'dataset' | 'experiment' | 'telemetry' | 'mentor_rubric';
  source_title: string;
  source_url?: string;
  doi?: string;
  confidence_level: 'HIGH' | 'MEDIUM' | 'AI_SYNTHESIS';
}

export interface EvidenceMappingResponse {
  project_id: number;
  document_id: number;
  total_evidence_links: number;
  evidence_items: EvidenceMapItem[];
}

export interface LaTeXExportResponse {
  main_tex: string;
  references_bib: string;
  readme_md: string;
  template_type: string;
  filename: string;
}

export interface BibTeXExportResponse {
  bibtex_content: string;
  total_citations: number;
  filename: string;
}

export interface MarkdownExportResponse {
  markdown_content: string;
  title: string;
  doc_type: string;
  filename: string;
}

export interface TechnicalReportExportResponse {
  report_markdown: string;
  total_sections: number;
  project_title: string;
  filename: string;
}

// -----------------------------------------------------------------------------
// Validation, Innovation Proof & Competition Readiness Interfaces
// -----------------------------------------------------------------------------

export type ValidationStatus = 'VALIDATED' | 'PARTIALLY_VALIDATED' | 'INCONCLUSIVE' | 'NOT_VALIDATED' | 'NOT_TESTED';
export type ConfidenceIndicator = 'HIGH' | 'MEDIUM' | 'LOW' | 'PRELIMINARY';
export type ValidationType = 'SIMULATED' | 'DIGITAL_TESTBED' | 'PHYSICAL_HARDWARE' | 'SOFTWARE_PROTOTYPE' | 'FIELD_TEST' | 'USER_STUDY' | 'LITERATURE_SUPPORTED';
export type ChecklistStatus = 'READY' | 'PARTIAL' | 'MISSING';

export interface ValidationEvidence {
  id: number;
  project_id: number;
  claim_id?: number;
  evidence_type: string;
  title: string;
  description?: string;
  source_uri?: string;
  source_reference_id?: string;
  verification_status: string;
  validation_type: ValidationType;
  created_at: string;
}

export interface InnovationClaim {
  id: number;
  project_id: number;
  title: string;
  claim: string;
  category: string;
  description?: string;
  existing_solution?: string;
  proposed_solution?: string;
  expected_advantage?: string;
  validation_question: string;
  evidence_requirement?: string;
  status: ValidationStatus;
  confidence_indicator: ConfidenceIndicator;
  validation_type: ValidationType;
  linked_experiment_id?: number;
  linked_benchmark_id?: number;
  observed_result?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  evidence_items?: ValidationEvidence[];
}

export interface ValidationGap {
  id: number;
  project_id: number;
  claim_id?: number;
  claim_title?: string;
  gap_title: string;
  reason: string;
  required_evidence: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  suggested_action: string;
  linked_experiment_id?: number;
  is_resolved: boolean;
  created_at: string;
}

export interface ValidationDimensionScore {
  key: string;
  name: string;
  status: 'READY' | 'PARTIAL' | 'MISSING' | 'SIMULATED' | 'NOT_TESTED';
  score: number;
  evidence_count: number;
  summary: string;
  strengths: string[];
  missing_validation: string[];
}

export interface ValidationMatrixResponse {
  project_id: number;
  total_claims: number;
  validated_claims: number;
  partially_validated_claims: number;
  inconclusive_claims: number;
  not_validated_claims: number;
  not_tested_claims: number;
  evidence_coverage_pct: number;
  coverage_label: string;
  dimensions: ValidationDimensionScore[];
  claims: InnovationClaim[];
  gaps: ValidationGap[];
  disclaimer: string;
}

export interface DifferentiationRow {
  dimension: string;
  existing_approach: string;
  proposed_approach: string;
  evidence_state: string;
  evidence_source: string;
  evidence_type: 'published_paper' | 'recorded_experiment' | 'student_assumption' | 'ai_suggestion';
}

export interface InnovationDifferentiationMatrixResponse {
  project_id: number;
  project_title: string;
  domain: string;
  rows: DifferentiationRow[];
  novelty_disclaimer: string;
}

export interface CompetitionChecklistItem {
  id: number;
  project_id: number;
  category: string;
  title: string;
  description?: string;
  status: ChecklistStatus;
  is_custom: boolean;
  evidence_link?: string;
  order_idx: number;
  created_at: string;
}

export interface CompetitionPillarStatus {
  pillar: string;
  status: ChecklistStatus;
  score_pct: number;
  completed_items: string[];
  missing_items: string[];
}

export interface CompetitionReadinessResponse {
  project_id: number;
  project_title: string;
  overall_readiness_pct: number;
  readiness_verdict: string;
  pillars: CompetitionPillarStatus[];
  checklist: CompetitionChecklistItem[];
  strengths: string[];
  critical_missing_items: string[];
  disclaimer: string;
}

export interface DemoReadinessCheck {
  key: string;
  label: string;
  status: 'OPERATIONAL' | 'READY' | 'DEGRADED' | 'NOT_CONFIGURED';
  details: string;
}

export interface DemoStepItem {
  step_number: number;
  title: string;
  description: string;
  route_target: string;
  highlight_element: string;
}

export interface DemoReadinessResponse {
  project_id: number;
  is_demo_ready: boolean;
  total_checks: number;
  passed_checks: number;
  checks: DemoReadinessCheck[];
  guided_steps: DemoStepItem[];
}

export interface PresentationSlide {
  slide_number: number;
  title: string;
  subtitle: string;
  bullet_points: string[];
  visual_layout: 'split_left_chart' | 'kpi_deck' | 'architecture_flow' | 'table_comparison' | 'callout_metric';
  evidence_source?: string;
  speaker_notes: string;
}

export interface PresentationOutlineResponse {
  project_id: number;
  project_title: string;
  total_slides: number;
  theme: string;
  slides: PresentationSlide[];
  disclaimer: string;
}

export interface ProjectCostItem {
  id: number;
  project_id: number;
  category: string;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  is_recurring: boolean;
  recurring_period: string;
  is_estimated: boolean;
  source_or_vendor?: string;
  currency: string;
  notes?: string;
  created_at: string;
}

export interface ProjectCostAnalysisResponse {
  project_id: number;
  currency: string;
  total_prototype_cost: number;
  total_deployment_cost: number;
  recurring_monthly_cost: number;
  items: ProjectCostItem[];
  cost_status_label: string;
  disclaimer: string;
}

export interface ScalabilityDimension {
  dimension: string;
  current_capacity: string;
  documented_limit: string;
  bottleneck_risk: string;
  evidence_backing: string;
}

export interface ScalabilityAssessmentResponse {
  project_id: number;
  project_title: string;
  overall_scalability_score: number;
  dimensions: ScalabilityDimension[];
  empirical_observations: string[];
  disclaimer: string;
}

export interface StakeholderReview {
  id: number;
  project_id: number;
  reviewer_name: string;
  reviewer_role: string;
  review_date: string;
  problem_clarity_score?: number;
  solution_feasibility_score?: number;
  innovation_score?: number;
  usability_score?: number;
  feedback_text: string;
  recommendations: string[];
  evidence_attachment_url?: string;
  created_at: string;
}

export interface ValidationSyncResearchRequest {
  target_doc_type?: string;
  overwrite_sections?: boolean;
}

export interface ValidationSyncResearchResponse {
  project_id: number;
  document_id: number;
  claims_synced_count: number;
  evidence_items_count: number;
  updated_sections: string[];
  markdown_validation_matrix: string;
  latex_validation_matrix: string;
  summary_text: string;
  message: string;
}


