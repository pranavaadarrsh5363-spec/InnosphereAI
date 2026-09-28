'use client';

import React, { useState, useRef, useEffect } from'react';
import Link from'next/link';
import { usePathname, useRouter } from'next/navigation';
import {
 Compass,
 Lightbulb,
 MapPin,
 Scale,
 BarChart3,
 GraduationCap,
 ChevronDown,
 Layers,
 LogOut,
 ShieldCheck,
 Menu,
 X,
 Play,
 Activity,
 Cpu,
 Atom,
 FlaskConical,
 Brain,
 Network,
 Share2,
 SlidersHorizontal,
 FolderKanban,
 BookOpen,
 Trophy,
} from'lucide-react';
import { useAuth } from'@/lib/auth-context';
import { useProject } from'@/lib/project-context';
import { GuidedDemoModal } from'@/components/guided-demo-modal';
import { ProjectSwitcher } from'@/components/project-switcher';

export function Navbar() {
 const pathname = usePathname();
 const router = useRouter();
 const { user, logout } = useAuth();
 const { activeProject } = useProject();
 const [userDropdownOpen, setUserDropdownOpen] = useState(false);
 const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [demoModalOpen, setDemoModalOpen] = useState(false);

 const userDropdownRef = useRef<HTMLDivElement>(null);
 const moreDropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
 setUserDropdownOpen(false);
 }
 if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
 setMoreDropdownOpen(false);
 }
 }
 document.addEventListener('mousedown', handleClickOutside);
 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 };
 }, []);

 const primaryNavItems = [
 { label:'Dashboard', href:'/dashboard', icon: Layers },
 { label:'Projects', href:'/projects', icon: FolderKanban },
 { label:'Research', href:'/research', icon: Atom },
 { label:'Experiments', href:'/experiments', icon: FlaskConical },
 { label:'Resources', href:'/discover', icon: Compass },
 ];

 const secondaryNavItems = [
 { label:'Competition & Proof', href: activeProject ?`/projects/${activeProject.id}/competition` :'/projects/1/competition', icon: Trophy, desc:'Evaluator workspace & deck' },
 { label:'Project Intelligence', href:'/project-intelligence', icon: Activity, desc:'Readiness diagnostics' },
 { label:'Validation Matrix', href:'/validation', icon: ShieldCheck, desc:'Claim-evidence links' },
 { label:'Hardware Lab', href:'/hardware-lab', icon: Cpu, desc:'Sensor testbeds' },
 { label:'Knowledge Graph', href:'/knowledge-graph', icon: Share2, desc:'Relationship network' },
 { label:'Resource Matchmaker', href:'/resource-matchmaker', icon: SlidersHorizontal, desc:'AI allocation' },
 { label:'Submit Idea', href:'/submit-idea', icon: Lightbulb, desc:'New concept' },
 { label:'Patent & Prior-Art', href:'/patents', icon: Scale, desc:'Novelty search' },
 { label:'Tech Insights', href:'/insights', icon: BookOpen, desc:'Framework analysis' },
 { label:'Skill Mapping', href:'/skills', icon: Brain, desc:'Competency alignment' },
 { label:'Architecture', href:'/architecture', icon: Network, desc:'System topology' },
 { label:'Roadmap', href: activeProject ?`/roadmap/${activeProject.id}` :'/roadmap/1', icon: MapPin, desc:'Milestone plan' },
 { label:'Showcase', href:'/showcase', icon: Play, desc:'Presentation & evaluation' },
 { label:'Mentor Hub', href:'/mentor', icon: GraduationCap, desc:'Faculty assessment' },
 { label:'Analytics', href:'/analytics', icon: BarChart3, desc:'Cohort metrics' },
 ];

 const isMoreActive = secondaryNavItems.some(
 (item) => pathname === item.href || (item.href !=='/' && pathname?.startsWith(item.href))
 );

 return (
 <>
 <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
 <div className="w-full flex items-center justify-between px-4 md:px-6 h-12 gap-2">
 {/* Brand */}
 <div className="flex items-center gap-3 shrink-0 min-w-0">
 <Link href="/" className="flex items-center gap-2 shrink-0">
 <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
 <Atom className="h-4 w-4" />
 </div>
 <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
 InnoSphere AI
 </span>
 </Link>

 {user && (
 <div className="hidden md:block shrink-1 min-w-0">
 <ProjectSwitcher />
 </div>
 )}
 </div>

 {/* Primary Nav */}
 <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
 {primaryNavItems.map((item) => {
 const Icon = item.icon;
 const isActive = pathname === item.href || (item.href !=='/' && pathname?.startsWith(item.href));
 return (
 <Link
 key={item.href}
 href={item.href}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
 isActive
 ?'bg-slate-100 text-slate-900'
 :'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
 }`}
 >
 <Icon className={`h-4 w-4 ${isActive ?'text-indigo-600' :'text-slate-400'}`} />
 <span>{item.label}</span>
 </Link>
 );
 })}

 {/* More Dropdown */}
 <div className="relative shrink-0" ref={moreDropdownRef}>
 <button
 type="button"
 onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
 aria-expanded={moreDropdownOpen}
 aria-label="More Capabilities"
 className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
 isMoreActive
 ?'bg-slate-100 text-slate-900'
 : moreDropdownOpen
 ?'bg-slate-50 text-slate-900'
 :'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
 }`}
 >
 <span>More</span>
 <ChevronDown
 className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${
 moreDropdownOpen ?'rotate-180' :''
 }`}
 />
 </button>

 {moreDropdownOpen && (
 <div className="absolute right-0 mt-1.5 w-64 rounded-lg bg-white border border-slate-200 shadow-sm p-1.5 z-50">
 <div className="px-2 py-1 text-xs font-medium text-slate-400 border-b border-slate-100 mb-1">
 Platform Modules
 </div>
 <div className="max-h-[380px] overflow-y-auto space-y-0.5">
 {secondaryNavItems.map((item) => {
 const Icon = item.icon;
 const isActive = pathname === item.href;
 return (
 <Link
 key={item.href}
 href={item.href}
 onClick={() => setMoreDropdownOpen(false)}
 className={`w-full flex items-start gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
 isActive
 ?'bg-slate-100 text-slate-900'
 :'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
 }`}
 >
 <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ?'text-indigo-600' :'text-slate-400'}`} />
 <div className="flex-1 min-w-0">
 <span className="font-medium block truncate text-sm">{item.label}</span>
 <span className="text-xs text-slate-400 block truncate">{item.desc}</span>
 </div>
 </Link>
 );
 })}
 </div>
 </div>
 )}
 </div>
 </nav>

 {/* Right Section */}
 <div className="flex items-center gap-1.5 shrink-0">
 <button
 onClick={() => setDemoModalOpen(true)}
 className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
 title="Platform Tour"
 >
 <Play className="h-3.5 w-3.5" />
 <span>Tour</span>
 </button>

 <Link
 href="/system-status"
 className="hidden md:flex items-center p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
 title="System Status"
 >
 <Activity className="h-4 w-4" />
 </Link>

 {user ? (
 <div className="relative shrink-0" ref={userDropdownRef}>
 <button
 type="button"
 onClick={() => setUserDropdownOpen(!userDropdownOpen)}
 aria-expanded={userDropdownOpen}
 aria-label="User Profile Menu"
 className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
 >
 <div className="h-6 w-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-medium shrink-0">
 {user.full_name?.charAt(0) ||'U'}
 </div>
 <div className="hidden sm:flex flex-col text-left">
 <span className="text-sm font-medium text-slate-900 truncate max-w-[100px]">
 {user.full_name}
 </span>
 <span className="text-xs text-slate-500 capitalize -mt-0.5">
 {user.role}
 </span>
 </div>
 <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block shrink-0" />
 </button>

 {userDropdownOpen && (
 <div className="absolute right-0 mt-1.5 w-56 rounded-lg bg-white border border-slate-200 shadow-sm p-1.5 z-50">
 <div className="px-3 py-2 border-b border-slate-100">
 <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
 <p className="text-xs text-slate-500 truncate">{user.email}</p>
 {user.profile?.institution && (
 <p className="text-xs text-slate-500 mt-0.5">{user.profile.institution}</p>
 )}
 </div>

 <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
 <span className="text-xs text-slate-500">Role</span>
 <span className="text-xs font-medium text-slate-700 capitalize">
 {user.role ||'Student'}
 </span>
 </div>

 <div className="pt-1 space-y-0.5">
 <Link
 href="/dashboard"
 onClick={() => setUserDropdownOpen(false)}
 className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-50 transition-colors"
 >
 <Layers className="h-4 w-4 text-slate-400" />
 Dashboard
 </Link>
 <Link
 href="/projects"
 onClick={() => setUserDropdownOpen(false)}
 className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-50 transition-colors"
 >
 <FolderKanban className="h-4 w-4 text-slate-400" />
 My Projects
 </Link>
 <button
 onClick={() => {
 logout();
 setUserDropdownOpen(false);
 router.push('/');
 }}
 className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
 >
 <LogOut className="h-4 w-4" />
 Sign Out
 </button>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="flex items-center gap-2 shrink-0">
 <Link
 href="/login"
 className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
 >
 Sign In
 </Link>
 <Link
 href="/register"
 className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm"
 >
 Get Started
 </Link>
 </div>
 )}

 <button
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 shrink-0 cursor-pointer"
 aria-label="Toggle Navigation Menu"
 >
 {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
 </button>
 </div>
 </div>

 {/* Mobile Menu */}
 {mobileMenuOpen && (
 <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3">
 {user && (
 <div className="pb-2 border-b border-slate-100 flex items-center justify-between gap-2">
 <span className="text-xs text-slate-500">Active Workspace</span>
 <ProjectSwitcher />
 </div>
 )}

 <div>
 <div className="text-xs font-medium text-slate-400 mb-1.5">Navigation</div>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
 {primaryNavItems.map((item) => {
 const Icon = item.icon;
 const isActive = pathname === item.href;
 return (
 <Link
 key={item.href}
 href={item.href}
 onClick={() => setMobileMenuOpen(false)}
 className={`flex items-center gap-1.5 p-2 rounded-md text-sm font-medium ${
 isActive
 ?'bg-slate-100 text-slate-900'
 :'text-slate-600 hover:bg-slate-50'
 }`}
 >
 <Icon className={`h-4 w-4 shrink-0 ${isActive ?'text-indigo-600' :'text-slate-400'}`} />
 <span className="truncate">{item.label}</span>
 </Link>
 );
 })}
 </div>
 </div>

 <div>
 <div className="text-xs font-medium text-slate-400 mb-1.5">Modules</div>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-[220px] overflow-y-auto">
 {secondaryNavItems.map((item) => {
 const Icon = item.icon;
 const isActive = pathname === item.href;
 return (
 <Link
 key={item.href}
 href={item.href}
 onClick={() => setMobileMenuOpen(false)}
 className={`flex items-center gap-1.5 p-2 rounded-md text-sm font-medium ${
 isActive
 ?'bg-slate-100 text-slate-900'
 :'text-slate-600 hover:bg-slate-50'
 }`}
 >
 <Icon className={`h-4 w-4 shrink-0 ${isActive ?'text-indigo-600' :'text-slate-400'}`} />
 <span className="truncate">{item.label}</span>
 </Link>
 );
 })}
 </div>
 </div>
 </div>
 )}
 </header>

 <GuidedDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
 </>
 );
}
