'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Cpu,
  RefreshCw,
  Globe,
  Award,
  Bookmark,
  Share2,
  Atom,
  HelpCircle,
  Building,
  Calendar,
  Filter
} from 'lucide-react';
import { api, patentApi } from '@/lib/api';
import { Project } from '@/types';

export default function GlobalPatentHubPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [flagshipData, setFlagshipData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [projRes, provRes, flagRes] = await Promise.allSettled([
          api.getProjects({ page: 1, page_size: 50 }),
          patentApi.getProviders(),
          patentApi.getFlagship(),
        ]);

        if (projRes.status === 'fulfilled') {
          const res = projRes.value;
          setProjects(Array.isArray(res) ? res : (res as any)?.items || []);
        }
        if (provRes.status === 'fulfilled') {
          setProviders(provRes.value || []);
        }
        if (flagRes.status === 'fulfilled') {
          setFlagshipData(flagRes.value);
        }
      } catch (err) {
        console.error('Failed to load patent hub data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const domains = ['ALL', ...Array.from(new Set(projects.map((p) => p.domain).filter(Boolean)))];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.problem_statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === 'ALL' || p.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Academic Page Header */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Evidence-Grounded Patent & Prior-Art Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Patent & Prior-Art Explorer
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Discover related patent publications, extract technical features, analyze potential overlaps, and identify technical differentiation opportunities for your innovation project.
            </p>
          </div>
        </div>

        {/* Mandatory Legal & Scientific Safety Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
          <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wide">
              Non-Legal AI Research Disclaimer
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              This tool provides AI-assisted prior-art discovery and technical similarity analysis for research and innovation purposes. It does not provide legal advice, patentability opinions, freedom-to-operate opinions, infringement opinions, or legal conclusions. Patent decisions should be reviewed by a qualified patent professional.
            </p>
          </div>
        </div>

        {/* Provider Operational Status & Search Engines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map((p, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {p.provider_name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {p.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  p.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {p.status}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {p.latency_ms}ms
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Flagship Prior-Art Spotlight */}
        {flagshipData && (
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    FLAGSHIP PROJECT PRIOR ART
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Search Coverage: <span className="font-semibold text-emerald-400">{flagshipData.search_coverage_score}%</span> • {flagshipData.result_count} Identified Publications
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Active Prior-Art Intelligence Overview
                </h2>
              </div>
              <Link
                href={`/projects/${flagshipData.project_id}/patents`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all hover:scale-[1.02]"
              >
                Open Full Project Prior-Art Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Top Prior-Art Publications Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flagshipData.results?.slice(0, 3).map((res: any, idx: number) => {
                const doc = res.patent;
                const simScore = Math.round(res.technical_similarity_score || 0);
                const overlapLevel = res.feature_overlap_level || 'MODERATE';
                const badgeColor =
                  overlapLevel === 'HIGH'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : overlapLevel === 'MODERATE'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                return (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {doc?.publication_number || 'US-PATENT'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                          {overlapLevel} OVERLAP ({simScore}%)
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {doc?.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                        {doc?.abstract}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[140px]">{doc?.assignees?.[0] || 'Public Record'}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          {doc?.filing_date || 'Prior Art'}
                        </span>
                      </div>
                      {res.potential_differences?.length > 0 && (
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                          <span className="font-semibold">Differentiation: </span>
                          {res.potential_differences[0]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Selector & Search Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                Select Innovation Project to Explore Prior Art
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Choose from your innovation projects to extract technical concepts and run multi-stage patent investigations.
              </p>
            </div>

            {/* Domain Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              {domains.map((dom) => (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                    selectedDomain === dom
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500/40'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search projects by title, problem, domain, or technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Project Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm text-slate-400">No projects match your search criteria.</p>
            <Link
              href="/submit-idea"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500"
            >
              Submit a New Innovation Idea
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-lg transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {p.domain || 'Technology'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Project #{p.id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                    {p.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {p.problem_statement || p.description}
                  </p>

                  {p.technologies && p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.technologies.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                        >
                          {t}
                        </span>
                      ))}
                      {p.technologies.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-mono self-center">
                          +{p.technologies.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                    <Scale className="w-3.5 h-3.5" />
                    Prior-Art Engine Ready
                  </div>
                  <Link
                    href={`/projects/${p.id}/patents`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-slate-800 dark:text-slate-200 transition-all"
                  >
                    <span>Analyze Art</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5-Stage Search & Methodology Guide */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              How InnoSphere AI Prior-Art Discovery Works
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Our 5-stage search methodology combines technical concept extraction, CPC classification mapping, and vector semantic similarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { num: '01', title: 'Exact Concept', desc: 'Queries exact technical solution phrasing and key hardware/software identifiers.' },
              { num: '02', title: 'Components', desc: 'Deconstructs project into subsystems, sensors, pipelines, and algorithms.' },
              { num: '03', title: 'Problem-Solution', desc: 'Identifies patents addressing identical problem statements and constraints.' },
              { num: '04', title: 'Broader Prior Art', desc: 'Explores adjacent technologies and parent CPC classification clusters.' },
              { num: '05', title: 'Differentiation', desc: 'Calculates side-by-side overlap matrices and highlights novel features.' },
            ].map((stage, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1.5"
              >
                <span className="font-mono text-xs font-extrabold text-amber-400">
                  STAGE {stage.num}
                </span>
                <h4 className="text-xs font-bold text-white">
                  {stage.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
