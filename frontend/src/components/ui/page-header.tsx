'use client';

import React from'react';
import Link from'next/link';
import { LucideIcon, ArrowLeft } from'lucide-react';

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
 <div className="space-y-4">
 {backHref && (
 <Link
 href={backHref}
 className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
 >
 <ArrowLeft className="h-3.5 w-3.5" />
 <span>{backLabel ||'Back'}</span>
 </Link>
 )}

 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="space-y-1">
 {badge && (
 <p className="text-xs font-medium text-slate-500">
 {Icon && <Icon className="inline h-3.5 w-3.5 mr-1 text-slate-400" />}
 {badge}
 </p>
 )}
 <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
 <p className="text-sm text-slate-500 max-w-2xl">{description}</p>
 </div>

 {children && <div className="shrink-0 flex items-center gap-2">{children}</div>}
 </div>
 </div>
 );
}
