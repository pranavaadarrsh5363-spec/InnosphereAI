'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  PlusCircle,
  Sparkles,
  MapPin,
  Bookmark,
  Calendar,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Cpu,
  Loader2,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { getDomainColor } from '@/lib/utils';
import { Project } from '@/types';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function ProjectsManagementPage() {
  const { projects, refreshProjects, setActiveProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newProject, setNewProject] = useState({
    title: '',
    domain: 'Healthcare',
    problem_statement: '',
    proposed_solution: '',
    technologies: 'Python, FastAPI, React',
    status: 'idea',
  });

  const domains = [
    'all',
    'Healthcare',
    'Agriculture',
    'Artificial Intelligence',
    'Environment & Sustainability',
    'Smart Cities & Urban Mobility',
    'Education & Skill Recommendation',
    'Cybersecurity & Privacy',
    'Robotics & Automation',
    'Internet of Things (IoT)',
    'FinTech & Blockchain',
  ];

  const statuses = ['all', 'idea', 'research', 'planning', 'prototype', 'development', 'testing', 'completed'];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.problem_statement.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain === 'all' || p.domain.toLowerCase().includes(selectedDomain.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || p.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesDomain && matchesStatus;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    try {
      await api.createProject({
        title: newProject.title,
        domain: newProject.domain,
        problem_statement: newProject.problem_statement,
        proposed_solution: newProject.proposed_solution,
        technologies: newProject.technologies.split(',').map((s) => s.trim()).filter(Boolean),
        status: newProject.status,
        progress: 15,
        tags: [newProject.domain],
      });
      setShowCreateModal(false);
      setNewProject({
        title: '',
        domain: 'Healthcare',
        problem_statement: '',
        proposed_solution: '',
        technologies: 'Python, FastAPI, React',
        status: 'idea',
      });
      await refreshProjects();
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (confirm('Are you sure you want to delete this innovation project?')) {
      try {
        await api.deleteProject(projectId);
        await refreshProjects();
      } catch (err) {
        console.error('Error deleting project:', err);
      }
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300">
            <Layers className="h-3 w-3 text-indigo-400" />
            <span>Multi-Project Portfolio Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Innovation Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Manage your innovation initiatives across domains, monitor 10-phase milestone velocity, and coordinate AI analysis for each project.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by title or keywords..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Domain:</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d === 'all' ? 'All Domains' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Lifecycle Stage:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Stages' : s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Innovation Projects Found"
          description={
            projects.length === 0
              ? "You haven't initiated any student innovation projects yet. Start by creating a project or submitting an idea."
              : "No projects match your current search query and filter criteria."
          }
          actionLabel={projects.length === 0 ? "Submit New Idea" : "Reset Filters"}
          actionHref={projects.length === 0 ? "/submit-idea" : undefined}
          onAction={
            projects.length > 0
              ? () => {
                  setSearchTerm('');
                  setSelectedDomain('all');
                  setSelectedStatus('all');
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const domainColor = getDomainColor(p.domain);
            return (
              <div
                key={p.id}
                className="glass-panel glass-panel-hover rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
                      {p.domain}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700 capitalize">
                      Stage: {p.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {p.problem_statement}
                  </p>

                  {/* Tech Badges */}
                  {p.technologies && p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.technologies.slice(0, 4).map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-indigo-300 font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress and Actions */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Roadmap Velocity</span>
                      <span className="font-bold text-indigo-400">{p.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/roadmap/${p.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        Roadmap
                      </Link>
                      <Link
                        href={`/projects/${p.id}`}
                        onClick={() => setActiveProjectId(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700 max-w-xl w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-indigo-400" />
                Create Innovation Project
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g. AI-Powered Autonomous Crop Monitoring"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Domain</label>
                  <select
                    value={newProject.domain}
                    onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {domains.filter((d) => d !== 'all').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Project Stage</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white capitalize"
                  >
                    {statuses.filter((s) => s !== 'all').map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Problem Statement *</label>
                <textarea
                  rows={3}
                  required
                  value={newProject.problem_statement}
                  onChange={(e) => setNewProject({ ...newProject, problem_statement: e.target.value })}
                  placeholder="Explain the real-world challenge you are addressing..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Proposed Solution *</label>
                <textarea
                  rows={3}
                  required
                  value={newProject.proposed_solution}
                  onChange={(e) => setNewProject({ ...newProject, proposed_solution: e.target.value })}
                  placeholder="Describe your technical methodology and planned prototype..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Technologies (comma-separated)</label>
                <input
                  type="text"
                  value={newProject.technologies}
                  onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                  placeholder="FastAPI, PyTorch, React, PostgreSQL"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Create Project & Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
