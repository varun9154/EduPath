'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  GraduationCap,
  Route,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle2,
  LogOut,
  Award,
  Briefcase,
  FileText,
  Code2,
  Target,
  MapPin,
  Trophy,
  ChevronRight,
  IndianRupee,
  Clock,
  Building2,
  Laptop,
} from 'lucide-react';

type Student = {
  studentId: string;
  name?: string;
  email?: string;
  phone?: string;

  educationLevel?: string;
  tenthStatus?: string;
  twelfthStatus?: string;
  stream?: string;
  state?: string;
  careerGoal?: string;
  interestedCourse?: string;
  targetJob?: string;
  preferredExam?: string;
  learningMode?: string;
  skills?: string[];

  onboardingCompleted?: boolean;
};

type DemoBooking = {
  bookingId: string;
  studentId?: string;
  name?: string;
  email?: string;
  phone?: string;

  interestedCourse?: string;
  counsellingMode?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;

  status?: string;
  counsellor?: string;

  createdAt?: string;
  updatedAt?: string;
};

type RoadmapStep = {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'current' | 'next' | 'locked';
  items: string[];
};

export default function StudentDashboardPage() {
  const router = useRouter();

  const [student, setStudent] =
    useState<Student | null>(null);

  const [demoRequests, setDemoRequests] =
    useState<DemoBooking[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        // The secure HTTP-only session cookie is the source of truth.
        // localStorage is only used as an instant UI fallback/cache.
        const local = localStorage.getItem('edupath_student');
        if (local) {
          try {
            const cached = JSON.parse(local) as Student;
            const cachedId =
              cached.studentId ||
              (cached as Student & { id?: string }).id;

            if (cachedId) {
              setStudent({
                ...cached,
                studentId: cachedId,
              });
            }
          } catch {
            localStorage.removeItem('edupath_student');
          }
        }

        const response = await fetch(
          '/api/student/dashboard',
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          localStorage.removeItem('edupath_student');
          if (!cancelled) {
            setStudent(null);
            router.replace('/login');
          }
          return;
        }

        if (!response.ok || !data?.success || !data?.student?.studentId) {
          throw new Error(
            data?.message ||
              'Unable to load your student dashboard.'
          );
        }

        const latestStudent: Student = {
          ...data.student,
          studentId: String(data.student.studentId),
        };

        if (!cancelled) {
          setStudent(latestStudent);
          localStorage.setItem(
            'edupath_student',
            JSON.stringify(latestStudent)
          );

          window.dispatchEvent(
            new CustomEvent('edupath-auth-changed', {
              detail: {
                authenticated: true,
                student: latestStudent,
              },
            })
          );
        }

        // Demo history must come from the authenticated student endpoint.
        // Never call the admin leads endpoint from a student browser.
        const demoResponse = await fetch(
          '/api/student/demos',
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        );

        const demoData = await demoResponse
          .json()
          .catch(() => ({}));

        if (demoResponse.status === 401) {
          localStorage.removeItem('edupath_student');
          if (!cancelled) {
            setStudent(null);
            router.replace('/login');
          }
          return;
        }

        if (demoResponse.ok && Array.isArray(demoData?.demoBookings)) {
          if (!cancelled) {
            setDemoRequests(demoData.demoBookings);
          }
        }
      } catch (error) {
        console.error('Dashboard loading failed:', error);

        // If a cached student exists, keep the UI usable while the API
        // is temporarily unavailable. Otherwise require login.
        const cached = localStorage.getItem('edupath_student');
        if (!cached && !cancelled) {
          setStudent(null);
          router.replace('/login');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      // Clear the server-side session cookie as well as the local cache.
      await fetch('/api/auth/student/force-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: student?.email || '',
        }),
      });
    } catch (error) {
      console.error('Student logout error:', error);
    } finally {
      localStorage.removeItem('edupath_student');
      window.dispatchEvent(
        new CustomEvent('edupath-auth-changed', {
          detail: { authenticated: false },
        })
      );
      router.replace('/login');
      router.refresh();
    }
  };

  /*
   * Do not render dashboard until
   * authentication/profile loading finishes.
   */
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your EduPath...
          </p>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const roadmap =
    buildRoadmap(student);

  const recommendedResources =
    getRecommendedResources(
      student
    );

  const careerSummary =
    getCareerSummary(student);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">

      {/* =====================================================
          WELCOME
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-brand-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">

        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">

          <div className="space-y-4">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-400/20 text-brand-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />

              Personalized EduPath
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                Welcome back,{' '}
                {student.name ||
                  'Student'}! 👋
              </h1>

              <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                Your roadmap is personalized from your current education level to your target career and first job.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">

              <InfoBadge
                icon={
                  <GraduationCap className="w-3.5 h-3.5" />
                }
                text={
                  student.interestedCourse ||
                  'Course not selected'
                }
              />

              <InfoBadge
                icon={
                  <MapPin className="w-3.5 h-3.5" />
                }
                text={
                  student.state ||
                  'State not selected'
                }
              />

              <InfoBadge
                icon={
                  <Target className="w-3.5 h-3.5" />
                }
                text={
                  student.targetJob ||
                  'Career not selected'
                }
              />

            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">

            <Link
              href="/ai-counsellor"
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 rounded-xl text-xs font-bold shadow transition"
            >
              Ask AI Counsellor
            </Link>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </section>

      {/* =====================================================
          PERSONALIZED SUMMARY CARDS
      ====================================================== */}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <SummaryCard
          icon={
            <GraduationCap className="w-5 h-5" />
          }
          title="Current Level"
          value={
            student.educationLevel ||
            '10th'
          }
          description={
            student.stream ||
            'Stream not selected'
          }
        />

        <SummaryCard
          icon={
            <Target className="w-5 h-5" />
          }
          title="Career Goal"
          value={
            student.careerGoal ||
            'Explore'
          }
          description={
            student.targetJob ||
            'Target job pending'
          }
        />

        <SummaryCard
          icon={
            <BookOpen className="w-5 h-5" />
          }
          title="Entrance Exam"
          value={
            student.preferredExam ||
            'Not selected'
          }
          description="Preparation roadmap"
        />

        <SummaryCard
          icon={
            <MapPin className="w-5 h-5" />
          }
          title="State"
          value={
            student.state ||
            'India'
          }
          description="State-specific guidance"
        />

      </section>

      {/* =====================================================
          CAREER SUMMARY
      ====================================================== */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        <div className="flex items-start gap-4">

          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Route className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-black text-slate-900">
              Your Personalized Career Path
            </h2>

            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {careerSummary}
            </p>
          </div>

        </div>

      </section>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* =================================================
            ROADMAP
        ================================================== */}

        <div className="lg:col-span-2">

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Your Roadmap: 10th → First Job
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Follow each phase step-by-step.
                </p>
              </div>

              <Link
                href="/journey"
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Full Journey →
              </Link>

            </div>

            <div className="relative border-l-2 border-brand-100 ml-4 space-y-5">

              {roadmap.map(
                (item) => (
                  <RoadmapItem
                    key={
                      item.number
                    }
                    item={item}
                  />
                )
              )}

            </div>

          </section>

        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================== */}

        <div className="space-y-6">

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <h3 className="text-sm font-black text-slate-900 mb-4">
              Your EduPath Tools
            </h3>

            <div className="space-y-2">

              {recommendedResources.map(
                (resource) => (
                  <ResourceLink
                    key={
                      resource.href
                    }
                    href={
                      resource.href
                    }
                    icon={
                      resource.icon
                    }
                    title={
                      resource.title
                    }
                    description={
                      resource.description
                    }
                  />
                )
              )}

            </div>

          </section>

          {/* COURSE PRICE */}

          <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-2xl p-6 shadow-lg">

            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold mb-3">
              <Sparkles className="w-3 h-3" />
              PREMIUM LEARNING
            </div>

            <h3 className="text-lg font-black">
              EduPath Career Course
            </h3>

            <p className="text-xs text-brand-100 mt-2 leading-relaxed">
              Structured learning, projects, interview preparation, resume guidance and first-job preparation.
            </p>

            <div className="flex items-center gap-1 mt-4">
              <IndianRupee className="w-5 h-5" />

              <span className="text-3xl font-black">
                500
              </span>

              <span className="text-xs text-brand-200">
                one-time
              </span>
            </div>

            <Link
              href="/courses"
              className="mt-5 block text-center px-4 py-2.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-xs font-black transition"
            >
              Explore Course
            </Link>

          </section>

        </div>

      </div>

      {/* =====================================================
          DEMO HISTORY
      ====================================================== */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">

          <div>

            <h2 className="text-base font-black text-slate-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-brand-600" />
              My Free Demo Requests
            </h2>

            <p className="text-[11px] text-slate-500 mt-1">
              Your demo booking history remains available in your student portal.
            </p>

          </div>

          <Link
            href="/demo"
            className="text-xs font-bold text-brand-600 hover:underline"
          >
            + Book New Demo
          </Link>

        </div>

        {demoRequests.length ===
        0 ? (
          <div className="py-8 text-center">

            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />

            <p className="mt-2 text-xs text-slate-500">
              No demo booking yet.
            </p>

            <Link
              href="/demo"
              className="inline-block mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
            >
              Book Free Demo
            </Link>

          </div>
        ) : (
          <div className="space-y-3 mt-4">

            {demoRequests.map(
              (booking) => (
                <div
                  key={
                    booking.bookingId
                  }
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
                >

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                    <div>

                      <div className="flex items-center gap-2">

                        <span className="text-xs font-black text-slate-900">
                          {
                            booking.bookingId
                          }
                        </span>

                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                          {
                            booking.status ||
                            'REQUEST RECEIVED'
                          }
                        </span>

                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        {
                          booking.interestedCourse ||
                          student.interestedCourse ||
                          'Career Counselling'
                        }

                        {' • '}

                        {
                          booking.counsellingMode ||
                          'Counselling'
                        }
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />

                        {
                          booking.preferredDate ||
                          'Date pending'
                        }

                        {' • '}

                        {
                          booking.preferredTimeSlot ||
                          'Time pending'
                        }
                      </div>

                    </div>

                    <div className="text-[11px] text-slate-500">
                      Counsellor:{' '}

                      <span className="font-bold text-slate-700">
                        {
                          booking.counsellor ||
                          'Assigned Soon'
                        }
                      </span>
                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </section>

      {/* =====================================================
          SKILLS
      ====================================================== */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-base font-black text-slate-900">
              Skills You Selected
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              These skills will be included in your learning roadmap.
            </p>
          </div>

          <Code2 className="w-5 h-5 text-brand-600" />

        </div>

        {student.skills &&
        student.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">

            {student.skills.map(
              (skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold"
                >
                  {skill}
                </span>
              )
            )}

          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No skills selected yet.
          </p>
        )}

      </section>

    </div>
  );
}

/* =========================================================
   ROADMAP BUILDER
========================================================= */

function buildRoadmap(
  student: Student
): RoadmapStep[] {
  const isEngineering =
    student.careerGoal ===
      'Engineering' ||
    student.interestedCourse
      ?.toLowerCase()
      .includes('b.tech') ||
    student.interestedCourse
      ?.toLowerCase()
      .includes('be');

  const targetJob =
    student.targetJob ||
    'your target job';

  const exam =
    student.preferredExam ||
    'your entrance exam';

  const course =
    student.interestedCourse ||
    'your selected course';

  const state =
    student.state ||
    'your state';

  return [
    {
      number: 1,
      title: '10th Foundation',
      description:
        'Build strong academic fundamentals and understand your strengths.',
      icon: (
        <GraduationCap className="w-4 h-4" />
      ),
      status: 'current',
      items: [
        'Subject fundamentals',
        'Study habits',
        'Career exploration',
      ],
    },

    {
      number: 2,
      title: '11th & 12th Direction',
      description:
        `Choose the right stream and prepare for ${exam}.`,
      icon: (
        <BookOpen className="w-4 h-4" />
      ),
      status: 'next',
      items: [
        student.stream ||
          'Stream selection',
        `${exam} preparation`,
        'Important documents',
      ],
    },

    {
      number: 3,
      title: 'Entrance Examination',
      description:
        `Prepare strategically for ${exam} and understand your ${state} admission process.`,
      icon: (
        <Trophy className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'Syllabus',
        'Previous papers',
        'Mock tests',
      ],
    },

    {
      number: 4,
      title: 'College Selection',
      description:
        `Shortlist colleges for ${course} using fees, placements, location and eligibility.`,
      icon: (
        <Building2 className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'College comparison',
        'Fees',
        'Placements',
      ],
    },

    {
      number: 5,
      title: 'Degree Foundation',
      description:
        `Build the academic foundation required for ${course}.`,
      icon: (
        <GraduationCap className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'Core subjects',
        'Practical learning',
        'Academic planning',
      ],
    },

    {
      number: 6,
      title: 'Technical Skills',
      description:
        'Build industry-ready technical and professional skills.',
      icon: (
        <Code2 className="w-4 h-4" />
      ),
      status: 'locked',
      items:
        student.skills &&
        student.skills.length > 0
          ? student.skills.slice(
              0,
              4
            )
          : [
              'Programming',
              'Problem solving',
              'Communication',
            ],
    },

    {
      number: 7,
      title: 'Projects',
      description:
        'Build practical projects that demonstrate your skills.',
      icon: (
        <Laptop className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'Mini projects',
        'Major project',
        'GitHub portfolio',
      ],
    },

    {
      number: 8,
      title: 'Internship',
      description:
        'Gain real-world experience before graduation.',
      icon: (
        <Briefcase className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'Internship search',
        'Application preparation',
        'Work experience',
      ],
    },

    {
      number: 9,
      title: 'Resume & Portfolio',
      description:
        'Create an ATS-friendly resume and professional portfolio.',
      icon: (
        <FileText className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'ATS resume',
        'LinkedIn',
        'Portfolio',
      ],
    },

    {
      number: 10,
      title: 'Aptitude & Communication',
      description:
        'Prepare for aptitude tests, communication rounds and group discussions.',
      icon: (
        <Target className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'Quantitative aptitude',
        'Logical reasoning',
        'Communication',
      ],
    },

    {
      number: 11,
      title: 'Technical Interviews',
      description:
        `Prepare for technical interviews targeting ${targetJob}.`,
      icon: (
        <Code2 className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'DSA',
        'Core concepts',
        'Coding problems',
      ],
    },

    {
      number: 12,
      title: 'Company Preparation',
      description:
        'Prepare for MNCs, product companies, startups and other employers.',
      icon: (
        <Building2 className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'Company research',
        'Interview patterns',
        'Recent questions',
      ],
    },

    {
      number: 13,
      title: 'Mock Interviews',
      description:
        'Practice realistic interview scenarios and receive feedback.',
      icon: (
        <Target className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'HR interviews',
        'Technical interviews',
        'Behavioral rounds',
      ],
    },

    {
      number: 14,
      title: 'Job Applications',
      description:
        'Apply strategically to internships and full-time opportunities.',
      icon: (
        <Briefcase className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'Job search',
        'Applications',
        'Referral strategy',
      ],
    },

    {
      number: 15,
      title: 'Placement Preparation',
      description:
        'Prepare for campus and off-campus recruitment.',
      icon: (
        <Trophy className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'Placement drives',
        'Interview preparation',
        'Offer evaluation',
      ],
    },

    {
      number: 16,
      title: 'First Job',
      description:
        `Reach your first professional role as a ${targetJob}.`,
      icon: (
        <CheckCircle2 className="w-4 h-4" />
      ),
      status: 'locked',
      items: [
        'Offer',
        'Joining',
        'Career growth',
      ],
    },
  ];
}

/* =========================================================
   CAREER SUMMARY
========================================================= */

function getCareerSummary(
  student: Student
) {
  const level =
    student.educationLevel ||
    'your current level';

  const course =
    student.interestedCourse ||
    'your selected course';

  const exam =
    student.preferredExam ||
    'your preferred entrance exam';

  const job =
    student.targetJob ||
    'your target job';

  const state =
    student.state ||
    'your state';

  return `You are currently at ${level}. EduPath will guide you through ${exam}, ${course}, state-specific college options in ${state}, degree preparation, industry skills, projects, internships, resume building, aptitude preparation and interviews—working toward your target role as ${job}.`;
}

/* =========================================================
   RECOMMENDED RESOURCES
========================================================= */

function getRecommendedResources(
  student: Student
) {
  const resources = [
    {
      href: '/resources',
      title: 'Study Library',
      description:
        'Syllabus & documents',
      icon: (
        <FileText className="w-4 h-4 text-brand-500" />
      ),
    },

    {
      href: '/colleges',
      title: 'College Directory',
      description:
        'Find & compare colleges',
      icon: (
        <GraduationCap className="w-4 h-4 text-purple-500" />
      ),
    },

    {
      href: '/mock-tests',
      title: 'Mock Tests',
      description:
        'Practice & evaluate',
      icon: (
        <BookOpen className="w-4 h-4 text-cyan-500" />
      ),
    },

    {
      href: '/jobs',
      title: 'Jobs & Internships',
      description:
        'Industry opportunities',
      icon: (
        <Briefcase className="w-4 h-4 text-emerald-500" />
      ),
    },

    {
      href: '/scholarships',
      title: 'Scholarships',
      description:
        'Find funding opportunities',
      icon: (
        <Award className="w-4 h-4 text-amber-500" />
      ),
    },
  ];

  /*
   * Engineering students get additional
   * technical resources.
   */
  if (
    student.careerGoal ===
    'Engineering'
  ) {
    resources.splice(3, 0, {
      href: '/courses',
      title: 'Engineering Skills',
      description:
        'Technical roadmap',
      icon: (
        <Code2 className="w-4 h-4 text-blue-500" />
      ),
    });
  }

  return resources;
}

/* =========================================================
   COMPONENTS
========================================================= */

function InfoBadge({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
      {icon}
      {text}
    </span>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

      <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
        {icon}
      </div>

      <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
        {title}
      </div>

      <div className="mt-1 text-sm font-black text-slate-900 truncate">
        {value}
      </div>

      <div className="mt-1 text-[11px] text-slate-500 truncate">
        {description}
      </div>

    </div>
  );
}

function RoadmapItem({
  item,
}: {
  item: RoadmapStep;
}) {
  const isCurrent =
    item.status === 'current';

  const isNext =
    item.status === 'next';

  return (
    <div className="relative pl-7 sm:pl-9">

      {/* DOT */}

      <div
        className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm ${
          isCurrent
            ? 'bg-brand-600 border-brand-600 text-white'
            : isNext
            ? 'bg-white border-brand-500 text-brand-600'
            : 'bg-white border-slate-200 text-slate-400'
        }`}
      >
        {item.number}
      </div>

      <div
        className={`rounded-2xl border p-5 ${
          isCurrent
            ? 'border-brand-300 bg-brand-50/40'
            : isNext
            ? 'border-brand-200 bg-white'
            : 'border-slate-200 bg-slate-50/50'
        }`}
      >

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

          <div>

            <div className="flex items-center gap-2">

              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isCurrent
                    ? 'bg-brand-100 text-brand-600'
                    : 'bg-white text-slate-500'
                }`}
              >
                {item.icon}
              </span>

              <h3 className="text-sm font-black text-slate-900">
                {item.title}
              </h3>

            </div>

            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {item.description}
            </p>

          </div>

          <span
            className={`self-start px-2 py-1 rounded-md text-[9px] font-black uppercase ${
              isCurrent
                ? 'bg-emerald-100 text-emerald-700'
                : isNext
                ? 'bg-brand-100 text-brand-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isCurrent
              ? 'Current'
              : isNext
              ? 'Next'
              : 'Upcoming'}
          </span>

        </div>

        <div className="flex flex-wrap gap-2 mt-4">

          {item.items.map(
            (subItem) => (
              <span
                key={subItem}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-100 text-[10px] font-semibold text-slate-600"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />

                {subItem}
              </span>
            )
          )}

        </div>

      </div>

    </div>
  );
}

function ResourceLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition group"
    >

      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <div className="text-xs font-bold text-slate-800">
          {title}
        </div>

        <div className="text-[10px] text-slate-500 truncate">
          {description}
        </div>

      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition" />

    </Link>
  );
}