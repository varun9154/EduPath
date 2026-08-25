'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Route } from 'lucide-react';
import DemoModal from './DemoModal';

export default function MobileStickyCTA() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 shadow-2xl flex items-center space-x-2">
        <Link
          href="/journey"
          className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center border border-slate-700 transition"
        >
          <Route className="w-3.5 h-3.5 mr-1 text-emerald-400" />
          BUILD ROADMAP
        </Link>

        <button
          onClick={() => setIsDemoOpen(true)}
          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 transition"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          BOOK FREE DEMO
        </button>
      </div>

      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </>
  );
}
