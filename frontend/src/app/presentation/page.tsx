'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Lightbulb,
  Compass,
  TrendingUp,
  MapPin,
  Cpu,
  Layers,
  Award,
  CheckCircle2,
  Maximize2,
  Minimize2,
  BookOpen,
  GitBranch,
  ShieldAlert,
} from 'lucide-react';
import { useProject } from '@/lib/project-context';

export default function PresentationPage() {
  const router = useRouter();
  const { activeProject, projects } = useProject();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const project = activeProject || (projects.length > 0 ? projects[0] : {
    title: 'AI-Based Smart Community Health Monitoring and Early Warning System',
    domain: 'Healthcare',
    problem_statement: 'Rural communities and primary health centers lack real-time surveillance tools to detect water-borne pathogen outbreaks and early respiratory infection clusters before widespread community contamination occurs.',
    proposed_solution: 'An integrated AI early-warning platform combining edge IoT water turbidity/pH/microbiological sensor telemetry with a spatio-temporal GNN epidemiology model to forecast pathogen outbreak risks 72 hours in advance.',
    technologies: ['Python', 'FastAPI', 'PyTorch', 'Graph Neural Networks', 'TimescaleDB', 'LoRaWAN', 'React'],
    progress: 65,
  });

  const slides = [
    {
      stepNumber: 1,
      title: 'Project Title & Vision',
      badge: 'InnoSphere AI Capstone Defense',
      render: () => (
        <div className="space-y-6 text-center max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>AI-Powered Student Innovation Showcase</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {project.title}
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Real-Time Pathogen Outbreak Prediction & Early Warning for Underserved Rural Clinics
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 pt-4">
            <span className="px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-medium">Domain: {project.domain || 'Healthcare'}</span>
            <span className="px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-medium">Stage: Prototype (Phase 5)</span>
            <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Feasibility: 88%</span>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 2,
      title: 'The Real-World Problem',
      badge: 'Community Need & Healthcare Gap',
      render: () => (
        <div className="space-y-6 max-w-3xl mx-auto text-left bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <ShieldAlert className="h-5 w-5" />
              <span>Core Vulnerability & Public Health Challenge</span>
            </div>
            <p className="text-sm sm:text-base text-rose-950 leading-relaxed font-medium">
              {project.problem_statement}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center sm:text-left">
              <span className="text-2xl font-bold text-rose-600">72+ hrs</span>
              <p className="text-xs text-slate-600 mt-1 font-medium">Diagnostic delay under manual testing</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center sm:text-left">
              <span className="text-2xl font-bold text-amber-600">60%</span>
              <p className="text-xs text-slate-600 mt-1 font-medium">Preventable admissions during seasonal floods</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center sm:text-left">
              <span className="text-2xl font-bold text-indigo-600">Zero</span>
              <p className="text-xs text-slate-600 mt-1 font-medium">Continuous telemetry in primary rural clinics</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 3,
      title: 'Proposed AI Solution',
      badge: 'Edge-to-Cloud Architecture',
      render: () => (
        <div className="space-y-6 max-w-3xl mx-auto text-left bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <Sparkles className="h-5 w-5" />
              <span>Integrated AI Early-Warning Ecosystem</span>
            </div>
            <p className="text-sm sm:text-base text-emerald-950 leading-relaxed font-medium">
              {project.proposed_solution}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-indigo-700 font-bold block text-sm">1. Edge IoT Telemetry Node</span>
              <p className="text-slate-600 leading-relaxed">ESP32 + Turbidity/pH/Optical sensors transmitting via LoRaWAN mesh networks.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-indigo-700 font-bold block text-sm">2. Spatio-Temporal GNN Engine</span>
              <p className="text-slate-600 leading-relaxed">PyTorch Geometric model forecasting pathogen transmission across river basins.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 4,
      title: 'AI Feasibility & Assessment',
      badge: 'Multi-Vector Intelligent Decomposition',
      render: () => (
        <div className="space-y-6 max-w-3xl mx-auto text-left bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-3xl sm:text-4xl font-bold text-emerald-600">88%</span>
              <p className="text-xs text-emerald-800 font-semibold mt-1">Feasibility Score</p>
            </div>
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
              <span className="text-3xl sm:text-4xl font-bold text-purple-600">94%</span>
              <p className="text-xs text-purple-800 font-semibold mt-1">Innovation Score</p>
            </div>
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-3xl sm:text-4xl font-bold text-blue-600">85%</span>
              <p className="text-xs text-blue-800 font-semibold mt-1">Market Potential</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-indigo-700 block text-sm">Key Evaluation Finding:</span>
            <p className="text-slate-600 leading-relaxed">
              The project demonstrates high structural novelty by bridging hardware IoT telemetry with Spatio-Temporal Graph Neural Networks. Risk mitigation is achieved by adopting standard LoRaWAN frequencies and quantized edge models.
            </p>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 5,
      title: 'Multi-Source Resource Discovery',
      badge: 'Academic Literature, Open Code & Pretrained Models',
      render: () => (
        <div className="space-y-4 max-w-3xl mx-auto text-left bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <p className="text-xs text-slate-500 font-medium">Retrieved and semantically ranked across 7 global scientific repositories:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-rose-600 uppercase">arXiv:2403.09112</span>
                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">96% Match</span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Spatio-Temporal Graph Neural Networks for Epidemic Forecasting</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">Provides mathematical foundations for modeling pathogen contagion vectors.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-purple-700 uppercase">GitHub (2.4k stars)</span>
                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">93% Match</span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs">esp32-water-telemetry-firmware</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">Production LoRaWAN/MQTT firmware for low-power microcontroller telemetry.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 6,
      title: 'Innovation Gaps & Novelty',
      badge: 'Identified Research Vectors',
      render: () => (
        <div className="space-y-6 max-w-3xl mx-auto text-left bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Unaddressed Technical Gap</span>
            <h3 className="text-base font-bold text-slate-900">Edge-Quantized GNN Inference under Intermittent Power</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-slate-500 font-bold block mb-1">State of the Art</span>
                <p className="text-slate-700 text-[11px] leading-relaxed">Heavy cloud servers that require continuous broadband connectivity.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
                <span className="text-emerald-700 font-bold block mb-1">Student Innovation</span>
                <p className="text-emerald-950 text-[11px] leading-relaxed font-medium">INT8 quantized GNN model executing locally on solar-powered micro-gateways.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 7,
      title: 'System Architecture & Tech Stack',
      badge: 'Full-Stack Implementation',
      render: () => (
        <div className="space-y-4 max-w-3xl mx-auto text-left bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-indigo-700 font-bold uppercase block">AI & Modeling</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">PyTorch / GNN</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-purple-700 font-bold uppercase block">Backend API</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">FastAPI / Python</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-emerald-700 font-bold uppercase block">Telemetry DB</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">TimescaleDB</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-blue-700 font-bold uppercase block">Frontend UI</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">Next.js / Tailwind</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 8,
      title: '10-Phase Milestone Roadmap',
      badge: 'Execution & Engineering Lifecycle',
      render: () => (
        <div className="space-y-4 max-w-3xl mx-auto text-left bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">Roadmap Completion</span>
            <span className="text-sm font-bold text-emerald-600">65% (Phase 5 of 10)</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full" style={{ width: '65%' }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Phase 1: Literature & Framing</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Phase 2: Feasibility Benchmark</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Phase 3: Hardware & Sensor Spec</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center gap-2 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />
              <span>Phase 5: GNN Model Training (Active)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 9,
      title: 'Expected Real-World Impact',
      badge: 'Social & Clinical Outcomes',
      render: () => (
        <div className="space-y-6 max-w-3xl mx-auto text-left bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-200">
              <span className="text-3xl sm:text-4xl font-bold text-indigo-700">72 hrs</span>
              <p className="text-xs text-indigo-900 font-semibold mt-1">Advance Outbreak Warning</p>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-3xl sm:text-4xl font-bold text-emerald-700">-65%</span>
              <p className="text-xs text-emerald-900 font-semibold mt-1">Emergency Hospitalizations</p>
            </div>
            <div className="p-6 rounded-2xl bg-purple-50 border border-purple-200">
              <span className="text-3xl sm:text-4xl font-bold text-purple-700">10x</span>
              <p className="text-xs text-purple-900 font-semibold mt-1">Lower Hardware Deployment Cost</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 10,
      title: 'Conclusion & Next Steps',
      badge: 'Capstone Ready & Defense Prepared',
      render: () => (
        <div className="space-y-6 max-w-3xl mx-auto text-center bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <Award className="h-4 w-4 text-emerald-600" />
            <span>Ready for Pilot Deployment</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Transforming Ideas into Verified Innovation
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            InnoSphere AI empowered this student project from initial problem formulation to mathematical modeling, code discovery, and milestone tracking.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all"
            >
              Return to Live Dashboard
            </Link>
          </div>
        </div>
      ),
    },
  ];

  const currentSlideData = slides[currentSlide];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        router.push('/dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, slides.length]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col justify-between p-3 sm:p-6 md:p-8 select-none overflow-y-auto">
      {/* Top Slide Control Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 sm:pb-4 max-w-6xl mx-auto w-full shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Slide {currentSlide + 1} of {slides.length}
            </span>
            <p className="text-[11px] sm:text-xs text-indigo-700 font-semibold">{currentSlideData.badge}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                setIsFullscreen(true);
              } else {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
              }
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-2xs transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-[11px] sm:text-xs font-semibold shadow-2xs transition-colors"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Exit Presentation</span>
            <span className="sm:hidden">Exit</span>
          </Link>
        </div>
      </div>

      {/* Main Slide Canvas */}
      <div className="my-auto py-4 sm:py-8 w-full max-w-5xl mx-auto overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {currentSlideData.render()}
      </div>

      {/* Bottom Navigation & Progress Dots */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 sm:pt-4 max-w-6xl mx-auto w-full shrink-0">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          disabled={currentSlide === 0}
          className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold ${
            currentSlide === 0 ? 'opacity-30 cursor-not-allowed text-slate-400 bg-white border border-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Prev</span>
        </button>

        {/* Progress Dots */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 sm:h-2.5 rounded-full transition-all ${
                idx === currentSlide ? 'w-6 sm:w-8 bg-indigo-600' : 'w-2 sm:w-2.5 bg-slate-200 hover:bg-slate-300'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
          disabled={currentSlide === slides.length - 1}
          className={`flex items-center gap-1 px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs font-bold ${
            currentSlide === slides.length - 1
              ? 'opacity-30 cursor-not-allowed text-slate-400 bg-white border border-slate-200'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
          }`}
        >
          <span>Next</span>
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  );
}
