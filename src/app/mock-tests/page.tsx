'use client';

import React, { useState } from 'react';
import { BookOpen, Clock, CheckCircle2, Award, ArrowRight } from 'lucide-react';

export default function MockTestsPage() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);

  const sampleQuestions = [
    {
      q: "In KCET Physics, what is the SI unit of magnetic flux density?",
      opts: ["Tesla (T)", "Weber (Wb)", "Gauss (G)", "Henry (H)"],
      ans: 0
    },
    {
      q: "Which official authority conducts the MHT-CET examination in Maharashtra?",
      opts: ["State Common Entrance Test Cell", "MSBTE", "Pune University", "DTE Maharashtra"],
      ans: 0
    },
    {
      q: "In B.Pharm curriculum, which subject deals with drug formulation and dosage forms?",
      opts: ["Pharmaceutics", "Pharmacognosy", "Pharmaceutical Chemistry", "Pathology"],
      ans: 0
    }
  ];

  const handleSelectOption = (idx: number) => {
    setSelectedOpt(idx);
  };

  const handleNextQ = () => {
    if (currentQ < sampleQuestions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedOpt(null);
    } else {
      setScore(2); // Completed
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-bold text-cyan-800">
          <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
          <span>Interactive CBT Practice Engine</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">EduPath CBT Mock Test Suite</h1>
        <p className="text-xs text-slate-600 max-w-lg mx-auto">
          Practice timed CBT mock tests for KCET, MHT-CET, WBJEE, JEE Main, and NEET-UG with instant subject analysis.
        </p>
      </div>

      {!activeTest ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-slate-900">KCET / MHT-CET Engineering Practice Test</h3>
            <p className="text-xs text-slate-600">3 Questions • Physics, Chemistry & Mathematics</p>
            <button
              onClick={() => setActiveTest('kcet')}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Start Practice Session
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-slate-900">Pharmacy & Medical Practice Test</h3>
            <p className="text-xs text-slate-600">3 Questions • Pharmaceutics & Biology</p>
            <button
              onClick={() => setActiveTest('pharm')}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Start Practice Session
            </button>
          </div>
        </div>
      ) : score !== null ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Mock Test Completed! 🎉</h2>
          <p className="text-sm text-slate-600">Your score: <strong>2 / 3 (66.7% Accuracy)</strong></p>
          <button onClick={() => { setActiveTest(null); setScore(null); setCurrentQ(0); setSelectedOpt(null); }} className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">
            Return to Test Suite
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-lg">
          <div className="flex items-center justify-between border-b pb-3 text-xs font-bold">
            <span className="text-slate-500">Question {currentQ + 1} of {sampleQuestions.length}</span>
            <span className="text-slate-700 flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-cyan-600" /> Time Remaining: 02:45</span>
          </div>

          <h3 className="text-base font-bold text-slate-900">{sampleQuestions[currentQ].q}</h3>

          <div className="space-y-2 text-xs">
            {sampleQuestions[currentQ].opts.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-3 text-left rounded-xl border font-semibold transition ${
                  selectedOpt === idx ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleNextQ}
              disabled={selectedOpt === null}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow disabled:opacity-50"
            >
              {currentQ === sampleQuestions.length - 1 ? 'Submit Test' : 'Next Question'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
