'use client';

import React, { useState } from'react';
import Link from'next/link';
import { useRouter } from'next/navigation';
import {
 Lightbulb,
 Compass,
 TrendingUp,
 MapPin,
 Bot,
 ArrowRight,
 ArrowLeft,
 X,
 CheckCircle2,
 BookOpen,
 GitBranch,
 Cpu,
 Database,
 ShieldAlert,
 Play,
 Layers,
} from'lucide-react';
import { useProject } from'@/lib/project-context';
import { useAuth } from'@/lib/auth-context';

interface GuidedDemoModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export function GuidedDemoModal({ isOpen, onClose }: GuidedDemoModalProps) {
 const router = useRouter();
 const { demoLogin } = useAuth();
 const { setActiveProjectId, projects } = useProject();
 const [currentStep, setCurrentStep] = useState(1);

 if (!isOpen) return null;

 const totalSteps = 7;

 const handleLaunchLive = async (targetPath: string) => {
 await demoLogin('student');
 if (projects.length > 0) {
 setActiveProjectId(projects[0].id);
 }
 onClose();
 router.push(targetPath);
 };

 const steps = [
 {
 step: 1,
 title:'Step 1: Understand the Idea',
 subtitle:'Natural Language Problem & Solution Formulation',
 icon: Lightbulb,
 content: (
 <div className="space-y-3 text-left">
 <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
 <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
 Sample Project
 </span>
 <h3 className="text-sm font-semibold text-slate-900 mt-1.5">
 AI-Based Smart Community Health Monitoring and Early Warning System
 </h3>
 <p className="text-xs text-slate-500 mt-0.5">Domain: Healthcare & Rural Epidemiology</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
 <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
 <span className="font-semibold text-rose-700 flex items-center gap-1">
 <ShieldAlert className="h-3.5 w-3.5" /> Real-World Problem
 </span>
 <p className="text-slate-600 leading-relaxed text-xs">
 Rural health clinics lack real-time surveillance tools to detect water-borne pathogen outbreaks and disease clusters before widespread contamination.
 </p>
 </div>
 <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
 <span className="font-semibold text-emerald-700 flex items-center gap-1">
 <CheckCircle2 className="h-3.5 w-3.5" /> Proposed Solution
 </span>
 <p className="text-slate-600 leading-relaxed text-xs">
 Edge IoT water sensor telemetry combined with a spatio-temporal Graph Neural Network (GNN) to forecast outbreak risks 72 hours in advance.
 </p>
 </div>
 </div>
 </div>
 ),
 },
 {
 step: 2,
 title:'Step 2: AI Idea Analysis',
 subtitle:'Feasibility, Novelty & Resource Mapping',
 icon: Lightbulb,
 content: (
 <div className="space-y-3 text-left">
 <div className="grid grid-cols-3 gap-2 text-center">
 <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
 <span className="text-base font-semibold text-emerald-700">88%</span>
 <p className="text-xs text-slate-500 font-medium">Feasibility</p>
 </div>
 <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
 <span className="text-base font-semibold text-indigo-700">94%</span>
 <p className="text-xs text-slate-500 font-medium">Innovation</p>
 </div>
 <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
 <span className="text-base font-semibold text-blue-700">85%</span>
 <p className="text-xs text-slate-500 font-medium">Market Fit</p>
 </div>
 </div>

 <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
 <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
 <span className="font-medium text-slate-900">Tech Stack</span>
 <span className="text-xs text-slate-500 font-mono">PyTorch, FastAPI, TimescaleDB, LoRaWAN</span>
 </div>
 <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
 <span className="font-medium text-slate-900">Stakeholders</span>
 <span className="text-xs text-slate-500">Rural Clinics, District Health Officers, Water Boards</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="font-medium text-slate-900">Key Vectors</span>
 <span className="text-xs text-emerald-700 font-medium">72-hr Outbreak Forecast & Low-Power Telemetry</span>
 </div>
 </div>
 </div>
 ),
 },
 {
 step: 3,
 title:'Step 3: Multi-Source Resource Discovery',
 subtitle:'Querying 7 Academic & Engineering Repositories',
 icon: Compass,
 content: (
 <div className="space-y-2.5 text-left">
 <div className="flex flex-wrap gap-1 justify-center py-1">
 {['arXiv','OpenAlex','Crossref','GitHub','Hugging Face','Kaggle'].map((source) => (
 <span key={source} className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 {source}
 </span>
 ))}
 </div>

 <div className="space-y-1.5">
 <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
 <div>
 <span className="text-xs text-red-700 font-medium mr-2">arXiv</span>
 <span className="text-slate-800 font-medium">Spatio-Temporal Graph Neural Networks for Epidemic Forecasting</span>
 </div>
 <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">95%</span>
 </div>
 <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
 <div>
 <span className="text-xs text-purple-700 font-medium mr-2">GitHub</span>
 <span className="text-slate-800 font-medium">esp32-water-telemetry-firmware (LoRa / MQTT)</span>
 </div>
 <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">93%</span>
 </div>
 <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
 <div>
 <span className="text-xs text-emerald-700 font-medium mr-2">Kaggle</span>
 <span className="text-slate-800 font-medium">Water Quality & Pathogen Sensor Benchmark 2024</span>
 </div>
 <span className="text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">89%</span>
 </div>
 </div>
 </div>
 ),
 },
 {
 step: 4,
 title:'Step 4: AI Explainability',
 subtitle:'Why Each Resource Is Relevant',
 icon: BookOpen,
 content: (
 <div className="space-y-2.5 text-left">
 <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-slate-700">Explainable AI Breakdown</span>
 <span className="text-emerald-700 font-semibold text-xs">Relevance: 94%</span>
 </div>

 <div className="space-y-1.5 text-xs">
 {[
 { label:'Problem Alignment', value:'96%', width:'96%', color:'bg-emerald-500' },
 { label:'Tech Compatibility', value:'92%', width:'92%', color:'bg-indigo-600' },
 { label:'Open Access Quality', value:'90%', width:'90%', color:'bg-violet-600' },
 ].map((item) => (
 <div key={item.label}>
 <div className="flex justify-between text-slate-600 mb-0.5">
 <span>{item.label}</span>
 <span className="font-semibold text-slate-700">{item.value}</span>
 </div>
 <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
 <div className={`${item.color} h-full rounded-full`} style={{ width: item.width }} />
 </div>
 </div>
 ))}
 </div>

 <div className="p-2 rounded bg-white border border-slate-200 text-xs text-slate-600">
 <span className="text-slate-900 font-medium">Insight: </span>
 Provides graph convolution formulations needed to model contamination flow across pipeline networks.
 </div>
 </div>
 </div>
 ),
 },
 {
 step: 5,
 title:'Step 5: Technology Trends & Gaps',
 subtitle:'Identifying Unsolved Opportunities',
 icon: TrendingUp,
 content: (
 <div className="space-y-2.5 text-left">
 <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
 <span className="text-xs font-medium text-amber-700">Innovation Gap</span>
 <h4 className="text-xs font-semibold text-slate-900">Edge-Deployable GNNs for Intermittent Rural Mesh Networks</h4>
 <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
 <div className="p-2 rounded bg-white border border-slate-200">
 <span className="text-slate-500 block font-medium">Existing</span>
 <span className="text-slate-700">Cloud-dependent centralized models.</span>
 </div>
 <div className="p-2 rounded bg-white border border-slate-200">
 <span className="text-emerald-700 block font-medium">Opportunity</span>
 <span className="text-slate-700">Quantized INT8 GNN on Raspberry Pi.</span>
 </div>
 </div>
 </div>
 </div>
 ),
 },
 {
 step: 6,
 title:'Step 6: 10-Phase Roadmap',
 subtitle:'From Literature Review to Publication',
 icon: MapPin,
 content: (
 <div className="space-y-2.5 text-left">
 <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-slate-900">Lifecycle Execution</span>
 <span className="text-xs font-semibold text-emerald-700">65% Completed</span>
 </div>
 <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
 <div className="bg-indigo-600 h-full rounded-full" style={{ width:'65%' }} />
 </div>

 <div className="space-y-1 text-xs pt-1">
 <div className="flex items-center gap-1.5 text-emerald-700">
 <CheckCircle2 className="h-3.5 w-3.5" />
 <span>Phase 1: Problem Framing & Literature Review</span>
 </div>
 <div className="flex items-center gap-1.5 text-emerald-700">
 <CheckCircle2 className="h-3.5 w-3.5" />
 <span>Phase 2: Requirements & Feasibility Benchmark</span>
 </div>
 <div className="flex items-center gap-1.5 text-indigo-700 font-medium">
 <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mr-1" />
 <span>Phase 5: Core GNN Development (In Progress)</span>
 </div>
 </div>
 </div>
 </div>
 ),
 },
 {
 step: 7,
 title:'Step 7: AI Innovation Mentor',
 subtitle:'Project-Grounded Guidance & Review',
 icon: Bot,
 content: (
 <div className="space-y-2.5 text-left">
 <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
 <div className="flex items-center gap-1.5 text-slate-700">
 <span className="font-medium text-slate-900">Question:</span>
 <span className="text-slate-600">"How can I improve the technical architecture?"</span>
 </div>
 <div className="p-2.5 rounded bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
 <span className="text-indigo-700 font-medium block">
 Mentor Guidance:
 </span>
 <p>1. <strong>Decouple Telemetry:</strong> Use FastAPI background tasks and Redis to handle intermittent bursts.</p>
 <p>2. <strong>Graph Formulation:</strong> Model village water kiosks as nodes and pipeline aquifers as edges.</p>
 <p>3. <strong>Offline Resilience:</strong> Enable local SQLite caching on edge gateways to prevent data loss.</p>
 </div>
 </div>
 </div>
 ),
 },
 ];

 const currentStepData = steps[currentStep - 1];

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
 <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm p-5 space-y-4 overflow-y-auto">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
 <div className="flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
 <Play className="h-4 w-4" />
 </div>
 <div>
 <h2 className="text-sm font-semibold text-slate-900">Guided Platform Tour</h2>
 <p className="text-xs text-slate-500">Interactive Walkthrough</p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
 >
 <X className="h-4 w-4" />
 </button>
 </div>

 {/* Step Progress */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-xs text-slate-500">
 <span>
 Step {currentStep} of {totalSteps}: {currentStepData.title}
 </span>
 <span className="font-semibold text-slate-700">{Math.round((currentStep / totalSteps) * 100)}%</span>
 </div>
 <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
 <div
 className="bg-indigo-600 h-full rounded-full transition-all duration-300"
 style={{ width:`${(currentStep / totalSteps) * 100}%` }}
 />
 </div>
 </div>

 {/* Content */}
 <div className="py-1">
 <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{currentStepData.title}</h3>
 <p className="text-xs text-slate-500 mb-3">{currentStepData.subtitle}</p>
 {currentStepData.content}
 </div>

 {/* Actions */}
 <div className="flex items-center justify-between pt-3 border-t border-slate-100">
 <button
 onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
 disabled={currentStep === 1}
 className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
 currentStep === 1
 ?'opacity-40 cursor-not-allowed text-slate-400'
 :'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
 }`}
 >
 <ArrowLeft className="h-3.5 w-3.5" />
 Previous
 </button>

 <div className="flex items-center gap-2">
 <button
 onClick={() => handleLaunchLive('/dashboard')}
 className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-200 transition-colors cursor-pointer"
 >
 Open Project
 </button>

 {currentStep < totalSteps ? (
 <button
 onClick={() => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))}
 className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white shadow-sm transition-colors cursor-pointer"
 >
 Next
 <ArrowRight className="h-3.5 w-3.5" />
 </button>
 ) : (
 <button
 onClick={() => handleLaunchLive('/dashboard')}
 className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white shadow-sm transition-colors cursor-pointer"
 >
 Finish
 <CheckCircle2 className="h-3.5 w-3.5" />
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
