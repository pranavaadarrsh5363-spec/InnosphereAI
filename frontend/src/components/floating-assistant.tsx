'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useProject } from '@/lib/project-context';
import { api } from '@/lib/api';

interface Message {
  id?: number;
  role: 'user' | 'assistant' | 'system';
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
      role: 'assistant',
      content:
        "👋 Hello! I am your **InnoSphere AI Innovation Mentor**.\n\nI can analyze your project's technical architecture, evaluate literature gaps on arXiv/OpenAlex, recommend benchmark datasets, or generate step-by-step milestone execution roadmaps.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic contextual starter prompts
  const starterPrompts = activeProject
    ? [
        { label: 'What should I implement first?', query: `What should I implement first for ${activeProject.title}?` },
        { label: 'Biggest innovation gap?', query: `What is the biggest research and innovation gap in ${activeProject.domain}?` },
        { label: 'Which tech stack next?', query: `Which technology stack and libraries should I investigate next for ${activeProject.title}?` },
        { label: 'Find datasets for my idea', query: `What benchmark datasets and open data portals exist for ${activeProject.title}?` },
        { label: 'Create 10-phase roadmap', query: `Break down a 10-phase engineering roadmap for ${activeProject.title}.` },
      ]
    : [
        { label: 'What should I implement first?', query: 'What should a student implement first when building an AI MVP?' },
        { label: 'What is the biggest innovation gap?', query: 'How can I detect unsolved innovation gaps in current research papers?' },
        { label: 'Which technology should I investigate?', query: 'What technologies and frameworks are trending for student capstone innovations?' },
        { label: 'Find datasets for my idea', query: 'What benchmark datasets and open data portals can I use for training/testing?' },
        { label: 'Create development roadmap', query: 'How does the InnoSphere AI 10-phase innovation roadmap work?' },
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.queryAssistant(textToSend, activeProject?.id);
      const assistantMessage: Message = { role: 'assistant', content: res.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "⚠️ I couldn't reach the AI backend service right now. Please ensure your backend service is online and accessible.",
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
        role: 'assistant',
        content: activeProject
          ? `👋 Ready to advise on **${activeProject.title}** (${activeProject.domain}). Ask me about architecture, code repositories, or milestone roadmaps!`
          : "👋 Hello! I am your **InnoSphere AI Innovation Mentor**. Ask me anything about required technologies, benchmark datasets, research papers, or execution roadmaps.",
      },
    ]);
  };

  return (
    <>
      {/* Professional Floating Assistant Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all cursor-pointer text-xs font-semibold border border-indigo-500"
          title="Open AI Research & Innovation Assistant"
          aria-label="Open AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
          </div>
          <span className="tracking-tight">AI Mentor</span>
          {activeProject && (
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-indigo-700/80 text-indigo-100 font-medium truncate max-w-[120px] border border-indigo-500/50">
              {activeProject.domain}
            </span>
          )}
        </button>
      )}

      {/* Assistant Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 max-w-[calc(100vw-2rem)] max-h-[88vh] ${
            isExpanded
              ? 'w-[calc(100vw-2rem)] md:w-[700px] h-[82vh]'
              : 'w-[calc(100vw-2rem)] sm:w-[460px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  InnoSphere AI Mentor
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Gemini 2.5 Flash
                  </span>
                </h3>
                {activeProject ? (
                  <p className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-[280px]">
                    Context: <span className="text-indigo-600 font-medium">{activeProject.title}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500">Global Research & Innovation Mode</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                title="Reset Conversation"
                aria-label="Reset Conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                title={isExpanded ? 'Collapse' : 'Expand'}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                {msg.role !== 'user' && (
                  <div className="h-7 w-7 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 mt-0.5 text-indigo-600">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className="relative max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow-sm shadow-indigo-500/10'
                        : 'bg-white border border-slate-200/80 text-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>

                  {msg.role !== 'user' && (
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition-all shadow-xs cursor-pointer"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-xs text-indigo-900 bg-indigo-50/80 border border-indigo-100 p-3 rounded-xl w-fit shadow-xs animate-in fade-in">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span className="font-medium">Consulting project context and scientific literature...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="px-3.5 py-2 border-t border-slate-100 bg-white shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {starterPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.query)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-50 hover:bg-indigo-50/60 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 text-[11px] text-slate-600 font-medium transition-all shrink-0 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
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
                  ? `Ask about ${activeProject.title}...`
                  : 'Ask about literature, datasets, tech stack, roadmaps...'
              }
              className="flex-1 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-8.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white flex items-center justify-center gap-1 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-sm shadow-indigo-500/20"
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
