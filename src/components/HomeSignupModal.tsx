'use client';

import Link from 'next/link';
import { GraduationCap, ShieldCheck, Sparkles, X } from 'lucide-react';

interface HomeSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HomeSignupModal({ isOpen, onClose }: HomeSignupModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-signup-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close registration prompt"
          className="absolute right-4 top-4 z-10 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-7 pb-8 pt-8 text-white sm:px-9">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-brand-200">
            <Sparkles className="h-3.5 w-3.5" />
            Personalised EduPath starts here
          </div>
          <h2 id="home-signup-title" className="text-2xl font-black tracking-tight sm:text-3xl">
            Build your journey from 10th to your first job.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
            Create your free student account to save your roadmap, explore course pathways,
            track progress and get personalised guidance.
          </p>
        </div>

        <div className="space-y-4 px-7 py-7 sm:px-9">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              '10th → career direction',
              'Course & exam roadmap',
              'Skills → internship → job',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                <ShieldCheck className="mb-2 h-4 w-4 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>

          <Link
            href="/register"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-700"
          >
            CREATE FREE STUDENT ACCOUNT
          </Link>

          <div className="text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link href="/login" onClick={onClose} className="font-bold text-brand-600 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
