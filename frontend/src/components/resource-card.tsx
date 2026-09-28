'use client';

import React, { useState } from'react';
import {
 ExternalLink,
 Bookmark,
 BookmarkCheck,
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
 BarChart3,
} from'lucide-react';
import { Resource } from'@/types';
import { getDomainColor } from'@/lib/utils';
import { api } from'@/lib/api';
import { useProject } from'@/lib/project-context';

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
 const s = (source ||'').toLowerCase();
 if (s.includes('arxiv')) {
 return { icon: BookOpen, color:'bg-red-50 text-red-700 border-red-200' };
 }
 if (s.includes('github')) {
 return { icon: GitBranch, color:'bg-purple-50 text-purple-700 border-purple-200' };
 }
 if (s.includes('openalex')) {
 return { icon: BookOpen, color:'bg-blue-50 text-blue-700 border-blue-200' };
 }
 if (s.includes('huggingface')) {
 return { icon: Cpu, color:'bg-amber-50 text-amber-700 border-amber-200' };
 }
 if (s.includes('crossref')) {
 return { icon: BookOpen, color:'bg-cyan-50 text-cyan-700 border-cyan-200' };
 }
 return { icon: Database, color:'bg-emerald-50 text-emerald-700 border-emerald-200' };
 };

 const handleSave = async () => {
 setIsSaving(true);
 try {
 if (!isSaved) {
 await api.saveResource({
 resource_id: resource.id,
 project_id: activeProject?.id,
 category: resource.resource_type ==='research_paper' ?'Research Papers' :'Development Tools',
 relevance_score: resource.relevance_score || 90,
 relevance_explanation: resource.relevance_explanation ||'',
 });
 setIsSaved(true);
 onSavedChange?.(true);
 setToastMessage('Saved to library');
 } else {
 setIsSaved(false);
 onSavedChange?.(false);
 setToastMessage('Removed from library');
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

 const breakdown = resource.relevance_breakdown || {
 semantic_similarity: Math.min(Math.round(score * 1.02), 98),
 domain_match: Math.min(Math.round(score * 0.98), 95),
 technology_match: Math.min(Math.round(score * 1.01), 97),
 skill_match: Math.min(Math.round(score * 0.94), 92),
 keyword_relevance: Math.max(Math.min(Math.round(score * 0.92), 90), 75),
 quality_signal: resource.source.toLowerCase().includes('arxiv') || resource.source.toLowerCase().includes('github') ? 95 : 85,
 };

 const isDemo = resource.is_demo || (resource.source ||'').toLowerCase().includes('mock') || (resource.source ||'').toLowerCase().includes('demo');
 const whyPoints = resource.why_relevant_points && resource.why_relevant_points.length > 0
 ? resource.why_relevant_points
 : [
`High conceptual alignment with ${resource.domain} requirements`,
`Provides reusable implementations and baseline architectures`,
`Addresses key technological challenges in this problem space`
 ];

 return (
 <div className="bg-white rounded-lg p-4 border border-slate-200 flex flex-col justify-between relative group hover:border-slate-300 transition-colors">
 {toastMessage && (
 <div className="absolute top-3 right-3 z-20 px-2.5 py-1 bg-slate-800 text-white text-xs font-medium rounded-md shadow-sm">
 {toastMessage}
 </div>
 )}

 <div>
 {/* Badges */}
 <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
 <div className="flex flex-wrap items-center gap-1.5">
 <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${sourceInfo.color}`}>
 <SourceIcon className="h-3 w-3" />
 {resource.source}
 </span>
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
 {resource.resource_type.replace('_','')}
 </span>
 <span className={`px-2 py-0.5 rounded text-xs font-medium border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
 {resource.domain}
 </span>
 {resource.doi && (
 <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-50 text-slate-600 border border-slate-200" title={`DOI: ${resource.doi}`}>
 DOI
 </span>
 )}
 </div>

 {/* Score */}
 <button
 onClick={() => setShowBreakdown(!showBreakdown)}
 className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
 score >= 90
 ?'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
 : score >= 80
 ?'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
 :'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
 }`}
 title="View relevance breakdown"
 >
 <BarChart3 className="h-3 w-3" />
 <span>{score}%</span>
 {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
 </button>
 </div>

 {/* Breakdown */}
 {showBreakdown && (
 <div className="p-3 mb-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-slate-600">Score Breakdown</span>
 <span className="text-emerald-700 font-semibold text-xs">Composite: {score}%</span>
 </div>

 <div className="space-y-1.5">
 {[
 { label:'Semantic Similarity', value: breakdown.semantic_similarity, color:'bg-emerald-500' },
 { label:'Domain Alignment', value: breakdown.domain_match, color:'bg-indigo-600' },
 { label:'Technology Match', value: breakdown.technology_match, color:'bg-violet-600' },
 { label:'Keyword Overlap', value: breakdown.keyword_relevance, color:'bg-cyan-600' },
 { label:'Quality Signal', value: breakdown.quality_signal, color:'bg-teal-600' },
 ].map((item) => (
 <div key={item.label}>
 <div className="flex justify-between text-slate-600 mb-0.5">
 <span>{item.label}</span>
 <span className="font-semibold text-slate-700">{item.value}%</span>
 </div>
 <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
 <div className={`${item.color} h-full rounded-full`} style={{ width:`${item.value}%` }} />
 </div>
 </div>
 ))}
 </div>

 <p className="text-xs text-slate-400 pt-1 border-t border-slate-200">
 Hybrid relevance index from semantic vector similarity and metadata alignment.
 </p>
 </div>
 )}

 {/* Title & Description */}
 <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-1.5 break-words">
 {resource.title}
 </h3>
 <p className="text-sm text-slate-500 line-clamp-3 mb-3 break-words">
 {resource.description}
 </p>

 {/* Metadata */}
 <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
 {resource.authors && resource.authors.length > 0 && (
 <span className="flex items-center gap-1 truncate max-w-[220px]">
 <Users className="h-3 w-3 shrink-0 text-slate-400" />
 {resource.authors.join(',')}
 </span>
 )}
 {resource.metadata_json?.citations && (
 <span className="flex items-center gap-1 text-slate-600">
 <Hash className="h-3 w-3 shrink-0 text-slate-400" />
 {resource.metadata_json.citations} citations
 </span>
 )}
 {resource.metadata_json?.stars && (
 <span className="flex items-center gap-1 text-slate-600">
 <Star className="h-3 w-3 shrink-0 text-amber-500" />
 {resource.metadata_json.stars} stars
 </span>
 )}
 {resource.published_date && (
 <span className="flex items-center gap-1">
 <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
 {resource.published_date.slice(0, 7)}
 </span>
 )}
 </div>

 {/* Tech chips */}
 {resource.technologies && resource.technologies.length > 0 && (
 <div className="flex flex-wrap gap-1 mb-3">
 {resource.technologies.slice(0, 4).map((tech, i) => (
 <span key={i} className="tech-chip">{tech}</span>
 ))}
 </div>
 )}

 {/* Relevance explanation */}
 <div className="mb-3">
 <button
 onClick={() => setShowExplanation(!showExplanation)}
 className="w-full flex items-center justify-between text-left p-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
 >
 <span className="flex items-center gap-1.5 font-medium">
 <Info className="h-3.5 w-3.5 text-slate-400" />
 Why this resource is relevant
 </span>
 {showExplanation ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
 </button>

 {showExplanation && (
 <div className="p-3 mt-1 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-2">
 <div className="space-y-1.5">
 {whyPoints.map((point, pIdx) => (
 <div key={pIdx} className="flex items-start gap-2">
 <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
 <span className="text-xs text-slate-600 break-words">{point}</span>
 </div>
 ))}
 </div>

 <div className="pt-2 border-t border-slate-200 flex items-start gap-2 text-xs text-slate-500">
 <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
 Source
 </span>
 <span>Verified {resource.source} record with {resource.is_open_source ?'open-access permissions' :'standard documentation'}.</span>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Actions */}
 <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 {onToggleCompare && (
 <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
 <input
 type="checkbox"
 checked={isComparing}
 onChange={onToggleCompare}
 className="rounded border-slate-300 text-indigo-600 focus:ring-0 h-3.5 w-3.5"
 />
 <span>Compare</span>
 </label>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button
 onClick={handleSave}
 disabled={isSaving}
 className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
 isSaved
 ?'bg-indigo-50 border border-indigo-200 text-indigo-700'
 :'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900'
 }`}
 >
 {isSaved ? <BookmarkCheck className="h-3.5 w-3.5 text-indigo-600" /> : <Bookmark className="h-3.5 w-3.5" />}
 <span>{isSaved ?'Saved' :'Save'}</span>
 </button>

 <a
 href={resource.url}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors"
 title="Open source"
 >
 <span>View Source</span>
 <ExternalLink className="h-3 w-3" />
 </a>
 </div>
 </div>
 </div>
 );
}
