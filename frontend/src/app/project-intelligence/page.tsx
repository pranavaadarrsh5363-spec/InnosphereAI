'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
 Activity,
 ShieldAlert,
 ArrowRight,
 RefreshCw,
 CheckCircle2,
 AlertTriangle,
 BookOpen,
 Cpu,
 MapPin,
 GraduationCap,
 ExternalLink,
 Zap,
 TrendingUp,
 BarChart2,
 Database,
 Radio,
 FileText,
 Info
} from'lucide-react';
import { useAuth } from'@/lib/auth-context';
import { useProject } from'@/lib/project-context';
import { api } from'@/lib/api';
import {
 ProjectIntelligenceProfile
} from'@/types';
import { getDomainColor } from'@/lib/utils';

export default function ProjectIntelligencePage() {
 const router = useRouter();
 const { user } = useAuth();
 const { projects, activeProject, setActiveProjectId } = useProject();

 const [profile, setProfile] = useState<ProjectIntelligenceProfile | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<'overview' |'dimensions' |'risks' |'research' |'timeline'>('overview');

 const selectedProjectId = activeProject?.id || (projects.length > 0 ? projects[0].id : 1);

 useEffect(() => {
 if (selectedProjectId) {
 loadIntelligence(selectedProjectId);
 }
 }, [selectedProjectId]);

 const loadIntelligence = async (projectId: number) => {
 setIsLoading(true);
 setError(null);
 try {
 const data = await api.getProjectIntelligence(projectId);
 setProfile(data);
 } catch (err: any) {
 console.error('Failed to load project intelligence:', err);
 setError(err.message ||'Unable to evaluate project intelligence at this time.');
 } finally {
 setIsLoading(false);
 }
 };

 const handleRefresh = async () => {
 if (!selectedProjectId) return;
 setIsRefreshing(true);
 try {
 const res = await api.refreshProjectIntelligence(selectedProjectId);
 if (res && res.profile) {
 setProfile(res.profile);
 }
 } catch (err: any) {
 console.error('Failed to refresh intelligence:', err);
 } finally {
 setIsRefreshing(false);
 }
 };

 const getHealthBadge = (status: string) => {
 switch (status) {
 case'EXEMPLARY':
 return {
 label:'Exemplary Maturity',
 bg:'bg-emerald-50 border-emerald-200 text-emerald-700',
 dot:'bg-emerald-500'
 };
 case'STRONG':
 return {
 label:'Strong Foundation',
 bg:'bg-indigo-50 border-indigo-200 text-indigo-700',
 dot:'bg-indigo-500'
 };
 case'DEVELOPING':
 return {
 label:'Developing Progress',
 bg:'bg-blue-50 border-blue-200 text-blue-700',
 dot:'bg-blue-500'
 };
 case'NEEDS_ATTENTION':
 return {
 label:'Needs Attention',
 bg:'bg-amber-50 border-amber-200 text-amber-700',
 dot:'bg-amber-500'
 };
 case'CRITICAL':
 default:
 return {
 label:'Early Formulation',
 bg:'bg-red-50 border-red-200 text-red-700',
 dot:'bg-red-500'
 };
 }
 };

 const getDimensionIcon = (key: string) => {
 switch (key) {
 case'problem_clarity':
 return <FileText className="h-4 w-4 text-emerald-500" />;
 case'research_readiness':
 return <BookOpen className="h-4 w-4 text-blue-500" />;
 case'technology_stack':
 return <Cpu className="h-4 w-4 text-indigo-500" />;
 case'resource_readiness':
 return <Database className="h-4 w-4 text-purple-500" />;
 case'hardware_readiness':
 return <Radio className="h-4 w-4 text-cyan-500" />;
 case'execution_progress':
 return <MapPin className="h-4 w-4 text-amber-500" />;
 case'validation_and_risk':
 default:
 return <GraduationCap className="h-4 w-4 text-pink-500" />;
 }
 };

 const getSeverityBadge = (severity: string) => {
 switch (severity) {
 case'CRITICAL':
 return'bg-red-100 text-red-700 border-red-200';
 case'HIGH':
 return'bg-orange-100 text-orange-700 border-orange-200';
 case'MEDIUM':
 return'bg-amber-100 text-amber-700 border-amber-200';
 case'LOW':
 default:
 return'bg-blue-100 text-blue-700 border-blue-200';
 }
 };

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
 {/* Top Banner / Header */}
 <div className="border-b border-slate-200 bg-white sticky top-13 sm:top-14 z-20">
 <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
 <Activity className="h-4 w-4" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-semibold text-slate-900">
 Project Intelligence Command Center
 </h1>
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
 <Activity className="h-3 w-3" /> Intelligence Engine
 </span>
 </div>
 <p className="text-sm text-slate-600">
 Multidimensional maturity analysis, automated risk radar & evidence-backed Next Best Action
 </p>
 </div>
 </div>

 {/* Project Switcher & Action Controls */}
 <div className="flex items-center gap-2">
 {projects.length > 1 && (
 <select
 value={selectedProjectId}
 onChange={(e) => setActiveProjectId(Number(e.target.value))}
 aria-label="Select Project"
 className="bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
 >
 {projects.map((p) => (
 <option key={p.id} value={p.id}>
 {p.title} ({p.domain})
 </option>
 ))}
 </select>
 )}

 <button
 onClick={handleRefresh}
 disabled={isRefreshing}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`h-4 w-4 ${isRefreshing ?'animate-spin' :''}`} />
 <span>{isRefreshing ?'Evaluating...' :'Recalculate'}</span>
 </button>
 </div>
 </div>

 {/* Navigation Sub-Tabs */}
 <div className="flex items-center gap-2 mt-4 border-t border-slate-200 pt-3 overflow-x-auto">
 {[
 { id:'overview', label:'Command Overview', icon: Activity },
 { id:'dimensions', label:'7-Dimension Maturity', icon: BarChart2 },
 { id:'risks', label:`Risk Matrix (${profile?.risks.length || 0})`, icon: ShieldAlert },
 { id:'research', label:'Research Landscape', icon: BookOpen },
 { id:'timeline', label:'Health Trajectory', icon: TrendingUp }
 ].map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
 isActive
 ?'bg-slate-100 text-slate-900 border border-slate-200'
 :'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
 }`}
 >
 <Icon className="h-4 w-4 shrink-0" />
 <span>{tab.label}</span>
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
 {isLoading ? (
 <div className="bg-white rounded-lg p-12 text-center border border-slate-200 shadow-sm space-y-4">
 <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
 <div>
 <p className="text-sm font-semibold text-slate-900">Synthesizing Project Intelligence Profile...</p>
 <p className="text-sm text-slate-500 mt-1">
 Evaluating literature depth, roadmap velocity, risk indicators & Next Best Action
 </p>
 </div>
 </div>
 ) : error ? (
 <div className="bg-white rounded-lg p-8 text-center border border-slate-200 space-y-3">
 <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
 <h3 className="text-sm font-semibold text-slate-900">Intelligence Evaluation Unavailable</h3>
 <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
 <button
 onClick={() => selectedProjectId && loadIntelligence(selectedProjectId)}
 className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-sm font-medium rounded-md text-slate-700"
 >
 Retry Evaluation
 </button>
 </div>
 ) : profile ? (
 <>
 {/* Health Score Banner & Project Overview */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 {/* Health Radial / Gauge Card */}
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-slate-500 uppercase">
 Composite Project Health
 </span>
 {profile.cache_hit && (
 <span className="text-xs text-slate-400 font-mono">Cached</span>
 )}
 </div>

 <div className="my-4 flex items-center gap-5">
 <div className="relative flex items-center justify-center shrink-0">
 <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
 <circle
 cx="50"
 cy="50"
 r="40"
 className="text-slate-100 stroke-current"
 strokeWidth="8"
 fill="transparent"
 />
 <circle
 cx="50"
 cy="50"
 r="40"
 className={`stroke-current transition-all duration-1000 ease-out ${
 profile.overall_health_score >= 85
 ?'text-emerald-500'
 : profile.overall_health_score >= 70
 ?'text-indigo-600'
 : profile.overall_health_score >= 50
 ?'text-amber-500'
 :'text-red-500'
 }`}
 strokeWidth="8"
 strokeDasharray={2 * Math.PI * 40}
 strokeDashoffset={2 * Math.PI * 40 * (1 - profile.overall_health_score / 100)}
 strokeLinecap="round"
 fill="transparent"
 />
 </svg>
 <div className="absolute flex flex-col items-center justify-center">
 <span className="text-xl font-bold text-slate-900">{profile.overall_health_score}</span>
 <span className="text-xs text-slate-500 font-medium">/ 100</span>
 </div>
 </div>

 <div className="space-y-2">
 {(() => {
 const badge = getHealthBadge(profile.health_status);
 return (
 <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${badge.bg}`}>
 <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
 <span>{badge.label}</span>
 </div>
 );
 })()}
 <p className="text-sm text-slate-600 line-clamp-3">
 {profile.summary_verdict}
 </p>
 </div>
 </div>

 <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
 <span>Evaluated: {new Date(profile.evaluated_at).toLocaleDateString()}</span>
 <Link
 href={`/roadmap/${profile.project_id}`}
 className="text-indigo-600 hover:underline font-medium flex items-center gap-1"
 >
 View Roadmap <ArrowRight className="h-3 w-3" />
 </Link>
 </div>
 </div>

 {/* Next Best Action Card */}
 <div className="lg:col-span-2 bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2">
 <div className="h-6 w-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
 <Zap className="h-3.5 w-3.5" />
 </div>
 <span className="text-sm font-semibold text-slate-900">
 Highest-Leverage Next Action
 </span>
 </div>

 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 +{profile.next_best_action.impact_score} Health Pts
 </span>
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
 Est. {profile.next_best_action.estimated_effort}
 </span>
 </div>
 </div>

 <div className="my-3 space-y-2">
 <h3 className="text-sm font-semibold text-slate-900">
 {profile.next_best_action.title}
 </h3>
 <p className="text-sm text-slate-600">
 {profile.next_best_action.rationale}
 </p>

 {/* Action Checklist */}
 <div className="space-y-1.5 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
 <span className="text-xs font-semibold text-slate-700 block mb-1">
 Execution Steps:
 </span>
 {profile.next_best_action.actionable_steps.map((step, idx) => (
 <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
 <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
 <span>{step}</span>
 </div>
 ))}
 </div>

 {/* Supporting Resource Links */}
 {profile.next_best_action.supporting_resources.length > 0 && (
 <div className="flex flex-wrap items-center gap-2 pt-1">
 <span className="text-xs font-medium text-slate-500">Linked Citations:</span>
 {profile.next_best_action.supporting_resources.map((res, idx) => (
 <a
 key={idx}
 href={res.url}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium transition-colors border border-slate-200"
 >
 <span className="truncate max-w-[180px]">{res.title}</span>
 <ExternalLink className="h-3 w-3 shrink-0" />
 </a>
 ))}
 </div>
 )}
 </div>

 <div className="flex items-center justify-between pt-2 text-sm text-slate-500">
 <span>Suggested Phase: <strong className="text-slate-700">{profile.next_best_action.suggested_phase}</strong></span>
 <Link
 href="/discover"
 className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-medium text-sm transition-colors"
 >
 Open Resource Discovery
 </Link>
 </div>
 </div>
 </div>

 {/* TAB 1: OVERVIEW & 7-DIMENSION SNAPSHOT */}
 {activeTab ==='overview' && (
 <div className="space-y-6">
 {/* 7-Dimension Maturity Grid */}
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2">
 <BarChart2 className="h-4 w-4 text-slate-500" />
 <h3 className="text-sm font-semibold text-slate-900">7-Dimensional Project Maturity Matrix</h3>
 </div>
 <span className="text-xs text-slate-500">Click any vector for details</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {profile.dimensions.map((dim) => {
 const isExpanded = expandedDimension === dim.key;
 return (
 <div
 key={dim.key}
 onClick={() => setExpandedDimension(isExpanded ? null : dim.key)}
 className={`p-4 rounded-lg border transition-colors cursor-pointer ${
 isExpanded
 ?'bg-slate-50 border-indigo-500'
 :'bg-white border-slate-200 hover:border-slate-300'
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 {getDimensionIcon(dim.key)}
 <span className="text-sm font-semibold text-slate-800 truncate max-w-[130px]">
 {dim.name}
 </span>
 </div>
 <span className="text-xs font-medium text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
 {dim.score}%
 </span>
 </div>

 {/* Progress Bar */}
 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-3">
 <div
 className={`h-full rounded-full transition-all duration-500 ${
 dim.score >= 80
 ?'bg-emerald-500'
 : dim.score >= 65
 ?'bg-indigo-600'
 : dim.score >= 45
 ?'bg-amber-500'
 :'bg-red-500'
 }`}
 style={{ width:`${dim.score}%` }}
 />
 </div>

 <p className="text-xs text-slate-600 line-clamp-2">
 {dim.summary}
 </p>

 {/* Expanded Evidence & Recommendations Drawer */}
 {isExpanded && (
 <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
 <div>
 <span className="text-xs font-semibold text-slate-700 block mb-1">
 Evidence Points:
 </span>
 <ul className="space-y-1">
 {dim.evidence.map((ev, i) => (
 <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
 <span className="text-slate-400">•</span>
 <span>{ev}</span>
 </li>
 ))}
 </ul>
 </div>

 {dim.actionable_recommendations.length > 0 && (
 <div>
 <span className="text-xs font-semibold text-slate-700 block mb-1">
 Recommendations:
 </span>
 <ul className="space-y-1">
 {dim.actionable_recommendations.map((rec, i) => (
 <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
 <span className="text-indigo-600">→</span>
 <span>{rec}</span>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>
 )}

 <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
 <span>Weight: {(dim.weight * 100).toFixed(0)}%</span>
 <span className="text-indigo-600 font-medium">
 {isExpanded ?'Collapse' :'Details'}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Risk Radar Summary & Hardware Lab Health */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Active Risks Radar */}
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-3">
 <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
 <div className="flex items-center gap-2">
 <ShieldAlert className="h-4 w-4 text-slate-500" />
 <h3 className="text-sm font-semibold text-slate-900">
 Active Project Risks ({profile.risks.length})
 </h3>
 </div>
 <button
 onClick={() => setActiveTab('risks')}
 className="text-xs text-indigo-600 hover:underline font-medium"
 >
 View All
 </button>
 </div>

 <div className="space-y-2">
 {profile.risks.slice(0, 3).map((risk) => (
 <div key={risk.id} className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-sm font-semibold text-slate-900">{risk.title}</span>
 <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityBadge(risk.severity)}`}>
 {risk.severity}
 </span>
 </div>
 <p className="text-xs text-slate-600">{risk.description}</p>
 <div className="text-xs text-slate-700 font-medium pt-1">
 Mitigation: <span className="font-normal text-slate-600">{risk.mitigation}</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Hardware & Telemetry Readiness */}
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-3">
 <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
 <div className="flex items-center gap-2">
 <Radio className="h-4 w-4 text-slate-500" />
 <h3 className="text-sm font-semibold text-slate-900">
 Hardware Lab & Edge Telemetry
 </h3>
 </div>
 <Link
 href="/hardware-lab"
 className="text-xs text-indigo-600 hover:underline font-medium"
 >
 Open Lab
 </Link>
 </div>

 <div className="grid grid-cols-2 gap-3 text-center">
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 font-medium">Active Devices</span>
 <p className="text-lg font-semibold text-slate-900 mt-1">
 {profile.hardware_intelligence.device_count}
 </p>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 font-medium">Sensors Probed</span>
 <p className="text-lg font-semibold text-slate-900 mt-1">
 {profile.hardware_intelligence.sensor_count}
 </p>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 font-medium">Packet Health</span>
 <p className="text-lg font-semibold text-emerald-600 mt-1">
 {profile.hardware_intelligence.packet_health_pct}%
 </p>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
 <span className="text-xs text-slate-500 font-medium">Validation Status</span>
 <p className="text-sm font-medium text-slate-700 mt-2 truncate">
 {profile.hardware_intelligence.validation_status}
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* TAB 2: FULL 7-DIMENSION MATURITY BREAKDOWN */}
 {activeTab ==='dimensions' && (
 <div className="space-y-4">
 {profile.dimensions.map((dim) => (
 <div key={dim.key} className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-md bg-slate-50 border border-slate-200">
 {getDimensionIcon(dim.key)}
 </div>
 <div>
 <h3 className="text-sm font-semibold text-slate-900">{dim.name}</h3>
 <p className="text-sm text-slate-600">{dim.summary}</p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="text-right">
 <span className="text-lg font-bold text-slate-900">{dim.score}%</span>
 <span className="text-xs text-slate-500 block">Weight: {(dim.weight * 100).toFixed(0)}%</span>
 </div>
 <div className="w-24 sm:w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
 <div
 className="bg-indigo-600 h-full rounded-full"
 style={{ width:`${dim.score}%` }}
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
 {/* Evidence */}
 <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
 <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
 <Info className="h-4 w-4 text-slate-400" /> Evidence-Backed Metrics:
 </span>
 <ul className="space-y-2">
 {dim.evidence.map((ev, i) => (
 <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
 <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
 <span>{ev}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Recommendations */}
 <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
 <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
 <Activity className="h-4 w-4 text-slate-400" /> Actionable Recommendations:
 </span>
 <ul className="space-y-2">
 {dim.actionable_recommendations.map((rec, i) => (
 <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
 <ArrowRight className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
 <span>{rec}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* TAB 3: PROJECT RISKS & MITIGATIONS */}
 {activeTab ==='risks' && (
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div>
 <h3 className="text-sm font-semibold text-slate-900">Automated Project Risk Radar</h3>
 <p className="text-sm text-slate-600">
 Evaluates technical hurdles, data scarcity, hardware calibration, and execution bottlenecks
 </p>
 </div>
 <span className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 {profile.risks.length} Detected Risks
 </span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {profile.risks.map((risk) => (
 <div key={risk.id} className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-slate-500 uppercase">
 {risk.category} Risk
 </span>
 <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityBadge(risk.severity)}`}>
 {risk.severity} SEVERITY
 </span>
 </div>
 <h4 className="text-sm font-semibold text-slate-900">{risk.title}</h4>
 <p className="text-sm text-slate-600">{risk.description}</p>
 <div className="text-sm text-slate-700">
 Impact: <span className="font-normal text-slate-600">{risk.impact}</span>
 </div>
 </div>

 <div className="pt-3 border-t border-slate-200 text-sm text-slate-700">
 <strong className="block mb-1">Mitigation Action:</strong>
 <span className="text-slate-600">{risk.mitigation}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* TAB 4: RESEARCH CLUSTERS & INNOVATION GAPS */}
 {activeTab ==='research' && (
 <div className="space-y-6">
 {/* 4 Research Pillars */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {profile.research_clusters.map((cluster, idx) => (
 <div key={idx} className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-3">
 <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
 <span className="text-xs font-medium text-slate-700 uppercase">
 Pillar: {cluster.pillar}
 </span>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
 {cluster.resource_count} resources
 </span>
 </div>

 <h4 className="text-sm font-semibold text-slate-900">{cluster.cluster_name}</h4>

 <div className="space-y-2">
 <span className="text-xs font-semibold text-slate-700 block">
 Key Literature Findings:
 </span>
 {cluster.key_findings.map((f, fi) => (
 <div key={fi} className="text-sm text-slate-600 flex items-start gap-1.5">
 <span className="text-slate-400">•</span>
 <span>{f}</span>
 </div>
 ))}
 </div>

 {cluster.gap_identification && (
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-600 mt-2">
 <strong className="text-slate-900">Identified Research Gap:</strong> {cluster.gap_identification}
 </div>
 )}

 {cluster.sample_resources.length > 0 && (
 <div className="pt-3 border-t border-slate-100">
 <span className="text-xs font-semibold text-slate-700 block mb-2">
 Primary Literature Links:
 </span>
 <div className="space-y-1.5">
 {cluster.sample_resources.map((s, si) => (
 <a
 key={si}
 href={s.url}
 target="_blank"
 rel="noreferrer"
 className="flex items-center justify-between text-sm text-indigo-600 hover:underline bg-slate-50 p-2 rounded-md border border-slate-200 transition-colors"
 >
 <span className="truncate">{s.title}</span>
 <ExternalLink className="h-4 w-4 shrink-0 ml-2" />
 </a>
 ))}
 </div>
 </div>
 )}
 </div>
 ))}
 </div>

 {/* Innovation Gaps & Opportunities */}
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
 <div className="border-b border-slate-100 pb-3">
 <h3 className="text-sm font-semibold text-slate-900">Strategic Innovation Gaps & Competitive Edge</h3>
 <p className="text-sm text-slate-600">
 Identifies where incumbent solutions fall short and how {profile.project_title} delivers distinct value
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {profile.innovation_gaps.map((gap, i) => (
 <div key={i} className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
 <span className="text-sm font-semibold text-slate-900 block">{gap.gap}</span>
 <div className="text-sm text-slate-600">
 <strong>Current Industry State:</strong> {gap.current_state}
 </div>
 <div className="text-sm text-slate-700">
 <strong>Your Strategic Advantage:</strong> {gap.your_advantage}
 </div>
 <div className="p-3 bg-white rounded-md text-sm text-slate-700 mt-2 border border-slate-200">
 <strong>Recommended Action:</strong> {gap.recommended_action}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* TAB 5: HEALTH TIMELINE & TRAJECTORY */}
 {activeTab ==='timeline' && (
 <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4">
 <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
 <div>
 <h3 className="text-sm font-semibold text-slate-900">Historical Project Health Trajectory</h3>
 <p className="text-sm text-slate-600">
 Snapshots recorded during major development milestones
 </p>
 </div>
 <span className="text-sm text-slate-500">
 {profile.timeline_snapshots.length} Snapshots
 </span>
 </div>

 <div className="space-y-4 relative pl-4 sm:pl-6 border-l-2 border-slate-200 my-4">
 {profile.timeline_snapshots.map((snap) => (
 <div key={snap.id} className="relative">
 <div className="absolute -left-[23px] sm:-left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-indigo-600 border-2 border-white" />
 <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <span className="text-sm font-semibold text-slate-900">
 Health Score: {snap.health_score}/100 ({snap.health_status})
 </span>
 <span className="text-xs text-slate-500">
 {new Date(snap.created_at).toLocaleString()}
 </span>
 </div>
 {snap.summary_verdict && (
 <p className="text-sm text-slate-600">{snap.summary_verdict}</p>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </>
 ) : null}
 </main>
 </div>
 );
}
