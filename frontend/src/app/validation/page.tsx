'use client';

import React, { useState, useEffect } from'react';
import { useRouter } from'next/navigation';
import {
 ShieldCheck, CheckCircle2, Search, ArrowRight, RefreshCw, Layers
} from'lucide-react';
import { api } from'@/lib/api';
import { Project } from'@/types';

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
 const matchesDomain = selectedDomain ==='ALL' || p.domain === selectedDomain;
 return matchesSearch && matchesDomain;
 });

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 max-w-6xl mx-auto">
 <div className="space-y-6">
 {/* Header Hero */}
 <div className="bg-white text-slate-900 rounded-lg p-5 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
 <div className="max-w-3xl space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 <ShieldCheck className="w-4 h-4 text-slate-500" />
 <span>Evidence-Backed Innovation Verification</span>
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Validation & Innovation Proof Hub
 </h1>
 <p className="text-sm text-slate-600">
 Verify student project claims with traceable empirical evidence. Audit experimental rigor, technical differentiation, bill of materials, and competition defense readiness.
 </p>
 </div>
 </div>

 {/* Global Evidence Ladder Architecture */}
 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Layers className="w-4 h-4 text-slate-400" /> InnoSphere 6-Stage Evidence Ladder
 </h2>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
 {[
 { step:'1. Claim', label:'Scientific Hypothesis', desc:'Quantitative assertion', status:'FORMULATED' },
 { step:'2. Setup', label:'Testbed & Dataset', desc:'Controlled variables & seeds', status:'DETERMINISTIC' },
 { step:'3. Trial', label:'Multi-Run Runs', desc:'Hardware/simulation runs', status:'MEASURED' },
 { step:'4. Baseline', label:'SOTA Benchmarking', desc:'Comparative literature delta', status:'BENCHMARKED' },
 { step:'5. Proof', label:'Validation Matrix', desc:'Traceable claim-evidence links', status:'VALIDATED' },
 { step:'6. Defense', label:'16-Slide Paper Sync', desc:'IEEE LaTeX & jury deck', status:'COMPETITION_READY' },
 ].map((st, i) => (
 <div
 key={i}
 className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between"
 >
 <div>
 <span className="text-xs font-semibold text-slate-500">{st.step}</span>
 <h4 className="text-sm font-semibold text-slate-900 mt-1">{st.label}</h4>
 <p className="text-xs text-slate-600 mt-1">{st.desc}</p>
 </div>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 mt-3 inline-block self-start">
 {st.status}
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Filter & Search Bar */}
 <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
 <div className="relative flex-1 min-w-[240px]">
 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Search innovation claims, technologies, or domains..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-1.5 rounded-md text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
 />
 </div>

 <div className="flex items-center gap-2 overflow-x-auto">
 {domains.map((dom) => (
 <button
 key={dom}
 onClick={() => setSelectedDomain(dom)}
 className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
 selectedDomain === dom
 ?'bg-indigo-600 text-white shadow-sm'
 :'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
 }`}
 >
 {dom}
 </button>
 ))}
 </div>
 </div>

 {/* Project Validation Cards Grid */}
 {loading ? (
 <div className="py-20 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
 <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
 <span>Scanning project validation registries...</span>
 </div>
 ) : filteredProjects.length === 0 ? (
 <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500 space-y-2 shadow-sm">
 <ShieldCheck className="w-8 h-8 mx-auto text-slate-400" />
 <p>No projects match your filter criteria.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredProjects.map((p) => (
 <div
 key={p.id}
 className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4"
 >
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
 {p.domain}
 </span>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
 Stage: {p.status}
 </span>
 </div>

 <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
 {p.title}
 </h3>

 <p className="text-sm text-slate-600 line-clamp-2">
 {p.problem_statement}
 </p>

 <div className="pt-2 flex flex-wrap gap-2">
 {p.technologies?.slice(0, 3).map((tech, idx) => (
 <span
 key={idx}
 className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700"
 >
 {tech}
 </span>
 ))}
 </div>
 </div>

 <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-xs text-slate-500">
 <CheckCircle2 className="w-4 h-4 text-slate-400" />
 <span>Progress: <strong className="text-slate-700">{p.progress}%</strong></span>
 </div>

 <button
 onClick={() => router.push(`/projects/${p.id}/validation`)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
 >
 Open Validation Hub <ArrowRight className="w-4 h-4" />
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
