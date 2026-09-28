import React from 'react';
import Link from 'next/link';
import { Atom, Shield, Cpu, ExternalLink, GitBranch, BookOpen, Database, Activity } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                <Atom className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">InnoSphere AI</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Academic innovation and research platform connecting student concepts with peer-reviewed literature, benchmark datasets, empirical experiment tracking, and validation evidence.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Scientific Data Connectors Active
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/dashboard" className="hover:text-blue-600 transition-colors">Student Dashboard</Link></li>
              <li><Link href="/projects" className="hover:text-blue-600 transition-colors">Projects Directory</Link></li>
              <li><Link href="/research" className="hover:text-blue-600 transition-colors">Research & Paper Workspace</Link></li>
              <li><Link href="/experiments" className="hover:text-blue-600 transition-colors">Experiment Hub & Reproducibility</Link></li>
              <li><Link href="/discover" className="hover:text-blue-600 transition-colors">Resource Discovery Engine</Link></li>
            </ul>
          </div>

          {/* Col 3: Research Sources */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Research & Code Data Sources</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-slate-400" /> arXiv Preprints & IEEE Citations</li>
              <li className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-slate-400" /> OpenAlex Scholarly Knowledgebase</li>
              <li className="flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5 text-slate-400" /> GitHub Open-Source Repositories</li>
              <li className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-slate-400" /> Hugging Face Model Hub</li>
              <li className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-slate-400" /> Kaggle & Open Data Portals</li>
            </ul>
          </div>

          {/* Col 4: Evaluator Personas */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Evaluation & Mentorship</h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Designed for university innovation centers, research laboratories, capstone project committees, and academic competitions.
            </p>
            <div className="flex flex-col gap-1.5 text-xs">
              <Link href="/mentor" className="text-blue-600 hover:underline flex items-center gap-1">
                Faculty Mentor Review Portal <ExternalLink className="h-3 w-3" />
              </Link>
              <Link href="/analytics" className="text-blue-600 hover:underline flex items-center gap-1">
                Cohort Analytics & Impact <ExternalLink className="h-3 w-3" />
              </Link>
              <Link href="/system-status" className="text-blue-600 hover:underline flex items-center gap-1">
                System Diagnostics & Health <Activity className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} InnoSphere AI. University Innovation & Research Platform.</p>
          <div className="flex items-center gap-4">
            <span>FastAPI • Next.js • Google Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
