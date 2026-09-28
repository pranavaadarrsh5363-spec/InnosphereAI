'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ChevronDown,
  Check,
  Plus,
  Brain,
  Cpu,
  Zap,
  Leaf,
  GraduationCap,
  HeartPulse,
  Sprout,
  Building2,
  FolderKanban,
  ArrowRight,
} from 'lucide-react';
import { useProject } from '@/lib/project-context';
import { getDomainColor } from '@/lib/utils';
import { Project } from '@/types';

function getDomainIcon(domain: string = '') {
  const d = domain.toLowerCase();
  if (d.includes('health') || d.includes('med') || d.includes('cardio')) return HeartPulse;
  if (d.includes('agri') || d.includes('farm') || d.includes('crop')) return Sprout;
  if (d.includes('waste') || d.includes('env') || d.includes('sustain') || d.includes('water')) return Leaf;
  if (d.includes('traffic') || d.includes('cit') || d.includes('urban') || d.includes('infra')) return Building2;
  if (d.includes('edu') || d.includes('skill') || d.includes('learn')) return GraduationCap;
  if (d.includes('ai') || d.includes('neural') || d.includes('nlp')) return Brain;
  if (d.includes('hard') || d.includes('iot') || d.includes('sensor') || d.includes('edge')) return Cpu;
  if (d.includes('solar') || d.includes('energy') || d.includes('power')) return Zap;
  return Sparkles;
}

export function ProjectSwitcher() {
  const router = useRouter();
  const { projects, activeProject, setActiveProjectId } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Set initial focused index to active project when opened
  useEffect(() => {
    if (isOpen && projects.length > 0) {
      const idx = projects.findIndex((p) => p.id === activeProject?.id);
      setFocusedIndex(idx >= 0 ? idx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, activeProject, projects]);

  const handleSelectProject = useCallback(
    (project: Project) => {
      setActiveProjectId(project.id);
      setIsOpen(false);
      buttonRef.current?.focus();
    },
    [setActiveProjectId]
  );

  // Keyboard Navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < projects.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : projects.length - 1));
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < projects.length) {
          handleSelectProject(projects[focusedIndex]);
        }
        break;

      case 'Tab':
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  if (!projects || projects.length === 0) {
    return (
      <Link
        href="/submit-idea"
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Create Project</span>
      </Link>
    );
  }

  const ActiveIcon = activeProject ? getDomainIcon(activeProject.domain) : Sparkles;
  const activeDomainColor = activeProject ? getDomainColor(activeProject.domain) : { bg: '', text: '', border: '' };

  return (
    <div className="relative inline-block text-left" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current project: ${activeProject ? activeProject.title : 'Select Project'}. Click to switch active project.`}
        className={`group flex items-center gap-1.5 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-lg text-xs font-medium transition-all select-none border min-w-0 max-w-[120px] sm:max-w-[140px] md:max-w-[155px] lg:max-w-[175px] xl:max-w-[200px] 2xl:max-w-[220px] ${
          isOpen
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-indigo-500/60 dark:border-indigo-500/60 ring-2 ring-indigo-500/20'
            : 'bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-900/90 dark:hover:bg-slate-800/80 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
        }`}
        title={activeProject ? `${activeProject.title} (${activeProject.domain})` : 'Select Project'}
      >
        {/* Project Icon */}
        <div className="flex items-center justify-center shrink-0">
          <ActiveIcon className={`h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform`} />
        </div>

        {/* Project Title */}
        <span className="truncate text-[11.5px] sm:text-xs font-semibold text-left">
          {activeProject ? activeProject.title : 'Select Project'}
        </span>

        {/* Downward Chevron */}
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 ml-auto transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Projects list"
          className="absolute left-0 mt-1.5 w-[calc(100vw-32px)] sm:w-80 max-w-[340px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl shadow-slate-950/20 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-left"
        >
          {/* Compact Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
            <div>
              <div className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Switch Project</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Select an active innovation workspace
              </p>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {projects.length}
            </span>
          </div>

          {/* Scrollable Project List */}
          <div
            ref={listRef}
            className="max-h-[260px] overflow-y-auto p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
          >
            {projects.map((p, idx) => {
              const Icon = getDomainIcon(p.domain);
              const domainStyle = getDomainColor(p.domain);
              const isSelected = activeProject?.id === p.id;
              const isFocused = focusedIndex === idx;
              const progressVal = typeof p.progress === 'number' ? p.progress : 0;

              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectProject(p)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex flex-col gap-1.5 cursor-pointer relative group ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-2xs'
                      : isFocused
                      ? 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {/* Top Row: Icon + Title + Selection Indicator / Progress Percentage */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span
                        className={`text-xs font-semibold truncate ${
                          isSelected
                            ? 'text-indigo-950 dark:text-white font-bold'
                            : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                        }`}
                        title={p.title}
                      >
                        {p.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {progressVal}%
                      </span>
                      {isSelected && (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white shrink-0">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Domain Badge + Subtle Progress Bar */}
                  <div className="flex items-center justify-between gap-2 pl-8">
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[9.5px] font-semibold border ${domainStyle.bg} ${domainStyle.text} ${domainStyle.border}`}
                    >
                      {p.domain || 'Innovation'}
                    </span>

                    {/* Compact Micro-Progress Bar */}
                    <div className="h-1 w-14 sm:w-16 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                      <div
                        style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSelected
                            ? 'bg-indigo-600 dark:bg-indigo-400'
                            : progressVal >= 80
                            ? 'bg-emerald-500'
                            : progressVal >= 50
                            ? 'bg-blue-500'
                            : 'bg-slate-400 dark:bg-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sticky Action Footer */}
          <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Link
              href="/submit-idea"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span>Submit New Idea</span>
              </div>
              <ArrowRight className="h-3 w-3 text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
