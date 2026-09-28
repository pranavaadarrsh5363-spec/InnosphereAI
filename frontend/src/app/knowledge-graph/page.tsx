'use client';

import React, { useState, useEffect } from'react';
import { useRouter } from'next/navigation';
import {
 Share2, Boxes, Search, ArrowRight, RefreshCw
} from'lucide-react';
import { api, knowledgeGraphApi } from'@/lib/api';
import { Project } from'@/types';

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

 if (projRes.status ==='fulfilled') {
 const res = projRes.value;
 setProjects(Array.isArray(res) ? res : (res as any)?.items || []);
 }
 if (catRes.status ==='fulfilled' && catRes.value?.categories) {
 setCategoriesMeta(catRes.value.categories);
 }
 if (flagRes.status ==='fulfilled') {
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
 const matchesDomain = selectedDomain ==='ALL' || p.domain === selectedDomain;
 return matchesSearch && matchesDomain;
 });

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 max-w-6xl mx-auto">
 <div className="space-y-6">
 {/* Academic Page Header */}
 <div className="bg-white rounded-lg p-5 sm:p-6 border border-slate-200 shadow-sm">
 <div className="max-w-3xl space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 <Share2 className="w-4 h-4 text-slate-500" /> Evidence-Grounded Cross-System Intelligence
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Knowledge Graph
 </h1>
 <p className="text-sm text-slate-600">
 Explore the relationships between ideas, research literature, technologies, datasets, hardware, experiments, validation evidence, and architecture. Generated from project telemetry for students, mentors, and academic reviewers.
 </p>
 </div>
 </div>

 {/* Flagship Graph Spotlight Banner */}
 {flagshipGraph && (
 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 FLAGSHIP INNOVATION GRAPH
 </span>
 <span className="text-xs text-slate-500">
 Version {flagshipGraph.version} • {flagshipGraph.stats?.total_nodes || 0} Entities • {flagshipGraph.stats?.total_edges || 0} Relationships
 </span>
 </div>
 <h2 className="text-sm font-semibold text-slate-900">
 {flagshipGraph.name}
 </h2>
 <p className="text-sm text-slate-600 max-w-2xl">
 {flagshipGraph.insights?.summary ||'Interactive graph connecting problem definition, technical stack, edge telemetry, and empirical experiments.'}
 </p>
 </div>
 <button
 onClick={() => router.push(`/projects/${flagshipGraph.project_id}/knowledge-graph`)}
 className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
 >
 <Share2 className="w-4 h-4" /> Open Flagship Graph <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 )}

 {/* 17 Canonical Entities Grid */}
 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Boxes className="w-4 h-4 text-slate-400" /> Supported Innovation Entity Categories
 </h2>
 <span className="text-xs text-slate-500">17 Canonical Entity Types</span>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
 {(categoriesMeta.length > 0 ? categoriesMeta : [
 { label:'Idea', category:'IDEA', color:'#6366F1' },
 { label:'Problem', category:'PROBLEM', color:'#EF4444' },
 { label:'Research Paper', category:'RESEARCH_PAPER', color:'#8B5CF6' },
 { label:'Dataset', category:'DATASET', color:'#06B6D4' },
 { label:'Technology', category:'TECHNOLOGY', color:'#3B82F6' },
 { label:'Hardware Device', category:'HARDWARE', color:'#EC4899' },
 { label:'Existing Solution', category:'EXISTING_SOLUTION', color:'#64748B' },
 { label:'Innovation Gap', category:'INNOVATION_GAP', color:'#F59E0B' },
 { label:'Experiment', category:'EXPERIMENT', color:'#10B981' },
 { label:'Benchmark', category:'BENCHMARK', color:'#14B8A6' },
 { label:'Validation Evidence', category:'VALIDATION_EVIDENCE', color:'#059669' },
 { label:'Innovation Claim', category:'INNOVATION_CLAIM', color:'#8B5CF6' },
 { label:'Skill Requirement', category:'SKILL', color:'#F97316' },
 { label:'Architecture Component', category:'ARCHITECTURE_COMPONENT', color:'#2563EB' },
 { label:'Resource', category:'RESOURCE', color:'#0284C7' },
 { label:'Roadmap Milestone', category:'ROADMAP_ITEM', color:'#A855F7' },
 { label:'Citation', category:'CITATION', color:'#94A3B8' },
 ]).map((cat) => (
 <div
 key={cat.category}
 className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2"
 >
 <div
 className="w-2.5 h-2.5 rounded-sm shrink-0"
 style={{ backgroundColor: cat.color }}
 />
 <div className="truncate">
 <div className="text-xs font-semibold text-slate-800 truncate">
 {cat.label}
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
 <h2 className="text-sm font-semibold text-slate-900">
 Project Knowledge Graphs
 </h2>
 <p className="text-xs text-slate-500">
 Select an innovation project to explore its interactive relationship graph, diagnostics, and AI insights.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
 {/* Search Bar */}
 <div className="relative flex-1 sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search projects..."
 className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
 />
 </div>

 {/* Domain Filter */}
 <select
 value={selectedDomain}
 onChange={(e) => setSelectedDomain(e.target.value)}
 className="px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
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
 <div className="p-12 text-center text-slate-500 text-sm">
 <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-slate-400" />
 Loading project knowledge graphs...
 </div>
 ) : filteredProjects.length === 0 ? (
 <div className="p-12 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-sm">
 No projects found matching your criteria.
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredProjects.map((p) => (
 <div
 key={p.id}
 className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
 >
 <div className="space-y-3">
 <div className="flex items-start justify-between gap-2">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 {p.domain}
 </span>
 <span className="text-xs text-slate-500">
 Progress: {p.progress || 10}%
 </span>
 </div>

 <div>
 <h3 className="text-sm font-semibold text-slate-900">
 {p.title}
 </h3>
 <p className="text-sm text-slate-600 mt-1 line-clamp-2">
 {p.problem_statement}
 </p>
 </div>

 {/* Technologies Tag Pills */}
 {p.technologies && p.technologies.length > 0 && (
 <div className="flex flex-wrap gap-2">
 {p.technologies.slice(0, 3).map((t: string) => (
 <span
 key={t}
 className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
 >
 {t}
 </span>
 ))}
 {p.technologies.length > 3 && (
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
 +{p.technologies.length - 3} more
 </span>
 )}
 </div>
 )}
 </div>

 <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
 <span className="text-xs text-slate-500 flex items-center gap-1">
 <Share2 className="w-4 h-4 text-slate-400" /> Evidence-Grounded
 </span>
 <button
 onClick={() => router.push(`/projects/${p.id}/knowledge-graph`)}
 className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium flex items-center gap-1 shadow-sm transition-colors"
 >
 Explore Graph <ArrowRight className="w-4 h-4" />
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
