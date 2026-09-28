'use client';

import React, { useState, useEffect, useRef } from'react';
import {
 MessageSquare,
 X,
 Send,
 Loader2,
 Bot,
 Maximize2,
 Minimize2,
 Copy,
 Check,
 RotateCcw,
} from'lucide-react';
import { useProject } from'@/lib/project-context';
import { api } from'@/lib/api';

interface Message {
 id?: number;
 role:'user' |'assistant' |'system';
 content: string;
}

export function FloatingAssistant() {
 const { activeProject } = useProject();
 const [isOpen, setIsOpen] = useState(false);
 const [isExpanded, setIsExpanded] = useState(false);
 const [input, setInput] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
 const [messages, setMessages] = useState<Message[]>([
 {
 role:'assistant',
 content:
"Hello! I'm your InnoSphere AI Mentor.\n\nI can analyze your project's architecture, evaluate literature gaps, recommend datasets, or generate milestone roadmaps.",
 },
 ]);

 const messagesEndRef = useRef<HTMLDivElement>(null);

 const starterPrompts = activeProject
 ? [
 { label:'What should I implement first?', query:`What should I implement first for ${activeProject.title}?` },
 { label:'Biggest innovation gap?', query:`What is the biggest research and innovation gap in ${activeProject.domain}?` },
 { label:'Which tech stack next?', query:`Which technology stack and libraries should I investigate next for ${activeProject.title}?` },
 { label:'Find datasets', query:`What benchmark datasets and open data portals exist for ${activeProject.title}?` },
 { label:'Create roadmap', query:`Break down a 10-phase engineering roadmap for ${activeProject.title}.` },
 ]
 : [
 { label:'What should I implement first?', query:'What should a student implement first when building an AI MVP?' },
 { label:'Innovation gaps', query:'How can I detect unsolved innovation gaps in current research papers?' },
 { label:'Technology trends', query:'What technologies and frameworks are trending for student capstone innovations?' },
 { label:'Find datasets', query:'What benchmark datasets and open data portals can I use for training/testing?' },
 { label:'Development roadmap', query:'How does the InnoSphere AI 10-phase innovation roadmap work?' },
 ];

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
 };

 useEffect(() => {
 if (isOpen) {
 scrollToBottom();
 }
 }, [messages, isOpen]);

 const handleSend = async (queryText?: string) => {
 const textToSend = queryText || input;
 if (!textToSend.trim() || isLoading) return;

 const userMessage: Message = { role:'user', content: textToSend };
 setMessages((prev) => [...prev, userMessage]);
 setInput('');
 setIsLoading(true);

 try {
 const res = await api.queryAssistant(textToSend, activeProject?.id);
 const assistantMessage: Message = { role:'assistant', content: res.reply };
 setMessages((prev) => [...prev, assistantMessage]);
 } catch (err: any) {
 setMessages((prev) => [
 ...prev,
 {
 role:'assistant',
 content:
"I couldn't reach the AI backend right now. Please ensure the backend service is online.",
 },
 ]);
 } finally {
 setIsLoading(false);
 }
 };

 const handleCopy = (text: string, index: number) => {
 navigator.clipboard.writeText(text);
 setCopiedIndex(index);
 setTimeout(() => setCopiedIndex(null), 2000);
 };

 const handleResetChat = () => {
 setMessages([
 {
 role:'assistant',
 content: activeProject
 ?`Ready to advise on **${activeProject.title}** (${activeProject.domain}). Ask about architecture, repositories, or roadmaps.`
 :"Hello! I'm your InnoSphere AI Mentor. Ask about technologies, datasets, papers, or roadmaps.",
 },
 ]);
 };

 return (
 <>
 {/* Trigger Button */}
 {!isOpen && (
 <button
 onClick={() => setIsOpen(true)}
 className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer text-sm font-medium"
 title="Open AI Mentor"
 aria-label="Open AI Assistant"
 >
 <MessageSquare className="h-4 w-4" />
 <span>AI Mentor</span>
 </button>
 )}

 {/* Chat Panel */}
 {isOpen && (
 <div
 className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 max-w-[calc(100vw-2rem)] max-h-[88vh] ${
 isExpanded
 ?'w-[calc(100vw-2rem)] md:w-[680px] h-[82vh]'
 :'w-[calc(100vw-2rem)] sm:w-[440px] h-[560px] max-h-[85vh]'
 }`}
 >
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
 <div className="flex items-center gap-2.5">
 <div className="h-7 w-7 rounded-md bg-indigo-600 text-white flex items-center justify-center">
 <Bot className="h-4 w-4" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-slate-900">AI Mentor</h3>
 {activeProject ? (
 <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-[280px]">
 {activeProject.title}
 </p>
 ) : (
 <p className="text-xs text-slate-500">General research mode</p>
 )}
 </div>
 </div>

 <div className="flex items-center gap-0.5">
 <button
 onClick={handleResetChat}
 className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
 title="Reset Conversation"
 aria-label="Reset Conversation"
 >
 <RotateCcw className="h-3.5 w-3.5" />
 </button>
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
 title={isExpanded ?'Collapse' :'Expand'}
 aria-label={isExpanded ?'Collapse' :'Expand'}
 >
 {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
 </button>
 <button
 onClick={() => setIsOpen(false)}
 className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
 title="Close"
 aria-label="Close"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
 {messages.map((msg, idx) => (
 <div
 key={idx}
 className={`flex gap-2.5 ${msg.role ==='user' ?'justify-end' :'justify-start'} group`}
 >
 {msg.role !=='user' && (
 <div className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-400">
 <Bot className="h-3.5 w-3.5" />
 </div>
 )}
 <div className="relative max-w-[85%]">
 <div
 className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
 msg.role ==='user'
 ?'bg-indigo-600 text-white'
 :'bg-white border border-slate-200 text-slate-700'
 }`}
 >
 <div className="whitespace-pre-wrap">{msg.content}</div>
 </div>

 {msg.role !=='user' && (
 <button
 onClick={() => handleCopy(msg.content, idx)}
 className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition-opacity cursor-pointer"
 title="Copy response"
 >
 {copiedIndex === idx ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
 </button>
 )}
 </div>
 </div>
 ))}

 {isLoading && (
 <div className="flex gap-2 items-center text-sm text-slate-600 bg-white border border-slate-200 p-2.5 rounded-lg w-fit">
 <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
 <span>Thinking...</span>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Quick Prompts */}
 <div className="px-3 py-2 border-t border-slate-100 bg-white shrink-0">
 <div className="flex gap-1.5 overflow-x-auto pb-0.5">
 {starterPrompts.map((p, i) => (
 <button
 key={i}
 onClick={() => handleSend(p.query)}
 disabled={isLoading}
 className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium transition-colors shrink-0 cursor-pointer"
 >
 {p.label}
 </button>
 ))}
 </div>
 </div>

 {/* Input */}
 <form
 onSubmit={(e) => {
 e.preventDefault();
 handleSend();
 }}
 className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
 >
 <input
 type="text"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder={
 activeProject
 ?`Ask about ${activeProject.title}...`
 :'Ask about literature, datasets, roadmaps...'
 }
 className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
 />
 <button
 type="submit"
 disabled={!input.trim() || isLoading}
 className="h-8 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
 aria-label="Send message"
 >
 <Send className="h-3.5 w-3.5" />
 </button>
 </form>
 </div>
 )}
 </>
 );
}
