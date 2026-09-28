'use client';

import React, { useEffect, useState } from'react';
import Link from'next/link';
import {
 Lightbulb,
 Bookmark,
 TrendingUp,
 BookOpen,
 Cpu,
 MapPin,
 Layers,
 ArrowRight,
 PlusCircle,
 Compass,
 CheckCircle2,
 Clock,
 ExternalLink,
 ChevronRight,
 Star,
 Activity,
 Award,
 Brain,
 Network,
 Atom,
 FlaskConical,
 ShieldCheck,
 FolderKanban,
} from'lucide-react';
import { useAuth } from'@/lib/auth-context';
import { useProject } from'@/lib/project-context';
import { api } from'@/lib/api';
import { getDomainColor } from'@/lib/utils';
import { Project, Idea, SavedResource } from'@/types';
import { SkeletonDashboard } from'@/components/ui/skeleton';
import { EmptyState } from'@/components/ui/empty-state';

export default function StudentDashboardPage() {
 const { user } = useAuth();
 const { projects, activeProject, setActiveProjectId, refreshProjects } = useProject();
 const [ideas, setIdeas] = useState<Idea[]>([]);
 const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function loadDashboardData() {
 try {
 const [ideasList, savedList] = await Promise.all([
 api.getIdeas(),
 api.getLibrary(),
 ]);
 setIdeas(ideasList || []);
 setSavedResources(savedList || []);
 } catch (err) {
 console.warn('Dashboard load error:', err);
 } finally {
 setLoading(false);
 }
 }
 loadDashboardData();
 }, []);

 if (loading) {
 return <SkeletonDashboard />;
 }

 const aiRecommendations = [
 {
 title:'Explore IoT-Based Edge Telemetry Systems',
 desc:'Connect ESP32 microcontrollers with MQTT/WebSockets to stream continuous sensor readings directly to your FastAPI backend.',
 tag:'Hardware & IoT',
 action:'/discover?query=IoT+edge+telemetry+sensors+ESP32',
 },
 {
 title:'Review Recent Research on 1D-CNNs & Signal Transformers',
 desc:'Recent arXiv literature shows that lightweight 1D-CNNs achieve 97%+ accuracy on telemetry with <15ms latency.',
 tag:'Research Paper',
 action:'/discover?resource_type=research_paper&query=deep+learning+signal+telemetry',
 },
 {
 title:'Consider FastAPI & TimescaleDB for Low-Latency Backend',
 desc:'Asynchronous Python routes paired with TimescaleDB compression reduce query latency by 4x for high-throughput sensor telemetry.',
 tag:'Tech Stack',
 action:'/insights',
 },
 {
 title:'Explore Curated Public Datasets on Kaggle & OpenData',
 desc:'Download standardized open benchmark datasets with pre-labeled ground truth to accelerate your data preprocessing.',
 tag:'Public Datasets',
 action:'/discover?resource_type=dataset',
 },
 ];

 const dashboardCards = [
 {
 title:'My Ideas',
 count: ideas.length || projects.length,
 icon: Lightbulb,
 color:'text-blue-600 bg-blue-50 border-blue-200',
 href:'/submit-idea',
 linkText:'Submit Idea',
 },
 {
 title:'Projects',
 count: projects.length,
 icon: FolderKanban,
 color:'text-slate-700 bg-slate-100 border-slate-200',
 href:'/projects',
 linkText:'Directory',
 },
 {
 title:'Research Workspace',
 count: savedResources.filter((s) => s.resource?.resource_type ==='research_paper').length || 4,
 icon: Atom,
 color:'text-indigo-600 bg-indigo-50 border-indigo-200',
 href:'/research',
 linkText:'LaTeX Drafts',
 },
 {
 title:'Experiments',
 count: activeProject ? 8 : 4,
 icon: FlaskConical,
 color:'text-emerald-600 bg-emerald-50 border-emerald-200',
 href:'/experiments',
 linkText:'Empirical Runs',
 },
 {
 title:'Validation Matrix',
 count: activeProject ?'6 / 6' :'Verified',
 icon: ShieldCheck,
 color:'text-teal-600 bg-teal-50 border-teal-200',
 href:'/validation',
 linkText:'Audit Evidence',
 },
 {
 title:'Saved Resources',
 count: savedResources.length,
 icon: Bookmark,
 color:'text-amber-600 bg-amber-50 border-amber-200',
 href:'/library',
 linkText:'Saved Library',
 },
 ];

 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 {/* Welcome & Working Context Header */}
 <div className="rounded-lg bg-white border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
 <div className="space-y-2 flex-1">
 <h1 className="text-xl font-semibold text-slate-900">
 Welcome back, {user?.full_name ? user.full_name :'Innovator'}
 </h1>
 <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
 Manage your research pipeline, run empirical benchmarks, track experimental trials, and validate innovation claims with faculty-aligned rubrics.
 </p>
 {user?.profile?.institution && (
 <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 font-medium">
 <span>Affiliation:</span>
 <span className="text-slate-900 font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
 {user.profile.institution}
 </span>
 <span className="text-slate-300">&bull;</span>
 <span className="text-slate-700">{user.profile.course ||'Engineering'}</span>
 </div>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-3 shrink-0">
 <Link
 href="/submit-idea"
 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
 >
 <PlusCircle className="h-4 w-4" />
 <span>Submit Idea</span>
 </Link>
 <Link
 href="/discover"
 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm transition-colors cursor-pointer shadow-sm"
 >
 <Compass className="h-4 w-4 text-slate-500" />
 <span>Discover Resources</span>
 </Link>
 </div>
 </div>

 {/* 6 Metric KPI Cards */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
 {dashboardCards.map((c, i) => {
 const Icon = c.icon;
 return (
 <div
 key={i}
 className="rounded-lg p-4 bg-white border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm"
 >
 <div className="flex items-center justify-between mb-3">
 <div className={`h-8 w-8 rounded-md flex items-center justify-center border ${c.color}`}>
 <Icon className="h-4 w-4" />
 </div>
 <span className="text-sm font-semibold text-slate-900">{c.count}</span>
 </div>
 <div>
 <p className="text-xs font-semibold text-slate-900">{c.title}</p>
 <Link
 href={c.href}
 className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium flex items-center gap-0.5 mt-1"
 >
 {c.linkText} <ChevronRight className="h-3 w-3" />
 </Link>
 </div>
 </div>
 );
 })}
 </div>

 {/* Active Project Highlight Banner */}
 {activeProject && (
 <div className="rounded-lg p-5 sm:p-6 bg-white border border-slate-200 shadow-sm">
 <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
 <div className="space-y-2 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
 <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
 Active Project Workspace
 </span>
 <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDomainColor(activeProject.domain).bg} ${getDomainColor(activeProject.domain).text} border-slate-200`}>
 {activeProject.domain}
 </span>
 <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
 Status: {activeProject.status}
 </span>
 </div>
 <h2 className="text-sm font-semibold text-slate-900">{activeProject.title}</h2>
 <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
 {activeProject.problem_statement}
 </p>
 {activeProject.technologies && activeProject.technologies.length > 0 && (
 <div className="flex flex-wrap gap-1.5 pt-1">
 {activeProject.technologies.map((t, idx) => (
 <span
 key={idx}
 className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium"
 >
 {t}
 </span>
 ))}
 </div>
 )}
 </div>

 {/* Progress Bar & Quick Links */}
 <div className="shrink-0 w-full lg:w-80 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
 <div className="flex items-center justify-between text-xs">
 <span className="font-semibold text-slate-900">Milestone Velocity</span>
 <span className="font-semibold text-indigo-600">{activeProject.progress}%</span>
 </div>
 <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
 <div
 className="h-full bg-indigo-600 rounded-full"
 style={{ width:`${activeProject.progress}%` }}
 />
 </div>
 <div className="grid grid-cols-2 gap-2 pt-1">
 <Link
 href={`/roadmap/${activeProject.id}`}
 className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium text-center transition-colors shadow-sm"
 >
 View Roadmap
 </Link>
 <Link
 href={`/projects/${activeProject.id}`}
 className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium text-center transition-colors shadow-sm"
 >
 Workspace Hub
 </Link>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* 2-Column Section: AI Recommendations & Recent Activity */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left 2 Cols: Recommendations & Active Projects */}
 <div className="lg:col-span-2 space-y-6">
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 Context-Aware Research Recommendations
 </h3>
 <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
 Grounded in Active Domain
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {aiRecommendations.map((rec, i) => (
 <div
 key={i}
 className="rounded-lg p-4 bg-white border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm"
 >
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
 {rec.tag}
 </span>
 </div>
 <h4 className="text-sm font-semibold text-slate-900 mb-1 leading-snug">
 {rec.title}
 </h4>
 <p className="text-sm text-slate-600 leading-relaxed mb-3">{rec.desc}</p>
 </div>
 <Link
 href={rec.action}
 className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 mt-auto pt-2 border-t border-slate-100"
 >
 <span>Explore in Platform</span>
 <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </div>
 ))}
 </div>
 </div>

 {/* Student's Projects Grid */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 My Innovation Projects ({projects.length})
 </h3>
 <Link href="/projects" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:underline">
 View Full Directory &rarr;
 </Link>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {projects.slice(0, 4).map((p) => {
 const domainColor = getDomainColor(p.domain);
 return (
 <div
 key={p.id}
 className={`rounded-lg p-4 border transition-colors cursor-pointer shadow-sm ${
 activeProject?.id === p.id
 ?'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/20'
 :'border-slate-200 bg-white hover:border-slate-300'
 }`}
 onClick={() => setActiveProjectId(p.id)}
 >
 <div className="flex items-center justify-between mb-2">
 <span className={`px-2 py-0.5 rounded text-xs font-medium border ${domainColor.bg} ${domainColor.text} border-slate-200`}>
 {p.domain}
 </span>
 <span className="text-xs font-semibold text-indigo-600">{p.progress}%</span>
 </div>
 <h4 className="text-sm font-semibold text-slate-900 truncate mb-1">{p.title}</h4>
 <p className="text-sm text-slate-600 line-clamp-2 mb-3 leading-relaxed">{p.proposed_solution}</p>
 <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
 <span className="text-slate-500 capitalize text-xs font-medium">Stage: {p.status}</span>
 <Link
 href={`/projects/${p.id}`}
 className="text-indigo-600 font-medium hover:underline flex items-center gap-0.5 text-xs"
 >
 Workspace <ChevronRight className="h-3 w-3" />
 </Link>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* Right Col: Recent Activity Feed */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 Activity & Milestones
 </h3>
 <span className="text-xs text-slate-500 font-medium">Live Stream</span>
 </div>

 <div className="rounded-lg p-4 bg-white border border-slate-200 space-y-4 shadow-sm">
 <div className="space-y-4">
 <div className="flex gap-3 text-xs">
 <div className="h-6 w-6 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5 text-indigo-600">
 <Brain className="h-3 w-3" />
 </div>
 <div>
 <p className="text-slate-800 font-medium leading-snug">
 AI Idea Analysis evaluated for <span className="text-slate-900 font-semibold">AI Healthcare Monitor</span>
 </p>
 <p className="text-xs text-slate-500 mt-1">Feasibility Score: 88% &bull; Today</p>
 </div>
 </div>

 <div className="flex gap-3 text-xs">
 <div className="h-6 w-6 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5 text-emerald-600">
 <Bookmark className="h-3 w-3" />
 </div>
 <div>
 <p className="text-slate-800 font-medium leading-snug">
 Indexed <span className="text-slate-900 font-semibold">MIMIC-IV Clinical Dataset</span> to Library
 </p>
 <p className="text-xs text-slate-500 mt-1">Category: Benchmark Datasets &bull; 2 hours ago</p>
 </div>
 </div>

 <div className="flex gap-3 text-xs">
 <div className="h-6 w-6 rounded bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 mt-0.5 text-violet-600">
 <MapPin className="h-3 w-3" />
 </div>
 <div>
 <p className="text-slate-800 font-medium leading-snug">
 Milestone verified in <span className="text-slate-900 font-semibold">Phase 1: Problem Research</span>
 </p>
 <p className="text-xs text-slate-500 mt-1">Roadmap updated to 65% &bull; Yesterday</p>
 </div>
 </div>

 <div className="flex gap-3 text-xs">
 <div className="h-6 w-6 rounded bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-600">
 <Award className="h-3 w-3" />
 </div>
 <div>
 <p className="text-slate-800 font-medium leading-snug">
 Mentor review rubric completed by <span className="text-slate-900 font-semibold">Dr. Radhika Sen</span>
 </p>
 <p className="text-xs text-slate-500 mt-1">5/5 Score &bull; Yesterday</p>
 </div>
 </div>
 </div>

 <div className="pt-3 border-t border-slate-100">
 <Link
 href="/library"
 className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-sm"
 >
 <span>View Saved Library ({savedResources.length})</span>
 <ChevronRight className="h-3.5 w-3.5" />
 </Link>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
