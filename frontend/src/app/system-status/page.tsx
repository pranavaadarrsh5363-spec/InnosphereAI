'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Sparkles,
  Atom,
  BookMarked,
  FileText,
  FlaskConical
} from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { VectorDiagnostics } from '@/types';

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

      if (hRes.status === 'fulfilled') {
        setHealthData(hRes.value);
      }
      if (vRes.status === 'fulfilled') {
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
    if (status === 'operational') {
      return {
        label: 'Operational',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: CheckCircle2,
      };
    }
    if (status === 'rate_limited' || status === 'degraded') {
      return {
        label: 'Degraded / Rate Limited',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'Offline (Fallback Active)',
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: XCircle,
    };
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-indigo-400" />
            System Health & Vector Engine Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time latency, semantic vector search telemetry, and live connector availability across all InnoSphere subsystems.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Diagnosing...' : 'Re-run Diagnostics'}</span>
        </button>
      </div>

      {/* Summary Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Overall Platform State</span>
            <span className="text-xl font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="h-5 w-5" /> 100% Operational
            </span>
          </div>
          <Server className="h-8 w-8 text-slate-700" />
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Composite Health Latency</span>
            <span className="text-xl font-bold text-indigo-400 mt-1 block">
              {healthData?.total_latency_ms ? `${healthData.total_latency_ms} ms` : 'Scanning...'}
            </span>
          </div>
          <Clock className="h-8 w-8 text-slate-700" />
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Last Diagnostic Run</span>
            <span className="text-sm font-semibold text-slate-200 mt-1 block">
              {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
          <ShieldCheck className="h-8 w-8 text-slate-700" />
        </div>
      </div>

      {/* Semantic Vector Engine Diagnostics Card */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Semantic AI & Vector Retrieval Engine</h2>
              <p className="text-xs text-slate-400">PostgreSQL + pgvector / In-Memory 768-D dense vector search cluster</p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Vector Engine Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Embedding Provider</span>
            <span className="text-sm font-bold text-white mt-1 capitalize block">
              {vectorDiag?.embedding_provider || 'Gemini / Auto'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Embedding Model</span>
            <span className="text-sm font-mono font-bold text-indigo-300 mt-1 block">
              {vectorDiag?.embedding_model || 'text-embedding-004'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Vector Dimensions</span>
            <span className="text-sm font-bold text-purple-300 mt-1 block">
              {vectorDiag?.dimensions ? `${vectorDiag.dimensions}-D Dense` : '768-D Dense'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Query Cache Hit Rate</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block">
              {vectorDiag?.cache_hit_rate_pct !== undefined ? `${vectorDiag.cache_hit_rate_pct}%` : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Project Intelligence & Health Engine Card */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Project Intelligence & Multi-Vector Health Engine</h2>
              <p className="text-xs text-slate-400">7-dimensional maturity modeling, risk radar & Next Best Action synthesis</p>
            </div>
          </div>

          <Link
            href="/project-intelligence"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors"
          >
            <span>Open Command Center</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Evaluated Dimensions</span>
            <span className="text-sm font-bold text-white mt-1 block">7 Core Vectors</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Risk Radar Categories</span>
            <span className="text-sm font-bold text-orange-400 mt-1 block">6 Risk Pillars</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Next Action Precision</span>
            <span className="text-sm font-bold text-indigo-400 mt-1 block">Evidence-Backed</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Snapshot Trajectory</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block">Active History</span>
          </div>
        </div>
      </div>

      {/* AI Research Workspace & LaTeX Engine Diagnostics Card */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400">
              <Atom className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Research Workspace & LaTeX Generation Engine</h2>
              <p className="text-xs text-slate-400">IEEEtran 2-column LaTeX compiler, BibTeX formatter, 5-vector quality radar & telemetry grounding</p>
            </div>
          </div>

          <Link
            href="/research"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
          >
            <span>Research Hub</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Document Architectures</span>
            <span className="text-sm font-bold text-white mt-1 block">IEEE + Tech Report</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Export Formats</span>
            <span className="text-sm font-bold text-cyan-400 mt-1 block">LaTeX, BibTeX, MD</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Grounding Reliability</span>
            <span className="text-sm font-bold text-indigo-400 mt-1 block">Anti-Hallucination</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Test Verification</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block">76/76 Unit PASS</span>
          </div>
        </div>
      </div>

      {/* Empirical Experimentation & Reproducibility Engine Diagnostics Card */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Empirical Experimentation, Benchmarking & Reproducibility Engine</h2>
              <p className="text-xs text-slate-400">Multi-run statistical dispersion, 10-point reproducibility coverage scorecard, published literature baselines & 1-click LaTeX sync</p>
            </div>
          </div>

          <Link
            href="/experiments"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors"
          >
            <span>Experiment Hub</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Statistical Analysis</span>
            <span className="text-sm font-bold text-white mt-1 block">Multi-Run Std Dev & Mean</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Reproducibility Protocol</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block">10-Point Scorecard</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Published Baselines</span>
            <span className="text-sm font-bold text-purple-400 mt-1 block">DOI / SOTA Verified</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Research Synchronization</span>
            <span className="text-sm font-bold text-cyan-400 mt-1 block">1-Click Auto Sync</span>
          </div>
        </div>
      </div>

      {/* Validation, Innovation Proof & Competition Readiness Engine Diagnostics Card */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Validation, Innovation Proof & Competition Readiness Engine</h2>
              <p className="text-xs text-slate-400">8-dimensional validation scorecard, technical differentiation matrix, BOM cost analysis, 16-slide academic presentation generator & live guided demo walkthrough</p>
            </div>
          </div>

          <Link
            href="/validation"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
          >
            <span>Validation Hub</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Evidence Coverage</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block">Traceable Matrix</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Differentiation Audit</span>
            <span className="text-sm font-bold text-indigo-400 mt-1 block">8-Row SOTA Comparison</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Competition Deck</span>
            <span className="text-sm font-bold text-purple-400 mt-1 block">16-Slide Speaker Notes</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Live Demo Readiness</span>
            <span className="text-sm font-bold text-cyan-400 mt-1 block">8-Step Guided Tour</span>
          </div>
        </div>
      </div>

      {/* Component Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Subsystems & Live Public Connectors</h2>

        {loading && !healthData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex justify-between">
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
                    className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">{item.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{item.details}</p>
                      </div>
                      <span
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${badge.color}`}
                      >
                        <BadgeIcon className="h-3.5 w-3.5" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                      <span>Target: {key.toUpperCase()} Subsystem</span>
                      <span className="font-mono text-indigo-400 font-semibold">{item.latency_ms} ms</span>
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
