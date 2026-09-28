'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain, CheckCircle2, AlertTriangle, Play, Award, Scale,
  Layers, Search, ArrowRight, RefreshCw, Cpu, BookOpen, Clock,
  TrendingUp, Activity, CheckSquare, Sparkles, AlertCircle,
  GitMerge, Compass, GraduationCap, Flame, ArrowUpRight
} from 'lucide-react';
import { api, skillsApi } from '@/lib/api';
import { Project } from '@/types';

export default function GlobalSkillsHubPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const res = await api.getProjects({ page: 1, page_size: 50 });
        setProjects(Array.isArray(res) ? res : (res as any)?.items || []);
      } catch (err) {
        console.error('Failed to load projects for skills hub:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
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
        <div className="bg-linear-to-r from-violet-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-violet-900/50 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Brain className="w-4 h-4 text-violet-400" /> Evidence-Grounded Prerequisites & Skill Intelligence
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Skills & Prerequisites Gap Map
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Answer the essential student question: <span className="text-violet-300 font-semibold">&ldquo;What do I need to learn before I can successfully build this project?&rdquo;</span> Deconstruct project technologies into structured competency requirements, detect blocking prerequisites, and generate a step-by-step personalized learning roadmap.
            </p>
          </div>
        </div>

        {/* 6-Stage Learning Progression Architecture */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-violet-500" /> InnoSphere 6-Phase Learning & Implementation Pipeline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { step: 'Phase 1', label: 'Foundations', desc: 'Core math, CS & syntax', status: 'BASE_PREREQS' },
              { step: 'Phase 2', label: 'Core Tech', desc: 'Framework fundamentals', status: 'REQUIRED' },
              { step: 'Phase 3', label: 'Frameworks', desc: 'Libraries & toolchains', status: 'CORE_STACK' },
              { step: 'Phase 4', label: 'Domain/Hardware', desc: 'IoT, edge & sensors', status: 'SPECIALIZED' },
              { step: 'Phase 5', label: 'Integration', desc: 'APIs, pipelines & DB', status: 'BUILD_READY' },
              { step: 'Phase 6', label: 'Validation', desc: 'Benchmarks & telemetry', status: 'EXPERIMENT' },
            ].map((st, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-violet-600 dark:text-violet-400">{st.step}</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{st.label}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{st.desc}</p>
                </div>
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 mt-3 inline-block self-start border border-violet-200 dark:border-violet-800/40">
                  {st.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by project title, domain, or technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {domains.map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedDomain === dom
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>

        {/* Project Skills Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-violet-600" />
            <span>Scanning project skill requirements & dependency maps...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400 space-y-2">
            <Brain className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p>No projects match your filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      {p.domain}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      Stage: {p.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                    {p.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {p.problem_statement}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {p.technologies?.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                    <span>Skills Gap Map</span>
                  </div>

                  <button
                    onClick={() => router.push(`/projects/${p.id}/skills`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition shadow-xs"
                  >
                    Open Skills Map <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
