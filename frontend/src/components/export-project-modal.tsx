'use client';

import React, { useRef } from'react';
import {
 Download,
 Printer,
 X,
 Sparkles,
 CheckCircle2,
 FileText,
 Calendar,
 Layers,
 Cpu,
 BookOpen,
} from'lucide-react';
import { Project, Idea, AIAnalysis, ProjectRoadmap, SavedResource } from'@/types';

interface ExportProjectModalProps {
 isOpen: boolean;
 onClose: () => void;
 project: Project;
 idea?: Idea | null;
 analysis?: AIAnalysis | null;
 roadmap?: ProjectRoadmap | null;
 savedResources?: SavedResource[];
}

export function ExportProjectModal({
 isOpen,
 onClose,
 project,
 idea,
 analysis,
 roadmap,
 savedResources = [],
}: ExportProjectModalProps) {
 const printRef = useRef<HTMLDivElement>(null);

 if (!isOpen) return null;

 const handlePrint = () => {
 window.print();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
 <div className="relative w-full max-w-4xl max-h-[90vh] rounded-lg sm:rounded-lg bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden">
 {/* Modal Top Bar */}
 <div className="flex items-center justify-between p-3.5 sm:p-6 border-b border-slate-200 bg-slate-50 shrink-0">
 <div className="flex items-center gap-2 sm:gap-2.5">
 <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
 <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
 </div>
 <div>
 <h2 className="text-sm sm:text-base font-bold text-slate-900">Export Complete Project Report</h2>
 <p className="text-xs sm:text-xs text-slate-500">Formatted Comprehensive Innovation Dossier</p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={handlePrint}
 className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
 >
 <Printer className="h-3.5 w-3.5" />
 <span className="hidden sm:inline">Print / Save as PDF</span>
 <span className="sm:hidden">Print</span>
 </button>
 <button
 onClick={onClose}
 className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* Printable Report Canvas */}
 <div ref={printRef} className="p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 bg-white text-slate-800 text-xs">
 {/* Header */}
 <div className="border-b border-slate-200 pb-6 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
 InnoSphere AI &bull; Student Innovation Dossier
 </span>
 <span className="text-xs text-slate-500">
 Generated: {new Date().toLocaleDateString()}
 </span>
 </div>
 <h1 className="text-2xl font-semibold text-slate-900">{project.title}</h1>
 <p className="text-xs text-slate-600">
 Domain: <span className="font-semibold text-slate-900">{project.domain}</span> | Stage: <span className="font-semibold text-slate-900">{project.status}</span> | Progress: <span className="font-semibold text-slate-900">{project.progress}%</span>
 </p>
 </div>

 {/* 1. Problem Statement */}
 <div className="space-y-2">
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Problem Statement</h3>
 <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
 {project.problem_statement || idea?.problem_description}
 </p>
 </div>

 {/* 2. Proposed Solution */}
 <div className="space-y-2">
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Proposed Solution</h3>
 <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
 {project.proposed_solution || idea?.proposed_solution}
 </p>
 </div>

 {/* 3. Target Users & Expected Impact */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Target Users</h3>
 <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
 {idea?.target_users ||'Primary rural healthcare centers, community health workers, district medical officers.'}
 </p>
 </div>
 <div className="space-y-2">
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">4. Expected Impact</h3>
 <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
 {idea?.expected_impact ||'Provides 72-hour advance early warning for water-borne epidemics, reducing hospitalization by 65%.'}
 </p>
 </div>
 </div>

 {/* 5. Technology Stack */}
 <div className="space-y-2">
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">5. Architectural Tech Stack</h3>
 <div className="flex flex-wrap gap-2">
 {(project.technologies || ['Python','FastAPI','PyTorch','React','TimescaleDB','LoRaWAN']).map((t, i) => (
 <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs">
 {t}
 </span>
 ))}
 </div>
 </div>

 {/* 6. AI Multi-Factor Analysis */}
 <div className="space-y-3">
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">6. AI Multi-Factor Analysis</h3>
 <div className="grid grid-cols-3 gap-3 text-center">
 <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
 <span className="text-base font-bold text-emerald-600">88%</span>
 <p className="text-xs text-slate-500">Feasibility</p>
 </div>
 <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
 <span className="text-base font-bold text-purple-600">94%</span>
 <p className="text-xs text-slate-500">Innovation</p>
 </div>
 <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
 <span className="text-base font-bold text-blue-600">85%</span>
 <p className="text-xs text-slate-500">Market Potential</p>
 </div>
 </div>
 {analysis?.summary && (
 <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
 {analysis.summary}
 </p>
 )}
 </div>

 {/* 7. Key Resources & References */}
 <div className="space-y-2">
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">7. Curated Academic & Code References</h3>
 <div className="space-y-2">
 {savedResources.length > 0 ? (
 savedResources.map((s, idx) => (
 <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
 <div>
 <span className="text-xs font-bold text-slate-900">{s.resource?.title}</span>
 <p className="text-xs text-slate-500">Source: {s.resource?.source} | Relevance: {s.relevance_score}%</p>
 </div>
 <span className="text-xs text-blue-600 font-mono">{s.resource?.url}</span>
 </div>
 ))
 ) : (
 <p className="text-slate-500 italic">arXiv:2403.09112 (GNN Outbreak Forecasting), GitHub: esp32-water-telemetry-firmware</p>
 )}
 </div>
 </div>

 {/* 8. 10-Phase Roadmap Summary */}
 <div className="space-y-2">
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">8. 10-Phase Milestone Execution Lifecycle</h3>
 <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
 <p className="text-slate-800 font-semibold">Current Completion: {project.progress}% (Phase 5 of 10 Active)</p>
 <ul className="space-y-1 text-slate-600 text-xs">
 <li>&bull; Phase 1-3: Literature, Requirements, and Sensor Benchmarking (Completed)</li>
 <li>&bull; Phase 4-5: Ingestion Pipeline & Spatio-Temporal GNN Training (In Progress)</li>
 <li>&bull; Phase 6-10: Pilot Integration, Field Validation, Defense, and Publication</li>
 </ul>
 </div>
 </div>

 {/* 9. Faculty Advisor Feedback */}
 <div className="space-y-2 border-t border-slate-200 pt-4">
 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">9. Faculty Mentor Feedback</h3>
 <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
 <p className="text-xs text-slate-900 font-semibold">Reviewed by Dr. Radhika Sen (Rating: 5/5)</p>
 <p className="text-slate-600 text-xs">
"Strong choice of technology stack. Ensure you perform ablation experiments on your neural network layers before final thesis defense."
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
