'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  icon?: LucideIcon;
  badge?: string;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  badge,
  title,
  description,
  backHref,
  backLabel,
  children,
}: PageHeaderProps) {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
      {backHref && (
        <div className="mb-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{backLabel || 'Back'}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          {(badge || Icon) && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300">
              {Icon && <Icon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
              {badge && <span>{badge}</span>}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        {children && <div className="shrink-0 flex items-center gap-2.5">{children}</div>}
      </div>
    </div>
  );
}
