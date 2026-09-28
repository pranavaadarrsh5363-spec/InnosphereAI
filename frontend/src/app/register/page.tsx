'use client';

import React, { useState } from'react';
import Link from'next/link';
import { useRouter } from'next/navigation';
import { Lock, Mail, User, School, BookOpen, Layers, Loader2 } from'lucide-react';
import { useAuth } from'@/lib/auth-context';

export default function RegisterPage() {
 const router = useRouter();
 const { register } = useAuth();
 const [formData, setFormData] = useState({
 email:'',
 password:'',
 full_name:'',
 institution:'National Institute of Technology',
 course:'B.Tech Computer Science',
 department:'School of Computing & AI',
 skills:'Python, React, PyTorch',
 interests:'Applied AI, HealthTech, Edge IoT',
 });
 const [loading, setLoading] = useState(false);
 const [errorMsg, setErrorMsg] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setErrorMsg(null);
 try {
 await register({
 ...formData,
 skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
 interests: formData.interests.split(',').map((s) => s.trim()).filter(Boolean),
 role:'student',
 });
 router.push('/dashboard');
 } catch (err: any) {
 setErrorMsg(err.message ||'Registration failed. Please try again.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 <div className="max-w-lg mx-auto space-y-6">
 <div className="text-center space-y-2">
 <h1 className="text-xl font-semibold text-slate-900">Create Innovator Account</h1>
 <p className="text-sm text-slate-600">Join InnoSphere to discover resources and build real-world AI solutions</p>
 </div>

 {errorMsg && (
 <div className="p-4 rounded-md bg-red-50 border border-slate-200 text-red-600 text-sm font-medium">
 {errorMsg}
 </div>
 )}

 <form onSubmit={handleSubmit} className="bg-white rounded-lg p-5 border border-slate-200 space-y-4 shadow-sm text-sm text-slate-600">
 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <User className="h-4 w-4 text-slate-400" />
 Full Name *
 </label>
 <input
 type="text"
 required
 value={formData.full_name}
 onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
 placeholder="Aarav Sharma"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Mail className="h-4 w-4 text-slate-400" />
 Email Address *
 </label>
 <input
 type="email"
 required
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder="innovator@student.edu"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <Lock className="h-4 w-4 text-slate-400" />
 Password *
 </label>
 <input
 type="password"
 required
 value={formData.password}
 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
 placeholder="••••••••"
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <School className="h-4 w-4 text-slate-400" />
 Institution
 </label>
 <input
 type="text"
 value={formData.institution}
 onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <BookOpen className="h-4 w-4 text-slate-400" />
 Course / Degree
 </label>
 <input
 type="text"
 value={formData.course}
 onChange={(e) => setFormData({ ...formData, course: e.target.value })}
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 block">Skills (comma-separated)</label>
 <input
 type="text"
 value={formData.skills}
 onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-slate-900 block">Interests & Innovation Domains</label>
 <input
 type="text"
 value={formData.interests}
 onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
 className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
 />
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full px-3 py-1.5 mt-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
 >
 {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
 <span>Create Account</span>
 </button>
 </form>

 <div className="text-center text-sm text-slate-600">
 Already have an account?{''}
 <Link href="/login" className="text-indigo-600 font-medium hover:underline">
 Sign In
 </Link>
 </div>
 </div>
 </div>
 );
}
