// src/components/AuthGuardModal.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ShieldCheck, X } from 'lucide-react';
import { AccountType, accountTypeQuery } from '@/lib/accessGuard';

interface AuthGuardModalProps {
  targetPath: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthGuardModal({
  targetPath,
  isOpen,
  onClose,
}: AuthGuardModalProps) {
  const router = useRouter();

  const [account, setAccount] = useState<AccountType>('Student');

  const handleLogin = () => {
    const query =
      `${accountTypeQuery(account)}` +
      `&redirect=${encodeURIComponent(targetPath)}`;

    router.push(`/login${query}`);

    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-guard-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-7 pb-4 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/20">
            <User className="h-6 w-6 text-white" />
          </div>

          <h2
            id="auth-guard-title"
            className="text-xl font-black text-slate-900"
          >
            Login Required
          </h2>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Please sign in to access this EduPath feature and continue your
            education journey.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">

          <label className="mb-2 block text-xs font-semibold text-slate-700">
            Continue as
          </label>

          {/* Account Selection */}
          <div className="grid grid-cols-2 gap-3">

            {/* Student */}
            <button
              type="button"
              onClick={() => setAccount('Student')}
              className={`rounded-xl border p-4 text-left transition ${
                account === 'Student'
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div
                className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
                  account === 'Student'
                    ? 'bg-brand-600'
                    : 'bg-slate-100'
                }`}
              >
                <User
                  className={`h-4 w-4 ${
                    account === 'Student'
                      ? 'text-white'
                      : 'text-slate-500'
                  }`}
                />
              </div>

              <div className="text-sm font-bold text-slate-900">
                Student
              </div>

              <div className="mt-1 text-[11px] text-slate-500">
                Courses, exams & roadmap
              </div>
            </button>

            {/* Admin */}
            <button
              type="button"
              onClick={() => setAccount('Admin')}
              className={`rounded-xl border p-4 text-left transition ${
                account === 'Admin'
                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div
                className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
                  account === 'Admin'
                    ? 'bg-amber-500'
                    : 'bg-slate-100'
                }`}
              >
                <ShieldCheck
                  className={`h-4 w-4 ${
                    account === 'Admin'
                      ? 'text-white'
                      : 'text-slate-500'
                  }`}
                />
              </div>

              <div className="text-sm font-bold text-slate-900">
                Admin
              </div>

              <div className="mt-1 text-[11px] text-slate-500">
                Management dashboard
              </div>
            </button>

          </div>

          {/* Information */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-5 text-slate-600">
            {account === 'Student' ? (
              <>
                New student? You can create your account from the Student
                Login page.
              </>
            ) : (
              <>
                Admin access is restricted to authorized EduPath
                administrators only.
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-3">

            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleLogin}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition ${
                account === 'Admin'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              Continue to Login
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}