'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Compass,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  Database,
  GitBranch,
  Cpu,
  Layers,
  Wrench,
  GraduationCap,
  FileText,
  Loader2,
  SlidersHorizontal,
  Scale,
  X,
  Check,
  RefreshCw,
  CheckCircle2,
  Activity,
  Brain,
  Zap,
  History,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { ResourceCard } from '@/components/resource-card';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Resource } from '@/types';

function DiscoverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeProject } = useProject();

  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'semantic' | 'keyword'>('hybrid');
  const [domain, setDomain] = useState(searchParams.get('domain') || activeProject?.domain || 'all');
  const [resourceType, setResourceType] = useState(searchParams.get('resource_type') || 'all');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || 'all');
  const [openSourceOnly, setOpenSourceOnly] = useState<boolean | null>(null);
  const [freeOnly, setFreeOnly] = useState<boolean | null>(null);
  const [minRelevance, setMinRelevance] = useState<number | null>(null);

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [embeddingProvider, setEmbeddingProvider] = useState<string>('gemini / deterministic');
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const domains = [
    'all',
    'Healthcare',
    'Agriculture',
    'Artificial Intelligence',
    'Environment & Sustainability',
    'Smart Cities & Urban Mobility',
    'Education & Skill Recommendation',
    'Cybersecurity & Privacy',
    'Robotics & Automation',
    'Internet of Things (IoT)',
    'FinTech & Blockchain',
    'Social Innovation',
  ];

  // Load search history from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('innosphere_search_history');
      if (saved) {
        setSearchHistory(JSON.parse(saved).slice(0, 5));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveToHistory = (newQuery: string) => {
    if (!newQuery.trim()) return;
    try {
      const updated = [newQuery.trim(), ...searchHistory.filter((h) => h !== newQuery.trim())].slice(0, 5);
      setSearchHistory(updated);
      localStorage.setItem('innosphere_search_history', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Compute dynamic category counts
  const paperCount = resources.filter((r) => r.resource_type === 'research_paper').length;
  const githubCount = resources.filter((r) => r.resource_type === 'github_repo').length;
  const datasetCount = resources.filter((r) => r.resource_type === 'dataset').length;
  const modelCount = resources.filter((r) => r.resource_type === 'ai_model').length;
  const apiCount = resources.filter((r) => r.resource_type === 'api').length;
  const docCount = resources.filter((r) => r.resource_type === 'documentation' || r.resource_type === 'tool').length;

  const resourceTypes = [
    { id: 'all', label: 'All', count: resources.length, icon: Compass },
    { id: 'research_paper', label: 'Academic Papers', count: paperCount, icon: BookOpen },
    { id: 'github_repo', label: 'GitHub', count: githubCount, icon: GitBranch },
    { id: 'dataset', label: 'Datasets', count: datasetCount, icon: Database },
    { id: 'ai_model', label: 'AI Models', count: modelCount, icon: Cpu },
    { id: 'api', label: 'APIs', count: apiCount, icon: Wrench },
    { id: 'documentation', label: 'Documentation', count: docCount, icon: FileText },
  ];

  const demoScenarios = [
    { label: '💧 Water Contamination & IoT', query: 'IoT low-cost sensor telemetry for rural drinking water contamination and pathogen prediction' },
    { label: '🩺 Cardiac Arrhythmia ECG', query: 'Real-time cardiac arrhythmia anomaly detection from wearable ECG telemetry and 1D-CNN' },
    { label: '🌿 Crop Leaf Disease Vision', query: 'Plant disease classification with YOLO and agricultural leaf image datasets' },
    { label: '🚦 Urban Traffic RL Control', query: 'Adaptive urban traffic signal control using deep reinforcement learning' },
    { label: '♻️ Optical Waste Sorting', query: 'Computer vision recyclable waste segregation on edge microcontrollers' },
    { label: '🎓 Skill Taxonomy AI', query: 'Sentence embeddings and transformers for automated curriculum and skill matching' },
  ];

  const performSearch = async (overrideQuery?: string, overrideMode?: 'hybrid' | 'semantic' | 'keyword') => {
    setLoading(true);
    const q = overrideQuery !== undefined ? overrideQuery : query;
    const mode = overrideMode || searchMode;

    try {
      const res = await api.discoverResources({
        query: q.trim(),
        search_mode: mode,
        domain: domain !== 'all' ? domain : undefined,
        resource_type: resourceType !== 'all' ? resourceType : undefined,
        difficulty: difficulty !== 'all' ? difficulty : undefined,
        is_open_source: openSourceOnly !== null ? openSourceOnly : undefined,
        is_free: freeOnly !== null ? freeOnly : undefined,
        min_relevance: minRelevance !== null ? minRelevance : undefined,
        project_id: activeProject?.id,
      });

      setResources(res.results || []);
      if (res.latency_ms) setLatencyMs(res.latency_ms);
      if (q.trim()) saveToHistory(q.trim());
    } catch (err) {
      console.error('Search error:', err);
      setToastMessage("We couldn't retrieve external resources right now. Showing fallback results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [domain, resourceType, difficulty, openSourceOnly, freeOnly, minRelevance, searchMode]);

  const handleToggleCompare = (resId: number) => {
    if (selectedForCompare.includes(resId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== resId));
    } else {
      if (selectedForCompare.length >= 4) {
        setToastMessage('You can compare up to 4 resources at a time.');
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      setSelectedForCompare([...selectedForCompare, resId]);
    }
  };

  const handleProceedToCompare = () => {
    if (selectedForCompare.length < 2) {
      setToastMessage('Please select at least 2 resources to compare.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    router.push(`/compare?ids=${selectedForCompare.join(',')}`);
  };

  const filteredResources =
    resourceType === 'all'
      ? resources
      : resources.filter((r) => {
          if (resourceType === 'documentation') {
            return r.resource_type === 'documentation' || r.resource_type === 'tool';
          }
          return r.resource_type === resourceType;
        });

  return (
    <div className="space-y-6">
      {/* Compare Floating Bar */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-slate-900/95 border border-indigo-500/50 shadow-2xl rounded-2xl p-4 flex items-center gap-4 backdrop-blur animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-semibold text-white">
              {selectedForCompare.length} resource{selectedForCompare.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleProceedToCompare}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <span>Compare Matrix</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Brain className="h-3.5 w-3.5 text-indigo-600" />
              Semantic Vector Search
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              768-D Dense Embeddings
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Resource & Literature Discovery
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Search peer-reviewed papers, open-source repositories, machine learning models, benchmark datasets, and technical frameworks using natural language intent.
          </p>

          {/* Search Mode Selector Tabs */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Retrieval Mode:</span>
            <button
              onClick={() => setSearchMode('hybrid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                searchMode === 'hybrid'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              <span>Hybrid Search (Recommended)</span>
            </button>

            <button
              onClick={() => setSearchMode('semantic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                searchMode === 'semantic'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <Brain className="h-3.5 w-3.5 text-indigo-400" />
              <span>Semantic Vector</span>
            </button>

            <button
              onClick={() => setSearchMode('keyword')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                searchMode === 'keyword'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span>Lexical / Keyword</span>
            </button>
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="mt-5 relative z-10 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              placeholder="Describe your research need (e.g., 'IoT water contamination prediction with ESP32 sensors')..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  performSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => performSearch()}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Search</span>
          </button>
        </div>

        {/* Demo Scenarios & Quick Inspiration Chips */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Sample Queries:
          </span>
          {demoScenarios.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(demo.query);
                performSearch(demo.query);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-[11px] text-slate-600 hover:text-indigo-700 transition-colors"
            >
              {demo.label}
            </button>
          ))}
        </div>

        {/* Search History Chips */}
        {searchHistory.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <History className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Recent:</span>
            {searchHistory.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(h);
                  performSearch(h);
                }}
                className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600 hover:text-slate-900 truncate max-w-[200px]"
              >
                {h}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resource Type Category Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-thin">
        {resourceTypes.map((tab) => {
          const Icon = tab.icon;
          const active = resourceType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setResourceType(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                active
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar & Operational Latency Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Domain Filter */}
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            aria-label="Filter by Domain"
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All Domains' : d}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            aria-label="Filter by Difficulty Level"
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {/* Open Source Toggle */}
          <button
            onClick={() => setOpenSourceOnly(openSourceOnly === true ? null : true)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              openSourceOnly === true
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-600 border-slate-300 hover:text-slate-900'
            }`}
          >
            Open Source
          </button>

          {/* Free Access Toggle */}
          <button
            onClick={() => setFreeOnly(freeOnly === true ? null : true)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              freeOnly === true
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : 'bg-slate-50 text-slate-600 border-slate-300 hover:text-slate-900'
            }`}
          >
            Free Only
          </button>
        </div>

        {/* Operational Diagnostics Indicator */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Clock className="h-3 w-3 text-indigo-600" />
          <span>
            Retrieved <strong>{filteredResources.length}</strong> items in <strong>{latencyMs}ms</strong>
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-indigo-600 font-mono capitalize">
            Mode: {searchMode}
          </span>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <SkeletonList count={6} />
      ) : filteredResources.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No resources found"
          description="Try broadening your search query, clearing domain filters, or switching retrieval mode to Hybrid."
          actionLabel="Clear Filters & Reset"
          onAction={() => {
            setQuery('');
            setDomain('all');
            setResourceType('all');
            setDifficulty('all');
            setOpenSourceOnly(null);
            setFreeOnly(null);
            setSearchMode('hybrid');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((res) => (
            <ResourceCard
              key={res.id || res.url}
              resource={res}
              isComparing={selectedForCompare.includes(res.id)}
              onToggleCompare={() => handleToggleCompare(res.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<SkeletonList count={6} />}>
      <DiscoverContent />
    </Suspense>
  );
}
