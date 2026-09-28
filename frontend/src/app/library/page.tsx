'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Search,
  Trash2,
  ExternalLink,
  Edit2,
  Tag,
  Star,
  BookOpen,
  Database,
  GitBranch,
  Cpu,
  Layers,
  Wrench,
  Loader2,
  Scale,
  Plus,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { SavedResource } from '@/types';
import { getDomainColor } from '@/lib/utils';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function ResourceLibraryPage() {
  const { activeProject } = useProject();
  const [savedItems, setSavedItems] = useState<SavedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  const categories = [
    'all',
    'Research Papers',
    'Datasets',
    'Development Tools',
    'APIs & Services',
    'AI Models',
    'General',
  ];

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const data = await api.getLibrary({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        resource_type: selectedType !== 'all' ? selectedType : undefined,
        search: search.trim() || undefined,
      });
      setSavedItems(data || []);
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [selectedCategory, selectedType]);

  const handleDelete = async (savedId: number) => {
    try {
      await api.deleteSavedResource(savedId);
      setSavedItems(savedItems.filter((item) => item.id !== savedId));
    } catch (err) {
      console.error('Error deleting saved resource:', err);
    }
  };

  const handleSaveNotes = async (savedId: number) => {
    try {
      await api.updateSavedResource(savedId, { notes: noteText });
      setSavedItems(
        savedItems.map((item) => (item.id === savedId ? { ...item, notes: noteText } : item))
      );
      setEditingNotesId(null);
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300">
            <Bookmark className="h-3 w-3 text-indigo-400" />
            <span>Curated Innovation Stacks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Personal Resource Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Manage your saved academic papers, Kaggle datasets, GitHub codebases, and production toolchains. Add personal notes, organize categories, and run side-by-side comparisons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/discover"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-colors"
          >
            <span>Discover More Resources</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLibrary()}
            placeholder="Search saved resources & notes..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === c
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c === 'all' ? 'All Saved' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Library Grid */}
      {loading ? (
        <SkeletonList count={6} />
      ) : savedItems.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Your library is currently empty"
          description="Explore resources in the Discover tab and bookmark datasets, research papers, or GitHub repos to save them here."
          actionLabel="Explore Resources Now"
          actionHref="/discover"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item) => {
            const res = item.resource;
            const domainColor = getDomainColor(res.domain);
            const isEditingNote = editingNotesId === item.id;

            return (
              <div
                key={item.id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 capitalize">
                      {res.resource_type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
                      {res.domain}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">{res.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{res.description}</p>

                  {/* Personal Notes Box */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold flex items-center gap-1 text-slate-300">
                        <Tag className="h-3 w-3 text-indigo-400" />
                        My Notes & Findings
                      </span>
                      {!isEditingNote && (
                        <button
                          onClick={() => {
                            setEditingNotesId(item.id);
                            setNoteText(item.notes || '');
                          }}
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {isEditingNote ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add your notes about benchmark accuracy, setup steps..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="px-2 py-0.5 text-[10px] text-slate-400"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNotes(item.id)}
                            className="px-2.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 italic">
                        {item.notes || 'No personal notes added yet. Click edit to add findings.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Remove from saved library"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
