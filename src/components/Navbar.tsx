// src/components/Navbar.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import DemoModal from './DemoModal';
import AuthGuardModal from './AuthGuardModal';

const PROTECTED_ROUTES = [
  '/entrance-exams',
  '/courses',
  '/resources',
  '/colleges',
  '/journey',
  '/ai-counsellor',
  '/roadmap',
  '/mock-tests',
];

export default function Navbar() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [targetPath, setTargetPath] = useState('/');

  const pathname = usePathname();
  const router = useRouter();

  const isProtectedPath = (path: string) => {
    return PROTECTED_ROUTES.some(
      (route) => path === route || path.startsWith(`${route}/`)
    );
  };

  const handleProtectedNavigation = (path: string) => {
    const sessionCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('edupath_student_sess='));

    if (sessionCookie) {
      router.push(path);
      setMobileMenuOpen(false);
      return;
    }

    setTargetPath(path);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    if (isProtectedPath(path)) {
      handleProtectedNavigation(path);
    } else {
      router.push(path);
      setMobileMenuOpen(false);
    }
  };

  const NavItem = ({
    href,
    children,
    className = '',
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={() => handleNavigation(href)}
      className={className}
    >
      {children}
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2.5 font-black text-xl tracking-tight"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>

            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-brand-300">
              EduPath AI
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-5 text-xs font-medium text-slate-300">

            <Link href="/" className="hover:text-white transition">
              Home
            </Link>

            <NavItem
              href="/entrance-exams"
              className="flex items-center hover:text-white transition"
            >
              <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              36 States Exams
            </NavItem>

            <NavItem
              href="/courses"
              className="flex items-center hover:text-white transition"
            >
              <Compass className="w-3.5 h-3.5 mr-1 text-brand-400" />
              Courses & Pharmacy
            </NavItem>

            <NavItem
              href="/resources"
              className="flex items-center hover:text-white transition"
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Resources
            </NavItem>

            <NavItem
              href="/colleges"
              className="flex items-center hover:text-white transition"
            >
              <GraduationCap className="w-3.5 h-3.5 mr-1 text-purple-400" />
              Colleges
            </NavItem>

            <NavItem
              href="/journey"
              className="flex items-center hover:text-white transition"
            >
              <Route className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              16-Step Journey
            </NavItem>

            <NavItem
              href="/ai-counsellor"
              className="flex items-center hover:text-white transition"
            >
              <Bot className="w-3.5 h-3.5 mr-1 text-pink-400" />
              AI Counsellor
            </NavItem>
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center space-x-3">

            {/* ONE LOGIN BUTTON */}
            <Link
              href="/login"
              className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
            >
              <User className="w-3.5 h-3.5 mr-1 text-brand-400" />
              Login
            </Link>

            <button
              onClick={() => setIsDemoOpen(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 transition transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              BOOK A FREE DEMO
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 text-xs">

            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-200"
            >
              Home
            </Link>

            <button
              onClick={() => handleNavigation('/entrance-exams')}
              className="block w-full text-left py-1.5 text-slate-200"
            >
              36 States Exams
            </button>

            <button
              onClick={() => handleNavigation('/courses')}
              className="block w-full text-left py-1.5 text-slate-200"
            >
              Courses & Pharmacy
            </button>

            <button
              onClick={() => handleNavigation('/resources')}
              className="block w-full text-left py-1.5 text-slate-200"
            >
              Study Resources
            </button>

            <button
              onClick={() => handleNavigation('/colleges')}
              className="block w-full text-left py-1.5 text-slate-200"
            >
              Colleges
            </button>

            <button
              onClick={() => handleNavigation('/journey')}
              className="block w-full text-left py-1.5 text-slate-200"
            >
              16-Step Journey
            </button>

            <button
              onClick={() => handleNavigation('/ai-counsellor')}
              className="block w-full text-left py-1.5 text-slate-200"
            >
              AI Counsellor
            </button>

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-brand-400 font-bold"
            >
              Login
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsDemoOpen(true);
              }}
              className="w-full py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow mt-2"
            >
              BOOK A FREE DEMO
            </button>
          </div>
        )}
      </header>

      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />

      <AuthGuardModal
        targetPath={targetPath}
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}