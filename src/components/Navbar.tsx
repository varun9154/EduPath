'use client';

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Bot,
  GraduationCap,
  MapPin,
  Menu,
  Route,
  X,
  User,
  FileText,
  Award,
  Compass,
  LogOut,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';

import DemoModal from './DemoModal';

type StudentInfo = {
  id?: string;
  studentId?: string;
  name?: string;
  email?: string;
  mobile?: string;
};

type AuthResponse = {
  success?: boolean;
  authenticated?: boolean;
  student?: StudentInfo;
};

const AUTH_CHANGED_EVENT =
  'edupath-auth-changed';

const navItems = [
  {
    href: '/entrance-exams',
    label: '36 States Exams',
    icon: MapPin,
    color: 'text-cyan-400',
  },
  {
    href: '/courses',
    label: 'Courses',
    icon: Compass,
    color: 'text-brand-400',
  },
  {
    href: '/resources',
    label: 'Resources',
    icon: FileText,
    color: 'text-amber-400',
  },
  {
    href: '/colleges',
    label: 'Colleges',
    icon: GraduationCap,
    color: 'text-purple-400',
  },
  {
    href: '/scholarships',
    label: 'Scholarships',
    icon: Award,
    color: 'text-yellow-400',
  },
  {
    href: '/journey',
    label: '10th → First Job',
    icon: Route,
    color: 'text-emerald-400',
  },
  {
    href: '/ai-counsellor',
    label: 'AI Counsellor',
    icon: Bot,
    color: 'text-pink-400',
  },
] as const;

const protectedPaths = [
  '/dashboard',
  '/courses',
  '/entrance-exams',
  '/resources',
  '/colleges',
  '/scholarships',
  '/journey',
  '/ai-counsellor',
  '/mock-tests',
  '/planner',
];

function isProtectedPath(
  path: string
): boolean {
  return protectedPaths.some(
    (protectedPath) =>
      path === protectedPath ||
      path.startsWith(
        `${protectedPath}/`
      )
  );
}

export default function Navbar() {
  const router = useRouter();

  const [student, setStudent] =
    useState<StudentInfo | null>(null);

  const [authChecked, setAuthChecked] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [demoOpen, setDemoOpen] =
    useState(false);

  const [authNotice, setAuthNotice] =
    useState(false);

  const [pendingPath, setPendingPath] =
    useState('');

  /*
   * =========================================================
   * READ LOCAL STUDENT SNAPSHOT
   * =========================================================
   */

  const readLocalStudent =
    useCallback((): StudentInfo | null => {
      try {
        const stored =
          window.localStorage.getItem(
            'edupath_student'
          );

        if (!stored) {
          return null;
        }

        const parsed =
          JSON.parse(
            stored
          ) as StudentInfo;

        if (
          parsed?.studentId ||
          parsed?.id ||
          parsed?.email
        ) {
          return parsed;
        }

        return null;
      } catch {
        return null;
      }
    }, []);

  /*
   * =========================================================
   * LOAD SERVER AUTHENTICATION
   * =========================================================
   */

  const loadAuth =
    useCallback(
      async () => {
        let localStudent:
          | StudentInfo
          | null = null;

        /*
         * Read local snapshot first.
         *
         * This gives the Navbar an immediate client-side
         * representation while the server session is checked.
         */
        try {
          localStudent =
            readLocalStudent();

          if (localStudent) {
            setStudent(
              localStudent
            );
          }
        } catch {
          localStudent = null;
        }

        try {
          const response =
            await fetch(
              '/api/auth/student',
              {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
              }
            );

          const data =
            (await response
              .json()
              .catch(
                () => ({})
              )) as AuthResponse;

          /*
           * Server session is authoritative.
           */
          if (
            response.ok &&
            data.success &&
            data.authenticated &&
            data.student
          ) {
            const authenticatedStudent =
              data.student;

            setStudent(
              authenticatedStudent
            );

            try {
              window.localStorage.setItem(
                'edupath_student',
                JSON.stringify(
                  authenticatedStudent
                )
              );
            } catch {
              // Ignore storage errors.
            }
          } else if (
            !localStudent
          ) {
            setStudent(null);

            try {
              window.localStorage.removeItem(
                'edupath_student'
              );
            } catch {
              // Ignore storage errors.
            }
          }
        } catch (error) {
          console.error(
            'Navbar auth check failed:',
            error
          );

          /*
           * Keep the already-known local student
           * if the network check temporarily fails.
           */
          if (!localStudent) {
            setStudent(null);
          }
        } finally {
          setAuthChecked(true);
        }
      },
      [readLocalStudent]
    );

  /*
   * =========================================================
   * INITIAL AUTH CHECK
   *
   * setTimeout makes the state update asynchronous,
   * satisfying react-hooks/set-state-in-effect.
   * =========================================================
   */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadAuth();
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [loadAuth]);

  /*
   * =========================================================
   * LOGIN / LOGOUT EVENT
   * =========================================================
   */

  useEffect(() => {
    const handleAuthChange =
      () => {
        void loadAuth();
      };

    const handleStorageChange =
      (
        event: StorageEvent
      ) => {
        if (
          event.key ===
          'edupath_student'
        ) {
          void loadAuth();
        }
      };

    window.addEventListener(
      AUTH_CHANGED_EVENT,
      handleAuthChange
    );

    window.addEventListener(
      'storage',
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        AUTH_CHANGED_EVENT,
        handleAuthChange
      );

      window.removeEventListener(
        'storage',
        handleStorageChange
      );
    };
  }, [loadAuth]);

  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

  const navigateTo =
    (path: string) => {
      setMobileOpen(false);

      /*
       * Public route.
       */
      if (
        path === '/' ||
        !isProtectedPath(path)
      ) {
        router.push(path);
        return;
      }

      /*
       * Protected route with no student.
       */
      if (!student) {
        setPendingPath(path);
        setAuthNotice(true);
        return;
      }

      router.push(path);
    };

  /*
   * =========================================================
   * LOGIN NOTICE
   * =========================================================
   */

  const goToLogin = () => {
    const destination =
      pendingPath ||
      '/dashboard';

    setAuthNotice(false);
    setPendingPath('');

    router.push(
      `/login?account=student&redirect=${encodeURIComponent(
        destination
      )}`
    );
  };

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  const logout =
    async () => {
      try {
        await fetch(
          '/api/auth/student',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              action: 'logout',
            }),
          }
        );
      } catch (error) {
        console.error(
          'Student logout request failed:',
          error
        );
      }

      try {
        window.localStorage.removeItem(
          'edupath_student'
        );
      } catch {
        // Ignore storage errors.
      }

      setStudent(null);
      setMobileOpen(false);

      window.dispatchEvent(
        new Event(
          AUTH_CHANGED_EVENT
        )
      );

      router.replace('/');
      router.refresh();
    };

  const studentName =
    student?.name?.trim() ||
    'Student';

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 shadow-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>

            <span className="bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-xl font-black tracking-tight text-transparent">
              EduPath AI
            </span>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav className="hidden items-center gap-5 text-xs font-medium text-slate-300 lg:flex">
            <Link
              href="/"
              className="transition hover:text-white"
            >
              Home
            </Link>

            {navItems.map(
              ({
                href,
                label,
                icon: Icon,
                color,
              }) => (
                <button
                  key={href}
                  type="button"
                  onClick={() =>
                    navigateTo(href)
                  }
                  className="flex items-center transition hover:text-white"
                >
                  <Icon
                    className={`mr-1 h-3.5 w-3.5 ${color}`}
                  />

                  {label}
                </button>
              )
            )}
          </nav>

          {/* =================================================
              DESKTOP AUTH
          ================================================= */}

          <div className="hidden items-center gap-3 lg:flex">
            {!authChecked ? (
              <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-800" />
            ) : student ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/dashboard'
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-100 transition hover:bg-slate-700"
                  title="Open student dashboard"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-brand-400" />

                  <span className="max-w-[150px] truncate">
                    {studentName}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition hover:bg-red-600 hover:text-white"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                <User className="mr-1 h-3.5 w-3.5 text-brand-400" />
                Login
              </Link>
            )}

            <button
              type="button"
              onClick={() =>
                setDemoOpen(true)
              }
              className="flex items-center rounded-xl bg-gradient-to-r from-brand-500 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition hover:-translate-y-0.5"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              BOOK A FREE DEMO
            </button>
          </div>

          {/* =================================================
              MOBILE TOGGLE
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                (value) => !value
              )
            }
            className="rounded-lg p-2 text-slate-300 lg:hidden"
            aria-label={
              mobileOpen
                ? 'Close menu'
                : 'Open menu'
            }
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* =================================================
            MOBILE MENU
        ================================================= */}

        {mobileOpen && (
          <div className="border-t border-slate-800 bg-slate-900 px-4 pb-4 pt-2 lg:hidden">
            <div className="space-y-1">
              <Link
                href="/"
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className="block py-2 text-sm text-slate-200"
              >
                Home
              </Link>

              {navItems.map(
                ({
                  href,
                  label,
                  icon: Icon,
                  color,
                }) => (
                  <button
                    key={href}
                    type="button"
                    onClick={() =>
                      navigateTo(
                        href
                      )
                    }
                    className="flex w-full items-center py-2 text-left text-sm text-slate-200"
                  >
                    <Icon
                      className={`mr-2 h-4 w-4 ${color}`}
                    />

                    {label}
                  </button>
                )
              )}

              {authChecked &&
              student ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(
                        false
                      );

                      router.push(
                        '/dashboard'
                      );
                    }}
                    className="flex w-full items-center py-2 text-left text-sm font-bold text-brand-400"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />

                    {studentName}
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center py-2 text-left text-sm text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : authChecked ? (
                <Link
                  href="/login"
                  onClick={() =>
                    setMobileOpen(
                      false
                    )
                  }
                  className="flex items-center py-2 text-sm font-bold text-brand-400"
                >
                  <User className="mr-2 h-4 w-4" />
                  Login
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(
                    false
                  );

                  setDemoOpen(
                    true
                  );
                }}
                className="mt-2 flex w-full items-center justify-center rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                BOOK A FREE DEMO
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================
          LOGIN REQUIRED MODAL
          Self-contained. No AuthGuardModal dependency.
      ===================================================== */}

      {authNotice && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() =>
            setAuthNotice(false)
          }
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setAuthNotice(false)
                }
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
              <User className="h-7 w-7 text-white" />
            </div>

            <h2 className="text-center text-xl font-black text-slate-900">
              Login Required
            </h2>

            <p className="mt-2 text-center text-sm text-slate-500">
              Please sign in to access this
              EduPath feature and continue
              your education journey.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setAuthNotice(
                    false
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={goToLogin}
                className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700"
              >
                Continue to Login
              </button>
            </div>
          </div>
        </div>
      )}

      <DemoModal
        isOpen={demoOpen}
        onClose={() =>
          setDemoOpen(false)
        }
      />
    </>
  );
}