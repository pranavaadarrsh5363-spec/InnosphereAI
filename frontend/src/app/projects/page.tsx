'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  PlusCircle,
  Search,
  ArrowRight,
  Trash2,
  X,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { getDomainColor } from '@/lib/utils';
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
      {/* Header Banner - Clean Professional Light Mode Design */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 border border-blue-100 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-[11px] font-semibold text-blue-800">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>Multi-Project Portfolio Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Innovation Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Manage your innovation initiatives across domains, monitor 10-phase milestone velocity, and coordinate AI analysis for each project.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Search & Filters - Light Mode Input and Dropdowns */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by title or keywords..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Domain:</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
            >
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d === 'all' ? 'All Domains' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Lifecycle Stage:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 capitalize shadow-2xs"
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

      {/* Projects Grid - Light Cards, Tags, and Badges */}
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
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
                      {p.domain}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200 capitalize">
                      Stage: {p.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {p.problem_statement}
                  </p>

                  {/* Tech Badges in Light Mode */}
                  {p.technologies && p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.technologies.slice(0, 4).map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10.5px] text-slate-700 font-medium font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress and Actions */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Roadmap Velocity</span>
                      <span className="font-bold text-blue-700">{p.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/roadmap/${p.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Roadmap
                      </Link>
                      <Link
                        href={`/projects/${p.id}`}
                        onClick={() => setActiveProjectId(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
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

      {/* Create Project Modal - Light Mode */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl max-w-xl w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-blue-600" />
                <span>Create New Innovation Project</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g., IoT Solar Irrigation & Moisture Telemetry"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Domain *
                  </label>
                  <select
                    value={newProject.domain}
                    onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {domains.filter((d) => d !== 'all').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 capitalize"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Problem Statement
                </label>
                <textarea
                  rows={2}
                  value={newProject.problem_statement}
                  onChange={(e) => setNewProject({ ...newProject, problem_statement: e.target.value })}
                  placeholder="What core scientific or practical problem are you trying to solve?"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Solution
                </label>
                <textarea
                  rows={2}
                  value={newProject.proposed_solution}
                  onChange={(e) => setNewProject({ ...newProject, proposed_solution: e.target.value })}
                  placeholder="Describe your technical methodology, hardware, or algorithmic approach."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technologies (comma-separated)
                </label>
                <input
                  type="text"
                  value={newProject.technologies}
                  onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                  placeholder="Python, ESP32, PyTorch, LoRaWAN, Next.js"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
