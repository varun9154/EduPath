'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';

type LoginType = 'student' | 'admin';

interface StudentLoginResponse {
  success?: boolean;
  message?: string;
  requiresForce?: boolean;
  student?: Record<string, unknown>;
}

interface AdminLoginResponse {
  success?: boolean;
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [loginType, setLoginType] =
    useState<LoginType>('student');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [requiresForce, setRequiresForce] =
    useState(false);

  /*
   * =========================================================
   * RESET MESSAGES
   * =========================================================
   */
  const resetMessages = () => {
    setErrorMessage('');
    setRequiresForce(false);
  };

  /*
   * =========================================================
   * LOGIN TYPE CHANGE
   * =========================================================
   */
  const handleLoginTypeChange = (
    type: LoginType
  ) => {
    setLoginType(type);
    setEmail('');
    setPassword('');
    resetMessages();
  };

  /*
   * =========================================================
   * STUDENT LOGIN
   * =========================================================
   */
  const handleStudentLogin = async (
    force: boolean = false
  ) => {
    if (loading) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      const deviceInfo =
        typeof navigator !== 'undefined'
          ? navigator.userAgent
          : 'Web Browser';

      const response = await fetch(
        '/api/auth/student',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'login',
            email: normalizedEmail,
            password,
            deviceInfo,
            forceSignoutOther: force,
          }),
        }
      );

      const data =
        (await response.json().catch(
          () => ({})
        )) as StudentLoginResponse;

      /*
       * Another device is already active.
       */
      if (
        response.status === 409 &&
        data.requiresForce
      ) {
        setRequiresForce(true);

        setErrorMessage(
          data.message ||
            'This account is already active on another device.'
        );

        return;
      }

      /*
       * Login failed.
       */
      if (
        !response.ok ||
        data.success !== true
      ) {
        setErrorMessage(
          data.message ||
            'Invalid student email or password.'
        );

        return;
      }

      /*
       * Store only non-sensitive student information.
       *
       * The actual authentication session remains
       * in the secure HTTP-only cookie created by
       * the server.
       */
      if (
        typeof window !== 'undefined'
      ) {
        const apiStudent = data.student || {};
        const studentData = {
          ...apiStudent,
          // The auth API returns the identifier as `id`, while the
          // student/profile APIs use `studentId`. Keep both forms so
          // navigation and profile loading remain compatible.
          studentId:
            String(
              apiStudent.studentId ||
              apiStudent.id ||
              ''
            ),
          id:
            String(
              apiStudent.id ||
              apiStudent.studentId ||
              ''
            ),
          email:
            String(
              apiStudent.email ||
              normalizedEmail
            ),
        };

        window.localStorage.setItem(
          'edupath_student',
          JSON.stringify(studentData)
        );

        // Let the shared navbar react immediately without requiring
        // a full page reload.
        window.dispatchEvent(
          new CustomEvent('edupath-auth-changed', {
            detail: {
              authenticated: true,
              student: studentData,
            },
          })
        );
      }

      /*
       * Go to student dashboard.
       */
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error(
        'Student login error:',
        error
      );

      setErrorMessage(
        'Unable to connect to EduPath. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * ADMIN LOGIN
   * =========================================================
   */
  const handleAdminLogin = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      const response = await fetch(
        '/api/auth/admin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'login',
            email: normalizedEmail,
            password,
          }),
        }
      );

      const data =
        (await response.json().catch(
          () => ({})
        )) as AdminLoginResponse;

      /*
       * Login failed.
       */
      if (
        !response.ok ||
        data.success !== true
      ) {
        setErrorMessage(
          data.message ||
            'Invalid admin credentials.'
        );

        return;
      }

      /*
       * Remove any locally cached student
       * information when entering admin portal.
       */
      if (
        typeof window !== 'undefined'
      ) {
        window.localStorage.removeItem(
          'edupath_student'
        );
      }

      /*
       * Go to admin portal.
       */
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error(
        'Admin login error:',
        error
      );

      setErrorMessage(
        'Unable to connect to EduPath. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * FORM SUBMISSION
   * =========================================================
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage(
        'Please enter your email and password.'
      );

      return;
    }

    resetMessages();

    if (loginType === 'student') {
      await handleStudentLogin(false);
    } else {
      await handleAdminLogin();
    }
  };

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="space-y-6">

          {/* =================================================
              HEADER
          ================================================= */}
          <div className="text-center space-y-3">

            <div
              className={`
                w-14
                h-14
                rounded-2xl
                ${
                  loginType === 'admin'
                    ? 'bg-amber-500 shadow-amber-500/20'
                    : 'bg-brand-600 shadow-brand-500/20'
                }
                flex
                items-center
                justify-center
                mx-auto
                shadow-lg
              `}
            >
              {loginType === 'admin' ? (
                <ShieldCheck
                  className="w-7 h-7 text-white"
                />
              ) : (
                <GraduationCap
                  className="w-7 h-7 text-white"
                />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {loginType === 'admin'
                  ? 'EduPath Admin Login'
                  : 'EduPath Login'}
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                {loginType === 'admin'
                  ? 'Secure administrator access to the EduPath management portal'
                  : 'Access your personalized roadmap, mock tests & demo bookings'}
              </p>
            </div>
          </div>

          {/* =================================================
              LOGIN CARD
          ================================================= */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">

            <div className="space-y-4">

              {/* =================================================
                  LOGIN TYPE
              ================================================= */}
              <div>
                <label
                  htmlFor="loginType"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Login As
                </label>

                <div className="relative">

                  {loginType === 'admin' ? (
                    <ShieldCheck
                      className="
                        w-4
                        h-4
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-amber-500
                        pointer-events-none
                      "
                    />
                  ) : (
                    <User
                      className="
                        w-4
                        h-4
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-brand-500
                        pointer-events-none
                      "
                    />
                  )}

                  <select
                    id="loginType"
                    value={loginType}
                    onChange={(event) =>
                      handleLoginTypeChange(
                        event.target
                          .value as LoginType
                      )
                    }
                    className="
                      w-full
                      pl-9
                      pr-3
                      py-2.5
                      text-sm
                      border
                      border-slate-300
                      rounded-xl
                      bg-white
                      text-slate-800
                      focus:ring-2
                      focus:ring-brand-500
                      focus:border-brand-500
                      outline-none
                      cursor-pointer
                    "
                  >
                    <option value="student">
                      Student
                    </option>

                    <option value="admin">
                      Admin
                    </option>
                  </select>
                </div>
              </div>

              {/* =================================================
                  STUDENT SECURITY MESSAGE
              ================================================= */}
              {loginType === 'student' && (
                <div
                  className="
                    p-3
                    bg-blue-50
                    border
                    border-blue-200
                    rounded-xl
                    text-xs
                    text-blue-900
                    flex
                    items-start
                    gap-2
                  "
                >
                  <Smartphone
                    className="
                      w-4
                      h-4
                      text-blue-600
                      shrink-0
                      mt-0.5
                    "
                  />

                  <div>
                    <span className="font-bold">
                      One Device Active Security:
                    </span>{' '}
                    Your account is limited to one
                    active logged-in device at a time
                    for data protection.
                  </div>
                </div>
              )}

              {/* =================================================
                  ADMIN SECURITY MESSAGE
              ================================================= */}
              {loginType === 'admin' && (
                <div
                  className="
                    p-3
                    bg-amber-50
                    border
                    border-amber-200
                    rounded-xl
                    text-xs
                    text-amber-900
                    flex
                    items-start
                    gap-2
                  "
                >
                  <ShieldCheck
                    className="
                      w-4
                      h-4
                      text-amber-600
                      shrink-0
                      mt-0.5
                    "
                  />

                  <div>
                    <span className="font-bold">
                      Administrator Access:
                    </span>{' '}
                    This area is restricted to
                    authorized EduPath administrators.
                  </div>
                </div>
              )}

              {/* =================================================
                  ERROR MESSAGE
              ================================================= */}
              {errorMessage && (
                <div
                  role="alert"
                  className="
                    p-3
                    bg-red-50
                    border
                    border-red-200
                    rounded-xl
                    text-xs
                    text-red-800
                    flex
                    items-start
                    gap-2
                  "
                >
                  <ShieldAlert
                    className="
                      w-4
                      h-4
                      text-red-600
                      shrink-0
                      mt-0.5
                    "
                  />

                  <div>
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* =================================================
                  FORCE DEVICE LOGIN
              ================================================= */}
              {loginType === 'student' &&
              requiresForce ? (
                <div className="space-y-3">

                  <div
                    className="
                      p-3
                      bg-orange-50
                      border
                      border-orange-200
                      rounded-xl
                      text-xs
                      text-orange-800
                    "
                  >
                    <strong>
                      Another device is currently
                      logged in.
                    </strong>

                    <p className="mt-1">
                      You can sign out that device
                      and continue using EduPath on
                      this device.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleStudentLogin(true)
                    }
                    disabled={loading}
                    className="
                      w-full
                      py-2.5
                      bg-brand-600
                      hover:bg-brand-700
                      text-white
                      font-bold
                      text-xs
                      rounded-xl
                      shadow
                      transition
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  >
                    {loading
                      ? 'Switching Device...'
                      : 'Sign Out Other Device & Log In'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRequiresForce(false);
                      setErrorMessage('');
                    }}
                    disabled={loading}
                    className="
                      w-full
                      py-2
                      border
                      border-slate-300
                      text-slate-600
                      font-semibold
                      text-xs
                      rounded-xl
                      hover:bg-slate-50
                      transition
                      disabled:opacity-50
                    "
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* =================================================
                   LOGIN FORM
                ================================================= */
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >

                  {/* =================================================
                      EMAIL
                  ================================================= */}
                  <div>
                    <label
                      htmlFor="email"
                      className="
                        block
                        text-xs
                        font-semibold
                        text-slate-700
                        mb-1
                      "
                    >
                      {loginType === 'admin'
                        ? 'Admin Email Address'
                        : 'Registered Email Address'}
                    </label>

                    <div className="relative">

                      <Mail
                        className="
                          w-4
                          h-4
                          absolute
                          left-3
                          top-1/2
                          -translate-y-1/2
                          text-slate-400
                        "
                      />

                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={
                          loginType === 'admin'
                            ? 'Enter admin email'
                            : 'e.g. student@example.com'
                        }
                        value={email}
                        onChange={(event) => {
                          setEmail(
                            event.target.value
                          );
                          setErrorMessage('');
                        }}
                        className="
                          w-full
                          pl-9
                          pr-3
                          py-2.5
                          text-sm
                          border
                          border-slate-300
                          rounded-xl
                          focus:ring-2
                          focus:ring-brand-500
                          focus:border-brand-500
                          outline-none
                        "
                      />
                    </div>
                  </div>

                  {/* =================================================
                      PASSWORD
                  ================================================= */}
                  <div>
                    <label
                      htmlFor="password"
                      className="
                        block
                        text-xs
                        font-semibold
                        text-slate-700
                        mb-1
                      "
                    >
                      Password
                    </label>

                    <div className="relative">

                      <Lock
                        className="
                          w-4
                          h-4
                          absolute
                          left-3
                          top-1/2
                          -translate-y-1/2
                          text-slate-400
                        "
                      />

                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(event) => {
                          setPassword(
                            event.target.value
                          );
                          setErrorMessage('');
                        }}
                        className="
                          w-full
                          pl-9
                          pr-3
                          py-2.5
                          text-sm
                          border
                          border-slate-300
                          rounded-xl
                          focus:ring-2
                          focus:ring-brand-500
                          focus:border-brand-500
                          outline-none
                        "
                      />
                    </div>
                  </div>

                  {/* =================================================
                      LOGIN BUTTON
                  ================================================= */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`
                      w-full
                      py-3
                      ${
                        loginType === 'admin'
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-brand-600 hover:bg-brand-700'
                      }
                      text-white
                      font-bold
                      text-xs
                      rounded-xl
                      shadow-md
                      transition
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    `}
                  >
                    {loading
                      ? 'Authenticating...'
                      : loginType === 'admin'
                        ? 'Sign In to Admin Portal'
                        : 'Sign In to Dashboard'}
                  </button>
                </form>
              )}

              {/* =================================================
                  STUDENT REGISTRATION
              ================================================= */}
              {loginType === 'student' && (
                <div className="text-center pt-2 text-xs text-slate-500">
                  New to EduPath?{' '}

                  <Link
                    href="/register"
                    className="
                      font-bold
                      text-brand-600
                      hover:underline
                    "
                  >
                    Register Student Account
                  </Link>
                </div>
              )}

              {/* =================================================
                  ADMIN INFORMATION
              ================================================= */}
              {loginType === 'admin' && (
                <div className="text-center pt-2 text-xs text-slate-500">
                  Authorized EduPath administrator
                  access only.
                </div>
              )}

            </div>
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}
          <div className="text-center text-[11px] text-slate-400">
            EduPath AI — Your Education. Your Career.
            One Clear Path.
          </div>

        </div>
      </div>
    </main>
  );
}