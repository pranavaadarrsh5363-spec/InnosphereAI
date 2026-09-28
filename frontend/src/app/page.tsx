'use client';

import React, { useState, useEffect } from'react';
import Link from'next/link';
import {
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
 Atom,
 FlaskConical,
 FileText,
 SlidersHorizontal,
 ChevronRight,
 Radio,
} from'lucide-react';
import { api } from'@/lib/api';
import { GuidedDemoModal } from'@/components/guided-demo-modal';

export default function LandingPage() {
 const [analytics, setAnalytics] = useState<any>(null);
 const [demoModalOpen, setDemoModalOpen] = useState(false);
 const [previewTab, setPreviewTab] = useState<'overview' |'research' |'experiments' |'validation' |'architecture'>('overview');

 useEffect(() => {
 api.getAnalytics().then(setAnalytics).catch(() => {});
 }, []);

 // 1. Process Steps (How InnoSphere Works)
 const processSteps = [
 {
 step:'01',
 title:'Define the problem',
 desc:'Formulate your scientific hypothesis, target stakeholders, and engineering constraints with structured problem decomposition.',
 },
 {
 step:'02',
 title:'Explore research & resources',
 desc:'Discover relevant peer-reviewed papers, preprints, benchmark datasets, and open-source implementations across 7 scientific indices.',
 },
 {
 step:'03',
 title:'Design the solution',
 desc:'Map hardware components, machine learning model architectures, and database requirements with technical explainability.',
 },
 {
 step:'04',
 title:'Run experiments',
 desc:'Record deterministic trials, parameter configurations, edge telemetry, and comparative baselines in an empirical ledger.',
 },
 {
 step:'05',
 title:'Validate evidence',
 desc:'Link each innovation claim to measured experimental results to substantiate novelty and defense readiness.',
 },
 {
 step:'06',
 title:'Prepare the innovation',
 desc:'Generate IEEE-compliant research drafts, jury presentation decks, and deployment blueprints for evaluation.',
 },
 ];

 // 2. Core Capabilities Grid
 const capabilities = [
 {
 title:'Research Discovery',
 desc:'Identify relevant research papers, preprints, and citation graphs across arXiv, OpenAlex, and Semantic Scholar.',
 icon: BookOpen,
 },
 {
 title:'Resource Intelligence',
 desc:'Catalog open-source code repositories, model weights on Hugging Face, and public benchmark datasets.',
 icon: Database,
 },
 {
 title:'Experiment Management',
 desc:'Plan, execute, and record reproducible empirical trials with controlled baselines and metric logging.',
 icon: FlaskConical,
 },
 {
 title:'Validation Matrix',
 desc:'Connect technical claims directly to observable experimental data and testbed measurements.',
 icon: ShieldCheck,
 },
 {
 title:'Project Intelligence',
 desc:'Evaluate innovation readiness, identify research gaps, and prioritize actionable engineering milestones.',
 icon: Activity,
 },
 {
 title:'Hardware Lab',
 desc:'Monitor real-time microcontroller telemetry, sensor thresholds, and digital testbeds with anomaly detection.',
 icon: Cpu,
 },
 {
 title:'AI Mentor',
 desc:'Receive project-aware technical guidance, literature synthesis, and roadmap suggestions grounded in your active workspace.',
 icon: Brain,
 },
 ];

 // 3. Workflow Pipeline
 const workflowStages = [
 { stage:'Idea', label:'Concept Intake' },
 { stage:'Problem', label:'Decomposition' },
 { stage:'Research', label:'Literature & Data' },
 { stage:'Solution', label:'Architecture' },
 { stage:'Experiment', label:'Empirical Trials' },
 { stage:'Validation', label:'Evidence Matrix' },
 { stage:'Innovation', label:'Defended Project' },
 ];

 // 4. Evidence Sources
 const evidenceSources = [
 { name:'arXiv Preprints', type:'Peer-Reviewed & Preprints', count:'2.4M+ Papers', icon: BookOpen },
 { name:'OpenAlex', type:'Scholarly Knowledge Graph', count:'250M+ Works', icon: Database },
 { name:'GitHub Open Source', type:'Code Repositories', count:'100M+ Repos', icon: GitBranch },
 { name:'Hugging Face Hub', type:'Pretrained AI Models', count:'500K+ Models', icon: Cpu },
 { name:'Kaggle & Open Data', type:'Benchmark Datasets', count:'150K+ Datasets', icon: Layers },
 { name:'USPTO Patent Index', type:'Prior Art & Novelty', count:'11M+ Patents', icon: ShieldCheck },
 ];

 const stats = [
 { label:'Resources Indexed', value: analytics?.metrics?.resources_discovered ?`${analytics.metrics.resources_discovered}+` :'2,450+', sub:'Semantically Ranked' },
 { label:'Ideas Analyzed', value: analytics?.metrics?.ideas_analyzed ?`${analytics.metrics.ideas_analyzed}+` :'380+', sub:'Multi-Vector Evaluated' },
 { label:'Active Projects', value: analytics?.metrics?.student_projects ?`${analytics.metrics.student_projects}+` :'120+', sub:'University Cohorts' },
 { label:'Scientific Sources', value:'7 Connectors', sub:'Live Public APIs' },
 { label:'Research Domains', value:'15 Fields', sub:'HealthTech to Edge AI' },
 ];

 return (
 <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
 {/* 1. Hero Section */}
 <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto border-b border-slate-200 bg-white w-full">
 <div className="mx-auto text-center space-y-6">
 {/* Restrained Eyebrow */}
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
 <Atom className="h-3.5 w-3.5 text-indigo-600" />
 <span>Innosphere AI · University Innovation & Research Platform</span>
 </div>

 {/* Disciplined Professional Heading */}
 <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mx-auto">
 Turn student ideas into evidence-backed innovations
 </h1>

 {/* Supporting Text */}
 <p className="mx-auto max-w-3xl text-sm text-slate-600 leading-relaxed">
 Research relevant technologies, explore resources, run experiments, validate claims, and develop projects with AI-assisted guidance.
 </p>

 {/* CTAs */}
 <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
 <Link
 href="/submit-idea"
 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
 >
 <Lightbulb className="h-4 w-4" />
 <span>Start a Project</span>
 </Link>

 <button
 onClick={() => setDemoModalOpen(true)}
 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer shadow-sm"
 >
 <Play className="h-3.5 w-3.5 text-slate-500" />
 <span>Explore the Platform</span>
 </button>

 <Link
 href="/projects"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
 >
 <span>View Projects Directory</span>
 <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </div>

 {/* Realistic Product Workspace Preview */}
 <div className="mt-10 rounded-lg bg-white border border-slate-200 shadow-sm text-left max-w-4xl mx-auto overflow-hidden">
 {/* Preview Top Bar */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
 <div className="flex items-center gap-3">
 <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold text-slate-900">
 Smart Community Water Quality & Early Warning Network
 </span>
 <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
 Project #1 • Environmental IoT & AI
 </span>
 </div>
 </div>
 </div>

 {/* Workspace Preview Tabs */}
 <div className="flex gap-1 bg-slate-200/70 p-0.5 rounded text-xs overflow-x-auto no-scrollbar">
 {[
 { id:'overview', label:'Project Overview' },
 { id:'research', label:'Research & Evidence' },
 { id:'experiments', label:'Experiments' },
 { id:'validation', label:'Validation Matrix' },
 { id:'architecture', label:'Architecture' },
 ].map((t) => (
 <button
 key={t.id}
 onClick={() => setPreviewTab(t.id as any)}
 className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
 previewTab === t.id
 ?'bg-white text-slate-900 font-semibold shadow-sm'
 :'text-slate-600 hover:text-slate-900'
 }`}
 >
 {t.label}
 </button>
 ))}
 </div>
 </div>

 {/* Dynamic Preview Content */}
 <div className="p-5">
 {previewTab ==='overview' && (
 <div className="space-y-4 text-xs">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
 <span className="text-xs font-semibold text-slate-500 block">Problem Statement</span>
 <p className="text-slate-700 line-clamp-3">
 Contaminated municipal water kiosks in semi-urban communities lack real-time continuous sensor monitoring, leading to delayed contamination detection.
 </p>
 </div>

 <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
 <span className="text-xs font-semibold text-slate-500 block">Technical Solution</span>
 <p className="text-slate-700 line-clamp-3">
 Solar-powered ESP32 microcontroller with analog turbidity/pH probes streaming telemetry via LoRaWAN into a FastAPI backend with 1D-CNN anomaly detection.
 </p>
 </div>

 <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
 <span className="text-xs font-semibold text-slate-500 block">Recommended Next Action</span>
 <div className="flex items-center gap-1.5 text-indigo-600 font-medium pt-0.5">
 <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
 <span>Deploy INT8 quantized ONNX model on ESP32 node</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
 <div className="p-3 rounded-lg border border-slate-200 bg-white">
 <span className="text-slate-500 block">Research Citations</span>
 <span className="text-sm font-semibold text-slate-900">4 Papers Verified</span>
 </div>
 <div className="p-3 rounded-lg border border-slate-200 bg-white">
 <span className="text-slate-500 block">Empirical Experiments</span>
 <span className="text-sm font-semibold text-slate-900">8 Trials Recorded</span>
 </div>
 <div className="p-3 rounded-lg border border-slate-200 bg-white">
 <span className="text-slate-500 block">Validation Matrix</span>
 <span className="text-sm font-semibold text-emerald-600">6/6 Claims Validated</span>
 </div>
 <div className="p-3 rounded-lg border border-slate-200 bg-white">
 <span className="text-slate-500 block">TRL Maturity</span>
 <span className="text-sm font-semibold text-indigo-600">Level 5 (Validation)</span>
 </div>
 </div>
 </div>
 )}

 {previewTab ==='research' && (
 <div className="space-y-3 text-xs">
 <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2">
 <span>Indexed Scientific References (Sample from arXiv & OpenAlex)</span>
 <span className="text-emerald-600">94.8% Mean Semantic Match</span>
 </div>
 <div className="space-y-2">
 <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex justify-between items-center">
 <div>
 <h4 className="font-semibold text-slate-900">
 Lightweight 1D-CNN Telemetry Transformer for Low-Power Edge Microcontrollers
 </h4>
 <p className="text-xs text-slate-500 mt-0.5">
 arXiv:2403.11892 &bull; IEEE Transactions on Industrial Informatics (2025)
 </p>
 </div>
 <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-200 shrink-0 ml-3">
 Phase 3 Match
 </span>
 </div>

 <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex justify-between items-center">
 <div>
 <h4 className="font-semibold text-slate-900">
 Autonomous Water Quality Anomaly Detection Using LoRaWAN Sensor Clusters
 </h4>
 <p className="text-xs text-slate-500 mt-0.5">
 OpenAlex W438921 &bull; Environmental Science & Technology (2024)
 </p>
 </div>
 <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 shrink-0 ml-3">
 Baseline Reference
 </span>
 </div>
 </div>
 </div>
 )}

 {previewTab ==='experiments' && (
 <div className="space-y-3 text-xs">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
 <th className="py-2 px-2">Trial</th>
 <th className="py-2 px-2">Hypothesis</th>
 <th className="py-2 px-2">Dataset / Testbed</th>
 <th className="py-2 px-2">Baseline</th>
 <th className="py-2 px-2">Result</th>
 <th className="py-2 px-2">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 text-xs">
 <tr>
 <td className="py-2 px-2 font-medium">EXP-001</td>
 <td className="py-2 px-2">1D-CNN detects turbidity spikes in &lt;100ms</td>
 <td className="py-2 px-2 text-slate-600">Simulated Kiosk Matrix</td>
 <td className="py-2 px-2 text-slate-500">82.4% (Threshold)</td>
 <td className="py-2 px-2 font-medium text-slate-900">96.8% Acc (68ms)</td>
 <td className="py-2 px-2"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">Confirmed</span></td>
 </tr>
 <tr>
 <td className="py-2 px-2 font-medium">EXP-002</td>
 <td className="py-2 px-2">LoRaWAN packet loss stays &lt;2% at 5km range</td>
 <td className="py-2 px-2 text-slate-600">SX1262 Physical Node</td>
 <td className="py-2 px-2 text-slate-500">5.2% (Standard)</td>
 <td className="py-2 px-2 font-medium text-slate-900">0.85% Loss</td>
 <td className="py-2 px-2"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">Confirmed</span></td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 )}

 {previewTab ==='validation' && (
 <div className="space-y-3 text-xs">
 <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
 <div className="flex items-center justify-between">
 <span className="font-semibold text-slate-900">Primary Claim Verification</span>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">Empirically Grounded</span>
 </div>
 <p className="text-xs text-slate-600">
 <strong>Claim:</strong>"System alerts field staff within 5 minutes of bacterial or turbidity threshold breach."
 </p>
 <p className="text-xs text-slate-600">
 <strong>Observed Evidence:</strong> 42 automated hardware trial runs observed mean alert dispatch latency of <strong>84 seconds</strong> across 3 municipal testing wells.
 </p>
 </div>
 </div>
 )}

 {previewTab ==='architecture' && (
 <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-2">
 <span className="text-xs font-semibold text-slate-500 block">End-to-End Pipeline</span>
 <div className="flex flex-wrap items-center gap-2 text-xs">
 <span className="p-1.5 rounded bg-white border border-slate-200">Sensors (pH/NTU)</span>
 <span className="text-slate-400">&rarr;</span>
 <span className="p-1.5 rounded bg-white border border-slate-200">ESP32 (Quantized ONNX)</span>
 <span className="text-slate-400">&rarr;</span>
 <span className="p-1.5 rounded bg-white border border-slate-200">LoRaWAN Gateway</span>
 <span className="text-slate-400">&rarr;</span>
 <span className="p-1.5 rounded bg-white border border-slate-200">FastAPI + TimescaleDB</span>
 <span className="text-slate-400">&rarr;</span>
 <span className="p-1.5 rounded bg-white border border-slate-200">Next.js UI & WebSockets</span>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </section>

 {/* 2. How InnoSphere Works */}
 <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto bg-slate-50 w-full">
 <div className="space-y-6">
 <div className="text-center space-y-2">
 <span className="text-xs font-medium text-slate-500">
 Methodology
 </span>
 <h2 className="text-sm font-semibold text-slate-900">
 How InnoSphere Works
 </h2>
 <p className="text-sm text-slate-600 max-w-xl mx-auto">
 A structured six-stage process translating unstructured concepts into verifiable, competition-ready innovations.
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {processSteps.map((s) => (
 <div
 key={s.step}
 className="p-5 rounded-lg border border-slate-200 bg-white space-y-2 hover:border-slate-300 transition-colors shadow-sm"
 >
 <span className="text-xs font-medium text-indigo-600">{s.step}</span>
 <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
 <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* 3. Core Capabilities */}
 <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto bg-white w-full">
 <div className="space-y-6">
 <div className="text-center space-y-2">
 <span className="text-xs font-medium text-slate-500">
 Platform Features
 </span>
 <h2 className="text-sm font-semibold text-slate-900">
 Core Capabilities
 </h2>
 <p className="text-sm text-slate-600 max-w-xl mx-auto">
 Integrated engineering and scientific modules designed for research rigor.
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {capabilities.map((c, i) => {
 const Icon = c.icon;
 return (
 <div
 key={i}
 className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5 hover:border-slate-300 transition-colors"
 >
 <div className="h-8 w-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-indigo-600">
 <Icon className="h-4 w-4" />
 </div>
 <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
 <p className="text-sm text-slate-600 leading-relaxed">{c.desc}</p>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* 4. Project Workflow Pipeline */}
 <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto bg-slate-50 w-full">
 <div className="space-y-6 text-center">
 <span className="text-xs font-medium text-slate-500">
 Lifecycle Architecture
 </span>
 <h2 className="text-sm font-semibold text-slate-900">
 End-to-End Project Workflow
 </h2>

 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-2">
 {workflowStages.map((wf, idx) => (
 <div
 key={idx}
 className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col items-center justify-center text-center shadow-sm"
 >
 <span className="text-xs text-slate-400 font-medium mb-1">0{idx + 1}</span>
 <span className="text-sm font-semibold text-slate-900">{wf.stage}</span>
 <span className="text-xs text-slate-500 mt-0.5">{wf.label}</span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* 5. Research Credibility: Build with Evidence, Not Assumptions */}
 <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto bg-white w-full">
 <div className="space-y-6">
 <div className="max-w-2xl space-y-2">
 <span className="text-xs font-medium text-indigo-600">
 Evidence-Backed Rigor
 </span>
 <h2 className="text-sm font-semibold text-slate-900">
 Build with evidence, not assumptions
 </h2>
 <p className="text-sm text-slate-600 leading-relaxed">
 Every insight, recommendation, and thesis draft is grounded in traceable academic literature, verified open-source implementations, and real testbed datasets.
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {evidenceSources.map((src, i) => {
 const Icon = src.icon;
 return (
 <div
 key={i}
 className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
 >
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700">
 <Icon className="h-4 w-4" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-slate-900">{src.name}</h4>
 <p className="text-xs text-slate-500">{src.type}</p>
 </div>
 </div>
 <span className="text-xs text-slate-500 font-medium">
 {src.count}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* 6. AI Mentor Section */}
 <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto bg-slate-50 w-full">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
 <div className="space-y-4">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
 <Brain className="h-3.5 w-3.5 text-indigo-600" />
 <span>Project-Aware Guidance</span>
 </div>
 <h2 className="text-sm font-semibold text-slate-900">
 An AI Mentor grounded in your active codebase and citations
 </h2>
 <p className="text-sm text-slate-600 leading-relaxed">
 Unlike generic chatbots, the InnoSphere AI Mentor retrieves the specific context of your active project: your problem statement, logged experiments, selected hardware components, and saved literature papers.
 </p>
 <ul className="space-y-2 text-sm text-slate-700">
 <li className="flex items-center gap-2">
 <Check className="h-4 w-4 text-emerald-500 shrink-0" />
 <span>Identifies literature and patent gaps to substantiate novelty claims</span>
 </li>
 <li className="flex items-center gap-2">
 <Check className="h-4 w-4 text-emerald-500 shrink-0" />
 <span>Recommends relevant ML frameworks, loss functions, and sensor models</span>
 </li>
 <li className="flex items-center gap-2">
 <Check className="h-4 w-4 text-emerald-500 shrink-0" />
 <span>Assists with 10-phase execution roadmaps and competition defense rubrics</span>
 </li>
 </ul>
 </div>

 {/* AI Mentor UI Sample Preview */}
 <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-xs">
 <Brain className="h-4 w-4 text-indigo-600" />
 </div>
 <span className="font-semibold text-slate-900 text-sm">AI Mentor &bull; Project Advisor</span>
 </div>
 <span className="text-xs text-emerald-600 font-medium">Context: ESP32 Water Kiosk Node</span>
 </div>

 <div className="space-y-3">
 <div className="p-3 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100">
 <p className="text-sm font-medium">Student:"How can I reduce inference latency on the ESP32 while classifying turbidity anomalies?"</p>
 </div>

 <div className="p-4 rounded-lg bg-slate-50 text-slate-800 border border-slate-200 leading-relaxed text-sm">
 <p className="font-semibold text-slate-900 mb-2">Recommendation:</p>
 <p>
 1. Quantize your 1D-CNN weights from FP32 to INT8 using TensorFlow Lite Micro. In published benchmarks (arXiv:2403.11892), this reduces flash footprint by <strong>74%</strong> with only <strong>0.3%</strong> loss in F1-score.
 </p>
 <p className="mt-2">
 2. Use a fixed circular buffer in SRAM rather than dynamic heap allocations to avoid memory fragmentation during 24/7 continuous telemetry streaming.
 </p>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* 7. Platform Dynamic Stats */}
 <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto bg-white w-full">
 <div>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
 {stats.map((stat, i) => (
 <div key={i} className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
 <span className="text-xl font-semibold text-slate-900 block">
 {stat.value}
 </span>
 <span className="text-sm font-medium text-slate-700 block">{stat.label}</span>
 <span className="text-xs text-slate-500 block">{stat.sub}</span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* 8. Bottom Call to Action */}
 <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto text-center bg-slate-50 w-full">
 <div className="max-w-3xl mx-auto space-y-5">
 <h2 className="text-xl font-semibold text-slate-900">
 Ready to develop your next student innovation project?
 </h2>
 <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
 Join student innovators and faculty mentors building verified, reproducible research solutions on InnoSphere AI.
 </p>
 <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
 <Link
 href="/submit-idea"
 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
 >
 <Lightbulb className="h-4 w-4" />
 <span>Submit Innovation Idea</span>
 </Link>
 <button
 onClick={() => setDemoModalOpen(true)}
 className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer shadow-sm"
 >
 Explore Guided Tour
 </button>
 <Link
 href="/dashboard"
 className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
 >
 Enter Dashboard &rarr;
 </Link>
 </div>
 </div>
 </section>

 {/* Guided Tour Modal */}
 <GuidedDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
 </div>
 );
}
