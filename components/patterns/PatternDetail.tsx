'use client';

import Link from 'next/link';
import type { Pattern } from '@/lib/types';
import { getConnectedPatterns, getCategorySiblings, getNextPattern, getPreviousPattern, getConfidenceStars, getConfidenceLabel } from '@/lib/patterns';
import { ScaleBadge } from './ScaleBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ConnectionChip } from './ConnectionChip';
import { useSession } from 'next-auth/react';
import { useProjectStore } from '@/store/useProjectStore';

interface PatternDetailProps {
  pattern: Pattern;
}

export function PatternDetail({ pattern }: PatternDetailProps) {
  const { data: session } = useSession();
  const { projects, activeProjectId, addPattern, isPatternInProject } = useProjectStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const isInActiveProject = activeProjectId ? isPatternInProject(activeProjectId, pattern.id) : false;
  const connections = getConnectedPatterns(pattern);
  const siblings = getCategorySiblings(pattern);
  const nextPattern = getNextPattern(pattern.id);
  const prevPattern = getPreviousPattern(pattern.id);

  // Format body text with paragraphs
  const bodyParagraphs = pattern.body
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => p.trim());

  return (
    <article className="max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link href="/" className="text-steel hover:text-copper transition-colors">
              Patterns
            </Link>
          </li>
          <li className="text-silver">/</li>
          <li>
            <span className="text-slate">{pattern.categoryLabel}</span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="pattern-number text-3xl md:text-4xl">{pattern.reading_order}</span>
          <ConfidenceBadge confidence={pattern.confidence} showLabel />
        </div>

        <h1 className="pattern-name text-3xl md:text-4xl mb-4">
          {pattern.name}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <ScaleBadge scale={pattern.scale} size="md" />
          <span className="font-mono text-xs uppercase tracking-wider text-steel">
            {pattern.categoryLabel}
          </span>
          <span className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-steel bg-cloud rounded-full">
            {pattern.status}
          </span>
        </div>

        {/* Add to Project */}
        {activeProject ? (
          <button
            onClick={() => addPattern(activeProject.id, pattern.id)}
            disabled={isInActiveProject}
            className={`btn text-sm ${isInActiveProject ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
          >
            {isInActiveProject ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                In &quot;{activeProject.name}&quot;
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add to &quot;{activeProject.name}&quot;
              </>
            )}
          </button>
        ) : (
          <Link href={session?.user ? "/projects" : "/auth/signin?callbackUrl=/projects"} className="btn btn-secondary text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create a project to save patterns
          </Link>
        )}
      </header>

      {/* Connections Up */}
      {connections.up.length > 0 && (
        <section className="mb-8" aria-labelledby="connections-up">
          <h2 id="connections-up" className="font-mono text-xs uppercase tracking-widest text-steel mb-3">
            This pattern is shaped by
          </h2>
          <div className="flex flex-wrap gap-2">
            {connections.up.map((p) => (
              <ConnectionChip key={p.id} pattern={p} direction="up" />
            ))}
          </div>
        </section>
      )}

      {/* Problem */}
      <section className="mb-8" aria-labelledby="problem">
        <h2 id="problem" className="sr-only">Problem</h2>
        <div className="block-problem">
          <p className="font-semibold text-charcoal leading-relaxed">
            {pattern.problem}
          </p>
        </div>
      </section>

      {/* Body/Evidence */}
      <section className="mb-8 prose prose-slate max-w-none" aria-labelledby="evidence">
        <h2 id="evidence" className="sr-only">Evidence and Discussion</h2>
        <div className="space-y-4">
          {bodyParagraphs.map((paragraph, i) => (
            <p key={i} className="text-body">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="mb-8" aria-labelledby="solution">
        <h2 id="solution" className="font-mono text-xs uppercase tracking-widest text-steel mb-3">
          Therefore
        </h2>
        <div className="block-solution">
          <p className="font-semibold text-charcoal leading-relaxed">
            {pattern.solution}
          </p>
        </div>
      </section>

      {/* Connections Down */}
      {connections.down.length > 0 && (
        <section className="mb-12" aria-labelledby="connections-down">
          <h2 id="connections-down" className="font-mono text-xs uppercase tracking-widest text-steel mb-3">
            This pattern gives form to
          </h2>
          <div className="flex flex-wrap gap-2">
            {connections.down.map((p) => (
              <ConnectionChip key={p.id} pattern={p} direction="down" />
            ))}
          </div>
        </section>
      )}

      {/* Navigation */}
      <nav className="flex items-center justify-between pt-8 border-t border-slate/10" aria-label="Pattern navigation">
        {prevPattern ? (
          <Link
            href={`/patterns/${prevPattern.reading_order}`}
            className="flex items-center gap-2 text-slate hover:text-copper transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-mono text-xs">{prevPattern.reading_order}</span>
            <span className="hidden sm:inline">{prevPattern.name}</span>
          </Link>
        ) : (
          <div />
        )}

        {nextPattern ? (
          <Link
            href={`/patterns/${nextPattern.reading_order}`}
            className="flex items-center gap-2 text-slate hover:text-copper transition-colors"
          >
            <span className="hidden sm:inline">{nextPattern.name}</span>
            <span className="font-mono text-xs">{nextPattern.reading_order}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <div />
        )}
      </nav>

      {/* Category Siblings */}
      {siblings.length > 0 && (
        <aside className="mt-12 pt-8 border-t border-slate/10" aria-labelledby="siblings">
          <h2 id="siblings" className="font-mono text-xs uppercase tracking-widest text-steel mb-4">
            Other patterns in {pattern.categoryLabel}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {siblings.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href={`/patterns/${p.reading_order}`}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate/10 rounded-lg hover:border-copper/30 transition-colors"
              >
                <span className="font-mono text-xs text-copper">{p.reading_order}</span>
                <span className="text-sm text-slate truncate">{p.name}</span>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}
