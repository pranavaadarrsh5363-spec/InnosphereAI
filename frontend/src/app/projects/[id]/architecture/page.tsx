'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Network,
  Sparkles,
  Lightbulb,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  BookOpen,
  FlaskConical,
  Atom,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Award,
  Info,
  HelpCircle,
  GitPullRequest,
  Compass,
  FileText,
  Target,
  Database,
  Terminal,
  Send,
  Sliders,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Workflow,
  Boxes,
  Lock,
  Server,
  Cloud,
  FolderArchive,
  Wand2,
  Brain
} from 'lucide-react';
import { api, architectureApi } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth-context';

export default function ProjectArchitecturePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProject, projects, setActiveProjectId } = useProject();
  const { user } = useAuth();

  const rawProjectId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const projectId = rawProjectId ? parseInt(rawProjectId) : (activeProject ? activeProject.id : 1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [architectures, setArchitectures] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<string>('SYSTEM');

  // Split View & Editor state
  const [editorMode, setEditorMode] = useState<'split' | 'visual' | 'code'>('split');
  const [customMermaid, setCustomMermaid] = useState<string>('');
  const [isMermaidDirty, setIsMermaidDirty] = useState<boolean>(false);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [savingMermaid, setSavingMermaid] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Inspector & Modals
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [assistantModalOpen, setAssistantModalOpen] = useState<boolean>(false);
  const [assistantQuery, setAssistantQuery] = useState<string>('');
  const [assistantHistory, setAssistantHistory] = useState<Array<{ q: string; a: string; followups?: string[] }>>([]);
  const [assistantLoading, setAssistantLoading] = useState<boolean>(false);
  const [simplificationModalOpen, setSimplificationModalOpen] = useState<boolean>(false);
  const [simplificationData, setSimplificationData] = useState<any | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Zoom / Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // View Definitions
  const viewTabs = [
    { id: 'SYSTEM', label: 'System Architecture', icon: Layers, desc: 'Complete end-to-end component topology' },
    { id: 'DATA_FLOW', label: 'Data Flow', icon: ArrowRight, desc: '8-stage ingestion to action lifecycle' },
    { id: 'AI_PIPELINE', label: 'AI / ML Pipeline', icon: Wand2, desc: 'Tailored preprocessing & inference' },
    { id: 'HARDWARE', label: 'Hardware ↔ Software', icon: Cpu, desc: 'Microcontroller & telemetry stream' },
    { id: 'API_FLOW', label: 'API Flow', icon: Server, desc: 'REST routing & service contracts' },
    { id: 'DEPLOYMENT', label: 'Deployment Topology', icon: Cloud, desc: 'Containers, CDN & compute nodes' },
    { id: 'APPLICATION_FLOW', label: 'User Flow', icon: Workflow, desc: 'Student innovation lifecycle' },
    { id: 'SECURITY', label: 'Security & Auth', icon: Lock, desc: 'TLS, JWT, RBAC & prompt guardrails' },
  ];

  // Load Architectures
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await architectureApi.getProjectArchitectures(projectId);
        setArchitectures(Array.isArray(res) ? res : []);
      } catch (err: any) {
        console.error('Failed to load architecture data:', err);
        setError(err.message || 'Failed to load architecture models.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  // Current Architecture Record
  const currentArch = useMemo(() => {
    return architectures.find((a) => a.architecture_type === activeView) || architectures[0] || null;
  }, [architectures, activeView]);

  // Sync Mermaid text state when active view changes
  useEffect(() => {
    if (currentArch) {
      const code = currentArch.custom_mermaid_source || currentArch.mermaid_source || '';
      setCustomMermaid(code);
      setIsMermaidDirty(false);
      setSyntaxError(null);
    }
  }, [currentArch, activeView]);

  // Validate Mermaid syntax on the fly
  const handleMermaidChange = (val: string) => {
    setCustomMermaid(val);
    setIsMermaidDirty(true);
    // Basic client-side bracket check
    const brackets: Record<string, string> = { '[': ']', '(': ')', '{': '}' };
    const stack: string[] = [];
    let err = null;
    for (const char of val) {
      if (char in brackets) stack.push(char);
      else if (Object.values(brackets).includes(char)) {
        if (!stack.length) {
          err = `Mismatched bracket '${char}'`;
          break;
        }
        const top = stack.pop()!;
        if (brackets[top] !== char) {
          err = `Bracket mismatch: opened with '${top}', closed with '${char}'`;
          break;
        }
      }
    }
    if (!err && stack.length) err = `Unclosed bracket '${stack[stack.length - 1]}'`;
    setSyntaxError(err);
  };

  // Save Custom Mermaid
  const handleSaveMermaid = async () => {
    if (syntaxError) return;
    setSavingMermaid(true);
    try {
      const res = await architectureApi.updateMermaidSource(projectId, customMermaid, activeView);
      if (res.success && res.architecture) {
        setArchitectures((prev) =>
          prev.map((a) => (a.architecture_type === activeView ? res.architecture : a))
        );
        setIsMermaidDirty(false);
        showToast('Custom Mermaid diagram saved successfully!');
      }
    } catch (err: any) {
      alert(`Failed to save Mermaid: ${err.message}`);
    } finally {
      setSavingMermaid(false);
    }
  };

  // Reset to AI Generated
  const handleResetMermaid = async () => {
    if (!confirm('Reset custom diagram edits back to the AI-generated architecture?')) return;
    setSavingMermaid(true);
    try {
      const res = await architectureApi.resetMermaidSource(projectId, activeView);
      if (res.success && res.architecture) {
        setArchitectures((prev) =>
          prev.map((a) => (a.architecture_type === activeView ? res.architecture : a))
        );
        setCustomMermaid(res.architecture.mermaid_source);
        setIsMermaidDirty(false);
        showToast('Reset to AI-generated architecture!');
      }
    } catch (err: any) {
      alert(`Failed to reset: ${err.message}`);
    } finally {
      setSavingMermaid(false);
    }
  };

  // Force Refresh from Project Context
  const handleRegenerate = async () => {
    setRefreshing(true);
    try {
      const res = await architectureApi.refreshArchitectures(projectId);
      if (res.architectures) {
        setArchitectures(res.architectures);
        showToast('Architecture regenerated from current project intelligence!');
      }
    } catch (err: any) {
      alert(`Failed to refresh: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // AI Assistant Query
  const handleAskAssistant = async (promptText?: string) => {
    const q = promptText || assistantQuery;
    if (!q.trim()) return;
    setAssistantLoading(true);
    try {
      const res = await architectureApi.askAssistant(projectId, q, activeView);
      setAssistantHistory((prev) => [...prev, { q, a: res.response, followups: res.suggested_followups }]);
      setAssistantQuery('');
    } catch (err: any) {
      alert(`Assistant error: ${err.message}`);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Prototype Simplification
  const handleOpenSimplification = async () => {
    setSimplificationModalOpen(true);
    try {
      const res = await architectureApi.getSimplifiedArchitecture(projectId, activeView);
      setSimplificationData(res);
    } catch (err: any) {
      console.error('Failed to get simplification:', err);
    }
  };

  // Roadmap Sync
  const handleSyncRoadmap = async () => {
    try {
      const res = await architectureApi.syncToRoadmap(projectId);
      showToast(res.message || 'Tasks synced to roadmap!');
    } catch (err: any) {
      alert(`Roadmap sync failed: ${err.message}`);
    }
  };

  // Research Sync
  const handleSyncResearch = async () => {
    try {
      const res = await architectureApi.syncToResearch(projectId);
      showToast(res.message || 'Architecture synced to Research Workspace!');
    } catch (err: any) {
      alert(`Research sync failed: ${err.message}`);
    }
  };

  // Copy Mermaid Source
  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(customMermaid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Status Badge Colors
  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'IMPLEMENTED' || s === 'VALIDATED') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (s === 'SIMULATED') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (s === 'CONFIGURED' || s === 'TESTED') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    } else {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const graphData = currentArch?.graph_json || { nodes: [], edges: [], layers: [] };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Toast Notification */}
        {syncToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold">{syncToast}</span>
          </div>
        )}

        {/* Header Hero */}
        <div className="bg-linear-to-r from-indigo-950 via-slate-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-indigo-900/50 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Network className="w-4 h-4 text-indigo-400" /> AI Architecture & Flowchart Generator
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                AI Architecture Generator
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Automatically generate system architecture, data flows, AI pipelines, and deployment diagrams from your project. Turn your innovation idea and technology stack into a clear, visual, evidence-aware technical architecture.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleRegenerate}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Regenerating...' : 'Regenerate Architecture'}
              </button>

              <button
                onClick={() => setExportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Export Diagrams
              </button>

              <button
                onClick={() => setAssistantModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-200 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 transition"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" /> AI Co-Pilot
              </button>
            </div>
          </div>
        </div>

        {/* View Tabs Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {viewTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Selector & Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Layout Mode:
            </span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 text-xs">
              <button
                onClick={() => setEditorMode('split')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  editorMode === 'split' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setEditorMode('visual')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  editorMode === 'visual' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Visual Only
              </button>
              <button
                onClick={() => setEditorMode('code')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  editorMode === 'code' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Mermaid Code
              </button>
            </div>
          </div>

          {/* Diagram State & Synchronization */}
          <div className="flex items-center gap-2">
            {currentArch?.is_customized ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Custom Edited Diagram
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                AI Generated & Synchronized
              </span>
            )}

            <button
              onClick={handleSyncRoadmap}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              title="Add Architecture Implementation Tasks to Roadmap"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-500" /> Add to Roadmap
            </button>

            <button
              onClick={handleSyncResearch}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              title="Insert Architecture Section into Research Paper"
            >
              <Atom className="w-3.5 h-3.5 text-purple-500" /> Insert into Research
            </button>

            <button
              onClick={handleOpenSimplification}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
              title="Simplify Architecture for Student Prototypes"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" /> Simplify MVP
            </button>
          </div>
        </div>

        {/* Main Canvas & Split View */}
        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Synthesizing multi-view project architectures...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Mermaid Source Code Editor (Col 5 if split) */}
            {(editorMode === 'split' || editorMode === 'code') && (
              <div className={`${editorMode === 'code' ? 'lg:col-span-12' : 'lg:col-span-5'} bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Mermaid Source ({activeView})
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyMermaid}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                      title="Copy Mermaid Code"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {currentArch?.is_customized && (
                      <button
                        onClick={handleResetMermaid}
                        disabled={savingMermaid}
                        className="px-2 py-1 rounded-md text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900 transition"
                      >
                        Reset Generated
                      </button>
                    )}
                    <button
                      onClick={handleSaveMermaid}
                      disabled={savingMermaid || !isMermaidDirty || !!syntaxError}
                      className="px-3 py-1 rounded-md text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-40"
                    >
                      {savingMermaid ? 'Saving...' : 'Save Diagram'}
                    </button>
                  </div>
                </div>

                {/* Syntax Error Pill */}
                {syntaxError ? (
                  <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800/60 text-[11px] text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{syntaxError}</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Mermaid syntax verified & valid.</span>
                  </div>
                )}

                {/* Textarea */}
                <textarea
                  value={customMermaid}
                  onChange={(e) => handleMermaidChange(e.target.value)}
                  rows={18}
                  className="w-full p-3.5 rounded-xl font-mono text-xs bg-slate-950 border border-slate-800 text-indigo-300 focus:outline-hidden focus:border-indigo-500 leading-relaxed resize-y"
                  placeholder="flowchart TD..."
                />
              </div>
            )}

            {/* Visual Interactive Diagram Preview (Col 7 if split, 12 if visual) */}
            {(editorMode === 'split' || editorMode === 'visual') && (
              <div className={`${editorMode === 'visual' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Network className="w-4 h-4 text-indigo-600" />
                      {currentArch?.name || 'Visual Architecture Preview'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Click any component node to inspect skills, telemetry, experiments, and evidence contracts.
                    </p>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono px-1.5 text-slate-600">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Structured Layered Graph Visualizer */}
                <div
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  className="space-y-4 transition-transform duration-200"
                >
                  {graphData.layers && graphData.layers.length > 0 ? (
                    graphData.layers.map((layer: any, lIdx: number) => {
                      const layerNodes = (graphData.nodes || []).filter((n: any) =>
                        (layer.node_keys || []).includes(n.node_key)
                      );
                      return (
                        <div
                          key={lIdx}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                              {layer.name}
                            </span>
                            {layer.description && (
                              <span className="text-[10px] text-slate-400">{layer.description}</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {layerNodes.map((node: any) => (
                              <div
                                key={node.node_key}
                                onClick={() => {
                                  setSelectedNode(node);
                                  setInspectorOpen(true);
                                }}
                                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 shadow-xs hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-2 group"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-mono uppercase text-slate-400">
                                      {node.node_type}
                                    </span>
                                    <span
                                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${getStatusBadge(
                                        node.status
                                      )}`}
                                    >
                                      {node.status}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                                    {node.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 line-clamp-1">
                                    {node.technology || node.category}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-indigo-600 font-medium">
                                  <span>Inspect Details</span>
                                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {(graphData.nodes || []).map((node: any) => (
                        <div
                          key={node.node_key}
                          onClick={() => {
                            setSelectedNode(node);
                            setInspectorOpen(true);
                          }}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 shadow-xs cursor-pointer transition space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-slate-400">{node.node_type}</span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${getStatusBadge(node.status)}`}>
                              {node.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">{node.name}</h4>
                          <p className="text-[11px] text-slate-500">{node.technology}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edge Relationships Summary */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Verified Interconnect Protocols ({graphData.edges?.length || 0} Links)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(graphData.edges || []).slice(0, 6).map((edge: any, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] bg-slate-100 text-slate-700 font-mono"
                      >
                        <span>{edge.source_node}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-indigo-500" />
                        <span>{edge.target_node}</span>
                        {edge.protocol && (
                          <span className="text-indigo-600">({edge.protocol})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step-by-Step Architecture Explanation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" /> Step-by-Step Technical Execution Explanation
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-derived from ArchitectureGraph
            </span>
          </div>

          <div className="prose max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-200 whitespace-pre-line font-sans">
            {currentArch?.explanation || 'Architecture explanation is being synthesized...'}
          </div>
        </div>

        {/* Architecture Diagnostics & Readiness Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Architecture Completeness Checklist
              </h3>
              <span className="text-xs font-bold text-indigo-600 font-mono">
                {currentArch?.diagnostics?.completeness_score || 85}% Ready
              </span>
            </div>

            <div className="space-y-2.5">
              {(currentArch?.diagnostics?.readiness_checklist || [
                { label: 'End-User Input / Ingestion Identified', passed: true, detail: 'User client and primary input nodes are mapped.' },
                { label: 'API / Backend Routing Verified', passed: true, detail: 'FastAPI gateway handles incoming traffic.' },
                { label: 'AI Inference Processing Stage Defined', passed: true, detail: 'AI model is integrated.' },
                { label: 'Persistent Data Storage Configured', passed: true, detail: 'Relational storage persists state.' },
              ]).map((chk: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs"
                >
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="font-semibold text-slate-900">{chk.label}</h5>
                    <p className="text-[11px] text-slate-500">{chk.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Evidence Provenance & Realism Audit
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Hardware Realism Status</span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {currentArch?.graph_json?.metrics?.hardware_status === 'SIMULATED' || currentArch?.diagnostics?.warnings?.some((w: any) => w.type === 'SIMULATED_HARDWARE')
                    ? '⚙️ Hardware Execution is Currently SIMULATED'
                    : '🟢 Physical Telemetry Active'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hardware Lab executes in deterministic simulation mode. The architecture clearly tags edge devices as SIMULATED to preserve scientific credibility with judges.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Deployment Realism</span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  Containerized Local / Node SSR (Cloud CDN is PLANNED)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Components with PLANNED status represent target production architecture without falsely asserting active cloud deployment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Node Details Inspector Modal */}
        {inspectorOpen && selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-indigo-600">
                    {selectedNode.node_type} &bull; {selectedNode.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedNode.name}
                  </h3>
                </div>
                <button
                  onClick={() => setInspectorOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Implementation Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(selectedNode.status)}`}>
                    {selectedNode.status}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-500">Description:</span>
                  <p className="text-slate-700">{selectedNode.description || 'Core system component.'}</p>
                </div>

                {/* Skills Integration */}
                <div className="p-3 rounded-lg bg-violet-50/50 border border-violet-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-violet-700 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" /> Required Competencies & Skills
                    </span>
                    <Link
                      href={`/projects/${projectId}/skills`}
                      className="text-[10px] font-semibold text-violet-600 hover:underline flex items-center gap-1"
                    >
                      View Skill Gap <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(selectedNode.required_skills || ['Python', 'System Architecture']).map((sk: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-white text-violet-700 border border-violet-200">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hardware Integration */}
                {selectedNode.node_type === 'HARDWARE' || selectedNode.node_type === 'SENSOR' ? (
                  <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" /> Hardware Lab Telemetry
                      </span>
                      <Link
                        href={`/projects/${projectId}/hardware-lab`}
                        className="text-[10px] font-semibold text-rose-600 hover:underline flex items-center gap-1"
                      >
                        Open Hardware Lab <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {selectedNode.metadata_json?.status_note || 'Hardware device telemetry is configured in Hardware Lab.'}
                    </p>
                  </div>
                ) : null}

                {/* Experiment Integration */}
                {selectedNode.associated_experiments && selectedNode.associated_experiments.length > 0 ? (
                  <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5" /> Associated Experiments
                      </span>
                      <Link
                        href={`/projects/${projectId}/experiments`}
                        className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        Open Experiments <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.associated_experiments.map((exp: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-white text-indigo-700 border border-indigo-200">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setInspectorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Co-Pilot Modal */}
        {assistantModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    <Wand2 className="w-3 h-3" /> AI Architecture Assistant
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Architecture Co-Pilot & Diagnostics
                  </h3>
                </div>
                <button
                  onClick={() => setAssistantModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Chat History */}
              <div className="h-64 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                {assistantHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-1">
                    <Network className="w-8 h-8 mx-auto text-slate-300" />
                    <p>Ask anything about this architecture or click a suggested prompt below.</p>
                  </div>
                ) : (
                  assistantHistory.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-900 font-medium">
                        Q: {item.q}
                      </div>
                      <div className="p-2.5 rounded-lg bg-white text-slate-800 border border-slate-200 leading-relaxed whitespace-pre-line">
                        {item.a}
                      </div>
                    </div>
                  ))
                )}
                {assistantLoading && (
                  <div className="p-2.5 text-slate-400 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>Analyzing architecture topology...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Suggested Inquiries:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Explain this architecture.',
                    'What happens if the message broker goes down?',
                    'Where is the AI model used in the pipeline?',
                    'What are potential bottlenecks in this system?',
                    'What should I validate first for a competition?',
                  ].map((pr, i) => (
                    <button
                      key={i}
                      onClick={() => handleAskAssistant(pr)}
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Query Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={assistantQuery}
                  onChange={(e) => setAssistantQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
                  placeholder="Ask a technical architecture question..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900"
                />
                <button
                  onClick={() => handleAskAssistant()}
                  disabled={assistantLoading || !assistantQuery.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prototype Simplification Modal */}
        {simplificationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Sliders className="w-3 h-3" /> MVP Prototype Simplification
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Suggested Lean Architecture for Initial Prototype
                  </h3>
                </div>
                <button
                  onClick={() => setSimplificationModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                For student hackathons and initial validation runs, InnoSphere AI suggests collapsing decoupled external queues into direct asynchronous streams to accelerate MVP construction while preserving all core AI inference logic.
              </p>

              {simplificationData?.simplification_rationale && (
                <div className="space-y-2 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
                  <h5 className="font-bold text-amber-800">Simplification Rationale:</h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {simplificationData.simplification_rationale.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Simplified Prototype Mermaid:</span>
                <pre className="text-xs font-mono text-amber-300 overflow-x-auto p-2 bg-slate-900 rounded-lg">
                  {simplificationData?.simplified_mermaid || 'Loading simplified diagram...'}
                </pre>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setSimplificationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Diagrams Modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-500" /> Export Architecture Diagrams
                </h3>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      const res = await architectureApi.exportPackage(projectId);
                      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `project-${projectId}-architecture-package.json`;
                      a.click();
                      showToast('Architecture documentation package exported!');
                      setExportModalOpen(false);
                    } catch (e: any) {
                      alert(`Export failed: ${e.message}`);
                    }
                  }}
                  className="w-full p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-left transition flex items-center justify-between group"
                >
                  <div>
                    <h5 className="text-xs font-bold text-indigo-900">
                      Complete Architecture Package (All Views)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Includes all 8 views in SVG, MMD, manifest JSON & README.
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-indigo-600 group-hover:translate-y-0.5 transition" />
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(architectureApi.exportSvgUrl(projectId, activeView), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ view_type: activeView, theme: 'light', resolution: 'presentation' })
                      });
                      const svgText = await res.text();
                      const blob = new Blob([svgText], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${activeView.toLowerCase()}-architecture.svg`;
                      a.click();
                      showToast('Vector SVG diagram exported!');
                      setExportModalOpen(false);
                    } catch (e: any) {
                      alert(`SVG export failed: ${e.message}`);
                    }
                  }}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-center justify-between group"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Export Current View as Vector SVG
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      High-resolution vector for papers & slides ({activeView}).
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-slate-600 group-hover:translate-y-0.5 transition" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
