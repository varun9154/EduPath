'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, ShieldCheck, ExternalLink, ArrowLeft, CheckCircle2, Calendar } from 'lucide-react';
import statesData from '@/data/states.json';
import examsData from '@/data/exams.json';

export default function StateExamsDetailPage() {
  const params = useParams();
  const stateId = params.state as string;

  const stateInfo = statesData.find(s => s.id === stateId);
  const stateExams = examsData.filter(e => e.stateId === stateId);
  const nationalIds = new Set(['jee-main', 'neet-ug', 'cuet-ug', 'clat', 'gpat', 'gate']);
  const nationalExams = examsData.filter(e => nationalIds.has(e.id) || String(e.courseCategory || '').toLowerCase().includes('all india'));
  const displayedNationalExams = nationalExams.filter(e => !stateExams.some(s => s.id === e.id));

  if (!stateInfo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">State / UT Not Found</h2>
        <p className="text-slate-600 text-sm">The specified state identifier is not recognized.</p>
        <Link href="/entrance-exams" className="inline-block px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl">
          Back to 36 States List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Back Button */}
      <Link href="/entrance-exams" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to All 36 States & UTs
      </Link>

      {/* State Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 space-y-3 relative overflow-hidden">
        <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
          <MapPin className="w-4 h-4" />
          <span>{stateInfo.type} • Code: {stateInfo.code}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black">{stateInfo.name} Entrance Exam Explorer</h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          Official conducting authority guidelines, eligibility criteria, exam patterns, and verified source citations for higher education admissions in {stateInfo.name}.
        </p>
      </div>

      {/* State Specific Verified Exams */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <ShieldCheck className="w-6 h-6 mr-2 text-emerald-600" />
          State Admissions & Entrance Exams in {stateInfo.name} ({stateExams.length})
        </h2>

        {stateExams.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 text-sm space-y-2">
            <p><strong>Note:</strong> Admissions in {stateInfo.name} for technical and medical courses primarily use National level normalized merit scores (JEE Main, NEET-UG, CUET-UG) followed by state centralized counselling.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {stateExams.map((exam) => (
              <div key={exam.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-brand-300 transition space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-md">
                        {exam.dataQualityLabel || 'Verified'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Verified: {exam.lastVerifiedDate}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">{exam.fullName} ({exam.examName})</h3>
                  </div>

                  <a
                    href={exam.officialWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                  >
                    Official Portal <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-500" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                    <span className="font-bold text-slate-700 block">Conducting Authority:</span>
                    <span className="text-slate-600">{exam.conductingAuthority}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                    <span className="font-bold text-slate-700 block">Covered Courses:</span>
                    <span className="text-slate-600 font-semibold">{exam.courseCategory}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 md:col-span-2">
                    <span className="font-bold text-slate-700 block">Eligibility Criteria:</span>
                    <span className="text-slate-600 leading-relaxed">{exam.eligibility}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 md:col-span-2">
                    <span className="font-bold text-slate-700 block">Exam Pattern:</span>
                    <span className="text-slate-600 leading-relaxed">{exam.examPattern}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Source: {exam.officialSource}</span>
                  <span className="font-semibold text-slate-700">Tag: Verified Official Dataset</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-2 text-brand-600" />
            National / All-India Exams for {stateInfo.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">State preference personalizes local opportunities, but national opportunities remain visible.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedNationalExams.map((exam) => (
            <div key={exam.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-black">NATIONAL</span>
                <span className="text-[10px] text-slate-500">{exam.lastVerifiedDate}</span>
              </div>
              <h3 className="mt-3 text-lg font-black text-slate-900">{exam.fullName} ({exam.examName})</h3>
              <p className="text-xs text-slate-600 mt-2">{exam.courseCategory}</p>
              <a href={exam.officialWebsite} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-brand-600">Official portal <ExternalLink className="w-3 h-3"/></a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
