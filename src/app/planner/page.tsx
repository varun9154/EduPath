'use client';

import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Plus } from 'lucide-react';

export default function StudyPlannerPage() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Revise KCET Physics Formulae (Mechanics & Electromagnetism)', done: true },
    { id: 2, title: 'Solve 30 Previous Year MHT-CET Organic Chemistry MCQs', done: false },
    { id: 3, title: 'Review B.Pharm / Pharm.D Dosage Forms & Pharmaceutics Notes', done: false }
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Daily & Weekly Preparation Tracking</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">EduPath Daily Study Planner</h1>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Keep track of your exam preparation milestones, daily revision tasks, and streak.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3 text-xs font-bold text-slate-700">
          <span>Today&apos;s Revision Tasks</span>
          <span className="text-emerald-600 font-bold">{tasks.filter(t => t.done).length} / {tasks.length} Completed</span>
        </div>

        <div className="space-y-2 text-xs">
          {tasks.map(t => (
            <div
              key={t.id}
              onClick={() => toggleTask(t.id)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                t.done ? 'bg-emerald-50 border-emerald-200 text-emerald-900 line-through' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span>{t.title}</span>
              <CheckCircle2 className={`w-4 h-4 ${t.done ? 'text-emerald-600' : 'text-slate-300'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
