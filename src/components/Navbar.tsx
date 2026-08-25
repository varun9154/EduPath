'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  GraduationCap,
  MapPin,
  Route,
  Bot,
  Menu,
  X,
  Sparkles,
  User,
  FileText,
  BriefcaseBusiness,
} from 'lucide-react';
import DemoModal from './DemoModal';

const NAV_ITEMS = [
  { href: '/entrance-exams', label: '36 States Exams', icon: MapPin, iconClass: 'text-cyan-400' },
  { href: '/courses', label: 'Courses', icon: Compass, iconClass: 'text-brand-400' },
  { href: '/resources', label: 'Resources', icon: FileText, iconClass: 'text-amber-400' },
  { href: '/colleges', label: 'Colleges', icon: GraduationCap, iconClass: 'text-purple-400' },
  { href: '/journey', label: '10th → First Job', icon: Route, iconClass: 'text-emerald-400' },
  { href: '/ai-counsellor', label: 'AI Counsellor', icon: Bot, iconClass: 'text-pink-400' },
];

export default function Navbar() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openDemo = () => {
    setMobileMenuOpen(false);
    setIsDemoOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2.5 font-black tracking-tight" aria-label="EduPath home">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 shadow-lg shadow-brand-500/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-xl text-transparent">
              EduPath AI
            </span>
          </Link>

          <nav className="hidden items-center space-x-5 text-xs font-medium text-slate-300 lg:flex">
            <Link href="/" className="transition hover:text-white">Home</Link>
            {NAV_ITEMS.map(({ href, label, icon: Icon, iconClass }) => (
              <button
                key={href}
                type="button"
                onClick={openDemo}
                className="flex items-center transition hover:text-white"
                title={`Book a free demo for ${label}`}
              >
                <Icon className={`mr-1 h-3.5 w-3.5 ${iconClass}`} />
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center space-x-3 lg:flex">
            <Link href="/login" className="flex items-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700">
              <User className="mr-1 h-3.5 w-3.5 text-brand-400" />
              Login
            </Link>
            <button
              type="button"
              onClick={openDemo}
              className="flex items-center rounded-xl bg-gradient-to-r from-brand-500 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/25 transition hover:-translate-y-0.5 hover:from-brand-600 hover:to-cyan-700"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              BOOK A FREE DEMO
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="space-y-2 border-b border-slate-800 bg-slate-900 px-4 pb-4 pt-2 text-xs lg:hidden">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">Home</Link>
            {NAV_ITEMS.map(({ href, label, icon: Icon, iconClass }) => (
              <button
                key={href}
                type="button"
                onClick={openDemo}
                className="flex w-full items-center py-2 text-left text-slate-200"
              >
                <Icon className={`mr-2 h-4 w-4 ${iconClass}`} />
                {label}
              </button>
            ))}
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center py-2 font-bold text-brand-400">
              <User className="mr-2 h-4 w-4" /> Login
            </Link>
            <button type="button" onClick={openDemo} className="mt-2 flex w-full items-center justify-center rounded-xl bg-brand-600 py-2.5 font-bold text-white shadow">
              <BriefcaseBusiness className="mr-2 h-4 w-4" /> BOOK A FREE DEMO
            </button>
          </div>
        )}
      </header>

      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </>
  );
}
