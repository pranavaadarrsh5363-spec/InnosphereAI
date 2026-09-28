'use client';

import React, { useState } from'react';
import { useRouter } from'next/navigation';
import {
 Lightbulb,
 Cpu,
 Layers,
 Users,
 Target,
 Wrench,
 Rocket,
 Loader2,
 Zap,
} from'lucide-react';
import { api } from'@/lib/api';
import { useProject } from'@/lib/project-context';

export default function SubmitIdeaPage() {
 const router = useRouter();
 const { refreshProjects } = useProject();
 const [submitting, setSubmitting] = useState(false);
 const [errorMsg, setErrorMsg] = useState<string | null>(null);

 const domains = [
'Healthcare',
'Agriculture',
'Artificial Intelligence',
'Machine Learning',
'Environment & Sustainability',
'Smart Cities & Urban Mobility',
'Education & Skill Recommendation',
'Cybersecurity & Privacy',
'Robotics & Automation',
'Internet of Things (IoT)',
'FinTech & Blockchain',
'Social Innovation',
'Transportation & Logistics',
'Disaster Management',
'Other',
 ];

 const projectStages = ['Concept','Research','Prototype','Advanced'];

 // Form State
 const [formData, setFormData] = useState({
 title:'',
 problem_description:'',
 proposed_solution:'',
 domain:'Healthcare',
 target_users:'',
 technologies_known:'Python, React',
 technologies_interested:'FastAPI, PyTorch, TimescaleDB, WebSockets',
 expected_impact:'',
 available_resources:'University GPU lab workstation, ESP32 microcontrollers',
 project_stage:'Concept',
 });

 const handlePreFill = (preset:'health' |'agri' |'waste' |'traffic' |'career') => {
 if (preset ==='health') {
 setFormData({
 title:'AI Wearable Vital Signs & Arrhythmia Telemetry Monitor',
 domain:'Healthcare',
 problem_description:
'Rural clinics and elderly cardiac patients suffer from undetected arrhythmias because standard Holter monitors are expensive and lack real-time automated anomaly dispatch.',
 proposed_solution:
'A lightweight wearable ECG sensor that runs an on-device 1D-CNN, streaming vital telemetry over WebSockets to a cloud FastAPI service which dispatches instant SMS alerts to doctors upon anomaly detection.',
 target_users:'Elderly cardiac outpatients, rural primary health centers, and attending cardiologists.',
 technologies_known:'Python, React, basic signal processing',
 technologies_interested:'PyTorch, FastAPI, WebSockets, TimescaleDB, Docker',
 expected_impact:
'Reduces time-to-intervention for acute cardiac episodes by 60% and enables continuous monitoring in underserved clinics.',
 available_resources:'College biology lab test leads, ESP32 development boards, Google Colab Pro',
 project_stage:'Concept',
 });
 } else if (preset ==='agri') {
 setFormData({
 title:'Autonomous Multi-Modal Crop Disease Diagnosis & Soil Advisor',
 domain:'Agriculture',
 problem_description:
'Smallholder farmers lose over 35% of annual crop yields to fungal blight because manual scouting is slow and agronomists are inaccessible in remote villages.',
 proposed_solution:
'A mobile vision app utilizing YOLOv8 for on-device leaf disease detection combined with ESP32 soil moisture & pH sensors to calculate hyper-local irrigation & organic treatment schedules.',
 target_users:'Smallholder farmers, agricultural extension workers, and organic farm cooperatives.',
 technologies_known:'Python, OpenCV, Flutter',
 technologies_interested:'YOLOv8, ESP32, LoRaWAN, GeoPandas, FastAPI',
 expected_impact:
'Decreases crop loss by 25% while reducing chemical pesticide runoff by 35%.',
 available_resources:'ESP32 sensor modules, smartphone cameras, local farm test plots',
 project_stage:'Concept',
 });
 } else if (preset ==='waste') {
 setFormData({
 title:'Edge AI Optical Waste Sorting & Municipal Landfill Diversion System',
 domain:'Environment & Sustainability',
 problem_description:
'Municipal recycling plants struggle with manual sorting errors, resulting in 60% of recyclable plastic, glass, and hazardous e-waste being dumped in landfills.',
 proposed_solution:
'An edge-accelerated optical sorting mechanism using Mask R-CNN on Raspberry Pi 5 + Google Coral TPU, driving pneumatic diverters to sort 45 items/minute into segregated bins.',
 target_users:'Municipal recycling centers, smart university campuses, and zero-waste initiatives.',
 technologies_known:'Python, TensorFlow, Raspberry Pi',
 technologies_interested:'Coral TPU, Mask R-CNN, OpenCV, FastAPI, Next.js',
 expected_impact:
'Increases sorting purity to 94% and diverts over 70 tons of recyclable waste from landfills annually.',
 available_resources:'Raspberry Pi 5, conveyor belt prototype, college workshop',
 project_stage:'Concept',
 });
 } else if (preset ==='traffic') {
 setFormData({
 title:'Reinforcement Learning Adaptive Traffic Signal Optimization',
 domain:'Smart Cities & Urban Mobility',
 problem_description:
'Static timer-based traffic signals cause extreme congestion, fuel wastage, and emergency vehicle delays in dense metropolitan junctions.',
 proposed_solution:
'A Deep Reinforcement Learning (PPO) signal controller integrated with SUMO simulation that optimizes green-phase timings dynamically using live CCTV vehicle counts.',
 target_users:'City traffic authorities, urban transit planners, and emergency responders.',
 technologies_known:'Python, NumPy, PyTorch',
 technologies_interested:'SUMO Simulator, Stable-Baselines3, Apache Kafka, FastAPI',
 expected_impact:
'Reduces intersection commute delays by 28% and cuts commuter carbon emissions.',
 available_resources:'City junction CCTV dataset, simulation server workstation',
 project_stage:'Concept',
 });
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!formData.title.trim() || !formData.problem_description.trim() || !formData.proposed_solution.trim()) {
 setErrorMsg('Please fill in the Title, Problem Description, and Proposed Solution.');
 return;
 }

 setSubmitting(true);
 setErrorMsg(null);

 try {
 const payload = {
 title: formData.title,
 problem_description: formData.problem_description,
 proposed_solution: formData.proposed_solution,
 domain: formData.domain,
 target_users: formData.target_users,
 technologies_known: formData.technologies_known.split(',').map((s) => s.trim()).filter(Boolean),
 technologies_interested: formData.technologies_interested.split(',').map((s) => s.trim()).filter(Boolean),
 expected_impact: formData.expected_impact,
 available_resources: formData.available_resources,
 project_stage: formData.project_stage,
 };

 const res = await api.submitIdea(payload);
 await refreshProjects();

 if (res && res.idea && res.idea.id) {
 router.push(`/analysis/${res.idea.id}`);
 } else {
 router.push('/dashboard');
 }
 } catch (err: any) {
 console.error('Submission error:', err);
 setErrorMsg(err.message ||'Failed to submit and analyze idea. Please try again.');
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
 <div className="max-w-3xl space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 <Lightbulb className="h-3.5 w-3.5 text-slate-500" />
 <span>Project Ingestion & AI Synthesis</span>
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Submit Innovation Project
 </h1>
 <p className="text-sm text-slate-600 leading-relaxed">
 Specify the problem domain, technical scope, and expected impact. Our intelligence engine analyzes requirements against literature benchmarks and generates an execution roadmap.
 </p>
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 text-left">
 <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
 <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Zap className="h-4 w-4 text-slate-400" />
 Sample Pre-fills:
 </span>
 <span className="text-xs text-slate-500">Select any template to populate the submission</span>
 </div>
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => handlePreFill('health')}
 className="px-2 py-1 text-xs font-medium rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
 >
 Smart Healthcare Telemetry
 </button>
 <button
 type="button"
 onClick={() => handlePreFill('agri')}
 className="px-2 py-1 text-xs font-medium rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
 >
 AgriTech Crop Vision
 </button>
 <button
 type="button"
 onClick={() => handlePreFill('waste')}
 className="px-2 py-1 text-xs font-medium rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
 >
 Edge AI Waste Sorting
 </button>
 <button
 type="button"
 onClick={() => handlePreFill('traffic')}
 className="px-2 py-1 text-xs font-medium rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
 >
 RL Traffic Optimization
 </button>
 </div>
 </div>

 {errorMsg && (
 <div className="p-4 rounded-md bg-red-50 border border-slate-200 text-red-600 text-sm font-medium">
 {errorMsg}
 </div>
 )}

 <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 <div className="md:col-span-2 space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Lightbulb className="h-4 w-4 text-slate-400" />
 Idea Title <span className="text-red-600">*</span>
 </label>
 <input
 type="text"
 required
 value={formData.title}
 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
 placeholder="e.g. AI-Based Smart Healthcare Monitoring for Rural Clinics"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Layers className="h-4 w-4 text-slate-400" />
 Domain <span className="text-red-600">*</span>
 </label>
 <select
 value={formData.domain}
 onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
 aria-label="Select Domain"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
 >
 {domains.map((d, i) => (
 <option key={i} value={d}>
 {d}
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Target className="h-4 w-4 text-slate-400" />
 Problem Description <span className="text-red-600">*</span>
 </label>
 <textarea
 required
 rows={4}
 value={formData.problem_description}
 onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
 placeholder="Explain the real-world problem you are addressing, who suffers from it, and why existing solutions fall short..."
 className="w-full bg-white border border-slate-200 rounded-md p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors leading-relaxed"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Lightbulb className="h-4 w-4 text-slate-400" />
 Proposed Solution <span className="text-red-600">*</span>
 </label>
 <textarea
 required
 rows={4}
 value={formData.proposed_solution}
 onChange={(e) => setFormData({ ...formData, proposed_solution: e.target.value })}
 placeholder="Describe your proposed architecture, algorithms, user interface, or physical device solution..."
 className="w-full bg-white border border-slate-200 rounded-md p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors leading-relaxed"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Users className="h-4 w-4 text-slate-400" />
 Target Users & Beneficiaries
 </label>
 <input
 type="text"
 value={formData.target_users}
 onChange={(e) => setFormData({ ...formData, target_users: e.target.value })}
 placeholder="e.g. Elderly patients, rural doctors, municipal staff, farmers"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Rocket className="h-4 w-4 text-slate-400" />
 Expected Impact & Metrics
 </label>
 <input
 type="text"
 value={formData.expected_impact}
 onChange={(e) => setFormData({ ...formData, expected_impact: e.target.value })}
 placeholder="e.g. 60% faster diagnosis, 30% reduction in water contamination"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Cpu className="h-4 w-4 text-slate-400" />
 Technologies Known (Comma separated)
 </label>
 <input
 type="text"
 value={formData.technologies_known}
 onChange={(e) => setFormData({ ...formData, technologies_known: e.target.value })}
 placeholder="e.g. Python, JavaScript, HTML, React"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Wrench className="h-4 w-4 text-slate-400" />
 Technologies Interested In (Comma separated)
 </label>
 <input
 type="text"
 value={formData.technologies_interested}
 onChange={(e) => setFormData({ ...formData, technologies_interested: e.target.value })}
 placeholder="e.g. FastAPI, PyTorch, YOLOv8, Docker, WebSockets"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 <div className="md:col-span-2 space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Layers className="h-4 w-4 text-slate-400" />
 Available Resources / Hardware
 </label>
 <input
 type="text"
 value={formData.available_resources}
 onChange={(e) => setFormData({ ...formData, available_resources: e.target.value })}
 placeholder="e.g. College GPU server, ESP32 microcontrollers, Arduino sensors"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Rocket className="h-4 w-4 text-slate-400" />
 Project Stage
 </label>
 <select
 value={formData.project_stage}
 onChange={(e) => setFormData({ ...formData, project_stage: e.target.value })}
 aria-label="Select Project Stage"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
 >
 {projectStages.map((st, i) => (
 <option key={i} value={st}>
 {st} Stage
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
 <p className="text-xs text-slate-500">
 System will analyze requirements, synthesize technical recommendations, and generate a development roadmap.
 </p>

 <button
 type="submit"
 disabled={submitting}
 className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
 >
 {submitting ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin text-white" />
 <span>Synthesizing Project Requirements...</span>
 </>
 ) : (
 <>
 <Lightbulb className="h-4 w-4 text-white" />
 <span>Submit & Generate Architecture</span>
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}
