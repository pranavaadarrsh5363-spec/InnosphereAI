'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
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
  Monitor,
  Activity,
  Cpu,
  Atom,
  FlaskConical,
  Brain,
  Network,
  Share2,
  SlidersHorizontal,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useProject } from '@/lib/project-context';
import { GuidedDemoModal } from '@/components/guided-demo-modal';
import { ThemeSwitcher } from '@/components/theme-switcher';
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

  // Primary desktop navigation items (the core workflow)
  const primaryNavItems = [
    { label: 'Showcase', href: '/showcase', icon: Play, highlight: true },
    { label: 'Dashboard', href: '/dashboard', icon: Layers },
    { label: 'Submit Idea', href: '/submit-idea', icon: Lightbulb },
    { label: 'Discover', href: '/discover', icon: Compass },
    { label: 'Matchmaker', href: '/resource-matchmaker', icon: SlidersHorizontal },
    { label: 'Patents', href: '/patents', icon: Scale },
    { label: 'Intelligence', href: '/project-intelligence', icon: Activity },
    { label: 'Tech Stack', href: '/insights', icon: Cpu },
    { label: 'Skills', href: '/skills', icon: Brain },
    { label: 'Knowledge Graph', href: '/knowledge-graph', icon: Share2 },
    { label: 'Architecture', href: '/architecture', icon: Network },
    { label: 'Research', href: '/research', icon: Atom },
  ];

  // Secondary / Lab tools accessible via "More ▾" dropdown and mobile menu
  const secondaryNavItems = [
    { label: 'Experiments', href: '/experiments', icon: FlaskConical },
    { label: 'Validation', href: '/validation', icon: ShieldCheck },
    { label: 'Hardware Lab', href: '/hardware-lab', icon: Cpu },
    { label: 'Roadmap', href: activeProject ? `/roadmap/${activeProject.id}` : '/roadmap/1', icon: MapPin },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Mentor Hub', href: '/mentor', icon: GraduationCap },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  // All items combined for the mobile navigation drawer
  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const isMoreActive = secondaryNavItems.some(
    (item) => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full max-w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors duration-200">
        <div className="w-full max-w-full flex items-center justify-between px-2.5 sm:px-3.5 md:px-4 lg:px-5 xl:px-6 h-13 sm:h-14 gap-1 sm:gap-2 lg:gap-2.5 xl:gap-3 box-border">
          {/* Left Section: Brand Logo & Project Selector */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-500 to-purple-500 p-0.5 shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-slate-900 dark:bg-slate-950">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1 whitespace-nowrap">
                InnoSphere <span className="text-[9.5px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-500/30">AI</span>
              </span>
            </Link>

            {/* Active Project Selector */}
            {user && (
              <div className="hidden md:block shrink-1 min-w-0">
                <ProjectSwitcher />
              </div>
            )}
          </div>

          {/* Center Section: Primary Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 min-w-0 flex-1 justify-center overflow-x-auto scrollbar-none py-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 px-1.5 py-1 xl:px-2 xl:py-1 rounded-md text-[11px] xl:text-[11.5px] font-medium whitespace-nowrap shrink-0 transition-all ${
                    item.highlight
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs hover:brightness-110 font-semibold'
                      : isActive
                      ? 'bg-indigo-50 dark:bg-slate-800/90 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-slate-700/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* "More Tools ▾" Dropdown for Secondary Tools */}
            <div className="relative shrink-0" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                aria-expanded={moreDropdownOpen}
                aria-label="More Innovation Tools"
                className={`flex items-center gap-1 px-1.5 py-1 xl:px-2 xl:py-1 rounded-md text-[11px] xl:text-[11.5px] font-medium whitespace-nowrap transition-all border cursor-pointer ${
                  isMoreActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-200 dark:border-indigo-500/40 shadow-xs'
                    : moreDropdownOpen
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <span>More</span>
                <ChevronDown
                  className={`h-3 w-3 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
                    moreDropdownOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Extended Tools & Lab
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {secondaryNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-600/25 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Section: Action Controls & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Guided Demo Button */}
            <button
              onClick={() => setDemoModalOpen(true)}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
              title="Start 5-Minute Evaluator Tour"
            >
              <Play className="h-3 w-3 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
              <span className="hidden xl:inline">Guided Demo</span>
              <span className="xl:hidden">Demo</span>
            </button>

            {/* Presentation Mode Link (Slides) */}
            <Link
              href="/presentation"
              className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-[11px] font-medium transition-colors shrink-0"
              title="Launch 10-Slide Fullscreen Defense"
            >
              <Monitor className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span>Slides</span>
            </Link>

            {/* System Status Link */}
            <Link
              href="/system-status"
              className="hidden md:flex items-center p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors shrink-0"
              title="System Diagnostics & API Latency"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </Link>

            {/* Global Theme Switcher */}
            <ThemeSwitcher />

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="relative shrink-0" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label="User Profile Menu"
                  className="flex items-center gap-1.5 p-1 sm:px-1.5 sm:py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-xs shrink-0">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left pr-0.5">
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[70px]">
                      {user.full_name}
                    </span>
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 capitalize font-bold -mt-0.5">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500 hidden sm:block shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{user.full_name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      {user.profile?.institution && (
                        <p className="text-[9px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">{user.profile.institution}</p>
                      )}
                    </div>

                    {/* Informational Role Badge (Authoritative Role Display) */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Current Role
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                          user.role === 'mentor'
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                            : user.role === 'admin'
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                            : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                        }`}
                      >
                        {user.role || 'Student'}
                      </span>
                    </div>

                    <div className="pt-1 space-y-0.5">
                      <Link
                        href="/resource-matchmaker"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-emerald-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        <SlidersHorizontal className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        AI Resource Matchmaker & Allocation
                      </Link>
                      <Link
                        href="/patents"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-amber-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        <Scale className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        AI Patent & Prior-Art Explorer
                      </Link>
                      <Link
                        href="/project-intelligence"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-indigo-700 dark:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        <Activity className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                        Project Intelligence Engine
                      </Link>
                      <Link
                        href="/research"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-purple-700 dark:text-purple-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        <Atom className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        AI Research & LaTeX Workspace
                      </Link>
                      <Link
                        href="/experiments"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-indigo-700 dark:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        <FlaskConical className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                        Experiments & Reproducibility Hub
                      </Link>
                      <Link
                        href="/hardware-lab"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-cyan-700 dark:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Cpu className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                        Hardware & Telemetry Lab
                      </Link>
                      <Link
                        href="/presentation"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-purple-700 dark:text-purple-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Monitor className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        Presentation Mode (Slides)
                      </Link>
                      <Link
                        href="/system-status"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-emerald-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Activity className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        System Health & APIs
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          router.push('/');
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3 w-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href="/login"
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile / Tablet Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 shrink-0 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Nav Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-3 space-y-2 animate-in slide-in-from-top duration-200 shadow-2xl">
            {user && (
              <div className="pb-2 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Workspace</span>
                <ProjectSwitcher />
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setDemoModalOpen(true);
                }}
                className="flex items-center gap-1.5 p-2 rounded-lg text-xs font-bold bg-indigo-600 text-white col-span-2 sm:col-span-3 justify-center shadow-xs cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                Launch Guided Demo (5-Min Tour)
              </button>
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-medium ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold dark:bg-indigo-600/30 dark:text-indigo-300 dark:border-indigo-500/30'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Appearance / Theme</span>
              <ThemeSwitcher />
            </div>
          </div>
        )}
      </header>

      {/* Guided Demo Modal */}
      <GuidedDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </>
  );
}
