'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Lock, Mail, ShieldAlert, ShieldCheck, Smartphone, User } from 'lucide-react';

type LoginType = 'student' | 'admin';

type StudentResponse = {
  success?: boolean;
  authenticated?: boolean;
  message?: string;
  requiresForce?: boolean;
  student?: Record<string, unknown>;
};

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [requiresForce, setRequiresForce] = useState(false);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/student', { credentials: 'include', cache: 'no-store' });
        const data = (await res.json().catch(() => ({}))) as StudentResponse;
        if (active && res.ok && data.authenticated && data.student) {
          const student = data.student;
          localStorage.setItem('edupath_student', JSON.stringify(student));
          router.replace('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Existing session check failed:', error);
      } finally {
        if (active) setCheckingSession(false);
      }
    };
    checkSession();
    return () => { active = false; };
  }, [router]);

  const resetMessages = () => {
    setErrorMessage('');
    setRequiresForce(false);
  };

  const handleStudentLogin = async (force = false) => {
    if (loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setLoading(true);
    resetMessages();
    try {
      const response = await fetch('/api/auth/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'login',
          email: normalizedEmail,
          password,
          deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser',
          forceSignoutOther: force,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as StudentResponse;
      if (response.status === 409 && data.requiresForce) {
        setRequiresForce(true);
        setErrorMessage(data.message || 'This account is already active on another device.');
        return;
      }

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Invalid student email or password.');
        return;
      }

      const student = {
        ...(data.student || {}),
      } as Record<string, unknown>;
      if (!student.studentId && student.id) student.studentId = student.id;

      localStorage.setItem('edupath_student', JSON.stringify(student));
      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Student login error:', error);
      setErrorMessage('Unable to connect to EduPath. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (loading) return;
    setLoading(true);
    resetMessages();
    try {
      const response = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', email: email.trim().toLowerCase(), password }),
      });
      const data = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Invalid admin credentials.');
        return;
      }
      localStorage.removeItem('edupath_student');
      router.replace('/admin');
      router.refresh();
    } catch (error) {
      console.error('Admin login error:', error);
      setErrorMessage('Unable to connect to EduPath. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginType === 'student') await handleStudentLogin(false);
    else await handleAdminLogin();
  };

  if (checkingSession) {
    return <div className="min-h-[70vh] flex items-center justify-center text-sm text-slate-500">Checking your EduPath session...</div>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center space-y-2 mb-6">
        <div className={`w-12 h-12 rounded-2xl ${loginType === 'admin' ? 'bg-amber-500' : 'bg-brand-600'} flex items-center justify-center mx-auto shadow-lg`}>
          {loginType === 'admin' ? <ShieldCheck className="w-6 h-6 text-white" /> : <GraduationCap className="w-6 h-6 text-white" />}
        </div>
        <h1 className="text-2xl font-black text-slate-900">{loginType === 'admin' ? 'EduPath Admin Login' : 'Welcome back to EduPath'}</h1>
        <p className="text-xs text-slate-500">{loginType === 'admin' ? 'Secure administrator access' : 'Continue your personalized education journey'}</p>
      </div>

      <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-4">
        <button type="button" onClick={() => { setLoginType('student'); resetMessages(); }} className={`py-2 rounded-lg text-xs font-bold ${loginType === 'student' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}><User className="inline w-3.5 h-3.5 mr-1"/>Student</button>
        <button type="button" onClick={() => { setLoginType('admin'); resetMessages(); }} className={`py-2 rounded-lg text-xs font-bold ${loginType === 'admin' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}><ShieldCheck className="inline w-3.5 h-3.5 mr-1"/>Admin</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
        {errorMessage && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0"/><span>{errorMessage}</span></div>}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder={loginType === 'admin' ? 'admin@edupath.in' : 'student@example.com'} className="w-full pl-9 pr-3 py-3 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"/></div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" className="w-full pl-9 pr-3 py-3 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"/></div>
        </div>

        {loginType === 'student' && <div className="flex items-start gap-2 p-3 bg-brand-50 border border-brand-100 rounded-xl text-[10px] text-slate-600"><Smartphone className="w-4 h-4 text-brand-600 shrink-0"/><span>Your secure student session is maintained on the server. You should not need to log in again while the session is valid.</span></div>}

        <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl text-white text-xs font-black transition disabled:opacity-50 ${loginType === 'admin' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-brand-600 hover:bg-brand-700'}`}>{loading ? 'Signing in...' : loginType === 'admin' ? 'Sign in as Admin' : 'Sign in as Student'}</button>

        {loginType === 'student' && requiresForce && <button type="button" onClick={()=>handleStudentLogin(true)} disabled={loading} className="w-full py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-black">Sign out the other device & continue</button>}

        {loginType === 'student' && <p className="text-center text-xs text-slate-500">New student? <Link href="/register" className="font-bold text-brand-600 hover:underline">Create your account</Link></p>}
      </form>
    </div>
  );
}
