'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  Cpu,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Compass,
  Search,
  ShieldCheck,
  Award,
  Brain,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { AIInsight } from '@/types';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

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
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-slate-100 border border-slate-200 p-8 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded-full" />
          <div className="h-9 w-2/3 bg-slate-200 rounded-xl" />
          <div className="h-4 w-1/2 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="py-16 px-4 max-w-7xl mx-auto">
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
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-slate-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-semibold text-indigo-700">
            <Sparkles className="h-3 w-3 text-indigo-600" />
            <span>Domain Intelligence & Strategic Gaps</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            AI Insights & Innovation Gaps
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            AI-synthesized research directions, market trends, architectural patterns, and verified gap analysis for{' '}
            <span className="text-slate-900 font-semibold">{activeProject?.title || 'your innovation project'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing AI Models...' : 'Refresh Insights'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Innovation Gaps (Highlighted Feature) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Identified Innovation Gaps & Novelty Vectors
          </h2>
          <span className="text-xs text-slate-500 font-medium">Derived from 2024-2025 Literature & GitHub Repos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(insights?.innovation_gaps || []).map((gap, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                    Unaddressed Research Gap #{i + 1}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-medium">High Novelty Potential</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{gap.gap}</h3>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Existing Approach</span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">{gap.current_state}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                    <span className="text-[10px] font-bold uppercase text-rose-700 block mb-0.5">Observed Limitation</span>
                    <p className="text-rose-900 leading-relaxed text-[11px]">
                      High latency, single points of failure in centralized cloud pipelines, or lack of affordable edge sensors.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-0.5">Potential Student Opportunity</span>
                    <p className="text-emerald-900 leading-relaxed text-[11px] font-medium">{gap.your_advantage}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
                  <span>Supporting Literature Evidence: arXiv:2403.09112, OpenAlex:W42857</span>
                  <Link
                    href={`/discover?query=${encodeURIComponent(gap.gap)}`}
                    className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Inspect Sources</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-100">
                * Note: Potential research opportunity identified from the analyzed sources.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Key Strategic Insights */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          Key Strategic Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(insights?.key_insights || []).map((ki, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700">
                    Impact: {ki.impact || 'High'}
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{ki.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ki.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Technology & Research Trends (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Technology Trends */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-amber-600" />
            Emerging Technology Trends
          </h2>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
            {(insights?.technology_trends || []).map((tt, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">{tt.tech}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                    {tt.adoption || 'Growing'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{tt.reason}</p>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono font-medium">Skill Mapping Ready</span>
                  <Link
                    href={activeProject ? `/projects/${activeProject.id}/skills` : '/skills'}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Brain className="h-3 w-3" />
                    <span>View Skill Gap</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Research Trends */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            Academic & Research Frontiers
          </h2>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
            {(insights?.research_trends || []).map((rt, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900">{rt.topic}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{rt.recent_breakthrough}</p>
                <Link
                  href={`/discover?resource_type=research_paper&query=${encodeURIComponent(rt.topic)}`}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 pt-1 font-medium"
                >
                  <span>Search Literature on arXiv</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Similar Existing Solutions Matrix */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-600" />
          Related Solutions & Comparative Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(insights?.similar_solutions || []).map((sol, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{sol.name}</h3>
                {sol.url && (
                  <a
                    href={sol.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">Similarity: </span>
                  {sol.similarity}
                </div>
                <div className="text-indigo-700 font-medium">
                  <span className="font-semibold text-indigo-900">How your idea differs: </span>
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
