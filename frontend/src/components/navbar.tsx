'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useProject } from '@/lib/project-context';
import { GuidedDemoModal } from '@/components/guided-demo-modal';
import { ProjectSwitcher } from '@/components/project-switcher';

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

  // Close dropdowns on click outside
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

  // Primary desktop navigation: Core product architecture
  const primaryNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Layers },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Research', href: '/research', icon: Atom },
    { label: 'Experiments', href: '/experiments', icon: FlaskConical },
    { label: 'Resources', href: '/discover', icon: Compass },
  ];

  // Secondary capabilities grouped inside "More Capabilities ▾"
  const secondaryNavItems = [
    { label: 'Competition & Proof', href: activeProject ? `/projects/${activeProject.id}/competition` : '/projects/1/competition', icon: Trophy, desc: 'Evaluator workspace & 21-slide deck' },
    { label: 'Project Intelligence', href: '/project-intelligence', icon: Activity, desc: 'Readiness & gap diagnostics' },
    { label: 'Validation Matrix', href: '/validation', icon: ShieldCheck, desc: 'Traceable claim-evidence links' },
    { label: 'Hardware Lab', href: '/hardware-lab', icon: Cpu, desc: 'Telemetry & sensor testbeds' },
    { label: 'Knowledge Graph', href: '/knowledge-graph', icon: Share2, desc: 'Project relationship network' },
    { label: 'Resource Matchmaker', href: '/resource-matchmaker', icon: SlidersHorizontal, desc: 'AI allocation engine' },
    { label: 'Submit Innovation Idea', href: '/submit-idea', icon: Lightbulb, desc: 'Decompose new concept' },
    { label: 'Patent & Prior-Art', href: '/patents', icon: Scale, desc: 'USPTO & novelty search' },
    { label: 'Tech Stack Insights', href: '/insights', icon: BookOpen, desc: 'Framework benchmarking' },
    { label: 'Skill Mapping', href: '/skills', icon: Brain, desc: 'Technical competency alignment' },
    { label: 'Architecture Blueprint', href: '/architecture', icon: Network, desc: 'System topology & pipelines' },
    { label: 'Execution Roadmap', href: activeProject ? `/roadmap/${activeProject.id}` : '/roadmap/1', icon: MapPin, desc: '10-phase milestone plan' },
    { label: 'Showcase & Evaluation', href: '/showcase', icon: Play, desc: 'Judge & mentor presentation' },
    { label: 'Faculty Mentor Hub', href: '/mentor', icon: GraduationCap, desc: 'Rubric assessment & feedback' },
    { label: 'Platform Analytics', href: '/analytics', icon: BarChart3, desc: 'Innovation cohort telemetry' },
  ];

  const isMoreActive = secondaryNavItems.some(
    (item) => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full max-w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="w-full max-w-full flex items-center justify-between px-3 sm:px-4 md:px-6 h-14 gap-2 box-border">
          {/* Left Section: Professional Brand Mark & Project Selector */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs shadow-xs transition-transform group-hover:scale-105">
                <Atom className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                InnoSphere
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  AI
                </span>
              </span>
            </Link>

            {/* Active Project Selector */}
            {user && (
              <div className="hidden md:block shrink-1 min-w-0">
                <ProjectSwitcher />
              </div>
            )}
          </div>

          {/* Center Section: Disciplined Primary Navigation */}
          <nav className="hidden lg:flex items-center gap-1 min-w-0 flex-1 justify-center py-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* "More Capabilities ▾" Dropdown */}
            <div className="relative shrink-0" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                aria-expanded={moreDropdownOpen}
                aria-label="More Innovation Capabilities"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isMoreActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : moreDropdownOpen
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Capabilities</span>
                <ChevronDown
                  className={`h-3 w-3 text-slate-400 transition-transform duration-150 ${
                    moreDropdownOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Platform Tools & Modules
                  </div>
                  <div className="max-h-[380px] overflow-y-auto space-y-0.5 pr-1">
                    {secondaryNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block truncate text-slate-900">{item.label}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{item.desc}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Section: Actions & User */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Guided Tour Link */}
            <button
              onClick={() => setDemoModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors cursor-pointer"
              title="Platform Tour & Walkthrough"
            >
              <Play className="h-3 w-3 text-blue-600" />
              <span>Tour</span>
            </button>

            {/* System Status Link */}
            <Link
              href="/system-status"
              className="hidden md:flex items-center p-2 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-emerald-600 transition-colors shrink-0"
              title="API Diagnostics & System Latency"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
            </Link>

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="relative shrink-0" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label="User Profile Menu"
                  className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  <div className="h-6 w-6 rounded bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left pr-0.5">
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[80px]">
                      {user.full_name}
                    </span>
                    <span className="text-[9px] text-slate-500 capitalize font-medium -mt-0.5">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="p-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.full_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      {user.profile?.institution && (
                        <p className="text-[9px] text-blue-600 mt-0.5 font-medium">{user.profile.institution}</p>
                      )}
                    </div>

                    <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Role
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize bg-slate-100 text-slate-700 border border-slate-200">
                        {user.role || 'Student'}
                      </span>
                    </div>

                    <div className="pt-1 space-y-0.5">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Layers className="h-3.5 w-3.5 text-slate-500" />
                        Student Dashboard
                      </Link>
                      <Link
                        href="/projects"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <FolderKanban className="h-3.5 w-3.5 text-slate-500" />
                        My Projects
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          router.push('/');
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
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
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Navigation Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 animate-in slide-in-from-top duration-150 shadow-xl">
            {user && (
              <div className="pb-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 font-medium">Active Workspace</span>
                <ProjectSwitcher />
              </div>
            )}

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Core Navigation
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-1.5 p-2 rounded-md text-xs font-medium ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Capabilities & Labs
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-1.5 p-2 rounded-md text-xs font-medium ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Guided Tour Modal */}
      <GuidedDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </>
  );
}
