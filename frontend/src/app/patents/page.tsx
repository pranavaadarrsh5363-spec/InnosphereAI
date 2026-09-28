'use client';

import React, { useState, useEffect } from'react';
import { useRouter } from'next/navigation';
import Link from'next/link';
import {
 Scale,
 Search,
 ShieldAlert,
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
} from'lucide-react';
import { api, patentApi } from'@/lib/api';
import { Project } from'@/types';

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

 if (projRes.status ==='fulfilled') {
 const res = projRes.value;
 setProjects(Array.isArray(res) ? res : (res as any)?.items || []);
 }
 if (provRes.status ==='fulfilled') {
 setProviders(provRes.value || []);
 }
 if (flagRes.status ==='fulfilled') {
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
 const matchesDomain = selectedDomain ==='ALL' || p.domain === selectedDomain;
 return matchesSearch && matchesDomain;
 });

 return (
 <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6">
 <div className="max-w-6xl mx-auto space-y-6">
 {/* Academic Page Header */}
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
 <div className="max-w-3xl space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 <Scale className="w-3.5 h-3.5 text-slate-500" /> Evidence-Grounded Patent & Prior-Art Intelligence
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Patent & Prior-Art Explorer
 </h1>
 <p className="text-sm text-slate-600">
 Discover related patent publications, extract technical features, analyze potential overlaps, and identify technical differentiation opportunities for your innovation project.
 </p>
 </div>
 </div>

 {/* Mandatory Legal & Scientific Safety Disclaimer */}
 <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-5 flex items-start gap-3 shadow-sm">
 <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <h4 className="text-sm font-semibold text-amber-700">
 Non-Legal AI Research Disclaimer
 </h4>
 <p className="text-sm text-amber-900/80">
 This tool provides AI-assisted prior-art discovery and technical similarity analysis for research and innovation purposes. It does not provide legal advice, patentability opinions, freedom-to-operate opinions, infringement opinions, or legal conclusions. Patent decisions should be reviewed by a qualified patent professional.
 </p>
 </div>
 </div>

 {/* Provider Operational Status & Search Engines */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {providers.map((p, idx) => (
 <div
 key={idx}
 className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-sm"
 >
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <Globe className="w-4 h-4 text-slate-400" />
 <span className="text-sm font-semibold text-slate-900">
 {p.provider_name}
 </span>
 </div>
 <p className="text-xs text-slate-500">
 {p.description}
 </p>
 </div>
 <div className="flex flex-col items-end gap-1">
 <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
 p.status ==='ONLINE' ?'bg-emerald-50 text-emerald-700 border-emerald-200' :'bg-amber-50 text-amber-700 border-amber-200'
 }`}>
 {p.status}
 </span>
 <span className="text-xs text-slate-400">
 {p.latency_ms}ms
 </span>
 </div>
 </div>
 ))}
 </div>

 {/* Flagship Prior-Art Spotlight */}
 {flagshipData && (
 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-5">
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 Flagship Project Prior Art
 </span>
 <span className="text-xs text-slate-500">
 Search Coverage: <span className="font-medium text-emerald-600">{flagshipData.search_coverage_score}%</span> • {flagshipData.result_count} Identified Publications
 </span>
 </div>
 <h2 className="text-sm font-semibold text-slate-900">
 Active Prior-Art Intelligence Overview
 </h2>
 </div>
 <Link
 href={`/projects/${flagshipData.project_id}/patents`}
 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
 >
 Open Project Workspace
 <ArrowRight className="w-4 h-4" />
 </Link>
 </div>

 {/* Top Prior-Art Publications Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {flagshipData.results?.slice(0, 3).map((res: any, idx: number) => {
 const doc = res.patent;
 const simScore = Math.round(res.technical_similarity_score || 0);
 const overlapLevel = res.feature_overlap_level ||'MODERATE';
 const badgeColor =
 overlapLevel ==='HIGH'
 ?'bg-red-50 text-red-700 border-red-200'
 : overlapLevel ==='MODERATE'
 ?'bg-amber-50 text-amber-700 border-amber-200'
 :'bg-blue-50 text-blue-700 border-blue-200';

 return (
 <div
 key={idx}
 className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-4 hover:border-slate-300"
 >
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-slate-700">
 {doc?.publication_number ||'US-PATENT'}
 </span>
 <span className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeColor}`}>
 {overlapLevel} ({simScore}%)
 </span>
 </div>
 <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
 {doc?.title}
 </h3>
 <p className="text-xs text-slate-600 line-clamp-3">
 {doc?.abstract}
 </p>
 </div>

 <div className="pt-3 border-t border-slate-200 space-y-2">
 <div className="flex items-center justify-between text-xs text-slate-500">
 <span className="flex items-center gap-1">
 <Building className="w-3.5 h-3.5" />
 <span className="truncate max-w-[140px]">{doc?.assignees?.[0] ||'Public Record'}</span>
 </span>
 <span className="flex items-center gap-1">
 <Calendar className="w-3.5 h-3.5" />
 {doc?.filing_date ||'Prior Art'}
 </span>
 </div>
 {res.potential_differences?.length > 0 && (
 <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
 <span className="font-medium">Differentiation: </span>
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
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 Select Project
 </h2>
 <p className="text-xs text-slate-500">
 Choose a project to explore prior art.
 </p>
 </div>

 {/* Domain Filter */}
 <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
 <Filter className="w-4 h-4 text-slate-400 shrink-0" />
 {domains.map((dom) => (
 <button
 key={dom}
 onClick={() => setSelectedDomain(dom)}
 className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
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

 {/* Search Box */}
 <div className="relative">
 <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
 <input
 type="text"
 placeholder="Search projects..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2 rounded-md text-sm bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
 />
 </div>
 </div>

 {/* Project Cards Grid */}
 {loading ? (
 <div className="flex items-center justify-center py-16">
 <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
 </div>
 ) : filteredProjects.length === 0 ? (
 <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-3">
 <p className="text-sm text-slate-500">No projects match your search criteria.</p>
 <Link
 href="/submit-idea"
 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
 >
 Submit Idea
 </Link>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredProjects.map((p) => (
 <div
 key={p.id}
 className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 shadow-sm"
 >
 <div className="space-y-3">
 <div className="flex items-center justify-between gap-2">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 {p.domain ||'Technology'}
 </span>
 <span className="text-xs text-slate-500">
 #{p.id}
 </span>
 </div>

 <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
 {p.title}
 </h3>

 <p className="text-xs text-slate-600 line-clamp-2">
 {p.problem_statement || p.description}
 </p>

 {p.technologies && p.technologies.length > 0 && (
 <div className="flex flex-wrap gap-1 pt-1">
 {p.technologies.slice(0, 3).map((t, idx) => (
 <span
 key={idx}
 className="px-2 py-0.5 rounded text-xs bg-slate-50 text-slate-600 border border-slate-200"
 >
 {t}
 </span>
 ))}
 {p.technologies.length > 3 && (
 <span className="text-xs text-slate-400 self-center">
 +{p.technologies.length - 3}
 </span>
 )}
 </div>
 )}
 </div>

 <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
 <Scale className="w-3.5 h-3.5" />
 Prior-Art Ready
 </div>
 <Link
 href={`/projects/${p.id}/patents`}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
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
 <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 space-y-4">
 <div className="space-y-1">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <BookOpen className="w-4 h-4 text-slate-500" />
 How Prior-Art Discovery Works
 </h3>
 <p className="text-xs text-slate-500">
 Our methodology combines technical concept extraction, CPC classification mapping, and semantic similarity.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
 {[
 { num:'01', title:'Exact Concept', desc:'Queries exact technical solution phrasing.' },
 { num:'02', title:'Components', desc:'Deconstructs project into subsystems.' },
 { num:'03', title:'Problem-Solution', desc:'Identifies patents addressing identical problems.' },
 { num:'04', title:'Broader Prior Art', desc:'Explores adjacent technologies.' },
 { num:'05', title:'Differentiation', desc:'Highlights novel features and differences.' },
 ].map((stage, idx) => (
 <div
 key={idx}
 className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5"
 >
 <span className="text-xs font-semibold text-slate-500">
 STAGE {stage.num}
 </span>
 <h4 className="text-xs font-semibold text-slate-900">
 {stage.title}
 </h4>
 <p className="text-xs text-slate-600">
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
