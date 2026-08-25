'use client';

import React from 'react';
import { Award, ExternalLink, ShieldCheck } from 'lucide-react';
import scholarshipsData from '@/data/scholarships.json';

export default function ScholarshipsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>Central & State Scholarship Directory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          EduPath Scholarship Finder
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          National Central Sector Schemes, State Post-Matric SSP portals, fee reimbursements, and private merit scholarships.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scholarshipsData.map((sch) => (
          <div key={sch.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-md">{sch.category}</span>
                <span className="text-xs text-slate-500 font-semibold">{sch.provider}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">{sch.name}</h3>
              <p className="text-xs text-slate-600">Course: {sch.course}</p>
              <p className="text-xs text-slate-500 leading-relaxed">Eligibility: {sch.eligibility}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Verified: {sch.lastVerifiedAt}</span>
              <a href={sch.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition">
                Apply on Official Portal <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
