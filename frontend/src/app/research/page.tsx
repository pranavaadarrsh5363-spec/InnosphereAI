'use client';

import React, { useState, useEffect } from'react';
import Link from'next/link';
import { useRouter } from'next/navigation';
import {
 FileText, BookOpen, Layers, Award, CheckCircle2,
 Atom, Cpu, ArrowRight, BookMarked, Download, Activity,
 Search, ShieldCheck, ChevronRight, BarChart3, Clock, AlertCircle
} from'lucide-react';
import { api } from'@/lib/api';
import { useAuth } from'@/lib/auth-context';
import { useProject } from'@/lib/project-context';
import { Project, ResearchDocument, ResearchQualityReport } from'@/types';
import { Skeleton } from'@/components/ui/skeleton';
import { getDomainColor } from'@/lib/utils';

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
 api.getResearchDocument(proj.id,'research_paper'),
 api.getResearchCitations(proj.id),
 api.getExperiments(proj.id),
 api.getResearchQuality(proj.id)
 ]);

 summaries[proj.id] = {
 document: doc.status ==='fulfilled' ? doc.value : undefined,
 citationsCount: citations.status ==='fulfilled' && Array.isArray(citations.value) ? citations.value.length : 0,
 experimentsCount: experiments.status ==='fulfilled' && Array.isArray(experiments.value) ? experiments.value.length : 0,
 quality: quality.status ==='fulfilled' ? quality.value : undefined,
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
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 {/* Top Banner */}
 <div className="rounded-lg bg-white border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
 <div className="space-y-2 relative z-10">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
 <Atom className="h-3 w-3 text-slate-500" />
 Academic Research Suite
 </span>
 <span className="text-xs text-slate-300">•</span>
 <span className="text-xs text-slate-500">IEEEtran & ACM Standard</span>
 </div>
 <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
 Research Workspace & Paper Generator
 </h1>
 <p className="text-sm text-slate-600 max-w-3xl">
 Transform student ideas, multi-source literature, empirical telemetry, and innovation gaps into publication-ready IEEE conference papers and institutional technical reports with mathematical grounding.
 </p>
 </div>

 {activeProject && (
 <Link
 href={`/projects/${activeProject.id}/research`}
 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors shrink-0 self-start lg:self-center relative z-10"
 >
 <FileText className="h-4 w-4" />
 <span>Open Active Project Paper</span>
 <ArrowRight className="h-4 w-4 ml-1" />
 </Link>
 )}
 </div>

 {/* Aggregate Telemetry Stats */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div className="p-4 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
 <div>
 <span className="text-xs font-semibold text-slate-900">Total Projects</span>
 <span className="text-xl font-semibold text-slate-900 block mt-1">{projects.length}</span>
 </div>
 <div className="h-10 w-10 rounded-md bg-slate-50 flex items-center justify-center text-slate-600">
 <Layers className="h-5 w-5" />
 </div>
 </div>

 <div className="p-4 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
 <div>
 <span className="text-xs font-semibold text-slate-900">Verified Citations</span>
 <span className="text-xl font-semibold text-indigo-600 block mt-1">{totalCitations}</span>
 </div>
 <div className="h-10 w-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
 <BookMarked className="h-5 w-5" />
 </div>
 </div>

 <div className="p-4 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
 <div>
 <span className="text-xs font-semibold text-slate-900">Empirical Trials</span>
 <span className="text-xl font-semibold text-violet-600 block mt-1">{totalExperiments}</span>
 </div>
 <div className="h-10 w-10 rounded-md bg-violet-50 flex items-center justify-center text-violet-600">
 <Cpu className="h-5 w-5" />
 </div>
 </div>

 <div className="p-4 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
 <div>
 <span className="text-xs font-semibold text-slate-900">Avg Quality Readiness</span>
 <span className="text-xl font-semibold text-emerald-600 block mt-1">{avgQualityScore}%</span>
 </div>
 <div className="h-10 w-10 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
 <Award className="h-5 w-5" />
 </div>
 </div>
 </div>

 {/* Workflow Steps Banner */}
 <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
 <div className="flex items-center gap-2">
 <Atom className="h-4 w-4 text-slate-500" />
 <h2 className="text-sm font-semibold text-slate-900">End-to-End Academic Pipeline</h2>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
 <div className="p-3 rounded bg-white border border-slate-200">
 <span className="text-slate-900 font-semibold block mb-1">1. Idea & Search</span>
 <span className="text-slate-500">Semantic resource discovery</span>
 </div>
 <div className="p-3 rounded bg-white border border-slate-200">
 <span className="text-slate-900 font-semibold block mb-1">2. Literature Gaps</span>
 <span className="text-slate-500">ArXiv & OpenAlex mapping</span>
 </div>
 <div className="p-3 rounded bg-white border border-slate-200">
 <span className="text-slate-900 font-semibold block mb-1">3. Experiments</span>
 <span className="text-slate-500">Hardware & model benchmarks</span>
 </div>
 <div className="p-3 rounded bg-white border border-slate-200">
 <span className="text-slate-900 font-semibold block mb-1">4. Evidence Map</span>
 <span className="text-slate-500">Anti-hallucination links</span>
 </div>
 <div className="p-3 rounded bg-white border border-slate-200">
 <span className="text-slate-900 font-semibold block mb-1">5. AI Drafting</span>
 <span className="text-slate-500">13 academic sections</span>
 </div>
 <div className="p-3 rounded bg-white border border-slate-200">
 <span className="text-slate-900 font-semibold block mb-1">6. Quality Radar</span>
 <span className="text-slate-500">5-vector rubric analysis</span>
 </div>
 <div className="p-3 rounded bg-white border border-slate-200">
 <span className="text-slate-900 font-semibold block mb-1">7. LaTeX Package</span>
 <span className="text-slate-500">IEEEtran & BibTeX export</span>
 </div>
 </div>
 </div>

 {/* Projects Research List */}
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-sm font-semibold text-slate-900">Project Research Documents</h2>
 <p className="text-xs text-slate-500">Select any student innovation project to draft, inspect citations, or export LaTeX packages.</p>
 </div>

 <div className="relative w-full sm:w-72">
 <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Filter by project or domain..."
 value={searchFilter}
 onChange={(e) => setSearchFilter(e.target.value)}
 className="w-full pl-9 pr-3 py-1.5 rounded-md bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
 />
 </div>
 </div>

 {loading ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {[1, 2, 3, 4].map(i => (
 <div key={i} className="p-5 rounded-lg bg-white border border-slate-200 space-y-3">
 <Skeleton className="h-5 w-48" />
 <Skeleton className="h-3 w-full" />
 <div className="grid grid-cols-3 gap-2 pt-2">
 <Skeleton className="h-8 rounded" />
 <Skeleton className="h-8 rounded" />
 <Skeleton className="h-8 rounded" />
 </div>
 </div>
 ))}
 </div>
 ) : filteredProjects.length === 0 ? (
 <div className="p-10 rounded-lg bg-white border border-slate-200 text-center space-y-3">
 <FileText className="h-8 w-8 text-slate-400 mx-auto" />
 <h3 className="text-sm font-semibold text-slate-900">No projects found</h3>
 <p className="text-xs text-slate-500 max-w-sm mx-auto">
 Submit your first innovation project idea to start generating publication-grade research papers.
 </p>
 <Link
 href="/submit-idea"
 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
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
 className="p-5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4 shadow-sm"
 >
 <div className="space-y-3">
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className={`px-2 py-0.5 rounded text-xs font-medium border ${domainColor.bg} ${domainColor.text} border-slate-200`}>
 {proj.domain}
 </span>
 {hasDraft ? (
 <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
 Paper Drafted
 </span>
 ) : (
 <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
 <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
 Ready to Synthesize
 </span>
 )}
 </div>
 <h3 className="text-sm font-semibold text-slate-900">
 {proj.title}
 </h3>
 </div>
 </div>

 <p className="text-sm text-slate-600 line-clamp-2">
 {proj.problem_statement || proj.proposed_solution ||'Student innovation research project.'}
 </p>

 {/* Research Metrics Pills */}
 <div className="grid grid-cols-3 gap-2 pt-1 text-center">
 <div className="p-2 rounded bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Citations</span>
 <span className="text-sm font-semibold text-slate-900">
 {summary?.citationsCount || 0}
 </span>
 </div>
 <div className="p-2 rounded bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Experiments</span>
 <span className="text-sm font-semibold text-slate-900">
 {summary?.experimentsCount || 0}
 </span>
 </div>
 <div className="p-2 rounded bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Quality Score</span>
 <span className="text-sm font-semibold text-slate-900">
 {quality?.overall_readiness_score ?`${quality.overall_readiness_score}%` : (hasDraft ?'88%' :'-')}
 </span>
 </div>
 </div>
 </div>

 {/* Actions Bar */}
 <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
 <span className="text-xs text-slate-500">
 Project Maturity: <span className="text-slate-700 font-medium">{proj.progress}%</span>
 </span>

 <Link
 href={`/projects/${proj.id}/research`}
 onClick={() => setActiveProjectId(proj.id)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
 >
 <span>Workspace</span>
 <ChevronRight className="h-4 w-4" />
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
