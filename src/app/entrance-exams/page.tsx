'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Search, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';
import statesData from '@/data/states.json';
import examsData from '@/data/exams.json';

export default function EntranceExamsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | 'State' | 'Union Territory'>('All');

  const filteredStates = statesData.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.topExams.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'All' || s.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-bold text-cyan-800">
          <MapPin className="w-3.5 h-3.5 text-cyan-600" />
          <span>All 36 Indian States & Union Territories Covered</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Entrance Exam Explorer (All 36 States/UTs)
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Comprehensive, verified entrance exam guidelines across Engineering, Medical, Pharmacy (D.Pharm, B.Pharm, Pharm.D, M.Pharm), Law, Management, Architecture, and Agriculture for all 28 States and 8 Union Territories in India.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search state, UT, or exam (e.g. KCET, MHT-CET, WBJEE)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 text-xs font-semibold">
          {(['All', 'State', 'Union Territory'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-2 rounded-xl transition ${
                selectedType === type
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type} ({type === 'All' ? 36 : statesData.filter(s => s.type === type).length})
            </button>
          ))}
        </div>
      </div>

      {/* 36 States Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStates.map((s) => {
          const stateExams = examsData.filter(e => e.stateId === s.id);
          return (
            <Link
              key={s.id}
              href={`/entrance-exams/${s.id}`}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-500 hover:shadow-lg transition group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{s.code}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.type === 'State' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {s.type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition">
                  {s.name}
                </h3>
                <p className="text-xs text-slate-500">Capital: {s.capital}</p>

                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Top Key Exams:</div>
                  <div className="flex flex-wrap gap-1">
                    {s.topExams.map((ex, idx) => (
                      <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600">
                <span>View {stateExams.length > 0 ? stateExams.length : 'State'} Exam Rules</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
