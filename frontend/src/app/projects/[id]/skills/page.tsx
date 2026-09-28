'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  Sparkles,
  Lightbulb,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  BookOpen,
  FlaskConical,
  Atom,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Award,
  Info,
  HelpCircle,
  GitPullRequest,
  Compass,
  FileText,
  Target,
  Database,
  Terminal,
  Send,
  Sliders,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth-context';

export default function ProjectSkillsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProject, projects, setActiveProjectId } = useProject();
  const { user } = useAuth();

  const rawProjectId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const projectId = rawProjectId ? parseInt(rawProjectId) : (activeProject ? activeProject.id : 1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillsData, setSkillsData] = useState<any>(null);

  // Active Tab: 'matrix' | 'technologies' | 'graph' | 'roadmap' | 'resources' | 'mentor'
  const [activeTab, setActiveTab] = useState<'matrix' | 'technologies' | 'graph' | 'roadmap' | 'resources' | 'mentor'>('matrix');

  // Filter state for matrix
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Skill for detail modal / drawer
  const [selectedSkill, setSelectedSkill] = useState<any>(null);

  // Modals
  const [questionnaireModalOpen, setQuestionnaireModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceSkillTarget, setEvidenceSkillTarget] = useState<any>(null);
  const [evidenceForm, setEvidenceForm] = useState({ title: '', type: 'PROJECT_EVIDENCE', description: '' });

  // Questionnaire local form state
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Export state
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json'>('markdown');
  const [exportData, setExportData] = useState<any>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  // Syncing state
  const [syncingRoadmap, setSyncingRoadmap] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Mentor interactive prompt
  const [mentorQuery, setMentorQuery] = useState('');

  // Fetch Skills Analysis
  const loadSkillsData = async (forceRefresh = false) => {
    if (!projectId) return;
    setLoading(!forceRefresh);
    setRefreshing(forceRefresh);
    setError(null);
    try {
      const data = forceRefresh
        ? await api.refreshSkills(projectId)
        : await api.getSkillsAnalysis(projectId);
      setSkillsData(data);

      // Pre-fill questionnaire answers
      const initialAnswers: Record<string, string> = {};
      if (data.student_profile) {
        data.student_profile.forEach((p: any) => {
          initialAnswers[p.skill_name] = p.current_level || 'NOT_SURE';
        });
      }
      setQuestionnaireAnswers(initialAnswers);
    } catch (err: any) {
      console.error('Error fetching skills gap analysis:', err);
      setError(err.message || 'Unable to load skills & prerequisites data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSkillsData();
  }, [projectId]);

  // Handle questionnaire submit
  const handleSaveQuestionnaire = async () => {
    setSavingProfile(true);
    try {
      const profiles = Object.entries(questionnaireAnswers).map(([skill_name, current_level]) => ({
        skill_name,
        current_level,
        progress_pct: current_level === 'EXPERT' ? 100 : (current_level === 'ADVANCED' ? 85 : (current_level === 'INTERMEDIATE' ? 65 : (current_level === 'BEGINNER' ? 35 : 0))),
        learning_status: current_level === 'EXPERT' || current_level === 'ADVANCED' ? 'COMPLETED' : (current_level === 'INTERMEDIATE' || current_level === 'BEGINNER' ? 'LEARNING' : 'NOT_STARTED'),
        confidence: current_level === 'NOT_SURE' ? 'LOW' : 'HIGH'
      }));

      await api.updateStudentSkillProfileBatch(projectId, profiles);
      setQuestionnaireModalOpen(false);
      await loadSkillsData(true);
    } catch (err: any) {
      console.error('Error saving skill profile:', err);
      alert('Failed to update skill profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle single skill level change from matrix inline selector
  const handleQuickLevelChange = async (skillName: string, newLevel: string) => {
    try {
      await api.updateStudentSkillProfile(projectId, {
        skill_name: skillName,
        current_level: newLevel,
        progress_pct: newLevel === 'EXPERT' ? 100 : (newLevel === 'ADVANCED' ? 85 : (newLevel === 'INTERMEDIATE' ? 65 : (newLevel === 'BEGINNER' ? 35 : 0))),
        learning_status: newLevel === 'EXPERT' || newLevel === 'ADVANCED' ? 'COMPLETED' : (newLevel === 'INTERMEDIATE' || newLevel === 'BEGINNER' ? 'LEARNING' : 'NOT_STARTED')
      });
      // Refresh
      await loadSkillsData(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Evidence Submission
  const handleAddEvidence = async () => {
    if (!evidenceSkillTarget || !evidenceForm.title) return;
    try {
      await api.updateStudentSkillProfile(projectId, {
        skill_name: evidenceSkillTarget.skill_name,
        current_level: evidenceSkillTarget.current_level || 'BEGINNER',
        evidence_items: [
          {
            type: evidenceForm.type,
            title: evidenceForm.title,
            description: evidenceForm.description,
            date: new Date().toISOString().split('T')[0]
          }
        ]
      });
      setEvidenceModalOpen(false);
      setEvidenceForm({ title: '', type: 'PROJECT_EVIDENCE', description: '' });
      await loadSkillsData(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle sync to roadmap
  const handleSyncRoadmap = async () => {
    setSyncingRoadmap(true);
    setSyncSuccessMsg(null);
    try {
      const res = await api.syncSkillsToRoadmap(projectId);
      setSyncSuccessMsg(res.message);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Sync roadmap error:', err);
      alert('Failed to synchronize with roadmap.');
    } finally {
      setSyncingRoadmap(false);
    }
  };

  // Handle Export
  const handleOpenExport = async (format: 'markdown' | 'json' = 'markdown') => {
    setExportFormat(format);
    setExportModalOpen(true);
    setExportLoading(true);
    try {
      const exp = await api.exportSkillPlan(projectId, format);
      setExportData(exp);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExportLoading(false);
    }
  };

  // Helpers for Status Badges
  const getGapStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> READY
          </span>
        );
      case 'PARTIALLY_READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Info className="h-3 w-3" /> PARTIALLY READY
          </span>
        );
      case 'LEARNING_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-200">
            <AlertCircle className="h-3 w-3" /> LEARNING REQUIRED
          </span>
        );
      case 'PREREQUISITE_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-200">
            <GitPullRequest className="h-3 w-3" /> PREREQUISITE REQUIRED
          </span>
        );
      case 'OPTIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-200">
            OPTIONAL
          </span>
        );
      case 'NOT_ASSESSED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-200">
            <HelpCircle className="h-3 w-3" /> NOT ASSESSED
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">LOW</span>;
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'HIGH':
        return <span className="text-[10px] font-mono text-amber-600 font-bold">Effort: High</span>;
      case 'LOW':
        return <span className="text-[10px] font-mono text-emerald-600 font-bold">Effort: Low</span>;
      default:
        return <span className="text-[10px] font-mono text-blue-400 font-bold">Effort: Med</span>;
    }
  };

  // Filtered skills
  const filteredGaps = useMemo(() => {
    if (!skillsData?.skill_gaps) return [];
    return skillsData.skill_gaps.filter((g: any) => {
      const matchCat = filterCategory === 'ALL' || g.category === filterCategory;
      const matchStatus = filterStatus === 'ALL' || g.gap_status === filterStatus;
      const matchQuery = !searchQuery || g.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) || g.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStatus && matchQuery;
    });
  }, [skillsData, filterCategory, filterStatus, searchQuery]);

  const categories = useMemo(() => {
    if (!skillsData?.skill_gaps) return [];
    const set = new Set<string>();
    skillsData.skill_gaps.forEach((g: any) => set.add(g.category));
    return Array.from(set);
  }, [skillsData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-600/20 border border-blue-200 mb-4 animate-pulse">
          <Brain className="h-7 w-7 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Analyzing Project Skills & Prerequisites...</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md text-center">
          Extracting required technologies, topological dependency chains & personalized learning roadmap
        </p>
      </div>
    );
  }

  if (error || !skillsData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="max-w-md w-full rounded-3xl bg-white border border-slate-200 p-8 text-center space-y-4 shadow-2xl">
          <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Skills Gap Analysis Notice</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{error || 'Project skill data could not be computed.'}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => loadSkillsData(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Retry Analysis
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const summary = skillsData.summary;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & WORKSPACE BANNER                              */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-950 border-b border-slate-200 pt-8 pb-6 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/10 text-blue-700 border border-blue-200">
                  <Brain className="h-3.5 w-3.5 text-blue-600" />
                  SKILLS & PREREQUISITES GAP MAP
                </span>
                <span className="text-xs font-bold text-slate-400">•</span>
                <span className="text-xs font-mono font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200">
                  {skillsData.domain || 'Engineering Project'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {skillsData.project_title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Understand what you need to learn before building your innovation. InnoSphere AI maps your project requirements to the technologies and skills you need, identifies learning gaps, and creates a personalized learning path.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setQuestionnaireModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>My Skill Profile</span>
              </button>

              <button
                onClick={handleSyncRoadmap}
                disabled={syncingRoadmap}
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-800 border border-slate-200 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <GitPullRequest className={`h-3.5 w-3.5 text-teal-600 ${syncingRoadmap ? 'animate-spin' : ''}`} />
                <span>Sync Roadmap</span>
              </button>

              <button
                onClick={() => handleOpenExport('markdown')}
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-800 border border-slate-200 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Export Learning Plan"
              >
                <Download className="h-3.5 w-3.5 text-cyan-600" />
                <span>Export Plan</span>
              </button>

              <button
                onClick={() => loadSkillsData(true)}
                disabled={refreshing}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-800 border border-slate-200 text-slate-400 hover:text-white transition-all"
                title="Refresh Analysis"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sync Success Alert */}
          {syncSuccessMsg && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* VISUAL WORKFLOW FLOW CHART BAR                              */}
          {/* ----------------------------------------------------------- */}
          <div className="pt-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 min-w-[850px] p-2 rounded-2xl bg-white border border-slate-200">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">1. Student Idea</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-200">2. Required Tech</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-200">3. Required Skills</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-200">4. Current Level</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">5. Skill Gaps</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-200">6. Learning Resources</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">7. Learning Roadmap</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">8. Project Build</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* ------------------------------------------------------------- */}
        {/* 2. SUMMARY METRICS & "AM I READY TO START?" PANEL             */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Summary Breakdown Card */}
          <div className="lg:col-span-1 rounded-3xl bg-white border border-slate-200 p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Skill Gap Breakdown</span>
                <span className="text-xs font-mono font-bold text-blue-600">{summary.total_required_skills} Required</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-600">Ready</div>
                  <div className="text-2xl font-black text-white mt-0.5">{summary.ready_count}</div>
                  <div className="text-[10px] text-slate-400">Competence verified</div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-500/30">
                  <div className="text-[10px] font-bold uppercase text-blue-400">Partially Ready</div>
                  <div className="text-2xl font-black text-white mt-0.5">{summary.partially_ready_count}</div>
                  <div className="text-[10px] text-slate-400">Needs minor brush-up</div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="text-[10px] font-bold uppercase text-rose-600">Learning Required</div>
                  <div className="text-2xl font-black text-white mt-0.5">{summary.learning_required_count}</div>
                  <div className="text-[10px] text-slate-400">Core gaps identified</div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] font-bold uppercase text-purple-600">Prereq Required</div>
                  <div className="text-2xl font-black text-white mt-0.5">{summary.prerequisite_required_count}</div>
                  <div className="text-[10px] text-slate-400">Learn foundation first</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Composite Readiness</span>
                <span className="text-blue-600 font-bold">{summary.readiness_percentage}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${summary.readiness_percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* "Am I Ready to Start?" Panel */}
          <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-5 space-y-3.5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-white">Can I Start Building? — Transparent Readiness Guidance</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-blue-700 border border-blue-200 font-bold">
                  Guided Milestones
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 italic">
                &ldquo;{skillsData.am_i_ready.verdict_summary}&rdquo;
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                {/* Immediate */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>You Can Begin Immediately</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {skillsData.am_i_ready.can_begin_immediately.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-emerald-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Before Core Model Dev</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {skillsData.am_i_ready.recommended_before_development.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-amber-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Required Before Deployment */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Before Final Deployment</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {skillsData.am_i_ready.required_before_deployment.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-rose-600">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>* InnoSphere AI provides transparent guidance without hard-blocking your development creativity.</span>
              <Link href="/experiments" className="text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                <span>Go to Experiments</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. NAVIGATION TABS                                            */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white text-slate-400 hover:text-slate-200 border border-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Skill Gap Matrix ({skillsData.skill_gaps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('technologies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'technologies'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white text-slate-400 hover:text-slate-200 border border-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Tech Stack Map ({skillsData.required_technologies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'graph'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white text-slate-400 hover:text-slate-200 border border-slate-200'
            }`}
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            <span>Dependency Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'roadmap'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white text-slate-400 hover:text-slate-200 border border-slate-200'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Learning Roadmap ({skillsData.learning_roadmap.total_phases} Phases)</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'resources'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white text-slate-400 hover:text-slate-200 border border-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Discovered Resources</span>
          </button>

          <button
            onClick={() => setActiveTab('mentor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'mentor'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white text-slate-400 hover:text-slate-200 border border-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>AI Mentor Guidance</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: SKILL GAP MATRIX                                       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Search & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search skills, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 w-full sm:w-56"
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-300 focus:outline-hidden"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-300 focus:outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="READY">Ready</option>
                  <option value="PARTIALLY_READY">Partially Ready</option>
                  <option value="LEARNING_REQUIRED">Learning Required</option>
                  <option value="PREREQUISITE_REQUIRED">Prerequisite Required</option>
                  <option value="OPTIONAL">Optional</option>
                  <option value="NOT_ASSESSED">Not Assessed</option>
                </select>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Showing {filteredGaps.length} of {skillsData.skill_gaps.length} skills
              </div>
            </div>

            {/* Matrix Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGaps.map((gap: any) => (
                <div
                  key={gap.id}
                  className="rounded-3xl bg-white border border-slate-200 p-5 space-y-3.5 shadow-lg hover:border-slate-200 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{gap.category}</span>
                          {getPriorityBadge(gap.priority)}
                        </div>
                        <h4 className="text-base font-bold text-white mt-0.5">{gap.skill_name}</h4>
                      </div>
                      <div>{getGapStatusBadge(gap.gap_status)}</div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{gap.reason}</p>

                    {/* Level Comparator Box */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Required Level</span>
                        <span className="text-xs font-bold text-blue-600">{gap.required_level}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">My Current Level</span>
                        <select
                          value={gap.current_level || 'NOT_SURE'}
                          onChange={(e) => handleQuickLevelChange(gap.skill_name, e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-200 border-none p-0 focus:outline-hidden cursor-pointer"
                        >
                          <option value="NONE" className="bg-white">None</option>
                          <option value="BEGINNER" className="bg-white">Beginner</option>
                          <option value="INTERMEDIATE" className="bg-white">Intermediate</option>
                          <option value="ADVANCED" className="bg-white">Advanced</option>
                          <option value="EXPERT" className="bg-white">Expert</option>
                          <option value="NOT_SURE" className="bg-white">Not sure</option>
                        </select>
                      </div>
                    </div>

                    {/* Prerequisites Chain Preview */}
                    {gap.prerequisites_chain && gap.prerequisites_chain.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                          <GitPullRequest className="h-3 w-3 text-purple-600" /> Prerequisite Chain
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {gap.prerequisites_chain.map((p: any, idx: number) => (
                            <span
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono flex items-center gap-1 ${
                                p.is_satisfied
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {p.is_satisfied ? '✓' : '⚠'} {p.skill_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getEffortBadge(gap.learning_effort)}
                      <span className="text-slate-500">•</span>
                      <span className="text-[11px] text-slate-400">{gap.resources_count} Resources</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEvidenceSkillTarget(gap);
                          setEvidenceModalOpen(true);
                        }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                        title="Attach evidence / certificate / repo"
                      >
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>Add Evidence</span>
                      </button>

                      <button
                        onClick={() => setSelectedSkill(gap)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-blue-700 border border-blue-200 font-semibold text-[11px] flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: TECHNOLOGY -> SKILL MAP                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'technologies' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Recommended Technology Stack Requirements</h3>
                <p className="text-xs text-slate-400 mt-0.5">Every technology recommendation in InnoSphere AI is mapped to its exact required skill competencies.</p>
              </div>
              <Link
                href="/insights"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
              >
                <span>View Tech Stack Advisor</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillsData.required_technologies.map((tech: any, idx: number) => (
                <div key={idx} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-600" />
                      <h4 className="text-base font-bold text-white font-mono">{tech.technology}</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-blue-700 border border-blue-200">
                      {tech.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{tech.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Required Skills to Master:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tech.required_skills.map((sk: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-200 flex items-center gap-1">
                          <Check className="h-3 w-3 text-blue-600" /> {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: TOPOLOGICAL SKILL DEPENDENCY GRAPH                     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'graph' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GitPullRequest className="h-4 w-4 text-purple-600" />
                    Topological Skill Dependency Graph
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Skills are organized by dependency depth. Arrows indicate prerequisite chains that unlock advanced project frameworks.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {skillsData.dependency_graph.nodes.length} Nodes • {skillsData.dependency_graph.edges.length} Dependencies
                </span>
              </div>

              {/* Topological Layer Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3">
                {/* Level 0: Foundations */}
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-200 flex items-center justify-between">
                    <span>Level 0: Foundations</span>
                    <span className="text-[10px] font-mono text-slate-500">Prereq Layer</span>
                  </div>
                  {skillsData.dependency_graph.nodes
                    .filter((n: any) => n.depth === 0)
                    .map((node: any) => (
                      <div
                        key={node.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-500/50 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{node.label}</span>
                          {getGapStatusBadge(node.gap_status)}
                        </div>
                        <div className="text-[10px] text-slate-400">{node.category}</div>
                      </div>
                    ))}
                </div>

                {/* Level 1: AI & Data Basics */}
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-200 flex items-center justify-between">
                    <span>Level 1: AI & Data</span>
                    <span className="text-[10px] font-mono text-slate-500">Intermediate</span>
                  </div>
                  {skillsData.dependency_graph.nodes
                    .filter((n: any) => n.depth === 1)
                    .map((node: any) => (
                      <div
                        key={node.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-500/50 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{node.label}</span>
                          {getGapStatusBadge(node.gap_status)}
                        </div>
                        <div className="text-[10px] text-slate-400">{node.category}</div>
                      </div>
                    ))}
                </div>

                {/* Level 2: Frameworks */}
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-200 flex items-center justify-between">
                    <span>Level 2: Frameworks</span>
                    <span className="text-[10px] font-mono text-slate-500">Core Tools</span>
                  </div>
                  {skillsData.dependency_graph.nodes
                    .filter((n: any) => n.depth === 2)
                    .map((node: any) => (
                      <div
                        key={node.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-500/50 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{node.label}</span>
                          {getGapStatusBadge(node.gap_status)}
                        </div>
                        <div className="text-[10px] text-slate-400">{node.category}</div>
                      </div>
                    ))}
                </div>

                {/* Level 3+: Specialized & Deployment */}
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-200 flex items-center justify-between">
                    <span>Level 3+: Specialized</span>
                    <span className="text-[10px] font-mono text-slate-500">Project Output</span>
                  </div>
                  {skillsData.dependency_graph.nodes
                    .filter((n: any) => n.depth >= 3)
                    .map((node: any) => (
                      <div
                        key={node.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-500/50 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{node.label}</span>
                          {getGapStatusBadge(node.gap_status)}
                        </div>
                        <div className="text-[10px] text-slate-400">{node.category}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: PERSONALIZED LEARNING ROADMAP                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-white">Personalized Prerequisite-Aware Learning Roadmap</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ordered learning phases ensure foundational concepts are mastered before complex model training and deployment.
                </p>
              </div>
              <button
                onClick={handleSyncRoadmap}
                disabled={syncingRoadmap}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <GitPullRequest className="h-3.5 w-3.5" />
                <span>{syncingRoadmap ? 'Syncing...' : 'Sync to Project Roadmap'}</span>
              </button>
            </div>

            <div className="space-y-6">
              {skillsData.learning_roadmap.phases.map((phase: any) => (
                <div key={phase.phase_number} className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-blue-600 tracking-wider">
                        Phase {phase.phase_number}
                      </span>
                      <h4 className="text-lg font-bold text-white">{phase.phase_name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{phase.description}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-300">
                      {phase.skills_count} Skills
                    </span>
                  </div>

                  <div className="space-y-3">
                    {phase.items.map((item: any) => (
                      <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-850 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="h-6 w-6 rounded-full bg-indigo-600/20 text-blue-700 font-bold text-xs flex items-center justify-center">
                              {item.sequence_order}
                            </span>
                            <div>
                              <h5 className="text-sm font-bold text-white">{item.skill_name}</h5>
                              <span className="text-[10px] text-slate-400">{item.category}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getGapStatusBadge(item.gap_status)}
                            {getEffortBadge(item.estimated_effort)}
                          </div>
                        </div>

                        {/* Grounded Resources */}
                        {item.resources && item.resources.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-850">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Recommended Learning Modules:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {item.resources.map((r: any, rIdx: number) => (
                                <a
                                  key={rIdx}
                                  href={r.url || '#'}
                                  target={r.url?.startsWith('http') ? '_blank' : '_self'}
                                  rel="noopener noreferrer"
                                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 group transition-colors"
                                >
                                  <div>
                                    <div className="text-xs font-semibold text-white group-hover:text-blue-700 flex items-center gap-1">
                                      <span>{r.title}</span>
                                      <ExternalLink className="h-3 w-3 opacity-60" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{r.why_this_resource}</p>
                                  </div>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
                                    {r.source}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Unlocked Project Tasks */}
                        {item.project_tasks && item.project_tasks.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            <span className="text-[10px] font-bold text-amber-600 uppercase">⚡ Unlocks Project Action:</span>
                            {item.project_tasks.map((t: any, tIdx: number) => (
                              <Link
                                key={tIdx}
                                href={t.action || '#'}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <span>{t.title}</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: DISCOVERED LEARNING RESOURCES                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'resources' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Grounded Open-Access Learning Resources</h3>
                <p className="text-xs text-slate-400 mt-0.5">Matched from arXiv papers, official documentation, GitHub repositories, and Kaggle open datasets.</p>
              </div>
              <Link
                href="/discover"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
              >
                <span>Search All Repos</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillsData.skill_gaps.map((gap: any) => (
                <div key={gap.id} className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">{gap.category}</span>
                      <h4 className="text-sm font-bold text-white">{gap.skill_name}</h4>
                    </div>
                    {getGapStatusBadge(gap.gap_status)}
                  </div>

                  <p className="text-xs text-slate-300 italic">&ldquo;{gap.reason}&rdquo;</p>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Available Learning Links:</span>
                    <div className="space-y-1.5">
                      <a
                        href={`https://github.com/topics/${gap.skill_name.toLowerCase().replace(/\s+/g, '-')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-200 group"
                      >
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold group-hover:text-blue-700">GitHub Open Source Implementations</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                      </a>

                      <Link
                        href={`/discover?query=${encodeURIComponent(gap.skill_name)}`}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-200 group"
                      >
                        <div className="flex items-center gap-2">
                          <Atom className="h-4 w-4 text-cyan-600" />
                          <span className="font-semibold group-hover:text-cyan-700">Explore Scientific Papers on arXiv / OpenAlex</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: AI MENTOR GUIDANCE & PROMPTS                           */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'mentor' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-blue-200 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600/20 border border-blue-200 text-blue-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Mentor — Context-Aware Learning Guidance</h3>
                  <p className="text-xs text-slate-300">
                    The AI Mentor has loaded your project's technology stack, skill requirements, and learning gaps.
                  </p>
                </div>
              </div>

              {/* Pre-Populated Prompt Chips */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-blue-700">Suggested Questions for Your Project:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {skillsData.mentor_prompts.map((prompt: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMentorQuery(prompt);
                        router.push(`/mentor?query=${encodeURIComponent(prompt)}`);
                      }}
                      className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left text-xs text-slate-200 hover:text-white transition-all flex items-center justify-between group"
                    >
                      <span className="font-medium pr-2">&ldquo;{prompt}&rdquo;</span>
                      <Send className="h-3.5 w-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  href="/mentor"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Open Full AI Mentor Conversation</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ONBOARDING / PROFILE QUESTIONNAIRE MODAL                      */}
      {/* ------------------------------------------------------------- */}
      {questionnaireModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-white">Student Skill Self-Assessment Questionnaire</h3>
              </div>
              <button
                onClick={() => setQuestionnaireModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="my-4 overflow-y-auto space-y-4 pr-1">
              <p className="text-xs text-slate-300">
                Select your experience level for each required project skill. This personalizes your learning roadmap and highlights exact prerequisites.
              </p>

              {skillsData.skill_requirements.map((req: any) => (
                <div key={req.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">{req.skill_name}</h5>
                      <span className="text-[10px] text-slate-400">{req.category} • Required: {req.required_level}</span>
                    </div>
                  </div>

                  {/* Level Options Radio Chips */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                    {['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'NOT_SURE'].map((lvl) => {
                      const isSelected = (questionnaireAnswers[req.skill_name] || 'NOT_SURE') === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setQuestionnaireAnswers((prev) => ({ ...prev, [req.skill_name]: lvl }))}
                          className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold border transition-all text-center ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                              : 'bg-white hover:bg-slate-50 text-slate-300 border-slate-200'
                          }`}
                        >
                          {lvl === 'NOT_SURE' ? 'Not sure' : lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setQuestionnaireModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestionnaire}
                disabled={savingProfile}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {savingProfile ? 'Updating Gaps...' : 'Save & Recalculate Gaps'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EXPORT LEARNING PLAN MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-cyan-600" />
                <h3 className="text-base font-bold text-white">Export Skills & Learning Plan</h3>
              </div>
              <button onClick={() => setExportModalOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="flex gap-2 my-3">
              <button
                onClick={() => handleOpenExport('markdown')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  exportFormat === 'markdown' ? 'bg-cyan-600 text-white' : 'bg-slate-50 text-slate-400 border border-slate-200'
                }`}
              >
                Markdown Format
              </button>
              <button
                onClick={() => handleOpenExport('json')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  exportFormat === 'json' ? 'bg-cyan-600 text-white' : 'bg-slate-50 text-slate-400 border border-slate-200'
                }`}
              >
                JSON Payload
              </button>
            </div>

            <div className="my-2 overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-[48vh]">
              {exportLoading
                ? 'Generating export...'
                : exportFormat === 'markdown'
                ? exportData?.content_markdown
                : JSON.stringify(exportData?.json_data, null, 2)}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  const text = exportFormat === 'markdown' ? exportData?.content_markdown : JSON.stringify(exportData?.json_data, null, 2);
                  navigator.clipboard.writeText(text || '');
                  setCopiedExport(true);
                  setTimeout(() => setCopiedExport(false), 2000);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedExport ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedExport ? 'Copied to Clipboard' : 'Copy Output'}</span>
              </button>
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD EVIDENCE MODAL                                            */}
      {/* ------------------------------------------------------------- */}
      {evidenceModalOpen && evidenceSkillTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-white">Attach Skill Evidence</h3>
              </div>
              <button onClick={() => setEvidenceModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold">Target Skill:</span>
                <div className="text-sm font-bold text-white mt-0.5">{evidenceSkillTarget.skill_name}</div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Evidence Type</label>
                <select
                  value={evidenceForm.type}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-200 focus:outline-hidden"
                >
                  <option value="PROJECT_EVIDENCE">Project Implementation / Code</option>
                  <option value="SELF_REPORTED">Course Completion / Certificate</option>
                  <option value="RESOURCE_COMPLETION">Tutorial / Practice Completed</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Evidence Title / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. GitHub repo link or course certificate"
                  value={evidenceForm.title}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Brief explanation of what was implemented or verified..."
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-200 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setEvidenceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvidence}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Save Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
