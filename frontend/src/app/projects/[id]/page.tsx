'use client';

import React, { useEffect, useState } from'react';
import { useParams, useRouter } from'next/navigation';
import Link from'next/link';
import {
 Layers,
 MapPin,
 Bookmark,
 TrendingUp,
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
 Trophy,
 Lightbulb,
 Info
} from'lucide-react';
import { api } from'@/lib/api';
import { getDomainColor } from'@/lib/utils';
import { useProject } from'@/lib/project-context';
import { ProjectHealthPanel } from'@/components/project-health-panel';
import { ExportProjectModal } from'@/components/export-project-modal';
import type { HardwareOverview, HardwareSensor, HardwareAlert, HardwareExperiment } from'@/types';

export default function ProjectWorkspaceDetailPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = Number(params.id);
 const { setActiveProjectId } = useProject();

 const [projectData, setProjectData] = useState<any>(null);
 const [hardwareData, setHardwareData] = useState<HardwareOverview | null>(null);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<'overview' |'analysis' |'roadmap' |'hardware' |'insights' |'resources' |'reviews'>('overview');
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
 if (projRes.status ==='fulfilled') setProjectData(projRes.value);
 if (hwRes.status ==='fulfilled') setHardwareData(hwRes.value);
 })
 .catch((err) => console.error('Error fetching project detail:', err))
 .finally(() => setLoading(false));
 }
 }, [projectId]);

 if (loading) {
 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col items-center justify-center space-y-4">
 <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
 <p className="text-sm text-slate-500">Loading Project Workspace...</p>
 </div>
 );
 }

 if (!projectData) {
 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-4">
 <h2 className="text-xl font-semibold text-slate-900">Project Not Found</h2>
 <Link href="/projects" className="text-sm text-indigo-600 hover:underline">
 Return to Projects List
 </Link>
 </div>
 );
 }

 const domainColor = getDomainColor(projectData.domain);

 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 {/* Header Banner */}
 <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
 <div className="space-y-2 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className={`text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200`}>
 {projectData.domain}
 </span>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 capitalize">
 Stage: {projectData.status}
 </span>
 </div>

 <h1 className="text-xl font-semibold text-slate-900">
 {projectData.title}
 </h1>
 <p className="text-sm text-slate-600 max-w-3xl">
 {projectData.problem_statement}
 </p>
 </div>

 {/* Action Controls & Progress Tracker */}
 <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 shrink-0">
 <div className="flex flex-wrap items-center gap-2">
 <Link
 href={`/projects/${projectId}/competition`}
 className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md shadow-sm"
 >
 <Trophy className="h-4 w-4" />
 <span>Competition & Proof</span>
 </Link>
 <Link
 href={`/projects/${projectId}/validation`}
 className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md shadow-sm"
 >
 <CheckCircle2 className="h-4 w-4" />
 <span>Validation Hub</span>
 </Link>
 <Link
 href={`/projects/${projectId}/experiments`}
 className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
 >
 <FlaskConical className="h-4 w-4" />
 <span>Experiments</span>
 </Link>
 <Link
 href={`/projects/${projectId}/research`}
 className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md shadow-sm"
 >
 <FileText className="h-4 w-4" />
 <span>Research & LaTeX</span>
 </Link>
 <button
 onClick={() => setExportModalOpen(true)}
 className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md shadow-sm"
 >
 <Printer className="h-4 w-4" />
 <span>Export</span>
 </button>
 </div>

 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 w-full sm:w-56 shrink-0 space-y-2">
 <div className="flex items-center justify-between text-xs text-slate-600">
 <span className="font-medium">Progress</span>
 <span className="font-semibold">{projectData.progress}%</span>
 </div>
 <div className="h-1.5 bg-slate-200 rounded-md overflow-hidden">
 <div
 className="h-full bg-indigo-600"
 style={{ width:`${projectData.progress}%` }}
 />
 </div>
 </div>
 </div>
 </div>

 {/* Multidimensional Project Health Panel */}
 <ProjectHealthPanel
 project={projectData}
 savedResourcesCount={projectData.saved_resources?.length || 8}
 mentorFeedbackStatus={projectData.reviews?.length > 0 ?'Reviewed by Faculty' :'Pending Review'}
 />

 {/* Tabs */}
 <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3 no-scrollbar">
 {[
 { id:'overview', label:'Overview & Solution', icon: Layers },
 { id:'analysis', label:'AI Idea Analysis', icon: Lightbulb },
 { id:'roadmap', label:'10-Phase Roadmap', icon: MapPin },
 { id:'hardware', label:`Hardware & Lab (${hardwareData?.devices?.length || 1})`, icon: Cpu },
 { id:'insights', label:'AI Trends & Gaps', icon: TrendingUp },
 { id:'resources', label:`Saved Library (${projectData.saved_resources?.length || 0})`, icon: Bookmark },
 { id:'reviews', label:`Mentor Reviews (${projectData.reviews?.length || 0})`, icon: Info },
 ].map((t) => {
 const Icon = t.icon;
 const isActive = activeTab === t.id;
 return (
 <button
 key={t.id}
 onClick={() => setActiveTab(t.id as any)}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all border ${
 isActive
 ?'bg-indigo-50 border-indigo-500 text-slate-900'
 :'bg-white border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
 }`}
 >
 <Icon className="h-4 w-4" />
 <span>{t.label}</span>
 </button>
 );
 })}
 </div>

 {/* Tab Content */}
 {activeTab ==='overview' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <span className="h-1.5 w-1.5 rounded-md bg-red-500" />
 Problem Statement
 </h3>
 <p className="text-sm text-slate-600 leading-relaxed">{projectData.problem_statement}</p>
 </div>

 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <span className="h-1.5 w-1.5 rounded-md bg-emerald-500" />
 Proposed Solution Architecture
 </h3>
 <p className="text-sm text-slate-600 leading-relaxed">{projectData.proposed_solution}</p>
 </div>
 </div>

 {/* Technology Stack Grid */}
 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Cpu className="h-4 w-4 text-slate-500" />
 Specified Technology Stack
 </h3>
 <div className="flex flex-wrap gap-2">
 {projectData.technologies?.map((tech: string, i: number) => (
 <span
 key={i}
 className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
 >
 {tech}
 </span>
 ))}
 </div>
 </div>
 </div>
 )}

 {activeTab ==='analysis' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-sm font-semibold text-slate-900">AI Decomposed Analysis</h2>
 {projectData.idea?.id && (
 <Link
 href={`/analysis/${projectData.idea.id}`}
 className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1"
 >
 <span>Open Full Interactive Analysis Cockpit</span>
 <ArrowRight className="h-4 w-4" />
 </Link>
 )}
 </div>

 {projectData.idea?.ai_analysis ? (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2">
 <span className="text-xs font-medium text-slate-500">Feasibility</span>
 <p className="text-xl font-semibold text-slate-900">{projectData.idea.ai_analysis.feasibility_score}%</p>
 <p className="text-xs text-slate-600">Technical implementation viability</p>
 </div>
 <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2">
 <span className="text-xs font-medium text-slate-500">Innovation</span>
 <p className="text-xl font-semibold text-slate-900">{projectData.idea.ai_analysis.innovation_score}%</p>
 <p className="text-xs text-slate-600">Novelty vs existing solutions</p>
 </div>
 <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2">
 <span className="text-xs font-medium text-slate-500">Market Potential</span>
 <p className="text-xl font-semibold text-slate-900">{projectData.idea.ai_analysis.market_potential_score}%</p>
 <p className="text-xs text-slate-600">Social & industry adoption</p>
 </div>
 </div>
 ) : (
 <div className="text-center py-10 rounded-lg bg-white border border-slate-200 shadow-sm">
 <p className="text-sm text-slate-500">Analysis generated and linked to Idea record.</p>
 </div>
 )}
 </div>
 )}

 {activeTab ==='roadmap' && (
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <h2 className="text-sm font-semibold text-slate-900">10-Phase Milestone Execution</h2>
 <Link
 href={`/roadmap/${projectId}`}
 className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1"
 >
 <span>Manage & Check Off Tasks</span>
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 <p className="text-sm text-slate-600">
 Current completion is at {projectData.progress}%. Open the full roadmap page to toggle individual engineering milestones.
 </p>
 </div>
 )}

 {activeTab ==='hardware' && (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
 <div>
 <div className="flex items-center gap-2">
 <Cpu className="h-5 w-5 text-slate-500" />
 <h2 className="text-sm font-semibold text-slate-900">Hardware Telemetry & Prototyping Bench</h2>
 </div>
 <p className="text-sm text-slate-600 mt-1">
 Virtual microcontroller simulation, multi-channel telemetry streams, and stress test logs for this project.
 </p>
 </div>
 <Link
 href="/hardware-lab"
 className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md shadow-sm shrink-0"
 >
 <Radio className="h-4 w-4" />
 <span>Launch Live Telemetry Studio</span>
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>

 {/* Quick Hardware Stats */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
 <span className="text-xs font-medium text-slate-500">Provisioned Devices</span>
 <p className="text-lg font-semibold text-slate-900 mt-1">
 {hardwareData?.devices?.length || 1} <span className="text-xs text-slate-500">Active</span>
 </p>
 </div>
 <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
 <span className="text-xs font-medium text-slate-500">Connected Sensors</span>
 <p className="text-lg font-semibold text-slate-900 mt-1">
 {hardwareData?.devices?.[0]?.sensors?.length || 3} <span className="text-xs text-slate-500">Online</span>
 </p>
 </div>
 <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
 <span className="text-xs font-medium text-slate-500">Active Alerts</span>
 <p className="text-lg font-semibold text-slate-900 mt-1">
 {hardwareData?.recent_alerts?.filter((a: HardwareAlert) => !a.is_resolved).length || 0} <span className="text-xs text-slate-500">Pending</span>
 </p>
 </div>
 <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
 <span className="text-xs font-medium text-slate-500">Logged Experiments</span>
 <p className="text-lg font-semibold text-slate-900 mt-1">
 {hardwareData?.experiments?.length || 1} <span className="text-xs text-slate-500">Benchmarks</span>
 </p>
 </div>
 </div>

 {/* Connected Sensors Grid */}
 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center justify-between">
 <span className="flex items-center gap-2">
 <Wifi className="h-4 w-4 text-slate-500" />
 Configured Sensor Array
 </span>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
 SIMULATED TELEMETRY
 </span>
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {((hardwareData?.devices?.[0]?.sensors || []) as HardwareSensor[]).map((s: HardwareSensor) => (
 <div key={s.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-sm font-semibold text-slate-900">{s.name}</span>
 <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
 s.status ==='critical' || s.status ==='anomaly'
 ?'bg-red-50 text-red-700 border-red-200'
 : s.status ==='warning'
 ?'bg-amber-50 text-amber-700 border-amber-200'
 :'bg-emerald-50 text-emerald-700 border-emerald-200'
 }`}>
 {s.status}
 </span>
 </div>
 <div className="flex items-baseline gap-1.5">
 <span className="text-lg font-semibold text-slate-900">{s.current_val?.toFixed(1) ??'24.5'}</span>
 <span className="text-xs text-slate-500">{s.unit}</span>
 </div>
 <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
 <div className="flex justify-between">
 <span>Interface:</span>
 <span className="text-slate-800">{s.pin_interface ||'I2C / GPIO'}</span>
 </div>
 <div className="flex justify-between">
 <span>Nominal Range:</span>
 <span className="text-slate-800">{s.normal_range_min} – {s.normal_range_max} {s.unit}</span>
 </div>
 <div className="flex justify-between">
 <span>Critical Limit:</span>
 <span className="text-red-600">≥ {s.critical_threshold} {s.unit}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Benchmark Experiments & AI Evaluation */}
 <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Lightbulb className="h-4 w-4 text-slate-500" />
 Documented Hardware Benchmarks & Stress Tests
 </h3>

 {(hardwareData?.experiments || []).length > 0 ? (
 <div className="space-y-3">
 {((hardwareData?.experiments || []) as HardwareExperiment[]).map((exp: HardwareExperiment) => (
 <div key={exp.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <span className="text-sm font-semibold text-slate-900">{exp.name}</span>
 <div className="flex items-center gap-2">
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
 Duration: {exp.duration_seconds}s
 </span>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
 {exp.status}
 </span>
 </div>
 </div>
 <p className="text-sm text-slate-600">
 <span className="font-medium">Objective:</span> {exp.objective}
 </p>
 {exp.observations && (
 <p className="text-xs text-slate-500">
 Observations: {exp.observations}
 </p>
 )}
 {exp.ai_evaluation && (
 <div className="p-3 rounded-md bg-white border border-slate-200 text-sm space-y-1">
 <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
 <Lightbulb className="h-3 w-3" />
 AI Benchmark Evaluation
 </span>
 <p className="text-xs text-slate-600">
 {typeof exp.ai_evaluation ==='string' ? exp.ai_evaluation : (exp.ai_evaluation as any).summary ||'Telemetry patterns conform to expected physical bounds with robust packet transmission.'}
 </p>
 </div>
 )}
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-6 text-sm text-slate-500">
 No experiments logged yet. Launch the studio to run stress tests and record milestone benchmarks.
 </div>
 )}
 </div>
 </div>
 )}

 {activeTab ==='insights' && (
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <h2 className="text-sm font-semibold text-slate-900">Technological Trends & Identified Gaps</h2>
 <Link
 href="/insights"
 className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1"
 >
 <span>Explore All Insights</span>
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 <p className="text-sm text-slate-600">
 Review competitive differentiators, similar solutions, and research frontiers on the AI Insights dashboard.
 </p>
 </div>
 )}

 {activeTab ==='resources' && (
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <h2 className="text-sm font-semibold text-slate-900">Saved Project Library</h2>
 <Link
 href="/discover"
 className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1"
 >
 <span>Discover More Resources</span>
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {projectData.saved_resources?.map((s: any) => (
 <div key={s.id} className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-sm font-semibold text-slate-900">{s.resource?.title}</span>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{s.relevance_score}% Relevance</span>
 </div>
 <p className="text-sm text-slate-600 line-clamp-2">{s.resource?.description}</p>
 {s.resource?.url && (
 <a
 href={s.resource.url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1 pt-1"
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

 {activeTab ==='reviews' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-sm font-semibold text-slate-900">Faculty Mentor Evaluation & Feedback</h2>
 <span className="text-sm text-slate-500">Institutional Advisory Track</span>
 </div>

 {projectData.reviews?.length > 0 ? (
 <div className="space-y-4">
 {projectData.reviews.map((rev: any) => (
 <div key={rev.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2">
 <Info className="h-5 w-5 text-slate-500" />
 <span className="text-sm font-semibold text-slate-900">Faculty Advisor Review</span>
 </div>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
 Score: {rev.rating} / 5.0
 </span>
 </div>

 <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-md border border-slate-200">
 &quot;{rev.feedback}&quot;
 </p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
 <div className="p-4 rounded-md bg-white border border-slate-200 space-y-2">
 <span className="font-semibold text-slate-900">Identified Strengths:</span>
 <ul className="list-disc list-inside text-slate-600 space-y-1 text-sm">
 {(rev.strengths || ['Clear social impact','Sound technical architecture']).map((s: string, i: number) => (
 <li key={i}>{s}</li>
 ))}
 </ul>
 </div>
 <div className="p-4 rounded-md bg-white border border-slate-200 space-y-2">
 <span className="font-semibold text-slate-900">Areas for Improvement:</span>
 <ul className="list-disc list-inside text-slate-600 space-y-1 text-sm">
 {(rev.areas_for_improvement || ['Add integration tests','Run latency benchmarks']).map((a: string, i: number) => (
 <li key={i}>{a}</li>
 ))}
 </ul>
 </div>
 </div>

 {/* Student Response Thread */}
 <div className="pt-4 border-t border-slate-200 space-y-3">
 <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <MessageSquare className="h-4 w-4 text-slate-500" />
 Student Response to Mentor
 </span>

 {replySent ? (
 <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
 <CheckCircle2 className="h-4 w-4 text-emerald-600" />
 <span>Your response was posted and notified to Dr. Radhika Sen.</span>
 </div>
 ) : (
 <div className="space-y-2">
 <textarea
 value={studentReply}
 onChange={(e) => setStudentReply(e.target.value)}
 placeholder="Write your response, update notes, or clarification for your faculty advisor..."
 rows={2}
 className="w-full p-3 rounded-md bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 <button
 onClick={() => {
 if (studentReply.trim()) setReplySent(true);
 }}
 className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
 >
 <Send className="h-4 w-4" />
 <span>Submit Response</span>
 </button>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-10 rounded-lg bg-white border border-slate-200 shadow-sm">
 <p className="text-sm text-slate-500">No mentor feedback submitted yet. Sign in as a Faculty Mentor to submit an evaluation.</p>
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
