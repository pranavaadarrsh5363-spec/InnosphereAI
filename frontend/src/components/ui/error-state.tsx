'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = 'Service Temporarily Unavailable',
  message = 'We encountered an issue fetching live intelligence data. The platform fallback engine is active.',
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 text-center max-w-md mx-auto border border-rose-500/30 bg-rose-950/10 space-y-3.5 animate-in fade-in">
      <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
        <AlertCircle className="h-6 w-6" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Retry Request'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
