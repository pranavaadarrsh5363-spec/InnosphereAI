'use client';

import React, { useEffect, useState } from'react';
import Link from'next/link';
import {
 GraduationCap,
 Layers,
 Award,
 Search,
 ExternalLink,
 X,
} from'lucide-react';
import { api } from'@/lib/api';
import { getDomainColor } from'@/lib/utils';
import { useAuth } from'@/lib/auth-context';
import { SkeletonList } from'@/components/ui/skeleton';
import { EmptyState } from'@/components/ui/empty-state';

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
 domain: selectedDomain !=='all' ? selectedDomain : undefined,
 status: selectedStatus !=='all' ? selectedStatus : undefined,
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
 strengths: ['Clear social impact','Robust technology stack selection','Actionable 10-phase roadmap'],
 areas_for_improvement: ['Perform ablation study on model layers','Profile edge memory footprint'],
 recommended_technologies: selectedProject.technologies || [],
 status:'Reviewed',
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
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 {/* Toast */}
 {successToast && (
 <div className="fixed top-20 right-8 z-50 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-md shadow-sm">
 {successToast}
 </div>
 )}

 {/* Header Banner */}
 <div className="rounded-lg bg-slate-50 border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
 <div className="space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700">
 <GraduationCap className="h-4 w-4 text-indigo-600" />
 <span>Faculty Mentor & Evaluator Cockpit</span>
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Student Innovation Evaluation Portal
 </h1>
 <p className="text-sm text-slate-600 max-w-2xl">
 Review student project roadmaps, evaluate technology architecture choices, leave rubric feedback, and guide student innovators toward practical deployment.
 </p>
 </div>

 {/* Persona quick switch notice */}
 {user?.role !=='mentor' && (
 <button
 onClick={() => demoLogin('mentor')}
 className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors flex items-center gap-1.5"
 >
 <GraduationCap className="h-4 w-4" />
 <span>Switch to Mentor Persona</span>
 </button>
 )}
 </div>

 {/* Search & Filters */}
 <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="w-full sm:w-80 relative">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Search by project, student, or college..."
 className="w-full bg-slate-50 border border-slate-200 rounded-md pl-10 pr-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>

 <div className="flex flex-wrap items-center gap-3 text-sm w-full sm:w-auto">
 <div className="flex items-center gap-1.5">
 <span className="text-slate-500 font-medium">Domain:</span>
 <select
 value={selectedDomain}
 onChange={(e) => setSelectedDomain(e.target.value)}
 className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 >
 {domains.map((d) => (
 <option key={d} value={d}>
 {d ==='all' ?'All Domains' : d}
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-1.5">
 <span className="text-slate-500 font-medium">Status:</span>
 <select
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value)}
 className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 capitalize"
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
 actionLabel={selectedDomain !=='all' || selectedStatus !=='all' || searchTerm ?"Reset Filters" : undefined}
 onAction={() => {
 setSelectedDomain('all');
 setSelectedStatus('all');
 setSearchTerm('');
 }}
 />
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filtered.map((p) => {
 const domainColor = getDomainColor(p.domain);
 return (
 <div
 key={p.id}
 className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4"
 >
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className={`px-2 py-0.5 rounded text-xs font-medium border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
 {p.domain}
 </span>
 <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium capitalize border border-slate-200">
 {p.status}
 </span>
 </div>

 <h3 className="text-sm font-semibold text-slate-900 leading-snug">
 {p.title}
 </h3>

 <div className="text-sm text-slate-600 space-y-1">
 <p>
 <strong className="text-slate-700 font-semibold">Student:</strong> {p.student_name}
 </p>
 <p className="truncate">
 <strong className="text-slate-700 font-semibold">Institution:</strong> {p.institution}
 </p>
 </div>

 {/* Tech stack */}
 {p.technologies && p.technologies.length > 0 && (
 <div className="flex flex-wrap gap-1 pt-1">
 {p.technologies.slice(0, 4).map((t: string, i: number) => (
 <span
 key={i}
 className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700"
 >
 {t}
 </span>
 ))}
 </div>
 )}
 </div>

 {/* Footer Controls */}
 <div className="pt-3 border-t border-slate-100 space-y-3">
 <div className="flex items-center justify-between text-xs">
 <span className="text-slate-500 font-medium">Roadmap Progress</span>
 <span className="font-semibold text-emerald-600">{p.progress}%</span>
 </div>
 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-emerald-500 rounded-full" style={{ width:`${p.progress}%` }} />
 </div>

 <div className="flex items-center justify-between pt-1">
 <Link
 href={`/projects/${p.id}`}
 className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-medium"
 >
 <span>Workspace</span>
 <ExternalLink className="h-3 w-3" />
 </Link>

 <button
 onClick={() => handleOpenReview(p)}
 className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium shadow-sm flex items-center gap-1"
 >
 <Award className="h-4 w-4" />
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
 <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm max-w-xl w-full space-y-5">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Award className="h-4 w-4 text-indigo-600" />
 Faculty Mentorship Review
 </h3>
 <p className="text-xs text-slate-500 mt-0.5">{selectedProject.title}</p>
 </div>
 <button
 onClick={() => setReviewModalOpen(false)}
 className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSubmitReview} className="space-y-4 text-sm">
 <div>
 <label className="text-slate-700 font-semibold block mb-1">Rubric Rating (1 to 5 Stars)</label>
 <div className="flex items-center gap-2">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={star}
 type="button"
 onClick={() => setRating(star)}
 className={`h-8 w-8 rounded-md flex items-center justify-center text-sm font-bold border transition-colors ${
 rating >= star
 ?'bg-indigo-50 text-indigo-600 border-indigo-200'
 :'bg-slate-50 text-slate-400 border-slate-200'
 }`}
 >
 ★
 </button>
 ))}
 <span className="text-sm font-semibold text-indigo-600 ml-2">{rating} / 5 Stars</span>
 </div>
 </div>

 <div>
 <label className="text-slate-700 font-semibold block mb-1">Qualitative Feedback & Guidance *</label>
 <textarea
 rows={4}
 required
 value={feedbackText}
 onChange={(e) => setFeedbackText(e.target.value)}
 placeholder="Provide constructive guidance on architectural choices, experimental validation, or patent potential..."
 className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>

 <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800">
 💡 Submitting this evaluation stores official faculty feedback on the student's project dashboard.
 </div>

 <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
 <button
 type="button"
 onClick={() => setReviewModalOpen(false)}
 className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm shadow-sm"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submittingReview}
 className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors"
 >
 {submittingReview ?'Submitting...' :'Submit Official Review'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
