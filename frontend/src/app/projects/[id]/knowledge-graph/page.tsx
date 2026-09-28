'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Share2,
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
  Award,
  Info,
  Compass,
  FileText,
  Target,
  Database,
  Code,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Boxes,
  Lock,
  Server,
  Cloud,
  Brain,
  Search,
  Filter,
  ListFilter,
  Sliders,
  MapPin,
  HelpCircle,
  TrendingUp,
  Activity,
  X,
  Grid,
  List as ListIcon,
  Network,
  AlertCircle
} from 'lucide-react';
import { api, knowledgeGraphApi } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth-context';

export default function ProjectKnowledgeGraphPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProject, projects, setActiveProjectId } = useProject();
  const { user } = useAuth();

  const rawProjectId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const projectId = rawProjectId ? parseInt(rawProjectId) : (activeProject ? activeProject.id : 1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any | null>(null);
  const [categoriesMeta, setCategoriesMeta] = useState<any[]>([]);

  // View mode: Visual Graph vs Accessible List
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('ALL');
  const [depthFilter, setDepthFilter] = useState<number>(0); // 0 = All, 1 = 1-Hop, 2 = 2-Hops, 3 = 3-Hops

  // Inspector & Modals
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('svg');
  const [exportData, setExportData] = useState<string>('');
  const [exportLoading, setExportLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Canvas Viewport Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tab selection for bottom drawer / side panels
  const [activeTab, setActiveTab] = useState<'insights' | 'diagnostics' | 'versions'>('insights');
  const [versions, setVersions] = useState<any[]>([]);

  // Load Graph Data
  useEffect(() => {
    async function fetchKnowledgeGraph() {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      try {
        const [graphRes, catRes, verRes] = await Promise.allSettled([
          knowledgeGraphApi.getKnowledgeGraph(projectId),
          knowledgeGraphApi.getCategories(),
          knowledgeGraphApi.getVersions(projectId),
        ]);

        if (graphRes.status === 'fulfilled') {
          setGraphData(graphRes.value);
        } else {
          setError('Failed to load knowledge graph.');
        }

        if (catRes.status === 'fulfilled' && catRes.value?.categories) {
          setCategoriesMeta(catRes.value.categories);
        }

        if (verRes.status === 'fulfilled') {
          setVersions(verRes.value || []);
        }
      } catch (err: any) {
        console.error('Error fetching knowledge graph:', err);
        setError(err?.message || 'Failed to connect to Knowledge Graph service.');
      } finally {
        setLoading(false);
      }
    }
    fetchKnowledgeGraph();
  }, [projectId]);

  // Handle Regenerate Graph
  const handleRegenerateGraph = async () => {
    setRefreshing(true);
    try {
      const res = await knowledgeGraphApi.generateKnowledgeGraph(projectId, {
        force_refresh: true,
        include_ai_suggestions: true,
        max_depth: 3,
      });
      setGraphData(res);
      const verRes = await knowledgeGraphApi.getVersions(projectId);
      setVersions(verRes || []);
    } catch (err) {
      console.error('Failed to regenerate graph:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle Export
  const handleExport = async (format: string) => {
    setExportFormat(format);
    setExportLoading(true);
    setExportModalOpen(true);
    try {
      const res = await knowledgeGraphApi.exportGraph(projectId, format);
      setExportData(res.data || '');
    } catch (err) {
      console.error('Failed to export graph:', err);
      setExportData('Failed to export graph.');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle Copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Node Category Color LUT
  const categoryColorLUT: Record<string, { color: string; bg: string; border: string }> = useMemo(() => {
    const lut: Record<string, { color: string; bg: string; border: string }> = {
      IDEA: { color: '#6366F1', bg: '#EEF2FF', border: '#4F46E5' },
      PROBLEM: { color: '#EF4444', bg: '#FEF2F2', border: '#DC2626' },
      RESEARCH_PAPER: { color: '#8B5CF6', bg: '#F5F3FF', border: '#7C3AED' },
      DATASET: { color: '#06B6D4', bg: '#ECFEFF', border: '#0891B2' },
      TECHNOLOGY: { color: '#3B82F6', bg: '#EFF6FF', border: '#2563EB' },
      HARDWARE: { color: '#EC4899', bg: '#FDF2F8', border: '#DB2777' },
      EXISTING_SOLUTION: { color: '#64748B', bg: '#F8FAFC', border: '#475569' },
      INNOVATION_GAP: { color: '#F59E0B', bg: '#FFFBEB', border: '#D97706' },
      EXPERIMENT: { color: '#10B981', bg: '#ECFDF5', border: '#059669' },
      BENCHMARK: { color: '#14B8A6', bg: '#F0FDFA', border: '#0D9488' },
      VALIDATION_EVIDENCE: { color: '#059669', bg: '#D1FAE5', border: '#047857' },
      INNOVATION_CLAIM: { color: '#8B5CF6', bg: '#EDE9FE', border: '#6D28D9' },
      SKILL: { color: '#F97316', bg: '#FFF7ED', border: '#EA580C' },
      ARCHITECTURE_COMPONENT: { color: '#2563EB', bg: '#DBEAFE', border: '#1D4ED8' },
      RESOURCE: { color: '#0284C7', bg: '#E0F2FE', border: '#0369A1' },
      ROADMAP_ITEM: { color: '#A855F7', bg: '#FAF5FF', border: '#9333EA' },
      CITATION: { color: '#94A3B8', bg: '#F1F5F9', border: '#64748B' },
    };
    if (categoriesMeta && categoriesMeta.length > 0) {
      categoriesMeta.forEach((c) => {
        lut[c.category] = { color: c.color, bg: c.bg, border: c.border };
      });
    }
    return lut;
  }, [categoriesMeta]);

  // Compute Layout Node Positions
  const allNodes: any[] = graphData?.nodes || [];
  const allEdges: any[] = graphData?.edges || [];

  // Filtered Nodes & Edges
  const { filteredNodes, filteredEdges, nodePositions } = useMemo(() => {
    let nodes = [...allNodes];
    let edges = [...allEdges];

    // Category Filter
    if (selectedCategory !== 'ALL') {
      nodes = nodes.filter((n) => n.category === selectedCategory || n.category === 'IDEA');
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      nodes = nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          (n.description && n.description.toLowerCase().includes(q))
      );
    }

    // Relationship Filter
    if (selectedRelationship !== 'ALL') {
      edges = edges.filter((e) => e.relationship_type === selectedRelationship);
    }

    const visibleNodeKeys = new Set(nodes.map((n) => n.node_key));
    edges = edges.filter(
      (e) => visibleNodeKeys.has(e.source_node_key) && visibleNodeKeys.has(e.target_node_key)
    );

    // Compute coordinate layout (Center Idea at 0, 0 with concentric rings)
    const positions: Record<string, { x: number; y: number }> = {};
    const width = 1200;
    const height = 800;
    const cx = width / 2;
    const cy = height / 2;

    const ideaNode = nodes.find((n) => n.category === 'IDEA');
    if (ideaNode) {
      positions[ideaNode.node_key] = { x: cx, y: cy };
    }

    const otherNodes = nodes.filter((n) => n.category !== 'IDEA');
    const totalOthers = otherNodes.length;

    otherNodes.forEach((n, idx) => {
      // Group categories into inner and outer rings
      const isInnerRing = ['PROBLEM', 'ARCHITECTURE_COMPONENT', 'EXPERIMENT', 'TECHNOLOGY', 'HARDWARE'].includes(n.category);
      const radius = isInnerRing ? 240 : 380;
      const angle = (2 * Math.PI * idx) / Math.max(1, totalOthers);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      positions[n.node_key] = { x: Math.round(x), y: Math.round(y) };
    });

    return {
      filteredNodes: nodes,
      filteredEdges: edges,
      nodePositions: positions,
    };
  }, [allNodes, allEdges, selectedCategory, searchQuery, selectedRelationship]);

  // Deep-link Context Action resolver
  const getContextualAction = (node: any) => {
    const cat = node?.category;
    switch (cat) {
      case 'RESEARCH_PAPER':
      case 'CITATION':
        return { label: 'Open Research Workspace', href: '/research', icon: Atom };
      case 'SKILL':
        return { label: 'View Skills Gap Map', href: '/skills', icon: Brain };
      case 'HARDWARE':
        return { label: 'Open Hardware Lab', href: '/hardware-lab', icon: Cpu };
      case 'EXPERIMENT':
      case 'BENCHMARK':
        return { label: 'Open Experiment Tracking', href: '/experiments', icon: FlaskConical };
      case 'VALIDATION_EVIDENCE':
      case 'INNOVATION_CLAIM':
        return { label: 'Open Validation Engine', href: '/validation', icon: ShieldCheck };
      case 'ARCHITECTURE_COMPONENT':
        return { label: 'Open AI Architecture', href: '/architecture', icon: Network };
      case 'ROADMAP_ITEM':
        return { label: 'View Project Roadmap', href: `/roadmap/${projectId}`, icon: MapPin };
      default:
        return null;
    }
  };

  // Pan and Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'svg' || (e.target as HTMLElement).id === 'canvas-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Project Selector Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/knowledge-graph"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors shadow-xs"
              title="Back to Knowledge Graph Hub"
            >
              <Share2 className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Link href="/projects" className="hover:underline">Projects</Link>
                <span>/</span>
                <span>Project #{projectId}</span>
                <span>/</span>
                <span className="text-indigo-600 font-semibold">Knowledge Graph</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                {graphData?.name || `Project #${projectId} Knowledge Graph`}
                {graphData && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                    v{graphData.version}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="flex rounded-xl bg-slate-200 p-1 border border-slate-300/60">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'visual'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> Graph Visualizer
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" /> List View
              </button>
            </div>

            {/* Export Menu */}
            <button
              onClick={() => handleExport('svg')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-indigo-500 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" /> Export Graph
            </button>

            {/* Regenerate Button */}
            <button
              onClick={handleRegenerateGraph}
              disabled={refreshing}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Recomputing...' : 'Refresh Graph'}
            </button>
          </div>
        </div>

        {/* Top Summary Bar & Statistics Cards */}
        {graphData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-400 font-medium">Total Entities</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {graphData.stats?.total_nodes || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Boxes className="w-3 h-3 text-indigo-400" /> Across 17 domains
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-400 font-medium">Verified Links</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {graphData.stats?.total_edges || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Share2 className="w-3 h-3 text-emerald-400" /> Grounded relations
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-400 font-medium">Graph Completeness</div>
              <div className="text-xl font-black text-indigo-600 mt-0.5">
                {graphData.diagnostics?.completeness_score || 100}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-indigo-500" /> Traceability Score
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-400 font-medium">Validation Coverage</div>
              <div className="text-xl font-black text-emerald-600 mt-0.5">
                {graphData.diagnostics?.validation_coverage || 0}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Empirical Evidence
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-400 font-medium">Graph Density</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {graphData.stats?.density || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Activity className="w-3 h-3 text-purple-400" /> Avg Degree: {graphData.stats?.average_degree || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-400 font-medium">Components</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {graphData.stats?.connected_components_count || 1}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Compass className="w-3 h-3 text-amber-400" /> Connected Hubs
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities, tags..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {Object.keys(categoryColorLUT).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </option>
              ))}
            </select>

            {/* Relationship Filter */}
            <select
              value={selectedRelationship}
              onChange={(e) => setSelectedRelationship(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Relationships</option>
              {['ADDRESSES', 'USES', 'SUPPORTS', 'REQUIRES', 'TESTS', 'BENCHMARKS', 'VALIDATES', 'PRODUCES', 'CITES', 'DEPENDS_ON', 'IMPLEMENTS', 'CONNECTS_TO', 'INFORMS'].map((rel) => (
                <option key={rel} value={rel}>
                  {rel.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Zoom and Reset Controls (for Visualizer) */}
          {viewMode === 'visual' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.15))}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                title="Reset View"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Main Canvas / List View Body */}
        {loading ? (
          <div className="p-20 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-3xl">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
            Synthesizing Knowledge Graph across 17 innovation subsystems...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 text-xs bg-rose-50 border border-rose-200 rounded-3xl">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            {error}
          </div>
        ) : viewMode === 'visual' ? (
          /* ========================================================================= */
          /* 1. VISUAL INTERACTIVE GRAPH CANVAS                                        */
          /* ========================================================================= */
          <div className="relative w-full h-[650px] bg-slate-50/70 rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs select-none">
            {/* Canvas SVG */}
            <svg
              id="canvas-bg"
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0.4" />
                </linearGradient>
                <marker
                  id="arrow-end"
                  viewBox="0 0 10 10"
                  refX="26"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#4F46E5" />
                </marker>
              </defs>

              <g
                transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
                className="transition-transform duration-75"
              >
                {/* 1. Draw Edges */}
                {filteredEdges.map((edge, idx) => {
                  const src = nodePositions[edge.source_node_key];
                  const tgt = nodePositions[edge.target_node_key];
                  if (!src || !tgt) return null;

                  const isSelected = selectedEdge === edge;
                  const midX = (src.x + tgt.x) / 2;
                  const midY = (src.y + tgt.y) / 2;

                  return (
                    <g
                      key={`edge-${idx}`}
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdge(edge);
                      }}
                    >
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={isSelected ? '#7C3AED' : '#CBD5E1'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        strokeOpacity={isSelected ? 1.0 : 0.8}
                        markerEnd="url(#arrow-end)"
                      />
                      {/* Edge Label Pill */}
                      <rect
                        x={midX - 35}
                        y={midY - 8}
                        width={70}
                        height={16}
                        rx={4}
                        fill="#FFFFFF"
                        stroke="#E2E8F0"
                        strokeWidth={1}
                        className="group-hover:stroke-indigo-500 transition-colors shadow-2xs"
                      />
                      <text
                        x={midX}
                        y={midY + 3.5}
                        textAnchor="middle"
                        fill="#475569"
                        fontSize={9}
                        fontFamily="system-ui, sans-serif"
                        fontWeight="600"
                        className="group-hover:fill-indigo-700 transition-colors"
                      >
                        {edge.relationship_type.replace('_', ' ').slice(0, 10)}
                      </text>
                    </g>
                  );
                })}

                {/* 2. Draw Nodes */}
                {filteredNodes.map((node) => {
                  const pos = nodePositions[node.node_key];
                  if (!pos) return null;

                  const isIdea = node.category === 'IDEA';
                  const isSelected = selectedNode?.node_key === node.node_key;
                  const style = categoryColorLUT[node.category] || {
                    color: '#64748B',
                    bg: '#F8FAFC',
                    border: '#CBD5E1',
                  };

                  const r = isIdea ? 38 : 26;

                  return (
                    <g
                      key={node.node_key}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                        setInspectorOpen(true);
                      }}
                    >
                      {/* Selection / Hover Glow Ring */}
                      {(isSelected || isIdea) && (
                        <circle
                          r={r + 6}
                          fill="none"
                          stroke={isIdea ? '#4F46E5' : '#7C3AED'}
                          strokeWidth={2}
                          strokeDasharray={isIdea ? '4 4' : 'none'}
                          className="animate-pulse"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={r}
                        fill="#FFFFFF"
                        stroke={isSelected ? '#7C3AED' : style.color}
                        strokeWidth={isSelected ? 3 : 2}
                        className="group-hover:scale-110 transition-transform origin-center shadow-xs"
                      />

                      {/* Category Label Pill inside Node */}
                      <text
                        textAnchor="middle"
                        y={-2}
                        fontSize={isIdea ? 10 : 8.5}
                        fontWeight="700"
                        fill={style.color}
                        fontFamily="system-ui, sans-serif"
                      >
                        {node.category.replace('_', ' ').slice(0, 8)}
                      </text>

                      {/* Degree badge */}
                      <circle cx={r - 4} cy={-r + 4} r={7} fill="#F1F5F9" stroke="#CBD5E1" strokeWidth={1} />
                      <text
                        x={r - 4}
                        y={-r + 7}
                        textAnchor="middle"
                        fontSize={8}
                        fill="#475569"
                        fontFamily="system-ui, sans-serif"
                        fontWeight="bold"
                      >
                        {node.total_degree || 0}
                      </text>

                      {/* Node Label Text underneath */}
                      <text
                        textAnchor="middle"
                        y={r + 14}
                        fontSize={11}
                        fontWeight="600"
                        fill="#0F172A"
                        fontFamily="system-ui, sans-serif"
                        className="drop-shadow-xs"
                      >
                        {node.label.length > 22 ? `${node.label.slice(0, 20)}...` : node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Bottom Floating Legend Bar */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-4 overflow-x-auto text-[11px] text-slate-600 shadow-sm">
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-slate-800">Category Colors:</span>
                {['IDEA', 'PROBLEM', 'RESEARCH_PAPER', 'TECHNOLOGY', 'HARDWARE', 'EXPERIMENT', 'VALIDATION_EVIDENCE', 'SKILL'].map((cat) => {
                  const st = categoryColorLUT[cat] || { color: '#64748B' };
                  return (
                    <div key={cat} className="flex items-center gap-1 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                      <span className="capitalize">{cat.replace('_', ' ').toLowerCase()}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-500 shrink-0 hidden md:block">
                Click any node to open details & evidence links • Drag to pan • Scroll / buttons to zoom
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. ACCESSIBLE STRUCTURED LIST VIEW                                        */
          /* ========================================================================= */
          <div className="space-y-4">
            {Object.keys(categoryColorLUT).map((cat) => {
              const catNodes = filteredNodes.filter((n) => n.category === cat);
              if (catNodes.length === 0) return null;
              const st = categoryColorLUT[cat] || { color: '#64748B', bg: '#F8FAFC' };

              return (
                <div
                  key={cat}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
                      <h3 className="text-sm font-bold text-slate-900">
                        {cat.replace('_', ' ')} Entities
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {catNodes.length}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catNodes.map((n) => {
                      const contextAction = getContextualAction(n);
                      return (
                        <div
                          key={n.node_key}
                          onClick={() => {
                            setSelectedNode(n);
                            setInspectorOpen(true);
                          }}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-indigo-500/50 cursor-pointer transition-all space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {n.label}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono shrink-0">
                                {n.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                              {n.description || 'No description available.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                            <span>Degree: {n.total_degree || 0}</span>
                            {contextAction && (
                              <Link
                                href={contextAction.href}
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                              >
                                {contextAction.label} <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Insight & Diagnostics Tabs */}
        {graphData && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4">
              <button
                onClick={() => setActiveTab('insights')}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'insights'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Structural Insights & Critical Path
              </button>
              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'diagnostics'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Graph Completeness Diagnostics
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'versions'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Version History ({versions.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'insights' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/60 text-xs text-indigo-900 leading-relaxed">
                    <span className="font-bold flex items-center gap-1.5 text-indigo-700 mb-1">
                      <Sparkles className="w-4 h-4 text-indigo-500" /> AI Graph Synthesis Summary
                    </span>
                    {graphData.insights?.summary || 'The Knowledge Graph is centered on the primary project innovation with robust cross-domain connectivity.'}
                  </div>

                  {/* Critical Path Flow */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> 5-Stage Critical Innovation Pathway
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {(graphData.insights?.critical_path || []).map((cp: any) => (
                        <div
                          key={cp.step}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400">Step {cp.step}</span>
                            <span className="text-[10px] font-semibold text-emerald-600">
                              {cp.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900">
                            {cp.stage}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-2">
                            {cp.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Innovation Threads */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(graphData.insights?.innovation_threads || []).map((th: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
                      >
                        <div className="text-xs font-bold text-slate-900">
                          {th.name}
                        </div>
                        <div className="text-[11px] font-mono text-indigo-600">
                          {th.flow}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Health: <span className="font-semibold text-emerald-500">{th.health}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'diagnostics' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Structural Diagnostics & Gaps
                      </h4>
                      <p className="text-xs text-slate-500">
                        Evidence-grounding and missing links analyzed across your innovation pipeline.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                      Completeness: {graphData.diagnostics?.completeness_score || 100}%
                    </span>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    {(graphData.diagnostics?.recommendations || []).length > 0 ? (
                      (graphData.diagnostics?.recommendations || []).map((rec: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-amber-900 font-medium">
                              {rec.action}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/60 text-amber-900 shrink-0">
                            {rec.priority}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> All core innovation entities and evidence connections are fully grounded!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Snapshots & Graph Version History
                  </h4>
                  {versions.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">
                      No previous version snapshots found.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {versions.map((v) => (
                        <div key={v.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 mr-2">
                              Version {v.version_number}
                            </span>
                            <span className="text-slate-500">
                              {v.change_summary}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] text-slate-400">
                              Hash: {v.content_hash}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {v.created_at ? new Date(v.created_at).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Node Details Inspector Drawer */}
        {inspectorOpen && selectedNode && (
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: categoryColorLUT[selectedNode.category]?.bg || '#F1F5F9',
                      color: categoryColorLUT[selectedNode.category]?.color || '#475569',
                    }}
                  >
                    {selectedNode.category.replace('_', ' ')}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedNode.label}
                  </h3>
                </div>
                <button
                  onClick={() => setInspectorOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Provenance */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400">Status</div>
                  <div className="font-bold text-slate-800">{selectedNode.status}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400">Source Provenance</div>
                  <div className="font-bold text-indigo-600">{selectedNode.source_type}</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-700">Description</div>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {selectedNode.description || 'No description available for this entity.'}
                </p>
              </div>

              {/* Metadata Details */}
              {selectedNode.metadata_json && Object.keys(selectedNode.metadata_json).length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700">Entity Metadata</div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1 font-mono text-[11px]">
                    {Object.entries(selectedNode.metadata_json).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-slate-800">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Relationships */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Connected Relationships</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Total Degree: {selectedNode.total_degree || 0}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {allEdges
                    .filter(
                      (e) =>
                        e.source_node_key === selectedNode.node_key ||
                        e.target_node_key === selectedNode.node_key
                    )
                    .map((e, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
                      >
                        <div className="font-semibold text-indigo-600">
                          {e.relationship_type.replace('_', ' ')}
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          {e.source_node_key === selectedNode.node_key
                            ? `--> ${e.target_node_key}`
                            : `<-- ${e.source_node_key}`}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Context Action Button */}
            {getContextualAction(selectedNode) && (
              <div className="pt-4 mt-4 border-t border-slate-100">
                {(() => {
                  const ca = getContextualAction(selectedNode)!;
                  const Icon = ca.icon;
                  return (
                    <Link
                      href={ca.href}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <Icon className="w-4 h-4" /> {ca.label}
                    </Link>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Multi-Format Export Modal */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600" /> Export Knowledge Graph ({exportFormat.toUpperCase()})
                </h3>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Format Switcher */}
              <div className="flex flex-wrap gap-2">
                {['svg', 'json', 'mermaid', 'csv'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      exportFormat === fmt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Export Content Preview */}
              {exportLoading ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  Generating {exportFormat.toUpperCase()} export data...
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    readOnly
                    value={exportData}
                    rows={12}
                    className="w-full p-3 font-mono text-[11px] rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-hidden"
                  />
                  <button
                    onClick={() => handleCopy(exportData)}
                    className="absolute top-3 right-3 px-3 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 border border-slate-200 shadow-xs cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
