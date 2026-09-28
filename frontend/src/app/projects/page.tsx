'use client';

import React, { useState, useMemo } from'react';
import Link from'next/link';
import {
 Layers,
 PlusCircle,
 Search,
 ArrowRight,
 Trash2,
 X,
 Plus,
 FolderKanban,
 Activity,
 CheckCircle2,
 Clock,
 Compass,
 SlidersHorizontal,
 MapPin,
 TrendingUp,
} from'lucide-react';
import { api } from'@/lib/api';
import { useProject } from'@/lib/project-context';
import { getDomainColor } from'@/lib/utils';
import { EmptyState } from'@/components/ui/empty-state';

export default function ProjectsManagementPage() {
 const { projects, refreshProjects, setActiveProjectId } = useProject();
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedDomain, setSelectedDomain] = useState('all');
 const [selectedStatus, setSelectedStatus] = useState('all');
 const [sortBy, setSortBy] = useState<'progress_desc' |'progress_asc' |'title' |'recent'>('recent');
 const [showCreateModal, setShowCreateModal] = useState(false);

 const [newProject, setNewProject] = useState({
 title:'',
 domain:'Healthcare',
 problem_statement:'',
 proposed_solution:'',
 technologies:'Python, FastAPI, React',
 status:'idea',
 });

 const domains = [
'all',
'Healthcare',
'Agriculture',
'Artificial Intelligence',
'Environment & Sustainability',
'Smart Cities & Urban Mobility',
'Education & Skill Recommendation',
'Cybersecurity & Privacy',
'Robotics & Automation',
'Internet of Things (IoT)',
'FinTech & Blockchain',
 ];

 const statuses = ['all','idea','research','planning','prototype','development','testing','completed'];

 // Calculated Real Project Metrics
 const metrics = useMemo(() => {
 const total = projects.length;
 const active = projects.filter((p) => p.status?.toLowerCase() !=='completed').length;
 const completed = projects.filter((p) => p.status?.toLowerCase() ==='completed').length;
 const avgProgress = total > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;
 return { total, active, completed, avgProgress };
 }, [projects]);

 const filteredProjects = useMemo(() => {
 return projects
 .filter((p) => {
 const matchesSearch =
 p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
 p.problem_statement.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesDomain = selectedDomain ==='all' || p.domain.toLowerCase().includes(selectedDomain.toLowerCase());
 const matchesStatus = selectedStatus ==='all' || p.status.toLowerCase() === selectedStatus.toLowerCase();
 return matchesSearch && matchesDomain && matchesStatus;
 })
 .sort((a, b) => {
 if (sortBy ==='progress_desc') return (b.progress || 0) - (a.progress || 0);
 if (sortBy ==='progress_asc') return (a.progress || 0) - (b.progress || 0);
 if (sortBy ==='title') return a.title.localeCompare(b.title);
 return b.id - a.id;
 });
 }, [projects, searchTerm, selectedDomain, selectedStatus, sortBy]);

 const getStatusBadgeStyle = (status: string) => {
 const s = (status ||'').toLowerCase();
 switch (s) {
 case'completed':
 return'bg-emerald-50 text-emerald-700 border-emerald-200';
 case'development':
 case'prototype':
 return'bg-indigo-50 text-indigo-700 border-indigo-200';
 case'research':
 case'planning':
 return'bg-cyan-50 text-cyan-700 border-cyan-200';
 case'testing':
 return'bg-purple-50 text-purple-700 border-purple-200';
 default:
 return'bg-slate-100 text-slate-700 border-slate-200';
 }
 };

 const handleCreateProject = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newProject.title.trim()) return;
 try {
 await api.createProject({
 title: newProject.title,
 domain: newProject.domain,
 problem_statement: newProject.problem_statement,
 proposed_solution: newProject.proposed_solution,
 technologies: newProject.technologies.split(',').map((s) => s.trim()).filter(Boolean),
 status: newProject.status,
 progress: 15,
 tags: [newProject.domain],
 });
 setShowCreateModal(false);
 setNewProject({
 title:'',
 domain:'Healthcare',
 problem_statement:'',
 proposed_solution:'',
 technologies:'Python, FastAPI, React',
 status:'idea',
 });
 await refreshProjects();
 } catch (err) {
 console.error('Error creating project:', err);
 }
 };

 const handleDeleteProject = async (projectId: number) => {
 if (confirm('Are you sure you want to delete this innovation project?')) {
 try {
 await api.deleteProject(projectId);
 await refreshProjects();
 } catch (err) {
 console.error('Error deleting project:', err);
 }
 }
 };

 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 {/* 1. Hero Section */}
 <div className="rounded-lg bg-white border border-slate-200 p-5 shadow-sm relative overflow-hidden">
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
 <div className="space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700">
 <span>Multi-Project Innovation Portfolio</span>
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 My Innovation Projects
 </h1>
 <p className="text-sm text-slate-600 max-w-2xl">
 Turn ideas into validated technology solutions. Track multi-phase engineering milestones, empirical experiments, and AI intelligence diagnostics across all projects.
 </p>

 {/* Metric Chips inside Hero */}
 <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
 <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
 {metrics.total} Projects
 </span>
 <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-700 font-medium">
 {metrics.active} Active
 </span>
 <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-emerald-700 font-medium">
 {metrics.completed} Validated
 </span>
 <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
 {metrics.avgProgress}% Avg. Velocity
 </span>
 </div>
 </div>

 <div className="flex items-center gap-3 shrink-0">
 <button
 onClick={() => setShowCreateModal(true)}
 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
 >
 <PlusCircle className="h-4 w-4" />
 <span>Create New Project</span>
 </button>
 </div>
 </div>
 </div>

 {/* 2. Real-Data Summary KPI Cards Row */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div className="rounded-lg p-4 bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300">
 <div className="space-y-0.5">
 <span className="text-xs font-medium text-slate-500">Total Projects</span>
 <p className="text-xl font-semibold text-slate-900">{metrics.total}</p>
 <span className="text-xs text-slate-400">Initiated Cohorts</span>
 </div>
 <div className="h-10 w-10 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
 <FolderKanban className="h-5 w-5" />
 </div>
 </div>

 <div className="rounded-lg p-4 bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300">
 <div className="space-y-0.5">
 <span className="text-xs font-medium text-slate-500">Active Sprints</span>
 <p className="text-xl font-semibold text-indigo-600">{metrics.active}</p>
 <span className="text-xs text-slate-400">In Development</span>
 </div>
 <div className="h-10 w-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
 <Activity className="h-5 w-5" />
 </div>
 </div>

 <div className="rounded-lg p-4 bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300">
 <div className="space-y-0.5">
 <span className="text-xs font-medium text-slate-500">Completed / Validated</span>
 <p className="text-xl font-semibold text-emerald-600">{metrics.completed}</p>
 <span className="text-xs text-slate-400">Defense Ready</span>
 </div>
 <div className="h-10 w-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
 <CheckCircle2 className="h-5 w-5" />
 </div>
 </div>

 <div className="rounded-lg p-4 bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300">
 <div className="space-y-0.5">
 <span className="text-xs font-medium text-slate-500">Mean Velocity</span>
 <p className="text-xl font-semibold text-slate-900">{metrics.avgProgress}%</p>
 <span className="text-xs text-slate-400">Milestone Lifecycle</span>
 </div>
 <div className="h-10 w-10 rounded-md bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
 <TrendingUp className="h-5 w-5" />
 </div>
 </div>
 </div>

 {/* 3. Search & Filters Control Bar */}
 <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
 <div className="w-full md:w-80 relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Search projects by title, domain, or problem..."
 className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>

 <div className="flex flex-wrap items-center gap-2 text-sm">
 <div className="flex items-center gap-1.5">
 <span className="text-slate-500 font-medium">Domain:</span>
 <select
 value={selectedDomain}
 onChange={(e) => setSelectedDomain(e.target.value)}
 className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 >
 {domains.map((d) => (
 <option key={d} value={d}>
 {d ==='all' ?'All Domains' : d}
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-1.5">
 <span className="text-slate-500 font-medium">Stage:</span>
 <select
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value)}
 className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 capitalize"
 >
 {statuses.map((s) => (
 <option key={s} value={s}>
 {s ==='all' ?'All Stages' : s}
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-1.5">
 <span className="text-slate-500 font-medium">Sort:</span>
 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value as any)}
 className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 >
 <option value="recent">Recent First</option>
 <option value="progress_desc">Velocity: High to Low</option>
 <option value="progress_asc">Velocity: Low to High</option>
 <option value="title">Title (A-Z)</option>
 </select>
 </div>
 </div>
 </div>

 {/* 4. Projects Grid */}
 {filteredProjects.length === 0 ? (
 <EmptyState
 icon={Layers}
 title="No Innovation Projects Found"
 description={
 projects.length === 0
 ?"You haven't initiated any student innovation projects yet. Start by creating a project or submitting an idea."
 :"No projects match your current search query and filter criteria."
 }
 actionLabel={projects.length === 0 ?"Submit New Idea" :"Reset Filters"}
 actionHref={projects.length === 0 ?"/submit-idea" : undefined}
 onAction={
 projects.length > 0
 ? () => {
 setSearchTerm('');
 setSelectedDomain('all');
 setSelectedStatus('all');
 setSortBy('recent');
 }
 : undefined
 }
 />
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredProjects.map((p) => {
 const domainColor = getDomainColor(p.domain);
 const statusBadgeClass = getStatusBadgeStyle(p.status);
 return (
 <div
 key={p.id}
 className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4"
 >
 <div className="space-y-3">
 {/* Top Badges */}
 <div className="flex items-center justify-between gap-2">
 <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
 {p.domain}
 </span>
 <span className={`px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${statusBadgeClass}`}>
 <span className="inline-block h-1.5 w-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
 {p.status}
 </span>
 </div>

 {/* Project Title */}
 <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1">
 {p.title}
 </h3>

 {/* Problem Statement / Description */}
 <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
 {p.problem_statement || p.proposed_solution ||'Empirical research and innovation initiative.'}
 </p>

 {/* Modern Technology Chips */}
 {p.technologies && p.technologies.length > 0 && (
 <div className="flex flex-wrap gap-1.5 pt-1">
 {p.technologies.slice(0, 3).map((tech, i) => (
 <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200">
 {tech}
 </span>
 ))}
 {p.technologies.length > 3 && (
 <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs font-medium">
 +{p.technologies.length - 3}
 </span>
 )}
 </div>
 )}
 </div>

 {/* Progress Bar & Actions */}
 <div className="space-y-3 pt-3 border-t border-slate-100">
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-xs">
 <span className="text-slate-500">Roadmap Progress</span>
 <span className="font-semibold text-slate-700">{p.progress || 0}% Complete</span>
 </div>
 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-indigo-600 rounded-full"
 style={{ width:`${Math.min(100, Math.max(0, p.progress || 0))}%` }}
 />
 </div>
 </div>

 <div className="flex items-center justify-between pt-1">
 <button
 onClick={() => handleDeleteProject(p.id)}
 className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
 title="Delete project"
 >
 <Trash2 className="h-4 w-4" />
 </button>

 <div className="flex items-center gap-2">
 <Link
 href={`/roadmap/${p.id}`}
 className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium transition-colors"
 >
 Roadmap
 </Link>
 <Link
 href={`/projects/${p.id}`}
 onClick={() => setActiveProjectId(p.id)}
 className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
 >
 <span>Workspace</span>
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* 5. Create Project Modal */}
 {showCreateModal && (
 <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-xl w-full space-y-5">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
 <PlusCircle className="h-5 w-5 text-indigo-600" />
 <span>Create New Innovation Project</span>
 </h3>
 <button
 onClick={() => setShowCreateModal(false)}
 className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 <form onSubmit={handleCreateProject} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-slate-900 mb-1">
 Project Title *
 </label>
 <input
 type="text"
 required
 value={newProject.title}
 onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
 placeholder="e.g., IoT Solar Irrigation & Moisture Telemetry"
 className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-semibold text-slate-900 mb-1">
 Domain *
 </label>
 <select
 value={newProject.domain}
 onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
 className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 >
 {domains.filter((d) => d !=='all').map((d) => (
 <option key={d} value={d}>
 {d}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-sm font-semibold text-slate-900 mb-1">
 Initial Stage
 </label>
 <select
 value={newProject.status}
 onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
 className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 capitalize"
 >
 {statuses.filter((s) => s !=='all').map((s) => (
 <option key={s} value={s}>
 {s}
 </option>
 ))}
 </select>
 </div>
 </div>

 <div>
 <label className="block text-sm font-semibold text-slate-900 mb-1">
 Problem Statement
 </label>
 <textarea
 rows={2}
 value={newProject.problem_statement}
 onChange={(e) => setNewProject({ ...newProject, problem_statement: e.target.value })}
 placeholder="What core scientific or practical problem are you trying to solve?"
 className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-slate-900 mb-1">
 Proposed Solution
 </label>
 <textarea
 rows={2}
 value={newProject.proposed_solution}
 onChange={(e) => setNewProject({ ...newProject, proposed_solution: e.target.value })}
 placeholder="Describe your technical methodology, hardware, or algorithmic approach."
 className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-slate-900 mb-1">
 Technologies (comma-separated)
 </label>
 <input
 type="text"
 value={newProject.technologies}
 onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
 placeholder="Python, ESP32, PyTorch, LoRaWAN, Next.js"
 className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>

 <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
 <button
 type="button"
 onClick={() => setShowCreateModal(false)}
 className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
 >
 <Plus className="h-4 w-4" />
 <span>Create Project</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
