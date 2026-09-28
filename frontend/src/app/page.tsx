'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Compass,
  Lightbulb,
  MapPin,
  Bookmark,
  Layers,
  BarChart3,
  Cpu,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
  Zap,
  TrendingUp,
  Search,
  Check,
  Play,
  Monitor,
  Activity,
  Users,
  Brain,
  Network,
  Database,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { GuidedDemoModal } from '@/components/guided-demo-modal';

export default function LandingPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'analysis' | 'discovery' | 'scoring' | 'roadmap' | 'hardware'>('analysis');

  useEffect(() => {
    api.getAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const differentiators = [
    {
      num: '01',
      title: 'Beyond Search',
      subtitle: 'Conceptual Natural Language Understanding',
      desc: 'Does not simply return keyword matches; it deeply understands your problem statement, target users, and engineering constraints.',
      icon: Brain,
      color: 'from-blue-500/20 to-indigo-500/20 border-indigo-500/30 text-indigo-400',
    },
    {
      num: '02',
      title: 'Multi-Source Intelligence',
      subtitle: 'Unified Scientific & Engineering Discovery',
      desc: 'Concurrently queries and aggregates arXiv, OpenAlex, Semantic Scholar, Crossref, GitHub, Hugging Face, and benchmark datasets.',
      icon: Network,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    },
    {
      num: '03',
      title: 'Explainable AI',
      subtitle: 'Transparent Multi-Factor Scoring',
      desc: 'Explains exactly why each retrieved resource is relevant to your idea, breaking down problem match, domain match, and tech compatibility.',
      icon: Sparkles,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    },
    {
      num: '04',
      title: 'Innovation Gap Detection',
      subtitle: 'Uncovering Unsolved Research Gaps',
      desc: 'Analyzes literature to detect unaddressed limitations in current approaches, highlighting high-novelty vectors for your project.',
      icon: TrendingUp,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    },
    {
      num: '05',
      title: 'Idea-to-Roadmap',
      subtitle: 'Actionable 10-Phase Engineering Plan',
      desc: 'Transforms raw conceptual ideas into a milestone-by-milestone development lifecycle from literature review to defense and publishing.',
      icon: MapPin,
      color: 'from-indigo-500/20 to-cyan-500/20 border-indigo-500/30 text-cyan-400',
    },
    {
      num: '06',
      title: 'Human + AI Collaboration',
      subtitle: 'Faculty Mentorship & Rubric Evaluation',
      desc: 'Combines AI-assisted resource recommendations with faculty mentor review rubrics, feedback threads, and student responses.',
      icon: Users,
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400',
    },
  ];

  const visualFlowSteps = [
    { name: 'IDEA', desc: 'Problem Definition', color: 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' },
    { name: 'AI UNDERSTANDING', desc: 'Decomposition', color: 'bg-blue-600/20 border-blue-500/40 text-blue-300' },
    { name: 'MULTI-SOURCE DISCOVERY', desc: '7 Scientific APIs', color: 'bg-purple-600/20 border-purple-500/40 text-purple-300' },
    { name: 'EXPLAINABLE ANALYSIS', desc: 'Transparent Scoring', color: 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300' },
    { name: 'INSIGHTS & GAPS', desc: 'Novelty Frontiers', color: 'bg-amber-600/20 border-amber-500/40 text-amber-300' },
    { name: 'ROADMAP', desc: '10 Execution Phases', color: 'bg-teal-600/20 border-teal-500/40 text-teal-300' },
    { name: 'INNOVATION', desc: 'Verified MVP Solution', color: 'bg-rose-600/20 border-rose-500/40 text-rose-300' },
  ];

  const stats = [
    { label: 'Resources Discovered', value: analytics?.metrics?.resources_discovered ? `${analytics.metrics.resources_discovered}+` : '2,450+', sub: 'Indexed & Semantically Ranked' },
    { label: 'Ideas Analyzed', value: analytics?.metrics?.ideas_analyzed ? `${analytics.metrics.ideas_analyzed}+` : '380+', sub: 'Multi-Vector Evaluated' },
    { label: 'Technologies Explored', value: '84+', sub: 'Frameworks, Models & Tools' },
    { label: 'Research Sources', value: '7+', sub: 'Live Public APIs' },
    { label: 'Student Projects', value: analytics?.metrics?.student_projects ? `${analytics.metrics.student_projects}+` : '120+', sub: 'Across 15 Domains' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-blue-600/20 blur-[130px] pointer-events-none -z-10" />

        <div className="mx-auto max-w-5xl text-center space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300 backdrop-blur-sm animate-in fade-in">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI-Powered Student Innovation & Intelligent Discovery</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Turn Your Ideas Into <br />
            <span className="gradient-text">Verified Innovation with AI</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto max-w-3xl text-base sm:text-lg text-slate-300 leading-relaxed">
            Students have ambitious ideas but struggle to discover and connect the right <strong>research papers, open-source repositories, datasets, and milestone roadmaps</strong>. InnoSphere AI transforms unstructured concepts into research-backed, explainable innovation pathways.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/submit-idea"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:scale-105 transition-all"
            >
              <Lightbulb className="h-4 w-4 text-white" />
              <span>Start Your Innovation</span>
            </Link>

            <button
              onClick={() => setDemoModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all hover:text-white"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Explore Guided Demo</span>
            </button>

            <Link
              href="/presentation"
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
            >
              <Monitor className="h-3.5 w-3.5 text-purple-400" />
              <span>Presentation Slides</span>
            </Link>
          </div>

          {/* Interactive Live Product Preview Canvas */}
          <div className="mt-12 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-4 sm:p-6 text-left max-w-4xl mx-auto space-y-4">
            {/* Preview Header & Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="text-xs font-bold text-slate-300 ml-2">InnoSphere Intelligence Canvas</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] overflow-x-auto max-w-full no-scrollbar">
                {[
                  { id: 'analysis', label: 'AI Idea Analysis' },
                  { id: 'discovery', label: '7-Source Discovery' },
                  { id: 'scoring', label: 'Explainable Scoring' },
                  { id: 'roadmap', label: '10-Phase Roadmap' },
                  { id: 'hardware', label: 'Hardware Lab' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPreviewTab(t.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      previewTab === t.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Preview Content */}
            <div className="py-2">
              {previewTab === 'analysis' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Target Domain</span>
                      <h4 className="text-sm font-bold text-white">Smart Community Health & Early Warning</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      Feasibility: 88%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-indigo-400">Technical Novelty: 94%</span>
                      <p className="text-slate-400 text-[10px]">Bridges edge IoT telemetry with Spatio-Temporal GNNs.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-purple-400">Market Potential: 85%</span>
                      <p className="text-slate-400 text-[10px]">High demand in primary rural clinics and district health hubs.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-emerald-400">Risk Assessment: Low</span>
                      <p className="text-slate-400 text-[10px]">Quantized edge models minimize compute requirements.</p>
                    </div>
                  </div>
                </div>
              )}

              {previewTab === 'discovery' && (
                <div className="space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[10px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">arXiv (4 Papers)</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">GitHub (6 Repos)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">HuggingFace (3 Models)</span>
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">Kaggle (2 Datasets)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-white">Lightweight 1D-CNN Telemetry Transformer for Low-Power Edge Devices</h4>
                      <p className="text-[10px] text-slate-400">Retrieved from arXiv (2025) &bull; 94% Relevance Match</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded bg-indigo-600/20 text-indigo-300 font-bold">Phase 3/4 Match</span>
                  </div>
                </div>
              )}

              {previewTab === 'scoring' && (
                <div className="space-y-2 text-xs animate-in fade-in">
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span className="text-indigo-300">Multi-Vector Semantic Match Breakdown</span>
                      <span className="text-emerald-400">Overall: 94%</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">Problem Match: <strong className="text-white">96%</strong></div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">Domain Match: <strong className="text-white">92%</strong></div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">Tech Compatibility: <strong className="text-white">95%</strong></div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">Open Access: <strong className="text-emerald-400">100%</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {previewTab === 'roadmap' && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
                    {['1. Literature', '2. Formulation', '3. Data Prep', '4. Core Dev', '5. Validation'].map((p, i) => (
                      <div key={i} className={`p-2 rounded-lg border text-center ${i <= 2 ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <span className="font-bold block">{p}</span>
                        <span className="text-[9px]">{i <= 2 ? 'Completed' : 'In Progress'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewTab === 'hardware' && (
                <div className="space-y-2 animate-in fade-in text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-indigo-400" />
                      <div>
                        <span className="font-bold text-white block">Water Kiosk IoT Node (ESP32)</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Telemetry Streaming (LoRaWAN &bull; 915 MHz)</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">Turbidity: 4.8 NTU</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Visual Innovation Flow Diagram */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-6xl mx-auto space-y-6 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            End-to-End Innovation Pipeline
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
            {visualFlowSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border ${step.color} flex flex-col items-center justify-center text-center relative group transition-all hover:scale-105`}
              >
                <span className="text-[10px] font-mono text-slate-400 mb-0.5 font-bold">0{idx + 1}</span>
                <span className="text-xs font-extrabold text-white tracking-tight">{step.name}</span>
                <span className="text-[10px] text-slate-400 mt-1">{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem & Solution Comparison Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* The Problem */}
          <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/30">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>The Problem Students Face</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Valuable Resources Are Fragmented & Overwhelming
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Students frequently develop ambitious technical ideas but struggle to locate relevant peer-reviewed papers, open-source code repositories, clean datasets, and deployment frameworks. Standard search engines return unstructured links without contextual relevance or engineering roadmaps.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Disconnected literature, code repos, and dataset repositories
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                No explanation of why a particular tool or paper is applicable
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Difficulty identifying genuine innovation gaps and novelty
              </li>
            </ul>
          </div>

          {/* The Solution */}
          <div className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>The InnoSphere AI Solution</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Structured, Explainable Innovation Pathways
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              InnoSphere AI leverages natural language understanding to decompose ideas, concurrently query 7 global scientific sources, score relevance with transparent multi-factor metrics, detect innovation gaps, and generate structured 10-phase milestone roadmaps.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Real-time multi-source discovery (arXiv, OpenAlex, GitHub, HF, Kaggle)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Transparent AI Explainability and multi-factor relevance estimates
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Integrated 10-phase roadmaps + faculty mentor review workflows
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section: Why InnoSphere AI? */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-950/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Core Architectural Advantages
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Why InnoSphere AI?
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Six foundational pillars that distinguish our platform from generic search engines and chatbot assistants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentiators.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.num}
                  className={`p-6 rounded-3xl bg-slate-900/90 border ${item.color} space-y-4 flex flex-col justify-between hover:scale-[1.02] transition-transform`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">{item.num}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">{item.title}</h3>
                      <p className="text-xs text-indigo-300 font-medium mt-0.5">{item.subtitle}</p>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Dynamic Stats */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight block">
                  {stat.value}
                </span>
                <span className="text-xs font-semibold text-indigo-300 block">{stat.label}</span>
                <span className="text-[10px] text-slate-500 block">{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-slate-950 to-indigo-950/40">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Accelerate Your Student Innovation?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Experience how InnoSphere AI connects research, open code, datasets, and milestone roadmaps.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setDemoModalOpen(true)}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:scale-105 transition-all"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Start 5-Minute Guided Demo</span>
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              Enter Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Guided Demo Modal */}
      <GuidedDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
}
