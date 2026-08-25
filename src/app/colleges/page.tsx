'use client';

import React, { useState } from 'react';
import { GraduationCap, MapPin, ExternalLink, ShieldCheck, Filter } from 'lucide-react';
import collegesData from '@/data/colleges.json';

export default function CollegesPage() {
  const [selectedState, setSelectedState] = useState('All');

  const states = ['All', 'Karnataka', 'Maharashtra'];
  const filteredColleges = selectedState === 'All' ? collegesData : collegesData.filter(c => c.state === selectedState);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700">
          <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
          <span>Verified College Directory & Admission Matrix</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          College Discovery & Comparison Engine
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Search accredited colleges across Engineering, Pharmacy, Medical, and Law. All statistics cite official NAAC/NIRF accreditation reports.
        </p>
      </div>

      <div className="flex space-x-2 text-xs font-semibold">
        {states.map(s => (
          <button
            key={s}
            onClick={() => setSelectedState(s)}
            className={`px-4 py-2 rounded-xl transition ${selectedState === s ? 'bg-slate-900 text-white font-bold' : 'bg-white border border-slate-200 text-slate-700'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredColleges.map((col) => (
          <div key={col.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-purple-300 transition space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-md">{col.type}</span>
              <span className="text-xs text-slate-500 font-medium">{col.accreditation}</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">{col.name}</h3>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {col.city}, {col.state}
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="font-bold text-slate-700">Accepted Entrance Exams:</div>
              <div className="flex flex-wrap gap-1">
                {col.acceptedExams.map((ex, idx) => (
                  <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">{ex}</span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Tier: {col.tier}</span>
              <a href={col.website} target="_blank" rel="noreferrer" className="text-xs font-bold text-purple-600 hover:underline flex items-center">
                Official Website <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
