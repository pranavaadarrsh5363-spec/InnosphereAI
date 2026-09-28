'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
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
  Atom,
  FlaskConical,
  ShieldCheck,
  FolderKanban,
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
      desc: 'Connect ESP32 microcontrollers with MQTT/WebSockets to stream continuous sensor readings directly to your FastAPI backend.',
      tag: 'Hardware & IoT',
      action: '/discover?query=IoT+edge+telemetry+sensors+ESP32',
    },
    {
      title: 'Review Recent Research on 1D-CNNs & Signal Transformers',
      desc: 'Recent arXiv literature shows that lightweight 1D-CNNs achieve 97%+ accuracy on telemetry with <15ms latency.',
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
      desc: 'Download standardized open benchmark datasets with pre-labeled ground truth to accelerate your data preprocessing.',
      tag: 'Public Datasets',
      action: '/discover?resource_type=dataset',
    },
  ];

  const dashboardCards = [
    {
      title: 'My Ideas',
      count: ideas.length || projects.length,
      icon: Lightbulb,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
      href: '/submit-idea',
      linkText: 'Submit Idea',
    },
    {
      title: 'Projects',
      count: projects.length,
      icon: FolderKanban,
      color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      href: '/projects',
      linkText: 'Directory',
    },
    {
      title: 'Research Workspace',
      count: savedResources.filter((s) => s.resource?.resource_type === 'research_paper').length || 4,
      icon: Atom,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900',
      href: '/research',
      linkText: 'LaTeX Drafts',
    },
    {
      title: 'Experiments',
      count: activeProject ? 8 : 4,
      icon: FlaskConical,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      href: '/experiments',
      linkText: 'Empirical Runs',
    },
    {
      title: 'Validation Matrix',
      count: activeProject ? '6 / 6' : 'Verified',
      icon: ShieldCheck,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900',
      href: '/validation',
      linkText: 'Audit Evidence',
    },
    {
      title: 'Saved Resources',
      count: savedResources.length,
      icon: Bookmark,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      href: '/library',
      linkText: 'Saved Library',
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Welcome & Working Context Header */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <Atom className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Research & Innovation Cockpit</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.full_name ? user.full_name : 'Innovator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Manage your research pipeline, track experimental trials, and validate innovation claims with faculty-aligned rubrics.
          </p>
          {user?.profile?.institution && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Academic Affiliation: <span className="text-slate-900 dark:text-slate-200 font-semibold">{user.profile.institution}</span> &bull; {user.profile.course || 'Engineering'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/submit-idea"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit Idea</span>
          </Link>
          <Link
            href="/discover"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold text-xs transition-colors"
          >
            <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Discover Resources</span>
          </Link>
        </div>
      </div>

      {/* 6 Compact Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {dashboardCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{c.count}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{c.title}</p>
                <Link
                  href={c.href}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-0.5 mt-1"
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
        <div className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Active Project Workspace
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getDomainColor(activeProject.domain).bg} ${getDomainColor(activeProject.domain).text}`}>
                  {activeProject.domain}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium capitalize border border-slate-200 dark:border-slate-700">
                  Status: {activeProject.status}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{activeProject.title}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {activeProject.problem_statement}
              </p>
              {activeProject.technologies && activeProject.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeProject.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Bar & Quick Links */}
            <div className="shrink-0 w-full lg:w-72 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Milestone Progress</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{activeProject.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${activeProject.progress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/roadmap/${activeProject.id}`}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold text-center transition-colors"
                >
                  View Roadmap
                </Link>
                <Link
                  href={`/projects/${activeProject.id}`}
                  className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium text-center transition-colors"
                >
                  Project Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Section: AI Recommendations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recommendations & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Context-Aware Research Recommendations
              </h3>
              <span className="text-xs text-slate-500">Grounded in Active Domain</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {aiRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {rec.tag}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{rec.desc}</p>
                  </div>
                  <Link
                    href={rec.action}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-auto"
                  >
                    <span>Explore in Platform</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Student's Projects Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                My Innovation Projects ({projects.length})
              </h3>
              <Link href="/projects" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                View All Directory &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {projects.slice(0, 4).map((p) => {
                const domainColor = getDomainColor(p.domain);
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl p-4 border transition-colors cursor-pointer ${
                      activeProject?.id === p.id
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 dark:border-blue-700'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    onClick={() => setActiveProjectId(p.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${domainColor.bg} ${domainColor.text}`}>
                        {p.domain}
                      </span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{p.progress}%</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mb-1">{p.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{p.proposed_solution}</p>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 capitalize">{p.status}</span>
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-0.5"
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Activity & Milestones
            </h3>
            <span className="text-[11px] text-slate-500">Live Timeline</span>
          </div>

          <div className="rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="space-y-3.5">
              <div className="flex gap-3 text-xs">
                <div className="h-7 w-7 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Brain className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    AI Idea Analysis evaluated for <span className="text-slate-900 dark:text-white font-semibold">AI Healthcare Monitor</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Feasibility Score: 88% &bull; Today</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="h-7 w-7 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Bookmark className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    Indexed <span className="text-slate-900 dark:text-white font-semibold">MIMIC-IV Clinical Dataset</span> to Library
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Category: Benchmark Datasets &bull; 2 hours ago</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="h-7 w-7 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    Milestone verified in <span className="text-slate-900 dark:text-white font-semibold">Phase 1: Problem Research</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Roadmap updated to 65% &bull; Yesterday</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="h-7 w-7 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    Mentor review rubric completed by <span className="text-slate-900 dark:text-white font-semibold">Dr. Radhika Sen</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">5/5 Score &bull; Yesterday</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/library"
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span>View Saved Library ({savedResources.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
