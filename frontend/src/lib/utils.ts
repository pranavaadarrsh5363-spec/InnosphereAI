import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'Recent';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export function getDomainColor(domain: string): { bg: string; text: string; border: string } {
  const d = domain.toLowerCase();
  if (d.includes('health') || d.includes('med')) {
    return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
  }
  if (d.includes('agri') || d.includes('farm')) {
    return { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' };
  }
  if (d.includes('waste') || d.includes('env') || d.includes('sustain')) {
    return { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' };
  }
  if (d.includes('traffic') || d.includes('cit') || d.includes('trans')) {
    return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
  }
  if (d.includes('edu') || d.includes('skill')) {
    return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' };
  }
  if (d.includes('ai') || d.includes('learn') || d.includes('robot')) {
    return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
  }
  if (d.includes('sec') || d.includes('cyber')) {
    return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' };
  }
  return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
}
