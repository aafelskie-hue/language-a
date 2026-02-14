'use client';

import { useState, Suspense, lazy } from 'react';
import type { Scale } from '@/lib/types';
import type { NetworkNode } from '@/lib/network';
import { NetworkControls } from '@/components/network/NetworkControls';
import { NodeDetail } from '@/components/network/NodeDetail';
import { PatternList } from '@/components/patterns/PatternList';
import { patterns } from '@/lib/patterns';

// Lazy load the heavy D3 component
const NetworkGraph = lazy(() => import('@/components/network/NetworkGraph').then(m => ({ default: m.NetworkGraph })));

function LoadingFallback() {
  return (
    <div className="w-full h-full min-h-[400px] bg-surface-warm rounded-card flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-3"></div>
        <p className="text-sm text-steel">Loading network visualization...</p>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const [colorMode, setColorMode] = useState<'scale' | 'category'>('scale');
  const [visibleScales, setVisibleScales] = useState<Scale[]>(['neighborhood', 'building', 'construction']);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showGraph, setShowGraph] = useState(true);

  const handleScaleToggle = (scale: Scale) => {
    setVisibleScales(prev =>
      prev.includes(scale)
        ? prev.filter(s => s !== scale)
        : [...prev, scale]
    );
  };

  const handleReset = () => {
    setColorMode('scale');
    setVisibleScales(['neighborhood', 'building', 'construction']);
    setSearch('');
    setSelectedNode(null);
  };

  return (
    <div className="max-w-page mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-3">
          100 Patterns Interconnected
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-3">
          Pattern Network
        </h1>
        <p className="text-slate max-w-2xl">
          Explore how the patterns connect. Click any node to see its connections.
          Zoom with scroll, pan by dragging.
        </p>
      </header>

      {/* View Toggle */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setShowGraph(true)}
          className={`btn ${showGraph ? 'btn-primary' : 'btn-secondary'}`}
        >
          Graph View
        </button>
        <button
          onClick={() => setShowGraph(false)}
          className={`btn ${!showGraph ? 'btn-primary' : 'btn-secondary'}`}
        >
          List View (Accessible)
        </button>
      </div>

      {showGraph ? (
        <div className="lg:flex lg:gap-6">
          {/* Controls */}
          <aside className="lg:w-64 flex-shrink-0 mb-6 lg:mb-0">
            <NetworkControls
              colorMode={colorMode}
              onColorModeChange={setColorMode}
              visibleScales={visibleScales}
              onScaleToggle={handleScaleToggle}
              search={search}
              onSearchChange={setSearch}
              onReset={handleReset}
            />
          </aside>

          {/* Graph */}
          <main className="flex-1 relative" style={{ height: '70vh', minHeight: '500px' }}>
            <Suspense fallback={<LoadingFallback />}>
              <NetworkGraph
                colorMode={colorMode}
                visibleScales={visibleScales}
                searchQuery={search}
                selectedNode={selectedNode}
                onNodeSelect={setSelectedNode}
              />
            </Suspense>

            {/* Node Detail Panel */}
            <NodeDetail
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </main>
        </div>
      ) : (
        /* Accessible List View */
        <main>
          <p className="text-sm text-steel mb-4">
            Keyboard-accessible list of all patterns. Use Tab to navigate.
          </p>
          <PatternList patterns={patterns} />
        </main>
      )}
    </div>
  );
}
