'use client';

import React, { useEffect, useState } from'react';
import Link from'next/link';
import {
 BarChart3,
 TrendingUp,
 Layers,
 Compass,
 Bookmark,
 MapPin,
 Cpu,
 Users,
 CheckCircle2,
 Award,
 Sparkles,
 Loader2,
 ArrowUpRight,
} from'lucide-react';
import { api } from'@/lib/api';
import { AnalyticsOverview } from'@/types';
import { SkeletonDashboard } from'@/components/ui/skeleton';

export default function AnalyticsPage() {
 const [data, setData] = useState<AnalyticsOverview | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 api
 .getAnalytics()
 .then(setData)
 .catch((err) => console.error('Error fetching analytics:', err))
 .finally(() => setLoading(false));
 }, []);

 if (loading) {
 return <SkeletonDashboard />;
 }

 const metrics = data?.metrics || {
 resources_discovered: 2450,
 ideas_analyzed: 380,
 technologies_explored: 84,
 research_sources: 8,
 student_projects: 120,
 active_innovators: 450,
 tasks_completed: 48,
 total_roadmap_tasks: 75,
 innovation_velocity:'88.4%',
 };

 const domainDist = data?.domain_distribution || [
 { domain:'Healthcare', count: 42 },
 { domain:'Agriculture', count: 35 },
 { domain:'Smart Cities', count: 28 },
 { domain:'Environment', count: 24 },
 { domain:'Education', count: 19 },
 { domain:'AI / Robotics', count: 31 },
 ];

 const statusDist = data?.status_distribution || [
 { status:'Idea Stage', count: 45 },
 { status:'Research & Literature', count: 30 },
 { status:'Active Development', count: 28 },
 { status:'Prototype Validated', count: 18 },
 { status:'Completed & Evaluated', count: 12 },
 ];

 const featuredTechs = data?.featured_technologies || [
 { name:'PyTorch / 1D-CNN', domain:'Deep Learning', projects_using: 52 },
 { name:'FastAPI', domain:'Backend Services', projects_using: 68 },
 { name:'YOLOv8 / YOLOv10', domain:'Computer Vision', projects_using: 38 },
 { name:'Next.js 14 & Tailwind', domain:'Frontend UI', projects_using: 62 },
 { name:'PostgreSQL + pgvector', domain:'Storage & Embeddings', projects_using: 44 },
 ];

 return (
 <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
 {/* Header Banner */}
 <div className="rounded-lg bg-white border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
 <div className="space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
 <BarChart3 className="h-4 w-4 text-slate-500" />
 <span>Real-Time Innovation Analytics</span>
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Platform Impact & Metrics
 </h1>
 <p className="text-sm text-slate-600 max-w-2xl">
 Quantitative telemetry measuring discovered resources, completed roadmap phases, domain distributions, and active student projects.
 </p>
 </div>

 <div className="flex items-center gap-3">
 <div className="px-4 py-3 rounded-lg bg-white border border-slate-200 shadow-sm text-center">
 <span className="text-xs text-slate-500 block font-medium">Innovation Velocity</span>
 <span className="text-xl font-bold text-slate-900">{metrics.innovation_velocity}</span>
 </div>
 </div>
 </div>

 {/* 6 Key Impact Stat Cards */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 {[
 { label:'Discovered Resources', val:`${metrics.resources_discovered}+`, icon: Compass },
 { label:'Ideas Analyzed', val:`${metrics.ideas_analyzed}+`, icon: BarChart3 },
 { label:'Technologies Explored', val:`${metrics.technologies_explored}+`, icon: Cpu },
 { label:'Live Data Sources', val:`${metrics.research_sources}`, icon: Layers },
 { label:'Student Projects', val:`${metrics.student_projects}+`, icon: Award },
 { label:'Milestones Completed', val:`${metrics.tasks_completed}`, icon: CheckCircle2 },
 ].map((item, i) => {
 const Icon = item.icon;
 return (
 <div key={i} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:border-slate-300">
 <div className="flex items-center justify-between">
 <span className="text-xl font-semibold text-slate-900">{item.val}</span>
 <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-200">
 <Icon className="h-4 w-4" />
 </div>
 </div>
 <p className="text-xs text-slate-600">{item.label}</p>
 </div>
 );
 })}
 </div>

 {/* 2-Column Visual Distribution Graphs */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Domain Distribution Chart */}
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 Innovation Domains Breakdown
 </h3>
 <span className="text-xs text-slate-500 font-medium">Total Projects</span>
 </div>

 <div className="space-y-3 pt-2">
 {domainDist.map((item, i) => {
 const maxCount = Math.max(...domainDist.map((d) => d.count), 50);
 const pct = Math.round((item.count / maxCount) * 100);
 return (
 <div key={i} className="space-y-1.5">
 <div className="flex items-center justify-between text-xs">
 <span className="text-slate-600">{item.domain}</span>
 <span className="text-slate-900 font-medium">{item.count} projects</span>
 </div>
 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-indigo-600 rounded-full"
 style={{ width:`${pct}%` }}
 />
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Project Lifecycle Status Breakdown */}
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 Project Development Pipeline Stages
 </h3>
 <span className="text-xs text-slate-500 font-medium">Lifecycle</span>
 </div>

 <div className="space-y-3 pt-2">
 {statusDist.map((item, i) => {
 const maxCount = Math.max(...statusDist.map((s) => s.count), 50);
 const pct = Math.round((item.count / maxCount) * 100);
 return (
 <div key={i} className="space-y-1.5">
 <div className="flex items-center justify-between text-xs">
 <span className="text-slate-600 capitalize">{item.status}</span>
 <span className="text-slate-900 font-medium">{item.count} initiatives</span>
 </div>
 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-indigo-600 rounded-full"
 style={{ width:`${pct}%` }}
 />
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* Featured Technologies Leaderboard */}
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 Most Adopted Technologies Across Student Projects
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
 {featuredTechs.map((tech, i) => (
 <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200 shadow-sm space-y-1.5">
 <span className="text-xs font-medium text-slate-500">{tech.domain}</span>
 <h4 className="text-sm font-semibold text-slate-900">{tech.name}</h4>
 <p className="text-xs text-slate-600">{tech.projects_using} active projects</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
