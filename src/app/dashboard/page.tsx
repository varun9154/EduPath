'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, BookOpen, Calendar, CheckCircle2, Clock, Code2, Compass, GraduationCap, LogOut, MapPin, Route, Sparkles, Target, Trophy } from 'lucide-react';

type Student = { studentId: string; id?: string; name?: string; email?: string; phone?: string; mobile?: string; educationLevel?: string; stream?: string; state?: string; city?: string; careerGoal?: string; interestedCourse?: string; targetJob?: string; targetExam?: string; preferredExam?: string; skills?: string[]; onboardingCompleted?: boolean; };
type DemoBooking = { bookingId: string; studentId?: string; name?: string; email?: string; mobile?: string; interestedCourse?: string; counsellingMode?: string; preferredDate?: string; preferredTimeSlot?: string; status?: string; counsellor?: string; createdAt?: string; updatedAt?: string; };

type RoadmapItem = { number: number; title: string; description: string; status: 'current'|'next'|'locked'; items: string[] };

export default function StudentDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [demoRequests, setDemoRequests] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const session = await fetch('/api/auth/student', { credentials:'include', cache:'no-store' });
        const sessionData = await session.json().catch(()=>({}));
        if (!session.ok || !sessionData?.authenticated || !sessionData?.student) {
          localStorage.removeItem('edupath_student');
          router.replace('/login');
          return;
        }
        const current: Student = { ...sessionData.student };
        if (!current.studentId && current.id) current.studentId = current.id;
        if (!mounted) return;
        setStudent(current);
        localStorage.setItem('edupath_student', JSON.stringify(current));

        const dashboard = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(current.studentId)}`, { credentials:'include', cache:'no-store' });
        if (dashboard.ok) {
          const data = await dashboard.json().catch(()=>({}));
          if (data?.success && mounted) {
            if (data.student) {
              const merged = { ...current, ...data.student } as Student;
              setStudent(merged);
              localStorage.setItem('edupath_student', JSON.stringify(merged));
            }
            if (Array.isArray(data.demoBookings)) setDemoRequests(data.demoBookings);
          }
        }

        const demos = await fetch('/api/student/demos', { credentials:'include', cache:'no-store' });
        if (demos.ok) {
          const data = await demos.json().catch(()=>({}));
          if (Array.isArray(data?.demoBookings) && mounted) setDemoRequests(data.demoBookings);
        }
      } catch (error) {
        console.error('Dashboard loading failed:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [router]);

  const logout = async () => {
    try { await fetch('/api/auth/student', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'logout'}) }); } catch {}
    localStorage.removeItem('edupath_student');
    router.replace('/');
    router.refresh();
  };

  const roadmap = useMemo(() => student ? buildRoadmap(student) : [], [student]);
  if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><div className="text-center"><div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto"/><p className="mt-4 text-sm text-slate-500">Loading your student portal...</p></div></div>;
  if (!student) return null;

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
    <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-brand-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl"><div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl"/><div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6"><div><div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-400/20 text-brand-300 text-xs font-bold"><Sparkles className="w-3.5 h-3.5"/> Personalized Student Portal</div><h1 className="mt-4 text-2xl sm:text-4xl font-black">Welcome back, {student.name || 'Student'}! 👋</h1><p className="mt-2 text-sm text-slate-300 max-w-2xl">Your student dashboard connects your course plan, exams, colleges, scholarships, resources and demo history.</p><div className="flex flex-wrap gap-2 mt-4"><Badge text={student.studentId} icon={<Target className="w-3.5 h-3.5"/>}/><Badge text={student.state || 'India'} icon={<MapPin className="w-3.5 h-3.5"/>}/><Badge text={student.interestedCourse || 'Course not selected'} icon={<GraduationCap className="w-3.5 h-3.5"/>}/></div></div><div className="flex items-center gap-3"><Link href="/ai-counsellor" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 rounded-xl text-xs font-bold">Ask AI Counsellor</Link><button type="button" onClick={logout} className="p-2.5 bg-slate-800 hover:bg-red-600 rounded-xl"><LogOut className="w-4 h-4"/></button></div></div></section>

    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><InfoCard title="Education" value={student.educationLevel || 'Explore'} sub={student.stream || 'Stream not selected'} icon={<GraduationCap className="w-5 h-5"/>}/><InfoCard title="Career Goal" value={student.careerGoal || 'Explore'} sub={student.targetJob || 'Target job pending'} icon={<Target className="w-5 h-5"/>}/><InfoCard title="Entrance Exam" value={student.targetExam || student.preferredExam || 'Not selected'} sub="State + national opportunities" icon={<Trophy className="w-5 h-5"/>}/><InfoCard title="Demo Requests" value={String(demoRequests.length)} sub="Bookings in your portal" icon={<Calendar className="w-5 h-5"/>}/></section>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div className="flex items-center justify-between mb-6"><div><h2 className="text-lg font-black text-slate-900">Your 10th → First Job roadmap</h2><p className="text-xs text-slate-500 mt-1">Personalized stages based on your student profile.</p></div><Link href="/journey" className="text-xs font-bold text-brand-600">Full Journey →</Link></div><div className="space-y-4">{roadmap.map((item)=><div key={item.number} className="flex gap-4"><div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${item.status==='current'?'bg-brand-600 text-white':item.status==='next'?'bg-brand-50 text-brand-700':'bg-slate-100 text-slate-400'}`}>{item.number}</div><div className="flex-1 border-b border-slate-100 pb-4"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900 text-sm">{item.title}</h3><span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{item.status}</span></div><p className="text-xs text-slate-500 mt-1">{item.description}</p><div className="flex flex-wrap gap-2 mt-2">{item.items.map((x)=><span key={x} className="text-[10px] bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-600">{x}</span>)}</div></div></div>)}</div></section>

    <aside className="space-y-6"><section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><h3 className="font-black text-slate-900">Explore your portal</h3><div className="mt-3 space-y-2">{[['/courses','Courses','Study from beginner to advanced'],['/entrance-exams','Exams','State + All India exams'],['/colleges','Colleges','Government + private discovery'],['/scholarships','Scholarships','National + state opportunities'],['/resources','Resources','Syllabus, papers and guides']].map(([href,title,sub])=><Link href={href} key={href} className="block p-3 rounded-xl bg-slate-50 hover:bg-brand-50 transition"><div className="text-xs font-black text-slate-800">{title}</div><div className="text-[10px] text-slate-500 mt-0.5">{sub}</div></Link>)}</div></section><section className="bg-brand-50 border border-brand-100 rounded-2xl p-6"><div className="text-xs font-black text-brand-800">Course progress</div><p className="text-xs text-slate-600 mt-1">Your detailed topic progress appears inside each course learning path.</p><Link href="/courses" className="inline-block mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold">Continue Learning</Link></section></aside></div>

    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h2 className="text-base font-black text-slate-900 flex items-center"><Calendar className="w-4 h-4 mr-2 text-brand-600"/>My Free Demo Requests</h2><p className="text-[11px] text-slate-500 mt-1">Your booking history stays available in your student portal.</p></div><Link href="/demo" className="text-xs font-bold text-brand-600">+ Book New Demo</Link></div>{demoRequests.length===0?<div className="py-8 text-center text-xs text-slate-500">No demo booking yet.</div>:<div className="mt-4 space-y-3">{demoRequests.map((b)=><div key={b.bookingId} className="p-4 bg-slate-50 border border-slate-200 rounded-xl"><div className="flex flex-col sm:flex-row sm:justify-between gap-2"><div><div className="text-xs font-black text-slate-900">{b.bookingId}<span className="ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px]">{b.status || 'REQUEST RECEIVED'}</span></div><div className="text-xs text-slate-600 mt-1">{b.interestedCourse || student.interestedCourse || 'Career Counselling'} • {b.counsellingMode || 'Counselling'}</div><div className="text-[11px] text-slate-500 mt-1"><Clock className="w-3 h-3 inline mr-1"/>{b.preferredDate || 'Date pending'} • {b.preferredTimeSlot || 'Time pending'}</div></div><div className="text-[11px] text-slate-500">Counsellor: <b>{b.counsellor || 'Assigned Soon'}</b></div></div></div>)}</div>}</section>

    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-black text-slate-900">Skills & interests</h2><p className="text-xs text-slate-500 mt-1">Use onboarding to refine your roadmap.</p></div><Code2 className="w-5 h-5 text-brand-600"/></div><div className="mt-4 flex flex-wrap gap-2">{(student.skills || []).length ? student.skills!.map(s=><span key={s} className="px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold">{s}</span>) : <span className="text-xs text-slate-500">No skills selected yet.</span>}</div></section>
  </div>;
}

function Badge({text,icon}:{text:string;icon:React.ReactNode}){return <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-200">{icon}{text}</span>}
function InfoCard({title,value,sub,icon}:{title:string;value:string;sub:string;icon:React.ReactNode}){return <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="flex items-center gap-2 text-brand-600">{icon}<span className="text-[10px] font-bold uppercase text-slate-400">{title}</span></div><div className="mt-2 text-sm font-black text-slate-900">{value}</div><div className="text-[10px] text-slate-500 mt-1">{sub}</div></div>}
function buildRoadmap(student: Student): RoadmapItem[]{const state=student.state||'India'; const exam=student.targetExam||student.preferredExam||'Relevant Entrance Exam'; const course=student.interestedCourse||'Preferred Course'; return [{number:1,title:'Know your profile',description:'Education, stream, location and career preferences.',status:'current',items:[student.educationLevel||'Education','State: '+state,course]},{number:2,title:'Choose the right exam route',description:'Map state-specific and national opportunities.',status:'next',items:[exam,'State exams','All India exams']},{number:3,title:'Shortlist colleges',description:'Compare government and private institutions by course and admission route.',status:'locked',items:['Government','Private','Course fit']},{number:4,title:'Build your skills',description:'Follow the course roadmap from foundation to advanced practice.',status:'locked',items:['Lessons','Practice','Quizzes']},{number:5,title:'Assess & improve',description:'Use topic tests and mock exams to identify gaps.',status:'locked',items:['Topic Tests','Mock Tests','Progress']},{number:6,title:'Internship & first job',description:'Turn your learning into projects, internships and interview readiness.',status:'locked',items:['Projects','Resume','Interview']}];}
