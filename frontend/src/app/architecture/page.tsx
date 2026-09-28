'use client';

import React, { useState, useEffect } from'react';
import { useRouter } from'next/navigation';
import {
 Network, ArrowRight, RefreshCw, Cpu,
 Layers, Search,
 Workflow, Lock, Server, Cloud, Wand2
} from'lucide-react';
import { api } from'@/lib/api';
import { Project } from'@/types';

export default function GlobalArchitectureHubPage() {
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
 console.error('Failed to load projects for architecture hub:', err);
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
 <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
 <div className="max-w-6xl mx-auto space-y-6">
 {/* Header Hero */}
 <div className="bg-white rounded-lg p-6 sm:p-8 border border-slate-200 shadow-sm">
 <div className="max-w-3xl space-y-3">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 <Network className="w-4 h-4 text-slate-500" /> Evidence-Grounded System Topology
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 AI Architecture Generator
 </h1>
 <p className="text-sm text-slate-600">
 Generate system architecture, data flows, AI pipelines, and deployment diagrams from your project. Turn your innovation idea into a clear, visual, technical architecture.
 </p>
 </div>
 </div>

 {/* Architecture Views */}
 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Layers className="w-4 h-4 text-slate-500" /> 8 Specialized Architecture Views
 </h2>
 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
 {[
 { id:'SYSTEM', label:'System', desc:'End-to-end topology', icon: Layers },
 { id:'DATA_FLOW', label:'Data Flow', desc:'8-stage ingestion', icon: ArrowRight },
 { id:'AI_PIPELINE', label:'AI Pipeline', desc:'Model inference', icon: Wand2 },
 { id:'HARDWARE', label:'Hardware', desc:'MCU & telemetry', icon: Cpu },
 { id:'API_FLOW', label:'API Flow', desc:'REST contracts', icon: Server },
 { id:'DEPLOYMENT', label:'Deployment', desc:'Containers', icon: Cloud },
 { id:'APPLICATION', label:'User Flow', desc:'Lifecycle', icon: Workflow },
 { id:'SECURITY', label:'Security', desc:'TLS & JWT', icon: Lock },
 ].map((v, i) => {
 const Icon = v.icon;
 return (
 <div
 key={i}
 className="p-3 rounded-md border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2"
 >
 <div>
 <Icon className="w-4 h-4 text-slate-500 mb-1" />
 <h4 className="text-xs font-semibold text-slate-900">{v.label}</h4>
 <p className="text-xs text-slate-500 mt-0.5">{v.desc}</p>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Filter & Search Bar */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
 <div className="relative w-full sm:w-72">
 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
 <input
 type="text"
 placeholder="Search architecture..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-3 py-1.5 rounded-md text-sm bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
 />
 </div>

 <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
 {domains.map((dom) => (
 <button
 key={dom}
 onClick={() => setSelectedDomain(dom)}
 className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
 selectedDomain === dom
 ?'bg-slate-800 text-white'
 :'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
 }`}
 >
 {dom}
 </button>
 ))}
 </div>
 </div>

 {/* Project Architecture Cards Grid */}
 {loading ? (
 <div className="py-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
 <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
 <span>Loading projects...</span>
 </div>
 ) : filteredProjects.length === 0 ? (
 <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500 space-y-2">
 <Network className="w-8 h-8 mx-auto text-slate-400" />
 <p>No projects match your criteria.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredProjects.map((p) => (
 <div
 key={p.id}
 className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 flex flex-col justify-between space-y-4"
 >
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-slate-600">
 {p.domain}
 </span>
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 Stage: {p.status}
 </span>
 </div>

 <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
 {p.title}
 </h3>

 <p className="text-xs text-slate-600 line-clamp-2">
 {p.problem_statement}
 </p>

 <div className="pt-2 flex flex-wrap gap-1.5">
 {p.technologies?.slice(0, 4).map((tech, idx) => (
 <span
 key={idx}
 className="px-2 py-0.5 rounded text-xs bg-slate-50 text-slate-600 border border-slate-200"
 >
 {tech}
 </span>
 ))}
 </div>
 </div>

 <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-xs text-slate-500">
 <Network className="w-3.5 h-3.5 text-slate-400" />
 <span>8 Views Ready</span>
 </div>

 <button
 onClick={() => router.push(`/projects/${p.id}/architecture`)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
 >
 View <ArrowRight className="w-3.5 h-3.5" />
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
