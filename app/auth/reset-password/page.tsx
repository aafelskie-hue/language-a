import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';

export const metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your Language A account',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="Language A home">
            <Logo size="lg" variant="dark" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card border border-slate/10 shadow-sm p-6 md:p-8">
          <Suspense fallback={<div className="h-48 flex items-center justify-center"><span className="spinner" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
