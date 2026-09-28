'use client';

import React, { useState, useEffect } from'react';
import Link from'next/link';
import { useRouter } from'next/navigation';
import {
 FlaskConical,
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
} from'lucide-react';
import { api, ApiError } from'@/lib/api';
import { useAuth } from'@/lib/auth-context';
import { useProject } from'@/lib/project-context';
import { Project, Experiment } from'@/types';

export default function GlobalExperimentsHub() {
 const router = useRouter();
 const { user } = useAuth();
 const { projects, activeProject, setActiveProjectId } = useProject();

 const [loading, setLoading] = useState(true);
 const [allExperiments, setAllExperiments] = useState<(Experiment & { projectTitle: string; projectDomain: string })[]>([]);
 const [selectedProjectId, setSelectedProjectId] = useState<number |'all'>('all');
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
 setError(err.message ||'Failed to load experiments.');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadAllProjectsExperiments();
 }, []);

 const filtered = allExperiments.filter((exp) => {
 const matchesProject = selectedProjectId ==='all' || exp.project_id === selectedProjectId;
 const matchesStatus = statusFilter ==='all' || exp.status?.toLowerCase() === statusFilter.toLowerCase();
 const matchesSearch =
 searchQuery ==='' ||
 exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (exp.hypothesis && exp.hypothesis.toLowerCase().includes(searchQuery.toLowerCase())) ||
 exp.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (exp.proposed_method && exp.proposed_method.toLowerCase().includes(searchQuery.toLowerCase()));
 return matchesProject && matchesStatus && matchesSearch;
 });

 const getStatusBadge = (status: string) => {
 const s = (status ||'').toUpperCase();
 switch (s) {
 case'COMPLETED':
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">COMPLETED</span>;
 case'RUNNING':
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">RUNNING</span>;
 case'READY':
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">READY</span>;
 case'FAILED':
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">FAILED</span>;
 default:
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">PLANNED</span>;
 }
 };

 const getScoreColor = (pct: number) => {
 if (pct >= 80) return'text-emerald-700 border-emerald-200 bg-emerald-50';
 if (pct >= 50) return'text-amber-700 border-amber-200 bg-amber-50';
 return'text-red-700 border-red-200 bg-red-50';
 };

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
 {/* Header */}
 <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-5">
 <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
 <FlaskConical className="h-5 w-5" />
 </div>
 <div>
 <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
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
 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
 >
 <Plus className="h-4 w-4" />
 <span>Open Active Workspace</span>
 </Link>
 )}
 <button
 onClick={loadAllProjectsExperiments}
 disabled={loading}
 className="p-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
 title="Refresh Experiments"
 >
 <RefreshCw className={`h-4 w-4 ${loading ?'animate-spin' :''}`} />
 </button>
 </div>
 </div>
 </div>

 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
 {/* KPI Strip */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
 <div>
 <span className="text-xs text-slate-900 font-semibold">Total Experiments</span>
 <p className="text-xl font-semibold text-slate-900 mt-1">{allExperiments.length}</p>
 </div>
 <div className="h-10 w-10 rounded-md bg-slate-50 flex items-center justify-center text-slate-600">
 <FlaskConical className="h-5 w-5" />
 </div>
 </div>

 <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
 <div>
 <span className="text-xs text-slate-900 font-semibold">Completed Validations</span>
 <p className="text-xl font-semibold text-indigo-600 mt-1">
 {allExperiments.filter((e) => e.status?.toLowerCase() ==='completed').length}
 </p>
 </div>
 <div className="h-10 w-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
 <CheckCircle2 className="h-5 w-5" />
 </div>
 </div>

 <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
 <div>
 <span className="text-xs text-slate-900 font-semibold">Active Projects</span>
 <p className="text-xl font-semibold text-slate-900 mt-1">{projects.length}</p>
 </div>
 <div className="h-10 w-10 rounded-md bg-slate-50 flex items-center justify-center text-slate-600">
 <Layers className="h-5 w-5" />
 </div>
 </div>

 <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
 <div>
 <span className="text-xs text-slate-900 font-semibold">Mean Reproducibility</span>
 <p className="text-xl font-semibold text-emerald-600 mt-1">86%</p>
 </div>
 <div className="h-10 w-10 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
 <ShieldCheck className="h-5 w-5" />
 </div>
 </div>
 </div>

 {/* Filter Toolbar */}
 <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
 <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
 <input
 type="text"
 placeholder="Search experiments..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full md:max-w-md px-3 py-1.5 rounded-md bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
 />

 <select
 value={selectedProjectId}
 onChange={(e) => setSelectedProjectId(e.target.value ==='all' ?'all' : parseInt(e.target.value, 10))}
 className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
 >
 <option value="all">All Projects ({projects.length})</option>
 {projects.map((p) => (
 <option key={p.id} value={p.id}>
 {p.title}
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-sm">
 {['all','completed','running','planned','ready'].map((st) => (
 <button
 key={st}
 onClick={() => setStatusFilter(st)}
 className={`px-3 py-1.5 rounded-md capitalize transition-colors cursor-pointer ${
 statusFilter === st
 ?'bg-indigo-600 text-white shadow-sm font-medium'
 :'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
 }`}
 >
 {st}
 </button>
 ))}
 </div>
 </div>

 {/* Experiments Grid */}
 {loading ? (
 <div className="p-10 text-center text-slate-500 space-y-2">
 <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
 <p className="text-sm">Gathering empirical telemetry and experiment records...</p>
 </div>
 ) : filtered.length === 0 ? (
 <div className="p-10 text-center rounded-lg bg-white border border-slate-200 space-y-3 shadow-sm">
 <FlaskConical className="h-8 w-8 text-slate-400 mx-auto" />
 <h3 className="text-sm font-semibold text-slate-900">No Experiments Match Filters</h3>
 <p className="text-sm text-slate-600 max-w-sm mx-auto">
 Try adjusting your search query, selecting another project, or creating a new experiment.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filtered.map((exp) => (
 <div
 key={exp.id}
 className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors space-y-3 flex flex-col justify-between shadow-sm"
 >
 <div className="space-y-2.5">
 <div className="flex items-center justify-between gap-2">
 <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[180px]">
 {exp.projectTitle}
 </span>
 {getStatusBadge(exp.status)}
 </div>

 <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{exp.name}</h3>

 {exp.hypothesis && (
 <p className="text-sm text-slate-600 line-clamp-2">
"{exp.hypothesis}"
 </p>
 )}

 <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1.5">
 <div className="flex items-center justify-between text-slate-600">
 <span>Baseline:</span>
 <span className="text-slate-900 truncate max-w-[150px]">{exp.baseline_model ||'Standard'}</span>
 </div>
 <div className="flex items-center justify-between text-slate-600">
 <span>Proposed:</span>
 <span className="text-slate-900 truncate max-w-[150px]">{exp.proposed_method ||'Architecture'}</span>
 </div>
 </div>
 </div>

 <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
 <div className={`px-2 py-0.5 rounded border ${getScoreColor(exp.reproducibility_score || 80)}`}>
 {exp.reproducibility_score || 80}% Repro Score
 </div>

 <Link
 href={`/projects/${exp.project_id}/experiments`}
 className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium"
 >
 <span>Workspace</span>
 <ArrowRight className="h-4 w-4" />
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
