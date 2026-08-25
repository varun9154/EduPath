'use client';

import React, { useState } from 'react';
import { Compass, CheckCircle2, Sparkles } from 'lucide-react';
import DemoModal from '@/components/DemoModal';
import coursesData from '@/data/courses.json';

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [defaultCourse, setDefaultCourse] = useState('');

  const categories = ['All', ...Array.from(new Set(coursesData.map((course) => course.category)))];

  const filteredCourses = selectedCategory === 'All'
    ? coursesData
    : coursesData.filter(c => c.category === selectedCategory);

  const handleOpenDemo = (courseName: string) => {
    setDefaultCourse(courseName);
    setIsDemoOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700">
          <Compass className="w-3.5 h-3.5 text-brand-500" />
          <span>Degree Pathways & Career Roadmaps</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Complete Course & Career Pathway Catalog
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          From 10th grade to your first job: Explore every listed undergraduate and postgraduate pathway with verified career tracks in Pharmacy (D.Pharm, B.Pharm, Pharm.D, M.Pharm), Computer Science, AI/ML, Medical, Law, and Management.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2.5 rounded-xl transition ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat} {cat === 'Pharmacy' && '💊'}
          </button>
        ))}
      </div>

      {/* Courses Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-brand-400 hover:shadow-lg transition flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-brand-50 text-brand-700 font-bold text-xs rounded-lg">
                  {c.category}
                </span>
                <span className="text-xs text-slate-500 font-semibold">{c.duration}</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Eligibility: {c.eligibility}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{c.overview}</p>

              {/* Career Pathways (Degree -> First Job) */}
              <div className="pt-2 space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Degree to First Job Pathways:
                </div>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl">
                  {c.careerPathways.map((path, idx) => (
                    <div key={idx} className="flex items-start text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                      <span>{path}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entrance Exams */}
              <div className="pt-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Applicable Entrance Exams:</div>
                <div className="flex flex-wrap gap-1">
                  {c.topExams.map((ex, idx) => (
                    <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => handleOpenDemo(c.name)}
                className="w-full py-3 bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Book Free Demo for {c.name.split(' ')[0]}
              </button>
            </div>
          </div>
        ))}
      </div>

      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        defaultCourse={defaultCourse}
      />
    </div>
  );
}
