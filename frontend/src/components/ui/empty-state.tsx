'use client';

import React from'react';
import Link from'next/link';
import { LucideIcon, ArrowRight } from'lucide-react';

interface EmptyStateProps {
 icon: LucideIcon;
 title: string;
 description: string;
 actionLabel?: string;
 actionHref?: string;
 onAction?: () => void;
 badge?: string;
}

export function EmptyState({
 icon: Icon,
 title,
 description,
 actionLabel,
 actionHref,
 onAction,
 badge,
}: EmptyStateProps) {
 return (
 <div className="bg-white rounded-lg p-8 text-center max-w-md mx-auto border border-slate-200 shadow-sm space-y-3">
 <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
 <Icon className="h-5 w-5" />
 </div>

 {badge && (
 <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
 {badge}
 </span>
 )}

 <div className="space-y-1">
 <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
 <p className="text-sm text-slate-500 max-w-sm mx-auto">
 {description}
 </p>
 </div>

 {actionLabel && (
 <div className="pt-1">
 {actionHref ? (
 <Link
 href={actionHref}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
 >
 <span>{actionLabel}</span>
 <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 ) : onAction ? (
 <button
 onClick={onAction}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
 >
 <span>{actionLabel}</span>
 <ArrowRight className="h-3.5 w-3.5" />
 </button>
 ) : null}
 </div>
 )}
 </div>
 );
}
