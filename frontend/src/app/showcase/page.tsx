'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
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
  FolderOpen
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';

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

        if (showcaseRes.status === 'fulfilled') {
          setShowcaseData(showcaseRes.value);
          if (showcaseRes.value.architecture?.components?.length > 0) {
            setSelectedArchComponent(showcaseRes.value.architecture.components[0]);
          }
        } else {
          throw new Error('Failed to load project showcase data');
        }

        if (healthRes.status === 'fulfilled') {
          setHealthData(healthRes.value);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unable to connect to the showcase service.');
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
      case 'READY':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-200">● READY</span>;
      case 'SIMULATED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-200">● SIMULATED</span>;
      case 'PARTIAL':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">● PARTIAL</span>;
      case 'NOT_TESTED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-200">● NOT TESTED</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600">● {status}</span>;
    }
  };

  const getEvidenceSourceBadge = (type: string) => {
    switch (type) {
      case 'OBSERVED':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">OBSERVED</span>;
      case 'PUBLISHED':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-300 border border-blue-500/40">PUBLISHED</span>;
      case 'STUDENT_PROVIDED':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">STUDENT</span>;
      case 'AI_SUGGESTED':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">AI SUGGESTION</span>;
      case 'SIMULATED':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">SIMULATED</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-200">{type}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 border border-blue-200 mb-4 animate-pulse">
          <Layers className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Loading Project Presentation...</h2>
        <p className="text-sm text-slate-400 mt-1">Aggregating project intelligence, telemetry, experiments & citations</p>
      </div>
    );
  }

  if (error || !showcaseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold">Project Presentation Notice</h3>
          <p className="text-sm text-slate-400 mt-2">{error || 'Project data could not be loaded.'}</p>
          <div className="flex justify-center gap-3 mt-5">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Retry Connection
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
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
      {/* ------------------------------------------------------------- */}
      {/* 1. CLEAN TOP HEADER & OVERVIEW BAR                            */}
      {/* ------------------------------------------------------------- */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xl px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Project Title & Status Badges */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-600/30 text-blue-700 border border-blue-200">
                INNOVATION SHOWCASE
              </span>
              <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[280px] sm:max-w-md">
                {showcaseData.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {showcaseData.domain || 'Innovation Project'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                {showcaseData.readiness?.overall_score || 85}% Validated
              </span>
            </div>
          </div>

          {/* Action Links & Evidence Tools */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 w-full lg:w-auto">
            <button
              onClick={handleFetchEvidenceSummary}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Generate Project Evidence Summary"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Evidence Summary</span>
            </button>

            <Link
              href={`/projects/${showcaseData.project_id}/research`}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Atom className="h-3.5 w-3.5 text-cyan-600" />
              <span>Research Hub</span>
            </Link>

            <Link
              href={`/projects/${showcaseData.project_id}/validation`}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Validation Matrix</span>
            </Link>

            <Link
              href="/presentation"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md hover:brightness-110 flex items-center gap-1.5 transition-all"
            >
              <Award className="h-3.5 w-3.5" />
              <span>Pitch Deck</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SECTION NAVIGATION TABS                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-[980px]">
          {sections.map((sec: any, idx: number) => {
            const isActive = idx === activeSectionIdx;
            const secName = sec.name ? sec.name.replace(/^\d+\s*/, '') : `Section ${idx + 1}`;
            return (
              <button
                key={sec.id || idx}
                onClick={() => setActiveSectionIdx(idx)}
                className={`flex-1 min-w-[76px] p-2.5 rounded-xl text-left border transition-all ${
                  isActive
                    ? 'bg-blue-50 border-indigo-500/80 shadow-md shadow-indigo-950/50 scale-[1.02]'
                    : 'bg-white border-slate-200 hover:border-slate-200 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  {getStatusBadge(sec.status || 'READY')}
                </div>
                <div className={`text-xs font-semibold truncate ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>
                  {secName}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. ACTIVE SECTION CONTENT & INTERACTIVE PRESENTATION PANELS   */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {currentSection && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Section Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-6 rounded-2xl border border-slate-200 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
                    Section {currentSection.section_number || currentSection.stage_number || activeSectionIdx + 1} of 12
                  </span>
                  {getStatusBadge(currentSection.status || 'READY')}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentSection.title}
                </h2>
                <p className="text-sm text-slate-300 max-w-3xl mt-1.5 leading-relaxed">
                  {currentSection.summary}
                </p>
              </div>

              {/* Section Metrics & Evidence Badges */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Evidence Count</div>
                  <div className="text-xl font-extrabold text-blue-600">
                    {currentSection.evidence_count ?? (currentSection.evidence_items?.length || 0)}
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Readiness</div>
                  <div className="text-xl font-extrabold text-emerald-600">
                    {currentSection.completion_pct || 90}%
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* SECTION SPECIFIC CONTENT                                  */}
            {/* --------------------------------------------------------- */}

            {/* SECTION 1: IDEA & BENEFICIARIES */}
            {(currentSection.id === 'idea' || activeSectionIdx === 0) && currentSection.section_data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" /> Target Beneficiaries & Users
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {currentSection.section_data.target_users || currentSection.stage_data?.target_users}
                  </p>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-400">Domain Classification: </span>
                    <span className="text-xs font-bold text-blue-700">
                      {currentSection.section_data.domain || currentSection.stage_data?.domain || showcaseData.domain}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600" /> Expected Long-Term Impact
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {currentSection.section_data.expected_impact || currentSection.stage_data?.expected_impact}
                  </p>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-400">Project Status: </span>
                    <span className="text-xs font-bold text-emerald-600 uppercase">
                      {currentSection.section_data.status || currentSection.stage_data?.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: PROBLEM STATEMENT & CONSTRAINTS */}
            {(currentSection.id === 'problem' || activeSectionIdx === 1) && (currentSection.section_data || currentSection.stage_data) && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-white mb-2">Scoped Operational Problem Statement</h3>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {currentSection.section_data?.problem_statement || currentSection.stage_data?.problem_statement}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Key Technical & Operational Constraints
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(currentSection.section_data?.constraints || currentSection.stage_data?.constraints)?.map((c: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-300">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: RESEARCH LANDSCAPE */}
            {(currentSection.id === 'research_landscape' || activeSectionIdx === 2) && (currentSection.section_data || currentSection.stage_data) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-400 font-medium">Cataloged Citations</div>
                    <div className="text-2xl font-black text-blue-600 mt-1">
                      {currentSection.section_data?.citations_count ?? currentSection.stage_data?.citations_count ?? 5}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-400 font-medium">Connected Datasets & Repos</div>
                    <div className="text-2xl font-black text-blue-400 mt-1">
                      {currentSection.section_data?.resources_count ?? currentSection.stage_data?.resources_count ?? 8}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-400 font-medium">Connected Repositories</div>
                    <div className="text-2xl font-black text-purple-600 mt-1">6 Sources</div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Featured Peer-Reviewed Publications & Benchmark Baselines
                  </h4>
                  <div className="space-y-2.5">
                    {(currentSection.section_data?.featured_citations || currentSection.stage_data?.featured_citations)?.map((cit: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              {cit.key}
                            </span>
                            <h5 className="text-xs font-bold text-white">{cit.title}</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
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
            {(currentSection.id === 'innovation_gap' || activeSectionIdx === 3) && (currentSection.section_data || currentSection.stage_data) && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                    Proposed Technical Solution
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {currentSection.section_data?.proposed_solution || currentSection.stage_data?.proposed_solution}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Identified Innovation Gaps in Prior Art
                  </h4>
                  <div className="space-y-2">
                    {(currentSection.section_data?.innovation_gaps || currentSection.stage_data?.innovation_gaps)?.map((gap: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-300">
                        <span className="h-5 w-5 rounded-full bg-indigo-600/20 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span>{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: SYSTEM ARCHITECTURE (Interactive Block Diagram) */}
            {(currentSection.id === 'architecture' || activeSectionIdx === 4) && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Interactive Multi-Tier Pipeline (Click Component to Inspect)
                  </h4>

                  {/* Flow Diagram */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 mb-4">
                    {showcaseData.architecture?.components?.map((comp: any) => {
                      const isSelected = selectedArchComponent?.id === comp.id;
                      return (
                        <button
                          key={comp.id}
                          onClick={() => setSelectedArchComponent(comp)}
                          className={`p-3 rounded-xl text-left border transition-all ${
                            isSelected
                              ? 'bg-blue-50/90 border-indigo-400 shadow-lg scale-[1.03]'
                              : 'bg-slate-50 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="text-[10px] font-mono font-bold text-slate-400 truncate mb-1">
                            {comp.layer}
                          </div>
                          <div className="text-xs font-bold text-white leading-tight truncate">
                            {comp.name}
                          </div>
                          <div className="mt-2">
                            {comp.is_simulated ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-200">
                                SIMULATED
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                                PROTOTYPE
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Component Inspection Card */}
                  {selectedArchComponent && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-blue-600">
                          {selectedArchComponent.layer}
                        </span>
                        {selectedArchComponent.is_simulated ? (
                          <span className="text-xs font-bold text-amber-600">Hardware Simulator Mode</span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600">Working Prototype</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">{selectedArchComponent.name}</h4>
                      <div className="text-xs text-slate-300">
                        <span className="font-semibold text-slate-400">Technology: </span>
                        {selectedArchComponent.technology}
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-semibold text-slate-400">Purpose: </span>
                        {selectedArchComponent.purpose}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 6: EXPERIMENTS */}
            {(currentSection.id === 'experiments' || activeSectionIdx === 5) && (currentSection.section_data || currentSection.stage_data) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(currentSection.section_data?.experiments || currentSection.stage_data?.experiments)?.map((exp: any) => (
                    <div key={exp.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-blue-700 border border-blue-200">
                          Experiment #{exp.id}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          {exp.reproducibility_score}% Reproducibility
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{exp.name}</h4>
                      <p className="text-xs text-slate-300 italic">&ldquo;{exp.hypothesis}&rdquo;</p>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                        <span>Dataset: <strong className="text-slate-200">{exp.dataset}</strong></span>
                        <span>Runs: <strong className="text-slate-200">{exp.runs_count}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 7: BENCHMARK MATRIX */}
            {(currentSection.id === 'benchmarks' || activeSectionIdx === 6) && (currentSection.section_data || currentSection.stage_data) && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Quantitative Comparative Evaluation Matrix
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400">
                        <th className="pb-2.5 font-bold">Metric</th>
                        <th className="pb-2.5 font-bold">Standard Baseline</th>
                        <th className="pb-2.5 font-bold">Proposed Method</th>
                        <th className="pb-2.5 font-bold">Observed Diff</th>
                        <th className="pb-2.5 font-bold">Outcome</th>
                        <th className="pb-2.5 font-bold">Evidence Tag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(currentSection.section_data?.metrics_evaluated || currentSection.stage_data?.metrics_evaluated)?.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 font-bold text-white">{m.metric}</td>
                          <td className="py-2.5 font-mono text-slate-300">{m.baseline}</td>
                          <td className="py-2.5 font-mono font-bold text-blue-700">{m.proposed}</td>
                          <td className="py-2.5 font-mono font-bold text-emerald-600">{m.diff}</td>
                          <td className="py-2.5 font-extrabold text-emerald-600">{m.outcome}</td>
                          <td className="py-2.5">{getEvidenceSourceBadge(m.evidence_type || 'OBSERVED')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 8: HARDWARE LAB */}
            {(currentSection.id === 'hardware_lab' || activeSectionIdx === 7) && (
              <div className="space-y-4">
                {/* Simulation Mode Disclaimer Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                        Simulation Mode Active
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Sensor streams and packet delivery are executed via Synthetic Telemetry Generator for hardware demonstration safety.
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-700 text-xs font-mono font-bold border border-amber-200 shrink-0">
                    SIMULATED
                  </span>
                </div>

                {/* Simulated Telemetry Dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Turbidity</div>
                    <div className="text-2xl font-black text-white mt-1">{simTelemetry.turbidity} <span className="text-xs text-slate-400 font-normal">NTU</span></div>
                    <div className="text-[10px] text-emerald-600 mt-1">Normal Range</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">pH Level</div>
                    <div className="text-2xl font-black text-white mt-1">{simTelemetry.pH}</div>
                    <div className="text-[10px] text-emerald-600 mt-1">Neutral (Safe)</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Water Temp</div>
                    <div className="text-2xl font-black text-white mt-1">{simTelemetry.temp} <span className="text-xs text-slate-400 font-normal">°C</span></div>
                    <div className="text-[10px] text-slate-400 mt-1">Ambient</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Packet Delivery</div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">99.4%</div>
                    <div className="text-[10px] text-blue-600 mt-1">Mean Latency: 18.2ms</div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 9: VALIDATION MATRIX */}
            {(currentSection.id === 'validation_matrix' || activeSectionIdx === 8) && (currentSection.section_data || currentSection.stage_data) && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Innovation Claims & Scientific Verification States
                  </h4>
                  <div className="space-y-3">
                    {(currentSection.section_data?.claims || currentSection.stage_data?.claims)?.map((cl: any) => (
                      <div key={cl.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-blue-600">Claim #{cl.id}</span>
                          {getStatusBadge(cl.status)}
                        </div>
                        <h5 className="text-xs font-bold text-white">{cl.title}</h5>
                        <p className="text-xs text-slate-300">{cl.claim}</p>
                        <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Question: <em>{cl.validation_question}</em></span>
                          <span className="text-blue-700 font-bold">{cl.confidence} Confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 10: RESEARCH DOCUMENT */}
            {(currentSection.id === 'research_paper' || activeSectionIdx === 9) && (currentSection.section_data || currentSection.stage_data) && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-400 font-medium">Academic Sections</div>
                    <div className="text-2xl font-black text-white mt-1">
                      {currentSection.section_data?.sections_count ?? currentSection.stage_data?.sections_count ?? 8}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-400 font-medium">Citation Coverage</div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      {currentSection.section_data?.citation_coverage ?? currentSection.stage_data?.citation_coverage ?? '100%'}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <div className="text-xs text-slate-400 font-medium">Export Formats</div>
                    <div className="text-2xl font-black text-purple-600 mt-1">4 Types</div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">IEEE LaTeX Research Package</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Ready for conference submission, faculty review, and archive indexing.</p>
                  </div>
                  <Link
                    href={`/projects/${showcaseData.project_id}/research`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>Open Research Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* SECTION 11: IMPACT & LIMITATIONS */}
            {(currentSection.id === 'impact_limitations' || activeSectionIdx === 10) && showcaseData.impact && (
              <div className="space-y-4">
                {/* Impact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Social & Public Health Impact
                    </h4>
                    <p className="text-xs text-slate-300">
                      {showcaseData.impact.social?.benefit}
                    </p>
                    <div className="text-xs font-bold text-white pt-1">
                      {showcaseData.impact.social?.metric}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      Economic & Cost Advantage
                    </h4>
                    <p className="text-xs text-slate-300">
                      {showcaseData.impact.economic?.benefit}
                    </p>
                    <div className="text-xs font-bold text-white pt-1">
                      {showcaseData.impact.economic?.metric}
                    </div>
                  </div>
                </div>

                {/* Known Limitations Box */}
                {showcaseData.limitations && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
                      Documented Scientific Boundaries & Known Limitations
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
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
            {(currentSection.id === 'presentation' || activeSectionIdx === 11) && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
                  <Award className="h-10 w-10 text-blue-600 mx-auto" />
                  <h3 className="text-lg font-bold text-white">Full Competition Pitch Deck Ready</h3>
                  <p className="text-xs text-slate-300 max-w-xl mx-auto">
                    16-slide presentation package including problem breakdown, architecture, benchmarks, telemetry trace, and project intelligence.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <Link
                      href="/presentation"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg hover:brightness-110 flex items-center gap-1.5"
                    >
                      <span>Launch Fullscreen Slide Deck</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* EVIDENCE TRACE SECTION ("Why is this shown?")             */}
            {/* --------------------------------------------------------- */}
            {currentSection.evidence_items && currentSection.evidence_items.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Evidence Provenance for this Section
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {currentSection.evidence_items.length} Grounded References
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentSection.evidence_items.map((ev: any) => (
                    <button
                      key={ev.id}
                      onClick={() => openEvidenceDrawer(ev)}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 text-left transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white truncate">{ev.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{ev.summary}</div>
                      </div>
                      {getEvidenceSourceBadge(ev.source_type)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 4. EVIDENCE TRACE DRAWER ("Why is this shown?")               */}
      {/* ------------------------------------------------------------- */}
      {evidenceDrawerOpen && selectedEvidenceItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-white">Evidence Trace Provenance</h3>
                </div>
                <button
                  onClick={() => setEvidenceDrawerOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div>
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase">Source ID</span>
                <h4 className="text-base font-bold text-white mt-0.5">{selectedEvidenceItem.title}</h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9px] uppercase text-slate-400 font-bold">Evidence Type</span>
                  <div className="mt-1">{getEvidenceSourceBadge(selectedEvidenceItem.source_type)}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9px] uppercase text-slate-400 font-bold">Verification State</span>
                  <div className="text-xs font-bold text-emerald-600 mt-1">{selectedEvidenceItem.verification_status}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Summary & Data</span>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {selectedEvidenceItem.summary}
                </p>
                {selectedEvidenceItem.observed_data && (
                  <pre className="mt-2 p-2 rounded bg-white text-[10px] text-blue-700 font-mono overflow-x-auto">
                    {JSON.stringify(selectedEvidenceItem.observed_data, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            <button
              onClick={() => setEvidenceDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            >
              Close Trace
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. EVIDENCE SUMMARY MODAL                                     */}
      {/* ------------------------------------------------------------- */}
      {summaryModalOpen && summaryData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-white">
                  Project Evidence Summary (Markdown)
                </h3>
              </div>
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="my-4 overflow-y-auto bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[50vh]">
              {summaryData.summary_markdown}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(summaryData.summary_markdown);
                  setCopiedSummary(true);
                  setTimeout(() => setCopiedSummary(false), 2000);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedSummary ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSummary ? 'Copied' : 'Copy Markdown'}</span>
              </button>
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 border border-blue-200 mb-4 animate-pulse">
            <Layers className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Loading Innovation Showcase...</h2>
          <p className="text-sm text-slate-400 mt-1">Preparing comprehensive project overview & evidence catalog</p>
        </div>
      }
    >
      <ShowcaseContent />
    </Suspense>
  );
}
