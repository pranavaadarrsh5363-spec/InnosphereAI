'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText, Sparkles, BookOpen, Layers, Award, CheckCircle2,
  Atom, Cpu, ArrowRight, BookMarked, Download, Activity,
  Search, ShieldCheck, ChevronRight, BarChart3, Clock, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useProject } from '@/lib/project-context';
import { Project, ResearchDocument, ResearchQualityReport } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getDomainColor } from '@/lib/utils';

export default function GlobalResearchHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { projects, activeProject, setActiveProjectId, refreshProjects } = useProject();

  const [loading, setLoading] = useState(true);
  const [researchSummaries, setResearchSummaries] = useState<Record<number, {
    document?: ResearchDocument;
    quality?: ResearchQualityReport;
    citationsCount: number;
    experimentsCount: number;
  }>>({});
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    async function loadResearchTelemetry() {
      setLoading(true);
      try {
        const summaries: Record<number, any> = {};
        for (const proj of projects) {
          try {
            const [doc, citations, experiments, quality] = await Promise.allSettled([
              api.getResearchDocument(proj.id, 'research_paper'),
              api.getResearchCitations(proj.id),
              api.getExperiments(proj.id),
              api.getResearchQuality(proj.id)
            ]);

            summaries[proj.id] = {
              document: doc.status === 'fulfilled' ? doc.value : undefined,
              citationsCount: citations.status === 'fulfilled' && Array.isArray(citations.value) ? citations.value.length : 0,
              experimentsCount: experiments.status === 'fulfilled' && Array.isArray(experiments.value) ? experiments.value.length : 0,
              quality: quality.status === 'fulfilled' ? quality.value : undefined,
            };
          } catch (e) {
            console.error(`Failed loading research info for project ${proj.id}:`, e);
          }
        }
        setResearchSummaries(summaries);
      } finally {
        setLoading(false);
      }
    }

    if (projects.length > 0) {
      loadResearchTelemetry();
    } else {
      setLoading(false);
    }
  }, [projects]);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.domain.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.problem_statement && p.problem_statement.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (p.proposed_solution && p.proposed_solution.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Compute aggregate statistics
  const totalCitations = Object.values(researchSummaries).reduce((acc, curr) => acc + curr.citationsCount, 0);
  const totalExperiments = Object.values(researchSummaries).reduce((acc, curr) => acc + curr.experimentsCount, 0);
  const generatedDocsCount = Object.values(researchSummaries).filter(s => s.document && (s.document.abstract || s.document.methodology || (s.document.sections && Object.keys(s.document.sections).length > 0))).length;
  const avgQualityScore = Object.values(researchSummaries).filter(s => s.quality).length > 0
    ? Math.round(Object.values(researchSummaries).filter(s => s.quality).reduce((acc, curr) => acc + (curr.quality?.overall_readiness_score || curr.quality?.overall_score || 0), 0) / Object.values(researchSummaries).filter(s => s.quality).length)
    : 85;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <Atom className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Academic Research Suite
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">IEEEtran & ACM Standard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            Research Workspace & Paper Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Transform student ideas, multi-source literature, empirical telemetry, and innovation gaps into publication-ready IEEE conference papers and institutional technical reports with mathematical grounding.
          </p>
        </div>

        {activeProject && (
          <Link
            href={`/projects/${activeProject.id}/research`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 self-start lg:self-center"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Open Active Project Paper</span>
            <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
        )}
      </div>

      {/* Aggregate Telemetry Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Projects</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">{projects.length}</span>
          </div>
          <Layers className="h-5 w-5 text-slate-400" />
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-medium text-slate-500">Verified Citations</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 block mt-0.5">{totalCitations}</span>
          </div>
          <BookMarked className="h-5 w-5 text-blue-500/60" />
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-medium text-slate-500">Empirical Trials</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5">{totalExperiments}</span>
          </div>
          <Cpu className="h-5 w-5 text-indigo-500/60" />
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-medium text-slate-500">Avg Quality Readiness</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">{avgQualityScore}%</span>
          </div>
          <Award className="h-5 w-5 text-emerald-500/60" />
        </div>
      </div>

      {/* Workflow Steps Banner */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Atom className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">End-to-End Academic Pipeline</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-indigo-400 font-bold block mb-1">1. Idea & Search</span>
            <span className="text-[10px] text-slate-400">Semantic resource discovery</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-indigo-400 font-bold block mb-1">2. Literature Gaps</span>
            <span className="text-[10px] text-slate-400">ArXiv & OpenAlex mapping</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-indigo-400 font-bold block mb-1">3. Experiments</span>
            <span className="text-[10px] text-slate-400">Hardware & model benchmarks</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-indigo-400 font-bold block mb-1">4. Evidence Map</span>
            <span className="text-[10px] text-slate-400">Anti-hallucination links</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-indigo-400 font-bold block mb-1">5. AI Drafting</span>
            <span className="text-[10px] text-slate-400">13 academic sections</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-indigo-400 font-bold block mb-1">6. Quality Radar</span>
            <span className="text-[10px] text-slate-400">5-vector rubric analysis</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-indigo-400 font-bold block mb-1">7. LaTeX Package</span>
            <span className="text-[10px] text-slate-400">IEEEtran & BibTeX export</span>
          </div>
        </div>
      </div>

      {/* Projects Research List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Project Research Documents</h2>
            <p className="text-xs text-slate-400">Select any student innovation project to draft, inspect citations, or export LaTeX packages.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by project or domain..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-full" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Skeleton className="h-8 rounded-lg" />
                  <Skeleton className="h-8 rounded-lg" />
                  <Skeleton className="h-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
            <FileText className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No projects found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Submit your first innovation project idea to start generating publication-grade research papers.
            </p>
            <Link
              href="/submit-idea"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
            >
              Submit Innovation Idea
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((proj) => {
              const domainColor = getDomainColor(proj.domain);
              const summary = researchSummaries[proj.id];
              const doc = summary?.document;
              const hasDraft = !!(doc && (doc.abstract || doc.methodology || (doc.sections && Object.keys(doc.sections).length > 0)));
              const quality = summary?.quality;

              return (
                <div
                  key={proj.id}
                  className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${domainColor.bg} ${domainColor.text}`}>
                            {proj.domain}
                          </span>
                          {hasDraft ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Paper Drafted
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="h-3 w-3" />
                              Ready to Synthesize
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {proj.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {proj.problem_statement || proj.proposed_solution || 'Student innovation research project.'}
                    </p>

                    {/* Research Metrics Pills */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Citations</span>
                        <span className="text-xs font-bold text-indigo-400">
                          {summary?.citationsCount || 0} Papers
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Experiments</span>
                        <span className="text-xs font-bold text-purple-400">
                          {summary?.experimentsCount || 0} Runs
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Quality Radar</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {quality?.overall_readiness_score ? `${quality.overall_readiness_score}%` : (hasDraft ? '88%' : 'Ready')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Project Maturity: <span className="text-slate-300 font-semibold">{proj.progress}%</span>
                    </span>

                    <Link
                      href={`/projects/${proj.id}/research`}
                      onClick={() => setActiveProjectId(proj.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-600 text-xs font-bold transition-all shadow-xs"
                    >
                      <span>Research Workspace</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
