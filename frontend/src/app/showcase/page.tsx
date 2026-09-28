'use client';

import React, { useState, useEffect, Suspense } from'react';
import { useRouter, useSearchParams } from'next/navigation';
import Link from'next/link';
import {
 ShieldCheck,
 Activity,
 Layers,
 Compass,
 Atom,
 FlaskConical,
 Cpu,
 Bookmark,
 FileText,
 CheckCircle2,
 AlertTriangle,
 Info,
 ExternalLink,
 Download,
 Copy,
 Check,
 Eye,
 Zap,
 Target,
 ArrowRight,
 TrendingUp,
 Award,
 Terminal,
 Server,
 FolderOpen,
 X,
} from'lucide-react';
import { api } from'@/lib/api';
import { useProject } from'@/lib/project-context';

function ShowcaseContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { activeProject } = useProject();

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [showcaseData, setShowcaseData] = useState<any>(null);
 const [healthData, setHealthData] = useState<any>(null);

 // Active Section Selection (0 to 11)
 const [activeSectionIdx, setActiveSectionIdx] = useState(0);

 // Interactive Architecture & Evidence Inspection
 const [selectedArchComponent, setSelectedArchComponent] = useState<any>(null);
 const [selectedEvidenceItem, setSelectedEvidenceItem] = useState<any>(null);
 const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
 const [summaryModalOpen, setSummaryModalOpen] = useState(false);
 const [summaryData, setSummaryData] = useState<any>(null);
 const [copiedSummary, setCopiedSummary] = useState(false);

 // Hardware simulator local telemetry state
 const [simTelemetry, setSimTelemetry] = useState({
 turbidity: 3.42,
 pH: 7.18,
 temp: 24.6,
 battery: 94,
 anomaly: false
 });

 // Load project showcase
 const projectIdToLoad = searchParams.get('projectId') 
 ? parseInt(searchParams.get('projectId')!) 
 : (activeProject ? activeProject.id : null);

 useEffect(() => {
 async function loadData() {
 setLoading(true);
 setError(null);
 try {
 let pId: number = projectIdToLoad || 1;
 if (!projectIdToLoad) {
 try {
 const flagship = await api.getFlagshipShowcase();
 pId = flagship.flagship_project_id || 1;
 } catch {
 pId = 1;
 }
 }

 const [showcaseRes, healthRes] = await Promise.allSettled([
 api.getShowcase(pId),
 api.getShowcaseHealth(pId)
 ]);

 if (showcaseRes.status ==='fulfilled') {
 setShowcaseData(showcaseRes.value);
 if (showcaseRes.value.architecture?.components?.length > 0) {
 setSelectedArchComponent(showcaseRes.value.architecture.components[0]);
 }
 } else {
 throw new Error('Failed to load project showcase data');
 }

 if (healthRes.status ==='fulfilled') {
 setHealthData(healthRes.value);
 }
 } catch (err: any) {
 console.error(err);
 setError(err.message ||'Unable to connect to the showcase service.');
 } finally {
 setLoading(false);
 }
 }

 loadData();
 }, [projectIdToLoad]);

 // Hardware Telemetry Simulation Ticker (Read-only simulation preview)
 useEffect(() => {
 const teleInterval = setInterval(() => {
 setSimTelemetry((prev) => ({
 turbidity: +(prev.turbidity + (Math.random() * 0.1 - 0.05)).toFixed(2),
 pH: +(prev.pH + (Math.random() * 0.04 - 0.02)).toFixed(2),
 temp: +(prev.temp + (Math.random() * 0.06 - 0.03)).toFixed(1),
 battery: Math.max(80, prev.battery - (Math.random() > 0.9 ? 1 : 0)),
 anomaly: prev.anomaly
 }));
 }, 2500);
 return () => clearInterval(teleInterval);
 }, []);

 const sections = showcaseData?.sections || showcaseData?.stages || [];
 const currentSection = sections[activeSectionIdx] || null;

 const handleFetchEvidenceSummary = async () => {
 if (!showcaseData) return;
 try {
 const sum = await api.getEvidenceSummary(showcaseData.project_id);
 setSummaryData(sum);
 setSummaryModalOpen(true);
 } catch (e) {
 console.error(e);
 }
 };

 const openEvidenceDrawer = (item: any) => {
 setSelectedEvidenceItem(item);
 setEvidenceDrawerOpen(true);
 };

 const getStatusBadge = (status: string) => {
 switch (status) {
 case'READY':
 return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">● Ready</span>;
 case'SIMULATED':
 return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">● Simulated</span>;
 case'PARTIAL':
 return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">● Partial</span>;
 case'NOT_TESTED':
 return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">● Not tested</span>;
 default:
 return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">● {status}</span>;
 }
 };

 const getEvidenceSourceBadge = (type: string) => {
 switch (type) {
 case'OBSERVED':
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Observed</span>;
 case'PUBLISHED':
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Published</span>;
 case'STUDENT_PROVIDED':
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">Student</span>;
 case'AI_SUGGESTED':
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">AI suggestion</span>;
 case'SIMULATED':
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Simulated</span>;
 default:
 return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">{type}</span>;
 }
 };

 if (loading) {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 mb-4">
 <Layers className="h-6 w-6 text-indigo-600" />
 </div>
 <h2 className="text-xl font-semibold text-slate-900">Loading Project Presentation...</h2>
 <p className="text-sm text-slate-600 mt-1">Aggregating project intelligence, telemetry, experiments & citations</p>
 </div>
 );
 }

 if (error || !showcaseData) {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
 <div className="max-w-md w-full rounded-lg bg-white border border-slate-200 p-6 text-center shadow-sm">
 <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto mb-3" />
 <h3 className="text-sm font-semibold text-slate-900">Project Presentation Notice</h3>
 <p className="text-sm text-slate-600 mt-2">{error ||'Project data could not be loaded.'}</p>
 <div className="flex justify-center gap-3 mt-5">
 <button
 onClick={() => window.location.reload()}
 className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
 >
 Retry Connection
 </button>
 <Link
 href="/dashboard"
 className="px-3 py-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md shadow-sm"
 >
 Back to Dashboard
 </Link>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900">
 <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 py-3.5">
 <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
 {/* Project Title & Status Badges */}
 <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
 <div className="flex items-center gap-2">
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
 Innovation showcase
 </span>
 <h1 className="text-xl font-semibold text-slate-900 truncate max-w-[280px] sm:max-w-md">
 {showcaseData.title}
 </h1>
 </div>
 <div className="flex items-center gap-2 text-xs text-slate-500">
 <span className="flex items-center gap-1 text-emerald-700 font-medium">
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
 {showcaseData.domain ||'Innovation Project'}
 </span>
 <span>•</span>
 <span className="flex items-center gap-1 text-indigo-700 font-medium">
 <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
 {showcaseData.readiness?.overall_score || 85}% Validated
 </span>
 </div>
 </div>

 {/* Action Links & Evidence Tools */}
 <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 w-full lg:w-auto">
 <button
 onClick={handleFetchEvidenceSummary}
 className="px-3 py-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md shadow-sm flex items-center gap-1.5"
 title="Generate Project Evidence Summary"
 >
 <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
 <span>Evidence Summary</span>
 </button>

 <Link
 href={`/projects/${showcaseData.project_id}/research`}
 className="px-3 py-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md shadow-sm flex items-center gap-1.5"
 >
 <Atom className="h-3.5 w-3.5 text-blue-600" />
 <span>Research Hub</span>
 </Link>

 <Link
 href={`/projects/${showcaseData.project_id}/validation`}
 className="px-3 py-1.5 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md shadow-sm flex items-center gap-1.5"
 >
 <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
 <span>Validation Matrix</span>
 </Link>

 <Link
 href="/presentation"
 className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm flex items-center gap-1.5"
 >
 <Award className="h-3.5 w-3.5" />
 <span>Pitch Deck</span>
 </Link>
 </div>
 </div>
 </div>

 <div className="bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto scrollbar-none">
 <div className="max-w-6xl mx-auto flex items-center gap-1.5 min-w-[980px]">
 {sections.map((sec: any, idx: number) => {
 const isActive = idx === activeSectionIdx;
 const secName = sec.name ? sec.name.replace(/^\d+\s*/,'') :`Section ${idx + 1}`;
 return (
 <button
 key={sec.id || idx}
 onClick={() => setActiveSectionIdx(idx)}
 className={`flex-1 min-w-[76px] p-2.5 rounded-lg text-left border ${
 isActive
 ?'border-indigo-500 bg-indigo-50/50'
 :'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
 }`}
 >
 <div className="flex items-center justify-between gap-1 mb-1">
 <span className={`text-xs ${isActive ?'text-indigo-700' :'text-slate-400'}`}>
 {(idx + 1).toString().padStart(2,'0')}
 </span>
 {getStatusBadge(sec.status ||'READY')}
 </div>
 <div className={`text-xs font-semibold truncate ${isActive ?'text-indigo-900' :'text-slate-700'}`}>
 {secName}
 </div>
 </button>
 );
 })}
 </div>
 </div>

 <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
 {currentSection && (
 <div className="space-y-6">
 {/* Section Header Banner */}
 <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="text-xs font-medium text-indigo-700">
 Section {currentSection.section_number || currentSection.stage_number || activeSectionIdx + 1} of 12
 </span>
 {getStatusBadge(currentSection.status ||'READY')}
 </div>
 <h2 className="text-xl font-semibold text-slate-900">
 {currentSection.title}
 </h2>
 <p className="text-sm text-slate-600 max-w-3xl mt-1.5">
 {currentSection.summary}
 </p>
 </div>

 {/* Section Metrics & Evidence Badges */}
 <div className="flex items-center gap-3 shrink-0">
 <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-center">
 <div className="text-xs text-slate-500">Evidence Count</div>
 <div className="text-lg font-semibold text-indigo-700">
 {currentSection.evidence_count ?? (currentSection.evidence_items?.length || 0)}
 </div>
 </div>
 <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-center">
 <div className="text-xs text-slate-500">Readiness</div>
 <div className="text-lg font-semibold text-emerald-600">
 {currentSection.completion_pct || 90}%
 </div>
 </div>
 </div>
 </div>

 {/* SECTION 1: IDEA & BENEFICIARIES */}
 {(currentSection.id ==='idea' || activeSectionIdx === 0) && currentSection.section_data && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Target className="h-4 w-4 text-indigo-600" /> Target Beneficiaries & Users
 </h3>
 <p className="text-sm text-slate-600">
 {currentSection.section_data.target_users || currentSection.stage_data?.target_users}
 </p>
 <div className="pt-2 border-t border-slate-100">
 <span className="text-xs text-slate-500">Domain Classification: </span>
 <span className="text-xs text-indigo-700">
 {currentSection.section_data.domain || currentSection.stage_data?.domain || showcaseData.domain}
 </span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Award className="h-4 w-4 text-emerald-600" /> Expected Long-Term Impact
 </h3>
 <p className="text-sm text-slate-600">
 {currentSection.section_data.expected_impact || currentSection.stage_data?.expected_impact}
 </p>
 <div className="pt-2 border-t border-slate-100">
 <span className="text-xs text-slate-500">Project Status: </span>
 <span className="text-xs text-emerald-600">
 {currentSection.section_data.status || currentSection.stage_data?.status ||'Active'}
 </span>
 </div>
 </div>
 </div>
 )}

 {/* SECTION 2: PROBLEM STATEMENT & CONSTRAINTS */}
 {(currentSection.id ==='problem' || activeSectionIdx === 1) && (currentSection.section_data || currentSection.stage_data) && (
 <div className="space-y-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <h3 className="text-sm font-semibold text-slate-900 mb-2">Scoped Operational Problem Statement</h3>
 <p className="text-sm text-slate-600">
 {currentSection.section_data?.problem_statement || currentSection.stage_data?.problem_statement}
 </p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <h4 className="text-sm font-semibold text-slate-900 mb-3">
 Key Technical & Operational Constraints
 </h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {(currentSection.section_data?.constraints || currentSection.stage_data?.constraints)?.map((c: string, idx: number) => (
 <div key={idx} className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200 text-sm text-slate-600">
 <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
 <span>{c}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* SECTION 3: RESEARCH LANDSCAPE */}
 {(currentSection.id ==='research_landscape' || activeSectionIdx === 2) && (currentSection.section_data || currentSection.stage_data) && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
 <div className="text-sm text-slate-500">Cataloged Citations</div>
 <div className="text-xl font-semibold text-indigo-600 mt-1">
 {currentSection.section_data?.citations_count ?? currentSection.stage_data?.citations_count ?? 5}
 </div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
 <div className="text-sm text-slate-500">Connected Datasets & Repos</div>
 <div className="text-xl font-semibold text-blue-600 mt-1">
 {currentSection.section_data?.resources_count ?? currentSection.stage_data?.resources_count ?? 8}
 </div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
 <div className="text-sm text-slate-500">Connected Repositories</div>
 <div className="text-xl font-semibold text-purple-600 mt-1">6 Sources</div>
 </div>
 </div>

 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <h4 className="text-sm font-semibold text-slate-900 mb-3">
 Featured Peer-Reviewed Publications & Benchmark Baselines
 </h4>
 <div className="space-y-2.5">
 {(currentSection.section_data?.featured_citations || currentSection.stage_data?.featured_citations)?.map((cit: any, idx: number) => (
 <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
 {cit.key}
 </span>
 <h5 className="text-sm font-semibold text-slate-900">{cit.title}</h5>
 </div>
 <p className="text-xs text-slate-500 mt-1">
 {cit.venue} • {cit.year}
 </p>
 </div>
 {getEvidenceSourceBadge('PUBLISHED')}
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* SECTION 4: INNOVATION GAP */}
 {(currentSection.id ==='innovation_gap' || activeSectionIdx === 3) && (currentSection.section_data || currentSection.stage_data) && (
 <div className="space-y-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <h4 className="text-sm font-semibold text-indigo-600 mb-2">
 Proposed Technical Solution
 </h4>
 <p className="text-sm text-slate-600">
 {currentSection.section_data?.proposed_solution || currentSection.stage_data?.proposed_solution}
 </p>
 </div>

 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <h4 className="text-sm font-semibold text-slate-900 mb-3">
 Identified Innovation Gaps in Prior Art
 </h4>
 <div className="space-y-2">
 {(currentSection.section_data?.innovation_gaps || currentSection.stage_data?.innovation_gaps)?.map((gap: string, idx: number) => (
 <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-sm text-slate-600">
 <span className="h-5 w-5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center text-xs shrink-0">
 {idx + 1}
 </span>
 <span>{gap}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* SECTION 5: SYSTEM ARCHITECTURE */}
 {(currentSection.id ==='architecture' || activeSectionIdx === 4) && (
 <div className="space-y-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <h4 className="text-sm font-semibold text-slate-900 mb-3">
 Interactive Multi-Tier Pipeline (Click Component to Inspect)
 </h4>

 <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
 {showcaseData.architecture?.components?.map((comp: any) => {
 const isSelected = selectedArchComponent?.id === comp.id;
 return (
 <button
 key={comp.id}
 onClick={() => setSelectedArchComponent(comp)}
 className={`p-3 rounded-lg text-left border ${
 isSelected
 ?'border-indigo-500 bg-indigo-50/50'
 :'bg-slate-50 hover:bg-slate-100 border-slate-200'
 }`}
 >
 <div className="text-xs text-slate-500 truncate mb-1">
 {comp.layer}
 </div>
 <div className="text-sm font-semibold text-slate-900 truncate">
 {comp.name}
 </div>
 <div className="mt-2">
 {comp.is_simulated ? (
 <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
 Simulated
 </span>
 ) : (
 <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
 Prototype
 </span>
 )}
 </div>
 </button>
 );
 })}
 </div>

 {selectedArchComponent && (
 <div className="bg-slate-50 p-4 rounded-lg border border-indigo-200 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs text-indigo-700">
 {selectedArchComponent.layer}
 </span>
 {selectedArchComponent.is_simulated ? (
 <span className="text-xs text-amber-700">Hardware Simulator Mode</span>
 ) : (
 <span className="text-xs text-emerald-700">Working Prototype</span>
 )}
 </div>
 <h4 className="text-sm font-semibold text-slate-900">{selectedArchComponent.name}</h4>
 <div className="text-sm text-slate-600">
 <span className="font-semibold text-slate-500">Technology: </span>
 {selectedArchComponent.technology}
 </div>
 <div className="text-sm text-slate-600">
 <span className="font-semibold text-slate-500">Purpose: </span>
 {selectedArchComponent.purpose}
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* SECTION 6: EXPERIMENTS */}
 {(currentSection.id ==='experiments' || activeSectionIdx === 5) && (currentSection.section_data || currentSection.stage_data) && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {(currentSection.section_data?.experiments || currentSection.stage_data?.experiments)?.map((exp: any) => (
 <div key={exp.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
 Experiment #{exp.id}
 </span>
 <span className="text-xs font-semibold text-emerald-600">
 {exp.reproducibility_score}% Reproducibility
 </span>
 </div>
 <h4 className="text-sm font-semibold text-slate-900">{exp.name}</h4>
 <p className="text-sm text-slate-600 italic">&ldquo;{exp.hypothesis}&rdquo;</p>
 <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
 <span>Dataset: <strong className="text-slate-700">{exp.dataset}</strong></span>
 <span>Runs: <strong className="text-slate-700">{exp.runs_count}</strong></span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* SECTION 7: BENCHMARK MATRIX */}
 {(currentSection.id ==='benchmarks' || activeSectionIdx === 6) && (currentSection.section_data || currentSection.stage_data) && (
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <h4 className="text-sm font-semibold text-slate-900 mb-3">
 Quantitative Comparative Evaluation Matrix
 </h4>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm border-collapse">
 <thead>
 <tr className="border-b border-slate-200 text-slate-500">
 <th className="pb-2 font-medium">Metric</th>
 <th className="pb-2 font-medium">Standard Baseline</th>
 <th className="pb-2 font-medium">Proposed Method</th>
 <th className="pb-2 font-medium">Observed Diff</th>
 <th className="pb-2 font-medium">Outcome</th>
 <th className="pb-2 font-medium">Evidence Tag</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {(currentSection.section_data?.metrics_evaluated || currentSection.stage_data?.metrics_evaluated)?.map((m: any, idx: number) => (
 <tr key={idx} className="hover:bg-slate-50">
 <td className="py-2.5 text-slate-900">{m.metric}</td>
 <td className="py-2.5 text-slate-600">{m.baseline}</td>
 <td className="py-2.5 text-indigo-700">{m.proposed}</td>
 <td className="py-2.5 text-emerald-600">{m.diff}</td>
 <td className="py-2.5 font-semibold text-emerald-600">{m.outcome}</td>
 <td className="py-2.5">{getEvidenceSourceBadge(m.evidence_type ||'OBSERVED')}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* SECTION 8: HARDWARE LAB */}
 {(currentSection.id ==='hardware_lab' || activeSectionIdx === 7) && (
 <div className="space-y-4">
 <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <Cpu className="h-5 w-5 text-amber-600 shrink-0" />
 <div>
 <h4 className="text-sm font-semibold text-amber-700">
 Simulation Mode Active
 </h4>
 <p className="text-sm text-slate-600 mt-0.5">
 Sensor streams and packet delivery are executed via Synthetic Telemetry Generator for hardware demonstration safety.
 </p>
 </div>
 </div>
 <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs border border-amber-200 shrink-0">
 Simulated
 </span>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
 <div className="text-xs text-slate-500">Turbidity</div>
 <div className="text-xl font-semibold text-slate-900 mt-1">{simTelemetry.turbidity} <span className="text-sm text-slate-500 font-normal">NTU</span></div>
 <div className="text-xs text-emerald-600 mt-1">Normal Range</div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
 <div className="text-xs text-slate-500">pH Level</div>
 <div className="text-xl font-semibold text-slate-900 mt-1">{simTelemetry.pH}</div>
 <div className="text-xs text-emerald-600 mt-1">Neutral (Safe)</div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
 <div className="text-xs text-slate-500">Water Temp</div>
 <div className="text-xl font-semibold text-slate-900 mt-1">{simTelemetry.temp} <span className="text-sm text-slate-500 font-normal">°C</span></div>
 <div className="text-xs text-slate-500 mt-1">Ambient</div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
 <div className="text-xs text-slate-500">Packet Delivery</div>
 <div className="text-xl font-semibold text-emerald-600 mt-1">99.4%</div>
 <div className="text-xs text-indigo-700 mt-1">Mean Latency: 18.2ms</div>
 </div>
 </div>
 </div>
 )}

 {/* SECTION 9: VALIDATION MATRIX */}
 {(currentSection.id ==='validation_matrix' || activeSectionIdx === 8) && (currentSection.section_data || currentSection.stage_data) && (
 <div className="space-y-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <h4 className="text-sm font-semibold text-slate-900 mb-3">
 Innovation Claims & Scientific Verification States
 </h4>
 <div className="space-y-3">
 {(currentSection.section_data?.claims || currentSection.stage_data?.claims)?.map((cl: any) => (
 <div key={cl.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs text-indigo-700">Claim #{cl.id}</span>
 {getStatusBadge(cl.status)}
 </div>
 <h5 className="text-sm font-semibold text-slate-900">{cl.title}</h5>
 <p className="text-sm text-slate-600">{cl.claim}</p>
 <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
 <span>Question: <em>{cl.validation_question}</em></span>
 <span className="text-indigo-700">{cl.confidence} Confidence</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* SECTION 10: RESEARCH DOCUMENT */}
 {(currentSection.id ==='research_paper' || activeSectionIdx === 9) && (currentSection.section_data || currentSection.stage_data) && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
 <div className="text-sm text-slate-500">Academic Sections</div>
 <div className="text-xl font-semibold text-slate-900 mt-1">
 {currentSection.section_data?.sections_count ?? currentSection.stage_data?.sections_count ?? 8}
 </div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
 <div className="text-sm text-slate-500">Citation Coverage</div>
 <div className="text-xl font-semibold text-emerald-600 mt-1">
 {currentSection.section_data?.citation_coverage ?? currentSection.stage_data?.citation_coverage ??'100%'}
 </div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
 <div className="text-sm text-slate-500">Export Formats</div>
 <div className="text-xl font-semibold text-purple-600 mt-1">4 Types</div>
 </div>
 </div>

 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
 <div>
 <h4 className="text-sm font-semibold text-slate-900">IEEE LaTeX Research Package</h4>
 <p className="text-sm text-slate-500 mt-0.5">Ready for conference submission, faculty review, and archive indexing.</p>
 </div>
 <Link
 href={`/projects/${showcaseData.project_id}/research`}
 className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm flex items-center gap-1.5"
 >
 <span>Open Research Workspace</span>
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 )}

 {/* SECTION 11: IMPACT & LIMITATIONS */}
 {(currentSection.id ==='impact_limitations' || activeSectionIdx === 10) && showcaseData.impact && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
 <h4 className="text-sm font-semibold text-emerald-700">
 Social & Public Health Impact
 </h4>
 <p className="text-sm text-slate-600">
 {showcaseData.impact.social?.benefit}
 </p>
 <div className="text-sm font-semibold text-slate-900 pt-1">
 {showcaseData.impact.social?.metric}
 </div>
 </div>

 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
 <h4 className="text-sm font-semibold text-indigo-700">
 Economic & Cost Advantage
 </h4>
 <p className="text-sm text-slate-600">
 {showcaseData.impact.economic?.benefit}
 </p>
 <div className="text-sm font-semibold text-slate-900 pt-1">
 {showcaseData.impact.economic?.metric}
 </div>
 </div>
 </div>

 {showcaseData.limitations && (
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
 <h4 className="text-sm font-semibold text-amber-700 mb-2">
 Documented Scientific Boundaries & Known Limitations
 </h4>
 <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
 {showcaseData.limitations.hardware_limitations?.map((lim: string, idx: number) => (
 <li key={idx}>{lim}</li>
 ))}
 {showcaseData.limitations.missing_evidence?.map((lim: string, idx: number) => (
 <li key={idx}>{lim}</li>
 ))}
 </ul>
 </div>
 )}
 </div>
 )}

 {/* SECTION 12: PRESENTATION SLIDE DECK */}
 {(currentSection.id ==='presentation' || activeSectionIdx === 11) && (
 <div className="space-y-4">
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-center space-y-3">
 <Award className="h-10 w-10 text-indigo-600 mx-auto" />
 <h3 className="text-lg font-semibold text-slate-900">Full Competition Pitch Deck Ready</h3>
 <p className="text-sm text-slate-600 max-w-md mx-auto">
 The platform has automatically compiled your research, hardware evidence, and benchmarks into a 12-slide investor and evaluator presentation.
 </p>
 <div className="pt-4">
 <Link
 href="/presentation"
 className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm"
 >
 <Eye className="h-4 w-4" />
 <span>Launch Fullscreen Presentation</span>
 </Link>
 </div>
 </div>
 </div>
 )}
 </div>
 )}
 </main>
 </div>
 );
}

export default function ShowcasePage() {
 return (
 <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Loading Showcase...</div>}>
 <ShowcaseContent />
 </Suspense>
 );
}
