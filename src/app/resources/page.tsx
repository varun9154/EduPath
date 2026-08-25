'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, Search, ExternalLink, ShieldCheck, Download, Filter } from 'lucide-react';
import resourcesData from '@/data/resources.json';

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const types = ['All', 'Notes', 'Previous Year Papers', 'Official Syllabus', 'Revision Plan'];

  const filteredResources = resourcesData.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.exam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || r.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700">
          <FileText className="w-3.5 h-3.5 text-brand-500" />
          <span>Official Documents & Verified Study Material</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          EduPath Study Resource Library
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Official syllabus guides, previous year exam papers, high-yielding revision formula sheets, and verified external authority portal links for KCET, MHT-CET, WBJEE, JEE Main, NEET-UG, GPAT, and CLAT.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search exam, subject or notes (e.g. KCET Maths, NEET Biology)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                selectedType === t ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((res) => (
          <div key={res.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-brand-400 hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-[11px] font-bold rounded-md">
                  {res.exam} • {res.subject}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                  {res.type}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{res.title}</h3>
              <p className="text-xs text-slate-600">{res.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">Source: {res.source}</span>
              <a
                href={res.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition"
              >
                Access Official Link <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
