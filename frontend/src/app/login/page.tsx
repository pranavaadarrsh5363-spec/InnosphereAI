'use client';

import React, { useState, useEffect, Suspense } from'react';
import Link from'next/link';
import Script from'next/script';
import { useRouter, useSearchParams } from'next/navigation';
import {
 Lock,
 Mail,
 ArrowRight,
 GraduationCap,
 Award,
 ShieldCheck,
 Loader2,
 Eye,
 EyeOff,
 CheckCircle2,
 AlertCircle,
 Atom,
 FlaskConical,
 Scale,
 Compass,
 KeyRound,
 X,
 Check,
 Zap,
} from'lucide-react';
import { useAuth } from'@/lib/auth-context';

type RoleKey ='student' |'mentor' |'admin';

interface RoleConfig {
 id: RoleKey;
 title: string;
 badge: string;
 icon: React.ElementType;
 description: string;
 defaultEmail: string;
 defaultPassword: string;
 targetPath: string;
 accentColor: string;
 borderColor: string;
 bgLight: string;
 activeBorder: string;
 activeBg: string;
 activeText: string;
 badgeStyle: string;
}

const ROLES: RoleConfig[] = [
 {
 id:'student',
 title:'Student Innovator',
 badge:'Student Portal',
 icon: GraduationCap,
 description:'Build, validate, and discover resources for your research projects',
 defaultEmail:'innovator@student.edu',
 defaultPassword:'password123',
 targetPath:'/dashboard',
 accentColor:'text-indigo-600',
 borderColor:'border-slate-200 hover:border-slate-300',
 bgLight:'bg-white',
 activeBorder:'border-indigo-500',
 activeBg:'bg-indigo-50/50',
 activeText:'text-slate-900',
 badgeStyle:'bg-slate-100 text-slate-700 border border-slate-200',
 },
 {
 id:'mentor',
 title:'Faculty Mentor',
 badge:'Mentor Hub',
 icon: Award,
 description:'Guide students, evaluate milestones, and provide rubric feedback',
 defaultEmail:'mentor@university.edu',
 defaultPassword:'password123',
 targetPath:'/mentor',
 accentColor:'text-indigo-600',
 borderColor:'border-slate-200 hover:border-slate-300',
 bgLight:'bg-white',
 activeBorder:'border-indigo-500',
 activeBg:'bg-indigo-50/50',
 activeText:'text-slate-900',
 badgeStyle:'bg-slate-100 text-slate-700 border border-slate-200',
 },
 {
 id:'admin',
 title:'Platform Admin',
 badge:'Admin Console',
 icon: ShieldCheck,
 description:'Manage platform governance, system metrics, and innovation analytics',
 defaultEmail:'admin@innosphere.ai',
 defaultPassword:'admin123',
 targetPath:'/analytics',
 accentColor:'text-indigo-600',
 borderColor:'border-slate-200 hover:border-slate-300',
 bgLight:'bg-white',
 activeBorder:'border-indigo-500',
 activeBg:'bg-indigo-50/50',
 activeText:'text-slate-900',
 badgeStyle:'bg-slate-100 text-slate-700 border border-slate-200',
 },
];

function getSafeRedirectUrl(rawRedirect: string | null, userRole?: string): string {
 if (!rawRedirect) {
 if (userRole ==='mentor') return'/mentor';
 if (userRole ==='admin') return'/analytics';
 return'/dashboard';
 }

 if (
 rawRedirect.startsWith('/') &&
 !rawRedirect.startsWith('//') &&
 !rawRedirect.startsWith('/\\') &&
 !rawRedirect.includes(':')
 ) {
 return rawRedirect;
 }

 return userRole ==='mentor'
 ?'/mentor'
 : userRole ==='admin'
 ?'/analytics'
 :'/dashboard';
}

function LoginFormContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const rawRedirect = searchParams?.get('redirect') || null;
 const initialRoleParam = (searchParams?.get('role') as RoleKey) ||'student';

 const { user, login, googleLogin, forgotPassword, demoLogin, isLoading } = useAuth();

 const [selectedRole, setSelectedRole] = useState<RoleKey>(
 ['student','mentor','admin'].includes(initialRoleParam) ? initialRoleParam :'student'
 );

 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [rememberMe, setRememberMe] = useState(true);

 const [emailError, setEmailError] = useState<string | null>(null);
 const [passwordError, setPasswordError] = useState<string | null>(null);

 const [submitting, setSubmitting] = useState(false);
 const [googleSubmitting, setGoogleSubmitting] = useState(false);
 const [demoSubmitting, setDemoSubmitting] = useState<RoleKey | null>(null);
 const [authError, setAuthError] = useState<string | null>(null);
 const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

 const [forgotModalOpen, setForgotModalOpen] = useState(false);
 const [forgotEmail, setForgotEmail] = useState('');
 const [forgotLoading, setForgotLoading] = useState(false);
 const [forgotFeedback, setForgotFeedback] = useState<string | null>(null);

 const currentRoleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

 useEffect(() => {
 if (!isLoading && user) {
 const destination = getSafeRedirectUrl(rawRedirect, user.role);
 router.replace(destination);
 }
 }, [user, isLoading, router, rawRedirect]);

 useEffect(() => {
 const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
 if (googleClientId && typeof window !=='undefined') {
 const initGsi = () => {
 if ((window as any).google?.accounts?.id) {
 try {
 (window as any).google.accounts.id.initialize({
 client_id: googleClientId,
 callback: async (response: any) => {
 if (response?.credential) {
 setGoogleSubmitting(true);
 setAuthError(null);
 try {
 const authUser = await googleLogin({ credential: response.credential }, rememberMe);
 setAuthSuccessMsg(`Signed in with Google as ${authUser.full_name || authUser.email}! Redirecting...`);
 const destination = getSafeRedirectUrl(rawRedirect, authUser.role);
 setTimeout(() => {
 router.push(destination);
 }, 350);
 } catch (err: any) {
 setAuthError(err.message ||'Google Sign-In failed to verify with the server.');
 } finally {
 setGoogleSubmitting(false);
 }
 }
 },
 auto_select: false,
 cancel_on_tap_outside: true,
 });
 } catch (e) {
 console.warn('Google Identity Services initialization notice:', e);
 }
 }
 };

 if ((window as any).google?.accounts?.id) {
 initGsi();
 } else {
 const timer = setInterval(() => {
 if ((window as any).google?.accounts?.id) {
 clearInterval(timer);
 initGsi();
 }
 }, 300);
 return () => clearInterval(timer);
 }
 }
 }, [googleLogin, rawRedirect, rememberMe, router]);

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

 const handleRoleSelect = (roleKey: RoleKey) => {
 setSelectedRole(roleKey);
 setAuthError(null);
 setAuthSuccessMsg(null);
 setEmailError(null);
 setPasswordError(null);
 };

 const handleFillCredentials = (roleKey?: RoleKey) => {
 const target = ROLES.find((r) => r.id === (roleKey || selectedRole)) || ROLES[0];
 if (roleKey && roleKey !== selectedRole) {
 setSelectedRole(roleKey);
 }
 setEmail(target.defaultEmail);
 setPassword(target.defaultPassword);
 setEmailError(null);
 setPasswordError(null);
 setAuthError(null);
 };

 const handleStandardLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!validateInputs()) return;

 setSubmitting(true);
 setAuthError(null);
 setAuthSuccessMsg(null);

 try {
 const authUser = await login(email.trim(), password, rememberMe);
 
 if (authUser.role !== selectedRole) {
 setAuthSuccessMsg(
`Signed in as ${authUser.role} (${authUser.full_name || authUser.email}). Redirecting to your assigned workspace...`
 );
 } else {
 setAuthSuccessMsg(`Welcome back, ${authUser.full_name ||'Innovator'}! Redirecting...`);
 }

 const destination = getSafeRedirectUrl(rawRedirect, authUser.role);
 setTimeout(() => {
 router.push(destination);
 }, 400);
 } catch (err: any) {
 if (err.status === 401) {
 setAuthError('Invalid email or password. Please verify your credentials or use the Quick Fill button.');
 } else if (err.status === 429) {
 setAuthError('Too many login attempts. Please wait a few moments and try again.');
 } else if (err.status === 403) {
 setAuthError('Your account is currently inactive. Please contact system administrator.');
 } else if (err.status === 0 || err.message?.includes('connect')) {
 setAuthError('Unable to connect to InnoSphere AI backend. Please verify server connectivity.');
 } else {
 setAuthError(err.message ||'Authentication failed. Please verify your details.');
 }
 } finally {
 setSubmitting(false);
 }
 };

 const handleGoogleLogin = async () => {
 const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
 if (googleClientId && typeof window !=='undefined' && (window as any).google?.accounts?.id) {
 (window as any).google.accounts.id.prompt();
 return;
 }

 setGoogleSubmitting(true);
 setAuthError(null);
 setAuthSuccessMsg(null);

 try {
 const authUser = await googleLogin(
 {
 email: email ? email.trim() :'innovator@student.edu',
 name:'Google Verified Student',
 },
 rememberMe
 );
 setAuthSuccessMsg(`Signed in with Google as ${authUser.full_name}! Redirecting...`);
 const destination = getSafeRedirectUrl(rawRedirect, authUser.role);
 setTimeout(() => {
 router.push(destination);
 }, 350);
 } catch (err: any) {
 setAuthError(err.message ||'Google Sign-In failed. Please try again or use standard credentials.');
 } finally {
 setGoogleSubmitting(false);
 }
 };

 const handleQuickDemoLogin = async (roleKey: RoleKey) => {
 setDemoSubmitting(roleKey);
 setAuthError(null);
 setAuthSuccessMsg(null);

 try {
 const authUser = await demoLogin(roleKey);
 setAuthSuccessMsg(`Authenticated as ${roleKey} (${authUser.full_name})! Redirecting...`);
 const destination = getSafeRedirectUrl(rawRedirect, roleKey);
 setTimeout(() => {
 router.push(destination);
 }, 300);
 } catch (err: any) {
 setAuthError(`Failed to authenticate as ${roleKey}. Please check backend connection.`);
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
 <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-10 transition-colors duration-200">
 <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
 <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden min-h-[680px]">
 <div className="lg:col-span-5 bg-slate-50 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
 <div className="space-y-6">
 <Link href="/" className="inline-flex items-center gap-2.5">
 <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
 <Atom className="h-4 w-4" />
 </div>
 <div className="flex items-center gap-1.5">
 <span className="text-xl font-semibold text-slate-900">InnoSphere</span>
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
 AI
 </span>
 </div>
 </Link>

 <div className="space-y-2.5 pt-2">
 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
 <Atom className="w-4 h-4 text-slate-400" /> Dedicated Role-Based Access
 </span>
 <h1 className="text-xl font-semibold text-slate-900">
 Empowering Student Innovation
 </h1>
 <p className="text-sm text-slate-600">
 Seamless role-based workspace tailored for student innovators, research faculty mentors, and academic administrators.
 </p>
 </div>

 <div className="space-y-3 pt-4">
 {[
 {
 icon: Compass,
 title:'Intelligent Resource Discovery',
 desc:'Semantic AI search across papers, datasets, and hardware sensors.',
 },
 {
 icon: Atom,
 title:'AI Research Intelligence',
 desc:'Literature synthesis, LaTeX authoring & automated citations.',
 },
 {
 icon: FlaskConical,
 title:'Experiment & Validation Hub',
 desc:'Empirical telemetry, benchmark references & claim proofs.',
 },
 {
 icon: Scale,
 title:'Innovation & Prior-Art Analysis',
 desc:'Patent exploration, concept extraction & technical differentiation.',
 },
 ].map((feat, idx) => (
 <div
 key={idx}
 className="p-4 rounded-lg bg-white border border-slate-200 flex items-start gap-3 shadow-sm"
 >
 <div className="p-2 rounded-md bg-slate-50 border border-slate-200 shrink-0">
 <feat.icon className="w-4 h-4 text-slate-500" />
 </div>
 <div>
 <h2 className="text-sm font-semibold text-slate-900">{feat.title}</h2>
 <p className="text-xs text-slate-600 leading-snug mt-1">{feat.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <ShieldCheck className="w-4 h-4 text-slate-400" /> PBKDF2 Encrypted & Role-Based RBAC
 </span>
 <span>v1.0.0</span>
 </div>
 </div>

 <div className="lg:col-span-7 bg-white p-6 sm:p-8 flex flex-col justify-between space-y-6">
 <div className="space-y-6 max-w-lg mx-auto w-full">
 <div className="space-y-1">
 <h2 className="text-xl font-semibold text-slate-900">
 Welcome to InnoSphere AI
 </h2>
 <p className="text-sm text-slate-600">
 Select your account type and sign in to access your designated workspace.
 </p>
 </div>

 {authError && (
 <div className="p-4 rounded-md bg-red-50 border border-slate-200 text-red-600 text-sm font-medium flex items-start gap-2">
 <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
 <span>{authError}</span>
 </div>
 )}

 {authSuccessMsg && (
 <div className="p-4 rounded-md bg-emerald-50 border border-slate-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 <span>{authSuccessMsg}</span>
 </div>
 )}

 <div className="space-y-2">
 <label className="text-sm font-semibold text-slate-900 flex items-center justify-between">
 <span>Select Account Type</span>
 <span className="text-xs text-slate-500 font-normal">Choose your platform role</span>
 </label>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 {ROLES.map((r) => {
 const Icon = r.icon;
 const isSelected = selectedRole === r.id;
 return (
 <button
 key={r.id}
 type="button"
 onClick={() => handleRoleSelect(r.id)}
 className={`p-3 rounded-md border text-left transition-colors relative flex flex-col justify-between cursor-pointer ${
 isSelected
 ?`${r.activeBorder} ${r.activeBg}`
 :`${r.borderColor} ${r.bgLight} hover:bg-slate-50`
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <div
 className={`p-1.5 rounded ${
 isSelected ?'bg-indigo-600 text-white' :'bg-slate-100 text-slate-500'
 }`}
 >
 <Icon className="w-4 h-4" />
 </div>
 {isSelected && (
 <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-white">
 <Check className="w-3 h-3" />
 </span>
 )}
 </div>
 <div>
 <span className={`text-sm font-semibold block ${isSelected ? r.activeText :'text-slate-900'}`}>
 {r.title}
 </span>
 <span className={`text-xs line-clamp-2 mt-0.5 leading-tight ${isSelected ?'text-slate-700' :'text-slate-500'}`}>
 {r.description}
 </span>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
 <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
 <Zap className="w-4 h-4 text-slate-400 shrink-0" />
 <span>
 Testing as <strong>{currentRoleConfig.title}</strong>?
 </span>
 </div>
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <button
 type="button"
 onClick={() => handleFillCredentials(selectedRole)}
 className="flex-1 sm:flex-none px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium transition-colors shadow-sm cursor-pointer"
 >
 Fill Credentials
 </button>
 <button
 type="button"
 disabled={submitting || !!demoSubmitting || googleSubmitting}
 onClick={() => handleQuickDemoLogin(selectedRole)}
 className="flex-1 sm:flex-none px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
 >
 {demoSubmitting === selectedRole ?'Signing in...' :'1-Click Sign In'}
 </button>
 </div>
 </div>

 <form onSubmit={handleStandardLogin} className="space-y-4 text-sm" noValidate>
 <div className="space-y-1.5">
 <label
 htmlFor="login-email"
 className="font-semibold text-slate-900 flex items-center justify-between"
 >
 <span>{currentRoleConfig.title} Email</span>
 {emailError && <span className="text-xs text-red-600 font-normal">{emailError}</span>}
 </label>
 <div className="relative">
 <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
 placeholder={currentRoleConfig.defaultEmail}
 className={`w-full pl-9 pr-3 py-2 rounded-md bg-white border ${
 emailError
 ?'border-red-500 focus:ring-1 focus:ring-red-500'
 :'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
 } text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label htmlFor="login-password" className="font-semibold text-slate-900">
 Password
 </label>
 <button
 type="button"
 onClick={() => {
 setForgotEmail(email);
 setForgotFeedback(null);
 setForgotModalOpen(true);
 }}
 className="text-indigo-600 hover:underline font-medium text-xs focus:outline-none cursor-pointer"
 >
 Forgot password?
 </button>
 </div>
 <div className="relative">
 <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
 <input
 id="login-password"
 type={showPassword ?'text' :'password'}
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
 className={`w-full pl-9 pr-9 py-2 rounded-md bg-white border ${
 passwordError
 ?'border-red-500 focus:ring-1 focus:ring-red-500'
 :'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
 } text-slate-900 placeholder-slate-400 focus:outline-none transition-colors`}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 aria-label={showPassword ?'Hide password' :'Show password'}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
 >
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 {passwordError && <p className="text-xs text-red-600 font-normal">{passwordError}</p>}
 </div>

 <div className="flex items-center justify-between pt-1">
 <label className="flex items-center gap-2 cursor-pointer select-none">
 <input
 type="checkbox"
 checked={rememberMe}
 onChange={(e) => setRememberMe(e.target.checked)}
 className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 bg-white cursor-pointer"
 />
 <span className="text-slate-600 text-sm">Remember me for 7 days</span>
 </label>
 </div>

 <button
 type="submit"
 disabled={submitting || googleSubmitting || !!demoSubmitting}
 className="w-full py-2 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
 >
 {submitting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>Signing in as {currentRoleConfig.title}...</span>
 </>
 ) : (
 <>
 <span>Sign In as {currentRoleConfig.title}</span>
 <ArrowRight className="w-4 h-4" />
 </>
 )}
 </button>
 </form>

 <div className="relative flex items-center justify-center">
 <div className="border-t border-slate-200 w-full" />
 <span className="bg-white px-3 text-xs font-medium text-slate-500 shrink-0">
 OR
 </span>
 <div className="border-t border-slate-200 w-full" />
 </div>

 <button
 type="button"
 disabled={submitting || googleSubmitting || !!demoSubmitting}
 onClick={handleGoogleLogin}
 className="w-full py-2 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
 >
 {googleSubmitting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
 <span>Connecting to Google...</span>
 </>
 ) : (
 <>
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

 <p className="text-center text-sm text-slate-600">
 Don&apos;t have an account?{''}
 <Link
 href="/register"
 className="font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
 >
 Create account <ArrowRight className="w-3 h-3" />
 </Link>
 </p>
 </div>

 <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
 © 2026 InnoSphere AI. Built for Student Innovators, Mentors & Administrators.
 </div>
 </div>
 </div>

 {forgotModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
 <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-md w-full p-6 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="p-2 rounded-md bg-slate-50 border border-slate-200 text-slate-500">
 <KeyRound className="w-4 h-4" />
 </div>
 <h3 className="font-semibold text-sm text-slate-900">
 Reset Account Password
 </h3>
 </div>
 <button
 type="button"
 onClick={() => setForgotModalOpen(false)}
 className="p-1.5 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <p className="text-sm text-slate-600 leading-relaxed">
 Enter your registered academic email address. We will verify your account and dispatch secure recovery instructions.
 </p>

 {forgotFeedback && (
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-start gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
 <span>{forgotFeedback}</span>
 </div>
 )}

 <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-sm">
 <div className="space-y-1.5">
 <label htmlFor="forgot-email" className="font-semibold text-slate-900">
 Email Address
 </label>
 <input
 id="forgot-email"
 type="email"
 required
 value={forgotEmail}
 onChange={(e) => setForgotEmail(e.target.value)}
 placeholder="name@university.edu"
 className="w-full px-3 py-2 rounded-md bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setForgotModalOpen(false)}
 className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium transition-colors cursor-pointer shadow-sm"
 >
 Close
 </button>
 <button
 type="submit"
 disabled={forgotLoading}
 className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
 >
 {forgotLoading ?'Sending...' :'Send Reset Link'}
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
 <div className="min-h-screen bg-slate-50 flex items-center justify-center">
 <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
 </div>
 }
 >
 <LoginFormContent />
 </Suspense>
 );
}
