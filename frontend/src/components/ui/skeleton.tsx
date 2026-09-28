'use client';

import React from'react';

export function Skeleton({ className ='' }: { className?: string }) {
 return (
 <div
 className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
 />
 );
}

export function SkeletonCard() {
 return (
 <div className="rounded-lg p-5 bg-white border border-slate-200 space-y-3.5 animate-pulse shadow-sm">
 <div className="flex items-center justify-between">
 <div className="flex gap-2">
 <Skeleton className="h-5 w-16 rounded-md" />
 <Skeleton className="h-5 w-20 rounded-md" />
 </div>
 <Skeleton className="h-6 w-24 rounded-full" />
 </div>
 <Skeleton className="h-5 w-3/4 rounded-md" />
 <Skeleton className="h-4 w-full rounded-md" />
 <Skeleton className="h-4 w-5/6 rounded-md" />
 <div className="flex gap-2 pt-2">
 <Skeleton className="h-4 w-12 rounded" />
 <Skeleton className="h-4 w-16 rounded" />
 <Skeleton className="h-4 w-14 rounded" />
 </div>
 <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
 <Skeleton className="h-4 w-20 rounded" />
 <div className="flex gap-2">
 <Skeleton className="h-7 w-16 rounded-lg" />
 <Skeleton className="h-7 w-20 rounded-lg" />
 </div>
 </div>
 </div>
 );
}

export function SkeletonDashboard() {
 return (
 <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 animate-pulse">
 {/* Banner Skeleton */}
 <div className="rounded-lg bg-white border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
 <Skeleton className="h-6 w-48 rounded-full" />
 <Skeleton className="h-9 w-2/3 rounded-xl" />
 <Skeleton className="h-4 w-1/2 rounded-md" />
 </div>

 {/* 4 Stat Cards */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="rounded-lg p-5 bg-white border border-slate-200 space-y-3 shadow-sm">
 <div className="flex justify-between items-center">
 <Skeleton className="h-4 w-20 rounded" />
 <Skeleton className="h-8 w-8 rounded-lg" />
 </div>
 <Skeleton className="h-8 w-16 rounded-md" />
 <Skeleton className="h-3 w-24 rounded" />
 </div>
 ))}
 </div>

 {/* Content Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-4">
 <SkeletonCard />
 <SkeletonCard />
 </div>
 <div className="space-y-4">
 <div className="rounded-lg p-5 bg-white border border-slate-200 space-y-3 shadow-sm">
 <Skeleton className="h-5 w-32 rounded" />
 <Skeleton className="h-4 w-full rounded" />
 <Skeleton className="h-4 w-4/5 rounded" />
 <Skeleton className="h-8 w-full rounded-xl mt-4" />
 </div>
 </div>
 </div>
 </div>
 );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {Array.from({ length: count }).map((_, i) => (
 <SkeletonCard key={i} />
 ))}
 </div>
 );
}
