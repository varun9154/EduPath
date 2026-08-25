'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Send, ShieldCheck, RefreshCw, Sparkles, Copy, Check } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: Array<{ source: string; verifiedDate: string; label: string; url?: string }>;
  dataQualityLabel?: string;
  provider?: string;
}

const quickPrompts = [
  'I am in Class 10. Build my roadmap to become a software engineer.',
  'Compare B.Tech CSE, BCA and B.Sc Computer Science for jobs.',
  'Explain JEE Main preparation from beginner to advanced.',
  'Give me a DevSecOps roadmap with tools and real-world projects.',
];

export default function AICounsellorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Hello! I am EduPath AI Counsellor. Ask me anything about Class 10 onward education, entrance exams, courses, career roadmaps, technical skills, projects, internships, mock tests and first-job preparation. I combine EduPath verified data with multiple AI providers for resilient answers.',
      dataQualityLabel: 'Verified + AI',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const history = useMemo(
    () => messages.slice(-10).map((message) => ({ role: message.sender === 'ai' ? 'assistant' as const : 'user' as const, content: message.text })),
    [messages]
  );

  const handleSend = async (preset?: string) => {
    const currentQuery = (preset ?? input).trim();
    if (!currentQuery || loading) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: currentQuery };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-counsellor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery, history }),
      });
      const data = await res.json() as {
        success?: boolean;
        answer?: string;
        message?: string;
        citations?: ChatMessage['citations'];
        dataQualityLabel?: string;
        provider?: string;
      };

      if (!res.ok || !data.success) throw new Error(data.message || 'AI request failed');

      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer || 'No answer was returned. Please try again.',
        citations: data.citations || [],
        dataQualityLabel: data.dataQualityLabel || 'AI Guidance',
        provider: data.provider,
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: error instanceof Error && /too many/i.test(error.message)
          ? error.message
          : 'I could not reach the AI service right now. Your EduPath verified-data features are still available. Please try again shortly.',
        dataQualityLabel: 'Service fallback',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const copyAnswer = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { /* clipboard may be blocked by browser permissions */ }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12 space-y-6">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold rounded-full">
          <Bot className="w-4 h-4 text-purple-600" />
          <span>EduPath AI Senior Counsellor</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Multi-LLM + Verified Data</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Ask anything about your journey</h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          Get practical answers from Class 10 to first job. EduPath grounds responses in its verified education datasets and uses resilient AI providers when configured.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {quickPrompts.map((prompt) => (
          <button key={prompt} type="button" onClick={() => handleSend(prompt)} disabled={loading}
            className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50 transition text-xs text-slate-700 disabled:opacity-50">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 mb-2" />
            {prompt}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden flex flex-col h-[620px]">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Bot className="w-4 h-4 text-purple-600" />
            Counselling Chat
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified context enabled
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[92%] sm:max-w-[82%] p-4 rounded-2xl text-xs sm:text-sm whitespace-pre-line leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-brand-600 text-white rounded-br-none font-medium' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}>
                {m.text}

                {m.sender === 'ai' && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">{m.dataQualityLabel || 'AI Guidance'}</span>
                    {m.provider && <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500">resilient AI route</span>}
                    <button type="button" onClick={() => copyAnswer(m.id, m.text)} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
                      {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === m.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}

                {m.sender === 'ai' && m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center font-bold text-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      EduPath source context
                    </div>
                    {m.citations.slice(0, 6).map((c, idx) => (
                      <div key={`${c.source}-${idx}`} className="flex justify-between gap-2 items-center bg-slate-50 p-1.5 rounded">
                        <span className="truncate">{c.source}</span>
                        <span className="shrink-0 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">[{c.label}] {c.verifiedDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
              <span>EduPath is preparing your answer...</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            maxLength={4000}
            placeholder="Ask about careers, exams, courses, skills, projects, jobs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
            className="flex-1 px-4 py-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button onClick={() => void handleSend()} disabled={loading || !input.trim()} className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow disabled:opacity-50" aria-label="Send message">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
