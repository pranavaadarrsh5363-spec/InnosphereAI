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
    <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs relative overflow-hidden transition-all duration-200">
      {backHref && (
        <div className="mb-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{backLabel || 'Back'}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 flex-1">
          {(badge || Icon) && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
              {Icon && <Icon className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
              {badge && <span>{badge}</span>}
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
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
