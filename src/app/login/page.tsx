'use client';

import React, {
  useEffect,
  useState,
} from 'react';

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

type LoginType =
  | 'student'
  | 'admin';

type ApiResponse = {
  success?: boolean;
  authenticated?: boolean;
  message?: string;
  requiresForce?: boolean;
  sessionId?: string;
  student?: Record<
    string,
    unknown
  >;
};

const AUTH_CHANGED_EVENT =
  'edupath-auth-changed';

/* =========================================================
   SAFE REDIRECT
========================================================= */

function getRedirectTarget(): string {
  if (
    typeof window ===
    'undefined'
  ) {
    return '/dashboard';
  }

  try {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const redirect =
      params.get('redirect');

    if (
      redirect &&
      redirect.startsWith('/') &&
      !redirect.startsWith('//')
    ) {
      return redirect;
    }
  } catch {
    // Use dashboard fallback.
  }

  return '/dashboard';
}

/* =========================================================
   COMPONENT
========================================================= */

export default function LoginPage() {
  const router = useRouter();

  /*
   * Calculate this during render instead of using state/effect.
   *
   * This avoids react-hooks/set-state-in-effect completely.
   */
  const redirectTarget =
    getRedirectTarget();

  const [
    loginType,
    setLoginType,
  ] =
    useState<LoginType>(
      'student'
    );

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    requiresForce,
    setRequiresForce,
  ] = useState(false);

  /* =====================================================
     EXISTING SESSION CHECK
     
     No state is updated inside the effect.
     
     This is intentional so the React hooks purity rule
     remains satisfied.
  ===================================================== */

  useEffect(() => {
    let active = true;

    const checkExistingSession =
      async () => {
        try {
          const response =
            await fetch(
              '/api/auth/student',
              {
                method: 'GET',
                credentials:
                  'include',
                cache: 'no-store',
              }
            );

          const data =
            (await response
              .json()
              .catch(
                () => ({})
              )) as ApiResponse;

          if (!active) {
            return;
          }

          if (
            response.ok &&
            data.success &&
            data.authenticated &&
            data.student
          ) {
            try {
              window.localStorage.setItem(
                'edupath_student',
                JSON.stringify(
                  data.student
                )
              );
            } catch {
              // Ignore localStorage errors.
            }

            window.dispatchEvent(
              new Event(
                AUTH_CHANGED_EVENT
              )
            );

            router.replace(
              redirectTarget
            );

            router.refresh();

            return;
          }
        } catch (error) {
          console.error(
            'Existing student session check failed:',
            error
          );
        } finally {
          /*
           * State update is intentionally performed
           * from a timer callback rather than directly
           * in the effect body.
           */
          if (active) {
            window.setTimeout(
              () => {
                if (active) {
                  setCheckingSession(
                    false
                  );
                }
              },
              0
            );
          }
        }
      };

    window.setTimeout(
      () => {
        void checkExistingSession();
      },
      0
    );

    return () => {
      active = false;
    };
  }, [redirectTarget, router]);

  /* =====================================================
     HELPERS
  ===================================================== */

  const resetMessages =
    () => {
      setErrorMessage('');
      setRequiresForce(false);
    };

  const handleLoginTypeChange =
    (
      type: LoginType
    ) => {
      setLoginType(type);
      setEmail('');
      setPassword('');
      resetMessages();
    };

  /* =====================================================
     STUDENT LOGIN
  ===================================================== */

  const handleStudentLogin =
    async (
      force = false
    ) => {
      if (loading) {
        return;
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !normalizedEmail ||
        !password
      ) {
        setErrorMessage(
          'Please enter your email and password.'
        );

        return;
      }

      setLoading(true);
      resetMessages();

      try {
        const response =
          await fetch(
            '/api/auth/student',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              credentials:
                'include',

              body: JSON.stringify({
                action:
                  'login',

                email:
                  normalizedEmail,

                password,

                deviceInfo:
                  typeof navigator !==
                  'undefined'
                    ? navigator.userAgent
                    : 'Web Browser',

                forceSignoutOther:
                  force,
              }),
            }
          );

        const data =
          (await response
            .json()
            .catch(
              () => ({})
            )) as ApiResponse;

        /* -----------------------------------------------
           ONE DEVICE SECURITY
        ----------------------------------------------- */

        if (
          response.status ===
            409 &&
          data.requiresForce
        ) {
          setRequiresForce(
            true
          );

          setErrorMessage(
            data.message ||
              'This account is already active on another device.'
          );

          return;
        }

        /* -----------------------------------------------
           FAILURE
        ----------------------------------------------- */

        if (
          !response.ok ||
          !data.success
        ) {
          setErrorMessage(
            data.message ||
              'Invalid student email or password.'
          );

          return;
        }

        /* -----------------------------------------------
           SAVE STUDENT SNAPSHOT
        ----------------------------------------------- */

        const student =
          data.student || {
            email:
              normalizedEmail,
          };

        try {
          window.localStorage.setItem(
            'edupath_student',
            JSON.stringify(
              student
            )
          );
        } catch {
          // Ignore localStorage errors.
        }

        /* -----------------------------------------------
           NOTIFY NAVBAR
        ----------------------------------------------- */

        window.dispatchEvent(
          new Event(
            AUTH_CHANGED_EVENT
          )
        );

        /* -----------------------------------------------
           NAVIGATE
        ----------------------------------------------- */

        router.replace(
          redirectTarget
        );

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

  /* =====================================================
     ADMIN LOGIN
  ===================================================== */

  const handleAdminLogin =
    async () => {
      if (loading) {
        return;
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !normalizedEmail ||
        !password
      ) {
        setErrorMessage(
          'Please enter your email and password.'
        );

        return;
      }

      setLoading(true);
      resetMessages();

      try {
        const response =
          await fetch(
            '/api/auth/admin',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              credentials:
                'include',

              body: JSON.stringify({
                action:
                  'login',

                email:
                  normalizedEmail,

                password,

                deviceInfo:
                  typeof navigator !==
                  'undefined'
                    ? navigator.userAgent
                    : 'Web Browser',
              }),
            }
          );

        const data =
          (await response
            .json()
            .catch(
              () => ({})
            )) as ApiResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          setErrorMessage(
            data.message ||
              'Invalid admin credentials.'
          );

          return;
        }

        try {
          window.localStorage.removeItem(
            'edupath_student'
          );
        } catch {
          // Ignore localStorage errors.
        }

        window.dispatchEvent(
          new Event(
            AUTH_CHANGED_EVENT
          )
        );

        router.replace(
          '/admin'
        );

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

  /* =====================================================
     FORM
  ===================================================== */

  const handleSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        loginType ===
        'student'
      ) {
        await handleStudentLogin(
          false
        );
      } else {
        await handleAdminLogin();
      }
    };

  /* =====================================================
     LOADING
  ===================================================== */

  if (checkingSession) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>

          <p className="text-sm font-medium text-slate-500">
            Checking your EduPath session...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="text-center space-y-2 mb-6">
        <div
          className={`w-12 h-12 rounded-2xl ${
            loginType ===
            'admin'
              ? 'bg-amber-500'
              : 'bg-brand-600'
          } flex items-center justify-center mx-auto shadow-lg`}
        >
          {loginType ===
          'admin' ? (
            <ShieldCheck className="w-6 h-6 text-white" />
          ) : (
            <GraduationCap className="w-6 h-6 text-white" />
          )}
        </div>

        <h1 className="text-2xl font-black text-slate-900">
          {loginType ===
          'admin'
            ? 'EduPath Admin Login'
            : 'EduPath Login'}
        </h1>

        <p className="text-xs text-slate-500">
          {loginType ===
          'admin'
            ? 'Secure administrator access to the EduPath management portal'
            : 'Access your personalized roadmap, mock tests & demo bookings'}
        </p>
      </div>

      {/* =================================================
          LOGIN TYPE SELECTOR
      ================================================= */}

      <div className="mb-4">
        <label
          htmlFor="loginType"
          className="block text-xs font-semibold text-slate-700 mb-1"
        >
          Login As
        </label>

        <div className="relative">
          {loginType ===
          'admin' ? (
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
          ) : (
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none" />
          )}

          <select
            id="loginType"
            value={
              loginType
            }
            onChange={(
              event
            ) =>
              handleLoginTypeChange(
                event.target
                  .value as LoginType
              )
            }
            className="
              w-full
              appearance-none
              pl-9
              pr-3
              py-3
              text-sm
              border
              border-slate-300
              rounded-xl
              bg-white
              outline-none
              focus:ring-2
              focus:ring-brand-500
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
          LOGIN FORM
      ================================================= */}

      <form
        onSubmit={
          handleSubmit
        }
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4"
      >
        {/* -----------------------------------------------
            ERROR
        ----------------------------------------------- */}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />

            <span>
              {
                errorMessage
              }
            </span>
          </div>
        )}

        {/* -----------------------------------------------
            EMAIL
        ----------------------------------------------- */}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Email Address
          </label>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(
                event
              ) =>
                setEmail(
                  event.target
                    .value
                )
              }
              placeholder={
                loginType ===
                'admin'
                  ? 'admin@edupath.in'
                  : 'student@example.com'
              }
              className="
                w-full
                pl-9
                pr-3
                py-3
                text-sm
                border
                border-slate-300
                rounded-xl
                bg-white
                outline-none
                focus:ring-2
                focus:ring-brand-500
              "
            />
          </div>
        </div>

        {/* -----------------------------------------------
            PASSWORD
        ----------------------------------------------- */}

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Password
          </label>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(
                event
              ) =>
                setPassword(
                  event.target
                    .value
                )
              }
              placeholder="Enter your password"
              className="
                w-full
                pl-9
                pr-3
                py-3
                text-sm
                border
                border-slate-300
                rounded-xl
                bg-white
                outline-none
                focus:ring-2
                focus:ring-brand-500
              "
            />
          </div>
        </div>

        {/* -----------------------------------------------
            STUDENT SECURITY INFO
        ----------------------------------------------- */}

        {loginType ===
          'student' && (
          <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl text-xs text-slate-600 flex items-start gap-2">
            <Smartphone className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />

            <div>
              <span className="font-bold">
                Secure Student Session
              </span>

              <p className="mt-1">
                Your session is
                maintained securely
                by EduPath. You
                should not need to
                log in repeatedly
                while the session is
                valid.
              </p>
            </div>
          </div>
        )}

        {/* -----------------------------------------------
            ADMIN INFO
        ----------------------------------------------- */}

        {loginType ===
          'admin' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />

            <div>
              <span className="font-bold">
                Administrator Access
              </span>

              <p className="mt-1">
                This area is restricted
                to authorized EduPath
                administrators.
              </p>
            </div>
          </div>
        )}

        {/* -----------------------------------------------
            FORCE OTHER DEVICE LOGIN
        ----------------------------------------------- */}

        {loginType ===
          'student' &&
          requiresForce && (
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800">
              <strong>
                Another device is currently
                logged in.
              </strong>

              <p className="mt-1">
                You can sign out the
                other device and
                continue on this
                device.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleStudentLogin(
                  true
                )
              }
              disabled={loading}
              className="
                w-full
                py-3
                rounded-xl
                bg-brand-600
                hover:bg-brand-700
                text-white
                text-xs
                font-black
                transition
                disabled:opacity-50
              "
            >
              {loading
                ? 'Switching Device...'
                : 'Sign Out Other Device & Log In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setRequiresForce(
                  false
                );

                setErrorMessage(
                  ''
                );
              }}
              className="
                w-full
                py-2.5
                rounded-xl
                border
                border-slate-300
                text-slate-600
                text-xs
                font-semibold
                hover:bg-slate-50
              "
            >
              Cancel
            </button>
          </div>
        )}

        {/* -----------------------------------------------
            SUBMIT
        ----------------------------------------------- */}

        {!(
          loginType ===
            'student' &&
          requiresForce
        ) && (
          <button
            type="submit"
            disabled={
              loading
            }
            className={`
              w-full
              py-3
              rounded-xl
              text-white
              text-xs
              font-black
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
              ${
                loginType ===
                'admin'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-brand-600 hover:bg-brand-700'
              }
            `}
          >
            {loading
              ? 'Signing in...'
              : loginType ===
                  'admin'
                ? 'Sign in as Admin'
                : 'Sign in as Student'}
          </button>
        )}

        {/* -----------------------------------------------
            REGISTER LINK
        ----------------------------------------------- */}

        {loginType ===
          'student' && (
          <p className="text-center text-xs text-slate-500">
            New student?{' '}

            <Link
              href="/register"
              className="font-bold text-brand-600 hover:underline"
            >
              Create your account
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}