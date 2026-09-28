'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, Play, Award, Scale,
  Layers, Search, ArrowRight, RefreshCw, Cpu, BookOpen, Clock,
  TrendingUp, Activity, CheckSquare, Sparkles, AlertCircle
} from 'lucide-react';
import { api, validationApi } from '@/lib/api';
import { Project } from '@/types';

export default function GlobalValidationHubPage() {
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
        console.error('Failed to load projects for validation hub:', err);
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
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Evidence-Backed Innovation Verification</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Validation & Innovation Proof Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Verify student project claims with traceable empirical evidence. Audit experimental rigor, technical differentiation, bill of materials, and competition defense readiness.
            </p>
          </div>
        </div>

        {/* Global Evidence Ladder Architecture */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-500" /> InnoSphere 6-Stage Evidence Ladder
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { step: '1. Claim', label: 'Scientific Hypothesis', desc: 'Quantitative assertion', status: 'FORMULATED' },
              { step: '2. Setup', label: 'Testbed & Dataset', desc: 'Controlled variables & seeds', status: 'DETERMINISTIC' },
              { step: '3. Trial', label: 'Multi-Run Runs', desc: 'Hardware/simulation runs', status: 'MEASURED' },
              { step: '4. Baseline', label: 'SOTA Benchmarking', desc: 'Comparative literature delta', status: 'BENCHMARKED' },
              { step: '5. Proof', label: 'Validation Matrix', desc: 'Traceable claim-evidence links', status: 'VALIDATED' },
              { step: '6. Defense', label: '16-Slide Paper Sync', desc: 'IEEE LaTeX & jury deck', status: 'COMPETITION_READY' },
            ].map((st, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{st.step}</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{st.label}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{st.desc}</p>
                </div>
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 mt-3 inline-block self-start border border-indigo-200 dark:border-indigo-800/40">
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
              placeholder="Search innovation claims, technologies, or domains..."
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
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>

        {/* Project Validation Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Scanning project validation registries...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p>No projects match your filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {p.domain}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
                    {p.technologies?.slice(0, 3).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Progress: <strong>{p.progress}%</strong></span>
                  </div>

                  <button
                    onClick={() => router.push(`/projects/${p.id}/validation`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                  >
                    Open Validation Hub <ArrowRight className="w-3.5 h-3.5" />
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
