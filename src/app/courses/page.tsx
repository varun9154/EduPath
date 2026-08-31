'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Search, Sparkles } from 'lucide-react';
import coursesData from '@/data/courses.json';

const categories = ['All', ...Array.from(new Set(coursesData.map((course) => course.category))).sort()];

export default function CoursesPage() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coursesData.filter((course) => {
      const categoryMatch = category === 'All' || course.category === category;
      const searchMatch = !q || [course.name, course.category, course.overview, ...course.careerPathways, ...course.topExams].join(' ').toLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });
  }, [category, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-brand-950 to-slate-950 text-white p-7 sm:p-10 shadow-xl border border-slate-800">
        <div className="flex items-center gap-2 text-brand-300 text-xs font-bold uppercase tracking-wider"><BookOpen className="w-4 h-4" /> EduPath Learning Hub</div>
        <h1 className="mt-3 text-3xl sm:text-5xl font-black">Courses, Skills & Career Roadmaps</h1>
        <p className="mt-3 text-sm text-slate-300 max-w-3xl">Explore degree pathways and skill-based learning from foundation to professional level. Each course has a structured syllabus, topic roadmap, practice, quizzes, mock tests and a capstone path.</p>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search DSA, DevOps, MBBS, B.Tech, AI, Law..." className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-brand-500 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} className={`px-3 py-2 rounded-xl text-xs font-bold ${category === item ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{item}</button>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between text-sm">
        <p className="font-bold text-slate-800">{filtered.length} learning paths</p>
        <p className="text-slate-500">Basic → Intermediate → Advanced → Professional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((course) => (
          <article key={course.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-brand-300 transition flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">{course.category}</span>
              <span className="text-[11px] text-slate-500 font-semibold">{course.duration}</span>
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">{course.name}</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{course.overview}</p>
            <div className="mt-4 space-y-1.5">
              {course.careerPathways.slice(0, 4).map((path) => <div key={path} className="text-xs text-slate-700">• {path}</div>)}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-slate-500">{course.topExams.slice(0, 3).join(' • ')}</span>
              <Link href={`/courses/${course.id}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-brand-600 transition">View Course <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && <div className="py-16 text-center text-slate-500 text-sm">No course matched your search.</div>}

      <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div><div className="font-black text-slate-900">Need help choosing a course?</div><div className="text-xs text-slate-600 mt-1">Use the AI Counsellor to map your state, exam, interests and target job.</div></div>
        <Link href="/ai-counsellor" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold"><Sparkles className="w-4 h-4" /> Ask AI Counsellor</Link>
      </div>
    </div>
  );
}
