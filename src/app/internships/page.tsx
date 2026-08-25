'use client';

import React from 'react';
import { Briefcase, ExternalLink } from 'lucide-react';
import jobsData from '@/data/jobs.json';

export default function InternshipsPage() {
  const internships = jobsData.filter(j => j.type === 'Internship' || j.id === 'intern-devops');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-bold text-cyan-800">
          <Briefcase className="w-3.5 h-3.5 text-cyan-600" />
          <span>Summer Internships & Industrial Training</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          Summer Internships & Industrial Exposure
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Pre-final and final year internship opportunities across tech, pharma labs, core engineering, and corporate law.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {internships.map((job) => (
          <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-cyan-50 text-cyan-800 font-bold text-xs rounded-md">Internship</span>
              <span className="text-xs text-slate-500 font-semibold">{job.domain}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
            <p className="text-xs text-slate-600">Eligibility: {job.eligibility}</p>
            <a href={job.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-bold text-cyan-600 hover:underline">
              Official Portal Application <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
