'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
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
  const [controlsExpanded, setControlsExpanded] = useState(true);

  // Initialize based on viewport width
  useEffect(() => {
    setControlsExpanded(window.innerWidth >= 1024);
  }, []);

  // Collapse controls when a node is selected
  useEffect(() => {
    if (selectedNode) {
      setControlsExpanded(false);
    }
  }, [selectedNode]);

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
    <>
      {showGraph ? (
        <div className="fixed top-14 md:top-16 left-0 right-0 bottom-0 z-10">
          {/* Full viewport graph */}
          <Suspense fallback={<LoadingFallback />}>
            <NetworkGraph
              colorMode={colorMode}
              visibleScales={visibleScales}
              searchQuery={search}
              selectedNode={selectedNode}
              onNodeSelect={setSelectedNode}
            />
          </Suspense>

          {/* Floating controls panel - top left */}
          <NetworkControls
            colorMode={colorMode}
            onColorModeChange={setColorMode}
            visibleScales={visibleScales}
            onScaleToggle={handleScaleToggle}
            search={search}
            onSearchChange={setSearch}
            onReset={handleReset}
            isExpanded={controlsExpanded}
            onToggle={() => setControlsExpanded(!controlsExpanded)}
          />

          {/* View toggle pills - top right */}
          <div className="absolute top-4 right-4 z-20 flex rounded-lg overflow-hidden shadow-lg border border-slate/10">
            <button
              onClick={() => setShowGraph(true)}
              className="px-4 py-2 text-sm font-medium bg-copper text-white"
            >
              Graph
            </button>
            <button
              onClick={() => setShowGraph(false)}
              className="px-4 py-2 text-sm font-medium bg-white/95 backdrop-blur text-slate hover:text-charcoal transition-colors"
            >
              List
            </button>
          </div>

          {/* Node detail panel */}
          <NodeDetail
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      ) : (
        /* List view keeps current layout with container */
        <div className="max-w-page mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* View toggle for list view */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-2">
                {patterns.length} Patterns
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-charcoal tracking-tight">
                Pattern List
              </h1>
            </div>
            <div className="flex rounded-lg overflow-hidden shadow border border-slate/10">
              <button
                onClick={() => setShowGraph(true)}
                className="px-4 py-2 text-sm font-medium bg-white text-slate hover:text-charcoal transition-colors"
              >
                Graph
              </button>
              <button
                onClick={() => setShowGraph(false)}
                className="px-4 py-2 text-sm font-medium bg-copper text-white"
              >
                List
              </button>
            </div>
          </div>

          <p className="text-sm text-steel mb-6">
            Keyboard-accessible list of all patterns. Use Tab to navigate.
          </p>
          <PatternList patterns={patterns} />
        </div>
      )}
    </>
  );
}
