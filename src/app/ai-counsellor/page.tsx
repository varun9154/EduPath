'use client';

import React, { useState } from 'react';
import { Bot, Send, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: Array<{ source: string; verifiedDate: string; label: string }>;
  dataQualityLabel?: string;
}

export default function AICounsellorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Hello! I am EduPath AI Counsellor, trained strictly on official Indian entrance exam & higher education datasets. How can I assist your college, pharmacy, engineering, or 16-step career roadmap research today?',
      dataQualityLabel: 'Verified'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    const currentQuery = input;
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-counsellor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery })
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer || 'I am looking up verified details in the EduPath database.',
        citations: data.citations || [],
        dataQualityLabel: data.dataQualityLabel || 'Verified'
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Unable to connect to verified database at the moment. Please try again.',
          dataQualityLabel: 'Indicative'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold rounded-full">
          <Bot className="w-4 h-4 text-purple-600" />
          <span>Verified Dataset AI Engine</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Strict Verification Standard</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">EduPath AI Senior Counsellor</h1>
        <p className="text-xs text-slate-600 max-w-lg mx-auto">
          Ask questions about KCET, MHT-CET, WBJEE, TS EAMCET, JEE Main, NEET, Pharmacy (B.Pharm/Pharm.D), or 36 States admissions. All outputs cite official sources.
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden flex flex-col h-[550px]">
        
        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm whitespace-pre-line leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none font-medium'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                {m.text}

                {/* Citations & Verified Tag */}
                {m.sender === 'ai' && m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center font-bold text-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Data Source Citations:
                    </div>
                    {m.citations.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-1.5 rounded">
                        <span className="truncate max-w-[200px]">Source: {c.source}</span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          [{c.label}] {c.verifiedDate}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-3 rounded-xl border w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
              <span>Querying 36 States verified exam & career matrix...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask about KCET, MHT-CET, Pharmacy B.Pharm, cutoffs, or 36 States..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
