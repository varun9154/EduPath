'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, GraduationCap, MapPin, Menu, Route, X, User, FileText, Award, Compass, LogOut, LayoutDashboard, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DemoModal from './DemoModal';
import AuthGuardModal from './AuthGuardModal';

type StudentInfo = { id?: string; studentId?: string; name?: string; email?: string; };
const NAV = [
  ['/entrance-exams','36 States Exams',MapPin,'text-cyan-400'],
  ['/courses','Courses',Compass,'text-brand-400'],
  ['/resources','Resources',FileText,'text-amber-400'],
  ['/colleges','Colleges',GraduationCap,'text-purple-400'],
  ['/scholarships','Scholarships',Award,'text-yellow-400'],
  ['/journey','10th → First Job',Route,'text-emerald-400'],
  ['/ai-counsellor','AI Counsellor',Bot,'text-pink-400'],
] as const;

export default function Navbar() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [ready, setReady] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [targetPath, setTargetPath] = useState('/');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch('/api/auth/student', { credentials: 'include', cache: 'no-store' })
      .then(async (res) => ({ res, data: await res.json().catch(() => ({})) }))
      .then(({ res, data }) => {
        if (!active) return;
        if (res.ok && data?.authenticated && data?.student) {
          setStudent(data.student);
          localStorage.setItem('edupath_student', JSON.stringify(data.student));
        } else {
          setStudent(null);
        }
      })
      .catch(() => { if (active) setStudent(null); })
      .finally(() => active && setReady(true));
    return () => { active = false; };
  }, []);

  const navigate = (path: string) => {
    const protectedRoutes = ['/dashboard','/courses','/entrance-exams','/resources','/colleges','/scholarships','/journey','/ai-counsellor','/mock-tests'];
    if (!student && protectedRoutes.some((x)=>path===x || path.startsWith(`${x}/`))) {
      setTargetPath(path); setAuthModal(true); setMobileOpen(false); return;
    }
    router.push(path);
  };

  const logout = async () => {
    try { await fetch('/api/auth/student', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({action:'logout'}) }); } catch {}
    localStorage.removeItem('edupath_student');
    setStudent(null);
    router.replace('/');
    router.refresh();
  };

  return <>
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"><Link href="/" className="flex items-center gap-2.5 font-black text-xl"><div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center shadow-lg"><GraduationCap className="w-5 h-5"/></div><span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-brand-300">EduPath AI</span></Link><nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-300"><Link href="/" className="hover:text-white">Home</Link>{NAV.map(([href,label,Icon,iconClass])=><button key={href} type="button" onClick={()=>navigate(href)} className="flex items-center hover:text-white transition"><Icon className={`w-3.5 h-3.5 mr-1 ${iconClass}`}/>{label}</button>)}</nav><div className="hidden lg:flex items-center gap-3">{ready && student ? <><Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 rounded-xl text-xs font-bold"><LayoutDashboard className="w-3.5 h-3.5"/>{student.name || 'Dashboard'}</Link><button type="button" onClick={logout} className="p-2 rounded-xl bg-slate-800 hover:bg-red-600"><LogOut className="w-4 h-4"/></button></> : <><Link href="/login" className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700"><User className="w-3.5 h-3.5 mr-1 text-brand-400"/>Login</Link><button type="button" onClick={()=>setDemoOpen(true)} className="flex items-center px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-xs rounded-xl shadow-lg"><Sparkles className="w-3.5 h-3.5 mr-1.5"/>BOOK A FREE DEMO</button></>}</div><button type="button" onClick={()=>setMobileOpen(v=>!v)} className="lg:hidden p-2 rounded-lg text-slate-300">{mobileOpen?<X className="w-6 h-6"/>:<Menu className="w-6 h-6"/>}</button></div>{mobileOpen&&<div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 text-xs"><Link href="/" onClick={()=>setMobileOpen(false)} className="block py-1.5">Home</Link>{NAV.map(([href,label,Icon])=><button key={href} type="button" onClick={()=>navigate(href)} className="flex items-center w-full text-left py-1.5 text-slate-200"><Icon className="w-4 h-4 mr-2"/>{label}</button>)}{student?<button onClick={logout} className="flex items-center py-1.5 text-red-400"><LogOut className="w-4 h-4 mr-2"/>Logout</button>:<Link href="/login" onClick={()=>setMobileOpen(false)} className="block py-1.5 text-brand-400 font-bold">Login</Link>}<button type="button" onClick={()=>{setMobileOpen(false);setDemoOpen(true)}} className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl">BOOK A FREE DEMO</button></div>}</header><DemoModal isOpen={demoOpen} onClose={()=>setDemoOpen(false)}/><AuthGuardModal targetPath={targetPath} isOpen={authModal} onClose={()=>setAuthModal(false)}/></>;
}
