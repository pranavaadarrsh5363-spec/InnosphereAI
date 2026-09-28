'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Share2, Network, CheckCircle2, AlertTriangle, Play, Award, Scale,
  Layers, Search, ArrowRight, RefreshCw, Cpu, BookOpen, Clock,
  TrendingUp, Activity, CheckSquare, Sparkles, AlertCircle,
  Workflow, Boxes, Lock, Server, Cloud, Wand2, Atom, FlaskConical,
  ShieldCheck, Brain, FileText, Database, MapPin, Compass
} from 'lucide-react';
import { api, knowledgeGraphApi } from '@/lib/api';
import { Project } from '@/types';

export default function GlobalKnowledgeGraphHubPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [flagshipGraph, setFlagshipGraph] = useState<any>(null);
  const [categoriesMeta, setCategoriesMeta] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [projRes, catRes, flagRes] = await Promise.allSettled([
          api.getProjects({ page: 1, page_size: 50 }),
          knowledgeGraphApi.getCategories(),
          knowledgeGraphApi.getFlagship(),
        ]);

        if (projRes.status === 'fulfilled') {
          const res = projRes.value;
          setProjects(Array.isArray(res) ? res : (res as any)?.items || []);
        }
        if (catRes.status === 'fulfilled' && catRes.value?.categories) {
          setCategoriesMeta(catRes.value.categories);
        }
        if (flagRes.status === 'fulfilled') {
          setFlagshipGraph(flagRes.value);
        }
      } catch (err) {
        console.error('Failed to load knowledge graph hub data:', err);
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
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-indigo-900/50 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Share2 className="w-4 h-4 text-indigo-400" /> Evidence-Grounded Cross-System Intelligence
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Knowledge Graph
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              <span className="text-indigo-300 font-semibold">Explore the relationships between your idea, research, technologies, datasets, hardware, experiments, validation evidence, skills, and architecture.</span> A real, dynamic graph generated from authentic project telemetry that lets students, mentors, and judges navigate innovation connections.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />
        </div>

        {/* Flagship Graph Spotlight Banner */}
        {flagshipGraph && (
          <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  FLAGSHIP INNOVATION GRAPH
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Version {flagshipGraph.version} • {flagshipGraph.stats?.total_nodes || 0} Entities • {flagshipGraph.stats?.total_edges || 0} Relationships
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {flagshipGraph.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                {flagshipGraph.insights?.summary || 'Interactive graph connecting problem definition, technical stack, edge telemetry, and empirical experiments.'}
              </p>
            </div>
            <button
              onClick={() => router.push(`/projects/${flagshipGraph.project_id}/knowledge-graph`)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm shrink-0 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Open Flagship Graph <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 17 Canonical Entities Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-indigo-500" /> Supported Innovation Entity Categories
            </h2>
            <span className="text-xs text-slate-400">17 Canonical Entity Types</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(categoriesMeta.length > 0 ? categoriesMeta : [
              { label: 'Idea', category: 'IDEA', color: '#6366F1' },
              { label: 'Problem', category: 'PROBLEM', color: '#EF4444' },
              { label: 'Research Paper', category: 'RESEARCH_PAPER', color: '#8B5CF6' },
              { label: 'Dataset', category: 'DATASET', color: '#06B6D4' },
              { label: 'Technology', category: 'TECHNOLOGY', color: '#3B82F6' },
              { label: 'Hardware Device', category: 'HARDWARE', color: '#EC4899' },
              { label: 'Existing Solution', category: 'EXISTING_SOLUTION', color: '#64748B' },
              { label: 'Innovation Gap', category: 'INNOVATION_GAP', color: '#F59E0B' },
              { label: 'Experiment', category: 'EXPERIMENT', color: '#10B981' },
              { label: 'Benchmark', category: 'BENCHMARK', color: '#14B8A6' },
              { label: 'Validation Evidence', category: 'VALIDATION_EVIDENCE', color: '#059669' },
              { label: 'Innovation Claim', category: 'INNOVATION_CLAIM', color: '#8B5CF6' },
              { label: 'Skill Requirement', category: 'SKILL', color: '#F97316' },
              { label: 'Architecture Component', category: 'ARCHITECTURE_COMPONENT', color: '#2563EB' },
              { label: 'Resource', category: 'RESOURCE', color: '#0284C7' },
              { label: 'Roadmap Milestone', category: 'ROADMAP_ITEM', color: '#A855F7' },
              { label: 'Citation', category: 'CITATION', color: '#94A3B8' },
            ]).map((cat) => (
              <div
                key={cat.category}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {cat.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Knowledge Graph Explorer Directory */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Project Knowledge Graphs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select an innovation project to explore its interactive relationship graph, diagnostics, and AI insights.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Domain Filter */}
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading project knowledge graphs...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
              No projects found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                        {p.domain}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Progress: {p.progress || 10}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {p.problem_statement}
                      </p>
                    </div>

                    {/* Technologies Tag Pills */}
                    {p.technologies && p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.technologies.slice(0, 3).map((t: string) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                        {p.technologies.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400">
                            +{p.technologies.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-indigo-500" /> Evidence-Grounded
                    </span>
                    <button
                      onClick={() => router.push(`/projects/${p.id}/knowledge-graph`)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      Explore Graph <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
