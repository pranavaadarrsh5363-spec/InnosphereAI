'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info, X, Calculator } from 'lucide-react';
import { SCORING_FORMULAS, ScoreFormulaConfig } from '@/config/scoring-formulas';

interface ScoreTooltipProps {
  scoreKey: 'feasibility' | 'novelty' | 'market_potential' | 'risk';
  value?: number | string;
  className?: string;
  badgeLabel?: string;
}

export function ScoreTooltip({ scoreKey, value, className = '', badgeLabel }: ScoreTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const formulaConfig: ScoreFormulaConfig = SCORING_FORMULAS[scoreKey];

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

  if (!formulaConfig) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
        title={`Click to inspect ${formulaConfig.title} formula & weight breakdown`}
        aria-label={`Inspect ${formulaConfig.title} calculation formula`}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-3.5 z-50 text-left text-xs animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-900">{formulaConfig.title}</span>
              {value !== undefined && (
                <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {value}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-slate-600 mb-2 leading-relaxed text-[11px]">
            {formulaConfig.description}
          </p>

          {/* Formula Line */}
          <div className="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[10.5px] text-slate-700 mb-2.5 break-words">
            {formulaConfig.formula}
          </div>

          {/* Factor Breakdown */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-800 text-[11px] block">Factor Weightings:</span>
            {formulaConfig.factors.map((factor, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 border-t border-slate-100 pt-1 text-[10.5px]">
                <div className="flex-1">
                  <span className="font-medium text-slate-800">{factor.name}</span>
                  <p className="text-slate-500 text-[10px] leading-tight">{factor.desc}</p>
                </div>
                <span className="font-semibold text-indigo-600 shrink-0">
                  {factor.weight}%
                </span>
              </div>
            ))}
          </div>

          {badgeLabel && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>Origin:</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                {badgeLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
