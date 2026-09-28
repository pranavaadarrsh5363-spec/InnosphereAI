'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Lightbulb,
  Bookmark,
  TrendingUp,
  BookOpen,
  Cpu,
  MapPin,
  Layers,
  ArrowRight,
  PlusCircle,
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Star,
  Activity,
  Award,
  Brain,
  Network,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useProject } from '@/lib/project-context';
import { api } from '@/lib/api';
import { getDomainColor } from '@/lib/utils';
import { Project, Idea, SavedResource } from '@/types';
import { SkeletonDashboard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { projects, activeProject, setActiveProjectId, refreshProjects } = useProject();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [ideasList, savedList] = await Promise.all([
          api.getIdeas(),
          api.getLibrary(),
        ]);
        setIdeas(ideasList || []);
        setSavedResources(savedList || []);
      } catch (err) {
        console.warn('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return <SkeletonDashboard />;
  }

  const aiRecommendations = [
    {
      title: 'Explore IoT-Based Edge Telemetry Systems',
      desc: 'Connect ESP32 / Arduino microcontrollers with MQTT/WebSockets to stream continuous sensor readings directly to your FastAPI backend.',
      tag: 'Hardware & IoT',
      action: '/discover?query=IoT+edge+telemetry+sensors+ESP32',
    },
    {
      title: 'Review Recent Research on 1D-CNNs & Signal Transformers',
      desc: 'Recent 2025 arXiv literature shows that lightweight 1D-CNNs achieve 97%+ accuracy on clinical & agricultural telemetry with <15ms latency.',
      tag: 'Research Paper',
      action: '/discover?resource_type=research_paper&query=deep+learning+signal+telemetry',
    },
    {
      title: 'Consider FastAPI & TimescaleDB for Low-Latency Backend',
      desc: 'Asynchronous Python routes paired with TimescaleDB compression reduce query latency by 4x for high-throughput sensor telemetry.',
      tag: 'Tech Stack',
      action: '/insights',
    },
    {
      title: 'Explore Curated Public Datasets on Kaggle & OpenData',
      desc: 'Download standardized open benchmark datasets with pre-labeled labels to accelerate your Phase 4 data preprocessing.',
      tag: 'Public Datasets',
      action: '/discover?resource_type=dataset',
    },
  ];

  const dashboardCards = [
    {
      title: 'My Ideas',
      count: ideas.length || projects.length,
      icon: Lightbulb,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      href: '/submit-idea',
      linkText: 'Submit New',
    },
    {
      title: 'Saved Resources',
      count: savedResources.length,
      icon: Bookmark,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      href: '/library',
      linkText: 'Open Library',
    },
    {
      title: 'AI Insights',
      count: activeProject ? 12 : 5,
      icon: TrendingUp,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      href: '/insights',
      linkText: 'View Trends',
    },
    {
      title: 'Research Papers',
      count: savedResources.filter((s) => s.resource?.resource_type === 'research_paper').length || 8,
      icon: BookOpen,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      href: '/discover?resource_type=research_paper',
      linkText: 'Explore Papers',
    },
    {
      title: 'Recommended Tech',
      count: activeProject?.technologies?.length || 6,
      icon: Cpu,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      href: '/insights',
      linkText: 'Inspect Stack',
    },
    {
      title: 'Skills & Prerequisites',
      count: activeProject?.technologies?.length ? activeProject.technologies.length * 2 : 10,
      icon: Brain,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      href: activeProject ? `/projects/${activeProject.id}/skills` : '/skills',
      linkText: 'View Gap Map',
    },
    {
      title: 'AI Architecture',
      count: 8,
      icon: Network,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      href: activeProject ? `/projects/${activeProject.id}/architecture` : '/architecture',
      linkText: 'View Topology',
    },
    {
      title: 'Innovation Roadmaps',
      count: projects.length,
      icon: MapPin,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      href: activeProject ? `/roadmap/${activeProject.id}` : '/roadmap/1',
      linkText: 'Track Progress',
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>Innovator Cockpit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.full_name ? user.full_name : 'Innovator'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Here is your innovation command center. Explore intelligent resources, analyze ideas, and execute your project roadmaps.
          </p>
          {user?.profile?.institution && (
            <p className="text-xs text-indigo-400 font-medium">
              🎓 {user.profile.institution} &bull; {user.profile.course || 'Engineering Innovator'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            href="/submit-idea"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-lg transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit Idea</span>
          </Link>
          <Link
            href="/discover"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
          >
            <Compass className="h-4 w-4 text-indigo-400" />
            <span>Discover Resources</span>
          </Link>
        </div>
      </div>

      {/* 6 Core Dashboard Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {dashboardCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xl font-extrabold text-white">{c.count}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">{c.title}</p>
                <Link
                  href={c.href}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 mt-1"
                >
                  {c.linkText} <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Project Highlight Banner */}
      {activeProject && (
        <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Active Project Under Development
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getDomainColor(activeProject.domain).bg} ${getDomainColor(activeProject.domain).text}`}>
                  {activeProject.domain}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium capitalize">
                  Stage: {activeProject.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{activeProject.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {activeProject.problem_statement}
              </p>
              {activeProject.technologies && activeProject.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeProject.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Bar & Quick Links */}
            <div className="shrink-0 w-full lg:w-72 bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Roadmap Progress</span>
                <span className="font-bold text-indigo-400">{activeProject.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${activeProject.progress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/roadmap/${activeProject.id}`}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold text-center transition-colors"
                >
                  View Roadmap
                </Link>
                <Link
                  href="/insights"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium text-center transition-colors"
                >
                  AI Insights
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Section: AI Recommendations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: AI Recommendations Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              AI Recommendations for You
            </h3>
            <span className="text-xs text-slate-400 font-medium">Context-Aware Suggestions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiRecommendations.map((rec, i) => (
              <div
                key={i}
                className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-400">
                      {rec.tag}
                    </span>
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{rec.desc}</p>
                </div>
                <Link
                  href={rec.action}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-auto"
                >
                  <span>Explore in Platform</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>

          {/* Student's Projects Grid */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                My Innovation Projects ({projects.length})
              </h3>
              <Link href="/projects" className="text-xs text-indigo-400 hover:underline">
                View All Projects
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((p) => {
                const domainColor = getDomainColor(p.domain);
                return (
                  <div
                    key={p.id}
                    className={`glass-panel rounded-2xl p-4 border transition-all cursor-pointer ${
                      activeProject?.id === p.id
                        ? 'border-indigo-500/60 bg-indigo-950/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                    onClick={() => setActiveProjectId(p.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${domainColor.bg} ${domainColor.text}`}>
                        {p.domain}
                      </span>
                      <span className="text-xs font-bold text-indigo-400">{p.progress}%</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate mb-1">{p.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{p.proposed_solution}</p>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                      <span className="text-slate-500 capitalize">{p.status}</span>
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-indigo-400 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        Details <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Recent Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Recent Activity Feed
            </h3>
            <span className="text-[11px] text-slate-500">Live Timeline</span>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="space-y-3.5">
              <div className="flex gap-3 text-xs">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">
                    AI Idea Analysis Completed for <span className="text-white font-semibold">AI Healthcare Monitor</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Feasibility Score: 88% &bull; Today</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bookmark className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">
                    Saved <span className="text-white font-semibold">MIMIC-IV Clinical Database</span> to Library
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Category: Datasets &bull; 2 hours ago</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="h-7 w-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">
                    Milestone completed in <span className="text-white font-semibold">Phase 1: Problem Research</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Roadmap updated to 65% &bull; Yesterday</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">
                    Mentor review received from <span className="text-white font-semibold">Dr. Radhika Sen</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">5/5 Rating &bull; Yesterday</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <Link
                href="/library"
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <span>View My Saved Resources ({savedResources.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
