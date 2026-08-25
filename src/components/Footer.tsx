import React from 'react';
import Link from 'next/link';
import { GraduationCap, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import statesData from '@/data/states.json';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2 font-black text-xl text-white">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span>EduPath</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              From 10th to Your First Job — We Show You the Path.
            </p>
            <div className="pt-2 text-xs space-y-1 text-slate-500">
              <div className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-2 text-brand-400" />
                <span>support@edupath.in</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-2 text-brand-400" />
                <span>+91 9154422624 (Admin Helpdesk)</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">EduPath Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/entrance-exams" className="hover:text-white transition">36 States Entrance Exams</Link></li>
              <li><Link href="/courses" className="hover:text-white transition">Pharmacy (D.Pharm, B.Pharm, Pharm.D)</Link></li>
              <li><Link href="/courses" className="hover:text-white transition">Engineering & Computer Science</Link></li>
              <li><Link href="/journey" className="hover:text-white transition">16-Step Career Roadmap</Link></li>
              <li><Link href="/ai-counsellor" className="hover:text-white transition">Verified AI Counsellor</Link></li>
            </ul>
          </div>

          {/* 36 States Sample Links */}
          <div className="md:col-span-2">
            <h4 className="text-white font-bold text-sm mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-cyan-400" />
              All 36 States & UTs Entrance Exam Explorer
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
              {statesData.slice(0, 15).map(s => (
                <Link
                  key={s.id}
                  href={`/entrance-exams/${s.id}`}
                  className="hover:text-cyan-300 transition truncate"
                >
                  • {s.name} ({s.code})
                </Link>
              ))}
              <Link href="/entrance-exams" className="text-brand-400 font-bold hover:underline col-span-2">
                + View all 36 States & UTs →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>© {new Date().getFullYear()} EduPath AI. All rights reserved. Cloud-based Lead Architecture.</div>
          <div className="mt-2 sm:mt-0 flex space-x-4">
            <Link href="/admin" className="hover:text-amber-400 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
