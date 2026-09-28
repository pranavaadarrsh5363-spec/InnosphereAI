'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
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
  ExternalLink,
  ShieldAlert,
  Play,
  Layers,
  Award,
} from 'lucide-react';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth-context';

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
      title: 'Step 1: Understand the Idea',
      subtitle: 'Natural Language Problem & Solution Formulation',
      icon: Lightbulb,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
              Flagship Innovation Project
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1.5">
              AI-Based Smart Community Health Monitoring and Early Warning System
            </h3>
            <p className="text-xs text-slate-600 mt-1">Domain: Healthcare & Rural Epidemiology</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-semibold text-rose-700 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> Real-World Problem
              </span>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                Rural health clinics lack real-time surveillance tools to detect water-borne pathogen outbreaks and disease clusters before widespread community contamination occurs.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Proposed AI Solution
              </span>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                An edge IoT water sensor telemetry platform combined with a spatio-temporal Graph Neural Network (GNN) to forecast outbreak risks 72 hours in advance.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      title: 'Step 2: AI Idea Analysis',
      subtitle: 'Multi-Vector Feasibility, Novelty & Resource Mapping',
      icon: Sparkles,
      content: (
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-lg font-black text-emerald-700">88%</span>
              <p className="text-[10px] text-slate-600 font-medium">Feasibility</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-lg font-black text-purple-700">94%</span>
              <p className="text-[10px] text-slate-600 font-medium">Innovation</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-lg font-black text-blue-700">85%</span>
              <p className="text-[10px] text-slate-600 font-medium">Market Potential</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-semibold text-slate-900">Required Tech Stack</span>
              <span className="text-[10px] text-slate-600 font-mono">PyTorch, FastAPI, TimescaleDB, LoRaWAN</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-semibold text-slate-900">Target Stakeholders</span>
              <span className="text-[10px] text-slate-600">Rural Clinics, District Health Officers, Water Boards</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Innovation Vectors</span>
              <span className="text-[10px] text-emerald-700 font-medium">72-hr Outbreak Forecast & Low-Power Telemetry</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      title: 'Step 3: Multi-Source Resource Discovery',
      subtitle: 'Concurrently Querying 7 Academic & Engineering Repositories',
      icon: Compass,
      content: (
        <div className="space-y-3 text-left">
          <div className="flex flex-wrap gap-1.5 justify-center py-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">arXiv</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">OpenAlex</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">Crossref</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">GitHub</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Hugging Face</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Kaggle</span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-red-700 font-bold mr-2">arXiv</span>
                <span className="text-slate-900 font-medium text-[11px]">Spatio-Temporal Graph Neural Networks for Epidemic Forecasting</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">95% Match</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-purple-700 font-bold mr-2">GitHub</span>
                <span className="text-slate-900 font-medium text-[11px]">esp32-water-telemetry-firmware (LoRa / MQTT)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">93% Match</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-700 font-bold mr-2">Kaggle</span>
                <span className="text-slate-900 font-medium text-[11px]">Water Quality & Pathogen Sensor Benchmark 2024</span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">89% Match</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 4,
      title: 'Step 4: Transparent AI Explainability',
      subtitle: 'Why Each Retrieved Resource Is Relevant',
      icon: BookOpen,
      content: (
        <div className="space-y-3 text-left">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Explainable AI Breakdown</span>
              <span className="text-emerald-700 font-bold text-xs">Overall AI Relevance: 94%</span>
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>Problem Alignment</span>
                  <span className="text-slate-900 font-bold">96%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>Technology Compatibility</span>
                  <span className="text-slate-900 font-bold">92%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>Recency & Open Access</span>
                  <span className="text-slate-900 font-bold">90%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '90%' }} />
                </div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700">
              <span className="text-blue-700 font-bold">AI Insight: </span>
              Directly provides the graph convolution adjacency matrix formulation needed to model contamination flow across river and pipeline node networks.
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 5,
      title: 'Step 5: Technology Trends & Innovation Gaps',
      subtitle: 'Identifying Unsolved Research Opportunities',
      icon: TrendingUp,
      content: (
        <div className="space-y-3 text-left">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Identified Innovation Gap</span>
            <h4 className="text-xs font-bold text-slate-900">Edge-Deployable GNNs for Intermittent Rural Mesh Networks</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block font-semibold">Existing Approach</span>
                <span className="text-slate-700">Heavy cloud-dependent centralized LSTM models.</span>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-emerald-700 block font-semibold">Student Opportunity</span>
                <span className="text-slate-700">Quantized INT8 GNN running locally on Raspberry Pi.</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 italic">
              * Potential research opportunity identified from the analyzed sources.
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 6,
      title: 'Step 6: 10-Phase Innovation Roadmap',
      subtitle: 'From Literature Review to Field Defense & Publication',
      icon: MapPin,
      content: (
        <div className="space-y-3 text-left">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">10-Phase Lifecycle Execution</span>
              <span className="text-xs font-bold text-emerald-700">65% Completed</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full" style={{ width: '65%' }} />
            </div>

            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Phase 1: Problem Framing & Literature Review</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Phase 2: Requirements & Feasibility Benchmark</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse ml-0.5 mr-1" />
                <span>Phase 5: Core GNN Outbreak Model Development (In Progress)</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 7,
      title: 'Step 7: Context-Aware AI Innovation Mentor',
      subtitle: 'Project-Grounded Technical Guidance & Architecture Review',
      icon: Bot,
      content: (
        <div className="space-y-3 text-left">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="font-bold text-slate-900">Student Question:</span>
              <span className="italic">"How can I improve the technical architecture of this project?"</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-800 leading-relaxed space-y-1">
              <span className="text-emerald-700 font-bold block flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI Mentor Recommendation:
              </span>
              <p>
                1. <strong>Decouple Telemetry Ingestion:</strong> Use FastAPI with background tasks and Redis buffer to handle intermittent LoRaWAN bursts.
              </p>
              <p>
                2. <strong>Spatio-Temporal Graph Formulation:</strong> Model village water kiosks as graph nodes and aquifer pipelines as directional edges.
              </p>
              <p>
                3. <strong>Offline-First Resilience:</strong> Enable local SQLite caching on edge gateways to prevent telemetry loss during cellular outages.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Guided Platform Demo</h2>
              <p className="text-xs text-slate-500">5-Minute Interactive Evaluator Tour</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Step {currentStep} of {totalSteps}: {currentStepData.title}
            </span>
            <span className="text-blue-600 font-bold">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="py-2">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">{currentStepData.title}</h3>
          <p className="text-xs text-blue-600 mb-4 font-medium">{currentStepData.subtitle}</p>
          {currentStepData.content}
        </div>

        {/* Step Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLaunchLive('/dashboard')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              Open Live Project
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleLaunchLive('/dashboard')}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                Finish & Enter Platform
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
