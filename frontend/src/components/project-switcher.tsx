'use client';

import React, { useState, useRef, useEffect, useCallback } from'react';
import Link from'next/link';
import { useRouter } from'next/navigation';
import {
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
 Folder,
} from'lucide-react';
import { useProject } from'@/lib/project-context';
import { getDomainColor } from'@/lib/utils';
import { Project } from'@/types';

function getDomainIcon(domain: string ='') {
 const d = domain.toLowerCase();
 if (d.includes('health') || d.includes('med') || d.includes('cardio')) return HeartPulse;
 if (d.includes('agri') || d.includes('farm') || d.includes('crop')) return Sprout;
 if (d.includes('waste') || d.includes('env') || d.includes('sustain') || d.includes('water')) return Leaf;
 if (d.includes('traffic') || d.includes('cit') || d.includes('urban') || d.includes('infra')) return Building2;
 if (d.includes('edu') || d.includes('skill') || d.includes('learn')) return GraduationCap;
 if (d.includes('ai') || d.includes('neural') || d.includes('nlp')) return Brain;
 if (d.includes('hard') || d.includes('iot') || d.includes('sensor') || d.includes('edge')) return Cpu;
 if (d.includes('solar') || d.includes('energy') || d.includes('power')) return Zap;
 return Folder;
}

export function ProjectSwitcher() {
 const router = useRouter();
 const { projects, activeProject, setActiveProjectId } = useProject();
 const [isOpen, setIsOpen] = useState(false);
 const [focusedIndex, setFocusedIndex] = useState<number>(-1);

 const containerRef = useRef<HTMLDivElement>(null);
 const buttonRef = useRef<HTMLButtonElement>(null);
 const listRef = useRef<HTMLDivElement>(null);

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

 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (!isOpen) {
 if (e.key ==='ArrowDown' || e.key ==='ArrowUp' || e.key ==='Enter' || e.key ==='') {
 e.preventDefault();
 setIsOpen(true);
 }
 return;
 }

 switch (e.key) {
 case'Escape':
 e.preventDefault();
 setIsOpen(false);
 buttonRef.current?.focus();
 break;
 case'ArrowDown':
 e.preventDefault();
 setFocusedIndex((prev) => (prev < projects.length - 1 ? prev + 1 : 0));
 break;
 case'ArrowUp':
 e.preventDefault();
 setFocusedIndex((prev) => (prev > 0 ? prev - 1 : projects.length - 1));
 break;
 case'Enter':
 case'':
 e.preventDefault();
 if (focusedIndex >= 0 && focusedIndex < projects.length) {
 handleSelectProject(projects[focusedIndex]);
 }
 break;
 case'Tab':
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
 className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
 >
 <Plus className="h-3.5 w-3.5" />
 <span>New Project</span>
 </Link>
 );
 }

 const ActiveIcon = activeProject ? getDomainIcon(activeProject.domain) : Folder;

 return (
 <div className="relative inline-block text-left" ref={containerRef} onKeyDown={handleKeyDown}>
 <button
 ref={buttonRef}
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 aria-haspopup="listbox"
 aria-expanded={isOpen}
 aria-label={`Current project: ${activeProject ? activeProject.title :'Select Project'}`}
 className={`group flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium transition-colors select-none border min-w-0 max-w-[120px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[200px] ${
 isOpen
 ?'bg-slate-100 text-slate-900 border-slate-300'
 :'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
 }`}
 title={activeProject ?`${activeProject.title} (${activeProject.domain})` :'Select Project'}
 >
 <ActiveIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
 <span className="truncate text-xs font-medium text-left">
 {activeProject ? activeProject.title :'Select Project'}
 </span>
 <ChevronDown
 className={`h-3.5 w-3.5 text-slate-400 shrink-0 ml-auto transition-transform duration-150 ${
 isOpen ?'rotate-180' :''
 }`}
 />
 </button>

 {isOpen && (
 <div
 role="listbox"
 aria-label="Projects list"
 className="absolute left-0 mt-1 w-[calc(100vw-32px)] sm:w-72 max-w-[320px] rounded-lg bg-white border border-slate-200 shadow-sm z-50 overflow-hidden"
 >
 <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
 <div className="flex items-center gap-1.5">
 <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
 <span className="text-xs font-medium text-slate-700">Switch Project</span>
 </div>
 <span className="text-xs text-slate-400">{projects.length}</span>
 </div>

 <div ref={listRef} className="max-h-[260px] overflow-y-auto p-1 space-y-0.5">
 {projects.map((p, idx) => {
 const Icon = getDomainIcon(p.domain);
 const isSelected = activeProject?.id === p.id;
 const isFocused = focusedIndex === idx;
 const progressVal = typeof p.progress ==='number' ? p.progress : 0;

 return (
 <button
 key={p.id}
 type="button"
 role="option"
 aria-selected={isSelected}
 onClick={() => handleSelectProject(p)}
 onMouseEnter={() => setFocusedIndex(idx)}
 className={`w-full text-left px-2.5 py-2 rounded-md transition-colors flex items-center gap-2.5 cursor-pointer ${
 isSelected
 ?'bg-indigo-50 text-slate-900'
 : isFocused
 ?'bg-slate-50'
 :'hover:bg-slate-50'
 }`}
 >
 <Icon className={`h-4 w-4 shrink-0 ${isSelected ?'text-indigo-600' :'text-slate-400'}`} />
 <div className="flex-1 min-w-0">
 <span className={`text-sm font-medium block truncate ${isSelected ?'text-slate-900' :'text-slate-700'}`} title={p.title}>
 {p.title}
 </span>
 <span className="text-xs text-slate-400">{p.domain ||'Innovation'} · {progressVal}%</span>
 </div>
 {isSelected && (
 <Check className="h-4 w-4 text-indigo-600 shrink-0" />
 )}
 </button>
 );
 })}
 </div>

 <div className="p-1 border-t border-slate-100">
 <Link
 href="/submit-idea"
 onClick={() => setIsOpen(false)}
 className="flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
 >
 <Plus className="h-3.5 w-3.5" />
 <span>New Project</span>
 </Link>
 </div>
 </div>
 )}
 </div>
 );
}
