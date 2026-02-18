import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your Language A account',
};

export default function SignInPage() {
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
          <h1 className="text-xl font-bold text-charcoal text-center mb-6">
            Welcome to Language A
          </h1>
          <Suspense fallback={<div className="h-64 flex items-center justify-center"><span className="spinner" /></div>}>
            <AuthForm />
          </Suspense>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-steel">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
