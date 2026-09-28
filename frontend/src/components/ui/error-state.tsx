'use client';

import React from'react';
import { AlertCircle, RefreshCw } from'lucide-react';

interface ErrorStateProps {
 title?: string;
 message?: string;
 onRetry?: () => void;
 isRetrying?: boolean;
}

export function ErrorState({
 title ='Service Temporarily Unavailable',
 message ='We encountered an issue fetching live intelligence data. The platform fallback engine is active.',
 onRetry,
 isRetrying = false,
}: ErrorStateProps) {
 return (
 <div className="rounded-lg p-6 sm:p-8 text-center max-w-md mx-auto border border-rose-200 bg-rose-50/50 space-y-3.5 animate-in fade-in shadow-sm">
 <div className="h-12 w-12 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
 <AlertCircle className="h-6 w-6" />
 </div>

 <div className="space-y-1">
 <h4 className="text-sm font-bold text-slate-900">{title}</h4>
 <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
 </div>

 {onRetry && (
 <div className="pt-2">
 <button
 onClick={onRetry}
 disabled={isRetrying}
 className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
 >
 <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ?'animate-spin' :''}`} />
 <span>{isRetrying ?'Retrying...' :'Retry Request'}</span>
 </button>
 </div>
 )}
 </div>
 );
}
