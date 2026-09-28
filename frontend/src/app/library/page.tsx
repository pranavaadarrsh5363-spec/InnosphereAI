'use client';

import React, { useState, useEffect } from'react';
import Link from'next/link';
import {
 Bookmark,
 Search,
 Trash2,
 ExternalLink,
 Edit2,
 Tag,
} from'lucide-react';
import { api } from'@/lib/api';
import { useProject } from'@/lib/project-context';
import { SavedResource } from'@/types';
import { getDomainColor } from'@/lib/utils';
import { SkeletonList } from'@/components/ui/skeleton';
import { EmptyState } from'@/components/ui/empty-state';

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
 category: selectedCategory !=='all' ? selectedCategory : undefined,
 resource_type: selectedType !=='all' ? selectedType : undefined,
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
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 {/* Header Banner */}
 <div className="rounded-lg bg-slate-50 border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
 <div className="space-y-2">
 <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700">
 <Bookmark className="h-3 w-3" />
 <span>Curated Innovation Stacks</span>
 </div>
 <h1 className="text-xl font-semibold text-slate-900">
 Personal Resource Library
 </h1>
 <p className="text-sm text-slate-600 max-w-2xl">
 Manage your saved academic papers, Kaggle datasets, GitHub codebases, and production toolchains. Add personal notes, organize categories, and run side-by-side comparisons.
 </p>
 </div>

 <div className="flex items-center gap-3">
 <Link
 href="/discover"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
 >
 <span>Discover More Resources</span>
 <ExternalLink className="h-4 w-4" />
 </Link>
 </div>
 </div>

 {/* Filter & Search Bar */}
 <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="w-full sm:w-80 relative">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 onKeyDown={(e) => e.key ==='Enter' && fetchLibrary()}
 placeholder="Search saved resources & notes..."
 className="w-full bg-slate-50 border border-slate-200 rounded-md pl-10 pr-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>

 {/* Categories Pills */}
 <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
 {categories.map((c) => (
 <button
 key={c}
 onClick={() => setSelectedCategory(c)}
 className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
 selectedCategory === c
 ?'bg-indigo-600 border-indigo-600 text-white shadow-sm'
 :'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
 }`}
 >
 {c ==='all' ?'All Saved' : c}
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
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {savedItems.map((item) => {
 const res = item.resource;
 const domainColor = getDomainColor(res.domain);
 const isEditingNote = editingNotesId === item.id;

 return (
 <div
 key={item.id}
 className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
 >
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700 capitalize">
 {res.resource_type.replace('_','')}
 </span>
 <span className={`px-2 py-0.5 rounded text-xs font-medium border ${domainColor.bg} ${domainColor.text} ${domainColor.border}`}>
 {res.domain}
 </span>
 </div>

 <h3 className="text-sm font-semibold text-slate-900 leading-snug">{res.title}</h3>
 <p className="text-sm text-slate-600 line-clamp-3">{res.description}</p>

 {/* Personal Notes Box */}
 <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
 <div className="flex items-center justify-between text-xs text-slate-500">
 <span className="font-medium flex items-center gap-1 text-slate-700">
 <Tag className="h-3 w-3 text-indigo-600" />
 My Notes
 </span>
 {!isEditingNote && (
 <button
 onClick={() => {
 setEditingNotesId(item.id);
 setNoteText(item.notes ||'');
 }}
 className="text-indigo-600 hover:text-indigo-700"
 >
 <Edit2 className="h-3.5 w-3.5" />
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
 className="w-full bg-white border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 <div className="flex justify-end gap-2">
 <button
 onClick={() => setEditingNotesId(null)}
 className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
 >
 Cancel
 </button>
 <button
 onClick={() => handleSaveNotes(item.id)}
 className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium shadow-sm"
 >
 Save
 </button>
 </div>
 </div>
 ) : (
 <p className="text-sm text-slate-600 italic">
 {item.notes ||'No personal notes added yet. Click edit to add findings.'}
 </p>
 )}
 </div>
 </div>

 {/* Footer Controls */}
 <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
 <button
 onClick={() => handleDelete(item.id)}
 className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
 title="Remove from saved library"
 >
 <Trash2 className="h-4 w-4" />
 </button>

 <a
 href={res.url}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
 >
 <span>Open Resource</span>
 <ExternalLink className="h-3.5 w-3.5" />
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
