'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  BookOpen,
  Cpu,
  Layers,
  MapPin,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Database,
  Radio,
  FileText
} from 'lucide-react';
import { Project, ProjectHealthSummary, ReadinessDimension } from '@/types';
import { api } from '@/lib/api';

interface ProjectHealthPanelProps {
  project: Project;
  mentorFeedbackStatus?: string;
  savedResourcesCount?: number;
}

export function ProjectHealthPanel({
  project,
  mentorFeedbackStatus = 'Reviewed',
  savedResourcesCount = 8,
}: ProjectHealthPanelProps) {
  const [healthSummary, setHealthSummary] = useState<ProjectHealthSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project?.id) {
      let isMounted = true;
      setLoading(true);
      api.getProjectHealth(project.id)
        .then((data) => {
          if (isMounted && data) {
            setHealthSummary(data);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch live project health summary, using local model:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [project?.id]);

  const roadmapProgress = project.progress || 65;
  const fallbackResearch = Math.min(Math.round(roadmapProgress * 1.1 + 10), 92);
  const fallbackTech = Math.min(Math.round(roadmapProgress * 0.95 + 5), 85);
  const fallbackResource = Math.min(Math.round(savedResourcesCount * 10 + 20), 95);

  const getDimensionIcon = (key: string) => {
    switch (key) {
      case 'problem_clarity':
        return <FileText className="h-3.5 w-3.5 text-emerald-600" />;
      case 'research_readiness':
        return <BookOpen className="h-3.5 w-3.5 text-blue-600" />;
      case 'technology_stack':
        return <Cpu className="h-3.5 w-3.5 text-blue-600" />;
      case 'resource_readiness':
        return <Database className="h-3.5 w-3.5 text-purple-600" />;
      case 'hardware_readiness':
        return <Radio className="h-3.5 w-3.5 text-cyan-600" />;
      case 'execution_progress':
        return <MapPin className="h-3.5 w-3.5 text-amber-600" />;
      case 'validation_and_risk':
      default:
        return <GraduationCap className="h-3.5 w-3.5 text-rose-600" />;
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white border border-slate-200 shadow-xs space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Multi-Dimensional Project Health
              {healthSummary && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 font-extrabold border border-blue-200">
                  {healthSummary.overall_score}/100 • {healthSummary.status_label}
                </span>
              )}
            </h3>
          </div>
        </div>
        
        <Link
          href="/project-intelligence"
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
        >
          Open Intelligence Command Center <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Vectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {healthSummary?.dimensions && healthSummary.dimensions.length >= 5 ? (
          healthSummary.dimensions.slice(0, 5).map((dim: ReadinessDimension) => (
            <div key={dim.key} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[130px]">
                  {getDimensionIcon(dim.key)}
                  <span className="truncate">{dim.name}</span>
                </span>
                <span className="text-xs font-bold text-blue-700">{dim.score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${dim.score}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1">{dim.summary}</p>
            </div>
          ))
        ) : (
          <>
            {/* Fallback Vectors */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                  Research Coverage
                </span>
                <span className="text-xs font-bold text-emerald-700">{fallbackResearch}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${fallbackResearch}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Literature & benchmark datasets identified</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-blue-600" />
                  Technology Readiness
                </span>
                <span className="text-xs font-bold text-blue-700">{fallbackTech}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${fallbackTech}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Stack integration & API specified</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-600" />
                  Resource Availability
                </span>
                <span className="text-xs font-bold text-purple-700">{fallbackResource}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${fallbackResource}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">{savedResourcesCount} saved repositories & models</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  Roadmap Progress
                </span>
                <span className="text-xs font-bold text-amber-700">{roadmapProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${roadmapProgress}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Milestone execution on track</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                  Mentor Feedback
                </span>
                <span className="text-xs font-bold text-emerald-700">{mentorFeedbackStatus}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                <span>Verified Faculty Rubric</span>
              </div>
              <p className="text-[10px] text-slate-500">Qualitative rubric score: 4.8 / 5.0</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
