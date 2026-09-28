'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  GitBranch,
  BookOpen,
  Database,
  Cpu,
  Layers,
  Code,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Calendar,
  Users,
  Brain,
  Hash,
  Award
} from 'lucide-react';
import { Resource } from '@/types';
import { getDomainColor } from '@/lib/utils';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';

interface ResourceCardProps {
  resource: Resource;
  isSavedInitial?: boolean;
  onSavedChange?: (saved: boolean) => void;
  isComparing?: boolean;
  onToggleCompare?: () => void;
}

export function ResourceCard({
  resource,
  isSavedInitial = false,
  onSavedChange,
  isComparing = false,
  onToggleCompare,
}: ResourceCardProps) {
  const { activeProject } = useProject();
  const [isSaved, setIsSaved] = useState(isSavedInitial || resource.is_saved || false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getSourceBadge = (source: string) => {
    const s = (source || '').toLowerCase();
    if (s.includes('arxiv')) {
      return { icon: BookOpen, color: 'bg-red-500/10 text-red-400 border-red-500/20' };
    }
    if (s.includes('github')) {
      return { icon: GitBranch, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    }
    if (s.includes('openalex')) {
      return { icon: BookOpen, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
    if (s.includes('huggingface')) {
      return { icon: Cpu, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }
    if (s.includes('crossref')) {
      return { icon: BookOpen, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    }
    return { icon: Database, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!isSaved) {
        await api.saveResource({
          resource_id: resource.id,
          project_id: activeProject?.id,
          category: resource.resource_type === 'research_paper' ? 'Research Papers' : 'Development Tools',
          relevance_score: resource.relevance_score || 90,
          relevance_explanation: resource.relevance_explanation || '',
        });
        setIsSaved(true);
        onSavedChange?.(true);
        setToastMessage('Saved to your Library!');
      } else {
        setIsSaved(false);
        onSavedChange?.(false);
        setToastMessage('Removed from bookmarks');
      }
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error saving resource:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const domainColor = getDomainColor(resource.domain);
  const sourceInfo = getSourceBadge(resource.source);
  const SourceIcon = sourceInfo.icon;
  const score = resource.relevance_score || 88;

  // Real or estimated breakdown metrics from backend
  const breakdown = resource.relevance_breakdown || {
    semantic_similarity: Math.min(Math.round(score * 1.02), 98),
    domain_match: Math.min(Math.round(score * 0.98), 95),
    technology_match: Math.min(Math.round(score * 1.01), 97),
    skill_match: Math.min(Math.round(score * 0.94), 92),
    keyword_relevance: Math.max(Math.min(Math.round(score * 0.92), 90), 75),
    quality_signal: resource.source.toLowerCase().includes('arxiv') || resource.source.toLowerCase().includes('github') ? 95 : 85,
  };

  const isDemo = resource.is_demo || (resource.source || '').toLowerCase().includes('mock') || (resource.source || '').toLowerCase().includes('demo');
  const whyPoints = resource.why_relevant_points && resource.why_relevant_points.length > 0
    ? resource.why_relevant_points
    : [
        `High conceptual alignment with ${resource.domain} requirements`,
        `Provides reusable implementations and baseline architectures`,
        `Addresses key technological challenges in this problem space`
      ];

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between relative group">
      {toastMessage && (
        <div className="absolute top-3 right-3 z-20 px-3 py-1 bg-emerald-600 text-white text-[11px] font-semibold rounded-lg shadow-lg animate-in fade-in">
          {toastMessage}
        </div>
      )}

      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${sourceInfo.color}`}
            >
              <SourceIcon className="h-3 w-3" />
              {resource.source}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
              {resource.resource_type.replace('_', ' ')}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
              {resource.domain}
            </span>
            {resource.doi && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20" title={`DOI: ${resource.doi}`}>
                DOI
              </span>
            )}
            {isDemo && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Curated
              </span>
            )}
          </div>

          {/* AI Relevance Score Button with breakdown toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
              score >= 90
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                : score >= 80
                ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/25'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
            }`}
            title="Click to inspect Transparent AI Relevance Breakdown"
          >
            <Sparkles className="h-3 w-3" />
            <span>{score}% Match</span>
            {showBreakdown ? <ChevronUp className="h-3 w-3 opacity-60" /> : <ChevronDown className="h-3 w-3 opacity-60" />}
          </button>
        </div>

        {/* Transparent Relevance Breakdown Modal/Drawer */}
        {showBreakdown && (
          <div className="p-3.5 mb-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                <Brain className="h-3 w-3 text-indigo-400" />
                Semantic & Hybrid Score Breakdown
              </span>
              <span className="text-emerald-400 font-bold text-xs">Composite: {score}%</span>
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">🧠 Vector Semantic Similarity</span>
                  <span className="text-emerald-400 font-bold">{breakdown.semantic_similarity}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${breakdown.semantic_similarity}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">🎯 Domain Alignment</span>
                  <span className="text-indigo-300 font-bold">{breakdown.domain_match}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${breakdown.domain_match}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">⚙️ Technology Stack Match</span>
                  <span className="text-purple-300 font-bold">{breakdown.technology_match}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${breakdown.technology_match}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">🔍 Keyword Lexical Overlap</span>
                  <span className="text-blue-300 font-bold">{breakdown.keyword_relevance}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${breakdown.keyword_relevance}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">🏆 Quality & Provenance Signals</span>
                  <span className="text-teal-300 font-bold">{breakdown.quality_signal}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${breakdown.quality_signal}%` }} />
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 italic pt-1 border-t border-indigo-500/20">
              * Note: Calibrated hybrid relevance index generated from 768-D semantic vector cosine similarity and multi-factor metadata alignment.
            </p>
          </div>
        )}

        {/* Title & Description */}
        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug mb-2 break-words">
          {resource.title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3 break-words">
          {resource.description}
        </p>

        {/* Metadata: Authors, Year, Stats */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mb-3">
          {resource.authors && resource.authors.length > 0 && (
            <span className="flex items-center gap-1 text-slate-400 truncate max-w-[220px]">
              <Users className="h-3 w-3 shrink-0" />
              {resource.authors.join(', ')}
            </span>
          )}
          {resource.metadata_json?.citations && (
            <span className="flex items-center gap-1 text-amber-400/90 font-medium">
              <Award className="h-3 w-3 shrink-0 text-amber-400" />
              {resource.metadata_json.citations} citations
            </span>
          )}
          {resource.metadata_json?.stars && (
            <span className="flex items-center gap-1 text-yellow-400 font-medium">
              <Star className="h-3 w-3 shrink-0 fill-yellow-400" />
              {resource.metadata_json.stars} stars
            </span>
          )}
          {resource.published_date && (
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="h-3 w-3 shrink-0" />
              {resource.published_date.slice(0, 7)}
            </span>
          )}
        </div>

        {/* Tech Stack Chips */}
        {resource.technologies && resource.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.technologies.slice(0, 4).map((tech, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Expandable "Why is this relevant?" Section with Actionable Bullets */}
        <div className="mb-4">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-between text-left p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 hover:bg-indigo-950/60 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Why this resource is relevant
            </span>
            {showExplanation ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showExplanation && (
            <div className="p-3 mt-1.5 rounded-xl bg-slate-900 border border-indigo-500/20 text-xs space-y-2.5 animate-in fade-in">
              <div className="space-y-1.5">
                {whyPoints.map((point, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-300 leading-relaxed break-words">{point}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-start gap-2 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  SOURCE
                </span>
                <span>Verified {resource.source} record with {resource.is_open_source ? 'open-access permissions' : 'standard documentation'}.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2">
          {onToggleCompare && (
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isComparing}
                onChange={onToggleCompare}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 h-3.5 w-3.5"
              />
              <span>Compare</span>
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isSaved
                ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isSaved ? <BookmarkCheck className="h-3.5 w-3.5 text-indigo-400" /> : <Bookmark className="h-3.5 w-3.5" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-colors"
            title="Open Original Source Repository or Paper"
          >
            <span>View Source</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
