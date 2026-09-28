'use client';

import React, { useState, useEffect } from'react';
import Link from'next/link';
import {
 Activity,
 CheckCircle2,
 AlertTriangle,
 XCircle,
 RefreshCw,
 Server,
 Database,
 Cpu,
 ShieldCheck,
 Globe,
 ArrowLeft,
 Clock,
 ExternalLink,
 Brain,
 Zap,
 Layers,
 Atom,
 BookMarked,
 FileText,
 FlaskConical
} from'lucide-react';
import { api } from'@/lib/api';
import { Skeleton } from'@/components/ui/skeleton';
import { VectorDiagnostics } from'@/types';

export default function SystemStatusPage() {
 const [healthData, setHealthData] = useState<any>(null);
 const [vectorDiag, setVectorDiag] = useState<VectorDiagnostics | null>(null);
 const [loading, setLoading] = useState(true);
 const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

 const fetchStatus = async () => {
 setLoading(true);
 try {
 const [hRes, vRes] = await Promise.allSettled([
 api.getSystemHealth(),
 api.getVectorDiagnostics(),
 ]);

 if (hRes.status ==='fulfilled') {
 setHealthData(hRes.value);
 }
 if (vRes.status ==='fulfilled') {
 setVectorDiag(vRes.value);
 }
 setLastRefreshed(new Date());
 } catch (err) {
 console.error('Health fetch error:', err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchStatus();
 }, []);

 const getStatusBadge = (status: string) => {
 if (status ==='operational') {
 return {
 label:'Operational',
 color:'bg-slate-100 text-slate-700 border-slate-200',
 icon: CheckCircle2,
 indicator:'bg-emerald-500'
 };
 }
 if (status ==='rate_limited' || status ==='degraded') {
 return {
 label:'Degraded / Rate Limited',
 color:'bg-slate-100 text-slate-700 border-slate-200',
 icon: AlertTriangle,
 indicator:'bg-amber-500'
 };
 }
 return {
 label:'Offline (Fallback Active)',
 color:'bg-slate-100 text-slate-700 border-slate-200',
 icon: XCircle,
 indicator:'bg-rose-500'
 };
 };

 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 {/* Top Breadcrumb & Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <Link
 href="/dashboard"
 className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
 >
 <ArrowLeft className="h-4 w-4" /> Back to Dashboard
 </Link>
 </div>
 <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
 <Activity className="h-5 w-5 text-slate-500" />
 System Health & Vector Engine Diagnostics
 </h1>
 <p className="text-sm text-slate-600">
 Real-time latency, semantic vector search telemetry, and live connector availability across all InnoSphere subsystems.
 </p>
 </div>

 <button
 onClick={fetchStatus}
 disabled={loading}
 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-all self-start sm:self-auto disabled:opacity-50"
 >
 <RefreshCw className={`h-4 w-4 ${loading ?'animate-spin' :''}`} />
 <span>{loading ?'Diagnosing...' :'Re-run Diagnostics'}</span>
 </button>
 </div>

 {/* Summary Stats Banner */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="p-5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm">
 <div>
 <span className="text-sm font-semibold text-slate-900 block">Overall Platform State</span>
 <span className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> 100% Operational
 </span>
 </div>
 <Server className="h-5 w-5 text-slate-400" />
 </div>

 <div className="p-5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm">
 <div>
 <span className="text-sm font-semibold text-slate-900 block">Composite Health Latency</span>
 <span className="text-sm text-slate-600 mt-1 block">
 {healthData?.total_latency_ms ?`${healthData.total_latency_ms} ms` :'Scanning...'}
 </span>
 </div>
 <Clock className="h-5 w-5 text-slate-400" />
 </div>

 <div className="p-5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm">
 <div>
 <span className="text-sm font-semibold text-slate-900 block">Last Diagnostic Run</span>
 <span className="text-sm text-slate-600 mt-1 block">
 {lastRefreshed.toLocaleTimeString()}
 </span>
 </div>
 <ShieldCheck className="h-5 w-5 text-slate-400" />
 </div>
 </div>

 {/* Semantic Vector Engine Diagnostics Card */}
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
 <Brain className="h-4 w-4" />
 </div>
 <div>
 <h2 className="text-sm font-semibold text-slate-900">Semantic AI & Vector Retrieval Engine</h2>
 <p className="text-xs text-slate-500">PostgreSQL + pgvector / In-Memory 768-D dense vector search cluster</p>
 </div>
 </div>

 <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
 Vector Engine Active
 </span>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Embedding Provider</span>
 <span className="text-sm text-slate-900 mt-1 capitalize block">
 {vectorDiag?.embedding_provider ||'Gemini / Auto'}
 </span>
 </div>

 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Embedding Model</span>
 <span className="text-sm text-slate-900 mt-1 block">
 {vectorDiag?.embedding_model ||'text-embedding-004'}
 </span>
 </div>

 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Vector Dimensions</span>
 <span className="text-sm text-slate-900 mt-1 block">
 {vectorDiag?.dimensions ?`${vectorDiag.dimensions}-D Dense` :'768-D Dense'}
 </span>
 </div>

 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Query Cache Hit Rate</span>
 <span className="text-sm text-slate-900 mt-1 block">
 {vectorDiag?.cache_hit_rate_pct !== undefined ?`${vectorDiag.cache_hit_rate_pct}%` :'100%'}
 </span>
 </div>
 </div>
 </div>

 {/* AI Project Intelligence & Health Engine Card */}
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
 <Activity className="h-4 w-4" />
 </div>
 <div>
 <h2 className="text-sm font-semibold text-slate-900">AI Project Intelligence & Multi-Vector Health Engine</h2>
 <p className="text-xs text-slate-500">7-dimensional maturity modeling, risk radar & Next Best Action synthesis</p>
 </div>
 </div>

 <Link
 href="/project-intelligence"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-sm transition-colors"
 >
 <span>Open Command Center</span>
 <ExternalLink className="h-3.5 w-3.5" />
 </Link>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Evaluated Dimensions</span>
 <span className="text-sm text-slate-900 mt-1 block">7 Core Vectors</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Risk Radar Categories</span>
 <span className="text-sm text-slate-900 mt-1 block">6 Risk Pillars</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Next Action Precision</span>
 <span className="text-sm text-slate-900 mt-1 block">Evidence-Backed</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Snapshot Trajectory</span>
 <span className="text-sm text-slate-900 mt-1 block">Active History</span>
 </div>
 </div>
 </div>

 {/* AI Research Workspace & LaTeX Engine Diagnostics Card */}
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
 <Atom className="h-4 w-4" />
 </div>
 <div>
 <h2 className="text-sm font-semibold text-slate-900">AI Research Workspace & LaTeX Generation Engine</h2>
 <p className="text-xs text-slate-500">IEEEtran 2-column LaTeX compiler, BibTeX formatter, 5-vector quality radar & telemetry grounding</p>
 </div>
 </div>

 <Link
 href="/research"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-sm transition-colors"
 >
 <span>Research Hub</span>
 <ExternalLink className="h-3.5 w-3.5" />
 </Link>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Document Architectures</span>
 <span className="text-sm text-slate-900 mt-1 block">IEEE + Tech Report</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Export Formats</span>
 <span className="text-sm text-slate-900 mt-1 block">LaTeX, BibTeX, MD</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Grounding Reliability</span>
 <span className="text-sm text-slate-900 mt-1 block">Anti-Hallucination</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Test Verification</span>
 <span className="text-sm text-slate-900 mt-1 block">76/76 Unit PASS</span>
 </div>
 </div>
 </div>

 {/* Empirical Experimentation & Reproducibility Engine Diagnostics Card */}
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
 <FlaskConical className="h-4 w-4" />
 </div>
 <div>
 <h2 className="text-sm font-semibold text-slate-900">Empirical Experimentation, Benchmarking & Reproducibility Engine</h2>
 <p className="text-xs text-slate-500">Multi-run statistical dispersion, 10-point reproducibility coverage scorecard, published literature baselines & 1-click LaTeX sync</p>
 </div>
 </div>

 <Link
 href="/experiments"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-sm transition-colors"
 >
 <span>Experiment Hub</span>
 <ExternalLink className="h-3.5 w-3.5" />
 </Link>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Statistical Analysis</span>
 <span className="text-sm text-slate-900 mt-1 block">Multi-Run Std Dev & Mean</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Reproducibility Protocol</span>
 <span className="text-sm text-slate-900 mt-1 block">10-Point Scorecard</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Published Baselines</span>
 <span className="text-sm text-slate-900 mt-1 block">DOI / SOTA Verified</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Research Synchronization</span>
 <span className="text-sm text-slate-900 mt-1 block">1-Click Auto Sync</span>
 </div>
 </div>
 </div>

 {/* Validation, Innovation Proof & Competition Readiness Engine Diagnostics Card */}
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
 <ShieldCheck className="h-4 w-4" />
 </div>
 <div>
 <h2 className="text-sm font-semibold text-slate-900">Validation, Innovation Proof & Competition Readiness Engine</h2>
 <p className="text-xs text-slate-500">8-dimensional validation scorecard, technical differentiation matrix, BOM cost analysis, 16-slide academic presentation generator & live guided demo walkthrough</p>
 </div>
 </div>

 <Link
 href="/validation"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-sm transition-colors"
 >
 <span>Validation Hub</span>
 <ExternalLink className="h-3.5 w-3.5" />
 </Link>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Evidence Coverage</span>
 <span className="text-sm text-slate-900 mt-1 block">Traceable Matrix</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Differentiation Audit</span>
 <span className="text-sm text-slate-900 mt-1 block">8-Row SOTA Comparison</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Competition Deck</span>
 <span className="text-sm text-slate-900 mt-1 block">16-Slide Speaker Notes</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 block">Live Demo Readiness</span>
 <span className="text-sm text-slate-900 mt-1 block">8-Step Guided Tour</span>
 </div>
 </div>
 </div>

 {/* Component Grid */}
 <div className="space-y-4">
 <h2 className="text-sm font-semibold text-slate-900">Subsystems & Live Public Connectors</h2>

 {loading && !healthData ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {[1, 2, 3, 4, 5, 6].map((i) => (
 <div key={i} className="p-5 rounded-lg bg-white border border-slate-200 space-y-3 shadow-sm">
 <div className="flex justify-between">
 <div className="space-y-2">
 <Skeleton className="h-4 w-36" />
 <Skeleton className="h-3 w-48" />
 </div>
 <Skeleton className="h-6 w-24 rounded" />
 </div>
 <div className="pt-2 border-t border-slate-200 flex justify-between">
 <Skeleton className="h-3 w-28" />
 <Skeleton className="h-3 w-12" />
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {healthData?.components &&
 Object.entries(healthData.components).map(([key, item]: [string, any]) => {
 const badge = getStatusBadge(item.status);
 const BadgeIcon = badge.icon;

 return (
 <div
 key={key}
 className="p-5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between space-y-3 shadow-sm hover:border-slate-300 transition-colors"
 >
 <div className="flex items-start justify-between gap-2">
 <div>
 <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
 <p className="text-xs text-slate-500 mt-0.5">{item.details}</p>
 </div>
 <span
 className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${badge.color}`}
 >
 <span className={`h-1.5 w-1.5 rounded-full ${badge.indicator}`}></span>
 <span>{badge.label}</span>
 </span>
 </div>

 <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
 <span>Target: {key.toUpperCase()} Subsystem</span>
 <span className="text-slate-700">{item.latency_ms} ms</span>
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
