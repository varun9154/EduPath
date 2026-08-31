'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Sparkles, AlertCircle } from 'lucide-react';
import statesData from '@/data/states.json';

export default function StudentRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    educationLevel: '12th Appearing',
    stream: 'Science (PCM)',
    state: 'Karnataka',
    city: 'Bengaluru',
    marks10th: '85%',
    marks12th: '80%',
    interestedCourse: 'B.Tech Computer Science',
    careerGoal: 'Software Development Engineer',
    entranceExam: 'KCET'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Submit Registration API
      const regRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const regData = await regRes.json();

      if (regData.success) {
        const authRes = await fetch('/api/auth/student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'register', email: form.email, password: form.password })
        });
        const authData = await authRes.json().catch(() => ({}));
        if (!authRes.ok || !authData.success) {
          setErrorMessage(authData.message || 'Account credentials could not be created.');
          return;
        }

        const studentData = { ...(authData.student || {}), ...form };
        if (!studentData.studentId && authData.student?.id) studentData.studentId = authData.student.id;
        localStorage.setItem('edupath_student', JSON.stringify(studentData));
        router.replace('/dashboard');
        router.refresh();
      } else {
        setErrorMessage(regData.message || 'Registration failed.');
      }
    } catch (err) {
      setErrorMessage('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Create EduPath Student Account</h1>
        <p className="text-xs text-slate-500">From 10th to Your First Job — One Complete Roadmap</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Student Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rohan Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="rohan@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
            <input
              type="tel"
              required
              placeholder="+91 9876543210"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">State / UT *</label>
            <select
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            >
              {statesData.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">City *</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Target Interested Course *</label>
          <input
            type="text"
            required
            placeholder="e.g. B.Pharm, B.Tech CSE, MBBS, LLB"
            value={form.interestedCourse}
            onChange={(e) => setForm({ ...form, interestedCourse: e.target.value })}
            className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Complete Student Registration'}
        </button>

        <div className="text-center pt-2 text-slate-500">
          Already registered? <Link href="/login" className="font-bold text-brand-600 hover:underline">Log in</Link>
        </div>
      </form>
    </div>
  );
}
