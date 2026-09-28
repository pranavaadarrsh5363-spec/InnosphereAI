'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle, HelpCircle,
  Sparkles, Layers, Award, Play, FileText, ChevronRight, ArrowLeft,
  Plus, Trash2, Edit3, ExternalLink, RefreshCw, Cpu, Database,
  TrendingUp, BarChart2, DollarSign, Scale, Users, MessageSquare,
  Copy, Check, Info, AlertCircle, ArrowUpRight, Presentation,
  Sliders, Shield, BookOpen, Clock, Activity, CheckSquare, Square
} from 'lucide-react';
import { api, validationApi } from '@/lib/api';
import {
  InnovationClaim, ValidationEvidence, ValidationGap,
  ValidationDimensionScore, ValidationMatrixResponse,
  InnovationDifferentiationMatrixResponse, DifferentiationRow,
  CompetitionReadinessResponse, CompetitionChecklistItem,
  DemoReadinessResponse, DemoStepItem, PresentationOutlineResponse,
  PresentationSlide, ProjectCostAnalysisResponse, ProjectCostItem,
  ScalabilityAssessmentResponse, StakeholderReview,
  ValidationSyncResearchResponse, ValidationStatus, ValidationType,
  ConfidenceIndicator, ChecklistStatus
} from '@/types';

export default function ProjectValidationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params?.id);

  // Core Data States
  const [project, setProject] = useState<any>(null);
  const [matrixData, setMatrixData] = useState<ValidationMatrixResponse | null>(null);
  const [claims, setClaims] = useState<InnovationClaim[]>([]);
  const [differentiationData, setDifferentiationData] = useState<InnovationDifferentiationMatrixResponse | null>(null);
  const [competitionData, setCompetitionData] = useState<CompetitionReadinessResponse | null>(null);
  const [demoData, setDemoData] = useState<DemoReadinessResponse | null>(null);
  const [presentationData, setPresentationData] = useState<PresentationOutlineResponse | null>(null);
  const [costData, setCostData] = useState<ProjectCostAnalysisResponse | null>(null);
  const [scalabilityData, setScalabilityData] = useState<ScalabilityAssessmentResponse | null>(null);
  const [reviews, setReviews] = useState<StakeholderReview[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<
    'claims' | 'differentiation' | 'gaps' | 'cost' | 'competition' | 'presentation' | 'demo' | 'reviews'
  >('claims');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedClaimForEvidence, setSelectedClaimForEvidence] = useState<InnovationClaim | null>(null);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<ValidationSyncResearchResponse | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Active Demo Walkthrough Step
  const [activeDemoStepIndex, setActiveDemoStepIndex] = useState<number>(0);
  const [isDemoWalkthroughActive, setIsDemoWalkthroughActive] = useState<boolean>(false);

  // Active Presentation Slide
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Forms
  const [claimForm, setClaimForm] = useState({
    title: '',
    claim: '',
    category: 'Performance',
    existing_solution: '',
    proposed_solution: '',
    expected_advantage: '',
    validation_question: '',
    evidence_requirement: '',
    status: 'NOT_TESTED' as ValidationStatus,
    confidence_indicator: 'PRELIMINARY' as ConfidenceIndicator,
    validation_type: 'SIMULATED' as ValidationType,
    observed_result: '',
  });

  const [evidenceForm, setEvidenceForm] = useState({
    title: '',
    evidence_type: 'experiment_run',
    description: '',
    source_uri: '',
    source_reference_id: '',
    verification_status: 'VERIFIED',
    validation_type: 'SIMULATED' as ValidationType,
  });

  const [costForm, setCostForm] = useState({
    category: 'Hardware',
    item_name: '',
    quantity: 1,
    unit_cost: 0,
    is_recurring: false,
    recurring_period: 'monthly',
    is_estimated: true,
    source_or_vendor: '',
    currency: 'INR',
    notes: '',
  });

  const [reviewForm, setReviewForm] = useState({
    reviewer_name: '',
    reviewer_role: 'mentor',
    problem_clarity_score: 8.5,
    solution_feasibility_score: 8.5,
    innovation_score: 8.5,
    usability_score: 8.5,
    feedback_text: '',
    recommendations: '',
    evidence_attachment_url: '',
  });

  // Load All Validation Data
  const loadValidationData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [
        projRes,
        matrixRes,
        claimsRes,
        diffRes,
        compRes,
        demoRes,
        costRes,
        scaleRes,
        revsRes,
      ] = await Promise.allSettled([
        api.getProject(projectId),
        validationApi.getValidationMatrix(projectId),
        validationApi.getClaims(projectId),
        validationApi.getDifferentiationMatrix(projectId),
        validationApi.getCompetitionReadiness(projectId),
        validationApi.getDemoReadiness(projectId),
        validationApi.getCostAnalysis(projectId),
        validationApi.getScalabilityAssessment(projectId),
        validationApi.getReviews(projectId),
      ]);

      if (projRes.status === 'fulfilled') setProject(projRes.value);
      if (matrixRes.status === 'fulfilled') setMatrixData(matrixRes.value);
      if (claimsRes.status === 'fulfilled') setClaims(claimsRes.value);
      if (diffRes.status === 'fulfilled') setDifferentiationData(diffRes.value);
      if (compRes.status === 'fulfilled') setCompetitionData(compRes.value);
      if (demoRes.status === 'fulfilled') setDemoData(demoRes.value);
      if (costRes.status === 'fulfilled') setCostData(costRes.value);
      if (scaleRes.status === 'fulfilled') setScalabilityData(scaleRes.value);
      if (revsRes.status === 'fulfilled') setReviews(revsRes.value);
    } catch (err: any) {
      console.error('Failed to load validation suite:', err);
      setError(err?.message || 'Failed to load validation workspace.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadValidationData();
  }, [loadValidationData]);

  // Handle Copy to Clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Add Claim Handler
  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await validationApi.createClaim(projectId, claimForm);
      setIsClaimModalOpen(false);
      setClaimForm({
        title: '',
        claim: '',
        category: 'Performance',
        existing_solution: '',
        proposed_solution: '',
        expected_advantage: '',
        validation_question: '',
        evidence_requirement: '',
        status: 'NOT_TESTED',
        confidence_indicator: 'PRELIMINARY',
        validation_type: 'SIMULATED',
        observed_result: '',
      });
      loadValidationData();
    } catch (err: any) {
      alert(err.message || 'Failed to create claim');
    }
  };

  // Update Claim Status
  const handleUpdateClaimStatus = async (claimId: number, newStatus: ValidationStatus) => {
    try {
      await validationApi.updateClaim(claimId, { status: newStatus });
      loadValidationData();
    } catch (err: any) {
      alert(err.message || 'Failed to update claim status');
    }
  };

  // Delete Claim
  const handleDeleteClaim = async (claimId: number) => {
    if (!confirm('Are you sure you want to remove this innovation claim?')) return;
    try {
      await validationApi.deleteClaim(claimId);
      loadValidationData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete claim');
    }
  };

  // Add Evidence Handler
  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimForEvidence) return;
    try {
      await validationApi.addEvidenceToClaim(selectedClaimForEvidence.id, evidenceForm);
      setIsEvidenceModalOpen(false);
      setSelectedClaimForEvidence(null);
      setEvidenceForm({
        title: '',
        evidence_type: 'experiment_run',
        description: '',
        source_uri: '',
        source_reference_id: '',
        verification_status: 'VERIFIED',
        validation_type: 'SIMULATED',
      });
      loadValidationData();
    } catch (err: any) {
      alert(err.message || 'Failed to attach evidence');
    }
  };

  // Toggle Checklist Item
  const handleToggleChecklist = async (itemId: number, currentStatus: ChecklistStatus) => {
    const nextStatus: ChecklistStatus =
      currentStatus === 'MISSING' ? 'PARTIAL' : currentStatus === 'PARTIAL' ? 'READY' : 'MISSING';
    try {
      await validationApi.toggleChecklistItem(projectId, itemId, nextStatus);
      const updatedComp = await validationApi.getCompetitionReadiness(projectId);
      setCompetitionData(updatedComp);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle checklist item');
    }
  };

  // Generate Presentation Outline
  const handleGeneratePresentation = async () => {
    try {
      setIsLoading(true);
      const res = await validationApi.generatePresentationOutline(projectId);
      setPresentationData(res);
      setActiveTab('presentation');
    } catch (err: any) {
      alert(err.message || 'Failed to generate presentation');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Cost Item
  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await validationApi.addCostItem(projectId, costForm);
      setIsCostModalOpen(false);
      setCostForm({
        category: 'Hardware',
        item_name: '',
        quantity: 1,
        unit_cost: 0,
        is_recurring: false,
        recurring_period: 'monthly',
        is_estimated: true,
        source_or_vendor: '',
        currency: 'INR',
        notes: '',
      });
      const c = await validationApi.getCostAnalysis(projectId);
      setCostData(c);
    } catch (err: any) {
      alert(err.message || 'Failed to add cost item');
    }
  };

  // Delete Cost Item
  const handleDeleteCost = async (itemId: number) => {
    try {
      await validationApi.deleteCostItem(itemId);
      const c = await validationApi.getCostAnalysis(projectId);
      setCostData(c);
    } catch (err: any) {
      alert(err.message || 'Failed to delete cost item');
    }
  };

  // Add Review
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const recs = reviewForm.recommendations
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);
      await validationApi.addReview(projectId, {
        ...reviewForm,
        recommendations: recs,
      });
      setIsReviewModalOpen(false);
      setReviewForm({
        reviewer_name: '',
        reviewer_role: 'mentor',
        problem_clarity_score: 8.5,
        solution_feasibility_score: 8.5,
        innovation_score: 8.5,
        usability_score: 8.5,
        feedback_text: '',
        recommendations: '',
        evidence_attachment_url: '',
      });
      loadValidationData();
    } catch (err: any) {
      alert(err.message || 'Failed to save review');
    }
  };

  // Sync Validation to Research Paper
  const handleSyncToResearch = async () => {
    setIsSyncing(true);
    try {
      const res = await validationApi.syncValidationToResearch(projectId, {
        target_doc_type: 'research_paper',
        overwrite_sections: false,
      });
      setSyncResult(res);
      setIsSyncModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to sync validation to research document');
    } finally {
      setIsSyncing(false);
    }
  };

  // Status Badge Colors & Labels
  const getStatusBadge = (status: ValidationStatus) => {
    switch (status) {
      case 'VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Validated
          </span>
        );
      case 'PARTIALLY_VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Activity className="w-3.5 h-3.5" /> Partially Validated
          </span>
        );
      case 'INCONCLUSIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Inconclusive
          </span>
        );
      case 'NOT_VALIDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Not Validated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5" /> Not Tested
          </span>
        );
    }
  };

  const getValidationTypeBadge = (vType: ValidationType) => {
    const isSimulated = vType === 'SIMULATED';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
          isSimulated
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
        }`}
      >
        {isSimulated && <AlertCircle className="w-3 h-3 text-amber-500" />}
        {vType.replace('_', ' ')}
      </span>
    );
  };

  // Filtered Claims
  const filteredClaims = claims.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  if (isLoading && !matrixData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-lg font-medium">Synthesizing Validation Matrix & Competition Readiness...</span>
        </div>
      </div>
    );
  }

  const coveragePct = matrixData?.evidence_coverage_pct ?? 0;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* ------------------------------------------------------------- */}
      {/* Header & Command Center Navigation */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Back to Project Overview"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <ShieldCheck className="w-3.5 h-3.5" /> Validation Engine
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Project #{projectId}</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl">
                  {project?.title || 'Innovation Validation Hub'}
                </h1>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => router.push(`/projects/${projectId}/experiments`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Experiments
              </button>
              <button
                onClick={() => router.push(`/projects/${projectId}/research`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Research Paper
              </button>
              <button
                onClick={handleSyncToResearch}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                1-Click Sync to Paper
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ------------------------------------------------------------- */}
        {/* Top Hero: Evidence Coverage & 8-Dimensional Scorecard */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Evidence Coverage Gauge */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Evidence Coverage
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {matrixData?.coverage_label || 'Calculated Metric'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  {coveragePct.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({matrixData?.validated_claims || 0} full + {matrixData?.partially_validated_claims || 0} partial of {matrixData?.total_claims || 0} claims)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden mb-4">
                <div
                  className="bg-linear-to-r from-indigo-500 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, coveragePct))}%` }}
                />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Evidence coverage measures what percentage of technical and scientific assertions have empirical backing from recorded experiments, benchmarks, or telemetry.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Untested Claims: <strong className="text-slate-800 dark:text-slate-200">{matrixData?.not_tested_claims || 0}</strong></span>
              <span>Gaps Detected: <strong className="text-amber-600 dark:text-amber-400">{matrixData?.gaps?.length || 0}</strong></span>
            </div>
          </div>

          {/* 8-Dimensional Validation Scorecard */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" /> 8-Dimensional Validation Scorecard
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive audit across problem formulation, architecture, empirics, benchmarks, and reproducibility.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {matrixData?.dimensions.map((dim) => {
                const isReady = dim.status === 'READY';
                const isPartial = dim.status === 'PARTIAL';
                const isSimulated = dim.status === 'SIMULATED';
                const isMissing = dim.status === 'MISSING' || dim.status === 'NOT_TESTED';

                return (
                  <div
                    key={dim.key}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            isReady
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isPartial
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : isSimulated
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {dim.status}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {dim.score.toFixed(0)}%
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {dim.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {dim.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Navigation Tabs */}
        {/* ------------------------------------------------------------- */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          {[
            { id: 'claims', label: '1. Validation Matrix & Claims', icon: ShieldCheck, count: claims.length },
            { id: 'differentiation', label: '2. Differentiation Matrix', icon: Scale, count: differentiationData?.rows.length },
            { id: 'gaps', label: '3. Validation Gaps', icon: AlertTriangle, count: matrixData?.gaps.length },
            { id: 'cost', label: '4. Cost & Scalability', icon: DollarSign },
            { id: 'competition', label: '5. Competition Readiness', icon: Award },
            { id: 'presentation', label: '6. 16-Slide Deck & Notes', icon: Presentation },
            { id: 'demo', label: '7. Guided Live Demo', icon: Play },
            { id: 'reviews', label: '8. Mentor Reviews', icon: Users, count: reviews.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive
                        ? 'bg-indigo-700 text-indigo-100'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: Validation Matrix & Innovation Claims */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'claims' && (
          <div className="space-y-6">
            {/* Action Bar & Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter Status:</span>
                {['ALL', 'VALIDATED', 'PARTIALLY_VALIDATED', 'INCONCLUSIVE', 'NOT_VALIDATED', 'NOT_TESTED'].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        statusFilter === st
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setIsClaimModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
              >
                <Plus className="w-4 h-4" /> Register Innovation Claim
              </button>
            </div>

            {/* Claims Grid */}
            {filteredClaims.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Innovation Claims Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Register your technical advantages, operational benchmarks, and efficiency claims to pair them with empirical experiments.
                </p>
                <button
                  onClick={() => setIsClaimModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" /> Register First Claim
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {claim.category}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          {getStatusBadge(claim.status)}
                          {getValidationTypeBadge(claim.validation_type)}
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Confidence: {claim.confidence_indicator}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {claim.title}
                        </h3>
                      </div>

                      {/* Status Selector & Actions */}
                      <div className="flex items-center gap-2">
                        <select
                          value={claim.status}
                          onChange={(e) => handleUpdateClaimStatus(claim.id, e.target.value as ValidationStatus)}
                          aria-label={`Change status for claim: ${claim.title}`}
                          className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="NOT_TESTED">NOT TESTED</option>
                          <option value="SIMULATED">SIMULATED</option>
                          <option value="PARTIALLY_VALIDATED">PARTIALLY VALIDATED</option>
                          <option value="VALIDATED">VALIDATED</option>
                          <option value="INCONCLUSIVE">INCONCLUSIVE</option>
                          <option value="NOT_VALIDATED">NOT VALIDATED</option>
                        </select>
                        <button
                          onClick={() => {
                            setSelectedClaimForEvidence(claim);
                            setIsEvidenceModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                          title="Attach Evidence Artifact"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClaim(claim.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Claim"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Scientific Assertion */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-lg p-3.5 border border-slate-100 dark:border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scientific Claim</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {claim.claim}
                      </p>
                    </div>

                    {/* Matrix Mapping Grid: Question -> Evidence -> Result */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                        <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" /> Validation Question
                        </span>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                          {claim.validation_question}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                        <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Evidence Requirement
                        </span>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                          {claim.evidence_requirement || 'Empirical benchmark comparison or hardware telemetry.'}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Observed Result
                        </span>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                          {claim.observed_result || 'Awaiting empirical trial execution.'}
                        </p>
                      </div>
                    </div>

                    {/* Attached Evidence Items */}
                    {claim.evidence_items && claim.evidence_items.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                          Attached Evidence Artifacts ({claim.evidence_items.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {claim.evidence_items.map((ev) => (
                            <span
                              key={ev.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              <FileText className="w-3 h-3 text-indigo-500" />
                              <strong className="font-semibold">{ev.title}</strong>
                              <span className="text-slate-400">({ev.evidence_type})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: Innovation Differentiation Matrix */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'differentiation' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-500" /> 8-Dimensional Technical Differentiation Matrix
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Rigorous comparative analysis of existing industry baselines versus the proposed InnoSphere innovation.
                  </p>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Dimension</th>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-300">Existing Baseline Approach</th>
                      <th className="py-3 px-4 text-indigo-600 dark:text-indigo-400">InnoSphere Proposed Solution</th>
                      <th className="py-3 px-4">Evidence State</th>
                      <th className="py-3 px-4">Attribution Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {differentiationData?.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {row.dimension}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs">
                          {row.existing_approach}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs">
                          {row.proposed_approach}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              row.evidence_state === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : row.evidence_state === 'Partially Supported'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {row.evidence_state}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{row.evidence_source}</span>
                            <span className="text-[10px] text-slate-400">{row.evidence_type.replace('_', ' ')}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{differentiationData?.novelty_disclaimer}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: Validation Gaps */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'gaps' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Validation Gaps & Actionable Remedies
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Auto-detected unverified claims, missing baselines, and recommended experimental trials.
                  </p>
                </div>
              </div>

              {matrixData?.gaps.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  All registered claims have verified empirical backing. No critical validation gaps detected.
                </div>
              ) : (
                <div className="space-y-3">
                  {matrixData?.gaps.map((gap) => (
                    <div
                      key={gap.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              gap.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : gap.severity === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {gap.severity}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {gap.gap_title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {gap.reason}
                        </p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          <strong className="text-slate-700 dark:text-slate-300">Required:</strong> {gap.required_evidence}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => router.push(`/projects/${projectId}/experiments`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
                        >
                          <Cpu className="w-3.5 h-3.5" /> Launch Experiment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: Cost & Scalability Analysis */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'cost' && (
          <div className="space-y-6">
            {/* Cost Tracker Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" /> Bill of Materials & Economic Feasibility
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Empirical cost profiling for prototype construction, mass production BOM, and cloud infrastructure.
                  </p>
                </div>
                <button
                  onClick={() => setIsCostModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" /> Add BOM Item
                </button>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Single Prototype Unit BOM</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    ₹{costData?.total_prototype_cost.toLocaleString() ?? '0'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Hardware & Local Components</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Estimated Field Deployment</span>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    ₹{costData?.total_deployment_cost.toLocaleString() ?? '0'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Enclosure + Solar + Mounting (+15%)</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Recurring Monthly OpEx</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹{costData?.recurring_monthly_cost.toLocaleString() ?? '0'} / mo
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">MQTT Cloud Broker + Cellular SIM</span>
                </div>
              </div>

              {/* Cost Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Item / Component</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Unit Cost</th>
                      <th className="py-2.5 px-3">Total Cost</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Source / Vendor</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {costData?.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {it.item_name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{it.category}</td>
                        <td className="py-2.5 px-3 font-mono">{it.quantity}</td>
                        <td className="py-2.5 px-3 font-mono">₹{it.unit_cost.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          ₹{it.total_cost.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              it.is_estimated
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {it.is_estimated ? 'ESTIMATED' : 'VERIFIED'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{it.source_or_vendor || 'Market Rate'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteCost(it.id)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scalability Assessment Grid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-500" /> Multi-Tier Scalability Architecture & Bottleneck Audit
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scalabilityData?.dimensions.map((dim, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {dim.dimension}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                        {dim.evidence_backing}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Capacity</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{dim.current_capacity}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Documented Limit</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{dim.documented_limit}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Risk Analysis: </span>
                      <span className="text-slate-700 dark:text-slate-300">{dim.bottleneck_risk}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: Competition Readiness & Interactive Checklist */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'competition' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> 8-Pillar Competition & Defense Readiness
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify all evaluation criteria expected by hackathon judges, faculty review boards, and venture juries.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Readiness Score:</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {competitionData?.overall_readiness_pct.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {competitionData?.pillars.map((pillar) => (
                  <div
                    key={pillar.pillar}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{pillar.pillar}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          pillar.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : pillar.status === 'PARTIAL'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pillar.status}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full"
                        style={{ width: `${pillar.score_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Checklist */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Competition Preparation Checklist
                </h4>

                <div className="space-y-2">
                  {competitionData?.checklist.map((item) => {
                    const isReady = item.status === 'READY';
                    const isPartial = item.status === 'PARTIAL';
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleChecklist(item.id, item.status)}
                            className="mt-0.5 text-slate-400 hover:text-indigo-600 transition"
                          >
                            {isReady ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : isPartial ? (
                              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</span>
                              <span className="text-[10px] font-semibold text-slate-400">[{item.category}]</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleChecklist(item.id, item.status)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                            isReady
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isPartial
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.status}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: 16-Slide Academic Presentation & Grounded Speaker Notes */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'presentation' && (
          <div className="space-y-6">
            {!presentationData ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-4">
                <Presentation className="w-12 h-12 text-indigo-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  16-Slide Academic & Competition Presentation Generator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Synthesize an evidence-backed 16-slide academic presentation outline grounded in your empirical experiments, baseline benchmarks, and recorded telemetry with verifiable speaker notes.
                </p>
                <button
                  onClick={handleGeneratePresentation}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
                >
                  <Sparkles className="w-4 h-4" /> Synthesize 16-Slide Deck
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Slide List Navigator */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2 max-h-[680px] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Slides (16 Total)
                    </span>
                    <button
                      onClick={handleGeneratePresentation}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  {presentationData.slides.map((sl, idx) => (
                    <button
                      key={sl.slide_number}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-start gap-2.5 ${
                        activeSlideIndex === idx
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        #{sl.slide_number}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{sl.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{sl.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Active Slide Viewer & Speaker Notes */}
                <div className="lg:col-span-8 space-y-4">
                  {presentationData.slides[activeSlideIndex] && (
                    <>
                      {/* Visual Slide Mockup */}
                      <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            Layout: {presentationData.slides[activeSlideIndex].visual_layout}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            Slide {presentationData.slides[activeSlideIndex].slide_number} of 16
                          </span>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                            InnoSphere AI Academic Presentation
                          </span>
                          <h2 className="text-2xl font-black mt-1">
                            {presentationData.slides[activeSlideIndex].title}
                          </h2>
                          <p className="text-sm text-slate-400 mt-1">
                            {presentationData.slides[activeSlideIndex].subtitle}
                          </p>
                        </div>

                        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/60 space-y-3">
                          {presentationData.slides[activeSlideIndex].bullet_points.map((pt, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>

                        {presentationData.slides[activeSlideIndex].evidence_source && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            Evidence Grounding: <strong className="text-emerald-400">{presentationData.slides[activeSlideIndex].evidence_source}</strong>
                          </div>
                        )}
                      </div>

                      {/* Grounded Speaker Notes */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-indigo-500" /> Verified Speaker Notes & Defense Talking Points
                          </h4>
                          <button
                            onClick={() =>
                              handleCopy(
                                presentationData.slides[activeSlideIndex].speaker_notes,
                                `slide-notes-${activeSlideIndex}`
                              )
                            }
                            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                          >
                            {copiedText === `slide-notes-${activeSlideIndex}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy Notes
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          {presentationData.slides[activeSlideIndex].speaker_notes}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: Guided Live Demonstration */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Play className="w-5 h-5 text-indigo-500" /> 8-Step Guided Live Demo & Subsystem Diagnostics
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live end-to-end walkthrough path for faculty demos and hackathon stage presentations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      demoData?.is_demo_ready
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {demoData?.is_demo_ready ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {demoData?.is_demo_ready ? 'DEMO OPERATIONAL' : 'SUB-OPTIMAL READY'}
                  </span>
                </div>
              </div>

              {/* Subsystem Health Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {demoData?.checks.map((chk) => (
                  <div
                    key={chk.key}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{chk.label}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          chk.status === 'OPERATIONAL' || chk.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {chk.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{chk.details}</p>
                  </div>
                ))}
              </div>

              {/* 8-Step Walkthrough Flow */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recommended 8-Step Live Presentation Flow
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {demoData?.guided_steps.map((step) => (
                    <div
                      key={step.step_number}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {step.step_number}
                        </span>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                          <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 block">
                            Target Route: {step.route_target}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => router.push(step.route_target)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition shrink-0"
                      >
                        Jump to Stage <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 8: Stakeholder & Mentor Reviews */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" /> Stakeholder, Faculty & Mentor Evaluations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Formal multi-dimensional feedback from faculty advisors, industry mentors, and user study participants.
                  </p>
                </div>
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" /> Log Formal Evaluation
                </button>
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p>No formal evaluations recorded yet. Solicit faculty or mentor feedback to reinforce validation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {rev.reviewer_name}{' '}
                            <span className="text-slate-400 font-normal">({rev.reviewer_role})</span>
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(rev.review_date).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Scores */}
                        <div className="flex items-center gap-3 text-xs">
                          {typeof rev.innovation_score === 'number' && (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold text-[11px]">
                              Innovation: {rev.innovation_score}/10
                            </span>
                          )}
                          {typeof rev.solution_feasibility_score === 'number' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold text-[11px]">
                              Feasibility: {rev.solution_feasibility_score}/10
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                        {rev.feedback_text}
                      </p>

                      {rev.recommendations && rev.recommendations.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                          <span className="font-semibold text-slate-500 block mb-1">Key Recommendations:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                            {rev.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Modal: Register Innovation Claim */}
      {/* ------------------------------------------------------------- */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" /> Register Innovation Claim
              </h3>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Claim Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sub-30ms Edge Inference Latency on ESP32"
                  value={claimForm.title}
                  onChange={(e) => setClaimForm({ ...claimForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Scientific Assertion *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="State the measurable advantage over conventional methods..."
                  value={claimForm.claim}
                  onChange={(e) => setClaimForm({ ...claimForm, claim: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={claimForm.category}
                    onChange={(e) => setClaimForm({ ...claimForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Performance">Performance / Speed</option>
                    <option value="Accuracy">Accuracy / Precision</option>
                    <option value="Hardware">Hardware / Energy</option>
                    <option value="Cost">Economic / BOM</option>
                    <option value="Sustainability">Sustainability</option>
                    <option value="Accessibility">Accessibility</option>
                    <option value="Scalability">Scalability</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Validation Type</label>
                  <select
                    value={claimForm.validation_type}
                    onChange={(e) => setClaimForm({ ...claimForm, validation_type: e.target.value as ValidationType })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="SIMULATED">SIMULATED</option>
                    <option value="DIGITAL_TESTBED">DIGITAL TESTBED</option>
                    <option value="PHYSICAL_HARDWARE">PHYSICAL HARDWARE</option>
                    <option value="SOFTWARE_PROTOTYPE">SOFTWARE PROTOTYPE</option>
                    <option value="FIELD_TEST">FIELD TEST</option>
                    <option value="USER_STUDY">USER STUDY</option>
                    <option value="LITERATURE_SUPPORTED">LITERATURE SUPPORTED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={claimForm.status}
                    onChange={(e) => setClaimForm({ ...claimForm, status: e.target.value as ValidationStatus })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="NOT_TESTED">NOT TESTED</option>
                    <option value="SIMULATED">SIMULATED</option>
                    <option value="PARTIALLY_VALIDATED">PARTIALLY VALIDATED</option>
                    <option value="VALIDATED">VALIDATED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Empirical Validation Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Does mean inference latency remain under 30ms across 100 trials?"
                  value={claimForm.validation_question}
                  onChange={(e) => setClaimForm({ ...claimForm, validation_question: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observed Empirical Result
                </label>
                <input
                  type="text"
                  placeholder="e.g. Recorded mean latency of 24.2ms (+- 1.4ms) on ESP32-S3."
                  value={claimForm.observed_result}
                  onChange={(e) => setClaimForm({ ...claimForm, observed_result: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold transition"
                >
                  Save Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Attach Evidence */}
      {/* ------------------------------------------------------------- */}
      {isEvidenceModalOpen && selectedClaimForEvidence && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Attach Evidence to: {selectedClaimForEvidence.title}
              </h3>
              <button
                onClick={() => setIsEvidenceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Evidence Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Run Confusion Matrix on 500 Samples"
                  value={evidenceForm.title}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Evidence Type</label>
                  <select
                    value={evidenceForm.evidence_type}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, evidence_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="experiment_run">Experiment Run</option>
                    <option value="benchmark_comparison">Benchmark Comparison</option>
                    <option value="hardware_telemetry">Hardware Telemetry</option>
                    <option value="published_paper">Published Paper</option>
                    <option value="user_feedback">User Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Validation Type</label>
                  <select
                    value={evidenceForm.validation_type}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, validation_type: e.target.value as ValidationType })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="SIMULATED">SIMULATED</option>
                    <option value="DIGITAL_TESTBED">DIGITAL TESTBED</option>
                    <option value="PHYSICAL_HARDWARE">PHYSICAL HARDWARE</option>
                    <option value="SOFTWARE_PROTOTYPE">SOFTWARE PROTOTYPE</option>
                    <option value="FIELD_TEST">FIELD TEST</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">URI / Source Link</label>
                <input
                  type="text"
                  placeholder="https://... or experiment_run_id"
                  value={evidenceForm.source_uri}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, source_uri: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold transition"
                >
                  Attach Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Add Cost BOM Item */}
      {/* ------------------------------------------------------------- */}
      {isCostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Cost / BOM Item</h3>
              <button onClick={() => setIsCostModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCost} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Item / Component Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ESP32-S3 Microcontroller"
                  value={costForm.item_name}
                  onChange={(e) => setCostForm({ ...costForm, item_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={costForm.quantity}
                    onChange={(e) => setCostForm({ ...costForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={costForm.unit_cost}
                    onChange={(e) => setCostForm({ ...costForm, unit_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={costForm.category}
                    onChange={(e) => setCostForm({ ...costForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Hardware">Hardware / Sensor</option>
                    <option value="Infrastructure">Infrastructure / Cloud</option>
                    <option value="Software">Software / Licensing</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cost Type</label>
                  <select
                    value={costForm.is_recurring ? 'recurring' : 'one_time'}
                    onChange={(e) => setCostForm({ ...costForm, is_recurring: e.target.value === 'recurring' })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="one_time">One-Time Prototype</option>
                    <option value="recurring">Recurring Monthly</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCostModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold">
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Log Stakeholder Review */}
      {/* ------------------------------------------------------------- */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Formal Stakeholder Review</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Reviewer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Sarah Johnson"
                    value={reviewForm.reviewer_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Reviewer Role</label>
                  <select
                    value={reviewForm.reviewer_role}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewer_role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="faculty">Faculty Advisor</option>
                    <option value="mentor">Industry Mentor</option>
                    <option value="target_user">Target Community User</option>
                    <option value="peer">Student Peer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Qualitative Feedback *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed evaluation of empirical rigor, engineering constraints, and practical utility..."
                  value={reviewForm.feedback_text}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedback_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Key Recommendations (1 per line)</label>
                <textarea
                  rows={2}
                  placeholder="Conduct stress tests on 10 water sources&#10;Add battery temperature telemetry"
                  value={reviewForm.recommendations}
                  onChange={(e) => setReviewForm({ ...reviewForm, recommendations: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold">
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Research Paper Synchronization Result */}
      {/* ------------------------------------------------------------- */}
      {isSyncModalOpen && syncResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Research Document Synchronized
              </h3>
              <button onClick={() => setIsSyncModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {syncResult.message} ({syncResult.claims_synced_count} claims synced into Document #{syncResult.document_id}).
            </p>

            {/* LaTeX Matrix Snippet */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                LaTeX Validation Matrix Insert:
              </span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto">
                {syncResult.latex_validation_matrix}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsSyncModalOpen(false);
                  router.push(`/projects/${projectId}/research`);
                }}
                className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs transition"
              >
                View in Research Workspace →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
