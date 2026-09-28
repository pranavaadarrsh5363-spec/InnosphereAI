'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FlaskConical,
  Sparkles,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  BarChart3,
  GitCompare,
  FileText,
  Upload,
  RefreshCw,
  ChevronRight,
  Database,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Check,
  X,
  Layers,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Code,
  Tag,
  Copy
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Project,
  Experiment,
  ExperimentRun,
  ExperimentResult,
  BenchmarkReference,
  ExperimentEvidence,
  ReproducibilityReportResponse,
  ExperimentSummaryResponse,
  ExperimentSuggestionResponse,
  ExperimentSyncResearchResponse,
  HardwareDevice
} from '@/types';

export default function ProjectExperimentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { user } = useAuth();

  // Primary State
  const [project, setProject] = useState<Project | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [summary, setSummary] = useState<ExperimentSummaryResponse | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkReference[]>([]);
  const [hardwareDevices, setHardwareDevices] = useState<HardwareDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<'metrics' | 'runs' | 'benchmarks' | 'reproducibility' | 'evidence'>('metrics');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showHardwareModal, setShowHardwareModal] = useState(false);

  // Forms
  const [newExpForm, setNewExpForm] = useState({
    name: '',
    hypothesis: '',
    objective: '',
    dataset_used: '',
    dataset_version: 'v1.0',
    dataset_source: 'Kaggle / OpenData',
    preprocessing_notes: '',
    baseline_model: '',
    proposed_method: '',
    model_algorithm: '',
    hardware_environment: 'Edge Microcontroller (ESP32) + Host GPU',
    software_environment: 'Python 3.11, PyTorch 2.2',
    random_seed: 42,
    evaluation_metrics: 'Accuracy, F1-Score, Inference Latency',
    independent_variables: 'Input noise ratio, Batch size',
    dependent_variables: 'Anomaly detection F1-score, Inference latency (ms)',
    controlled_variables: 'Sampling rate (10Hz), Sensor calibration baseline',
    status: 'PLANNED',
    is_simulated: false
  });

  const [aiGapInput, setAiGapInput] = useState({ gapTitle: '', gapDescription: '', expType: 'machine_learning' });
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);

  const [newRunForm, setNewRunForm] = useState({
    run_label: '',
    random_seed: 42,
    execution_time_ms: 120,
    parameters_json: '{\n  "learning_rate": 0.001,\n  "epochs": 50,\n  "batch_size": 32\n}',
    metrics_json: '{\n  "accuracy": 95.4,\n  "f1_score": 0.948,\n  "latency_ms": 23.5\n}',
    logs_or_notes: 'Run executed smoothly with deterministic random seed.'
  });

  const [newResultForm, setNewResultForm] = useState({
    metric_name: 'Accuracy',
    metric_type: 'classification',
    baseline_value: 85.0,
    proposed_value: 95.5,
    unit: '%',
    direction: 'higher_is_better',
    notes: 'Primary validation on held-out split'
  });

  const [newBenchmarkForm, setNewBenchmarkForm] = useState({
    reference_name: '',
    method_name: '',
    dataset_name: '',
    metric_name: 'Accuracy',
    reported_value: 88.0,
    unit: '%',
    source_citation: '',
    doi: ''
  });

  const [newEvidenceForm, setNewEvidenceForm] = useState({
    title: '',
    evidence_type: 'run_log',
    description: '',
    file_path_or_url: '',
    verification_status: 'verified'
  });

  const [importForm, setImportForm] = useState({
    file_format: 'json' as 'json' | 'csv',
    content: '[\n  {\n    "run_number": 1,\n    "accuracy": 95.2,\n    "latency_ms": 24.1\n  },\n  {\n    "run_number": 2,\n    "accuracy": 95.8,\n    "latency_ms": 23.9\n  }\n]',
    run_label: 'Batch Importer Trace'
  });

  const [syncPreview, setSyncPreview] = useState<ExperimentSyncResearchResponse | null>(null);
  const [syncOverwrite, setSyncOverwrite] = useState(true);

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projData, expListData, summaryData, benchData] = await Promise.all([
        api.getProjectDetail(projectId),
        api.getExperiments(projectId),
        api.getExperimentSummary(projectId).catch(() => null),
        api.getProjectBenchmarks(projectId).catch(() => [])
      ]);

      setProject(projData);
      setExperiments(expListData);
      setSummary(summaryData);
      setBenchmarks(benchData);

      if (expListData && expListData.length > 0) {
        // Auto-select first experiment with full detail
        const firstDetail = await api.getExperimentDetail(expListData[0].id).catch(() => expListData[0]);
        setSelectedExperiment(firstDetail);
      } else {
        setSelectedExperiment(null);
      }

      // Try load hardware devices for quick integration
      try {
        const hw = await api.getHardwareProject(projectId);
        if (hw && hw.devices) {
          setHardwareDevices(hw.devices);
        }
      } catch {
        // Optional hardware integration
      }
    } catch (err: any) {
      console.error('Failed to load experimentation data:', err);
      setError(err.message || 'Failed to load project experiments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Select experiment handler
  const handleSelectExperiment = async (expId: number) => {
    try {
      setActionLoading(true);
      const detail = await api.getExperimentDetail(expId);
      setSelectedExperiment(detail);
    } catch (err: any) {
      console.error('Failed to fetch experiment detail:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // AI Suggestion from Gap
  const handleSuggestFromGap = async () => {
    if (!aiGapInput.gapTitle.trim()) {
      setError('Please provide a research gap title or problem to formulate an experiment.');
      return;
    }
    try {
      setAiSuggestLoading(true);
      const sug: ExperimentSuggestionResponse = await api.suggestExperimentFromGap(
        projectId,
        aiGapInput.gapTitle,
        aiGapInput.gapDescription,
        aiGapInput.expType
      );
      setNewExpForm({
        ...newExpForm,
        name: sug.suggested_name,
        hypothesis: sug.hypothesis,
        objective: sug.objective,
        baseline_model: sug.suggested_baseline,
        proposed_method: sug.suggested_proposed_method,
        evaluation_metrics: sug.recommended_metrics.join(', '),
        independent_variables: sug.independent_variables.join(', '),
        dependent_variables: sug.dependent_variables.join(', '),
        dataset_source: sug.suggested_dataset_source || 'OpenData / Kaggle',
        controlled_variables: 'Train/test split 80/20, fixed seed 42'
      });
      setSuccessMessage('AI successfully formulated empirical hypothesis and controlled parameters!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to suggest experiment formulation.');
    } finally {
      setAiSuggestLoading(false);
    }
  };

  // Create Experiment
  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      const payload = {
        name: newExpForm.name,
        hypothesis: newExpForm.hypothesis,
        objective: newExpForm.objective,
        dataset_used: newExpForm.dataset_used || 'Standardized Project Benchmark Dataset',
        dataset_version: newExpForm.dataset_version,
        dataset_source: newExpForm.dataset_source,
        preprocessing_notes: newExpForm.preprocessing_notes,
        baseline_model: newExpForm.baseline_model || 'Standard Baseline',
        proposed_method: newExpForm.proposed_method || 'Proposed Model Architecture',
        model_algorithm: newExpForm.model_algorithm || newExpForm.proposed_method,
        hardware_environment: newExpForm.hardware_environment,
        software_environment: newExpForm.software_environment,
        random_seed: Number(newExpForm.random_seed) || 42,
        evaluation_metrics: newExpForm.evaluation_metrics.split(',').map((s) => s.trim()).filter(Boolean),
        independent_variables: newExpForm.independent_variables.split(',').map((s) => s.trim()).filter(Boolean),
        dependent_variables: newExpForm.dependent_variables.split(',').map((s) => s.trim()).filter(Boolean),
        controlled_variables: newExpForm.controlled_variables.split(',').map((s) => s.trim()).filter(Boolean),
        status: newExpForm.status,
        is_simulated: newExpForm.is_simulated
      };

      const created = await api.createExperiment(projectId, payload);
      setShowCreateModal(false);
      setSuccessMessage(`Experiment "${created.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
      if (created.id) {
        handleSelectExperiment(created.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create experiment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create from Hardware Device
  const handleCreateFromHardware = async (deviceId: number) => {
    try {
      setActionLoading(true);
      setError(null);
      const exp = await api.createExperimentFromHardware(projectId, deviceId);
      setShowHardwareModal(false);
      setSuccessMessage(`Empirical testbed experiment "${exp.name}" linked from Hardware Lab!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
      handleSelectExperiment(exp.id);
    } catch (err: any) {
      setError(err.message || 'Failed to link hardware device.');
    } finally {
      setActionLoading(false);
    }
  };

  // Status Change
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedExperiment) return;
    try {
      setActionLoading(true);
      await api.updateExperimentStatus(selectedExperiment.id, newStatus);
      const updated = await api.getExperimentDetail(selectedExperiment.id);
      setSelectedExperiment(updated);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update experiment status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Record Run
  const handleAddRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperiment) return;
    try {
      setActionLoading(true);
      setError(null);
      let parsedParams = {};
      let parsedMetrics = {};
      try {
        parsedParams = JSON.parse(newRunForm.parameters_json);
      } catch {
        throw new Error('Invalid JSON in Parameters field.');
      }
      try {
        parsedMetrics = JSON.parse(newRunForm.metrics_json);
      } catch {
        throw new Error('Invalid JSON in Metrics field.');
      }

      const payload = {
        run_label: newRunForm.run_label || `Run ${(selectedExperiment.runs?.length || 0) + 1}`,
        random_seed: Number(newRunForm.random_seed) || 42,
        execution_time_ms: Number(newRunForm.execution_time_ms) || 100,
        parameters: parsedParams,
        metrics: parsedMetrics,
        status: 'completed',
        logs_or_notes: newRunForm.logs_or_notes
      };

      await api.addExperimentRun(selectedExperiment.id, payload);
      setShowRunModal(false);
      setSuccessMessage('Experimental Run successfully recorded and incorporated into statistical analysis.');
      setTimeout(() => setSuccessMessage(null), 4000);
      const refreshed = await api.getExperimentDetail(selectedExperiment.id);
      setSelectedExperiment(refreshed);
    } catch (err: any) {
      setError(err.message || 'Failed to record run.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Comparative Result
  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperiment) return;
    try {
      setActionLoading(true);
      setError(null);
      const payload = {
        metric_name: newResultForm.metric_name,
        metric_type: newResultForm.metric_type,
        baseline_value: Number(newResultForm.baseline_value),
        proposed_value: Number(newResultForm.proposed_value),
        unit: newResultForm.unit,
        direction: newResultForm.direction,
        notes: newResultForm.notes
      };

      await api.addExperimentResult(selectedExperiment.id, payload);
      setShowResultModal(false);
      setSuccessMessage('Comparative benchmark metric recorded.');
      setTimeout(() => setSuccessMessage(null), 4000);
      const refreshed = await api.getExperimentDetail(selectedExperiment.id);
      setSelectedExperiment(refreshed);
    } catch (err: any) {
      setError(err.message || 'Failed to add result.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Benchmark Reference
  const handleAddBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      const payload = {
        reference_name: newBenchmarkForm.reference_name,
        method_name: newBenchmarkForm.method_name,
        dataset_name: newBenchmarkForm.dataset_name || selectedExperiment?.dataset_used,
        metric_name: newBenchmarkForm.metric_name,
        reported_value: Number(newBenchmarkForm.reported_value),
        unit: newBenchmarkForm.unit,
        source_citation: newBenchmarkForm.source_citation,
        doi: newBenchmarkForm.doi,
        experiment_id: selectedExperiment?.id,
        is_published_reference: true
      };

      await api.addBenchmarkReference(projectId, payload);
      setShowBenchmarkModal(false);
      setSuccessMessage('Published literature benchmark registered.');
      setTimeout(() => setSuccessMessage(null), 4000);
      const benchData = await api.getProjectBenchmarks(projectId);
      setBenchmarks(benchData);
      if (selectedExperiment) {
        const refreshed = await api.getExperimentDetail(selectedExperiment.id);
        setSelectedExperiment(refreshed);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add benchmark reference.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Evidence
  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperiment) return;
    try {
      setActionLoading(true);
      setError(null);
      const payload = {
        title: newEvidenceForm.title,
        evidence_type: newEvidenceForm.evidence_type,
        description: newEvidenceForm.description,
        file_path_or_url: newEvidenceForm.file_path_or_url,
        verification_status: newEvidenceForm.verification_status
      };

      await api.addExperimentEvidence(selectedExperiment.id, payload);
      setShowEvidenceModal(false);
      setSuccessMessage('Evidence artifact attached to experiment.');
      setTimeout(() => setSuccessMessage(null), 4000);
      const refreshed = await api.getExperimentDetail(selectedExperiment.id);
      setSelectedExperiment(refreshed);
    } catch (err: any) {
      setError(err.message || 'Failed to attach evidence.');
    } finally {
      setActionLoading(false);
    }
  };

  // Import Results (CSV/JSON)
  const handleImportResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperiment) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.importExperimentResults(selectedExperiment.id, {
        file_format: importForm.file_format,
        content: importForm.content,
        run_label: importForm.run_label
      });
      setShowImportModal(false);
      setSuccessMessage(`Imported ${res.runs_imported} runs and ${res.results_imported} benchmark metrics successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      const refreshed = await api.getExperimentDetail(selectedExperiment.id);
      setSelectedExperiment(refreshed);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to import results.');
    } finally {
      setActionLoading(false);
    }
  };

  // Prepare & Preview Sync to Research Paper
  const handleOpenSyncModal = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const preview = await api.syncExperimentsToResearch(projectId, {
        target_doc_type: 'research_paper',
        overwrite_sections: false
      });
      setSyncPreview(preview);
      setShowSyncModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate sync preview.');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Active Sync to Research Paper
  const handleExecuteSync = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.syncExperimentsToResearch(projectId, {
        target_doc_type: 'research_paper',
        overwrite_sections: syncOverwrite
      });
      setShowSyncModal(false);
      setSuccessMessage(`Successfully synchronized ${res.experiments_synced_count} experiment results to the Research Paper!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to sync experiments to research document.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered experiments
  const filteredExperiments = experiments.filter((exp) => {
    const matchesStatus = statusFilter === 'all' || exp.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.hypothesis && exp.hypothesis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.proposed_method && exp.proposed_method.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-200">COMPLETED</span>;
      case 'RUNNING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">RUNNING</span>;
      case 'READY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-200">READY</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-200">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-200">PLANNED</span>;
    }
  };

  const getComparisonBadge = (label?: string) => {
    if (!label) return null;
    const l = label.toLowerCase();
    if (l === 'improved' || l === 'higher') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-200 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {label}</span>;
    }
    if (l === 'lower' || l === 'regressed') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 border border-amber-200 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> {label}</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-200">{label}</span>;
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-600 border-emerald-200 bg-emerald-50';
    if (pct >= 50) return 'text-amber-600 border-amber-200 bg-amber-50';
    return 'text-rose-600 border-rose-200 bg-rose-50';
  };

  if (loading && !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-blue-200 flex items-center justify-center animate-spin mb-4">
          <FlaskConical className="h-5 w-5 text-blue-600" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">Loading Experimentation Command Center...</p>
        <p className="text-xs text-slate-500 mt-1">Fetching empirical benchmarks, multi-runs, and reproducibility matrix</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner & Breadcrumb */}
      <div className="border-b border-slate-200 bg-white backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href="/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/projects/${projectId}`} className="hover:text-blue-600 transition-colors">{project?.title || `Project #${projectId}`}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-blue-600 font-semibold">Experiments & Reproducibility</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Experimentation & Benchmarking Command Center
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Empirical Multi-Runs • 10-Point Reproducibility Coverage • Published Baselines • 1-Click Research Sync
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Experiment</span>
            </button>

            {hardwareDevices.length > 0 && (
              <button
                onClick={() => setShowHardwareModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-900/60 border border-cyan-200 text-cyan-700 text-xs font-semibold transition-all"
                title="Create experiment directly from active Hardware Lab device"
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Link Hardware Lab</span>
              </button>
            )}

            <button
              onClick={handleOpenSyncModal}
              disabled={experiments.filter((e) => e.status?.toLowerCase() === 'completed').length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-900/60 border border-purple-200 text-purple-700 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Synchronize verified empirical tables into IEEE/LaTeX research paper"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>Sync to Research Paper</span>
            </button>

            <Link
              href={`/projects/${projectId}/research`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-800 border border-slate-200 text-slate-300 hover:text-white text-xs font-medium transition-all"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>Research Workspace</span>
            </Link>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-800 border border-slate-200 text-slate-400 hover:text-white transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-200 text-rose-700 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Global KPI Summary Deck */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total Experiments</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-white">{summary?.total_experiments || experiments.length}</span>
              <FlaskConical className="h-4 w-4 text-blue-600 opacity-80" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Completed Trials</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-emerald-600">
                {summary?.completed_count || experiments.filter((e) => e.status?.toLowerCase() === 'completed').length}
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 opacity-80" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Multi-Runs Recorded</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-blue-400">
                {summary?.total_runs || experiments.reduce((acc, e) => acc + (e.runs?.length || 0), 0)}
              </span>
              <Layers className="h-4 w-4 text-blue-400 opacity-80" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Avg. Reproducibility</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-blue-700">
                {summary ? `${Math.round(summary.avg_reproducibility_pct)}%` : '85%'}
              </span>
              <ShieldCheck className="h-4 w-4 text-blue-600 opacity-80" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Published Baselines</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-purple-600">{summary?.total_benchmarks || benchmarks.length}</span>
              <BookOpen className="h-4 w-4 text-purple-600 opacity-80" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Evidence Artifacts</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-cyan-600">
                {summary?.total_evidence_links || experiments.reduce((acc, e) => acc + (e.evidence_links?.length || 0), 0)}
              </span>
              <Tag className="h-4 w-4 text-cyan-600 opacity-80" />
            </div>
          </div>
        </div>

        {/* Main 2-Column Command Center Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Experiments Navigation & Explorer (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-blue-600" />
                  <span>Experiments Registry</span>
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                  {filteredExperiments.length} items
                </span>
              </div>

              {/* Search & Filters */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search hypothesis, model, method..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                  {['all', 'completed', 'running', 'planned', 'ready'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 rounded-md font-medium capitalize transition-colors ${
                        statusFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experiment Cards List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredExperiments.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-100 border border-dashed border-slate-200">
                    <FlaskConical className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-400">No experiments recorded yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                      Formulate your first empirical hypothesis against baseline models.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Create Experiment
                    </button>
                  </div>
                ) : (
                  filteredExperiments.map((exp) => {
                    const isSelected = selectedExperiment?.id === exp.id;
                    const reproScore = exp.reproducibility_score || 0;
                    return (
                      <div
                        key={exp.id}
                        onClick={() => handleSelectExperiment(exp.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-indigo-500/60 shadow-sm shadow-indigo-500/10'
                            : 'bg-slate-100 hover:bg-slate-800/50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-white leading-snug line-clamp-1">
                            {exp.name}
                          </h3>
                          {getStatusBadge(exp.status)}
                        </div>

                        {exp.hypothesis && (
                          <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-1">
                            &quot;{exp.hypothesis}&quot;
                          </p>
                        )}

                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Layers className="h-3 w-3 text-blue-600" />
                            <span>{exp.runs?.length || 0} runs</span>
                            <span>•</span>
                            <span>{exp.results?.length || 0} metrics</span>
                          </div>

                          <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${getScoreColor(reproScore)}`}>
                            {reproScore}% Repro
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AI Suggestion Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30 border border-blue-200 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                <h3 className="text-xs font-bold text-blue-700">AI Hypothesis & Testbed Assistant</h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Formulate an empirical experiment template directly from a known research gap or problem.
              </p>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="e.g. Real-time edge anomaly filtering"
                  value={aiGapInput.gapTitle}
                  onChange={(e) => setAiGapInput({ ...aiGapInput, gapTitle: e.target.value })}
                  className="w-full px-2 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500"
                />
                <button
                  onClick={handleSuggestFromGap}
                  disabled={aiSuggestLoading || !aiGapInput.gapTitle.trim()}
                  className="w-full py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-blue-200 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {aiSuggestLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>Formulate Hypothesis & Setup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Experiment Workspace & Detail Inspector (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedExperiment ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Experiment Header & Quick Actions */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-blue-700 border border-blue-200">
                          EXP-{selectedExperiment.id}
                        </span>
                        {getStatusBadge(selectedExperiment.status)}
                        {selectedExperiment.is_simulated && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                            <Cpu className="h-3 w-3" /> Hardware Simulation
                          </span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white">{selectedExperiment.name}</h2>
                    </div>

                    {/* Status Toggle Dropdown */}
                    <div className="flex items-center gap-2 self-start">
                      <select
                        value={(selectedExperiment.status || 'PLANNED').toUpperCase()}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="PLANNED">Status: Planned</option>
                        <option value="READY">Status: Ready</option>
                        <option value="RUNNING">Status: Running</option>
                        <option value="COMPLETED">Status: Completed</option>
                        <option value="FAILED">Status: Failed</option>
                      </select>

                      <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-200 transition-colors"
                        title="Import Run logs or JSON/CSV benchmarks"
                      >
                        <Upload className="h-3 w-3 text-blue-600" />
                        <span>Import</span>
                      </button>
                    </div>
                  </div>

                  {/* Hypothesis Box */}
                  {selectedExperiment.hypothesis && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-blue-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Empirical Hypothesis
                      </span>
                      <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                        &quot;{selectedExperiment.hypothesis}&quot;
                      </p>
                    </div>
                  )}

                  {/* Variables & Runtime Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-medium">Target Dataset & Version</span>
                      <p className="text-slate-200 font-semibold truncate mt-0.5">
                        {selectedExperiment.dataset_used || 'Standardized Dataset'} ({selectedExperiment.dataset_version || 'v1.0'})
                      </p>
                      <span className="text-[10px] text-slate-500 block truncate">{selectedExperiment.dataset_source}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-medium">Baseline vs Proposed Method</span>
                      <p className="text-slate-200 font-semibold truncate mt-0.5">
                        <span className="text-slate-400">{selectedExperiment.baseline_model || 'Baseline'}</span> → <span className="text-blue-600">{selectedExperiment.proposed_method || 'Proposed'}</span>
                      </p>
                      <span className="text-[10px] text-slate-500 block truncate">Seed: {selectedExperiment.random_seed ?? 42}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 sm:col-span-2 lg:col-span-1">
                      <span className="text-[10px] text-slate-400 font-medium">Hardware & Runtime Envelope</span>
                      <p className="text-slate-200 font-semibold truncate mt-0.5">
                        {selectedExperiment.hardware_environment || 'Edge / Host Compute'}
                      </p>
                      <span className="text-[10px] text-slate-500 block truncate">{selectedExperiment.software_environment}</span>
                    </div>
                  </div>

                  {/* Variables Drawer */}
                  {(selectedExperiment.independent_variables?.length || selectedExperiment.dependent_variables?.length) && (
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3 text-[11px]">
                      {selectedExperiment.independent_variables && selectedExperiment.independent_variables.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Independent:</span>
                          <span className="text-slate-200">{selectedExperiment.independent_variables.join(', ')}</span>
                        </div>
                      )}
                      {selectedExperiment.dependent_variables && selectedExperiment.dependent_variables.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Dependent:</span>
                          <span className="text-blue-700 font-semibold">{selectedExperiment.dependent_variables.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation Sub-Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-200 pb-2 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === 'metrics'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Benchmark Metrics ({selectedExperiment.results?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('runs')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === 'runs'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Multi-Runs ({selectedExperiment.runs?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('benchmarks')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === 'benchmarks'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Published Baselines ({benchmarks.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reproducibility')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === 'reproducibility'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>10-Pt Reproducibility</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('evidence')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === 'evidence'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    <span>Evidence ({selectedExperiment.evidence_links?.length || 0})</span>
                  </button>
                </div>

                {/* Sub-Tab 1: Metrics Matrix */}
                {activeTab === 'metrics' && (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                          <span>Comparative Quantitative Evaluation Matrix</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Direct head-to-head performance against baseline model across standardized metrics.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowResultModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Metric</span>
                      </button>
                    </div>

                    {(!selectedExperiment.results || selectedExperiment.results.length === 0) ? (
                      <div className="p-8 text-center rounded-xl bg-slate-100 border border-dashed border-slate-200">
                        <BarChart3 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-400">No comparative metrics recorded yet</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                          Add baseline vs proposed values, or record runs to automatically compute statistical differences.
                        </p>
                        <button
                          onClick={() => setShowResultModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Record Metric
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                              <th className="py-2 px-3 font-semibold">Evaluation Metric</th>
                              <th className="py-2 px-3 font-semibold">Baseline Model</th>
                              <th className="py-2 px-3 font-semibold text-blue-700">Proposed Method</th>
                              <th className="py-2 px-3 font-semibold">Absolute Diff</th>
                              <th className="py-2 px-3 font-semibold">Outcome</th>
                              <th className="py-2 px-3 font-semibold">Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {selectedExperiment.results.map((res) => (
                              <tr key={res.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-2.5 px-3 font-bold text-white">
                                  {res.metric_name}
                                  {res.unit && <span className="text-[10px] text-slate-400 font-normal ml-1">({res.unit})</span>}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-300">{res.baseline_value ?? '—'}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-700 bg-indigo-500/5">
                                  {res.proposed_value ?? '—'}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-semibold">
                                  {res.difference !== undefined && res.difference !== null ? (
                                    <span className={res.difference >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                                      {res.difference > 0 ? `+${res.difference}` : res.difference}
                                      {res.percentage_difference !== undefined && (
                                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                                          ({res.percentage_difference > 0 ? `+${res.percentage_difference}%` : `${res.percentage_difference}%`})
                                        </span>
                                      )}
                                    </span>
                                  ) : '—'}
                                </td>
                                <td className="py-2.5 px-3">{getComparisonBadge(res.comparison_label)}</td>
                                <td className="py-2.5 px-3 text-[10px] text-slate-400 capitalize">{res.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Tab 2: Multi-Runs */}
                {activeTab === 'runs' && (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-blue-600" />
                          <span>Multi-Run Executions & Statistical Dispersion</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Track trial iterations with fixed seeds, execution latency, and standard deviation.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowRunModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Record New Run</span>
                      </button>
                    </div>

                    {(!selectedExperiment.runs || selectedExperiment.runs.length === 0) ? (
                      <div className="p-8 text-center rounded-xl bg-slate-100 border border-dashed border-slate-200">
                        <Layers className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-400">No execution runs logged</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                          Log individual trial runs to compute mean, median, min, max, and sample standard deviation.
                        </p>
                        <button
                          onClick={() => setShowRunModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Record Run 1
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                                <th className="py-2 px-3 font-semibold">Run #</th>
                                <th className="py-2 px-3 font-semibold">Label</th>
                                <th className="py-2 px-3 font-semibold">Seed</th>
                                <th className="py-2 px-3 font-semibold">Execution Time</th>
                                <th className="py-2 px-3 font-semibold">Recorded Metrics</th>
                                <th className="py-2 px-3 font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-200">
                              {selectedExperiment.runs.map((run) => (
                                <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="py-2 px-3 font-mono font-bold text-blue-600">#{run.run_number}</td>
                                  <td className="py-2 px-3 font-medium text-white">{run.run_label || `Run ${run.run_number}`}</td>
                                  <td className="py-2 px-3 font-mono text-slate-400">{run.random_seed ?? 42}</td>
                                  <td className="py-2 px-3 font-mono">{run.execution_time_ms ? `${run.execution_time_ms} ms` : '—'}</td>
                                  <td className="py-2 px-3">
                                    <div className="flex flex-wrap gap-1">
                                      {run.metrics && Object.entries(run.metrics).map(([k, v]) => (
                                        <span key={k} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 font-mono text-slate-300 border border-slate-200">
                                          {k}: {typeof v === 'number' ? v : String(v)}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                                      {run.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Tab 3: Published Baselines */}
                {activeTab === 'benchmarks' && (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                          <span>Published Literature Reference Baselines</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Compare against published SOTA papers with verifiable citations and DOIs.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowBenchmarkModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Published Baseline</span>
                      </button>
                    </div>

                    {benchmarks.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-slate-100 border border-dashed border-slate-200">
                        <BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-400">No published baselines registered</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                          Add published academic literature comparisons (e.g. SOTA models from arXiv / OpenAlex).
                        </p>
                        <button
                          onClick={() => setShowBenchmarkModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Add Baseline
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                              <th className="py-2 px-3 font-semibold">Published Method / Reference</th>
                              <th className="py-2 px-3 font-semibold">Dataset</th>
                              <th className="py-2 px-3 font-semibold">Metric</th>
                              <th className="py-2 px-3 font-semibold">Reported Value</th>
                              <th className="py-2 px-3 font-semibold">Source Citation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {benchmarks.map((bm) => (
                              <tr key={bm.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-2.5 px-3 font-bold text-white">
                                  {bm.reference_name}
                                  <span className="text-[10px] text-slate-400 font-normal block">{bm.method_name}</span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-300">{bm.dataset_name || 'Standard Dataset'}</td>
                                <td className="py-2.5 px-3 font-medium text-slate-300">{bm.metric_name}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-purple-700">
                                  {bm.reported_value} {bm.unit}
                                </td>
                                <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-xs truncate">
                                  {bm.source_citation || (bm.doi ? `DOI: ${bm.doi}` : 'Published Literature')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Tab 4: 10-Point Reproducibility Scorecard */}
                {activeTab === 'reproducibility' && (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                          <span>10-Point Academic Reproducibility Protocol</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Evaluates structural completeness against peer-reviewed reproducible research criteria.
                        </p>
                      </div>

                      <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${getScoreColor(selectedExperiment.reproducibility_score || 0)}`}>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Coverage: {selectedExperiment.reproducibility_score ?? 80}%</span>
                      </div>
                    </div>

                    {/* Checklist Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { key: 'dataset_name', label: '1. Dataset Name & Provenance', desc: selectedExperiment.dataset_used || 'Not specified', ok: !!selectedExperiment.dataset_used },
                        { key: 'dataset_version', label: '2. Dataset Version / Split', desc: selectedExperiment.dataset_version || 'Not specified', ok: !!selectedExperiment.dataset_version },
                        { key: 'preprocessing', label: '3. Data Preprocessing Protocol', desc: selectedExperiment.preprocessing_notes || 'Not recorded', ok: !!selectedExperiment.preprocessing_notes },
                        { key: 'model_arch', label: '4. Explicit Model Architecture', desc: selectedExperiment.proposed_method || 'Not specified', ok: !!selectedExperiment.proposed_method },
                        { key: 'random_seed', label: '5. Deterministic Random Seed', desc: selectedExperiment.random_seed ? `Seed: ${selectedExperiment.random_seed}` : 'Not set', ok: selectedExperiment.random_seed !== undefined && selectedExperiment.random_seed !== null },
                        { key: 'hardware_env', label: '6. Hardware Compute Environment', desc: selectedExperiment.hardware_environment || 'Not recorded', ok: !!selectedExperiment.hardware_environment },
                        { key: 'software_env', label: '7. Software Runtime & Libraries', desc: selectedExperiment.software_environment || 'Not recorded', ok: !!selectedExperiment.software_environment },
                        { key: 'hyperparameters', label: '8. Hyperparameter Snapshot', desc: selectedExperiment.hyperparameters && Object.keys(selectedExperiment.hyperparameters).length > 0 ? `${Object.keys(selectedExperiment.hyperparameters).length} recorded` : 'Implicit/Defaults', ok: true },
                        { key: 'metrics_def', label: '9. Standardized Metrics Definition', desc: selectedExperiment.evaluation_metrics?.join(', ') || 'Accuracy, F1', ok: (selectedExperiment.evaluation_metrics?.length || 0) > 0 },
                        { key: 'raw_logs', label: '10. Empirical Multi-Run Logs', desc: `${selectedExperiment.runs?.length || 0} runs logged`, ok: (selectedExperiment.runs?.length || 0) > 0 }
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${
                            item.ok
                              ? 'bg-slate-100 border-emerald-200 text-slate-200'
                              : 'bg-slate-100 border-amber-200 text-slate-400'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              {item.ok ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
                              {item.label}
                            </span>
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{item.desc}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {item.ok ? 'VERIFIED' : 'MISSING'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-400 flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Academic Disclaimer:</strong> InnoSphere AI reproducibility score measures empirical protocol completeness, seed determinism, and variable traceability in compliance with standard computer science research criteria.
                      </span>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 5: Evidence Artifacts */}
                {activeTab === 'evidence' && (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-blue-600" />
                          <span>Traceable Empirical Evidence Artifacts</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Link raw log traces, confusion matrix outputs, and hardware telemetry traces.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowEvidenceModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Attach Evidence</span>
                      </button>
                    </div>

                    {(!selectedExperiment.evidence_links || selectedExperiment.evidence_links.length === 0) ? (
                      <div className="p-8 text-center rounded-xl bg-slate-100 border border-dashed border-slate-200">
                        <Tag className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-400">No evidence artifacts attached</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                          Attach log traces, training curves, telemetry samples, or repository commit hashes.
                        </p>
                        <button
                          onClick={() => setShowEvidenceModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Attach First Artifact
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedExperiment.evidence_links.map((ev) => (
                          <div key={ev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{ev.title}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-200 uppercase">
                                {ev.verification_status}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-blue-600 block">{ev.evidence_type}</span>
                            {ev.description && <p className="text-[11px] text-slate-400">{ev.description}</p>}
                            {ev.file_path_or_url && (
                              <a
                                href={ev.file_path_or_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 pt-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>{ev.file_path_or_url}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-200">
                <FlaskConical className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">Select or Create an Experiment</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto mb-4">
                  Select an experiment from the registry on the left to inspect empirical runs, comparative metric matrices, and reproducibility indicators.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
                >
                  Create New Experiment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-white">Guided Experiment Builder</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Experiment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantized 1D-CNN vs Random Forest for Edge Telemetry Anomaly Detection"
                  value={newExpForm.name}
                  onChange={(e) => setNewExpForm({ ...newExpForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Empirical Hypothesis *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Deploying a quantized 1D-CNN achieves >=94% F1 with sub-30ms inference latency on microcontroller testbeds."
                  value={newExpForm.hypothesis}
                  onChange={(e) => setNewExpForm({ ...newExpForm, hypothesis: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Baseline Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Random Forest (100 Trees)"
                    value={newExpForm.baseline_model}
                    onChange={(e) => setNewExpForm({ ...newExpForm, baseline_model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Proposed Method / Architecture *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Edge 1D-CNN + Temporal Feature Layer"
                    value={newExpForm.proposed_method}
                    onChange={(e) => setNewExpForm({ ...newExpForm, proposed_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Dataset</label>
                  <input
                    type="text"
                    placeholder="e.g. WHO Water Potability Trace"
                    value={newExpForm.dataset_used}
                    onChange={(e) => setNewExpForm({ ...newExpForm, dataset_used: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dataset Version</label>
                  <input
                    type="text"
                    placeholder="e.g. v2.0"
                    value={newExpForm.dataset_version}
                    onChange={(e) => setNewExpForm({ ...newExpForm, dataset_version: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Random Seed</label>
                  <input
                    type="number"
                    value={newExpForm.random_seed}
                    onChange={(e) => setNewExpForm({ ...newExpForm, random_seed: parseInt(e.target.value, 10) || 42 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Evaluation Metrics (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Accuracy, F1-Score, Inference Latency, RAM Footprint"
                  value={newExpForm.evaluation_metrics}
                  onChange={(e) => setNewExpForm({ ...newExpForm, evaluation_metrics: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hardware Testbed Environment</label>
                  <input
                    type="text"
                    value={newExpForm.hardware_environment}
                    onChange={(e) => setNewExpForm({ ...newExpForm, hardware_environment: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Software Runtime</label>
                  <input
                    type="text"
                    value={newExpForm.software_environment}
                    onChange={(e) => setNewExpForm({ ...newExpForm, software_environment: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Create Experiment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Run Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-white">Record Experimental Run</h2>
              </div>
              <button onClick={() => setShowRunModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddRun} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Run Label</label>
                  <input
                    type="text"
                    placeholder={`Run ${(selectedExperiment?.runs?.length || 0) + 1}`}
                    value={newRunForm.run_label}
                    onChange={(e) => setNewRunForm({ ...newRunForm, run_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Random Seed</label>
                  <input
                    type="number"
                    value={newRunForm.random_seed}
                    onChange={(e) => setNewRunForm({ ...newRunForm, random_seed: parseInt(e.target.value, 10) || 42 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Execution Time (ms)</label>
                <input
                  type="number"
                  value={newRunForm.execution_time_ms}
                  onChange={(e) => setNewRunForm({ ...newRunForm, execution_time_ms: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Metrics (JSON key/value numeric)</label>
                <textarea
                  rows={3}
                  value={newRunForm.metrics_json}
                  onChange={(e) => setNewRunForm({ ...newRunForm, metrics_json: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Run Notes / Observation</label>
                <input
                  type="text"
                  value={newRunForm.logs_or_notes}
                  onChange={(e) => setNewRunForm({ ...newRunForm, logs_or_notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Run</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Result Metric Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-white">Record Comparative Metric</h2>
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddResult} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Metric Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Accuracy, F1-Score, Latency"
                    value={newResultForm.metric_name}
                    onChange={(e) => setNewResultForm({ ...newResultForm, metric_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. %, ms, MB"
                    value={newResultForm.unit}
                    onChange={(e) => setNewResultForm({ ...newResultForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Baseline Value *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newResultForm.baseline_value}
                    onChange={(e) => setNewResultForm({ ...newResultForm, baseline_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Proposed Value *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newResultForm.proposed_value}
                    onChange={(e) => setNewResultForm({ ...newResultForm, proposed_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Optimization Direction</label>
                <select
                  value={newResultForm.direction}
                  onChange={(e) => setNewResultForm({ ...newResultForm, direction: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                >
                  <option value="higher_is_better">Higher is Better (e.g. Accuracy, F1-Score, Throughput)</option>
                  <option value="lower_is_better">Lower is Better (e.g. Latency, Loss, Memory)</option>
                  <option value="neutral">Neutral / Descriptive</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Metric</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Benchmark Reference Modal */}
      {showBenchmarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-white">Add Published Benchmark Reference</h2>
              </div>
              <button onClick={() => setShowBenchmarkModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddBenchmark} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reference Name / Author *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ResNet-18 SOTA (Smith et al., 2024)"
                  value={newBenchmarkForm.reference_name}
                  onChange={(e) => setNewBenchmarkForm({ ...newBenchmarkForm, reference_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Method / Architecture *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ResNet-18"
                    value={newBenchmarkForm.method_name}
                    onChange={(e) => setNewBenchmarkForm({ ...newBenchmarkForm, method_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Metric Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Accuracy"
                    value={newBenchmarkForm.metric_name}
                    onChange={(e) => setNewBenchmarkForm({ ...newBenchmarkForm, metric_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reported Value *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newBenchmarkForm.reported_value}
                    onChange={(e) => setNewBenchmarkForm({ ...newBenchmarkForm, reported_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. %"
                    value={newBenchmarkForm.unit}
                    onChange={(e) => setNewBenchmarkForm({ ...newBenchmarkForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">DOI / Citation Link</label>
                <input
                  type="text"
                  placeholder="e.g. 10.1109/ACCESS.2024.123456"
                  value={newBenchmarkForm.doi}
                  onChange={(e) => setNewBenchmarkForm({ ...newBenchmarkForm, doi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBenchmarkModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Benchmark</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-white">Attach Evidence Artifact</h2>
              </div>
              <button onClick={() => setShowEvidenceModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Artifact Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10-Fold Cross Validation Loss Curve / Telemetry Log"
                  value={newEvidenceForm.title}
                  onChange={(e) => setNewEvidenceForm({ ...newEvidenceForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Evidence Type</label>
                <select
                  value={newEvidenceForm.evidence_type}
                  onChange={(e) => setNewEvidenceForm({ ...newEvidenceForm, evidence_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                >
                  <option value="run_log">Raw Execution Log</option>
                  <option value="metric_chart">Metric / Loss Chart</option>
                  <option value="confusion_matrix">Confusion Matrix</option>
                  <option value="hardware_telemetry">Hardware Telemetry Stream</option>
                  <option value="dataset_sample">Dataset Split Sample</option>
                  <option value="code_repo">Code Repository Commit</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">File Path or Link</label>
                <input
                  type="text"
                  placeholder="e.g. https://github.com/... or logs/run_01.log"
                  value={newEvidenceForm.file_path_or_url}
                  onChange={(e) => setNewEvidenceForm({ ...newEvidenceForm, file_path_or_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Attach Evidence</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV / JSON Importer Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-white">Import Experimental Results & Multi-Runs</h2>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImportResults} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-slate-300 font-semibold">Format:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportForm({ ...importForm, file_format: 'json' })}
                    className={`px-2.5 py-1 rounded font-semibold ${importForm.file_format === 'json' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportForm({ ...importForm, file_format: 'csv' })}
                    className={`px-2.5 py-1 rounded font-semibold ${importForm.file_format === 'csv' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    CSV
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Paste Raw Results / Table</label>
                <textarea
                  rows={8}
                  value={importForm.content}
                  onChange={(e) => setImportForm({ ...importForm, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-white font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>Import Records</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync to Research Paper Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h2 className="text-base font-bold text-white">Synchronize to Research Document</h2>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-slate-300">
                This will format all verified empirical benchmark tables into LaTeX and Markdown and synchronize them into your project&apos;s Research Paper sections:
              </p>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {['experimental_methodology', 'results', 'discussion', 'limitations'].map((sec) => (
                  <span key={sec} className="px-2 py-0.5 rounded font-mono bg-purple-50 text-purple-700 border border-purple-200">
                    § {sec}
                  </span>
                ))}
              </div>

              {syncPreview && (
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Markdown Benchmark Table Preview:</span>
                  <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {syncPreview.markdown_table_preview}
                  </pre>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 border border-slate-200">
                <input
                  type="checkbox"
                  id="syncOverwrite"
                  checked={syncOverwrite}
                  onChange={(e) => setSyncOverwrite(e.target.checked)}
                  className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="syncOverwrite" className="text-slate-300 font-medium cursor-pointer">
                  Directly update research paper text sections with latest empirical tables & hypotheses
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSync}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span>Execute Research Sync</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Hardware Lab Modal */}
      {showHardwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-600" />
                <h2 className="text-base font-bold text-white">Link Active Hardware Lab Testbed</h2>
              </div>
              <button onClick={() => setShowHardwareModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Select a connected hardware device to automatically formulate an empirical microcontroller / edge AI experiment with live sensor telemetry benchmarks:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {hardwareDevices.map((dev) => (
                  <div
                    key={dev.id}
                    onClick={() => handleCreateFromHardware(dev.id)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{dev.name}</h4>
                      <span className="text-[10px] text-cyan-600">{dev.device_type} • {dev.network_protocol}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-700 border border-cyan-200">
                      Link Testbed
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowHardwareModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
