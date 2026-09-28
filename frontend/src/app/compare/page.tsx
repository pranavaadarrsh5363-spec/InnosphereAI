'use client';

import React, { useEffect, useState, Suspense } from'react';
import { useSearchParams } from'next/navigation';
import Link from'next/link';
import {
 Scale,
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
} from'lucide-react';
import { api } from'@/lib/api';
import { useProject } from'@/lib/project-context';
import { SkeletonCard } from'@/components/ui/skeleton';
import { EmptyState } from'@/components/ui/empty-state';

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
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 <div className="h-40 rounded-lg bg-slate-50 border border-slate-200" />
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <SkeletonCard />
 <SkeletonCard />
 <SkeletonCard />
 </div>
 </div>
 );
 }

 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 {/* Header */}
 <div className="rounded-lg bg-slate-50 border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
 <div className="space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700">
 <Scale className="h-4 w-4 text-indigo-600" />
 <span>Factual Comparative Analysis Matrix</span>
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Compare Candidate Resources
 </h1>
 <p className="text-sm text-slate-600 max-w-2xl">
 Side-by-side technical evaluation across architecture, cost, licensing, and integration difficulty without biased rankings.
 </p>
 </div>

 <div className="flex items-center gap-3">
 <Link
 href="/discover"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
 >
 <Plus className="h-4 w-4" />
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
 <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm border-collapse">
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50">
 <th className="p-4 sm:p-5 font-medium text-slate-500 uppercase text-xs w-48 shrink-0">
 Evaluation Factor
 </th>
 {comparedData.map((item) => (
 <th key={item.id} className="p-4 sm:p-5 min-w-[240px]">
 <div className="space-y-1.5">
 <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 capitalize">
 {item.resource_type.replace('_','')}
 </span>
 <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
 <a
 href={item.url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:underline pt-0.5 font-medium"
 >
 <span>Visit Source ({item.source})</span>
 <ExternalLink className="h-3 w-3" />
 </a>
 </div>
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {/* Domain & Source */}
 <tr className="hover:bg-slate-50 transition-colors">
 <td className="p-4 sm:p-5 font-medium text-slate-900 text-sm">Domain</td>
 {comparedData.map((item) => (
 <td key={item.id} className="p-4 sm:p-5 text-sm text-slate-600">
 {item.domain}
 </td>
 ))}
 </tr>

 {/* Technologies */}
 <tr className="hover:bg-slate-50 transition-colors">
 <td className="p-4 sm:p-5 font-medium text-slate-900 text-sm">Technology Stack</td>
 {comparedData.map((item) => (
 <td key={item.id} className="p-4 sm:p-5">
 <div className="flex flex-wrap gap-1">
 {item.technologies && item.technologies.length > 0 ? (
 item.technologies.map((t: string, i: number) => (
 <span key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs text-slate-700">
 {t}
 </span>
 ))
 ) : (
 <span className="text-slate-400 text-sm">Universal</span>
 )}
 </div>
 </td>
 ))}
 </tr>

 {/* Cost & Licensing */}
 <tr className="hover:bg-slate-50 transition-colors">
 <td className="p-4 sm:p-5 font-medium text-slate-900 text-sm">Access / Cost</td>
 {comparedData.map((item) => (
 <td key={item.id} className="p-4 sm:p-5">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 {item.cost}
 </span>
 </td>
 ))}
 </tr>

 {/* Open Source */}
 <tr className="hover:bg-slate-50 transition-colors">
 <td className="p-4 sm:p-5 font-medium text-slate-900 text-sm">Open Source / Code Weights</td>
 {comparedData.map((item) => (
 <td key={item.id} className="p-4 sm:p-5 text-sm text-slate-600">
 {item.open_source}
 </td>
 ))}
 </tr>

 {/* Difficulty & Learning Curve */}
 <tr className="hover:bg-slate-50 transition-colors">
 <td className="p-4 sm:p-5 font-medium text-slate-900 text-sm">Learning Curve</td>
 {comparedData.map((item) => (
 <td key={item.id} className="p-4 sm:p-5 text-sm text-slate-600">
 <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
 {item.difficulty}
 </span>
 </td>
 ))}
 </tr>

 {/* Integration Complexity */}
 <tr className="hover:bg-slate-50 transition-colors">
 <td className="p-4 sm:p-5 font-medium text-slate-900 text-sm">Integration Complexity</td>
 {comparedData.map((item) => (
 <td key={item.id} className="p-4 sm:p-5 text-sm text-slate-600">
 {item.integration_complexity}
 </td>
 ))}
 </tr>

 {/* Community & Citations */}
 <tr className="hover:bg-slate-50 transition-colors">
 <td className="p-4 sm:p-5 font-medium text-slate-900 text-sm">Community Metrics</td>
 {comparedData.map((item) => (
 <td key={item.id} className="p-4 sm:p-5 text-sm text-slate-600">
 {item.community_adoption}
 </td>
 ))}
 </tr>

 {/* Best For */}
 <tr className="hover:bg-slate-50 transition-colors">
 <td className="p-4 sm:p-5 font-medium text-slate-900 text-sm">Best Suited For</td>
 {comparedData.map((item) => (
 <td key={item.id} className="p-4 sm:p-5 text-sm text-indigo-700 font-medium">
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
