'use client';

import React from 'react';
import { Briefcase, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import jobsData from '@/data/jobs.json';

export default function JobsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
          <span>Graduate Roles & Career Placement Directory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          Jobs & Career Placement Portal
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Explore graduate SDE roles, pharma QA/QC positions, DevOps traineeships, and corporate opportunities. All links direct to official corporate career portals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobsData.map((job) => (
          <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-emerald-400 transition space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-md">{job.type}</span>
                <span className="text-xs text-slate-500 font-semibold">{job.domain}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
              <p className="text-xs text-slate-500">Eligibility: {job.eligibility}</p>

              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 block">Required Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {job.skills.map((sk, idx) => (
                    <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">{sk}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Verified: {job.lastVerifiedAt}</span>
              <a href={job.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition">
                Apply on Official Site <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
