'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  Layers,
  Award,
  Star,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  BarChart3,
  Loader2,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getDomainColor } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function MentorDashboardPage() {
  const { user, demoLogin } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const domains = [
    'all',
    'Healthcare',
    'Agriculture',
    'Environment',
    'Smart Cities',
    'Education',
    'Artificial Intelligence',
    'Robotics',
  ];

  const fetchMentorProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getMentorProjects({
        domain: selectedDomain !== 'all' ? selectedDomain : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading mentor projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorProjects();
  }, [selectedDomain, selectedStatus]);

  const handleOpenReview = (p: any) => {
    setSelectedProject(p);
    setFeedbackText(
      `Strong project execution and clear domain relevance. The approach shows commendable technical rigor. Focus on validating edge inference benchmarks during Phase 7.`
    );
    setRating(5);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !feedbackText.trim()) return;

    setSubmittingReview(true);
    try {
      await api.submitMentorReview({
        project_id: selectedProject.id,
        feedback: feedbackText,
        rating: rating,
        strengths: ['Clear social impact', 'Robust technology stack selection', 'Actionable 10-phase roadmap'],
        areas_for_improvement: ['Perform ablation study on model layers', 'Profile edge memory footprint'],
        recommended_technologies: selectedProject.technologies || [],
        status: 'Reviewed',
      });
      setReviewModalOpen(false);
      setSuccessToast(`Review submitted successfully for ${selectedProject.title}!`);
      setTimeout(() => setSuccessToast(null), 3500);
      fetchMentorProjects();
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const filtered = projects.filter((p) => {
    if (!searchTerm) return true;
    return (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.institution?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-2xl animate-in fade-in">
          {successToast}
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-[11px] font-semibold text-purple-300">
            <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
            <span>Faculty Mentor & Evaluator Cockpit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Student Innovation Evaluation Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Review student project roadmaps, evaluate technology architecture choices, leave rubric feedback, and guide student innovators toward practical deployment.
          </p>
        </div>

        {/* Persona quick switch notice */}
        {user?.role !== 'mentor' && (
          <button
            onClick={() => demoLogin('mentor')}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Switch to Mentor Persona</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by project, student, or college..."
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
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
            >
              <option value="all">All Stages</option>
              <option value="idea">Idea</option>
              <option value="research">Research</option>
              <option value="planning">Planning</option>
              <option value="prototype">Prototype</option>
              <option value="development">Development</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table & Review Cards */}
      {loading ? (
        <SkeletonList count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Student Projects Found"
          description="There are currently no student innovation projects matching your active domain or status filters."
          actionLabel={selectedDomain !== 'all' || selectedStatus !== 'all' || searchTerm ? "Reset Filters" : undefined}
          onAction={() => {
            setSelectedDomain('all');
            setSelectedStatus('all');
            setSearchTerm('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => {
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
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium capitalize">
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                    {p.title}
                  </h3>

                  <div className="text-xs text-slate-400 space-y-1">
                    <p>
                      <strong className="text-slate-300">Student:</strong> {p.student_name}
                    </p>
                    <p className="truncate">
                      <strong className="text-slate-300">Institution:</strong> {p.institution}
                    </p>
                  </div>

                  {/* Tech stack */}
                  {p.technologies && p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.technologies.slice(0, 4).map((t: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-indigo-300 font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Roadmap Progress</span>
                    <span className="font-bold text-emerald-400">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${p.progress}%` }} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Workspace</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>

                    <button
                      onClick={() => handleOpenReview(p)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1"
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>Review & Grade</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700 max-w-xl w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  Faculty Mentorship Review
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedProject.title}</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rubric Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${
                        rating >= star
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">{rating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Qualitative Feedback & Guidance *</label>
                <textarea
                  rows={4}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Provide constructive guidance on architectural choices, experimental validation, or patent potential..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-300">
                💡 Submitting this evaluation stores official faculty feedback on the student's project dashboard.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Official Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
