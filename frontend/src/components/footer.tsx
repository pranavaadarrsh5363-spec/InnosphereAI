import React from'react';
import Link from'next/link';
import { Atom, ExternalLink, Activity } from'lucide-react';

export function Footer() {
 return (
 <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6">
 <div className="mx-auto max-w-6xl">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
 {/* Brand */}
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <div className="h-6 w-6 rounded-md bg-indigo-600 text-white flex items-center justify-center">
 <Atom className="h-3.5 w-3.5" />
 </div>
 <span className="text-sm font-semibold text-slate-900">InnoSphere AI</span>
 </div>
 <p className="text-sm text-slate-500 leading-relaxed">
 Academic innovation platform connecting student research with peer-reviewed literature, datasets, and validation evidence.
 </p>
 </div>

 {/* Navigation */}
 <div>
 <h4 className="text-xs font-medium text-slate-400 mb-3">Platform</h4>
 <ul className="space-y-1.5 text-sm">
 <li><Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</Link></li>
 <li><Link href="/projects" className="text-slate-600 hover:text-slate-900 transition-colors">Projects</Link></li>
 <li><Link href="/research" className="text-slate-600 hover:text-slate-900 transition-colors">Research</Link></li>
 <li><Link href="/experiments" className="text-slate-600 hover:text-slate-900 transition-colors">Experiments</Link></li>
 <li><Link href="/discover" className="text-slate-600 hover:text-slate-900 transition-colors">Resources</Link></li>
 </ul>
 </div>

 {/* Data Sources */}
 <div>
 <h4 className="text-xs font-medium text-slate-400 mb-3">Data Sources</h4>
 <ul className="space-y-1.5 text-sm text-slate-600">
 <li>arXiv Preprints</li>
 <li>OpenAlex Scholarly Data</li>
 <li>GitHub Repositories</li>
 <li>Hugging Face Models</li>
 <li>Kaggle Datasets</li>
 </ul>
 </div>

 {/* Evaluation */}
 <div>
 <h4 className="text-xs font-medium text-slate-400 mb-3">Evaluation</h4>
 <ul className="space-y-1.5 text-sm">
 <li>
 <Link href="/mentor" className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
 Mentor Review <ExternalLink className="h-3 w-3 text-slate-400" />
 </Link>
 </li>
 <li>
 <Link href="/analytics" className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
 Analytics <ExternalLink className="h-3 w-3 text-slate-400" />
 </Link>
 </li>
 <li>
 <Link href="/system-status" className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
 System Status <Activity className="h-3 w-3 text-slate-400" />
 </Link>
 </li>
 </ul>
 </div>
 </div>

 <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
 <p>© {new Date().getFullYear()} InnoSphere AI</p>
 <span>FastAPI · Next.js · Gemini</span>
 </div>
 </div>
 </footer>
 );
}
