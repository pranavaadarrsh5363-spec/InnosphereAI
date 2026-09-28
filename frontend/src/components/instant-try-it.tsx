'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  ArrowRight,
  ExternalLink,
  BookOpen,
  GitBranch,
  Cpu,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Search,
  Tag,
  Compass,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';

interface PreviewResource {
  title: string;
  source: string;
  link: string;
}

interface PreviewResult {
  refined_summary: string;
  suggested_keywords: string[];
  top_resources: PreviewResource[];
  detected_innovation_gap: string;
}

const EXAMPLE_IDEAS = [
  'IoT water sensor mesh for rural early pathogen warning',
  'Edge AI vision system for automated crop disease diagnosis',
  'Decentralized solar microgrid with predictive demand forecasting',
];

export function InstantTryIt() {
  const [idea, setIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = (textToAnalyze || idea).trim();
    if (!text || text.length < 3) {
      setError('Please enter at least 3 characters describing your idea.');
      return;
    }

    if (text.length > 500) {
      setError('Idea description must be under 500 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);

    try {
      const data = await api.previewIdea(text);
      setResult({
        refined_summary: data.refined_summary || data.summary || '',
        suggested_keywords: data.suggested_keywords || data.keywords || [],
        top_resources: data.top_resources || data.resources || [],
        detected_innovation_gap: data.detected_innovation_gap || data.innovation_gap || '',
      });
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        setIsRateLimited(true);
        setError('Rate limit reached (5 preview analyses per hour). Sign in for unlimited analyses or retry later.');
      } else {
        setError(err.message || 'We could not analyze this idea right now. Please check your network and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExample = (example: string) => {
    setIdea(example);
    setError(null);
    handleAnalyze(example);
  };

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('arxiv') || s.includes('paper') || s.includes('crossref')) {
      return BookOpen;
    }
    if (s.includes('github') || s.includes('code') || s.includes('repo')) {
      return GitBranch;
    }
    if (s.includes('hugging') || s.includes('model')) {
      return Cpu;
    }
    if (s.includes('kaggle') || s.includes('dataset') || s.includes('openalex')) {
      return Database;
    }
    return Layers;
  };

  return (
    <div className="w-full text-left bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Lightbulb className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              Instant Idea Preview
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              No sign-in required
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Type a one-line hypothesis or concept to generate an instant research synthesis and gap analysis.
          </p>
        </div>
      </div>

      {/* Example Chips */}
      <div className="mb-3">
        <div className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
          <span>Try an example:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_IDEAS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExample(ex)}
              disabled={isLoading}
              className="text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded px-2.5 py-1 transition-colors text-left cursor-pointer disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAnalyze();
        }}
        className="space-y-3"
      >
        <div className="relative">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value.slice(0, 500))}
            placeholder="e.g., Low-cost wearable ECG sensor mesh with on-device anomaly detection for rural cardiac patients..."
            rows={3}
            disabled={isLoading}
            maxLength={500}
            className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md p-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none transition-colors outline-none"
          />
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1 px-1">
            <span>Press Analyze or select a sample idea above</span>
            <span className={idea.length >= 480 ? 'text-amber-600 font-medium' : ''}>
              {idea.length}/500
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          {idea && (
            <button
              type="button"
              onClick={() => {
                setIdea('');
                setResult(null);
                setError(null);
              }}
              disabled={isLoading}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Clear input
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !idea.trim() || idea.trim().length < 3}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing Concept...</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="mt-4 p-3.5 rounded-md bg-rose-50 border border-rose-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{isRateLimited ? 'Rate Limit Notice' : 'Analysis Failed'}</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAnalyze()}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !result && (
        <div className="mt-5 space-y-4 pt-4 border-t border-slate-100 animate-pulse">
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/4" />
            <div className="h-16 bg-slate-100 rounded-md" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/5" />
            <div className="flex gap-2">
              <div className="h-6 bg-slate-200 rounded w-24" />
              <div className="h-6 bg-slate-200 rounded w-28" />
              <div className="h-6 bg-slate-200 rounded w-32" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/4" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="h-20 bg-slate-100 rounded-md" />
              <div className="h-20 bg-slate-100 rounded-md" />
              <div className="h-20 bg-slate-100 rounded-md" />
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {result && !isLoading && (
        <div className="mt-5 pt-5 border-t border-slate-200 space-y-4">
          {/* 1. Refined Summary */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Refined Concept Summary</span>
            </div>
            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {result.refined_summary}
            </div>
          </div>

          {/* 2. Suggested Keywords */}
          {result.suggested_keywords && result.suggested_keywords.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-1.5">
                <Tag className="h-3.5 w-3.5 text-indigo-600" />
                <span>Key Technical Domains & Keywords</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.suggested_keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. Top Resources */}
          {result.top_resources && result.top_resources.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Compass className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Top Scientific & Engineering Resources</span>
                </div>
                <span className="text-xs text-slate-400">Open-access links</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {result.top_resources.map((res, i) => {
                  const Icon = getSourceIcon(res.source);
                  return (
                    <a
                      key={i}
                      href={res.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-md bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            <Icon className="h-3 w-3" />
                            {res.source}
                          </span>
                          <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                        </div>
                        <p className="text-xs font-medium text-slate-900 line-clamp-2 mt-1">
                          {res.title}
                        </p>
                      </div>
                      <span className="text-[11px] text-indigo-600 font-medium mt-2 group-hover:underline">
                        View record →
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Detected Innovation Gap */}
          {result.detected_innovation_gap && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>Detected Innovation Gap & Research Opportunity</span>
              </div>
              <div className="p-3 rounded-md bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                {result.detected_innovation_gap}
              </div>
            </div>
          )}

          {/* 5. Call to Action — 10-Phase Roadmap */}
          <div className="mt-4 p-4 rounded-md bg-indigo-50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-indigo-950">
                Sign up to get the full 10-phase roadmap
              </p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Unlock automated experimental ledgers, IEEE document generation, and hardware lab telemetry.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors"
              >
                <span>Get Full Roadmap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
