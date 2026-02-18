'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { patterns } from '@/lib/patterns';
import type { Scale } from '@/lib/types';

// Pre-compute node positions in a force-like layout (static)
const nodePositions = generateNodePositions();

function generateNodePositions() {
  // Create a deterministic "organic" layout
  const positions: { x: number; y: number; scale: Scale }[] = [];
  const width = 400;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;

  patterns.forEach((p, i) => {
    // Use golden angle for distribution
    const angle = i * 2.39996; // Golden angle in radians
    const radius = 30 + (i % 7) * 18 + Math.sin(i * 0.5) * 20;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    positions.push({ x, y, scale: p.scale });
  });

  return positions;
}

// Generate links between connected patterns
function generateLinks() {
  const links: { x1: number; y1: number; x2: number; y2: number }[] = [];

  patterns.forEach((p) => {
    p.connections_down.slice(0, 2).forEach((targetId) => {
      const sourcePos = nodePositions[p.id - 1];
      const targetPos = nodePositions[targetId - 1];
      if (sourcePos && targetPos) {
        links.push({
          x1: sourcePos.x,
          y1: sourcePos.y,
          x2: targetPos.x,
          y2: targetPos.y,
        });
      }
    });
  });

  return links;
}

const scaleColors: Record<Scale, string> = {
  neighborhood: '#1E3A5F',
  building: '#B5734A',
  construction: '#6B7280',
};

const scaleSizes: Record<Scale, number> = {
  neighborhood: 4,
  building: 3,
  construction: 2,
};

export function MiniNetworkPreview() {
  const links = useMemo(() => generateLinks(), []);

  // Count patterns with at least one connection (up or down)
  const connectedCount = useMemo(() =>
    patterns.filter(p => p.connections_up.length > 0 || p.connections_down.length > 0).length,
  []);

  return (
    <Link
      href="/network"
      className="block relative overflow-hidden rounded-xl bg-navy-deep/5 hover:bg-navy-deep/10 transition-colors group"
      aria-label="View full pattern network"
    >
      <svg
        viewBox="0 0 400 300"
        className="w-full h-auto opacity-60 group-hover:opacity-80 transition-opacity"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Links */}
        <g className="links">
          {links.map((link, i) => (
            <line
              key={i}
              x1={link.x1}
              y1={link.y1}
              x2={link.x2}
              y2={link.y2}
              stroke="#9CA3AF"
              strokeWidth={0.5}
              strokeOpacity={0.3}
            />
          ))}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodePositions.map((pos, i) => (
            <circle
              key={i}
              cx={pos.x}
              cy={pos.y}
              r={scaleSizes[pos.scale]}
              fill={scaleColors[pos.scale]}
              opacity={0.7}
            />
          ))}
        </g>
      </svg>

      {/* Overlay label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm group-hover:bg-white transition-colors">
          <p className="font-mono text-[10px] uppercase tracking-widest text-copper mb-1">
            {connectedCount} Connected Patterns
          </p>
          <p className="text-sm font-medium text-charcoal flex items-center gap-2">
            Explore the Network
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </p>
        </div>
      </div>
    </Link>
  );
}
