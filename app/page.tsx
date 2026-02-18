'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { patterns, filterPatterns, getRandomPattern, categories } from '@/lib/patterns';
import type { Scale, Confidence } from '@/lib/types';
import { PatternCard } from '@/components/patterns/PatternCard';
import { PatternList } from '@/components/patterns/PatternList';
import { FilterBar } from '@/components/patterns/FilterBar';

type ViewMode = 'grid' | 'list';

// Stats
const neighborhoodCount = patterns.filter(p => p.scale === 'neighborhood').length;
const buildingCount = patterns.filter(p => p.scale === 'building').length;
const constructionCount = patterns.filter(p => p.scale === 'construction').length;

export default function HomePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [scale, setScale] = useState<Scale | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [search, setSearch] = useState('');
  const [showExplorer, setShowExplorer] = useState(false);

  const filteredPatterns = useMemo(() => {
    return filterPatterns({ scale, category, confidence, search });
  }, [scale, category, confidence, search]);

  const handleRandomPattern = () => {
    const randomPattern = getRandomPattern();
    router.push(`/patterns/${randomPattern.id}`);
  };

  const clearFilters = () => {
    setScale(null);
    setCategory(null);
    setConfidence(null);
    setSearch('');
  };

  const handleScaleClick = (selectedScale: Scale) => {
    setScale(selectedScale);
    setShowExplorer(true);
    // Scroll to explorer
    setTimeout(() => {
      document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-navy-deep text-white">
        <div className="max-w-page mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-copper-light mb-4">
              Design Patterns for Enduring Places
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
              {patterns.length} design patterns for places that last
            </h1>
            <p className="text-lg md:text-xl text-silver leading-relaxed mb-8">
              Grounded in the forces that don&apos;t change — climate, light, gravity, and human need for shelter and community.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleRandomPattern}
                className="btn bg-copper hover:bg-copper-dark text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Explore a Random Pattern
              </button>
              <Link href="/network" className="btn bg-white/10 hover:bg-white/20 text-white">
                View Pattern Network
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Hero */}
      <section className="bg-navy-deep text-white border-t border-white/10">
        <div className="max-w-page mx-auto px-4 md:px-6 py-8">
          <div className="max-w-3xl">
            <p className="text-silver leading-relaxed mb-3">
              Each pattern identifies a recurring design problem and offers a tested solution — connected to patterns above it that give it context, and patterns below it that give it form.
            </p>
            <p className="text-silver leading-relaxed">
              For architects, planners, developers, homeowners, and anyone shaping the places where people live and work.
            </p>
          </div>
        </div>
      </section>

      {/* Where to Start */}
      <section className="bg-white border-b border-slate/10">
        <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
            Where to Start
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-charcoal tracking-tight mb-8">
            What are you working on?
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/patterns/1"
              className="p-4 border border-slate/10 rounded-lg hover:border-copper/30 hover:bg-copper-pale/20 transition-all group"
            >
              <p className="font-mono text-xs text-copper mb-1">Start here</p>
              <h3 className="font-semibold text-charcoal group-hover:text-copper transition-colors">
                The Fifteen-Minute Neighborhood
              </h3>
              <p className="text-sm text-slate mt-1">The foundational pattern for community design</p>
            </Link>

            <Link
              href="/patterns/22"
              className="p-4 border border-slate/10 rounded-lg hover:border-copper/30 hover:bg-copper-pale/20 transition-all group"
            >
              <p className="font-mono text-xs text-copper mb-1">Cold climate</p>
              <h3 className="font-semibold text-charcoal group-hover:text-copper transition-colors">
                Building Envelope as Climate System
              </h3>
              <p className="text-sm text-slate mt-1">For northern projects at -30°C</p>
            </Link>

            <Link
              href="/patterns/5"
              className="p-4 border border-slate/10 rounded-lg hover:border-copper/30 hover:bg-copper-pale/20 transition-all group"
            >
              <p className="font-mono text-xs text-copper mb-1">Remote work</p>
              <h3 className="font-semibold text-charcoal group-hover:text-copper transition-colors">
                The Home Office Threshold
              </h3>
              <p className="text-sm text-slate mt-1">Designing for work from home</p>
            </Link>

            <Link
              href="/patterns/12"
              className="p-4 border border-slate/10 rounded-lg hover:border-copper/30 hover:bg-copper-pale/20 transition-all group"
            >
              <p className="font-mono text-xs text-copper mb-1">Housing</p>
              <h3 className="font-semibold text-charcoal group-hover:text-copper transition-colors">
                The Missing Middle
              </h3>
              <p className="text-sm text-slate mt-1">Between single-family and towers</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Three Scales */}
      <section className="bg-surface-warm border-b border-slate/10">
        <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4 text-center">
            Three Scales of Design
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-charcoal tracking-tight mb-8 text-center">
            From neighborhood planning to construction details
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Neighborhood */}
            <button
              onClick={() => handleScaleClick('neighborhood')}
              className="card card-hover text-left group"
            >
              <div className="w-12 h-12 bg-navy/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-navy/20 transition-colors">
                <svg className="w-6 h-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2 group-hover:text-copper transition-colors">
                Neighborhood
              </h3>
              <p className="text-slate text-sm mb-4">
                The fifteen-minute life, third places, walkable density, community governance, and how neighborhoods hold together.
              </p>
              <p className="font-mono text-xs text-copper">
                {neighborhoodCount} patterns →
              </p>
            </button>

            {/* Building */}
            <button
              onClick={() => handleScaleClick('building')}
              className="card card-hover text-left group"
            >
              <div className="w-12 h-12 bg-copper/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-copper/20 transition-colors">
                <svg className="w-6 h-6 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2 group-hover:text-copper transition-colors">
                Building
              </h3>
              <p className="text-slate text-sm mb-4">
                Home offices, missing middle housing, climate envelopes, light and orientation, and how buildings serve inhabitants.
              </p>
              <p className="font-mono text-xs text-copper">
                {buildingCount} patterns →
              </p>
            </button>

            {/* Construction */}
            <button
              onClick={() => handleScaleClick('construction')}
              className="card card-hover text-left group"
            >
              <div className="w-12 h-12 bg-slate/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate/20 transition-colors">
                <svg className="w-6 h-6 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2 group-hover:text-copper transition-colors">
                Construction
              </h3>
              <p className="text-slate text-sm mb-4">
                Thermal mass, deep walls, honest materials, repair culture, and the details that make buildings last.
              </p>
              <p className="font-mono text-xs text-copper">
                {constructionCount} patterns →
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Full Explorer */}
      <section id="explorer" className="bg-surface-warm">
        <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-2">
                All {patterns.length} Patterns
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-charcoal tracking-tight">
                Pattern Explorer
              </h2>
            </div>
            <button
              onClick={() => setShowExplorer(!showExplorer)}
              className="text-sm text-copper hover:text-copper-dark transition-colors"
            >
              {showExplorer ? 'Collapse' : 'Expand filters'}
            </button>
          </div>

          {showExplorer && (
            <div className="lg:flex lg:gap-8 mb-8">
              {/* Filters Sidebar */}
              <aside className="lg:w-64 flex-shrink-0 mb-6 lg:mb-0">
                <FilterBar
                  scale={scale}
                  category={category}
                  confidence={confidence}
                  search={search}
                  onScaleChange={setScale}
                  onCategoryChange={setCategory}
                  onConfidenceChange={setConfidence}
                  onSearchChange={setSearch}
                  onClear={clearFilters}
                />
              </aside>

              {/* Main Content */}
              <main className="flex-1">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                  <p className="font-mono text-sm text-steel">
                    Showing <span className="text-charcoal font-medium">{filteredPatterns.length}</span> of {patterns.length} patterns
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRandomPattern}
                      className="btn btn-secondary text-sm"
                      aria-label="Go to random pattern"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Random
                    </button>

                    <div className="flex items-center border border-slate/20 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 transition-colors ${
                          viewMode === 'grid' ? 'bg-copper text-white' : 'bg-white text-slate hover:bg-cloud'
                        }`}
                        aria-label="Grid view"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 transition-colors ${
                          viewMode === 'list' ? 'bg-copper text-white' : 'bg-white text-slate hover:bg-cloud'
                        }`}
                        aria-label="List view"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results */}
                {filteredPatterns.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-slate mb-4">No patterns match your filters.</p>
                    <button onClick={clearFilters} className="btn btn-secondary">
                      Clear filters
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {filteredPatterns.map((pattern) => (
                      <PatternCard key={pattern.id} pattern={pattern} />
                    ))}
                  </div>
                ) : (
                  <PatternList patterns={filteredPatterns} />
                )}
              </main>
            </div>
          )}

          {!showExplorer && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {patterns.slice(0, 8).map((pattern) => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          )}

          {!showExplorer && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowExplorer(true)}
                className="btn btn-primary"
              >
                Browse All {patterns.length} Patterns
              </button>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white border-t border-slate/10">
        <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
              About Language A
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-charcoal tracking-tight mb-4">
              A pattern language for our time
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              In 1977, Christopher Alexander and his colleagues published <em>A Pattern Language</em> — 253 design patterns spanning towns, buildings, and construction. It became one of the best-selling architecture books ever written, and its core idea is still radical: that ordinary people, not just professionals, can design places that work.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              Language A extends that work into the forces Alexander couldn&apos;t have anticipated. Remote work has reorganized the home. Climate change has made envelope performance existential. Fifty years of car-centric planning have hollowed out the communities his patterns were meant to serve. Housing affordability, aging in place, digital infrastructure, the missing middle — these are the design problems of our time, and they deserve the same rigor Alexander brought to his.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              Alexander&apos;s original 253 patterns stand on their own. Language A doesn&apos;t revise them — it extends the method into territory he pointed toward but couldn&apos;t yet map. Language A adds 254 new patterns that address contemporary challenges while honoring his method: name the problem, present the evidence, propose a solution, and connect each pattern to the larger network of decisions that make a place whole.
            </p>
            <p className="text-slate leading-relaxed mb-8">
              The language is free, open, and actively maintained.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/guide" className="btn btn-primary">
                Ask the Pattern Guide
              </Link>
              <Link href="/projects" className="btn btn-secondary">
                Start a Project
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
