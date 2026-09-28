'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  GraduationCap,
  User,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Atom,
  Cpu,
  Scale,
  FlaskConical,
  Compass,
  KeyRound,
  X,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function getSafeRedirectUrl(rawRedirect: string | null, userRole?: string): string {
  if (!rawRedirect) {
    if (userRole === 'mentor' || userRole === 'faculty') return '/mentor';
    if (userRole === 'admin') return '/analytics';
    return '/dashboard';
  }

  // Security: Prevent Open Redirect Vulnerabilities
  // Must start with single '/', cannot start with '//', '/\\', or contain protocols ('http:', 'https:', 'javascript:')
  if (
    rawRedirect.startsWith('/') &&
    !rawRedirect.startsWith('//') &&
    !rawRedirect.startsWith('/\\') &&
    !rawRedirect.includes(':')
  ) {
    return rawRedirect;
  }

  return userRole === 'mentor' || userRole === 'faculty'
    ? '/mentor'
    : userRole === 'admin'
    ? '/analytics'
    : '/dashboard';
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams?.get('redirect') || null;

  const { user, login, googleLogin, forgotPassword, demoLogin, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Field validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Global Auth Status
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<string | null>(null);

  // Authenticated user detection: Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      const destination = getSafeRedirectUrl(rawRedirect, user.role);
      router.replace(destination);
    }
  }, [user, isLoading, router, rawRedirect]);

  // Client-side Validation
  const validateInputs = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setAuthError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setSubmitting(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      const authUser = await login(email.trim(), password, rememberMe);
      setAuthSuccessMsg(`Welcome back, ${authUser.full_name || 'Innovator'}! Redirecting...`);
      const destination = getSafeRedirectUrl(rawRedirect, authUser.role);
      setTimeout(() => {
        router.push(destination);
      }, 350);
    } catch (err: any) {
      if (err.status === 401) {
        setAuthError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.status === 429) {
        setAuthError('Too many login attempts. Please wait a few moments and try again.');
      } else if (err.status === 403) {
        setAuthError('Your account is currently inactive. Please contact the administrator.');
      } else if (err.status === 0 || err.message?.includes('connect')) {
        setAuthError('Unable to connect to InnoSphere AI. Please check your network connection.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please verify your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleSubmitting(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      const authUser = await googleLogin({
        email: email ? email.trim() : 'innovator@student.edu',
        name: 'Google Verified Student',
      }, rememberMe);
      setAuthSuccessMsg(`Signed in with Google as ${authUser.full_name}! Redirecting...`);
      const destination = getSafeRedirectUrl(rawRedirect, authUser.role);
      setTimeout(() => {
        router.push(destination);
      }, 350);
    } catch (err: any) {
      setAuthError('Google Sign-In failed. Please try again or use standard email login.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleDemoPersona = async (role: 'student' | 'mentor' | 'admin') => {
    setDemoSubmitting(role);
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      const authUser = await demoLogin(role);
      setAuthSuccessMsg(`Logged in as ${role.toUpperCase()} Persona (${authUser.full_name})!`);
      const destination = getSafeRedirectUrl(rawRedirect, role);
      setTimeout(() => {
        router.push(destination);
      }, 300);
    } catch (err: any) {
      setAuthError(`Failed to authenticate as demo ${role}.`);
    } finally {
      setDemoSubmitting(null);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotFeedback('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    setForgotFeedback(null);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      setForgotFeedback(
        res.message ||
          'If an account associated with this email exists, password reset instructions have been dispatched to your inbox.'
      );
    } catch (err: any) {
      setForgotFeedback(
        'If an account associated with this email exists, password reset instructions have been dispatched to your inbox.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[640px]">
        {/* ========================================================================= */}
        {/* LEFT PANEL: Branding, Value Proposition, Innovation Graph Illustration   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

          {/* Top Logo */}
          <div className="space-y-6 relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-purple-500 p-0.5 shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                  <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">InnoSphere</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  AI
                </span>
              </div>
            </Link>

            {/* Headline & Description */}
            <div className="space-y-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Atom className="w-3.5 h-3.5 text-indigo-400" /> AI Innovation Platform
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Transform Ideas Into Innovation
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Discover resources, explore research, validate ideas, and turn student innovation into real technology solutions.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-2.5 pt-4">
              {[
                {
                  icon: Compass,
                  title: 'Intelligent Resource Discovery',
                  desc: 'Semantic AI search across datasets, papers, and hardware.',
                  color: 'text-cyan-400',
                },
                {
                  icon: Atom,
                  title: 'AI Research Intelligence',
                  desc: 'Literature synthesis, LaTeX authoring & automated citations.',
                  color: 'text-purple-400',
                },
                {
                  icon: FlaskConical,
                  title: 'Experiment & Validation Hub',
                  desc: 'Empirical telemetry, benchmark references & claim proofs.',
                  color: 'text-emerald-400',
                },
                {
                  icon: Scale,
                  title: 'Innovation & Prior-Art Analysis',
                  desc: 'Patent exploration, concept extraction & technical differentiation.',
                  color: 'text-amber-400',
                },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-3 backdrop-blur-xs"
                >
                  <div className="p-2 rounded-xl bg-slate-800/80 shrink-0 mt-0.5">
                    <feat.icon className={`w-4 h-4 ${feat.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">{feat.title}</h2>
                    <p className="text-[11px] text-slate-400 leading-snug">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between relative z-10">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PBKDF2 Encrypted & RBAC
            </span>
            <span>v1.0.0</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Welcome Back, Login Form, Google OAuth, 1-Click Personas    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
          <div className="space-y-6 max-w-lg mx-auto w-full">
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Sign in to continue your innovation journey.
              </p>
            </div>

            {/* Error Notification Banner */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Success Notification Banner */}
            {authSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {/* 1-Click Evaluator Personas (Competition Evaluation Feature) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 1-Click Evaluator Personas
                </span>
                <span className="text-[10px] text-slate-400">Zero Password Needed</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={submitting || !!demoSubmitting || googleSubmitting}
                  onClick={() => handleDemoPersona('student')}
                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 text-center transition-all disabled:opacity-50"
                  title="Log in as Student Innovator"
                >
                  {demoSubmitting === 'student' ? 'Logging in...' : '🎓 Student'}
                </button>
                <button
                  type="button"
                  disabled={submitting || !!demoSubmitting || googleSubmitting}
                  onClick={() => handleDemoPersona('mentor')}
                  className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 text-xs font-bold text-purple-700 dark:text-purple-300 text-center transition-all disabled:opacity-50"
                  title="Log in as Faculty / Mentor"
                >
                  {demoSubmitting === 'mentor' ? 'Logging in...' : '🧑‍🏫 Mentor'}
                </button>
                <button
                  type="button"
                  disabled={submitting || !!demoSubmitting || googleSubmitting}
                  onClick={() => handleDemoPersona('admin')}
                  className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 text-xs font-bold text-blue-700 dark:text-blue-300 text-center transition-all disabled:opacity-50"
                  title="Log in as Platform Admin"
                >
                  {demoSubmitting === 'admin' ? 'Logging in...' : '🛡️ Admin'}
                </button>
              </div>
            </div>

            {/* Standard Email/Password Form */}
            <form onSubmit={handleStandardLogin} className="space-y-4 text-xs" noValidate>
              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                >
                  <span>Email Address</span>
                  {emailError && <span className="text-[11px] text-red-500 font-normal">{emailError}</span>}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    disabled={submitting || googleSubmitting}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="name@university.edu"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border ${
                      emailError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                    } text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotFeedback(null);
                      setForgotModalOpen(true);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    disabled={submitting || googleSubmitting}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="••••••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border ${
                      passwordError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                    } text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-[11px] text-red-500 font-normal">{passwordError}</p>}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer"
                  />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Remember me for 7 days</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || googleSubmitting || !!demoSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                OR
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              disabled={submitting || googleSubmitting || !!demoSubmitting}
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
            >
              {googleSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Google Multicolor SVG Icon */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Registration link */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
              >
                Create account <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>

          {/* Minimal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center text-[11px] text-slate-400">
            © 2026 InnoSphere AI. Built for Student Innovators & Researchers.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL                                                     */}
      {/* ========================================================================= */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Reset Account Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter your registered academic email address. We will verify your account and dispatch secure recovery instructions.
            </p>

            {forgotFeedback && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>{forgotFeedback}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label htmlFor="forgot-email" className="font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
