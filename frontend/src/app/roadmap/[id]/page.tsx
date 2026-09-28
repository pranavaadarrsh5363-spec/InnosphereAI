'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  CheckCircle2,
  Circle,
  PlusCircle,
  Calendar,
  FileText,
  Trash2,
  Edit3,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  Award,
  ArrowRight,
  Download,
  Cpu,
  Radio,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { ProjectRoadmap, RoadmapPhase, RoadmapTask } from '@/types';
import { SkeletonCard } from '@/components/ui/skeleton';

export default function RoadmapPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const { activeProject, refreshProjects } = useProject();

  const [roadmap, setRoadmap] = useState<ProjectRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newTaskPhase, setNewTaskPhase] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [editingTask, setEditingTask] = useState<RoadmapTask | null>(null);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const data = await api.getRoadmap(projectId);
      setRoadmap(data);
    } catch (err) {
      console.error('Error fetching roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchRoadmap();
    }
  }, [projectId]);

  const togglePhase = (phaseNum: number) => {
    if (expandedPhases.includes(phaseNum)) {
      setExpandedPhases(expandedPhases.filter((p) => p !== phaseNum));
    } else {
      setExpandedPhases([...expandedPhases, phaseNum]);
    }
  };

  const handleToggleTask = async (task: RoadmapTask) => {
    try {
      const res = await api.updateRoadmapTask(task.id, {
        is_completed: !task.is_completed,
      });

      // Update local state
      if (roadmap) {
        const updatedPhases = roadmap.phases.map((phase) => ({
          ...phase,
          tasks: phase.tasks.map((t) => (t.id === task.id ? { ...t, is_completed: !t.is_completed } : t)),
        }));

        const totalTasks = roadmap.total_tasks;
        const completedCount = updatedPhases.reduce(
          (acc, p) => acc + p.tasks.filter((t) => t.is_completed).length,
          0
        );
        const newPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

        setRoadmap({
          ...roadmap,
          completion_percentage: newPct,
          completed_tasks: completedCount,
          phases: updatedPhases,
        });

        // Trigger celebratory confetti when reaching 100% completion!
        if (newPct === 100 && !task.is_completed) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
      }
      refreshProjects();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleAddTask = async (phase: RoadmapPhase) => {
    if (!newTaskTitle.trim()) return;
    try {
      await api.addRoadmapTask(projectId, {
        phase_number: phase.phase_number,
        phase_name: phase.phase_name,
        title: newTaskTitle,
        deadline: newTaskDeadline || '2026-10-30',
        priority: 'Medium',
      });
      setNewTaskPhase(null);
      setNewTaskTitle('');
      setNewTaskDeadline('');
      fetchRoadmap();
      refreshProjects();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.deleteRoadmapTask(taskId);
      fetchRoadmap();
      refreshProjects();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleSaveEditTask = async () => {
    if (!editingTask) return;
    try {
      await api.updateRoadmapTask(editingTask.id, {
        title: editingTask.title,
        notes: editingTask.notes,
        deadline: editingTask.deadline,
        priority: editingTask.priority,
      });
      setEditingTask(null);
      fetchRoadmap();
    } catch (err) {
      console.error('Error saving edited task:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 space-y-4 animate-pulse shadow-xs">
          <div className="h-6 w-48 bg-slate-200 rounded-full" />
          <div className="h-9 w-2/3 bg-slate-200 rounded-xl" />
          <div className="h-4 w-1/2 bg-slate-200 rounded" />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const completionPct = roadmap?.completion_percentage || 0;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 border border-indigo-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-700">
              <MapPin className="h-3 w-3 text-indigo-600" />
              <span>Full Lifecycle Innovation Plan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              10-Phase Project Roadmap
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Step-by-step milestones to convert your idea for <span className="text-slate-900 font-semibold">{roadmap?.project_title || 'your project'}</span> into a working, validated solution.
            </p>
          </div>

          <div className="w-full md:w-64 shrink-0 bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Overall Progress</span>
              <span className="font-bold text-indigo-600">{completionPct}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 text-right">
              {roadmap?.completed_tasks} of {roadmap?.total_tasks} tasks completed
            </p>
          </div>
        </div>
      </div>

      {/* 10 Phases Accordion Checklist */}
      <div className="space-y-4">
        {roadmap?.phases?.map((phase) => {
          const isExpanded = expandedPhases.includes(phase.phase_number);
          const completedTasksInPhase = phase.tasks.filter((t) => t.is_completed).length;
          const isPhaseComplete = phase.tasks.length > 0 && completedTasksInPhase === phase.tasks.length;

          return (
            <div
              key={phase.phase_number}
              className={`bg-white rounded-2xl border transition-all shadow-xs ${
                isPhaseComplete ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/80'
              }`}
            >
              {/* Phase Header */}
              <div
                onClick={() => togglePhase(phase.phase_number)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      isPhaseComplete
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    }`}
                  >
                    {isPhaseComplete ? <CheckCircle2 className="h-4 w-4" /> : phase.phase_number}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {phase.phase_name}
                      {isPhaseComplete && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          Completed
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{phase.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    {completedTasksInPhase} / {phase.tasks.length}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </div>

              {/* Tasks List */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-200 animate-in fade-in">
                  {/* Phase-specific Hardware Lab Link */}
                  {[4, 7, 8].includes(phase.phase_number) && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-50/60 via-white to-indigo-50/60 border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-2 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-200 shrink-0 mt-0.5">
                          <Cpu className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {phase.phase_number === 4 && 'Multi-Sensor Data Stream & Telemetry Bench'}
                              {phase.phase_number === 7 && 'Virtual Microcontroller & Hardware Prototype'}
                              {phase.phase_number === 8 && 'Stress Testing & Anomaly Injection Validation'}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 font-bold border border-cyan-200">
                              LAB EVIDENCE
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {phase.phase_number === 4 && 'Stream calibrated virtual sensor payloads, test sampling frequencies, and verify normal telemetry ranges.'}
                            {phase.phase_number === 7 && 'Configure virtual ESP32/LoRa devices, adjust battery/signal thresholds, and monitor packet loss.'}
                            {phase.phase_number === 8 && 'Inject sensor spikes, signal dropouts, and evaluate real-time AI threshold alerts.'}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/hardware-lab"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold whitespace-nowrap transition-colors self-start sm:self-center shrink-0 shadow-2xs"
                      >
                        <Radio className="h-3.5 w-3.5 animate-pulse" />
                        <span>Open Hardware Lab</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                        task.is_completed
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : 'bg-white border-slate-200/80 text-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          className="shrink-0 mt-0.5 cursor-pointer"
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 hover:text-emerald-700" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <p className={`text-xs font-medium ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-[11px] text-slate-500 italic">Note: {task.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {task.deadline && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                            <Calendar className="h-3 w-3" />
                            {task.deadline}
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            task.priority === 'High'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Edit task"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Task inside Phase */}
                  {newTaskPhase === phase.phase_number ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-indigo-200 space-y-3 shadow-2xs">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Milestone task title..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="date"
                          value={newTaskDeadline}
                          onChange={(e) => setNewTaskDeadline(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNewTaskPhase(null)}
                            className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddTask(phase)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                          >
                            Add Task
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNewTaskPhase(phase.phase_number)}
                      className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 text-xs text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-50/50"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Add Custom Milestone to {phase.phase_name.split('–')[0]}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-indigo-600" />
              Edit Milestone Task
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Notes / Findings</label>
                <textarea
                  rows={3}
                  value={editingTask.notes || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                  placeholder="Add observations, links, or validation benchmarks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Deadline</label>
                  <input
                    type="date"
                    value={editingTask.deadline || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingTask(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditTask}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
