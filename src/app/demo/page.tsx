'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import DemoModal from '@/components/DemoModal';

export default function DemoPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold rounded-full">
        <Sparkles className="w-4 h-4 text-brand-500" />
        <span>Official EduPath Demo Booking</span>
      </div>
      <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
        Book Your Free 1-on-1 EduPath Demo
      </h1>
      <p className="text-slate-600 text-sm max-w-xl mx-auto">
        Complete the 10 simple questions below to reserve your counselling slot.
      </p>

      <div className="pt-4">
        <button
          onClick={() => setIsOpen(true)}
          className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-brand-500/25 transition"
        >
          Open Demo Booking Wizard
        </button>
      </div>

      <DemoModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
