'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Search,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Cpu,
  RefreshCw,
  Award,
  Bookmark,
  Share2,
  Atom,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Zap,
  HelpCircle,
  Filter,
  Check,
  ChevronRight,
  Database,
  Code,
  Gauge,
  Sliders,
  Wallet
} from 'lucide-react';
import { api, resourceMatchmakerApi } from '@/lib/api';
import { Project } from '@/types';

export default function GlobalResourceMatchmakerHubPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [flagshipData, setFlagshipData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [projRes, healthRes, flagRes] = await Promise.allSettled([
          api.getProjects({ page: 1, page_size: 50 }),
          resourceMatchmakerApi.getHealth(),
          resourceMatchmakerApi.getFlagship(),
        ]);

        if (projRes.status === 'fulfilled') {
          const res = projRes.value;
          setProjects(Array.isArray(res) ? res : (res as any)?.items || []);
        }
        if (healthRes.status === 'fulfilled') {
          setHealthData(healthRes.value || null);
        }
        if (flagRes.status === 'fulfilled') {
          setFlagshipData(flagRes.value || null);
        }
      } catch (err) {
        console.error('Failed to load resource matchmaker hub data:', err);
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
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Resource Matchmaker & Allocation Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Resource Matchmaker
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Match your innovation project with verified open-source models, edge hardware, sensor specs, benchmark datasets, and institutional cloud tiers based on budget and skill constraints.
            </p>

            {healthData && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{healthData.status}</span>
                  <span className="text-slate-400">|</span>
                  <span>Latency: {healthData.latency_ms}ms</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm">Strict Budget Guardrails</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates hard spending limits across Hardware, Cloud, Software, and Recurring APIs to eliminate student debt.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm">Hardware & Compute Sizing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Matches workloads against student-owned microcontrollers (ESP32, Arduino) and laptops without redundant hardware buys.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm">Open-Source Substitutes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automatically identifies zero-cost open-source tools and quantized models to replace expensive commercial APIs.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Gauge className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm">Interactive What-If Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Simulate hypothetical budget cuts, offline deployments, and edge constraints with real-time capability recomputation.
            </p>
          </div>
        </div>

        {/* Flagship Demonstration Workspace Preview */}
        {flagshipData && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Flagship Demonstration Workspace
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {flagshipData.project_title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total Budget: ₹{flagshipData.profile?.total_budget?.toLocaleString() || '10,000'} | Target: {flagshipData.profile?.open_source_preference || 'Open Source Preferred'}
                </p>
              </div>

              <Link
                href={`/projects/${flagshipData.project_id}/resource-matchmaker`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span>Open Full Matchmaker Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Requirements Extracted</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {flagshipData.requirements?.length || 0}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Ranked Matches</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {flagshipData.matches?.length || 0}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Curated Bundles</span>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {flagshipData.bundles?.length || 3}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Allocated Outlay</span>
                <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                  ₹{flagshipData.budget_summary?.allocated_budget?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            {/* Top Match Sample Preview */}
            {flagshipData.matches && flagshipData.matches.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Top Matched Candidate Resources:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {flagshipData.matches.slice(0, 3).map((m: any) => (
                    <div
                      key={m.id || m.resource_name}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {m.resource_name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {m.overall_match_score?.toFixed(0) || '90'}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                          {m.resource_category}
                        </span>
                        <span>₹{m.estimated_cost || 0}</span>
                        <span className="text-emerald-500 font-medium">({m.price_evidence_status})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {m.why_matched_json?.[0] || 'Matches project tech stack requirements.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Selector Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Select a Project to Allocate Resources
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Each project has an isolated resource profile, owned hardware inventory, and budget allocation plan.
              </p>
            </div>

            {/* Search & Domain Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
                />
              </div>

              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <SlidersHorizontal className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No innovation projects found matching your filter criteria.
              </p>
              <Link
                href="/submit-idea"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
              >
                Submit a New Project Idea
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}/resource-matchmaker`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {p.domain}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Stage: {(p as any).stage || p.status || 'Prototyping'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors line-clamp-1">
                      {p.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.proposed_solution || p.problem_statement}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Budget Allocator</span>
                    </div>

                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                      Open Workspace <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
