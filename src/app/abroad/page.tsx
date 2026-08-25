'use client';

import React from 'react';
import { Compass, ExternalLink, Globe } from 'lucide-react';

export default function AbroadGuidancePage() {
  const destinations = [
    { country: 'USA', tests: 'SAT, TOEFL / IELTS, GRE', fee: '$$$', focus: 'Computer Science, AI, STEM, MBA' },
    { country: 'UK', tests: 'IELTS / PTE', fee: '$$$', focus: 'Pharmacy, Law, Finance, Data Science' },
    { country: 'Canada', tests: 'IELTS, TEF', fee: '$$', focus: 'Engineering, Biotechnology, Healthcare' },
    { country: 'Germany', tests: 'IELTS / TestDaF', fee: 'Low / Free Tuition', focus: 'Mechanical, Automotive, Mechatronics, Public Universities' },
    { country: 'Australia', tests: 'IELTS / PTE', fee: '$$$', focus: 'Nursing, Cyber Security, Civil Eng, Agriculture' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800">
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>Global Higher Education Framework</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          India + Global Study Pathways
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Compare higher education options in India vs USA, UK, Canada, Germany, and Australia. Review standard tests, tuition ranges, post-study work visas, and official university portals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations.map((d, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-slate-900">{d.country}</span>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 text-[11px] font-bold rounded">{d.fee}</span>
            </div>
            <p className="text-xs text-slate-600">Standard Tests: <strong>{d.tests}</strong></p>
            <p className="text-xs text-slate-600">Popular Focus: <strong>{d.focus}</strong></p>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Disclaimer: Tuition & visa regulations subject to official embassy guidelines.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
