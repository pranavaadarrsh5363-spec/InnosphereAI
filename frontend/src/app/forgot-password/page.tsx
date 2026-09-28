'use client';

import React, { useState } from'react';
import Link from'next/link';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from'lucide-react';
import { useAuth } from'@/lib/auth-context';

export default function ForgotPasswordPage() {
 const { forgotPassword } = useAuth();
 const [email, setEmail] = useState('');
 const [loading, setLoading] = useState(false);
 const [submitted, setSubmitted] = useState(false);
 const [errorMsg, setErrorMsg] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
 setErrorMsg('Please enter a valid email address.');
 return;
 }

 setLoading(true);
 setErrorMsg(null);
 try {
 await forgotPassword(email.trim());
 setSubmitted(true);
 } catch (err: any) {
 setSubmitted(true);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
 <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-6">
 <div className="text-center space-y-2">
 <div className="h-10 w-10 rounded-md bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-4">
 <KeyRound className="w-5 h-5" />
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Reset Password
 </h1>
 <p className="text-sm text-slate-600">
 Enter your registered academic email address to receive password recovery instructions.
 </p>
 </div>

 {submitted ? (
 <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-sm space-y-3">
 <div className="flex items-center gap-2 font-semibold">
 <CheckCircle2 className="w-4 h-4 text-emerald-600" />
 <span>Reset Instructions Sent</span>
 </div>
 <p>
 If an account associated with <strong>{email}</strong> exists in InnoSphere AI, we have dispatched instructions to reset your credentials.
 </p>
 <Link
 href="/login"
 className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:underline pt-1"
 >
 <ArrowLeft className="w-4 h-4" /> Return to Sign In
 </Link>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4" noValidate>
 {errorMsg && (
 <div className="p-3 rounded-md bg-red-50 border border-slate-200 text-red-600 text-sm flex items-center gap-2">
 <AlertCircle className="w-4 h-4" />
 <span>{errorMsg}</span>
 </div>
 )}

 <div className="space-y-1.5">
 <label htmlFor="recovery-email" className="text-sm font-semibold text-slate-900">
 Email Address
 </label>
 <div className="relative">
 <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 id="recovery-email"
 type="email"
 required
 value={email}
 onChange={(e) => {
 setEmail(e.target.value);
 if (errorMsg) setErrorMsg(null);
 }}
 placeholder="name@university.edu"
 className="w-full pl-9 pr-3 py-2 rounded-md bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {loading ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>Sending instructions...</span>
 </>
 ) : (
 <span>Send Password Reset Link</span>
 )}
 </button>

 <div className="text-center pt-2">
 <Link
 href="/login"
 className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 font-medium"
 >
 <ArrowLeft className="w-4 h-4" /> Back to Login
 </Link>
 </div>
 </form>
 )}
 </div>
 </div>
 );
}
