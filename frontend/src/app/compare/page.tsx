'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  Sparkles,
  Check,
  X,
  ExternalLink,
  Plus,
  Loader2,
  BookOpen,
  Database,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

function CompareContent() {
  const searchParams = useSearchParams();
  const { activeProject } = useProject();
  const idsParam = searchParams.get('ids');

  const [comparedData, setComparedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComparison() {
      setLoading(true);
      try {
        let ids: number[] = [];
        if (idsParam) {
          ids = idsParam.split(',').map(Number).filter((n) => !isNaN(n));
        }
        // If no query params provided, pull default top 3 resources from discover
        if (ids.length === 0) {
          const res = await api.discoverResources({ limit: 3 });
          ids = (res.results || []).slice(0, 3).map((r: any) => r.id);
        }

        if (ids.length > 0) {
          const compRes = await api.compareResources(ids, activeProject?.title);
          setComparedData(compRes.comparison || []);
        }
      } catch (err) {
        console.error('Error comparing resources:', err);
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, [idsParam, activeProject]);

  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="h-40 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-slate-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-semibold text-indigo-700">
            <Scale className="h-3 w-3 text-indigo-600" />
            <span>Factual Comparative Analysis Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Compare Candidate Resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Side-by-side technical evaluation across architecture, cost, licensing, and integration difficulty without biased rankings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/discover"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add More from Discover</span>
          </Link>
        </div>
      </div>

      {comparedData.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No Resources Selected for Comparison"
          description="Select 2 to 4 resources from the Resource Discovery catalogue to inspect a side-by-side architectural and licensing breakdown."
          actionLabel="Go to Resource Discovery"
          actionHref="/discover"
        />
      ) : (
        /* Comparison Table */
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="p-4 sm:p-5 font-bold text-slate-600 uppercase tracking-wider text-[11px] w-48 shrink-0">
                    Evaluation Factor
                  </th>
                  {comparedData.map((item) => (
                    <th key={item.id} className="p-4 sm:p-5 min-w-[240px]">
                      <div className="space-y-1.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                          {item.resource_type.replace('_', ' ')}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 hover:underline pt-0.5 font-medium"
                        >
                          <span>Visit Source ({item.source})</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Domain & Source */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">Domain</td>
                  {comparedData.map((item) => (
                    <td key={item.id} className="p-4 sm:p-5 text-slate-800">
                      {item.domain}
                    </td>
                  ))}
                </tr>

                {/* Technologies */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">Technology Stack</td>
                  {comparedData.map((item) => (
                    <td key={item.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap gap-1">
                        {item.technologies && item.technologies.length > 0 ? (
                          item.technologies.map((t: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-indigo-700 font-mono">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">Universal</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Cost & Licensing */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">Access / Cost</td>
                  {comparedData.map((item) => (
                    <td key={item.id} className="p-4 sm:p-5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.cost}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Open Source */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">Open Source / Code Weights</td>
                  {comparedData.map((item) => (
                    <td key={item.id} className="p-4 sm:p-5 text-slate-800">
                      {item.open_source}
                    </td>
                  ))}
                </tr>

                {/* Difficulty & Learning Curve */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">Learning Curve</td>
                  {comparedData.map((item) => (
                    <td key={item.id} className="p-4 sm:p-5 text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                        {item.difficulty}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Integration Complexity */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">Integration Complexity</td>
                  {comparedData.map((item) => (
                    <td key={item.id} className="p-4 sm:p-5 text-slate-600">
                      {item.integration_complexity}
                    </td>
                  ))}
                </tr>

                {/* Community & Citations */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">Community Metrics</td>
                  {comparedData.map((item) => (
                    <td key={item.id} className="p-4 sm:p-5 text-slate-500">
                      {item.community_adoption}
                    </td>
                  ))}
                </tr>

                {/* Best For */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-700">Best Suited For</td>
                  {comparedData.map((item) => (
                    <td key={item.id} className="p-4 sm:p-5 text-indigo-700 font-medium">
                      {item.best_for}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
