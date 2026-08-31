'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Route, MapPin, Compass, ArrowRight, ShieldCheck, CheckCircle2, Award, Zap, BookOpen, Bot, Star } from 'lucide-react';
import DemoModal from '@/components/DemoModal';
import statesData from '@/data/states.json';
import coursesData from '@/data/courses.json';
import roadmapsData from '@/data/roadmaps.json';

export default function HomePage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const handleOpenDemo = (courseName?: string) => {
    if (courseName) setSelectedCourse(courseName);
    setIsDemoOpen(true);
  };

  return (
    <div className="space-y-16 pb-12">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-16 pb-20 border-b border-slate-800">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[400px] h-[250px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>EduPath AI — Serverless Cloud Guidance Platform</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">Verified Data</span>
          </div>

          {/* Primary Header */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight uppercase">
            <span className="block text-slate-100">FROM 10TH TO</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-cyan-300 to-emerald-400">
              YOUR FIRST JOB
            </span>
          </h1>

          {/* Secondary Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-300 font-medium leading-relaxed">
            One complete roadmap for entrance exams, courses, colleges, skills, internships and careers.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/journey"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 shadow-lg flex items-center justify-center transition transform hover:-translate-y-0.5"
            >
              <Route className="w-4 h-4 mr-2 text-emerald-400" />
              BUILD MY ROADMAP
            </Link>

            {/* HERO DEMO CTA */}
            <button
              onClick={() => handleOpenDemo()}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-500 via-brand-600 to-cyan-600 hover:from-brand-600 hover:to-cyan-700 text-white font-bold text-sm rounded-xl shadow-xl shadow-brand-500/30 flex items-center justify-center transition transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              BOOK A FREE DEMO
            </button>
          </div>

          {/* Secondary Links */}
          <div className="flex items-center justify-center space-x-6 pt-2 text-xs font-semibold text-slate-400">
            <Link href="/entrance-exams" className="hover:text-cyan-300 flex items-center transition">
              <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              EXPLORE ENTRANCE EXAMS (36 STATES) →
            </Link>
            <Link href="/courses" className="hover:text-brand-300 flex items-center transition">
              <Compass className="w-3.5 h-3.5 mr-1 text-brand-400" />
              EXPLORE COURSES & PHARMACY →
            </Link>
          </div>
        </div>
      </section>

      {/* 16-STEP STUDENT JOURNEY SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold text-brand-600 tracking-wider uppercase">End-to-End Progression</div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            The 16-Step Student Journey (10th → First Job)
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            EduPath supports you through every single phase of your higher education and early career lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roadmapsData.slice(0, 8).map((r) => (
            <div key={r.step} className="glass-card p-5 rounded-2xl hover:border-brand-400 transition group">
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition">
                  #{r.step}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{r.stage}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{r.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{r.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link
            href="/journey"
            className="inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
          >
            View Complete 16-Step Timeline <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </section>

      {/* MID-PAGE DEMO CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 bg-brand-500/20 text-brand-300 text-xs font-bold rounded-full border border-brand-500/30">
              Personalized 1-on-1 Guidance
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Unsure which Entrance Exam or Course matches your rank?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Book a 30-minute free demo session with an EduPath senior education counsellor. Get instant score analysis, college shortlists, and career roadmap planning.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleOpenDemo()}
                className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/30 flex items-center transition"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                BOOK A FREE DEMO NOW
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 36 INDIAN STATES & UTs ENTRANCE EXAM EXPLORER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-cyan-600 tracking-wider uppercase">Nationwide Coverage</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              All 36 Indian States & Union Territories
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Explore state-specific entrance exams, eligibility guidelines, and official conducting authorities.
            </p>
          </div>
          <Link
            href="/entrance-exams"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center"
          >
            Explore All 36 States <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {statesData.slice(0, 18).map((s) => (
            <Link
              key={s.id}
              href={`/entrance-exams/${s.id}`}
              className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-cyan-500 hover:shadow-md transition text-slate-800 space-y-1 block"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="truncate">{s.name}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s.code}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {s.topExams.slice(0, 2).join(', ')}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* EXPLICIT PHARMACY & COURSES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold text-emerald-600 tracking-wider uppercase">Degree & Career Programs</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Featured Pathways (Pharmacy, CSE, Medical, Law)
          </h2>
          <p className="text-xs text-slate-600 max-w-xl mx-auto">
            From D.Pharm/B.Pharm pharma industry careers to B.Tech software engineering roles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coursesData.slice(0, 3).map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-md">{c.category}</span>
                  <span className="text-xs text-slate-500 font-medium">{c.duration}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{c.overview}</p>
                
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase">Career Roles & First Job:</div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {c.careerPathways.slice(0, 3).map((p, idx) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => handleOpenDemo(c.name)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Book Demo for {c.name.split(' ')[0]}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRE-FOOTER DEMO CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-600 to-cyan-700 rounded-3xl p-8 sm:p-12 text-white text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-black">
            Ready to Plan Your Journey from 12th to Your First Job?
          </h2>
          <p className="text-sm text-cyan-100 max-w-2xl mx-auto">
            Book your free demo session now. Our team will contact you to confirm your slot.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleOpenDemo()}
              className="px-8 py-4 bg-white text-brand-700 hover:bg-slate-100 font-extrabold text-sm rounded-xl shadow-lg transition transform hover:scale-105"
            >
              BOOK A FREE DEMO
            </button>
          </div>
        </div>
      </section>

      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        defaultCourse={selectedCourse}
      />

    </div>
  );
}
