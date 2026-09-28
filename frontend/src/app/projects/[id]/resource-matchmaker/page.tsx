'use client';

import React, { useState, useEffect } from'react';
import { useParams, useRouter } from'next/navigation';
import Link from'next/link';
import {
 SlidersHorizontal,
 Search,
 Sparkles,
 ArrowRight,
 ExternalLink,
 Layers,
 CheckCircle2,
 AlertTriangle,
 FileText,
 Activity,
 Cpu,
 RefreshCw,
 Award,
 Bookmark,
 Share2,
 Atom,
 DollarSign,
 TrendingDown,
 ShieldCheck,
 Zap,
 HelpCircle,
 Filter,
 Check,
 ChevronDown,
 ChevronRight,
 Database,
 Code,
 Gauge,
 Sliders,
 Wallet,
 Download,
 Copy,
 MessageSquare,
 Bot,
 Send,
 X,
 Plus,
 Trash2,
 Edit3,
 TrendingUp,
 Brain,
 ShieldAlert,
 MapPin,
 CheckSquare,
 Square,
 Info,
 Clock,
 PieChart,
 HardDrive
} from'lucide-react';
import { api, resourceMatchmakerApi } from'@/lib/api';
import { Project } from'@/types';

export default function ProjectResourceMatchmakerWorkspacePage() {
 const params = useParams();
 const router = useRouter();
 const projectId = Number(params?.id);

 const [project, setProject] = useState<Project | null>(null);
 const [workspace, setWorkspace] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);

 // Active Tab
 const [activeTab, setActiveTab] = useState<
 |'overview'
 |'requirements'
 |'matches'
 |'alternatives'
 |'budget'
 |'bundles'
 |'hardware'
 |'skills'
 |'plan'
 |'whatif'
 |'evidence'
 >('overview');

 // Filter & Search inside matches
 const [matchCategoryFilter, setMatchCategoryFilter] = useState('ALL');
 const [matchSearch, setMatchSearch] = useState('');

 // AI Assistant Chat State
 const [assistantOpen, setAssistantOpen] = useState(false);
 const [assistantQuery, setAssistantQuery] = useState('');
 const [assistantMessages, setAssistantMessages] = useState<
 Array<{ role:'user' |'assistant'; content: string; grounded?: any[]; actions?: string[] }>
 >([
 {
 role:'assistant',
 content:
'Hello! I am your AI Resource Matchmaker Assistant. I can help you evaluate hardware sizing, find zero-cost open-source alternatives, prevent budget overruns, and configure edge microcontrollers for your project.',
 actions: [
'Can I run this on an ESP32 or Raspberry Pi?',
'What open-source alternatives exist to replace cloud APIs?',
'How can I cut my total project budget in half?',
 ],
 },
 ]);
 const [assistantLoading, setAssistantLoading] = useState(false);

 // Export State
 const [exportModalOpen, setExportModalOpen] = useState(false);
 const [exportFormat, setExportFormat] = useState<'markdown' |'json' |'csv' |'svg'>('markdown');
 const [exportData, setExportData] = useState<any>(null);
 const [exportLoading, setExportLoading] = useState(false);
 const [copied, setCopied] = useState(false);

 // Modals for CRUD
 const [reqModalOpen, setReqModalOpen] = useState(false);
 const [newReq, setNewReq] = useState({
 name:'',
 category:'HARDWARE',
 description:'',
 priority:'HIGH',
 is_hard_constraint: true,
 });

 const [planModalOpen, setPlanModalOpen] = useState(false);
 const [newPlanItem, setNewPlanItem] = useState({
 resource_name:'',
 resource_category:'HARDWARE',
 purpose:'',
 quantity: 1,
 estimated_cost: 0,
 currency:'INR',
 availability_status:'PURCHASE_REQUIRED',
 plan_status:'SHORTLISTED',
 source_name:'',
 source_url:'',
 notes:'',
 });

 const [profileModalOpen, setProfileModalOpen] = useState(false);
 const [editProfile, setEditProfile] = useState<any>({});

 const [hwModalOpen, setHwModalOpen] = useState(false);
 const [newHwItem, setNewHwItem] = useState({
 name:'',
 category:'Microcontroller',
 quantity: 1,
 condition:'GOOD',
 ownership_status:'OWNED',
 interfaces_json: ['GPIO','I2C'],
 specs_json: {},
 notes:'',
 });

 // What-If State
 const [whatIfBudget, setWhatIfBudget] = useState(5000);
 const [whatIfGpu, setWhatIfGpu] = useState(false);
 const [whatIfOpenSourceOnly, setWhatIfOpenSourceOnly] = useState(true);
 const [whatIfOfflineOnly, setWhatIfOfflineOnly] = useState(false);
 const [whatIfSkill, setWhatIfSkill] = useState('INTERMEDIATE');
 const [whatIfResult, setWhatIfResult] = useState<any>(null);
 const [whatIfSimulating, setWhatIfSimulating] = useState(false);

 // Notification Toast
 const [toastMessage, setToastMessage] = useState<string | null>(null);

 function showToast(msg: string) {
 setToastMessage(msg);
 setTimeout(() => setToastMessage(null), 4000);
 }

 // Initial Load
 useEffect(() => {
 if (!projectId) return;

 async function loadWorkspace() {
 setLoading(true);
 try {
 const [pRes, wsRes] = await Promise.allSettled([
 api.getProject(projectId),
 resourceMatchmakerApi.getWorkspace(projectId),
 ]);

 if (pRes.status ==='fulfilled') {
 setProject(pRes.value);
 }
 if (wsRes.status ==='fulfilled') {
 const ws = wsRes.value;
 setWorkspace(ws);
 setEditProfile(ws.profile || {});
 if (ws.profile?.total_budget) {
 setWhatIfBudget(Math.round(ws.profile.total_budget * 0.7));
 }
 }
 } catch (err) {
 console.error('Failed to load workspace:', err);
 } finally {
 setLoading(false);
 }
 }

 loadWorkspace();
 }, [projectId]);

 // Trigger Fresh Matching
 async function handleRefreshMatching() {
 setRefreshing(true);
 try {
 const updated = await resourceMatchmakerApi.triggerAnalysis(projectId);
 setWorkspace(updated);
 setEditProfile(updated.profile || {});
 showToast('AI Resource Matching & Budget Analysis refreshed successfully!');
 } catch (err: any) {
 showToast('Failed to refresh matching:' + (err.message || err));
 } finally {
 setRefreshing(false);
 }
 }

 // Create Custom Requirement
 async function handleCreateRequirement(e: React.FormEvent) {
 e.preventDefault();
 if (!newReq.name) return;
 try {
 const created = await resourceMatchmakerApi.createRequirement(projectId, newReq);
 setWorkspace((prev: any) => ({
 ...prev,
 requirements: [...(prev?.requirements || []), created],
 }));
 setReqModalOpen(false);
 setNewReq({ name:'', category:'HARDWARE', description:'', priority:'HIGH', is_hard_constraint: true });
 showToast(`Added requirement: ${created.name}`);
 } catch (err: any) {
 showToast('Error adding requirement:' + (err.message || err));
 }
 }

 // Delete Requirement
 async function handleDeleteRequirement(reqId: number) {
 try {
 await resourceMatchmakerApi.deleteRequirement(projectId, reqId);
 setWorkspace((prev: any) => ({
 ...prev,
 requirements: prev.requirements.filter((r: any) => r.id !== reqId),
 }));
 showToast('Requirement removed');
 } catch (err: any) {
 showToast('Error deleting requirement:' + (err.message || err));
 }
 }

 // Update Profile
 async function handleSaveProfile(e: React.FormEvent) {
 e.preventDefault();
 try {
 const updated = await resourceMatchmakerApi.updateProfile(projectId, editProfile);
 setWorkspace((prev: any) => ({
 ...prev,
 profile: updated,
 }));
 setProfileModalOpen(false);
 showToast('Resource Profile & Budget Constraints updated!');
 } catch (err: any) {
 showToast('Error updating profile:' + (err.message || err));
 }
 }

 // Add Item to Plan directly from matches or modal
 async function handleAddMatchToPlan(match: any) {
 try {
 const planPayload = {
 resource_name: match.resource_name,
 resource_category: match.resource_category,
 purpose: match.why_matched_json?.[0] ||'Allocated candidate resource',
 quantity: 1,
 estimated_cost: match.estimated_cost || 0,
 currency: match.currency ||'INR',
 availability_status: match.availability_status ||'PURCHASE_REQUIRED',
 plan_status:'SHORTLISTED',
 source_name:'AI Matchmaker',
 notes:`Matched with ${match.overall_match_score?.toFixed(0)}% overall compatibility score.`,
 };

 const created = await resourceMatchmakerApi.addPlanItem(projectId, planPayload);
 setWorkspace((prev: any) => ({
 ...prev,
 plan_items: [...(prev?.plan_items || []), created],
 }));
 showToast(`Added"${match.resource_name}" to Project Plan!`);
 } catch (err: any) {
 showToast('Failed to add to plan:' + (err.message || err));
 }
 }

 // Custom Plan Item Create
 async function handleCreatePlanItem(e: React.FormEvent) {
 e.preventDefault();
 if (!newPlanItem.resource_name) return;
 try {
 const created = await resourceMatchmakerApi.addPlanItem(projectId, newPlanItem);
 setWorkspace((prev: any) => ({
 ...prev,
 plan_items: [...(prev?.plan_items || []), created],
 }));
 setPlanModalOpen(false);
 setNewPlanItem({
 resource_name:'',
 resource_category:'HARDWARE',
 purpose:'',
 quantity: 1,
 estimated_cost: 0,
 currency:'INR',
 availability_status:'PURCHASE_REQUIRED',
 plan_status:'SHORTLISTED',
 source_name:'',
 source_url:'',
 notes:'',
 });
 showToast(`Added"${created.resource_name}" to Plan`);
 } catch (err: any) {
 showToast('Error adding plan item:' + (err.message || err));
 }
 }

 // Update Plan Item Status
 async function handleUpdatePlanStatus(itemId: number, newStatus: string) {
 try {
 const updated = await resourceMatchmakerApi.updatePlanItem(projectId, itemId, {
 plan_status: newStatus,
 });
 setWorkspace((prev: any) => ({
 ...prev,
 plan_items: prev.plan_items.map((it: any) => (it.id === itemId ? updated : it)),
 }));
 showToast(`Plan item status updated to ${newStatus}`);
 } catch (err: any) {
 showToast('Error updating plan item:' + (err.message || err));
 }
 }

 // Delete Plan Item
 async function handleDeletePlanItem(itemId: number) {
 try {
 await resourceMatchmakerApi.deletePlanItem(projectId, itemId);
 setWorkspace((prev: any) => ({
 ...prev,
 plan_items: prev.plan_items.filter((it: any) => it.id !== itemId),
 }));
 showToast('Plan item removed');
 } catch (err: any) {
 showToast('Error deleting plan item:' + (err.message || err));
 }
 }

 // Add Owned Hardware
 async function handleAddOwnedHardware(e: React.FormEvent) {
 e.preventDefault();
 if (!newHwItem.name) return;
 try {
 const currentHw = workspace.profile?.owned_hardware || [];
 const updatedHwList = [...currentHw, newHwItem];
 const updatedProfile = await resourceMatchmakerApi.updateProfile(projectId, {
 owned_hardware: updatedHwList,
 });
 setWorkspace((prev: any) => ({
 ...prev,
 profile: updatedProfile,
 }));
 setHwModalOpen(false);
 setNewHwItem({
 name:'',
 category:'Microcontroller',
 quantity: 1,
 condition:'GOOD',
 ownership_status:'OWNED',
 interfaces_json: ['GPIO','I2C'],
 specs_json: {},
 notes:'',
 });
 showToast(`Added ${newHwItem.name} to Student Hardware Inventory!`);
 } catch (err: any) {
 showToast('Failed to add hardware:' + (err.message || err));
 }
 }

 // Adopt Resource Bundle
 async function handleAdoptBundle(bundle: any) {
 try {
 const items = bundle.items_json || [];
 let count = 0;
 for (const item of items) {
 await resourceMatchmakerApi.addPlanItem(projectId, {
 resource_name: item.name || item.resource_name,
 resource_category: item.category ||'SOFTWARE',
 purpose:`Adopted from ${bundle.name} bundle`,
 quantity: 1,
 estimated_cost: item.estimated_cost || item.cost || 0,
 currency: bundle.currency ||'INR',
 plan_status:'SHORTLISTED',
 notes: item.notes ||`Included in ${bundle.bundle_type} stack.`,
 });
 count++;
 }
 // Reload workspace
 const updated = await resourceMatchmakerApi.getWorkspace(projectId);
 setWorkspace(updated);
 showToast(`Successfully adopted ${bundle.name} (${count} resources added to plan)!`);
 setActiveTab('plan');
 } catch (err: any) {
 showToast('Failed to adopt bundle:' + (err.message || err));
 }
 }

 // Run What-If Simulation
 async function handleRunWhatIf() {
 setWhatIfSimulating(true);
 try {
 const result = await resourceMatchmakerApi.simulateWhatIf(projectId, {
 scenario_name:`Budget ₹${whatIfBudget} Simulation`,
 adjusted_budget: whatIfBudget,
 gpu_available: whatIfGpu,
 open_source_only: whatIfOpenSourceOnly,
 offline_only: whatIfOfflineOnly,
 student_skill_level: whatIfSkill,
 });
 setWhatIfResult(result);
 showToast('What-If Scenario simulated successfully!');
 } catch (err: any) {
 showToast('Simulation failed:' + (err.message || err));
 } finally {
 setWhatIfSimulating(false);
 }
 }

 // Assistant Query
 async function handleSendAssistantMessage(customPrompt?: string) {
 const textToSend = customPrompt || assistantQuery;
 if (!textToSend.trim()) return;

 const userMsg = { role:'user' as const, content: textToSend };
 setAssistantMessages((prev) => [...prev, userMsg]);
 setAssistantQuery('');
 setAssistantLoading(true);

 try {
 const reply = await resourceMatchmakerApi.askAssistant(projectId, textToSend);
 setAssistantMessages((prev) => [
 ...prev,
 {
 role:'assistant',
 content: reply.answer,
 grounded: reply.grounded_resources,
 actions: reply.suggested_actions,
 },
 ]);
 } catch (err: any) {
 setAssistantMessages((prev) => [
 ...prev,
 {
 role:'assistant',
 content:'Sorry, I encountered an issue processing your query:' + (err.message || err),
 },
 ]);
 } finally {
 setAssistantLoading(false);
 }
 }

 // Export Report
 async function handleExport(format:'markdown' |'json' |'csv' |'svg') {
 setExportFormat(format);
 setExportLoading(true);
 setExportModalOpen(true);
 setCopied(false);
 try {
 const data = await resourceMatchmakerApi.exportReport(projectId, format);
 setExportData(data);
 } catch (err: any) {
 showToast('Export failed:' + (err.message || err));
 } finally {
 setExportLoading(false);
 }
 }

 function handleCopyExport() {
 if (!exportData?.data) return;
 navigator.clipboard.writeText(exportData.data);
 setCopied(true);
 setTimeout(() => setCopied(false), 3000);
 }

 function handleDownloadExport() {
 if (!exportData?.data) return;
 const blob = new Blob([exportData.data], { type: exportData.content_type ||'text/plain' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = exportData.filename ||`resource-allocation-${projectId}.${exportFormat}`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 }

 // Filtered matches
 const filteredMatches = (workspace?.matches || []).filter((m: any) => {
 const matchesCat = matchCategoryFilter ==='ALL' || m.resource_category === matchCategoryFilter;
 const matchesSearch =
 !matchSearch ||
 m.resource_name.toLowerCase().includes(matchSearch.toLowerCase()) ||
 (m.why_matched_json && m.why_matched_json.some((w: string) => w.toLowerCase().includes(matchSearch.toLowerCase())));
 return matchesCat && matchesSearch;
 });

 const categories: string[] = [
'ALL',
 ...Array.from(new Set<string>((workspace?.matches || []).map((m: any) => String(m.resource_category ||'')).filter(Boolean))),
 ];

 if (loading) {
 return (
 <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
 <div className="h-12 w-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-spin">
 <SlidersHorizontal className="w-6 h-6" />
 </div>
 <p className="text-sm font-semibold text-slate-600">
 Loading AI Resource Matchmaker Workspace...
 </p>
 </div>
 );
 }

 const profile = workspace?.profile || {};
 const budgetSummary = workspace?.budget_summary || {
 total_budget: 10000,
 allocated_budget: 0,
 remaining_budget: 10000,
 currency:'INR',
 utilization_percentage: 0,
 breakdown_by_category: {},
 recurring_monthly_total: 0,
 potential_savings_via_alternatives: 0,
 };
 const readiness = workspace?.readiness || {};
 const requirements = workspace?.requirements || [];
 const matches = workspace?.matches || [];
 const alternatives = workspace?.alternatives || [];
 const bundles = workspace?.bundles || [];
 const planItems = workspace?.plan_items || [];
 const ownedHardware = profile?.owned_hardware || [];
 const skills = profile?.skills || [];
 const risks = workspace?.risks || [];

 return (
 <div className="min-h-screen bg-slate-50/50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8">
 <div className="max-w-6xl mx-auto space-y-6">
 {/* Top Breadcrumb & Actions Bar */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-2 text-xs text-slate-500">
 <Link href="/resource-matchmaker" className="hover:text-emerald-500 transition-colors">
 Resource Matchmaker
 </Link>
 <ChevronRight className="w-3.5 h-3.5" />
 <Link href={`/projects/${projectId}`} className="hover:text-emerald-500 transition-colors truncate max-w-xs">
 {project?.title ||`Project #${projectId}`}
 </Link>
 <ChevronRight className="w-3.5 h-3.5" />
 <span className="text-slate-900 font-semibold">Allocation Workspace</span>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button
 onClick={handleRefreshMatching}
 disabled={refreshing}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${refreshing ?'animate-spin' :''}`} />
 <span>{refreshing ?'Re-analyzing...' :'Refresh Matching'}</span>
 </button>

 <button
 onClick={() => setAssistantOpen(true)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
 >
 <Bot className="w-3.5 h-3.5" />
 <span>AI Matchmaker Assistant</span>
 </button>

 <button
 onClick={() => handleExport('markdown')}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
 >
 <Download className="w-3.5 h-3.5" />
 <span>Export Report</span>
 </button>
 </div>
 </div>

 {/* Hero Header Card with Live Budget KPIs */}
 <div className="via-white text-slate-900 rounded-lg p-6 sm:p-8 border border-emerald-200/80 shadow-sm relative overflow-hidden space-y-6">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
 <div className="space-y-2 max-w-2xl">
 <div className="flex flex-wrap items-center gap-2">
 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
 {project?.domain ||'Innovation Project'}
 </span>
 <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
 Stage: {profile.project_stage ||'Prototyping'}
 </span>
 <span className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
 Preference: {profile.open_source_preference ||'Open Source Preferred'}
 </span>
 </div>

 <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-slate-900">
 {project?.title || workspace?.project_title}
 </h1>

 <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
 {project?.proposed_solution || project?.problem_statement ||'Intelligent resource allocation & matching plan.'}
 </p>
 </div>

 <button
 onClick={() => {
 setEditProfile(profile);
 setProfileModalOpen(true);
 }}
 className="self-start lg:self-center inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-sm"
 >
 <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
 <span>Edit Budget & Constraints</span>
 </button>
 </div>

 {/* KPI Mini-Dashboard */}
 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-200/80 relative z-10">
 <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1 shadow-sm">
 <div className="flex items-center justify-between text-slate-500 text-xs">
 <span>Total Budget Cap</span>
 <Wallet className="w-3.5 h-3.5 text-emerald-600" />
 </div>
 <p className="text-lg font-semibold text-slate-900">
 ₹{budgetSummary.total_budget?.toLocaleString() ||'0'}
 </p>
 </div>

 <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1 shadow-sm">
 <div className="flex items-center justify-between text-slate-500 text-xs">
 <span>Allocated Outlay</span>
 <DollarSign className="w-3.5 h-3.5 text-cyan-600" />
 </div>
 <p className="text-lg font-semibold text-cyan-700">
 ₹{budgetSummary.allocated_budget?.toLocaleString() ||'0'}
 </p>
 </div>

 <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1 shadow-sm">
 <div className="flex items-center justify-between text-slate-500 text-xs">
 <span>Remaining Funds</span>
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
 </div>
 <p className="text-lg font-semibold text-emerald-700">
 ₹{budgetSummary.remaining_budget?.toLocaleString() ||'0'}
 </p>
 </div>

 <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1 shadow-sm">
 <div className="flex items-center justify-between text-slate-500 text-xs">
 <span>Potential Savings</span>
 <TrendingDown className="w-3.5 h-3.5 text-purple-600" />
 </div>
 <p className="text-lg font-semibold text-purple-700">
 ₹{budgetSummary.potential_savings_via_alternatives?.toLocaleString() ||'0'}
 </p>
 </div>

 <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1 col-span-2 sm:col-span-4 lg:col-span-1 shadow-sm">
 <div className="flex items-center justify-between text-slate-500 text-xs">
 <span>Overall Readiness</span>
 <Activity className="w-3.5 h-3.5 text-amber-600" />
 </div>
 <p className="text-lg font-semibold text-amber-700">
 {readiness.overall_readiness ||'READY'}
 </p>
 </div>
 </div>

 <div className="absolute right-0 top-0 bottom-0 w-1/3 to-transparent pointer-events-none" />
 </div>

 {/* Tab Navigation */}
 <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 text-xs scrollbar-none">
 {[
 { id:'overview', label:'Overview', icon: LayoutGridIcon },
 { id:'requirements', label:`Requirements (${requirements.length})`, icon: CheckSquare },
 { id:'matches', label:`Ranked Matches (${matches.length})`, icon: SlidersHorizontal },
 { id:'alternatives', label:`Open-Source Subs (${alternatives.length})`, icon: TrendingDown },
 { id:'budget', label:'Budget Planner', icon: Wallet },
 { id:'bundles', label:`Curated Bundles (${bundles.length})`, icon: Layers },
 { id:'hardware', label:`Hardware & Compute (${ownedHardware.length})`, icon: Cpu },
 { id:'skills', label:`Skills Fit (${skills.length})`, icon: Brain },
 { id:'plan', label:`Project Plan (${planItems.length})`, icon: CheckCircle2 },
 { id:'whatif', label:'What-If Simulator', icon: Gauge },
 { id:'evidence', label:'Evidence & Audit', icon: ShieldCheck },
 ].map((tab) => {
 const Icon = tab.icon || SlidersHorizontal;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
 isActive
 ?'bg-emerald-600 text-white shadow-sm'
 :'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
 }`}
 >
 <Icon className="w-3.5 h-3.5" />
 <span>{tab.label}</span>
 </button>
 );
 })}
 </div>

 {/* TAB 1: OVERVIEW */}
 {activeTab ==='overview' && (
 <div className="space-y-6">
 {/* 6-Dimension Readiness Matrix */}
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Multi-Dimensional Project Readiness Matrix
 </h3>
 <p className="text-xs text-slate-500">
 Real-time verification across hardware availability, software compatibility, compute, and student skills.
 </p>
 </div>
 <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
 {readiness.overall_readiness ||'READY'}
 </span>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
 {[
 { label:'Hardware', status: readiness.hardware_readiness ||'READY', icon: Cpu },
 { label:'Software', status: readiness.software_readiness ||'READY', icon: Code },
 { label:'Datasets', status: readiness.dataset_readiness ||'READY', icon: Database },
 { label:'Compute', status: readiness.compute_readiness ||'READY', icon: HardDrive },
 { label:'Cloud Tiers', status: readiness.cloud_readiness ||'READY', icon: Zap },
 { label:'Skills Fit', status: readiness.skills_readiness ||'READY', icon: Brain },
 ].map((item) => (
 <div
 key={item.label}
 className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-1"
 >
 <item.icon className="w-4 h-4 mx-auto text-slate-400" />
 <span className="text-xs font-semibold text-slate-700">{item.label}</span>
 <p className="text-xs font-bold text-emerald-600">
 {item.status}
 </p>
 </div>
 ))}
 </div>

 {readiness.readiness_notes && readiness.readiness_notes.length > 0 && (
 <div className="space-y-1.5 pt-2">
 <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
 Readiness Evaluation Notes:
 </span>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {readiness.readiness_notes.map((note: string, idx: number) => (
 <div
 key={idx}
 className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600"
 >
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
 <span>{note}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Waste Warnings & Optimization Insights */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Optimization Insights */}
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-emerald-500" />
 <h3 className="font-bold text-sm text-slate-900">
 AI Optimization & Cost-Saving Recommendations
 </h3>
 </div>
 <div className="space-y-2">
 {(workspace?.optimization_insights || [
'Adopting local INT8 quantization eliminates recurring cloud inference fees.',
'Student owns compatible ESP32 board, eliminating ₹1,200 redundant controller purchase.',
'Kaggle public agriculture dataset satisfies training requirement at ₹0 cost.',
 ]).map((insight: string, idx: number) => (
 <div
 key={idx}
 className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-700 flex items-start gap-2.5"
 >
 <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
 <span>{insight}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Waste Warnings */}
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
 <div className="flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-500" />
 <h3 className="font-bold text-sm text-slate-900">
 Resource Waste & Redundancy Warnings
 </h3>
 </div>
 <div className="space-y-2">
 {(workspace?.waste_warnings || [
'Commercial cloud GPU instances are unnecessary for 2.5K sample tabular inference.',
'Avoid paid proprietary database subscriptions for prototype testing.',
 ]).map((warning: string, idx: number) => (
 <div
 key={idx}
 className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-700 flex items-start gap-2.5"
 >
 <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <span>{warning}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Identified Risks & Mitigations */}
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
 <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
 <ShieldAlert className="w-4 h-4 text-red-500" />
 Resource Allocation Risks & Defenses
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {(risks.length > 0
 ? risks
 : [
 {
 risk_category:'Budget',
 severity:'LOW',
 evidence:'Current allocation ₹600 is well below ₹5,000 cap.',
 impact:'No budget overrun risk.',
 mitigation:'Lock procurement to approved open hardware vendors.',
 },
 {
 risk_category:'Compute',
 severity:'MEDIUM',
 evidence:'ESP32 SRAM limit is 520KB.',
 impact:'Unquantized neural net may cause memory overflow.',
 mitigation:'Apply TensorFlow Lite Micro INT8 weight quantization.',
 },
 {
 risk_category:'Licensing',
 severity:'LOW',
 evidence:'All suggested tools use MIT or Apache 2.0 licenses.',
 impact:'Permissive student innovation IP.',
 mitigation:'Retain open source attribution in documentation.',
 },
 ]
 ).map((r: any, idx: number) => (
 <div
 key={idx}
 className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-slate-900">
 {r.risk_category} Risk
 </span>
 <span
 className={`px-2 py-0.5 rounded text-xs font-bold ${
 r.severity ==='HIGH'
 ?'bg-red-500/20 text-red-400'
 : r.severity ==='MEDIUM'
 ?'bg-amber-500/20 text-amber-400'
 :'bg-emerald-500/20 text-emerald-400'
 }`}
 >
 {r.severity}
 </span>
 </div>
 <p className="text-slate-500">
 <strong>Impact:</strong> {r.impact}
 </p>
 <p className="text-emerald-600 font-medium">
 <strong>Mitigation:</strong> {r.mitigation}
 </p>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* TAB 2: REQUIREMENTS */}
 {activeTab ==='requirements' && (
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Structured Project Resource Requirements
 </h3>
 <p className="text-xs text-slate-500">
 AI-inferred from idea description and verified against hardware/software requirements.
 </p>
 </div>

 <button
 onClick={() => setReqModalOpen(true)}
 className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Add Custom Requirement</span>
 </button>
 </div>

 <div className="space-y-3">
 {requirements.map((req: any) => (
 <div
 key={req.id}
 className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
 >
 <div className="space-y-1.5 max-w-2xl">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700">
 {req.category}
 </span>
 <span
 className={`px-2 py-0.5 rounded text-xs font-bold ${
 req.priority ==='CRITICAL'
 ?'bg-red-500/20 text-red-400'
 :'bg-emerald-500/20 text-emerald-400'
 }`}
 >
 {req.priority}
 </span>
 <span className="text-xs text-slate-400">
 Status: {req.status}
 </span>
 </div>

 <h4 className="font-bold text-sm text-slate-900">{req.name}</h4>
 {req.description && (
 <p className="text-xs text-slate-500">{req.description}</p>
 )}
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={() => handleDeleteRequirement(req.id)}
 className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
 title="Delete requirement"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* TAB 3: RANKED MATCHES */}
 {activeTab ==='matches' && (
 <div className="space-y-4">
 {/* Filter & Search Bar */}
 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-slate-400">Category:</span>
 <select
 value={matchCategoryFilter}
 onChange={(e) => setMatchCategoryFilter(e.target.value)}
 className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
 >
 {categories.map((c) => (
 <option key={c} value={c}>
 {c}
 </option>
 ))}
 </select>
 </div>

 <div className="relative">
 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Search matches or reasons..."
 value={matchSearch}
 onChange={(e) => setMatchSearch(e.target.value)}
 className="pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
 />
 </div>
 </div>

 {/* Match Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {filteredMatches.map((m: any) => (
 <div
 key={m.id || m.resource_name}
 className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
 >
 <div className="space-y-3">
 {/* Header */}
 <div className="flex items-start justify-between gap-2">
 <div>
 <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">
 {m.resource_category}
 </span>
 <h4 className="font-bold text-base text-slate-900 mt-1">
 {m.resource_name}
 </h4>
 </div>

 <div className="text-right shrink-0">
 <div className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
 {m.overall_match_score?.toFixed(0)}% Match
 </div>
 <span className="text-xs text-slate-400 mt-0.5 block capitalize font-medium">
 {m.match_category?.replace('_','').toLowerCase()}
 </span>
 </div>
 </div>

 {/* Cost & Price Evidence */}
 <div className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
 <div>
 <span className="text-slate-400 block text-xs">Estimated Outlay</span>
 <span className="font-bold text-slate-900">
 ₹{m.estimated_cost?.toLocaleString() ||'0'}
 </span>
 </div>
 <div className="h-6 w-px bg-slate-200" />
 <div>
 <span className="text-slate-400 block text-xs">Price Evidence</span>
 <span className="font-semibold text-emerald-500">
 {m.price_evidence_status}
 </span>
 </div>
 <div className="h-6 w-px bg-slate-200" />
 <div>
 <span className="text-slate-400 block text-xs">Availability</span>
 <span className="font-semibold text-slate-700">
 {m.availability_status}
 </span>
 </div>
 </div>

 {/* Multi-Dimensional Fit Bars */}
 <div className="space-y-1.5 text-xs">
 <div className="flex justify-between text-slate-500">
 <span>Relevance: {m.project_relevance_score?.toFixed(0)}%</span>
 <span>Budget Fit: {m.budget_fit_score?.toFixed(0)}%</span>
 <span>Hardware Fit: {m.hardware_fit_score?.toFixed(0)}%</span>
 <span>Skills Fit: {m.skill_fit_score?.toFixed(0)}%</span>
 </div>
 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
 <div
 style={{ width:`${(m.project_relevance_score || 80) * 0.3}%` }}
 className="bg-indigo-500"
 />
 <div
 style={{ width:`${(m.budget_fit_score || 80) * 0.25}%` }}
 className="bg-emerald-500"
 />
 <div
 style={{ width:`${(m.hardware_fit_score || 80) * 0.2}%` }}
 className="bg-cyan-500"
 />
 <div
 style={{ width:`${(m.skill_fit_score || 80) * 0.15}%` }}
 className="bg-amber-500"
 />
 </div>
 </div>

 {/* Why Matched */}
 {m.why_matched_json && m.why_matched_json.length > 0 && (
 <div className="space-y-1">
 <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
 Why Matched:
 </span>
 <ul className="space-y-1 text-xs text-slate-600">
 {m.why_matched_json.map((w: string, idx: number) => (
 <li key={idx} className="flex items-start gap-1.5">
 <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
 <span>{w}</span>
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* Tradeoffs */}
 {m.tradeoffs_json && m.tradeoffs_json.length > 0 && (
 <div className="space-y-1">
 <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
 Tradeoffs:
 </span>
 <ul className="space-y-1 text-xs text-slate-500">
 {m.tradeoffs_json.map((t: string, idx: number) => (
 <li key={idx} className="flex items-start gap-1.5">
 <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
 <span>{t}</span>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
 <button
 onClick={() => handleAddMatchToPlan(m)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Add to Plan</span>
 </button>

 <button
 onClick={() => {
 setAssistantQuery(`Tell me more about how to configure and use ${m.resource_name} for this project.`);
 setAssistantOpen(true);
 }}
 className="text-xs font-medium text-indigo-500 hover:underline inline-flex items-center gap-1"
 >
 <span>Ask AI</span>
 <ChevronRight className="w-3 h-3" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* TAB 4: OPEN-SOURCE ALTERNATIVES */}
 {activeTab ==='alternatives' && (
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Open-Source & Low-Cost Alternative Substitutes
 </h3>
 <p className="text-xs text-slate-500">
 Identifies zero-cost open-source tools and quantized models that can replace expensive commercial items.
 </p>
 </div>

 {alternatives.length === 0 ? (
 <div className="text-center py-10 text-slate-400 text-xs">
 No expensive items detected that require substitution. Current allocation is already optimized!
 </div>
 ) : (
 <div className="space-y-4">
 {alternatives.map((alt: any) => (
 <div
 key={alt.id}
 className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <TrendingDown className="w-4 h-4 text-emerald-500" />
 <h4 className="font-bold text-sm text-slate-900">
 {alt.alternative_name}
 </h4>
 <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600">
 {alt.compatibility_status}
 </span>
 </div>

 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 text-xs font-bold">
 Estimated Savings: ₹{alt.cost_savings?.toLocaleString() ||'0'}
 </div>
 </div>

 <p className="text-xs text-slate-600">
 <strong>Reason:</strong> {alt.substitute_reason}
 </p>

 {alt.performance_comparison && (
 <p className="text-xs text-slate-500">
 <strong>Performance vs Commercial:</strong> {alt.performance_comparison}
 </p>
 )}

 {alt.tradeoffs_json && alt.tradeoffs_json.length > 0 && (
 <div className="flex flex-wrap gap-2 pt-1">
 {alt.tradeoffs_json.map((t: string, idx: number) => (
 <span
 key={idx}
 className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 text-xs"
 >
 ⚠️ {t}
 </span>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* TAB 5: BUDGET PLANNER */}
 {activeTab ==='budget' && (
 <div className="space-y-6">
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Category Spending Breakdown & Utilization
 </h3>
 <p className="text-xs text-slate-500">
 Tracks allocated funds against student budget limits to prevent accidental expenditure.
 </p>
 </div>

 <div className="text-right">
 <span className="text-xs text-slate-400 block">Total Utilization</span>
 <span className="text-lg font-bold text-emerald-500">
 {budgetSummary.utilization_percentage?.toFixed(1)}%
 </span>
 </div>
 </div>

 {/* Breakdown Bars */}
 <div className="space-y-3">
 {Object.entries(budgetSummary.breakdown_by_category || {}).map(([cat, amount]: any) => {
 const cap = profile.total_budget || 10000;
 const pct = Math.min(100, Math.round((amount / cap) * 100));
 return (
 <div key={cat} className="space-y-1">
 <div className="flex justify-between text-xs font-semibold">
 <span>{cat}</span>
 <span>₹{amount?.toLocaleString()} ({pct}%)</span>
 </div>
 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
 <div
 style={{ width:`${pct}%` }}
 className={`h-full ${
 pct > 80 ?'bg-red-500' : pct > 50 ?'bg-amber-500' :'bg-emerald-500'
 }`}
 />
 </div>
 </div>
 );
 })}
 </div>

 {/* Recurring Monthly Cost Banner */}
 <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-indigo-500" />
 <span>Recurring Monthly Outlay:</span>
 </div>
 <span className="font-bold text-slate-900">
 ₹{budgetSummary.recurring_monthly_total || 0}/month (Cap: ₹{profile.monthly_recurring_budget || 500})
 </span>
 </div>
 </div>
 </div>
 )}

 {/* TAB 6: RESOURCE BUNDLES */}
 {activeTab ==='bundles' && (
 <div className="space-y-4">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Curated Resource Bundles
 </h3>
 <p className="text-xs text-slate-500">
 Pre-configured stacks optimized for different budgets, learning goals, and competition deadlines.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {bundles.map((b: any) => {
 const isLowCost = b.bundle_type ==='LOW_COST';
 const isBalanced = b.bundle_type ==='BALANCED';
 return (
 <div
 key={b.id || b.name}
 className={`bg-white p-6 rounded-lg border shadow-sm flex flex-col justify-between space-y-4 relative ${
 isBalanced
 ?'border-emerald-500 ring-2 ring-emerald-500/20'
 :'border-slate-200'
 }`}
 >
 {isBalanced && (
 <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
 RECOMMENDED
 </span>
 )}

 <div className="space-y-3">
 <div>
 <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
 {b.bundle_type}
 </span>
 <h4 className="font-bold text-lg text-slate-900 mt-1">
 {b.name}
 </h4>
 <p className="text-xs text-slate-500 mt-1">
 {b.description}
 </p>
 </div>

 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
 <span className="text-xs text-slate-400 block">Total Bundle Cost</span>
 <p className="text-xl font-semibold text-slate-900">
 ₹{b.total_estimated_cost?.toLocaleString() ||'0'}
 </p>
 </div>

 <div className="space-y-1.5 text-xs">
 <span className="font-bold text-xs text-slate-400 uppercase tracking-wider block">
 Included Resources:
 </span>
 <ul className="space-y-1 text-slate-600">
 {(b.items_json || []).map((it: any, idx: number) => (
 <li key={idx} className="flex items-center gap-1.5 text-xs">
 <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
 <span className="truncate">{it.name || it.resource_name}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>

 <button
 onClick={() => handleAdoptBundle(b)}
 className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
 isBalanced
 ?'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
 :'bg-slate-100 hover:bg-slate-200 text-slate-900'
 }`}
 >
 Adopt {b.bundle_type} Stack
 </button>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* TAB 7: HARDWARE & COMPUTE */}
 {activeTab ==='hardware' && (
 <div className="space-y-6">
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Student-Owned Hardware Inventory
 </h3>
 <p className="text-xs text-slate-500">
 Register hardware you already own or can borrow from university labs to avoid redundant purchases.
 </p>
 </div>

 <button
 onClick={() => setHwModalOpen(true)}
 className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Register Owned Hardware</span>
 </button>
 </div>

 {ownedHardware.length === 0 ? (
 <div className="text-center py-8 text-slate-400 text-xs">
 No owned hardware registered. Register your microcontroller or laptop to unlock tailored zero-cost edge matching!
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
 {ownedHardware.map((hw: any, idx: number) => (
 <div
 key={idx}
 className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-slate-900">{hw.name}</span>
 <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-400">
 {hw.ownership_status ||'OWNED'}
 </span>
 </div>
 <p className="text-slate-500">Category: {hw.category}</p>
 <div className="flex flex-wrap gap-1">
 {(hw.interfaces_json || []).map((iface: string, i: number) => (
 <span
 key={i}
 className="px-1.5 py-0.5 rounded bg-slate-200 text-xs text-slate-600"
 >
 {iface}
 </span>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {/* TAB 8: SKILLS FIT */}
 {activeTab ==='skills' && (
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Student Skills & Learning-Curve Alignment
 </h3>
 <p className="text-xs text-slate-500">
 Matches candidate tools and libraries to your current programming proficiency.
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
 {skills.map((sk: any, idx: number) => (
 <div
 key={idx}
 className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-slate-900">{sk.skill_name}</span>
 <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400">
 {sk.proficiency_level}
 </span>
 </div>
 <p className="text-slate-500">
 Willing to learn new tools: {sk.willing_to_learn ?'Yes' :'No'}
 </p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* TAB 9: ACTIONABLE RESOURCE PLAN */}
 {activeTab ==='plan' && (
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Actionable Project Resource Allocation Plan
 </h3>
 <p className="text-xs text-slate-500">
 Track procurement status, actual outlays, and cross-system foreign linkages (Roadmap, Hardware Lab, Experiments).
 </p>
 </div>

 <button
 onClick={() => setPlanModalOpen(true)}
 className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Add Item to Plan</span>
 </button>
 </div>

 {planItems.length === 0 ? (
 <div className="text-center py-10 text-slate-400 text-xs">
 No items in plan yet. Adopt a curated bundle or add matched resources from the Ranked Matches tab!
 </div>
 ) : (
 <div className="space-y-3">
 {planItems.map((item: any) => (
 <div
 key={item.id}
 className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
 >
 <div className="space-y-1 max-w-xl">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700">
 {item.resource_category}
 </span>
 <h4 className="font-bold text-sm text-slate-900">
 {item.resource_name}
 </h4>
 </div>
 {item.purpose && (
 <p className="text-slate-500">{item.purpose}</p>
 )}
 <div className="flex items-center gap-3 text-xs text-slate-400">
 <span>Cost: ₹{item.estimated_cost || 0}</span>
 <span>Qty: {item.quantity || 1}</span>
 {item.source_name && <span>Source: {item.source_name}</span>}
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <select
 value={item.plan_status}
 onChange={(e) => handleUpdatePlanStatus(item.id, e.target.value)}
 className="px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 font-medium"
 >
 <option value="RECOMMENDED">RECOMMENDED</option>
 <option value="SHORTLISTED">SHORTLISTED</option>
 <option value="AVAILABLE">AVAILABLE</option>
 <option value="OWNED">OWNED</option>
 <option value="ACQUIRED">ACQUIRED</option>
 <option value="IMPLEMENTED">IMPLEMENTED</option>
 </select>

 <button
 onClick={() => handleDeletePlanItem(item.id)}
 className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
 title="Delete from plan"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* TAB 10: WHAT-IF SIMULATOR */}
 {activeTab ==='whatif' && (
 <div className="space-y-6">
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Real-Time What-If Scenario Simulator
 </h3>
 <p className="text-xs text-slate-500">
 Simulate budget cuts, zero-cloud offline constraints, and hardware changes with dynamic capability recomputation.
 </p>
 </div>

 {/* Controls */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700">
 Hypothetical Budget: ₹{whatIfBudget.toLocaleString()}
 </label>
 <input
 type="range"
 min="500"
 max="20000"
 step="500"
 value={whatIfBudget}
 onChange={(e) => setWhatIfBudget(Number(e.target.value))}
 className="w-full accent-emerald-500 cursor-pointer"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700">
 GPU Cloud Available
 </label>
 <button
 onClick={() => setWhatIfGpu(!whatIfGpu)}
 className={`w-full py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
 whatIfGpu
 ?'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
 :'bg-slate-200 text-slate-600 border-transparent'
 }`}
 >
 {whatIfGpu ?'GPU Enabled' :'No Cloud GPU'}
 </button>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700">
 Strict Open-Source Only
 </label>
 <button
 onClick={() => setWhatIfOpenSourceOnly(!whatIfOpenSourceOnly)}
 className={`w-full py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
 whatIfOpenSourceOnly
 ?'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
 :'bg-slate-200 text-slate-600 border-transparent'
 }`}
 >
 {whatIfOpenSourceOnly ?'100% Open Source' :'Allow Commercial'}
 </button>
 </div>

 <div className="space-y-1.5 flex flex-col justify-end">
 <button
 onClick={handleRunWhatIf}
 disabled={whatIfSimulating}
 className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
 >
 {whatIfSimulating ?'Simulating...' :'Run Simulation'}
 </button>
 </div>
 </div>

 {/* Results */}
 {whatIfResult && (
 <div className="space-y-4 pt-2">
 <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
 <h4 className="font-bold text-sm text-emerald-500">Simulation Outcome:</h4>
 <p className="text-xs text-slate-700">
 {whatIfResult.scenario_description}
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
 <span className="font-bold text-slate-900 block">
 Capability Adjustments:
 </span>
 <ul className="space-y-1 text-slate-600">
 {whatIfResult.capability_changes?.map((c: string, i: number) => (
 <li key={i} className="flex items-start gap-1.5">
 <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
 <span>{c}</span>
 </li>
 ))}
 </ul>
 </div>

 <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
 <span className="font-bold text-slate-900 block">
 Tradeoffs & Risk Shifts:
 </span>
 <ul className="space-y-1 text-slate-600">
 {whatIfResult.tradeoffs?.map((t: string, i: number) => (
 <li key={i} className="flex items-start gap-1.5">
 <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
 <span>{t}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* TAB 11: EVIDENCE & AUDIT */}
 {activeTab ==='evidence' && (
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
 <div>
 <h3 className="font-bold text-base text-slate-900">
 Data Provenance, Licensing & Anti-Hallucination Audit
 </h3>
 <p className="text-xs text-slate-500">
 Full transparency into verified public sources, licenses, and pricing evidence.
 </p>
 </div>

 <div className="space-y-3 text-xs">
 <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
 <span className="font-bold text-slate-900 flex items-center gap-1.5">
 <ShieldCheck className="w-4 h-4 text-emerald-500" />
 Anti-Hallucination & Pricing Policy
 </span>
 <p className="text-slate-600 leading-relaxed">
 InnoSphere AI strictly categorizes all financial data as either <code>SOURCE_VERIFIED</code>, <code>USER_PROVIDED</code>, <code>ESTIMATED</code>, or <code>UNAVAILABLE</code>. The system never fabricates vendor inventory, live marketplace fluctuations, or proprietary quotes.
 </p>
 </div>

 <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
 <span className="font-bold text-slate-900 flex items-center gap-1.5">
 <Code className="w-4 h-4 text-indigo-500" />
 Open-Source IP & License Compliance
 </span>
 <p className="text-slate-600 leading-relaxed">
 All recommended open-source models, libraries, and hardware blueprints are filtered for student innovation IP protection under MIT, Apache 2.0, BSD, and CERN-OHL open hardware licenses.
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Slide-out AI Assistant Panel */}
 {assistantOpen && (
 <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-slate-200 shadow-sm flex flex-col animate-in slide-in-from-right">
 {/* Header */}
 <div className="p-4 border-b border-slate-200 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Bot className="w-5 h-5 text-emerald-500" />
 <h3 className="font-bold text-sm text-slate-900">
 Resource Matchmaker Assistant
 </h3>
 </div>
 <button
 onClick={() => setAssistantOpen(false)}
 className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Chat Body */}
 <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
 {assistantMessages.map((msg, idx) => (
 <div
 key={idx}
 className={`p-3 rounded-xl ${
 msg.role ==='user'
 ?'bg-emerald-600 text-white ml-6'
 :'bg-slate-100 text-slate-800 mr-6'
 } space-y-2`}
 >
 <p className="leading-relaxed">{msg.content}</p>

 {/* Action Chips */}
 {msg.actions && msg.actions.length > 0 && (
 <div className="flex flex-wrap gap-1 pt-1">
 {msg.actions.map((act, i) => (
 <button
 key={i}
 onClick={() => handleSendAssistantMessage(act)}
 className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 text-xs font-semibold text-left transition-colors"
 >
 {act}
 </button>
 ))}
 </div>
 )}
 </div>
 ))}
 {assistantLoading && (
 <div className="p-3 rounded-xl bg-slate-100 text-slate-400 animate-pulse text-xs">
 Reasoning over project budget and hardware constraints...
 </div>
 )}
 </div>

 {/* Chat Input */}
 <div className="p-4 border-t border-slate-200 flex items-center gap-2">
 <input
 type="text"
 placeholder="Ask about resources or budget..."
 value={assistantQuery}
 onChange={(e) => setAssistantQuery(e.target.value)}
 onKeyDown={(e) => e.key ==='Enter' && handleSendAssistantMessage()}
 className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
 />
 <button
 onClick={() => handleSendAssistantMessage()}
 className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
 >
 <Send className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}

 {/* Multi-Format Export Modal */}
 {exportModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
 <div className="bg-white rounded-lg border border-slate-200 shadow-sm max-w-2xl w-full p-6 space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
 <Download className="w-4 h-4 text-emerald-600" />
 Export Resource Strategy Report
 </h3>
 <button
 onClick={() => setExportModalOpen(false)}
 className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Format Switcher */}
 <div className="flex items-center gap-2">
 {(['markdown','json','csv','svg'] as const).map((fmt) => (
 <button
 key={fmt}
 onClick={() => handleExport(fmt)}
 className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
 exportFormat === fmt
 ?'bg-emerald-600 text-white'
 :'bg-slate-100 text-slate-600'
 }`}
 >
 {fmt}
 </button>
 ))}
 </div>

 {exportLoading ? (
 <div className="h-64 rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
 Generating export...
 </div>
 ) : (
 <pre className="h-64 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono">
 {exportData?.data}
 </pre>
 )}

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 onClick={handleCopyExport}
 className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors"
 >
 <Copy className="w-3.5 h-3.5" />
 <span>{copied ?'Copied!' :'Copy to Clipboard'}</span>
 </button>

 <button
 onClick={handleDownloadExport}
 className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
 >
 <Download className="w-3.5 h-3.5" />
 <span>Download File</span>
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Add Custom Requirement Modal */}
 {reqModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
 <form
 onSubmit={handleCreateRequirement}
 className="bg-white rounded-lg border border-slate-200 shadow-sm max-w-md w-full p-6 space-y-4"
 >
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-base text-slate-900">
 Add Custom Requirement
 </h3>
 <button
 type="button"
 onClick={() => setReqModalOpen(false)}
 className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Requirement Name
 </label>
 <input
 type="text"
 required
 value={newReq.name}
 onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
 placeholder="e.g. DHT22 Temperature & Humidity Sensor"
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500"
 />
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Category
 </label>
 <select
 value={newReq.category}
 onChange={(e) => setNewReq({ ...newReq, category: e.target.value })}
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 >
 <option value="HARDWARE">HARDWARE</option>
 <option value="SOFTWARE">SOFTWARE</option>
 <option value="AI_ML">AI_ML</option>
 <option value="CLOUD_COMPUTE">CLOUD_COMPUTE</option>
 <option value="DATA">DATA</option>
 <option value="SERVICE">SERVICE</option>
 <option value="RESEARCH">RESEARCH</option>
 </select>
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Priority
 </label>
 <select
 value={newReq.priority}
 onChange={(e) => setNewReq({ ...newReq, priority: e.target.value })}
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 >
 <option value="CRITICAL">CRITICAL</option>
 <option value="HIGH">HIGH</option>
 <option value="MEDIUM">MEDIUM</option>
 <option value="LOW">LOW</option>
 </select>
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Description & Target Specs
 </label>
 <textarea
 rows={2}
 value={newReq.description}
 onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
 placeholder="Specifications or intended use..."
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 />
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setReqModalOpen(false)}
 className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
 >
 Add Requirement
 </button>
 </div>
 </form>
 </div>
 )}

 {/* Edit Profile & Budget Modal */}
 {profileModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
 <form
 onSubmit={handleSaveProfile}
 className="bg-white rounded-lg border border-slate-200 shadow-sm max-w-md w-full p-6 space-y-4"
 >
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-base text-slate-900">
 Edit Budget Caps & Preferences
 </h3>
 <button
 type="button"
 onClick={() => setProfileModalOpen(false)}
 className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Total Project Budget Limit (₹)
 </label>
 <input
 type="number"
 value={editProfile.total_budget || 10000}
 onChange={(e) =>
 setEditProfile({ ...editProfile, total_budget: Number(e.target.value) })
 }
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 />
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Hardware Budget Limit (₹)
 </label>
 <input
 type="number"
 value={editProfile.hardware_budget || 6000}
 onChange={(e) =>
 setEditProfile({ ...editProfile, hardware_budget: Number(e.target.value) })
 }
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 />
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Monthly Recurring Budget (₹/month)
 </label>
 <input
 type="number"
 value={editProfile.monthly_recurring_budget || 500}
 onChange={(e) =>
 setEditProfile({
 ...editProfile,
 monthly_recurring_budget: Number(e.target.value),
 })
 }
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 />
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Open Source Preference
 </label>
 <select
 value={editProfile.open_source_preference ||'PREFERRED'}
 onChange={(e) =>
 setEditProfile({ ...editProfile, open_source_preference: e.target.value })
 }
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 >
 <option value="STRICT_OPEN_SOURCE">Strict 100% Open-Source Only</option>
 <option value="PREFERRED">Open Source Preferred</option>
 <option value="COMMERCIAL_ALLOWED">Commercial Tools Permitted</option>
 </select>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setProfileModalOpen(false)}
 className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
 >
 Save Changes
 </button>
 </div>
 </form>
 </div>
 )}

 {/* Register Owned Hardware Modal */}
 {hwModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
 <form
 onSubmit={handleAddOwnedHardware}
 className="bg-white rounded-lg border border-slate-200 shadow-sm max-w-md w-full p-6 space-y-4"
 >
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-base text-slate-900">
 Register Student-Owned Hardware
 </h3>
 <button
 type="button"
 onClick={() => setHwModalOpen(false)}
 className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Device Name
 </label>
 <input
 type="text"
 required
 value={newHwItem.name}
 onChange={(e) => setNewHwItem({ ...newHwItem, name: e.target.value })}
 placeholder="e.g. ESP32-WROOM-32D Development Board"
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 />
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Category
 </label>
 <select
 value={newHwItem.category}
 onChange={(e) => setNewHwItem({ ...newHwItem, category: e.target.value })}
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 >
 <option value="Microcontroller">Microcontroller (ESP32 / Arduino / STM32)</option>
 <option value="SingleBoardComputer">Single Board Computer (Raspberry Pi)</option>
 <option value="Sensor">Sensor / Transducer</option>
 <option value="Actuator">Actuator / Motor</option>
 <option value="Laptop">Laptop / Workstation</option>
 </select>
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Ownership Status
 </label>
 <select
 value={newHwItem.ownership_status}
 onChange={(e) => setNewHwItem({ ...newHwItem, ownership_status: e.target.value })}
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 >
 <option value="OWNED">Personal Owned</option>
 <option value="BORROWED">Borrowed</option>
 <option value="LAB_AVAILABLE">University Lab Available</option>
 </select>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setHwModalOpen(false)}
 className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
 >
 Save Hardware
 </button>
 </div>
 </form>
 </div>
 )}

 {/* Custom Plan Item Modal */}
 {planModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
 <form
 onSubmit={handleCreatePlanItem}
 className="bg-white rounded-lg border border-slate-200 shadow-sm max-w-md w-full p-6 space-y-4"
 >
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-base text-slate-900">
 Add Resource to Project Plan
 </h3>
 <button
 type="button"
 onClick={() => setPlanModalOpen(false)}
 className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Resource Name
 </label>
 <input
 type="text"
 required
 value={newPlanItem.resource_name}
 onChange={(e) =>
 setNewPlanItem({ ...newPlanItem, resource_name: e.target.value })
 }
 placeholder="e.g. Capacitive Soil Moisture Sensor"
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 />
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Category
 </label>
 <select
 value={newPlanItem.resource_category}
 onChange={(e) =>
 setNewPlanItem({ ...newPlanItem, resource_category: e.target.value })
 }
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 >
 <option value="HARDWARE">HARDWARE</option>
 <option value="SOFTWARE">SOFTWARE</option>
 <option value="AI_ML">AI_ML</option>
 <option value="CLOUD_COMPUTE">CLOUD_COMPUTE</option>
 <option value="DATA">DATA</option>
 <option value="SERVICE">SERVICE</option>
 <option value="RESEARCH">RESEARCH</option>
 </select>
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Estimated Cost (₹)
 </label>
 <input
 type="number"
 value={newPlanItem.estimated_cost}
 onChange={(e) =>
 setNewPlanItem({ ...newPlanItem, estimated_cost: Number(e.target.value) })
 }
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 />
 </div>

 <div>
 <label className="font-bold text-slate-700 block mb-1">
 Purpose / Notes
 </label>
 <textarea
 rows={2}
 value={newPlanItem.purpose}
 onChange={(e) => setNewPlanItem({ ...newPlanItem, purpose: e.target.value })}
 placeholder="How this resource is used in the project..."
 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
 />
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setPlanModalOpen(false)}
 className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
 >
 Add to Plan
 </button>
 </div>
 </form>
 </div>
 )}

 {/* Toast Notification */}
 {toastMessage && (
 <div className="fixed bottom-6 right-6 z-50 p-4 rounded-lg bg-white text-slate-900 border border-emerald-200 shadow-sm flex items-center gap-3 text-xs animate-in slide-in-from-bottom">
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 <span className="font-medium">{toastMessage}</span>
 </div>
 )}
 </div>
 </div>
 );
}

function LayoutGridIcon(props: any) {
 return (
 <svg
 {...props}
 xmlns="http://www.w3.org/2000/svg"
 width="24"
 height="24"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 >
 <rect width="7" height="7" x="3" y="3" rx="1" />
 <rect width="7" height="7" x="14" y="3" rx="1" />
 <rect width="7" height="7" x="14" y="14" rx="1" />
 <rect width="7" height="7" x="3" y="14" rx="1" />
 </svg>
 );
}
