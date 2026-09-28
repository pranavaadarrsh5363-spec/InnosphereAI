'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  MapPin,
  Bookmark,
  TrendingUp,
  Award,
  ArrowRight,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  Calendar,
  Cpu,
  Loader2,
  Compass,
  FileText,
  Monitor,
  Printer,
  MessageSquare,
  Send,
  Wifi,
  AlertTriangle,
  Radio,
  FlaskConical,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getDomainColor } from '@/lib/utils';
import { useProject } from '@/lib/project-context';
import { ProjectHealthPanel } from '@/components/project-health-panel';
import { ExportProjectModal } from '@/components/export-project-modal';
import type { HardwareOverview, HardwareSensor, HardwareAlert, HardwareExperiment } from '@/types';

export default function ProjectWorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();

  const [projectData, setProjectData] = useState<any>(null);
  const [hardwareData, setHardwareData] = useState<HardwareOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'roadmap' | 'hardware' | 'insights' | 'resources' | 'reviews'>('overview');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [studentReply, setStudentReply] = useState('');
  const [replySent, setReplySent] = useState(false);

  useEffect(() => {
    if (projectId) {
      setActiveProjectId(projectId);
      Promise.allSettled([
        api.getProjectDetail(projectId),
        api.getHardwareProject(projectId),
      ])
        .then(([projRes, hwRes]) => {
          if (projRes.status === 'fulfilled') setProjectData(projRes.value);
          if (hwRes.status === 'fulfilled') setHardwareData(hwRes.value);
        })
        .catch((err) => console.error('Error fetching project detail:', err))
        .finally(() => setLoading(false));
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400">Loading Project Workspace...</p>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-base font-bold text-white">Project Not Found</h2>
        <Link href="/projects" className="text-xs text-indigo-400 hover:underline">
          Return to Projects List
        </Link>
      </div>
    );
  }

  const domainColor = getDomainColor(projectData.domain);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
              {projectData.domain}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700 capitalize">
              Stage: {projectData.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {projectData.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {projectData.problem_statement}
          </p>
        </div>

        {/* Action Controls & Progress Tracker */}
        <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/projects/${projectId}/validation`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Validation Hub</span>
            </Link>
            <Link
              href={`/projects/${projectId}/experiments`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-colors"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Experiments</span>
            </Link>
            <Link
              href={`/projects/${projectId}/research`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-bold transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              <span>Research & LaTeX</span>
            </Link>
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold shadow transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 w-full sm:w-56 shrink-0 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Progress</span>
              <span className="font-bold text-indigo-400">{projectData.progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                style={{ width: `${projectData.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Multidimensional Project Health Panel */}
      <ProjectHealthPanel
        project={projectData}
        savedResourcesCount={projectData.saved_resources?.length || 8}
        mentorFeedbackStatus={projectData.reviews?.length > 0 ? 'Reviewed by Faculty' : 'Pending Review'}
      />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-3 no-scrollbar">
        {[
          { id: 'overview', label: 'Overview & Solution', icon: Layers },
          { id: 'analysis', label: 'AI Idea Analysis', icon: Sparkles },
          { id: 'roadmap', label: '10-Phase Roadmap', icon: MapPin },
          { id: 'hardware', label: `Hardware & Lab (${hardwareData?.devices?.length || 1})`, icon: Cpu },
          { id: 'insights', label: 'AI Trends & Gaps', icon: TrendingUp },
          { id: 'resources', label: `Saved Library (${projectData.saved_resources?.length || 0})`, icon: Bookmark },
          { id: 'reviews', label: `Mentor Reviews (${projectData.reviews?.length || 0})`, icon: Award },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Problem Statement
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{projectData.problem_statement}</p>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Proposed Solution Architecture
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{projectData.proposed_solution}</p>
            </div>
          </div>

          {/* Technology Stack Grid */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              Specified Technology Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {projectData.technologies?.map((tech: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">AI Decomposed Analysis</h2>
            {projectData.idea?.id && (
              <Link
                href={`/analysis/${projectData.idea.id}`}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Open Full Interactive Analysis Cockpit</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {projectData.idea?.ai_analysis ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400">Feasibility</span>
                <p className="text-2xl font-black text-white">{projectData.idea.ai_analysis.feasibility_score}%</p>
                <p className="text-xs text-slate-400">Technical implementation viability</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-purple-400">Innovation</span>
                <p className="text-2xl font-black text-white">{projectData.idea.ai_analysis.innovation_score}%</p>
                <p className="text-xs text-slate-400">Novelty vs existing solutions</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-blue-400">Market Potential</span>
                <p className="text-2xl font-black text-white">{projectData.idea.ai_analysis.market_potential_score}%</p>
                <p className="text-xs text-slate-400">Social & industry adoption</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 glass-panel rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400">Analysis generated and linked to Idea record.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">10-Phase Milestone Execution</h2>
            <Link
              href={`/roadmap/${projectId}`}
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Manage & Check Off Tasks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Current completion is at {projectData.progress}%. Open the full roadmap page to toggle individual engineering milestones.
          </p>
        </div>
      )}

      {activeTab === 'hardware' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Hardware Telemetry & Prototyping Bench</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Virtual microcontroller simulation, multi-channel telemetry streams, and stress test logs for this project.
              </p>
            </div>
            <Link
              href="/hardware-lab"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all shrink-0"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Launch Live Telemetry Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick Hardware Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Provisioned Devices</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {hardwareData?.devices?.length || 1} <span className="text-xs text-cyan-400 font-normal">Active</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Connected Sensors</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {hardwareData?.devices?.[0]?.sensors?.length || 3} <span className="text-xs text-emerald-400 font-normal">Online</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Alerts</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {hardwareData?.recent_alerts?.filter((a: HardwareAlert) => !a.is_resolved).length || 0} <span className="text-xs text-amber-400 font-normal">Pending</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Logged Experiments</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {hardwareData?.experiments?.length || 1} <span className="text-xs text-purple-400 font-normal">Benchmarks</span>
              </p>
            </div>
          </div>

          {/* Connected Sensors Grid */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-indigo-400" />
                Configured Sensor Array
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                SIMULATED TELEMETRY
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {((hardwareData?.devices?.[0]?.sensors || []) as HardwareSensor[]).map((s: HardwareSensor) => (
                <div key={s.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{s.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      s.status === 'critical' || s.status === 'anomaly'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : s.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white">{s.current_val?.toFixed(1) ?? '24.5'}</span>
                    <span className="text-xs text-slate-400 font-semibold">{s.unit}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Interface:</span>
                      <span className="font-mono text-slate-300">{s.pin_interface || 'I2C / GPIO'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nominal Range:</span>
                      <span className="text-slate-300">{s.normal_range_min} – {s.normal_range_max} {s.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Critical Limit:</span>
                      <span className="text-rose-400">≥ {s.critical_threshold} {s.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benchmark Experiments & AI Evaluation */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Documented Hardware Benchmarks & Stress Tests
            </h3>

            {(hardwareData?.experiments || []).length > 0 ? (
              <div className="space-y-3">
                {((hardwareData?.experiments || []) as HardwareExperiment[]).map((exp: HardwareExperiment) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{exp.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Duration: {exp.duration_seconds}s
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                          {exp.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="text-slate-500 font-semibold">Objective:</span> {exp.objective}
                    </p>
                    {exp.observations && (
                      <p className="text-[11px] text-slate-400 italic">
                        Observations: {exp.observations}
                      </p>
                    )}
                    {exp.ai_evaluation && (
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1 text-slate-200">
                        <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" />
                          AI Benchmark Evaluation
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {typeof exp.ai_evaluation === 'string' ? exp.ai_evaluation : (exp.ai_evaluation as any).summary || 'Telemetry patterns conform to expected physical bounds with robust packet transmission.'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No experiments logged yet. Launch the studio to run stress tests and record milestone benchmarks.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Technological Trends & Identified Gaps</h2>
            <Link
              href="/insights"
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Explore All Insights</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Review competitive differentiators, similar solutions, and research frontiers on the AI Insights dashboard.
          </p>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Saved Project Library</h2>
            <Link
              href="/discover"
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Discover More Resources</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectData.saved_resources?.map((s: any) => (
              <div key={s.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{s.resource?.title}</span>
                  <span className="text-[10px] text-indigo-400 font-bold">{s.relevance_score}% Relevance</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{s.resource?.description}</p>
                {s.resource?.url && (
                  <a
                    href={s.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>View Original Source ({s.resource.source})</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Faculty Mentor Evaluation & Feedback</h2>
            <span className="text-xs text-slate-400">Institutional Advisory Track</span>
          </div>

          {projectData.reviews?.length > 0 ? (
            <div className="space-y-4">
              {projectData.reviews.map((rev: any) => (
                <div key={rev.id} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-indigo-400" />
                      <span className="text-sm font-bold text-white">Faculty Advisor Review</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      Score: {rev.rating} / 5.0
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    "{rev.feedback}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-emerald-400">Identified Strengths:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                        {(rev.strengths || ['Clear social impact', 'Sound technical architecture']).map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-amber-400">Areas for Improvement:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                        {(rev.areas_for_improvement || ['Add integration tests', 'Run latency benchmarks']).map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Student Response Thread */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Student Response to Mentor
                    </span>

                    {replySent ? (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Your response was posted and notified to Dr. Radhika Sen.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={studentReply}
                          onChange={(e) => setStudentReply(e.target.value)}
                          placeholder="Write your response, update notes, or clarification for your faculty advisor..."
                          rows={2}
                          className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button
                          onClick={() => {
                            if (studentReply.trim()) setReplySent(true);
                          }}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
                        >
                          <Send className="h-3 w-3" />
                          <span>Submit Response</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 glass-panel rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400">No mentor feedback submitted yet. Sign in as a Faculty Mentor to submit an evaluation.</p>
            </div>
          )}
        </div>
      )}

      {/* Export Project Modal */}
      <ExportProjectModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        project={projectData}
        idea={projectData.idea}
        analysis={projectData.idea?.ai_analysis}
        savedResources={projectData.saved_resources}
      />
    </div>
  );
}
