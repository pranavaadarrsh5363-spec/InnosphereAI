'use client';

import React, { useState, useEffect } from 'react';
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
  Tag
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useProject } from '@/lib/project-context';
import { Project, Experiment } from '@/types';

export default function GlobalExperimentsHub() {
  const router = useRouter();
  const { user } = useAuth();
  const { projects, activeProject, setActiveProjectId } = useProject();

  const [loading, setLoading] = useState(true);
  const [allExperiments, setAllExperiments] = useState<(Experiment & { projectTitle: string; projectDomain: string })[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadAllProjectsExperiments = async () => {
    try {
      setLoading(true);
      setError(null);
      const projList = await api.getProjects();
      const expPromises = projList.map(async (p: Project) => {
        try {
          const exps = await api.getExperiments(p.id);
          return (exps || []).map((e: Experiment) => ({
            ...e,
            projectTitle: p.title,
            projectDomain: p.domain
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(expPromises);
      const flattened = results.flat();
      setAllExperiments(flattened);
    } catch (err: any) {
      console.error('Failed to load global experiments:', err);
      setError(err.message || 'Failed to load experiments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllProjectsExperiments();
  }, []);

  const filtered = allExperiments.filter((exp) => {
    const matchesProject = selectedProjectId === 'all' || exp.project_id === selectedProjectId;
    const matchesStatus = statusFilter === 'all' || exp.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.hypothesis && exp.hypothesis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exp.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.proposed_method && exp.proposed_method.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesProject && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">COMPLETED</span>;
      case 'RUNNING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">RUNNING</span>;
      case 'READY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">READY</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">PLANNED</span>;
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (pct >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/20';
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <FlaskConical className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Experimentation & Reproducibility Hub
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Global Empirical Trials • Multi-Run Reproducibility • Comparative Metric Baselines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeProject && (
              <Link
                href={`/projects/${activeProject.id}/experiments`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Open Active Workspace</span>
              </Link>
            )}
            <button
              onClick={loadAllProjectsExperiments}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Refresh Experiments"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Total Experiments</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{allExperiments.length}</p>
            </div>
            <FlaskConical className="h-6 w-6 text-blue-600" />
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Completed Validations</span>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">
                {allExperiments.filter((e) => e.status?.toLowerCase() === 'completed').length}
              </p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Active Projects</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{projects.length}</p>
            </div>
            <Layers className="h-6 w-6 text-slate-500" />
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Mean Reproducibility</span>
              <p className="text-xl font-bold text-blue-600 mt-0.5">86%</p>
            </div>
            <ShieldCheck className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search experiments, hypotheses, models, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:max-w-md px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />

            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
            {['all', 'completed', 'running', 'planned', 'ready'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Experiments Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
            <p className="text-xs">Gathering empirical telemetry and experiment records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 space-y-3">
            <FlaskConical className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Experiments Match Filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query, selecting another project, or creating a new experiment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800 font-bold">
                      {exp.projectTitle}
                    </span>
                    {getStatusBadge(exp.status)}
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1">{exp.name}</h3>

                  {exp.hypothesis && (
                    <p className="text-xs text-slate-400 italic line-clamp-2">
                      &quot;{exp.hypothesis}&quot;
                    </p>
                  )}

                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Baseline:</span>
                      <span className="text-slate-200 font-semibold truncate max-w-[150px]">{exp.baseline_model || 'Standard'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Proposed:</span>
                      <span className="text-indigo-300 font-semibold truncate max-w-[150px]">{exp.proposed_method || 'Architecture'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getScoreColor(exp.reproducibility_score || 80)}`}>
                    {exp.reproducibility_score || 80}% Repro Score
                  </div>

                  <Link
                    href={`/projects/${exp.project_id}/experiments`}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
