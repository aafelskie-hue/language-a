'use client';

import { ChatInterface } from '@/components/guide/ChatInterface';

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-3">
          AI-Powered Guidance
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-3">
          Pattern Guide
        </h1>
        <p className="text-slate max-w-2xl">
          Describe your design project or challenge, and I&apos;ll suggest relevant patterns
          from Language A. I can help you find connections between patterns and build
          a coherent pattern language for your specific situation.
        </p>
      </header>

      {/* Chat Interface */}
      <div className="card p-0 overflow-hidden">
        <ChatInterface />
      </div>

    </div>
  );
}
