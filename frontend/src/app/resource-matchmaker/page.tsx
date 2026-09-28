'use client';

import React, { useState, useEffect } from'react';
import { useRouter } from'next/navigation';
import Link from'next/link';
import {
 SlidersHorizontal,
 Search,
 ArrowRight,
 RefreshCw,
 DollarSign,
 TrendingDown,
 Cpu,
 Gauge,
 Wallet,
 ChevronRight,
} from'lucide-react';
import { api, resourceMatchmakerApi } from'@/lib/api';
import { Project } from'@/types';

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

 if (projRes.status ==='fulfilled') {
 const res = projRes.value;
 setProjects(Array.isArray(res) ? res : (res as any)?.items || []);
 }
 if (healthRes.status ==='fulfilled') {
 setHealthData(healthRes.value || null);
 }
 if (flagRes.status ==='fulfilled') {
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
 const matchesDomain = selectedDomain ==='ALL' || p.domain === selectedDomain;
 return matchesSearch && matchesDomain;
 });

 return (
 <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
 <div className="max-w-6xl mx-auto space-y-6">
 {/* Header */}
 <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
 <div className="max-w-3xl space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Resource Matchmaker
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Resource Allocation Engine
 </h1>
 <p className="text-sm text-slate-600">
 Match your innovation project with verified open-source models, edge hardware, sensor specs, benchmark datasets, and institutional cloud tiers.
 </p>
 </div>
 </div>

 {/* 4 Pillars Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
 <DollarSign className="w-5 h-5 text-slate-500" />
 <h3 className="font-semibold text-sm text-slate-900">Budget Guardrails</h3>
 <p className="text-xs text-slate-600">
 Evaluates hard spending limits across Hardware and Cloud.
 </p>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
 <Cpu className="w-5 h-5 text-slate-500" />
 <h3 className="font-semibold text-sm text-slate-900">Hardware Sizing</h3>
 <p className="text-xs text-slate-600">
 Matches workloads against microcontrollers and edge devices.
 </p>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
 <TrendingDown className="w-5 h-5 text-slate-500" />
 <h3 className="font-semibold text-sm text-slate-900">Open-Source</h3>
 <p className="text-xs text-slate-600">
 Identifies zero-cost tools and quantized models.
 </p>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
 <Gauge className="w-5 h-5 text-slate-500" />
 <h3 className="font-semibold text-sm text-slate-900">Simulations</h3>
 <p className="text-xs text-slate-600">
 Simulate hypothetical cuts and edge constraints.
 </p>
 </div>
 </div>

 {/* Flagship Demonstration */}
 {flagshipData && (
 <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
 <div>
 <h2 className="text-sm font-semibold text-slate-900">
 {flagshipData.project_title}
 </h2>
 <p className="text-xs text-slate-600 mt-1">
 Budget: ₹{flagshipData.profile?.total_budget?.toLocaleString() ||'10,000'} | Target: {flagshipData.profile?.open_source_preference ||'Open Source'}
 </p>
 </div>
 <Link
 href={`/projects/${flagshipData.project_id}/resource-matchmaker`}
 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm"
 >
 <span>View Allocation</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </Link>
 </div>

 {flagshipData.matches && flagshipData.matches.length > 0 && (
 <div className="space-y-2">
 <span className="text-xs font-semibold text-slate-500">
 Top Resources:
 </span>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 {flagshipData.matches.slice(0, 3).map((m: any) => (
 <div
 key={m.id || m.resource_name}
 className="p-3 rounded-md border border-slate-200 bg-slate-50 space-y-2"
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-slate-900 truncate">
 {m.resource_name}
 </span>
 <span className="text-xs text-slate-500 font-medium">
 {m.overall_match_score?.toFixed(0) ||'90'}% Match
 </span>
 </div>
 <div className="text-xs text-slate-600">
 ₹{m.estimated_cost || 0} ({m.price_evidence_status})
 </div>
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
 <h2 className="text-sm font-semibold text-slate-900">
 Select a Project
 </h2>

 <div className="flex items-center gap-2">
 <div className="relative">
 <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1.5" />
 <input
 type="text"
 placeholder="Search..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-8 pr-3 py-1.5 rounded-md text-xs bg-white border border-slate-200 focus:outline-none focus:border-indigo-500 w-40 sm:w-56"
 />
 </div>

 <select
 value={selectedDomain}
 onChange={(e) => setSelectedDomain(e.target.value)}
 className="px-2 py-1.5 rounded-md text-xs bg-white border border-slate-200 focus:outline-none focus:border-indigo-500"
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
 <div className="py-12 text-center text-sm text-slate-500">
 Loading projects...
 </div>
 ) : filteredProjects.length === 0 ? (
 <div className="text-center py-10 bg-white rounded-lg border border-slate-200 p-6 space-y-2">
 <p className="text-sm text-slate-600">No projects found.</p>
 <Link
 href="/submit-idea"
 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium"
 >
 Submit Project
 </Link>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredProjects.map((p) => (
 <Link
 key={p.id}
 href={`/projects/${p.id}/resource-matchmaker`}
 className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 p-4 shadow-sm flex flex-col justify-between space-y-4"
 >
 <div className="space-y-2">
 <div className="flex items-center justify-between gap-2">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 {p.domain}
 </span>
 <span className="text-xs text-slate-500">
 Stage: {(p as any).stage || p.status ||'Prototyping'}
 </span>
 </div>

 <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">
 {p.title}
 </h3>
 </div>

 <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
 <div className="flex items-center gap-1 text-slate-500">
 <Wallet className="w-3.5 h-3.5" />
 <span>Budget Allocator</span>
 </div>

 <span className="inline-flex items-center gap-1 font-medium text-indigo-600">
 Open <ChevronRight className="w-3.5 h-3.5" />
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
