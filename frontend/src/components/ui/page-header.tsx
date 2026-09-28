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
    <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs relative overflow-hidden transition-all duration-200">
      {/* Subtle ambient lighting accent */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-bl from-indigo-500/5 via-cyan-500/5 to-transparent pointer-events-none rounded-tr-2xl" />

      {backHref && (
        <div className="mb-3 relative z-10">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{backLabel || 'Back'}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
        <div className="space-y-1.5 flex-1">
          {(badge || Icon) && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50/80 border border-indigo-100 text-[11px] font-semibold text-indigo-700">
              {Icon && <Icon className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
              {badge && <span>{badge}</span>}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        {children && <div className="shrink-0 flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
