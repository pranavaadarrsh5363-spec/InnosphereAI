'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Target,
  Users,
  Cpu,
  Layers,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Compass,
  MapPin,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Shield,
  Database,
  BookOpen,
  Wrench,
  Loader2,
  Lock,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getDomainColor } from '@/lib/utils';
import { AIAnalysis, Idea } from '@/types';

export default function AIAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = Number(params.id);

  const [ideaData, setIdeaData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'tech' | 'resources' | 'opportunities' | 'challenges' | 'suggestions'>('tech');

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const data = await api.getIdea(ideaId);
      setIdeaData(data);
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        const res = await api.getAnalysis(ideaId);
        setAnalysis(res);
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ideaId) {
      fetchAnalysisData();
    }
  }, [ideaId]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await api.reanalyzeIdea(ideaId);
      await fetchAnalysisData();
    } catch (err) {
      console.error('Reanalyze error:', err);
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading AI Multi-Vector Analysis...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Analysis not yet generated</h2>
        <p className="text-xs text-slate-500">Please trigger AI analysis for this idea.</p>
        <button
          onClick={handleReanalyze}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          Generate Analysis Now
        </button>
      </div>
    );
  }

  const domainColor = getDomainColor(ideaData?.domain || 'Technology');

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner with Scores */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-semibold text-indigo-700">
                <Sparkles className="h-3 w-3 text-indigo-600" />
                AI Innovation Intelligence Report
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
                {ideaData?.domain}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                Complexity: {analysis.complexity_level || 'Intermediate'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {ideaData?.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {analysis.summary}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
              title="Refresh with updated parameters"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Re-analyzing...' : 'Re-analyze with AI'}</span>
            </button>
            <Link
              href={`/discover?domain=${encodeURIComponent(ideaData?.domain || '')}&query=${encodeURIComponent(ideaData?.title || '')}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Explore Resources</span>
            </Link>
            {ideaData?.project_id && (
              <Link
                href={`/roadmap/${ideaData.project_id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>View Roadmap</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3 Quantitative Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/80">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Feasibility Score</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{analysis.feasibility_score || 88}%</p>
              <p className="text-[10px] text-slate-400">Technical implementation viability</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Innovation Score</p>
              <p className="text-2xl font-bold text-indigo-600 mt-0.5">{analysis.innovation_score || 92}%</p>
              <p className="text-[10px] text-slate-400">Novelty & differentiation index</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Market & Social Impact</p>
              <p className="text-2xl font-bold text-purple-600 mt-0.5">{analysis.market_potential_score || 86}%</p>
              <p className="text-[10px] text-slate-400">Beneficiary reach & utility</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Core Breakdown: Problem Identified & Target Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider">
            <Target className="h-4 w-4" />
            Core Problem Identified
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{analysis.problem_identified}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Users className="h-4 w-4" />
            Target Users & Key Stakeholders
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{analysis.target_users}</p>
        </div>
      </div>

      {/* Interactive Navigation Tabs for Deep Breakdown */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'tech', label: 'Required Technologies', icon: Cpu, count: analysis.required_technologies?.length },
            { id: 'resources', label: 'Required Resources', icon: Layers },
            { id: 'opportunities', label: 'Innovation Opportunities', icon: Lightbulb, count: analysis.innovation_opportunities?.length },
            { id: 'challenges', label: 'Potential Challenges', icon: AlertTriangle },
            { id: 'suggestions', label: 'Actionable AI Suggestions', icon: Sparkles, count: analysis.ai_suggestions?.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Required Technologies */}
        {activeTab === 'tech' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
            {analysis.required_technologies?.map((tech, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[10px] font-semibold text-indigo-700">
                      {tech.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">{tech.difficulty || 'Intermediate'}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">{tech.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{tech.why}</p>
                </div>
                <Link
                  href={`/discover?technology=${encodeURIComponent(tech.name)}`}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 mt-2"
                >
                  <span>Find {tech.name} Repos & Docs</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Required Resources Breakdown */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
            {/* Datasets */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                <Database className="h-4 w-4" />
                Datasets & Ground Truth Data
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {(analysis.required_resources?.datasets || [
                  'Kaggle domain benchmarks',
                  'Public government open data portal',
                ]).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/discover?resource_type=dataset&query=${encodeURIComponent(ideaData?.domain || '')}`}
                className="text-[11px] text-emerald-600 font-semibold hover:underline block pt-2"
              >
                Search Live Datasets &rarr;
              </Link>
            </div>

            {/* APIs & Frameworks */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                <Wrench className="h-4 w-4" />
                APIs & Development Tools
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {(analysis.required_resources?.apis || [
                  'REST/WebSocket telemetry endpoints',
                  'OAuth2 security and token management',
                ]).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/discover?resource_type=api&query=${encodeURIComponent(ideaData?.domain || '')}`}
                className="text-[11px] text-blue-600 font-semibold hover:underline block pt-2"
              >
                Search APIs & Tooling &rarr;
              </Link>
            </div>

            {/* Research Papers & Hardware */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                Research Papers & Hardware
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {(analysis.required_resources?.papers || [
                  'State-of-the-art IEEE / arXiv literature',
                  'Edge device quantization benchmarks',
                ]).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/discover?resource_type=research_paper&query=${encodeURIComponent(ideaData?.domain || '')}`}
                className="text-[11px] text-purple-600 font-semibold hover:underline block pt-2"
              >
                Search arXiv Papers &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Tab 3: Innovation Opportunities */}
        {activeTab === 'opportunities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
            {analysis.innovation_opportunities?.map((opp, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-start gap-3.5">
                <div className="h-8 w-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Innovation Vector #{i + 1}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{opp}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Potential Challenges & Mitigation */}
        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
            {Object.entries(analysis.potential_challenges || {}).map(([cat, list]: [string, any], idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider capitalize">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {cat} Challenges
                </div>
                <ul className="space-y-2 text-xs text-slate-700">
                  {(Array.isArray(list) ? list : []).map((item: string, i: number) => (
                    <li key={i} className="text-slate-600 leading-relaxed list-disc list-inside text-xs">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Actionable AI Suggestions */}
        {activeTab === 'suggestions' && (
          <div className="space-y-3 animate-in fade-in">
            {analysis.ai_suggestions?.map((sug, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700">
                      Priority: {sug.priority || 'High'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{sug.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{sug.description}</p>
                </div>
                <Link
                  href="/insights"
                  className="shrink-0 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Explore Insight
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
