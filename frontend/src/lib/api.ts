// Production / Configurable Backend API URL
const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (!envUrl) {
    return 'http://localhost:8000/api/v1';
  }
  return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl}/api/v1`;
};

const API_BASE = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('innosphere_token') || sessionStorage.getItem('innosphere_token'))
    : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw new ApiError(errorData.detail || 'An unexpected error occurred', response.status, errorData);
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "We couldn't connect to the server right now. Please check that the backend is running.",
      0
    );
  }
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  googleLogin: (data: any) => request<any>('/auth/google', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  demoLogin: (role: string) => request<any>(`/auth/demo-login/${role}`, { method: 'POST' }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (data: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Projects
  getProjects: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/projects${qs}`);
  },
  createProject: (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  getProjectDetail: (id: number) => request<any>(`/projects/${id}`),
  getProject: (id: number) => request<any>(`/projects/${id}`),
  updateProject: (id: number, data: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<any>(`/projects/${id}`, { method: 'DELETE' }),

  // Ideas & AI Analysis
  getIdeas: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/ideas${qs}`);
  },
  submitIdea: (data: any) => request<any>('/ideas/submit', { method: 'POST', body: JSON.stringify(data) }),
  getIdea: (id: number) => request<any>(`/ideas/${id}`),
  getAnalysis: (ideaId: number) => request<any>(`/analysis/${ideaId}`),
  reanalyzeIdea: (ideaId: number) => request<any>(`/analysis/re-analyze/${ideaId}`, { method: 'POST' }),

  // Resources & Discovery
  discoverResources: (params?: Record<string, any>) => {
    const queryObj: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          queryObj[k] = String(v);
        }
      });
    }
    const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
    return request<{ total: number; query?: string; domain?: string; search_mode?: string; latency_ms?: number; results: any[] }>(`/resources/discover${qs}`);
  },
  semanticSearch: (data: { query: string; search_mode?: string; domain?: string; resource_type?: string; difficulty?: string; is_open_source?: boolean; is_free?: boolean; min_relevance?: number; project_id?: number; limit?: number; offset?: number; }) =>
    request<{ total: number; query: string; domain?: string; search_mode: string; latency_ms: number; embedding_provider: string; results: any[] }>('/resources/semantic-search', { method: 'POST', body: JSON.stringify(data) }),
  getVectorDiagnostics: () => request<any>('/resources/diagnostics'),
  saveResource: (data: any) => request<any>('/resources/save', { method: 'POST', body: JSON.stringify(data) }),
  getLibrary: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/resources/library${qs}`);
  },
  updateSavedResource: (id: number, data: any) => request<any>(`/resources/saved/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSavedResource: (id: number) => request<any>(`/resources/saved/${id}`, { method: 'DELETE' }),
  compareResources: (resourceIds: number[], ideaContext?: string) =>
    request<any>('/resources/compare', { method: 'POST', body: JSON.stringify({ resource_ids: resourceIds, idea_context: ideaContext }) }),

  // Roadmaps
  getRoadmap: (projectId: number) => request<any>(`/roadmaps/project/${projectId}`),
  updateRoadmapTask: (taskId: number, data: any) => request<any>(`/roadmaps/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
  addRoadmapTask: (projectId: number, data: any) => request<any>(`/roadmaps/tasks?project_id=${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
  deleteRoadmapTask: (taskId: number) => request<any>(`/roadmaps/tasks/${taskId}`, { method: 'DELETE' }),

  // Insights
  getInsights: (projectId: number) => request<any>(`/insights/project/${projectId}`),
  generateInsights: (projectId: number) => request<any>(`/insights/generate/${projectId}`, { method: 'POST' }),

  // Floating AI Assistant
  queryAssistant: (message: string, projectId?: number, contextType?: string) =>
    request<any>('/assistant/query', { method: 'POST', body: JSON.stringify({ message, project_id: projectId, context_type: contextType }) }),
  getChatHistory: (projectId?: number) => {
    const qs = projectId ? `?project_id=${projectId}` : '';
    return request<any[]>(`/assistant/history${qs}`);
  },

  // Mentor & Evaluation
  getMentorProjects: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/mentor/projects${qs}`);
  },
  submitMentorReview: (data: any) => request<any>('/mentor/review', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics & System Health
  getAnalytics: () => request<any>('/analytics/overview'),
  getUserStats: () => request<any>('/analytics/user-stats'),
  getSystemHealth: () => request<any>('/system/health'),

  // Hardware Lab & Telemetry Simulator
  getHardwareProject: (projectId: number) => request<any>(`/hardware/projects/${projectId}`),
  createHardwareDevice: (data: any) => request<any>('/hardware/devices', { method: 'POST', body: JSON.stringify(data) }),
  createHardwareSensor: (data: any) => request<any>('/hardware/sensors', { method: 'POST', body: JSON.stringify(data) }),
  deleteHardwareSensor: (sensorId: number) => request<any>(`/hardware/sensors/${sensorId}`, { method: 'DELETE' }),
  recordTelemetryBatch: (data: any) => request<any>('/hardware/telemetry/batch', { method: 'POST', body: JSON.stringify(data) }),
  getDeviceTelemetry: (deviceId: number, limit = 60) => request<any[]>(`/hardware/telemetry/${deviceId}?limit=${limit}`),
  injectHardwareAnomaly: (data: any) => request<any>('/hardware/anomalies/inject', { method: 'POST', body: JSON.stringify(data) }),
  getProjectAlerts: (projectId: number) => request<any[]>(`/hardware/alerts/${projectId}`),
  resolveHardwareAlert: (alertId: number) => request<any>(`/hardware/alerts/${alertId}/resolve`, { method: 'POST' }),
  createHardwareExperiment: (data: any) => request<any>('/hardware/experiments', { method: 'POST', body: JSON.stringify(data) }),
  getProjectExperiments: (projectId: number) => request<any[]>(`/hardware/experiments/${projectId}`),
  interpretHardwareTelemetry: (data: any) => request<any>('/hardware/interpret', { method: 'POST', body: JSON.stringify(data) }),

  // AI Project Intelligence & Innovation Health Engine
  getProjectIntelligence: (projectId: number) => request<any>(`/projects/${projectId}/intelligence`),
  refreshProjectIntelligence: (projectId: number) => request<any>(`/projects/${projectId}/intelligence/refresh`, { method: 'POST' }),
  getProjectHealth: (projectId: number) => request<any>(`/projects/${projectId}/health`),
  getNextBestAction: (projectId: number) => request<any>(`/projects/${projectId}/next-action`),
  getProjectRisks: (projectId: number) => request<any[]>(`/projects/${projectId}/risks`),
  getResearchLandscape: (projectId: number) => request<any>(`/projects/${projectId}/research-landscape`),
  getHealthHistory: (projectId: number) => request<any[]>(`/projects/${projectId}/health-history`),

  // AI Research Workspace & Technical Document Suite
  getResearchDocument: (projectId: number, docType = 'research_paper') =>
    request<any>(`/projects/${projectId}/research?doc_type=${docType}`),
  generateResearchDocument: (projectId: number, docType = 'research_paper') =>
    request<any>(`/projects/${projectId}/research/generate`, { method: 'POST', body: JSON.stringify({ doc_type: docType }) }),
  updateResearchDocument: (projectId: number, data: any, docType = 'research_paper') =>
    request<any>(`/projects/${projectId}/research?doc_type=${docType}`, { method: 'PUT', body: JSON.stringify(data) }),
  generateResearchSection: (projectId: number, sectionKey: string, customInstruction?: string) =>
    request<any>(
      `/projects/${projectId}/research/sections/${sectionKey}/generate`,
      { method: 'POST', body: JSON.stringify({ section_key: sectionKey, custom_instruction: customInstruction }) }
    ),
  getResearchCitations: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/research/citations`),
  addResearchCitation: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/research/citations`, { method: 'POST', body: JSON.stringify(data) }),
  deleteResearchCitation: (projectId: number, citationId: number) =>
    request<any>(`/projects/${projectId}/research/citations/${citationId}`, { method: 'DELETE' }),
  syncResearchCitations: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/research/citations/sync`, { method: 'POST' }),
  getResearchQuality: (projectId: number) =>
    request<any>(`/projects/${projectId}/research/quality`),
  getResearchEvidence: (projectId: number) =>
    request<any>(`/projects/${projectId}/research/evidence`),
  exportLaTeX: (projectId: number) =>
    request<any>(`/projects/${projectId}/research/export/latex`, { method: 'POST' }),
  exportBibTeX: (projectId: number) =>
    request<any>(`/projects/${projectId}/research/export/bibtex`, { method: 'POST' }),
  exportMarkdown: (projectId: number) =>
    request<any>(`/projects/${projectId}/research/export/markdown`, { method: 'POST' }),
  exportTechnicalReport: (projectId: number) =>
    request<any>(`/projects/${projectId}/research/export/technical-report`, { method: 'POST' }),
  getResearchVersions: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/research/versions`),
  restoreResearchVersion: (projectId: number, versionId: number) =>
    request<any>(`/projects/${projectId}/research/versions/${versionId}/restore`, { method: 'POST' }),

  // Empirical Experimentation & Reproducibility Engine
  getExperiments: (projectId: number, params?: { status?: string; search?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<any[]>(`/projects/${projectId}/experiments${qs}`);
  },
  createExperiment: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/experiments`, { method: 'POST', body: JSON.stringify(data) }),
  getExperimentSummary: (projectId: number) =>
    request<any>(`/projects/${projectId}/experiments/summary`),
  suggestExperimentFromGap: (projectId: number, gapTitle: string, gapDescription?: string, expType = 'machine_learning') =>
    request<any>(`/projects/${projectId}/experiments/suggest-from-gap`, {
      method: 'POST',
      body: JSON.stringify({ research_gap_title: gapTitle, research_gap_description: gapDescription, experiment_type: expType }),
    }),
  createExperimentFromHardware: (projectId: number, deviceId: number, experimentName?: string) => {
    const qs = experimentName ? `&experiment_name=${encodeURIComponent(experimentName)}` : '';
    return request<any>(`/projects/${projectId}/experiments/from-hardware?device_id=${deviceId}${qs}`, { method: 'POST' });
  },
  syncExperimentsToResearch: (projectId: number, data: { target_doc_type?: string; overwrite_sections?: boolean }) =>
    request<any>(`/projects/${projectId}/experiments/sync-research`, { method: 'POST', body: JSON.stringify(data) }),

  getExperimentDetail: (experimentId: number) =>
    request<any>(`/experiments/${experimentId}`),
  updateExperiment: (experimentId: number, data: any) =>
    request<any>(`/experiments/${experimentId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExperiment: (experimentId: number) =>
    request<any>(`/experiments/${experimentId}`, { method: 'DELETE' }),
  updateExperimentStatus: (experimentId: number, newStatus: string) =>
    request<any>(`/experiments/${experimentId}/status`, { method: 'POST', body: JSON.stringify({ new_status: newStatus }) }),

  // Multi-Run Execution & Logging
  getExperimentRuns: (experimentId: number) =>
    request<any[]>(`/experiments/${experimentId}/runs`),
  addExperimentRun: (experimentId: number, data: any) =>
    request<any>(`/experiments/${experimentId}/runs`, { method: 'POST', body: JSON.stringify(data) }),
  deleteExperimentRun: (runId: number) =>
    request<any>(`/runs/${runId}`, { method: 'DELETE' }),

  // Benchmark References
  getProjectBenchmarks: (projectId: number, experimentId?: number) => {
    const qs = experimentId ? `?experiment_id=${experimentId}` : '';
    return request<any[]>(`/projects/${projectId}/benchmarks${qs}`);
  },
  getExperimentBenchmarks: (experimentId: number) =>
    request<any[]>(`/experiments/${experimentId}/benchmark`),
  addBenchmarkReference: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/benchmarks`, { method: 'POST', body: JSON.stringify(data) }),
  deleteBenchmarkReference: (benchmarkId: number) =>
    request<any>(`/benchmarks/${benchmarkId}`, { method: 'DELETE' }),

  // Evidence Management
  getExperimentEvidenceList: (experimentId: number) =>
    request<any[]>(`/experiments/${experimentId}/evidence`),
  addExperimentEvidence: (experimentId: number, data: any) =>
    request<any>(`/experiments/${experimentId}/evidence`, { method: 'POST', body: JSON.stringify(data) }),
  deleteExperimentEvidence: (evidenceId: number) =>
    request<any>(`/evidence/${evidenceId}`, { method: 'DELETE' }),

  // Results, Reproducibility & CSV/JSON Import
  getExperimentResults: (experimentId: number) =>
    request<any[]>(`/experiments/${experimentId}/results`),
  addExperimentResult: (experimentId: number, data: any) =>
    request<any>(`/experiments/${experimentId}/results`, { method: 'POST', body: JSON.stringify(data) }),
  getExperimentReproducibility: (experimentId: number) =>
    request<any>(`/experiments/${experimentId}/reproducibility`),
  importExperimentResults: (experimentId: number, data: { file_format: 'csv' | 'json'; content: string; run_label?: string }) =>
    request<any>(`/experiments/${experimentId}/import-results`, { method: 'POST', body: JSON.stringify(data) }),

  // Project Innovation Showcase
  getShowcase: (projectId: number) =>
    request<any>(`/projects/${projectId}/showcase`),
  getShowcaseHealth: (projectId: number) =>
    request<any>(`/projects/${projectId}/showcase/health`),
  getShowcaseEvidence: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/showcase/evidence`),
  getEvidenceSummary: (projectId: number) =>
    request<any>(`/projects/${projectId}/showcase/evidence-summary`),
  getFlagshipShowcase: () =>
    request<any>(`/showcase/flagship`),

  // Skills & Prerequisites Gap Map
  getSkillsAnalysis: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills`),
  analyzeSkills: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/analyze`, { method: 'POST' }),
  getSkillRequirements: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/skills/requirements`),
  getSkillGaps: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/skills/gaps`),
  getSkillPrerequisites: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/prerequisites`),
  getSkillResources: (projectId: number) =>
    request<Record<string, any[]>>(`/projects/${projectId}/skills/resources`),
  getSkillLearningPath: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/learning-path`),
  updateStudentSkillProfileBatch: (projectId: number, profiles: any[]) =>
    request<any[]>(`/projects/${projectId}/skills/profile`, { method: 'POST', body: JSON.stringify({ profiles }) }),
  updateStudentSkillProfile: (projectId: number, profile: any) =>
    request<any>(`/projects/${projectId}/skills/profile`, { method: 'PUT', body: JSON.stringify(profile) }),
  syncSkillsToRoadmap: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/sync-roadmap`, { method: 'POST' }),
  refreshSkills: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/refresh`, { method: 'POST' }),
  exportSkillPlan: (projectId: number, format: 'markdown' | 'json' = 'markdown') =>
    request<any>(`/projects/${projectId}/skills/export?format=${format}`, { method: 'POST' }),
  getFlagshipSkills: () =>
    request<any>(`/skills/flagship`),
};

// -----------------------------------------------------------------------------
// Skills & Prerequisites Gap Map API
// -----------------------------------------------------------------------------
export const skillsApi = {
  getSkillsAnalysis: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills`),
  analyzeSkills: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/analyze`, { method: 'POST' }),
  getSkillRequirements: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/skills/requirements`),
  getSkillGaps: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/skills/gaps`),
  getSkillPrerequisites: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/prerequisites`),
  getSkillResources: (projectId: number) =>
    request<Record<string, any[]>>(`/projects/${projectId}/skills/resources`),
  getSkillLearningPath: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/learning-path`),
  updateStudentSkillProfileBatch: (projectId: number, profiles: any[]) =>
    request<any[]>(`/projects/${projectId}/skills/profile`, { method: 'POST', body: JSON.stringify({ profiles }) }),
  updateStudentSkillProfile: (projectId: number, profile: any) =>
    request<any>(`/projects/${projectId}/skills/profile`, { method: 'PUT', body: JSON.stringify(profile) }),
  syncSkillsToRoadmap: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/sync-roadmap`, { method: 'POST' }),
  refreshSkills: (projectId: number) =>
    request<any>(`/projects/${projectId}/skills/refresh`, { method: 'POST' }),
  exportSkillPlan: (projectId: number, format: 'markdown' | 'json' = 'markdown') =>
    request<any>(`/projects/${projectId}/skills/export?format=${format}`, { method: 'POST' }),
  getFlagshipSkills: () =>
    request<any>(`/skills/flagship`),
};

// -----------------------------------------------------------------------------
// Validation, Innovation Proof & Competition Readiness API
// -----------------------------------------------------------------------------
export const validationApi = {
  // Validation Matrix & Scorecard
  getValidationMatrix: (projectId: number) =>
    request<any>(`/projects/${projectId}/validation`),

  // Claims Lifecycle
  getClaims: (projectId: number, statusFilter?: string) => {
    const qs = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : '';
    return request<any[]>(`/projects/${projectId}/validation/claims${qs}`);
  },
  createClaim: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/validation/claims`, { method: 'POST', body: JSON.stringify(data) }),
  getClaim: (claimId: number) =>
    request<any>(`/validation/claims/${claimId}`),
  updateClaim: (claimId: number, data: any) =>
    request<any>(`/validation/claims/${claimId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClaim: (claimId: number) =>
    request<void>(`/validation/claims/${claimId}`, { method: 'DELETE' }),

  // Evidence & Gaps
  addEvidenceToClaim: (claimId: number, data: any) =>
    request<any>(`/validation/claims/${claimId}/evidence`, { method: 'POST', body: JSON.stringify(data) }),
  getProjectEvidence: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/validation/evidence`),
  getProjectGaps: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/validation/gaps`),

  // Innovation Proof & Differentiation Matrix
  getDifferentiationMatrix: (projectId: number) =>
    request<any>(`/projects/${projectId}/innovation-comparison`),

  // Competition Readiness & Checklist
  getCompetitionReadiness: (projectId: number) =>
    request<any>(`/projects/${projectId}/competition-readiness`),
  toggleChecklistItem: (projectId: number, itemId: number, status: string, evidenceLink?: string) =>
    request<any>(`/projects/${projectId}/competition-checklist/${itemId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ status, evidence_link: evidenceLink }),
    }),

  // Demo Readiness & Presentation Outline
  getDemoReadiness: (projectId: number) =>
    request<any>(`/projects/${projectId}/demo-readiness`),
  generatePresentationOutline: (projectId: number) =>
    request<any>(`/projects/${projectId}/presentation/generate`, { method: 'POST' }),

  // Research Sync
  syncValidationToResearch: (projectId: number, data: { target_doc_type?: string; overwrite_sections?: boolean }) =>
    request<any>(`/projects/${projectId}/validation/sync-research`, { method: 'POST', body: JSON.stringify(data) }),

  // Cost & Scalability
  getCostAnalysis: (projectId: number) =>
    request<any>(`/projects/${projectId}/validation/cost`),
  addCostItem: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/validation/cost`, { method: 'POST', body: JSON.stringify(data) }),
  deleteCostItem: (itemId: number) =>
    request<void>(`/validation/cost/${itemId}`, { method: 'DELETE' }),
  getScalabilityAssessment: (projectId: number) =>
    request<any>(`/projects/${projectId}/validation/scalability`),

  // Stakeholder Reviews
  getReviews: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/validation/reviews`),
  addReview: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/validation/reviews`, { method: 'POST', body: JSON.stringify(data) }),

  // Project Innovation Showcase
  getShowcase: (projectId: number) =>
    request<any>(`/projects/${projectId}/showcase`),
  getShowcaseHealth: (projectId: number) =>
    request<any>(`/projects/${projectId}/showcase/health`),
  getShowcaseEvidence: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/showcase/evidence`),
  getEvidenceSummary: (projectId: number) =>
    request<any>(`/projects/${projectId}/showcase/evidence-summary`),
  getFlagshipShowcase: () =>
    request<any>(`/showcase/flagship`),
};

// -----------------------------------------------------------------------------
// AI Architecture & Flowchart Generator API
// -----------------------------------------------------------------------------
export const architectureApi = {
  getProjectArchitectures: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/architecture`),
  generateArchitectures: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/architecture/generate`, { method: 'POST' }),
  getSystemArchitecture: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/system`),
  getDataFlowArchitecture: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/data-flow`),
  getAiPipelineArchitecture: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/ai-pipeline`),
  getHardwareArchitecture: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/hardware`),
  getApiFlowArchitecture: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/api-flow`),
  getDeploymentArchitecture: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/deployment`),
  getApplicationFlowArchitecture: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/application-flow`),
  getSecurityArchitecture: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/security`),
  getMermaidSource: (projectId: number, viewType: string = 'SYSTEM') =>
    request<any>(`/projects/${projectId}/architecture/mermaid?view_type=${viewType}`),
  updateMermaidSource: (projectId: number, mermaidSource: string, viewType: string = 'SYSTEM') =>
    request<any>(`/projects/${projectId}/architecture/mermaid?view_type=${viewType}`, {
      method: 'PUT',
      body: JSON.stringify({ mermaid_source: mermaidSource }),
    }),
  resetMermaidSource: (projectId: number, viewType: string = 'SYSTEM') =>
    request<any>(`/projects/${projectId}/architecture/reset-mermaid?view_type=${viewType}`, { method: 'POST' }),
  refreshArchitectures: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/refresh`, { method: 'POST' }),
  getVersions: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/architecture/versions`),
  createVersionSnapshot: (projectId: number, viewType: string = 'SYSTEM', changeSummary: string = 'Manual Snapshot') =>
    request<any>(`/projects/${projectId}/architecture/versions`, {
      method: 'POST',
      body: JSON.stringify({ view_type: viewType, change_summary: changeSummary }),
    }),
  exportSvgUrl: (projectId: number, viewType: string = 'SYSTEM') =>
    `${API_BASE}/projects/${projectId}/architecture/export/svg`,
  exportPng: (projectId: number, data: { view_type?: string; theme?: string; resolution?: string }) =>
    request<any>(`/projects/${projectId}/architecture/export/png`, { method: 'POST', body: JSON.stringify(data) }),
  exportPackage: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/export/package`, { method: 'POST' }),
  askAssistant: (projectId: number, prompt: string, contextView: string = 'SYSTEM') =>
    request<any>(`/projects/${projectId}/architecture/assistant`, {
      method: 'POST',
      body: JSON.stringify({ prompt, context_view: contextView }),
    }),
  getSimplifiedArchitecture: (projectId: number, viewType: string = 'SYSTEM') =>
    request<any>(`/projects/${projectId}/architecture/simplify?view_type=${viewType}`),
  syncToRoadmap: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/sync-roadmap`, { method: 'POST' }),
  syncToResearch: (projectId: number) =>
    request<any>(`/projects/${projectId}/architecture/sync-research`, { method: 'POST' }),
  getFlagshipArchitecture: () =>
    request<any>(`/architecture/flagship`),
};

export const knowledgeGraphApi = {
  getKnowledgeGraph: (projectId: number) =>
    request<any>(`/projects/${projectId}/knowledge-graph`),
  generateKnowledgeGraph: (projectId: number, req?: { force_refresh?: boolean; include_ai_suggestions?: boolean; max_depth?: number }) =>
    request<any>(`/projects/${projectId}/knowledge-graph/generate`, {
      method: 'POST',
      body: JSON.stringify(req || { force_refresh: true }),
    }),
  getNodes: (projectId: number, params?: { category?: string; search?: string; status_filter?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<any[]>(`/projects/${projectId}/knowledge-graph/nodes${qs}`);
  },
  getEdges: (projectId: number, params?: { relationship_type?: string; source_key?: string; target_key?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<any[]>(`/projects/${projectId}/knowledge-graph/edges${qs}`);
  },
  getInsights: (projectId: number) =>
    request<any>(`/projects/${projectId}/knowledge-graph/insights`),
  getDiagnostics: (projectId: number) =>
    request<any>(`/projects/${projectId}/knowledge-graph/diagnostics`),
  getVersions: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/knowledge-graph/versions`),
  exportGraph: (projectId: number, formatType: string) =>
    request<any>(`/projects/${projectId}/knowledge-graph/export/${formatType}`),
  getCategories: () =>
    request<{ categories: any[]; relationships: string[] }>(`/knowledge-graph/categories`),
  getFlagship: () =>
    request<any>(`/knowledge-graph/flagship`),
};

export const patentApi = {
  getProviders: () =>
    request<any[]>(`/patents/providers`),
  getFlagship: () =>
    request<any>(`/patents/flagship`),
  getProjectPatents: (projectId: number) =>
    request<any>(`/projects/${projectId}/patents`),
  searchPatents: (projectId: number, params?: {
    query_text?: string;
    custom_concepts?: string[];
    providers?: string[];
    jurisdictions?: string[];
    date_from?: string;
    date_to?: string;
    limit?: number;
    force_refresh?: boolean;
  }) =>
    request<any>(`/projects/${projectId}/patents/search`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    }),
  getConcepts: (projectId: number) =>
    request<any>(`/projects/${projectId}/patents/concepts`),
  getPatentDetail: (projectId: number, patentId: number) =>
    request<any>(`/projects/${projectId}/patents/${patentId}`),
  getPatentClaims: (projectId: number, patentId: number) =>
    request<any[]>(`/projects/${projectId}/patents/${patentId}/claims`),
  getPatentFamily: (projectId: number, patentId: number) =>
    request<any>(`/projects/${projectId}/patents/${patentId}/family`),
  getSavedPriorArt: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/patents/saved`),
  savePriorArt: (projectId: number, patentId: number, data?: {
    why_saved?: string;
    relevant_features?: string[];
    notes?: string;
    tags?: string[];
    saved_to_research?: boolean;
  }) =>
    request<any>(`/projects/${projectId}/patents/${patentId}/save`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  removeSavedPriorArt: (projectId: number, patentId: number) =>
    request<any>(`/projects/${projectId}/patents/${patentId}/save`, {
      method: 'DELETE',
    }),
  syncToResearch: (projectId: number, patentId: number) =>
    request<{ success: boolean; citation_id: number; citation_key: string; title: string; message: string }>(
      `/projects/${projectId}/patents/${patentId}/sync-research`,
      { method: 'POST' }
    ),
  comparePatents: (projectId: number, patentIds?: number[]) =>
    request<any>(`/projects/${projectId}/patents/compare`, {
      method: 'POST',
      body: JSON.stringify({ patent_ids: patentIds || [] }),
    }),
  getTimeline: (projectId: number) =>
    request<any>(`/projects/${projectId}/patents/timeline`),
  getLandscape: (projectId: number) =>
    request<any>(`/projects/${projectId}/patents/landscape`),
  getCoverage: (projectId: number) =>
    request<any>(`/projects/${projectId}/patents/coverage`),
  askAssistant: (projectId: number, prompt: string, contextPatentId?: number) =>
    request<any>(`/projects/${projectId}/patents/assistant`, {
      method: 'POST',
      body: JSON.stringify({ prompt, context_patent_id: contextPatentId }),
    }),
  exportReport: (projectId: number, formatType: string) =>
    request<{ format: string; content_type: string; filename: string; data: string; legal_disclaimer: string }>(
      `/projects/${projectId}/patents/export/${formatType}`
    ),
};

export const resourceMatchmakerApi = {
  getHealth: () =>
    request<{ status: string; latency_ms: number; components: Record<string, string> }>(
      `/resource-matchmaker/health`
    ),
  getFlagship: () =>
    request<any>(`/resource-matchmaker/flagship`),
  getWorkspace: (projectId: number, forceRefresh: boolean = false) =>
    request<any>(`/projects/${projectId}/resource-matchmaker${forceRefresh ? '?force_refresh=true' : ''}`),
  triggerAnalysis: (projectId: number) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/analyze`, { method: 'POST' }),
  getProfile: (projectId: number) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/profile`),
  updateProfile: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getRequirements: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/resource-matchmaker/requirements`),
  createRequirement: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/requirements`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRequirement: (projectId: number, reqId: number, data: any) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/requirements/${reqId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRequirement: (projectId: number, reqId: number) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/requirements/${reqId}`, {
      method: 'DELETE',
    }),
  runMatching: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/resource-matchmaker/match`, { method: 'POST' }),
  getMatches: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/resource-matchmaker/matches`),
  getAlternatives: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/resource-matchmaker/alternatives`),
  getBundles: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/resource-matchmaker/bundles`),
  getBudgetSummary: (projectId: number) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/budget`),
  getPlan: (projectId: number) =>
    request<any[]>(`/projects/${projectId}/resource-matchmaker/plan`),
  addPlanItem: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/plan`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePlanItem: (projectId: number, itemId: number, data: any) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/plan/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePlanItem: (projectId: number, itemId: number) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/plan/${itemId}`, {
      method: 'DELETE',
    }),
  simulateWhatIf: (projectId: number, data: any) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/what-if`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  askAssistant: (projectId: number, prompt: string, contextResourceName?: string) =>
    request<any>(`/projects/${projectId}/resource-matchmaker/assistant`, {
      method: 'POST',
      body: JSON.stringify({ prompt, context_resource_name: contextResourceName }),
    }),
  exportReport: (projectId: number, formatType: string) =>
    request<{ format: string; content_type: string; filename: string; data: string; evidence_disclaimer: string }>(
      `/projects/${projectId}/resource-matchmaker/export/${formatType}`
    ),
};


