import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, Cpu, ExternalLink, GitBranch, BookOpen, Database } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">InnoSphere AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering student innovators with intelligent multi-source resource discovery, automated AI analysis, and production roadmaps.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Multi-Source Data Connectors Online
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/dashboard" className="hover:text-indigo-400 transition-colors">Student Dashboard</Link></li>
              <li><Link href="/submit-idea" className="hover:text-indigo-400 transition-colors">Submit Innovation Idea</Link></li>
              <li><Link href="/discover" className="hover:text-indigo-400 transition-colors">Intelligent Resource Discovery</Link></li>
              <li><Link href="/insights" className="hover:text-indigo-400 transition-colors">AI Insights & Trends</Link></li>
              <li><Link href="/compare" className="hover:text-indigo-400 transition-colors">Resource Comparison Matrix</Link></li>
            </ul>
          </div>

          {/* Col 3: Integrations */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Live Data Integrations</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-indigo-400" /> arXiv Pre-print API</li>
              <li className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-blue-400" /> OpenAlex Scholarly Index</li>
              <li className="flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5 text-purple-400" /> GitHub Open-Source Repositories</li>
              <li className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-amber-400" /> HuggingFace Pretrained Models</li>
              <li className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-teal-400" /> Kaggle & OpenData Portals</li>
            </ul>
          </div>

          {/* Col 4: Evaluator Personas */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Evaluation & Mentorship</h4>
            <p className="text-xs text-slate-400 mb-3">
              Built for universities, hackathons, and student incubators. Switch personas seamlessly in the top navigation.
            </p>
            <div className="flex flex-col gap-1.5 text-xs">
              <Link href="/mentor" className="text-indigo-400 hover:underline flex items-center gap-1">
                Faculty Mentor Review Portal <ExternalLink className="h-3 w-3" />
              </Link>
              <Link href="/analytics" className="text-indigo-400 hover:underline flex items-center gap-1">
                Platform Impact Analytics <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} InnoSphere AI Platform. Turn ideas into verified innovation.</p>
          <div className="flex items-center gap-4">
            <span>Powered by FastAPI + Next.js + Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
