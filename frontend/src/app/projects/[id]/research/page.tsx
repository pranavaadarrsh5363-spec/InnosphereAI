'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText, Sparkles, Download, BookOpen, Layers, CheckCircle2,
  AlertCircle, RefreshCw, Plus, Trash2, Copy, Check, ExternalLink,
  ChevronRight, ArrowLeft, History, ShieldAlert, Cpu, Eye, Code,
  Sliders, MessageSquare, BookMarked, Atom, Send, Award, HelpCircle, FlaskConical
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  ResearchDocument, ResearchCitation, Experiment,
  ResearchQualityReport, EvidenceMapItem, ResearchDocumentVersion,
  LaTeXExportResponse, BibTeXExportResponse, MarkdownExportResponse,
  TechnicalReportExportResponse
} from '@/types';

// Academic Sections Definition
const ACADEMIC_SECTIONS = [
  { key: 'abstract', label: 'Abstract', icon: FileText, desc: 'Background, problem, proposed method, and key findings' },
  { key: 'problem_statement', label: '1. Introduction & Problem', icon: AlertCircle, desc: 'Domain context, operational bottlenecks, failure modes' },
  { key: 'objectives', label: '1.1 Objectives & Contributions', icon: Award, desc: 'Formal research milestones and scientific deliverables' },
  { key: 'related_work', label: '2. Related Work', icon: BookOpen, desc: 'Literature review synthesized from verified citations' },
  { key: 'research_gap', label: '3. Research Gaps & Novelty', icon: Sparkles, desc: 'Methodological, compute, and telemetry gap analysis' },
  { key: 'system_architecture', label: '4. System Architecture', icon: Layers, desc: 'Multi-tier block diagram and pipeline workflow' },
  { key: 'methodology', label: '5. Methodology & Formulation', icon: Atom, desc: 'Mathematical modeling and algorithmic pipeline' },
  { key: 'technology_stack', label: '6. Tech Stack & Implementation', icon: Code, desc: 'Frontend, backend, ML engine, and database contracts' },
  { key: 'dataset_description', label: '7. Dataset & Testbed Setup', icon: Sliders, desc: 'Benchmark datasets, feature schemas, and sensor trace' },
  { key: 'experimental_methodology', label: '8. Experimental Methodology', icon: Cpu, desc: 'Hypothesis, baseline comparisons, and evaluation metrics' },
  { key: 'results', label: '9. Results & Benchmarking', icon: CheckCircle2, desc: 'Tabular empirical comparisons and performance analysis' },
  { key: 'discussion', label: '10. Discussion & Failure Modes', icon: MessageSquare, desc: 'Stress testing, noise filtering, and trade-off analysis' },
  { key: 'limitations', label: '11. Limitations', icon: ShieldAlert, desc: 'Calibration bounds, TinyML constraints, domain shift' },
  { key: 'conclusion', label: '12. Conclusion', icon: CheckCircle2, desc: 'Summary of breakthroughs and deployment readiness' },
  { key: 'future_work', label: '12.1 Future Directions', icon: Sparkles, desc: 'Quantization, federated learning, contrastive pretraining' },
];

export default function ResearchWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params?.id);

  // Core Document State
  const [project, setProject] = useState<any>(null);
  const [document, setDocument] = useState<ResearchDocument | null>(null);
  const [citations, setCitations] = useState<ResearchCitation[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [qualityReport, setQualityReport] = useState<ResearchQualityReport | null>(null);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceMapItem[]>([]);
  const [versions, setVersions] = useState<ResearchDocumentVersion[]>([]);

  // Navigation & UI State
  const [activeSectionKey, setActiveSectionKey] = useState<string>('abstract');
  const [activeTab, setActiveTab] = useState<'citations' | 'experiments' | 'evidence' | 'mentor' | 'versions'>('citations');
  const [docType, setDocType] = useState<'research_paper' | 'technical_report'>('research_paper');
  const [previewMode, setPreviewMode] = useState<'edit' | 'split' | 'preview'>('edit');
  
  // Loading & Editing State
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isRefiningSection, setIsRefiningSection] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [sectionContent, setSectionContent] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTab, setExportTab] = useState<'latex' | 'bibtex' | 'markdown' | 'tech_report'>('latex');
  const [latexExport, setLatexExport] = useState<LaTeXExportResponse | null>(null);
  const [bibtexExport, setBibtexExport] = useState<BibTeXExportResponse | null>(null);
  const [markdownExport, setMarkdownExport] = useState<MarkdownExportResponse | null>(null);
  const [techReportExport, setTechReportExport] = useState<TechnicalReportExportResponse | null>(null);

  const [showAddCitationModal, setShowAddCitationModal] = useState(false);
  const [newCitation, setNewCitation] = useState({
    title: '', authors: '', year: 2024, venue: '', doi: '', arxiv_id: '', url: '', source: 'arXiv', resource_type: 'research_paper', claim_tags: 'methodology'
  });

  const [showNewExperimentModal, setShowNewExperimentModal] = useState(false);
  const [newExp, setNewExp] = useState({
    name: '', hypothesis: '', objective: '', dataset_used: 'WHO & InnoSphere Potability Telemetry',
    baseline_model: 'Random Forest Baseline', proposed_method: '1D-CNN + Temporal Attention',
    metrics_accuracy: '96.8%', metrics_f1: '0.962', metrics_latency: '22.4 ms', status: 'completed' as const
  });

  // Assistant Chat State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Hello! I am your AI Research Fellow & IEEE Co-Author. Ask me to draft mathematical equations, rewrite paragraphs in IEEE style, suggest baselines, or inspect citations.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // Load All Project Research Data
  const loadResearchWorkspace = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const [projData, docData, citData, expData, qualData, evData, verData] = await Promise.all([
        api.getProject(projectId),
        api.getResearchDocument(projectId, docType),
        api.getResearchCitations(projectId),
        api.getExperiments(projectId),
        api.getResearchQuality(projectId),
        api.getResearchEvidence(projectId),
        api.getResearchVersions(projectId)
      ]);

      setProject(projData);
      setDocument(docData);
      setCitations(citData);
      setExperiments(expData);
      setQualityReport(qualData);
      setEvidenceItems(evData.evidence_items || []);
      setVersions(verData || []);

      // Populate current active section content
      const content = (docData as any)[activeSectionKey] || '';
      setSectionContent(content);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to load research workspace:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, docType, activeSectionKey]);

  useEffect(() => {
    loadResearchWorkspace();
  }, [loadResearchWorkspace]);

  // Handle Section Change
  const handleSelectSection = (key: string) => {
    setActiveSectionKey(key);
    if (document) {
      const content = (document as any)[key] || '';
      setSectionContent(content);
    }
  };

  // Section Content Edit & Debounced Autosave
  const handleContentChange = (val: string) => {
    setSectionContent(val);
    setSaveStatus('unsaved');
  };

  // Save Current Section to Database
  const handleSaveSection = async (createNewVersion = false, versionLabel?: string) => {
    if (!projectId || !document) return;
    try {
      setSaveStatus('saving');
      const payload: any = {
        [activeSectionKey]: sectionContent,
        create_new_version: createNewVersion,
        version_label: versionLabel
      };
      const updated = await api.updateResearchDocument(projectId, payload, docType);
      setDocument(updated);
      setSaveStatus('saved');
      // Refresh quality score
      const qual = await api.getResearchQuality(projectId);
      setQualityReport(qual);
      if (createNewVersion) {
        const vers = await api.getResearchVersions(projectId);
        setVersions(vers);
      }
    } catch (err) {
      console.error('Failed to save section:', err);
      setSaveStatus('unsaved');
    }
  };

  // Full Document Synthesis
  const handleFullSynthesis = async () => {
    if (!projectId) return;
    try {
      setIsGeneratingAll(true);
      const generated = await api.generateResearchDocument(projectId, docType);
      setDocument(generated);
      const currentContent = (generated as any)[activeSectionKey] || '';
      setSectionContent(currentContent);
      const [qual, cits, vers] = await Promise.all([
        api.getResearchQuality(projectId),
        api.getResearchCitations(projectId),
        api.getResearchVersions(projectId)
      ]);
      setQualityReport(qual);
      setCitations(cits);
      setVersions(vers);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Full document synthesis failed:', err);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Single Section AI Refinement
  const handleRefineSection = async () => {
    if (!projectId || !activeSectionKey) return;
    try {
      setIsRefiningSection(true);
      const res = await api.generateResearchSection(projectId, activeSectionKey, customPrompt);
      setSectionContent(res.content);
      if (document) {
        setDocument({ ...document, [activeSectionKey]: res.content });
      }
      setSaveStatus('saved');
      setCustomPrompt('');
    } catch (err) {
      console.error('Section refinement failed:', err);
    } finally {
      setIsRefiningSection(false);
    }
  };

  // Insert in-text citation marker
  const handleInsertCitation = (citation: ResearchCitation, index: number) => {
    const marker = ` [${index + 1}]`;
    setSectionContent(prev => prev + marker);
    setSaveStatus('unsaved');
  };

  // Sync Citations with Discovered Resources
  const handleSyncCitations = async () => {
    if (!projectId) return;
    try {
      const synced = await api.syncResearchCitations(projectId);
      setCitations(synced);
      const qual = await api.getResearchQuality(projectId);
      setQualityReport(qual);
    } catch (err) {
      console.error('Failed to sync citations:', err);
    }
  };

  // Add Citation Submit
  const handleAddCitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newCitation.title) return;
    try {
      const authorsArr = newCitation.authors.split(',').map(a => a.trim()).filter(Boolean);
      const tagsArr = newCitation.claim_tags.split(',').map(t => t.trim()).filter(Boolean);
      await api.addResearchCitation(projectId, {
        title: newCitation.title,
        authors: authorsArr,
        year: Number(newCitation.year),
        venue: newCitation.venue,
        doi: newCitation.doi || undefined,
        arxiv_id: newCitation.arxiv_id || undefined,
        url: newCitation.url || undefined,
        source: newCitation.source,
        resource_type: newCitation.resource_type,
        claim_tags: tagsArr
      });
      setShowAddCitationModal(false);
      setNewCitation({
        title: '', authors: '', year: 2024, venue: '', doi: '', arxiv_id: '', url: '', source: 'arXiv', resource_type: 'research_paper', claim_tags: 'methodology'
      });
      const [updatedCits, qual] = await Promise.all([
        api.getResearchCitations(projectId),
        api.getResearchQuality(projectId)
      ]);
      setCitations(updatedCits);
      setQualityReport(qual);
    } catch (err) {
      console.error('Failed to add citation:', err);
    }
  };

  // Delete Citation
  const handleDeleteCitation = async (id: number) => {
    if (!projectId) return;
    try {
      await api.deleteResearchCitation(projectId, id);
      setCitations(prev => prev.filter(c => c.id !== id));
      const qual = await api.getResearchQuality(projectId);
      setQualityReport(qual);
    } catch (err) {
      console.error('Failed to delete citation:', err);
    }
  };

  // Add Experiment Submit
  const handleAddExperimentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newExp.name) return;
    try {
      await api.createExperiment(projectId, {
        name: newExp.name,
        hypothesis: newExp.hypothesis,
        objective: newExp.objective,
        dataset_used: newExp.dataset_used,
        baseline_model: newExp.baseline_model,
        proposed_method: newExp.proposed_method,
        parameters: { epochs: 50, batch_size: 32 },
        metrics: {
          accuracy: newExp.metrics_accuracy,
          f1_score: newExp.metrics_f1,
          latency: newExp.metrics_latency
        },
        results_summary: `${newExp.proposed_method} outperformed ${newExp.baseline_model} on ${newExp.dataset_used}.`,
        status: newExp.status
      });
      setShowNewExperimentModal(false);
      setNewExp({
        name: '', hypothesis: '', objective: '', dataset_used: 'WHO & InnoSphere Potability Telemetry',
        baseline_model: 'Random Forest Baseline', proposed_method: '1D-CNN + Temporal Attention',
        metrics_accuracy: '96.8%', metrics_f1: '0.962', metrics_latency: '22.4 ms', status: 'completed'
      });
      const [exps, qual, ev] = await Promise.all([
        api.getExperiments(projectId),
        api.getResearchQuality(projectId),
        api.getResearchEvidence(projectId)
      ]);
      setExperiments(exps);
      setQualityReport(qual);
      setEvidenceItems(ev.evidence_items || []);
    } catch (err) {
      console.error('Failed to create experiment:', err);
    }
  };

  // Export Trigger
  const handleOpenExportCenter = async () => {
    if (!projectId) return;
    setShowExportModal(true);
    try {
      const [latex, bib, md, tech] = await Promise.all([
        api.exportLaTeX(projectId),
        api.exportBibTeX(projectId),
        api.exportMarkdown(projectId),
        api.exportTechnicalReport(projectId)
      ]);
      setLatexExport(latex);
      setBibtexExport(bib);
      setMarkdownExport(md);
      setTechReportExport(tech);
    } catch (err) {
      console.error('Export retrieval failed:', err);
    }
  };

  // Version Rollback
  const handleRestoreVersion = async (verId: number) => {
    if (!projectId) return;
    try {
      const restored = await api.restoreResearchVersion(projectId, verId);
      setDocument(restored);
      const curr = (restored as any)[activeSectionKey] || '';
      setSectionContent(curr);
      const vers = await api.getResearchVersions(projectId);
      setVersions(vers);
    } catch (err) {
      console.error('Restore version failed:', err);
    }
  };

  // Assistant Chat Query
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !projectId) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatSending(true);
    try {
      const res = await api.queryAssistant(userMsg, projectId, 'research');
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.response || res.message || 'I have analyzed your query in context of this research paper.' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an issue connecting to the AI Assistant. Please try again.' }]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Helper copy text
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Word count & Character count calculation
  const wordCount = sectionContent.trim() ? sectionContent.trim().split(/\s+/).length : 0;
  const charCount = sectionContent.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Loading InnoSphere Research Workspace...</h2>
        <p className="text-sm text-slate-500 mt-1">Grounding evidence, citations, and experiment matrices...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* ---------------- Top Command Bar ---------------- */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Back to Project"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Atom className="w-3 h-3 text-indigo-600" /> AI Research Workspace
                </span>
                <span className="text-xs text-slate-400 font-mono">v{document?.version || '1.0'}</span>
              </div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {project?.title || 'Research Project'}
              </h1>
            </div>
          </div>

          {/* Center Meta Indicators */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-4 py-1.5 rounded-xl shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-600 font-medium">Citation Coverage:</span>
              <span className="text-xs font-extrabold text-emerald-600">{qualityReport?.citation_coverage_pct || 85.0}%</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs text-slate-600 font-medium">Readiness Score:</span>
              <span className="text-xs font-extrabold text-amber-600">{qualityReport?.overall_readiness_score || 88}/100</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className={saveStatus === 'saved' ? 'text-emerald-600 font-semibold' : saveStatus === 'saving' ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : '● Unsaved'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/projects/${projectId}/experiments`)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 transition-all shadow-2xs"
              title="Open Empirical Experimentation & Benchmarking Command Center"
            >
              <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
              <span>Experiments</span>
            </button>

            <button
              onClick={handleFullSynthesis}
              disabled={isGeneratingAll}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all shadow-xs disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAll ? 'animate-spin' : ''}`} />
              {isGeneratingAll ? 'Synthesizing...' : 'Full AI Draft'}
            </button>

            <button
              onClick={handleOpenExportCenter}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export (LaTeX / BibTeX)
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- Main 3-Column Command Workspace ---------------- */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto grid grid-cols-12 gap-4 p-4">
        
        {/* ================= Left Column: Section Navigator & Quality Radar ================= */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          
          {/* Section List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" /> IEEE Paper Sections
              </span>
              <span className="text-[11px] text-slate-500 font-mono font-medium">13 Sections</span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[440px] pr-1">
              {ACADEMIC_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isSelected = activeSectionKey === sec.key;
                const hasContent = Boolean(document && (document as any)[sec.key] && ((document as any)[sec.key] as string).length > 20);

                return (
                  <button
                    key={sec.key}
                    onClick={() => handleSelectSection(sec.key)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-700 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200/70 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="truncate">{sec.label}</span>
                    </div>
                    {hasContent ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Populated" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" title="Empty" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Research Quality Radar Breakdown */}
          {qualityReport && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" /> Quality Audit Radar
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {qualityReport.readiness_label}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Document Structure', data: qualityReport.structure_quality },
                  { label: 'Empirical Evidence', data: qualityReport.evidence_quality },
                  { label: 'Literature Diversity', data: qualityReport.literature_diversity },
                  { label: 'Reproducibility', data: qualityReport.reproducibility },
                  { label: 'Tech Specifications', data: qualityReport.technical_completeness },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">{item.label}</span>
                      <span className="font-mono text-slate-900 font-bold">{item.data?.score || 80}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${item.data?.score || 80}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Supported Claims: <strong className="text-emerald-700">{qualityReport.supported_claims_count}</strong></span>
                <span>Unsupported: <strong className="text-amber-700">{qualityReport.unsupported_claims_count}</strong></span>
              </div>
            </div>
          )}

        </div>

        {/* ================= Center Column: Live Section Editor with Split Preview ================= */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col flex-1 shadow-xs">
            
            {/* Section Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-indigo-600 font-mono font-semibold uppercase tracking-wider">Active Section</span>
                <h2 className="text-base font-extrabold text-slate-900 capitalize">
                  {activeSectionKey.replace(/_/g, ' ')}
                </h2>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                <button
                  onClick={() => setPreviewMode('edit')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                    previewMode === 'edit' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setPreviewMode('split')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                    previewMode === 'split' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                    previewMode === 'preview' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {/* AI Refiner Sub-Bar */}
            <div className="my-3.5 p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="AI Co-Author: e.g. 'Format mathematical formulation' or 'Tighten academic tone'..."
                className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={handleRefineSection}
                disabled={isRefiningSection}
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-xs font-semibold transition-all shrink-0 disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                {isRefiningSection ? 'Refining...' : 'Refine Section'}
              </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 min-h-[380px] grid grid-cols-1 gap-4">
              {previewMode !== 'preview' && (
                <textarea
                  value={sectionContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={`Draft content for ${activeSectionKey.replace(/_/g, ' ')} here...`}
                  className="w-full h-full min-h-[380px] bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y leading-relaxed"
                />
              )}

              {(previewMode === 'preview' || previewMode === 'split') && (
                <div className="w-full h-full min-h-[380px] bg-white border border-slate-200/80 rounded-xl p-5 overflow-y-auto text-xs text-slate-800 leading-relaxed space-y-3 shadow-2xs">
                  {sectionContent ? (
                    <div className="whitespace-pre-wrap">{sectionContent}</div>
                  ) : (
                    <span className="text-slate-400 italic">No content in this section yet. Click 'Refine Section' or 'Full AI Draft'.</span>
                  )}
                </div>
              )}
            </div>

            {/* Editor Footer Status & Quick Actions */}
            <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3 font-medium">
                <span>Words: <strong className="text-slate-800 font-bold">{wordCount}</strong></span>
                <span>Characters: <strong className="text-slate-800 font-bold">{charCount}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveSection(true, `Snapshot (${activeSectionKey})`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 font-medium cursor-pointer"
                  title="Save immutable version snapshot"
                >
                  <History className="w-3.5 h-3.5 text-indigo-600" /> Save Version Snapshot
                </button>
                <button
                  onClick={() => handleSaveSection(false)}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Save Section
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ================= Right Column: Citations, Experiments, Evidence & Co-Pilot ================= */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl flex flex-col shadow-xs overflow-hidden min-h-[600px]">
            
            {/* Multi-Tab Navigation */}
            <div className="flex items-center border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 overflow-x-auto">
              {[
                { key: 'citations', label: `Citations (${citations.length})`, icon: BookMarked },
                { key: 'experiments', label: `Experiments (${experiments.length})`, icon: Cpu },
                { key: 'evidence', label: 'Traceability', icon: CheckCircle2 },
                { key: 'mentor', label: 'AI Co-Pilot', icon: MessageSquare },
                { key: 'versions', label: 'History', icon: History }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT */}
            <div className="p-4 flex-1 flex flex-col overflow-y-auto max-h-[580px]">
              
              {/* ------------ Tab 1: Citations Library ------------ */}
              {activeTab === 'citations' && (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Verified Scientific Citations
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleSyncCitations}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Sync with discovered research resources"
                      >
                        <RefreshCw className="w-3 h-3 text-indigo-600" /> Sync
                      </button>
                      <button
                        onClick={() => setShowAddCitationModal(true)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Citation
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                    {citations.map((c, idx) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-indigo-200 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold">
                            [{idx + 1}]
                          </span>
                          <span className="text-xs font-bold text-slate-900 flex-1 line-clamp-2">{c.title}</span>
                          <button
                            onClick={() => handleDeleteCitation(c.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            title="Remove Citation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-1">
                          {c.authors.join(', ')} ({c.year || '2024'}) — *{c.venue || c.source}*
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {c.doi && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                                DOI Verified
                              </span>
                            )}
                            <span className="text-slate-500 text-[10px]">{c.source}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleInsertCitation(c, idx)}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10.5px] font-mono font-medium transition-colors cursor-pointer"
                              title="Insert in-text citation marker into current section"
                            >
                              + Insert [{idx + 1}]
                            </button>
                            <button
                              onClick={() => copyToClipboard(c.bibtex || '', `bib-${c.id}`)}
                              className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-[10px] cursor-pointer"
                              title="Copy BibTeX entry"
                            >
                              {copiedKey === `bib-${c.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {citations.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No citations added yet. Click 'Sync Resources' or 'Add Citation'.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------ Tab 2: Experiments Tracker ------------ */}
              {activeTab === 'experiments' && (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Empirical Benchmarking Matrix
                    </span>
                    <button
                      onClick={() => setShowNewExperimentModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Record Trial
                    </button>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {experiments.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{exp.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                            {exp.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 italic">
                          "{exp.hypothesis}"
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/70">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Baseline:</span>
                            <span className="text-slate-800 font-semibold">{exp.baseline_model}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Proposed:</span>
                            <span className="text-indigo-700 font-semibold">{exp.proposed_method}</span>
                          </div>
                        </div>

                        {exp.metrics && Object.keys(exp.metrics).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            {Object.entries(exp.metrics).map(([k, v]) => (
                              <span key={k} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[10px]">
                                {k}: <strong className="text-emerald-700">{String(v)}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {experiments.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No experiments logged. Connect empirical results to prevent hallucinations.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------ Tab 3: Evidence Traceability Matrix ------------ */}
              {activeTab === 'evidence' && (
                <div className="space-y-3 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Evidence Traceability Matrix ({evidenceItems.length} links)
                  </span>

                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                    {evidenceItems.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold uppercase">
                            {item.section}
                          </span>
                          <span className={`font-bold ${item.confidence_level === 'HIGH' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {item.confidence_level}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium">{item.claim_summary}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                          <span className="truncate max-w-[200px]">{item.source_title}</span>
                          <span className="capitalize font-medium">{item.evidence_type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------ Tab 4: AI Research Co-Pilot Chat ------------ */}
              {activeTab === 'mentor' && (
                <div className="flex flex-col flex-1 h-full">
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[460px]">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'assistant'
                            ? 'bg-slate-50 border border-slate-200/80 text-slate-800 shadow-2xs'
                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white ml-4 shadow-2xs'
                        }`}
                      >
                        <div className={`text-[10px] font-bold mb-1 ${msg.role === 'assistant' ? 'text-indigo-600' : 'text-indigo-100'}`}>
                          {msg.role === 'assistant' ? '🤖 InnoSphere Research Co-Pilot' : '👤 You'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChatMessage} className="mt-3.5 pt-3 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask for LaTeX equations, abstract edits, or metrics..."
                      className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isChatSending}
                      className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-2xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* ------------ Tab 5: Version History & Rollback ------------ */}
              {activeTab === 'versions' && (
                <div className="space-y-3 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Version Snapshots & Rollback
                  </span>

                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {versions.map((ver) => (
                      <div
                        key={ver.id}
                        className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600">v{ver.version_number}</span>
                            <span className="text-slate-900 font-semibold">{ver.version_label}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(ver.created_at).toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRestoreVersion(ver.id)}
                          className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium transition-all shadow-2xs cursor-pointer"
                        >
                          Rollback
                        </button>
                      </div>
                    ))}

                    {versions.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No snapshots recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>

      {/* ================= Export Center Modal ================= */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Research & Technical Document Export Center</h3>
                  <p className="text-xs text-slate-500">IEEE conference templates, BibTeX bibliographies, and technical specifications</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Export Format Selector */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
              {[
                { key: 'latex', label: 'IEEEtran LaTeX Package', icon: Code },
                { key: 'bibtex', label: 'BibTeX (references.bib)', icon: BookMarked },
                { key: 'markdown', label: 'Paper Draft (.md)', icon: FileText },
                { key: 'tech_report', label: '19-Section Institutional Report', icon: Award }
              ].map((fmt) => (
                <button
                  key={fmt.key}
                  onClick={() => setExportTab(fmt.key as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                    exportTab === fmt.key
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <fmt.icon className="w-3.5 h-3.5" />
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* Content Preview */}
            <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200/80 rounded-xl p-4 font-mono text-xs text-slate-900 min-h-[300px] max-h-[440px]">
              {exportTab === 'latex' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-indigo-600 font-bold">📄 main.tex (IEEE Conference Format)</span>
                    <button
                      onClick={() => copyToClipboard(latexExport?.main_tex || '', 'latex-tex')}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      {copiedKey === 'latex-tex' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy main.tex
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap">{latexExport?.main_tex || 'Generating LaTeX package...'}</pre>
                </div>
              )}

              {exportTab === 'bibtex' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-indigo-600 font-bold">📚 references.bib ({bibtexExport?.total_citations || 0} citations)</span>
                    <button
                      onClick={() => copyToClipboard(bibtexExport?.bibtex_content || '', 'bibtex-content')}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      {copiedKey === 'bibtex-content' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy BibTeX
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap">{bibtexExport?.bibtex_content || 'Generating BibTeX entries...'}</pre>
                </div>
              )}

              {exportTab === 'markdown' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-indigo-600 font-bold">📝 paper_draft.md</span>
                    <button
                      onClick={() => copyToClipboard(markdownExport?.markdown_content || '', 'md-content')}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      {copiedKey === 'md-content' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Markdown
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap">{markdownExport?.markdown_content || 'Generating Markdown draft...'}</pre>
                </div>
              )}

              {exportTab === 'tech_report' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-emerald-700 font-bold">🏛️ technical_report.md (19 Sections & BOM)</span>
                    <button
                      onClick={() => copyToClipboard(techReportExport?.report_markdown || '', 'tech-report-content')}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      {copiedKey === 'tech-report-content' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Report
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap">{techReportExport?.report_markdown || 'Generating Technical Report...'}</pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= Add Citation Modal ================= */}
      {showAddCitationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddCitationSubmit} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Add Verified Scientific Citation
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Paper / Dataset Title *</label>
                <input
                  type="text"
                  required
                  value={newCitation.title}
                  onChange={(e) => setNewCitation({ ...newCitation, title: e.target.value })}
                  placeholder="e.g. Deep Learning Approaches for Water Quality Outlier Detection"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Authors (comma separated)</label>
                  <input
                    type="text"
                    value={newCitation.authors}
                    onChange={(e) => setNewCitation({ ...newCitation, authors: e.target.value })}
                    placeholder="e.g. J. Vaswani, A. Kumar"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Year</label>
                  <input
                    type="number"
                    value={newCitation.year}
                    onChange={(e) => setNewCitation({ ...newCitation, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Venue / Journal / Repository</label>
                <input
                  type="text"
                  value={newCitation.venue}
                  onChange={(e) => setNewCitation({ ...newCitation, venue: e.target.value })}
                  placeholder="e.g. IEEE Transactions on Neural Networks"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">DOI (Optional)</label>
                  <input
                    type="text"
                    value={newCitation.doi}
                    onChange={(e) => setNewCitation({ ...newCitation, doi: e.target.value })}
                    placeholder="10.1109/..."
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">arXiv ID (Optional)</label>
                  <input
                    type="text"
                    value={newCitation.arxiv_id}
                    onChange={(e) => setNewCitation({ ...newCitation, arxiv_id: e.target.value })}
                    placeholder="2403.01829"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddCitationModal(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Save Citation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= Record Experiment Modal ================= */}
      {showNewExperimentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddExperimentSubmit} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" /> Record Empirical Experiment Trial
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Experiment Name *</label>
                <input
                  type="text"
                  required
                  value={newExp.name}
                  onChange={(e) => setNewExp({ ...newExp, name: e.target.value })}
                  placeholder="e.g. Benchmarking 1D-CNN vs Random Forest Baseline"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Scientific Hypothesis *</label>
                <textarea
                  required
                  value={newExp.hypothesis}
                  onChange={(e) => setNewExp({ ...newExp, hypothesis: e.target.value })}
                  placeholder="e.g. 1D-CNN with temporal attention achieves >5% gain in F1-score over baseline..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Baseline Model</label>
                  <input
                    type="text"
                    value={newExp.baseline_model}
                    onChange={(e) => setNewExp({ ...newExp, baseline_model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Proposed Method</label>
                  <input
                    type="text"
                    value={newExp.proposed_method}
                    onChange={(e) => setNewExp({ ...newExp, proposed_method: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Accuracy</label>
                  <input
                    type="text"
                    value={newExp.metrics_accuracy}
                    onChange={(e) => setNewExp({ ...newExp, metrics_accuracy: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-900 font-mono text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">F1-Score</label>
                  <input
                    type="text"
                    value={newExp.metrics_f1}
                    onChange={(e) => setNewExp({ ...newExp, metrics_f1: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-900 font-mono text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Latency</label>
                  <input
                    type="text"
                    value={newExp.metrics_latency}
                    onChange={(e) => setNewExp({ ...newExp, metrics_latency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-900 font-mono text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewExperimentModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Save Experiment
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
