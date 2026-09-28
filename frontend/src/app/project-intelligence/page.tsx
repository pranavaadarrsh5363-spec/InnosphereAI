'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Cpu,
  Layers,
  MapPin,
  GraduationCap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  Award,
  Clock,
  Compass,
  FileText,
  Database,
  Radio,
  BarChart2,
  Info
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useProject } from '@/lib/project-context';
import { api } from '@/lib/api';
import {
  ProjectIntelligenceProfile,
  ReadinessDimension,
  ProjectRiskItem,
  NextBestAction,
  ResearchCluster,
  InnovationGapItem
} from '@/types';
import { getDomainColor } from '@/lib/utils';

export default function ProjectIntelligencePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { projects, activeProject, setActiveProjectId } = useProject();

  const [profile, setProfile] = useState<ProjectIntelligenceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dimensions' | 'risks' | 'research' | 'timeline'>('overview');

  const selectedProjectId = activeProject?.id || (projects.length > 0 ? projects[0].id : 1);

  useEffect(() => {
    if (selectedProjectId) {
      loadIntelligence(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadIntelligence = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getProjectIntelligence(projectId);
      setProfile(data);
    } catch (err: any) {
      console.error('Failed to load project intelligence:', err);
      setError(err.message || 'Unable to evaluate project intelligence at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedProjectId) return;
    setIsRefreshing(true);
    try {
      const res = await api.refreshProjectIntelligence(selectedProjectId);
      if (res && res.profile) {
        setProfile(res.profile);
      }
    } catch (err: any) {
      console.error('Failed to refresh intelligence:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'EXEMPLARY':
        return {
          label: 'Exemplary Maturity',
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400'
        };
      case 'STRONG':
        return {
          label: 'Strong Foundation',
          bg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
          dot: 'bg-indigo-400'
        };
      case 'DEVELOPING':
        return {
          label: 'Developing Progress',
          bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
          dot: 'bg-blue-400'
        };
      case 'NEEDS_ATTENTION':
        return {
          label: 'Needs Attention',
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400'
        };
      case 'CRITICAL':
      default:
        return {
          label: 'Early Formulation',
          bg: 'bg-red-500/15 border-red-500/30 text-red-400',
          dot: 'bg-red-400'
        };
    }
  };

  const getDimensionIcon = (key: string) => {
    switch (key) {
      case 'problem_clarity':
        return <FileText className="h-4 w-4 text-emerald-400" />;
      case 'research_readiness':
        return <BookOpen className="h-4 w-4 text-blue-400" />;
      case 'technology_stack':
        return <Cpu className="h-4 w-4 text-indigo-400" />;
      case 'resource_readiness':
        return <Database className="h-4 w-4 text-purple-400" />;
      case 'hardware_readiness':
        return <Radio className="h-4 w-4 text-cyan-400" />;
      case 'execution_progress':
        return <MapPin className="h-4 w-4 text-amber-400" />;
      case 'validation_and_risk':
      default:
        return <GraduationCap className="h-4 w-4 text-pink-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW':
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const domainColor = activeProject ? getDomainColor(activeProject.domain) : { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner / Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-13 sm:top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Project Intelligence Command Center
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Engine
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Multidimensional maturity analysis, automated risk radar & evidence-backed Next Best Action
                </p>
              </div>
            </div>

            {/* Project Switcher & Action Controls */}
            <div className="flex items-center gap-2.5">
              {projects.length > 1 && (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setActiveProjectId(Number(e.target.value))}
                  aria-label="Select Project for Intelligence Evaluation"
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.domain})
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Recalculate all 7 dimensions with latest project resources"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Evaluating...' : 'Recalculate'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 mt-3 border-t border-slate-800/80 pt-2.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Command Overview', icon: Activity },
              { id: 'dimensions', label: '7-Dimension Maturity', icon: BarChart2 },
              { id: 'risks', label: `Risk Matrix (${profile?.risks.length || 0})`, icon: ShieldAlert },
              { id: 'research', label: 'Research Landscape & Gaps', icon: BookOpen },
              { id: 'timeline', label: 'Health Trajectory', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-800 text-indigo-300 font-semibold border border-slate-700 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {isLoading ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
            <div>
              <p className="text-sm font-bold text-white">Synthesizing Project Intelligence Profile...</p>
              <p className="text-xs text-slate-400 mt-1">
                Evaluating literature depth, roadmap velocity, risk indicators & Next Best Action
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="glass-panel rounded-3xl p-8 text-center border border-red-900/50 bg-red-950/20 space-y-3">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Intelligence Evaluation Unavailable</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => selectedProjectId && loadIntelligence(selectedProjectId)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white"
            >
              Retry Evaluation
            </button>
          </div>
        ) : profile ? (
          <>
            {/* Health Score Banner & Project Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Health Radial / Gauge Card */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Composite Project Health
                  </span>
                  {profile.cache_hit && (
                    <span className="text-[10px] text-slate-500 font-mono">Fingerprint Cached</span>
                  )}
                </div>

                <div className="my-4 flex items-center gap-5">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="text-slate-800 stroke-current"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className={`stroke-current transition-all duration-1000 ease-out ${
                          profile.overall_health_score >= 85
                            ? 'text-emerald-400'
                            : profile.overall_health_score >= 70
                            ? 'text-indigo-400'
                            : profile.overall_health_score >= 50
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - profile.overall_health_score / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white">{profile.overall_health_score}</span>
                      <span className="text-[9px] text-slate-400 -mt-1 font-bold">/ 100</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {(() => {
                      const badge = getHealthBadge(profile.health_status);
                      return (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot} animate-pulse`} />
                          <span>{badge.label}</span>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {profile.summary_verdict}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Evaluated: {new Date(profile.evaluated_at).toLocaleDateString()}</span>
                  <Link
                    href={`/roadmap/${profile.project_id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    View Roadmap <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Next Best Action Card (High Priority Hero) */}
              <div className="lg:col-span-2 glass-panel rounded-3xl p-5 sm:p-6 border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 flex flex-col justify-between relative shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Zap className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Highest-Leverage Next Action
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      +{profile.next_best_action.impact_score} Health Pts
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      Est. {profile.next_best_action.estimated_effort}
                    </span>
                  </div>
                </div>

                <div className="my-3 space-y-2">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    {profile.next_best_action.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {profile.next_best_action.rationale}
                  </p>

                  {/* Action Checklist */}
                  <div className="space-y-1.5 mt-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Actionable Execution Steps:
                    </span>
                    {profile.next_best_action.actionable_steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Supporting Resource Links */}
                  {profile.next_best_action.supporting_resources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-semibold text-slate-400">Linked Citations:</span>
                      {profile.next_best_action.supporting_resources.map((res, idx) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-indigo-300 font-medium transition-colors border border-slate-700"
                        >
                          <span className="truncate max-w-[180px]">{res.title}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span>Suggested Phase: <strong className="text-slate-200">{profile.next_best_action.suggested_phase}</strong></span>
                  <Link
                    href="/discover"
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-[11px] transition-colors"
                  >
                    Open Resource Discovery
                  </Link>
                </div>
              </div>
            </div>

            {/* TAB 1: OVERVIEW & 7-DIMENSION SNAPSHOT */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 7-Dimension Maturity Grid */}
                <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white">7-Dimensional Project Maturity Matrix</h3>
                    </div>
                    <span className="text-xs text-slate-400">Click any vector for evidence & recommendations</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {profile.dimensions.map((dim) => {
                      const isExpanded = expandedDimension === dim.key;
                      return (
                        <div
                          key={dim.key}
                          onClick={() => setExpandedDimension(isExpanded ? null : dim.key)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-slate-900 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getDimensionIcon(dim.key)}
                              <span className="text-xs font-bold text-slate-200 truncate max-w-[130px]">
                                {dim.name}
                              </span>
                            </div>
                            <span className="text-xs font-black text-white px-2 py-0.5 rounded bg-slate-800">
                              {dim.score}%
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-2.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                dim.score >= 80
                                  ? 'bg-emerald-400'
                                  : dim.score >= 65
                                  ? 'bg-indigo-400'
                                  : dim.score >= 45
                                  ? 'bg-amber-400'
                                  : 'bg-red-400'
                              }`}
                              style={{ width: `${dim.score}%` }}
                            />
                          </div>

                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            {dim.summary}
                          </p>

                          {/* Expanded Evidence & Recommendations Drawer */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-in fade-in zoom-in-95">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  Evidence Points:
                                </span>
                                <ul className="space-y-1">
                                  {dim.evidence.map((ev, i) => (
                                    <li key={i} className="text-[10px] text-slate-300 flex items-start gap-1.5">
                                      <span className="text-emerald-400">•</span>
                                      <span>{ev}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {dim.actionable_recommendations.length > 0 && (
                                <div>
                                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                                    Recommendations:
                                  </span>
                                  <ul className="space-y-1">
                                    {dim.actionable_recommendations.map((rec, i) => (
                                      <li key={i} className="text-[10px] text-indigo-200 flex items-start gap-1.5">
                                      <span className="text-indigo-400">→</span>
                                      <span>{rec}</span>
                                    </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Weight: {(dim.weight * 100).toFixed(0)}%</span>
                            <span className="text-indigo-400 font-medium">
                              {isExpanded ? 'Collapse' : 'Details'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Risk Radar Summary & Hardware Lab Health */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Active Risks Radar */}
                  <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-orange-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Active Project Risks ({profile.risks.length})
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('risks')}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-2">
                      {profile.risks.slice(0, 3).map((risk) => (
                        <div key={risk.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{risk.title}</span>
                            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded border ${getSeverityBadge(risk.severity)}`}>
                              {risk.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{risk.description}</p>
                          <div className="text-[10px] text-indigo-300 font-medium pt-1">
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hardware & Telemetry Readiness */}
                  <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Hardware Lab & Edge Telemetry
                        </h3>
                      </div>
                      <Link
                        href="/hardware-lab"
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        Open Lab
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Devices</span>
                        <p className="text-base font-extrabold text-white mt-0.5">
                          {profile.hardware_intelligence.device_count}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Sensors Probed</span>
                        <p className="text-base font-extrabold text-white mt-0.5">
                          {profile.hardware_intelligence.sensor_count}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Packet Health</span>
                        <p className="text-base font-extrabold text-emerald-400 mt-0.5">
                          {profile.hardware_intelligence.packet_health_pct}%
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Validation Status</span>
                        <p className="text-[11px] font-bold text-indigo-300 mt-1 truncate">
                          {profile.hardware_intelligence.validation_status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FULL 7-DIMENSION MATURITY BREAKDOWN */}
            {activeTab === 'dimensions' && (
              <div className="space-y-4">
                {profile.dimensions.map((dim) => (
                  <div key={dim.key} className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          {getDimensionIcon(dim.key)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{dim.name}</h3>
                          <p className="text-xs text-slate-400">{dim.summary}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-black text-white">{dim.score}%</span>
                          <span className="text-[10px] text-slate-400 block font-medium">Weight: {(dim.weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-24 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                            style={{ width: `${dim.score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Evidence */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Info className="h-3 w-3 text-emerald-400" /> Evidence-Backed Metrics:
                        </span>
                        <ul className="space-y-1.5">
                          {dim.evidence.map((ev, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-indigo-400" /> Actionable Recommendations:
                        </span>
                        <ul className="space-y-1.5">
                          {dim.actionable_recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-indigo-200 flex items-start gap-2">
                              <ArrowRight className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: PROJECT RISKS & MITIGATIONS */}
            {activeTab === 'risks' && (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Automated Project Risk Radar</h3>
                    <p className="text-xs text-slate-400">
                      Evaluates technical hurdles, data scarcity, hardware calibration, and execution bottlenecks
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {profile.risks.length} Detected Risks
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.risks.map((risk) => (
                    <div key={risk.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {risk.category} Risk
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getSeverityBadge(risk.severity)}`}>
                            {risk.severity} SEVERITY
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{risk.title}</h4>
                        <p className="text-xs text-slate-300">{risk.description}</p>
                        <div className="text-[11px] text-slate-400">
                          <strong>Impact:</strong> {risk.impact}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 text-xs bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-200">
                        <strong className="text-indigo-300 block mb-0.5">Mitigation Action:</strong>
                        {risk.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: RESEARCH CLUSTERS & INNOVATION GAPS */}
            {activeTab === 'research' && (
              <div className="space-y-6">
                {/* 4 Research Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {profile.research_clusters.map((cluster, idx) => (
                    <div key={idx} className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Pillar: {cluster.pillar}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {cluster.resource_count} resources
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-white">{cluster.cluster_name}</h4>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Key SOTA Findings:
                        </span>
                        {cluster.key_findings.map((f, fi) => (
                          <div key={fi} className="text-xs text-slate-300 flex items-start gap-1.5">
                            <span className="text-indigo-400">•</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      {cluster.gap_identification && (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
                          <strong className="text-slate-300">Identified Research Gap:</strong> {cluster.gap_identification}
                        </div>
                      )}

                      {cluster.sample_resources.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Primary Literature Links:
                          </span>
                          <div className="space-y-1">
                            {cluster.sample_resources.map((s, si) => (
                              <a
                                key={si}
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between text-xs text-indigo-400 hover:text-indigo-300 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 transition-colors"
                              >
                                <span className="truncate">{s.title}</span>
                                <ExternalLink className="h-3 w-3 shrink-0 ml-1.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Innovation Gaps & Opportunities */}
                <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white">Strategic Innovation Gaps & Competitive Edge</h3>
                    <p className="text-xs text-slate-400">
                      Identifies where incumbent solutions fall short and how {profile.project_title} delivers distinct value
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.innovation_gaps.map((gap, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-purple-300 block">{gap.gap}</span>
                        <div className="text-xs text-slate-400">
                          <strong>Current Industry State:</strong> {gap.current_state}
                        </div>
                        <div className="text-xs text-emerald-300">
                          <strong>Your Strategic Advantage:</strong> {gap.your_advantage}
                        </div>
                        <div className="p-2 bg-indigo-950/30 rounded-lg text-xs text-indigo-200 mt-2 border border-indigo-500/20">
                          <strong>Recommended Action:</strong> {gap.recommended_action}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: HEALTH TIMELINE & TRAJECTORY */}
            {activeTab === 'timeline' && (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Historical Project Health Trajectory</h3>
                    <p className="text-xs text-slate-400">
                      Snapshots recorded during major development milestones & recalculations
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {profile.timeline_snapshots.length} Snapshots
                  </span>
                </div>

                <div className="space-y-3 relative pl-4 sm:pl-6 border-l-2 border-indigo-500/30 my-4">
                  {profile.timeline_snapshots.map((snap) => (
                    <div key={snap.id} className="relative group">
                      <div className="absolute -left-[23px] sm:-left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-indigo-600 border-2 border-slate-950" />
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            Health Score: {snap.health_score}/100 ({snap.health_status})
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(snap.created_at).toLocaleString()}
                          </span>
                        </div>
                        {snap.summary_verdict && (
                          <p className="text-xs text-slate-300">{snap.summary_verdict}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
