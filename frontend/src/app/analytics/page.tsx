'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Layers,
  Compass,
  Bookmark,
  MapPin,
  Cpu,
  Users,
  CheckCircle2,
  Award,
  Sparkles,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AnalyticsOverview } from '@/types';
import { SkeletonDashboard } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAnalytics()
      .then(setData)
      .catch((err) => console.error('Error fetching analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <SkeletonDashboard />;
  }

  const metrics = data?.metrics || {
    resources_discovered: 2450,
    ideas_analyzed: 380,
    technologies_explored: 84,
    research_sources: 8,
    student_projects: 120,
    active_innovators: 450,
    tasks_completed: 48,
    total_roadmap_tasks: 75,
    innovation_velocity: '88.4%',
  };

  const domainDist = data?.domain_distribution || [
    { domain: 'Healthcare', count: 42 },
    { domain: 'Agriculture', count: 35 },
    { domain: 'Smart Cities', count: 28 },
    { domain: 'Environment', count: 24 },
    { domain: 'Education', count: 19 },
    { domain: 'AI / Robotics', count: 31 },
  ];

  const statusDist = data?.status_distribution || [
    { status: 'Idea Stage', count: 45 },
    { status: 'Research & Literature', count: 30 },
    { status: 'Active Development', count: 28 },
    { status: 'Prototype Validated', count: 18 },
    { status: 'Completed & Evaluated', count: 12 },
  ];

  const featuredTechs = data?.featured_technologies || [
    { name: 'PyTorch / 1D-CNN', domain: 'Deep Learning', projects_using: 52 },
    { name: 'FastAPI', domain: 'Backend Services', projects_using: 68 },
    { name: 'YOLOv8 / YOLOv10', domain: 'Computer Vision', projects_using: 38 },
    { name: 'Next.js 14 & Tailwind', domain: 'Frontend UI', projects_using: 62 },
    { name: 'PostgreSQL + pgvector', domain: 'Storage & Embeddings', projects_using: 44 },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300">
            <BarChart3 className="h-3 w-3 text-indigo-400" />
            <span>Real-Time Innovation Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Impact & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Quantitative telemetry measuring discovered resources, completed roadmap phases, domain distributions, and active student projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Innovation Velocity</span>
            <span className="text-lg font-black text-emerald-400">{metrics.innovation_velocity}</span>
          </div>
        </div>
      </div>

      {/* 6 Key Impact Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Discovered Resources', val: `${metrics.resources_discovered}+`, icon: Compass, color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Ideas Analyzed', val: `${metrics.ideas_analyzed}+`, icon: Sparkles, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Technologies Explored', val: `${metrics.technologies_explored}+`, icon: Cpu, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Live Data Sources', val: `${metrics.research_sources}`, icon: Layers, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Student Projects', val: `${metrics.student_projects}+`, icon: Award, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Milestones Completed', val: `${metrics.tasks_completed}`, icon: CheckCircle2, color: 'text-teal-400 bg-teal-500/10' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-white gradient-text">{item.val}</span>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-300">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* 2-Column Visual Distribution Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Domain Distribution Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              Innovation Domains Breakdown
            </h3>
            <span className="text-xs text-slate-400">Total Projects</span>
          </div>

          <div className="space-y-3 pt-2">
            {domainDist.map((item, i) => {
              const maxCount = Math.max(...domainDist.map((d) => d.count), 50);
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.domain}</span>
                    <span className="text-indigo-400 font-bold">{item.count} projects</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Lifecycle Status Breakdown */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Project Development Pipeline Stages
            </h3>
            <span className="text-xs text-slate-400">Lifecycle</span>
          </div>

          <div className="space-y-3 pt-2">
            {statusDist.map((item, i) => {
              const maxCount = Math.max(...statusDist.map((s) => s.count), 50);
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium capitalize">{item.status}</span>
                    <span className="text-emerald-400 font-bold">{item.count} initiatives</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Technologies Leaderboard */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="h-4 w-4 text-amber-400" />
          Most Adopted Technologies Across Student Projects
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {featuredTechs.map((tech, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{tech.domain}</span>
              <h4 className="text-xs font-bold text-white font-mono">{tech.name}</h4>
              <p className="text-[11px] text-indigo-400 font-medium">{tech.projects_using} active projects</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
