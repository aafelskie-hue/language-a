import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-page mx-auto px-4 md:px-6 py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-3">
        404
      </p>
      <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-4">
        Page Not Found
      </h1>
      <p className="text-slate mb-8 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist.
        It might have been moved, or you may have mistyped the address.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to Pattern Explorer
      </Link>
    </div>
  );
}
