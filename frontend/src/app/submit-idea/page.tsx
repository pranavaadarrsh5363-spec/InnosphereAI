'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Lightbulb,
  Cpu,
  Layers,
  Users,
  Target,
  Wrench,
  Rocket,
  CheckCircle2,
  Loader2,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';

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

  const projectStages = ['Concept', 'Research', 'Prototype', 'Advanced'];

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    problem_description: '',
    proposed_solution: '',
    domain: 'Healthcare',
    target_users: '',
    technologies_known: 'Python, React',
    technologies_interested: 'FastAPI, PyTorch, TimescaleDB, WebSockets',
    expected_impact: '',
    available_resources: 'University GPU lab workstation, ESP32 microcontrollers',
    project_stage: 'Concept',
  });

  const handlePreFill = (preset: 'health' | 'agri' | 'waste' | 'traffic' | 'career') => {
    if (preset === 'health') {
      setFormData({
        title: 'AI Wearable Vital Signs & Arrhythmia Telemetry Monitor',
        domain: 'Healthcare',
        problem_description:
          'Rural clinics and elderly cardiac patients suffer from undetected arrhythmias because standard Holter monitors are expensive and lack real-time automated anomaly dispatch.',
        proposed_solution:
          'A lightweight wearable ECG sensor that runs an on-device 1D-CNN, streaming vital telemetry over WebSockets to a cloud FastAPI service which dispatches instant SMS alerts to doctors upon anomaly detection.',
        target_users: 'Elderly cardiac outpatients, rural primary health centers, and attending cardiologists.',
        technologies_known: 'Python, React, basic signal processing',
        technologies_interested: 'PyTorch, FastAPI, WebSockets, TimescaleDB, Docker',
        expected_impact:
          'Reduces time-to-intervention for acute cardiac episodes by 60% and enables continuous monitoring in underserved clinics.',
        available_resources: 'College biology lab test leads, ESP32 development boards, Google Colab Pro',
        project_stage: 'Concept',
      });
    } else if (preset === 'agri') {
      setFormData({
        title: 'Autonomous Multi-Modal Crop Disease Diagnosis & Soil Advisor',
        domain: 'Agriculture',
        problem_description:
          'Smallholder farmers lose over 35% of annual crop yields to fungal blight because manual scouting is slow and agronomists are inaccessible in remote villages.',
        proposed_solution:
          'A mobile vision app utilizing YOLOv8 for on-device leaf disease detection combined with ESP32 soil moisture & pH sensors to calculate hyper-local irrigation & organic treatment schedules.',
        target_users: 'Smallholder farmers, agricultural extension workers, and organic farm cooperatives.',
        technologies_known: 'Python, OpenCV, Flutter',
        technologies_interested: 'YOLOv8, ESP32, LoRaWAN, GeoPandas, FastAPI',
        expected_impact:
          'Decreases crop loss by 25% while reducing chemical pesticide runoff by 35%.',
        available_resources: 'ESP32 sensor modules, smartphone cameras, local farm test plots',
        project_stage: 'Concept',
      });
    } else if (preset === 'waste') {
      setFormData({
        title: 'Edge AI Optical Waste Sorting & Municipal Landfill Diversion System',
        domain: 'Environment & Sustainability',
        problem_description:
          'Municipal recycling plants struggle with manual sorting errors, resulting in 60% of recyclable plastic, glass, and hazardous e-waste being dumped in landfills.',
        proposed_solution:
          'An edge-accelerated optical sorting mechanism using Mask R-CNN on Raspberry Pi 5 + Google Coral TPU, driving pneumatic diverters to sort 45 items/minute into segregated bins.',
        target_users: 'Municipal recycling centers, smart university campuses, and zero-waste initiatives.',
        technologies_known: 'Python, TensorFlow, Raspberry Pi',
        technologies_interested: 'Coral TPU, Mask R-CNN, OpenCV, FastAPI, Next.js',
        expected_impact:
          'Increases sorting purity to 94% and diverts over 70 tons of recyclable waste from landfills annually.',
        available_resources: 'Raspberry Pi 5, conveyor belt prototype, college workshop',
        project_stage: 'Concept',
      });
    } else if (preset === 'traffic') {
      setFormData({
        title: 'Reinforcement Learning Adaptive Traffic Signal Optimization',
        domain: 'Smart Cities & Urban Mobility',
        problem_description:
          'Static timer-based traffic signals cause extreme congestion, fuel wastage, and emergency vehicle delays in dense metropolitan junctions.',
        proposed_solution:
          'A Deep Reinforcement Learning (PPO) signal controller integrated with SUMO simulation that optimizes green-phase timings dynamically using live CCTV vehicle counts.',
        target_users: 'City traffic authorities, urban transit planners, and emergency responders.',
        technologies_known: 'Python, NumPy, PyTorch',
        technologies_interested: 'SUMO Simulator, Stable-Baselines3, Apache Kafka, FastAPI',
        expected_impact:
          'Reduces intersection commute delays by 28% and cuts commuter carbon emissions.',
        available_resources: 'City junction CCTV dataset, simulation server workstation',
        project_stage: 'Concept',
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

      // Redirect directly to the generated AI Analysis Dashboard!
      if (res && res.idea && res.idea.id) {
        router.push(`/analysis/${res.idea.id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg(err.message || 'Failed to submit and analyze idea. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Automated Multi-Vector AI Reasoning</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Submit Your Innovation Idea
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Describe your problem and vision. Our AI engine will analyze requirements, recommend state-of-the-art technologies, identify innovation opportunities, and build an execution roadmap.
        </p>
      </div>

      {/* Preset Quick-Fill Inspiration Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Quick Inspiration / 1-Click Sample Pre-fills:
          </span>
          <span className="text-[11px] text-slate-500">Click any scenario to auto-populate</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handlePreFill('health')}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition-colors"
          >
            🏥 Smart Healthcare Telemetry
          </button>
          <button
            type="button"
            onClick={() => handlePreFill('agri')}
            className="px-3 py-1.5 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/30 text-xs font-semibold text-lime-300 transition-colors"
          >
            🌾 AgriTech Crop Vision
          </button>
          <button
            type="button"
            onClick={() => handlePreFill('waste')}
            className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-xs font-semibold text-teal-300 transition-colors"
          >
            ♻️ Edge AI Waste Sorting
          </button>
          <button
            type="button"
            onClick={() => handlePreFill('traffic')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-colors"
          >
            🚦 RL Traffic Optimization
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-6 shadow-2xl">
        {/* Title & Domain */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-indigo-400" />
              Idea Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. AI-Based Smart Healthcare Monitoring for Rural Clinics"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              Domain <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {domains.map((d, i) => (
                <option key={i} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Problem Description & Proposed Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-red-400" />
              Problem Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.problem_description}
              onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
              placeholder="Explain the real-world problem you are addressing, who suffers from it, and why existing solutions fall short..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Proposed Solution <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.proposed_solution}
              onChange={(e) => setFormData({ ...formData, proposed_solution: e.target.value })}
              placeholder="Describe your proposed architecture, algorithms, user interface, or physical device solution..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>
        </div>

        {/* Target Users & Expected Impact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              Target Users & Beneficiaries
            </label>
            <input
              type="text"
              value={formData.target_users}
              onChange={(e) => setFormData({ ...formData, target_users: e.target.value })}
              placeholder="e.g. Elderly patients, rural doctors, municipal staff, farmers"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5 text-amber-400" />
              Expected Impact & Metrics
            </label>
            <input
              type="text"
              value={formData.expected_impact}
              onChange={(e) => setFormData({ ...formData, expected_impact: e.target.value })}
              placeholder="e.g. 60% faster diagnosis, 30% reduction in water contamination"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Technologies Known & Technologies Interested In */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              Technologies Known (Comma separated)
            </label>
            <input
              type="text"
              value={formData.technologies_known}
              onChange={(e) => setFormData({ ...formData, technologies_known: e.target.value })}
              placeholder="e.g. Python, JavaScript, HTML, React"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-purple-400" />
              Technologies Interested In (Comma separated)
            </label>
            <input
              type="text"
              value={formData.technologies_interested}
              onChange={(e) => setFormData({ ...formData, technologies_interested: e.target.value })}
              placeholder="e.g. FastAPI, PyTorch, YOLOv8, Docker, WebSockets"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Available Resources & Project Stage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-teal-400" />
              Available Resources / Hardware
            </label>
            <input
              type="text"
              value={formData.available_resources}
              onChange={(e) => setFormData({ ...formData, available_resources: e.target.value })}
              placeholder="e.g. College GPU server, ESP32 microcontrollers, Arduino sensors"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5 text-blue-400" />
              Project Stage
            </label>
            <select
              value={formData.project_stage}
              onChange={(e) => setFormData({ ...formData, project_stage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {projectStages.map((st, i) => (
                <option key={i} value={st}>
                  {st} Stage
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Big Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400">
            ⚡ AI will automatically generate deep requirements analysis, technical stacks, and a 10-phase roadmap.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:scale-105 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 glow-purple"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Analyzing Idea with AI Reasoning Engine...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
                <span>Analyze My Idea with AI</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
