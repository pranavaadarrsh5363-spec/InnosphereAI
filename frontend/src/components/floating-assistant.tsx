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
            "⚠️ I couldn't reach the AI backend service right now. Please ensure your backend is running at `http://localhost:8000`.",
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
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-3 sm:bottom-6 right-3 sm:right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-2xl hover:scale-105 transition-all duration-300 group border border-white/20 glow-purple"
          title="Open AI Innovation Assistant"
          aria-label="Open AI Assistant"
        >
          <div className="relative">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <span className="text-xs font-bold tracking-wide">AI Mentor</span>
          {activeProject && (
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white/90 truncate max-w-[110px] lg:max-w-[130px]">
              {activeProject.domain}
            </span>
          )}
        </button>
      )}

      {/* Assistant Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-3 sm:bottom-6 right-3 sm:right-6 z-50 flex flex-col rounded-2xl bg-slate-950 dark:bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 max-w-[calc(100vw-1.5rem)] max-h-[88vh] ${
            isExpanded
              ? 'w-[calc(100vw-1.5rem)] md:w-[650px] h-[80vh]'
              : 'w-[calc(100vw-1.5rem)] sm:w-[420px] h-[540px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  AI Innovation Mentor
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                </h3>
                {activeProject ? (
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-[240px]">
                    Context: <span className="text-indigo-300 font-medium">{activeProject.title}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400">Global Innovation Context</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Reset Conversation"
                aria-label="Reset Conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/60">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                {msg.role !== 'user' && (
                  <div className="h-6 w-6 rounded-md bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                )}
                <div className="relative max-w-[85%]">
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none prose prose-invert prose-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>

                  {msg.role !== 'user' && (
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-opacity"
                      title="Copy message"
                    >
                      {copiedIndex === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-indigo-400 bg-slate-900/80 p-3 rounded-2xl w-fit border border-slate-800 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                <span>AI Mentor is analyzing project context & literature...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="p-2 border-t border-slate-800 bg-slate-900/70 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {starterPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.query)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/40 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-all shrink-0"
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
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeProject
                  ? `Ask about ${activeProject.title}...`
                  : 'Ask about technologies, datasets, roadmaps...'
              }
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow"
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
