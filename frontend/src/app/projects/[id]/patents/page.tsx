'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Cpu,
  RefreshCw,
  Globe,
  Award,
  Bookmark,
  Share2,
  Atom,
  HelpCircle,
  Building,
  Calendar,
  Filter,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Bot,
  Send,
  X,
  FileCode,
  Tag,
  Clock,
  PieChart,
  ListTree,
  Table,
  Plus
} from 'lucide-react';
import { api, patentApi } from '@/lib/api';
import { Project } from '@/types';

export default function ProjectPatentWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params?.id);

  const [project, setProject] = useState<Project | null>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [concepts, setConcepts] = useState<any>(null);
  const [savedArt, setSavedArt] = useState<any[]>([]);
  const [comparisonMatrix, setComparisonMatrix] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [landscapeData, setLandscapeData] = useState<any>(null);
  const [coverageData, setCoverageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'results' | 'matrix' | 'claims' | 'timeline' | 'landscape' | 'saved' | 'coverage'
  >('results');

  // Custom Search Query State
  const [customQuery, setCustomQuery] = useState('');
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(['US', 'EP', 'WO']);

  // Selected Patent for Detailed Modal View
  const [selectedPatent, setSelectedPatent] = useState<any>(null);
  const [selectedClaims, setSelectedClaims] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [patentModalOpen, setPatentModalOpen] = useState(false);
  const [patentModalLoading, setPatentModalLoading] = useState(false);

  // AI Assistant Chat State
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; grounded?: any[] }>>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Prior-Art Assistant. I can help analyze potential overlaps, identify differentiation opportunities, and ground your innovation claims against public patent publications. (Please note: I provide research assistance, not legal advice).',
    },
  ]);
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Export State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json' | 'csv' | 'svg'>('markdown');
  const [exportData, setExportData] = useState<any>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (!projectId || isNaN(projectId)) return;
    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [projRes, patentsRes, conceptsRes, savedRes, matrixRes, timeRes, landRes, covRes] =
        await Promise.allSettled([
          api.getProject(projectId),
          patentApi.getProjectPatents(projectId),
          patentApi.getConcepts(projectId),
          patentApi.getSavedPriorArt(projectId),
          patentApi.comparePatents(projectId),
          patentApi.getTimeline(projectId),
          patentApi.getLandscape(projectId),
          patentApi.getCoverage(projectId),
        ]);

      if (projRes.status === 'fulfilled') setProject(projRes.value);
      if (patentsRes.status === 'fulfilled') setSearchData(patentsRes.value);
      if (conceptsRes.status === 'fulfilled') setConcepts(conceptsRes.value);
      if (savedRes.status === 'fulfilled') setSavedArt(savedRes.value || []);
      if (matrixRes.status === 'fulfilled') setComparisonMatrix(matrixRes.value);
      if (timeRes.status === 'fulfilled') setTimelineData(timeRes.value);
      if (landRes.status === 'fulfilled') setLandscapeData(landRes.value);
      if (covRes.status === 'fulfilled') setCoverageData(covRes.value);
    } catch (err) {
      console.error('Failed to load patent intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSearch = async (force: boolean = true) => {
    if (!projectId) return;
    setSearching(true);
    try {
      const res = await patentApi.searchPatents(projectId, {
        query_text: customQuery.trim() || undefined,
        jurisdictions: selectedJurisdictions,
        force_refresh: force,
        limit: 20,
      });
      setSearchData(res);
      // Refresh timeline, landscape, matrix
      const [matrixRes, timeRes, landRes, covRes] = await Promise.allSettled([
        patentApi.comparePatents(projectId),
        patentApi.getTimeline(projectId),
        patentApi.getLandscape(projectId),
        patentApi.getCoverage(projectId),
      ]);
      if (matrixRes.status === 'fulfilled') setComparisonMatrix(matrixRes.value);
      if (timeRes.status === 'fulfilled') setTimelineData(timeRes.value);
      if (landRes.status === 'fulfilled') setLandscapeData(landRes.value);
      if (covRes.status === 'fulfilled') setCoverageData(covRes.value);

      showToast('Prior-art search updated across connected patent databases.');
    } catch (err) {
      console.error('Search failed:', err);
      showToast('Search execution failed. Please check your query.');
    } finally {
      setSearching(false);
    }
  };

  const handleOpenPatentModal = async (patentId: number) => {
    setPatentModalLoading(true);
    setPatentModalOpen(true);
    try {
      const [doc, claims, family] = await Promise.all([
        patentApi.getPatentDetail(projectId, patentId),
        patentApi.getPatentClaims(projectId, patentId),
        patentApi.getPatentFamily(projectId, patentId),
      ]);
      setSelectedPatent(doc);
      setSelectedClaims(claims || []);
      setSelectedFamily(family);
    } catch (err) {
      console.error('Failed to fetch patent detail:', err);
    } finally {
      setPatentModalLoading(false);
    }
  };

  const handleToggleSave = async (patentId: number, currentlySaved: boolean) => {
    try {
      if (currentlySaved) {
        await patentApi.removeSavedPriorArt(projectId, patentId);
        showToast('Removed patent bookmark.');
      } else {
        await patentApi.savePriorArt(projectId, patentId, {
          why_saved: 'Identified relevant prior-art publication',
          notes: 'Saved for related work review and technical comparison',
        });
        showToast('Saved to project prior-art repository.');
      }
      // Refresh saved list and search results
      const [savedRes, patentsRes] = await Promise.all([
        patentApi.getSavedPriorArt(projectId),
        patentApi.getProjectPatents(projectId),
      ]);
      setSavedArt(savedRes || []);
      setSearchData(patentsRes);
    } catch (err) {
      console.error('Failed to toggle save:', err);
      showToast('Action failed.');
    }
  };

  const handleSyncToResearch = async (patentId: number) => {
    try {
      const res = await patentApi.syncToResearch(projectId, patentId);
      if (res.success) {
        showToast(`Synced as citation: ${res.citation_key}`);
        const savedRes = await patentApi.getSavedPriorArt(projectId);
        setSavedArt(savedRes || []);
      }
    } catch (err) {
      console.error('Sync failed:', err);
      showToast('Failed to sync to Research Workspace citations.');
    }
  };

  const handleSendAssistant = async (promptToSend?: string) => {
    const q = promptToSend || assistantQuery;
    if (!q.trim() || assistantLoading) return;

    const userMsg = q.trim();
    setAssistantMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setAssistantQuery('');
    setAssistantLoading(true);

    try {
      const res = await patentApi.askAssistant(projectId, userMsg);
      setAssistantMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          grounded: res.grounded_patents,
        },
      ]);
    } catch (err) {
      console.error('Assistant failed:', err);
      setAssistantMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue analyzing the prior-art records. Please try again.',
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleGenerateExport = async (fmt: 'markdown' | 'json' | 'csv' | 'svg') => {
    setExportFormat(fmt);
    setExportLoading(true);
    setExportModalOpen(true);
    try {
      const res = await patentApi.exportReport(projectId, fmt);
      setExportData(res);
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to generate export report.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (!exportData?.data) return;
    const blob = new Blob([exportData.data], { type: exportData.content_type || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportData.filename || `prior_art_report_${projectId}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${exportData.filename}`);
  };

  const handleCopyExport = () => {
    if (!exportData?.data) return;
    navigator.clipboard.writeText(exportData.data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied report to clipboard.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Synthesizing AI Patent & Prior-Art Intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-slate-900 border border-amber-300 shadow-xl rounded-xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Workspace Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/patents" className="hover:text-amber-400 transition-colors">
              Patents Hub
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[240px]">
              {project?.title || `Project #${projectId}`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAssistantOpen(!assistantOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 transition-colors"
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Prior-Art Assistant</span>
            </button>

            <button
              onClick={() => handleGenerateExport('markdown')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export Report</span>
            </button>

            <button
              onClick={() => handleExecuteSearch(true)}
              disabled={searching}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${searching ? 'animate-spin' : ''}`} />
              <span>{searching ? 'Searching...' : 'Refresh Prior Art'}</span>
            </button>
          </div>
        </div>

        {/* Project Header Banner */}
        <div className="bg-gradient-to-br from-amber-50/60 via-white to-slate-50 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs relative overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {project?.domain || 'Technology'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Project ID: #{projectId}
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Coverage: {searchData?.search_coverage_score || 82}%
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {project?.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                {project?.problem_statement || project?.proposed_solution}
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-3 shrink-0 shadow-2xs">
              <div className="text-center px-3 border-r border-slate-100">
                <div className="text-lg font-extrabold text-amber-600">
                  {searchData?.result_count || 0}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Patents Found
                </div>
              </div>
              <div className="text-center px-3">
                <div className="text-lg font-extrabold text-indigo-600">
                  {savedArt.length}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Saved Art
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Legal & Scientific Safety Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              Mandatory Legal & AI Innovation Disclaimer
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              This tool provides AI-assisted prior-art discovery and technical similarity analysis for research and innovation purposes. It does not provide legal advice, patentability opinions, freedom-to-operate opinions, infringement opinions, or legal conclusions. Patent decisions should be reviewed by a qualified patent professional.
            </p>
          </div>
        </div>

        {/* Interactive Search Query Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Customize technical keywords, sensor names, algorithmic mechanisms..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch(true)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              onClick={() => handleExecuteSearch(true)}
              disabled={searching}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shrink-0 transition-colors"
            >
              {searching ? 'Running Search...' : 'Run Prior-Art Search'}
            </button>
          </div>

          {/* Extracted Concepts Quick Tags */}
          {concepts?.technologies && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 font-medium">Extracted Concepts:</span>
              {concepts.technologies.slice(0, 5).map((tech: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomQuery((prev) => (prev ? `${prev} ${tech}` : tech));
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-500/20 text-slate-700 font-mono text-[11px] transition-colors"
                >
                  +{tech}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-px">
          {[
            { id: 'results', label: 'Search Results', icon: Scale, count: searchData?.result_count },
            { id: 'matrix', label: 'Feature Matrix', icon: Table },
            { id: 'claims', label: 'Claims Explorer', icon: ListTree },
            { id: 'timeline', label: 'Prior-Art Timeline', icon: Clock },
            { id: 'landscape', label: 'Tech Landscape', icon: PieChart },
            { id: 'saved', label: 'Saved Art & Citations', icon: Bookmark, count: savedArt.length },
            { id: 'coverage', label: 'Coverage & Limitations', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* TAB 1: Search Results & Similarity Rankings */}
        {/* ================================================================= */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {searchData?.results?.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <Scale className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">
                  No Prior Art Found Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the button below to trigger the 5-stage AI prior-art exploration across connected registries.
                </p>
                <button
                  onClick={() => handleExecuteSearch(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500"
                >
                  Start Prior-Art Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {searchData?.results?.map((res: any, idx: number) => {
                  const doc = res.patent;
                  const simScore = Math.round(res.technical_similarity_score || 0);
                  const isSaved = savedArt.some((s) => s.patent_id === res.patent_id);
                  const overlapBadge =
                    res.feature_overlap_level === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : res.feature_overlap_level === 'MODERATE'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-amber-500">
                              {doc?.publication_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${overlapBadge}`}>
                              {res.feature_overlap_level} OVERLAP ({simScore}%)
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Jurisdiction: <span className="font-semibold text-slate-200">{doc?.jurisdiction || 'US'}</span>
                            </span>
                          </div>
                          <h3
                            onClick={() => handleOpenPatentModal(res.patent_id)}
                            className="text-base font-bold text-slate-900 hover:text-amber-400 cursor-pointer transition-colors"
                          >
                            {doc?.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleSave(res.patent_id, isSaved)}
                            className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                              isSaved
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-white'
                            }`}
                            title={isSaved ? 'Bookmark Saved' : 'Save Prior Art'}
                          >
                            <Bookmark className="w-4 h-4 fill-current" />
                          </button>

                          <button
                            onClick={() => handleSyncToResearch(res.patent_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 transition-colors"
                            title="1-Click Citation Sync to Research Workspace"
                          >
                            <Atom className="w-3.5 h-3.5 text-purple-400" />
                            <span>Sync Citation</span>
                          </button>

                          <button
                            onClick={() => handleOpenPatentModal(res.patent_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                          >
                            <span>Inspect Art</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Abstract */}
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {doc?.abstract}
                      </p>

                      {/* Why Similar vs Potential Differences */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {res.why_similar?.length > 0 && (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Why Similar / Technical Overlap
                            </span>
                            <ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                              {res.why_similar.map((ws: string, i: number) => (
                                <li key={i}>{ws}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {res.potential_differences?.length > 0 && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> Potential Differentiation Area
                            </span>
                            <ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                              {res.potential_differences.map((pd: string, i: number) => (
                                <li key={i}>{pd}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Meta Footer */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <span>Assignee: <strong className="text-slate-300">{doc?.assignees?.[0] || 'Public Record'}</strong></span>
                          <span>Filing: <strong className="text-slate-300">{doc?.filing_date || 'Prior Art'}</strong></span>
                        </div>
                        {doc?.official_url && (
                          <a
                            href={doc.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-400 hover:underline"
                          >
                            <span>Google Patents Record</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: Side-by-Side Feature Comparison Matrix */}
        {/* ================================================================= */}
        {activeTab === 'matrix' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-400" />
                Side-by-Side Technical Feature Comparison Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Detailed side-by-side comparison of your innovation subsystems against the closest retrieved patent publications.
              </p>
            </div>

            {comparisonMatrix?.rows?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-3 font-bold text-slate-700">Technical Dimension</th>
                      <th className="p-3 font-bold text-amber-400 bg-amber-500/10 border-x border-amber-500/20">
                        Your Innovation ({project?.title?.slice(0, 24)}...)
                      </th>
                      {comparisonMatrix.compared_patents?.map((cp: any, idx: number) => (
                        <th key={idx} className="p-3 font-bold text-slate-300">
                          {cp.publication_number}
                          <div className="text-[10px] font-normal text-slate-400 truncate max-w-[140px]">{cp.title}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonMatrix.rows.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          {row.feature_name}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 bg-emerald-500/5 border-x border-amber-500/20">
                          {row.student_project_value}
                        </td>
                        {comparisonMatrix.compared_patents?.map((cp: any, pIdx: number) => {
                          const val = row.patent_values?.[cp.publication_number] || 'Disclosed';
                          return (
                            <td key={pIdx} className="p-3 font-mono text-slate-400">
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No feature comparison data available.</p>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: Claims Explorer */}
        {/* ================================================================= */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-amber-400" />
                  Structured Patent Claims Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Inspect structured independent and dependent claim trees to understand patented scope and craft distinct innovation boundaries.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchData?.results?.slice(0, 4).map((res: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {res.patent?.publication_number}
                      </span>
                      <button
                        onClick={() => handleOpenPatentModal(res.patent_id)}
                        className="text-[11px] text-amber-400 hover:underline font-semibold"
                      >
                        View Full Claims →
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {res.patent?.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {res.patent?.abstract}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: Prior-Art Timeline */}
        {/* ================================================================= */}
        {activeTab === 'timeline' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Chronological Prior-Art Evolution Timeline
              </h3>
              <p className="text-xs text-slate-500">
                Visual progression from historical patent filings to your current innovation milestone.
              </p>
            </div>

            {timelineData?.events?.length > 0 ? (
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 ml-3">
                {timelineData.events.map((ev: any, idx: number) => {
                  const isProject = ev.is_project_milestone;
                  return (
                    <div key={idx} className="relative space-y-1">
                      <div
                        className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${
                          isProject
                            ? 'bg-emerald-500 border-white ring-4 ring-emerald-500/20'
                            : 'bg-amber-500 border-white ring-4 ring-amber-500/20'
                        }`}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600">
                          {ev.date}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isProject
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {ev.event_type}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {ev.title} ({ev.publication_number})
                      </h4>
                      <p className="text-xs text-slate-500">
                        {ev.technical_focus} — {ev.assignee_or_source}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No timeline data recorded yet.</p>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: Technology Landscape */}
        {/* ================================================================= */}
        {activeTab === 'landscape' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" />
                Technology Landscape & CPC Clusters
              </h3>
              <p className="text-xs text-slate-500">
                Clustering of prior-art publications across CPC classifications, jurisdictions, and assignee domains.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {landscapeData?.clusters?.map((cluster: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      {cluster.cluster_name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      {cluster.patent_count} Patents
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cluster.key_technologies?.map((tech: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-mono"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: Saved Prior Art & Research Citations Sync */}
        {/* ================================================================= */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  Bookmarked Prior-Art & Research Citations
                </h3>
                <p className="text-xs text-slate-500">
                  Prior art bookmarked for deeper investigation, easily synced into your Research Workspace citation bibliography.
                </p>
              </div>

              {savedArt.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No patents saved yet. Bookmark patents from the Search Results tab.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {savedArt.map((item: any, idx: number) => (
                    <div key={idx} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {item.patent?.publication_number}
                          </span>
                          {item.saved_to_research && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Synced to Citations
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.patent?.title}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {item.notes || item.why_saved}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleSyncToResearch(item.patent_id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 transition-colors"
                        >
                          <Atom className="w-3.5 h-3.5" />
                          <span>Sync Citation</span>
                        </button>
                        <button
                          onClick={() => handleToggleSave(item.patent_id, true)}
                          className="p-1.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove bookmark"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 7: Coverage & Limitations */}
        {/* ================================================================= */}
        {activeTab === 'coverage' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Prior-Art Search Coverage & Methodology Audit
              </h3>
              <p className="text-xs text-slate-500">
                Transparent breakdown of queries executed, databases queried, and statutory limitations.
              </p>
            </div>

            {/* Stages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {coverageData?.stages?.map((st: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">STAGE 0{idx + 1}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                      {st.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {st.name.split('—')[1] || st.name}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Hits: <strong className="text-slate-300">{st.hit_count}</strong>
                  </p>
                </div>
              ))}
            </div>

            {/* Limitations & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Known Limitations
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {coverageData?.limitations?.map((lim: string, idx: number) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Recommended Next Actions
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {coverageData?.recommendations?.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* Slide-out AI Prior-Art Assistant Panel */}
      {/* =================================================================== */}
      {assistantOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">AI Prior-Art Assistant</h3>
            </div>
            <button
              onClick={() => setAssistantOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {assistantMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-600 text-white ml-6 shadow-xs'
                    : 'bg-white text-slate-800 mr-4 border border-slate-200 shadow-2xs'
                }`}
              >
                <p>{msg.content}</p>
                {msg.grounded && msg.grounded.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-amber-700">Grounded Patents:</span>
                    <div className="flex flex-wrap gap-1">
                      {msg.grounded.map((gp: any, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-700 border border-slate-200">
                          {gp.publication_number}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {assistantLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Analyzing patent claims & differences...</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about claims, overlaps, differentiation..."
                value={assistantQuery}
                onChange={(e) => setAssistantQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAssistant()}
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleSendAssistant()}
                disabled={assistantLoading}
                className="p-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Responses are grounded in retrieved patent disclosures and project features.
            </p>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* Detailed Patent Document Modal */}
      {/* =================================================================== */}
      {patentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-700">
                    {selectedPatent?.publication_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedPatent?.jurisdiction || 'US'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedPatent?.title}
                </h3>
              </div>
              <button
                onClick={() => setPatentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {patentModalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      Abstract
                    </h4>
                    <p className="leading-relaxed text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {selectedPatent?.abstract}
                    </p>
                  </div>

                  {/* Claims Tree */}
                  {selectedClaims.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        Extracted Claims Tree ({selectedClaims.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedClaims.map((claim: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-amber-700 font-mono">
                                Claim {claim.claim_number}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  claim.is_independent
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {claim.is_independent ? 'INDEPENDENT' : `DEPENDS ON #${claim.dependent_on_claim}`}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{claim.claim_text}</p>
                            {claim.extracted_features?.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {claim.extracted_features.map((f: string, i: number) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-700 border border-slate-200"
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Multi-Jurisdictional Family */}
                  {selectedFamily?.member_publication_numbers?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        Patent Family Equivalents
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedFamily.member_publication_numbers.map((mem: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700"
                          >
                            {mem}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              {selectedPatent?.official_url && (
                <a
                  href={selectedPatent.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open in Google Patents</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                onClick={() => setPatentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* Export Report Modal */}
      {/* =================================================================== */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-600">
                  <FileCode className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Export Prior-Art Intelligence Report
                </h3>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              {(['markdown', 'json', 'csv', 'svg'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleGenerateExport(fmt)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                    exportFormat === fmt
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <div className="p-5 flex-1 overflow-y-auto bg-slate-50/30">
              {exportLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
                </div>
              ) : (
                <pre className="text-[11px] font-mono text-slate-800 bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto whitespace-pre-wrap max-h-80 shadow-2xs">
                  {exportData?.data}
                </pre>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                {exportData?.filename}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyExport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
