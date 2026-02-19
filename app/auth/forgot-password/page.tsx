import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';

export const metadata = {
  title: 'Forgot Password',
  description: 'Reset your Language A password',
};

export default function ForgotPasswordPage() {
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
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
