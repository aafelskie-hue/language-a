'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { Scale } from '@/lib/types';
import { prepareNetworkData, scaleColors, categoryColors, scaleSizes, NetworkNode, NetworkLink } from '@/lib/network';

interface NetworkGraphProps {
  colorMode: 'scale' | 'category';
  visibleScales: Scale[];
  searchQuery: string;
  selectedNode: NetworkNode | null;
  onNodeSelect: (node: NetworkNode | null) => void;
}

export function NetworkGraph({
  colorMode,
  visibleScales,
  searchQuery,
  selectedNode,
  onNodeSelect,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Memoize data
  const { nodes, links } = prepareNetworkData();

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Filter nodes by visible scales
    const filteredNodes = nodes.filter(n => visibleScales.includes(n.scale));
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(
      l => filteredNodeIds.has(l.source as number) && filteredNodeIds.has(l.target as number)
    );

    // Search highlighting
    const searchLower = searchQuery.toLowerCase();
    const matchingNodeIds = new Set(
      filteredNodes
        .filter(n => n.name.toLowerCase().includes(searchLower) || n.number.includes(searchLower))
        .map(n => n.id)
    );

    // Setup zoom
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation<NetworkNode>(filteredNodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(filteredLinks)
        .id(d => d.id)
        .distance(60)
        .strength(0.3))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<NetworkNode>().radius((d) => scaleSizes[d.scale] + 4));

    // Draw links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredLinks)
      .join('line')
      .attr('class', 'network-link')
      .attr('stroke-width', 1);

    // Draw nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(filteredNodes)
      .join('circle')
      .attr('class', 'network-node')
      .attr('r', d => scaleSizes[d.scale])
      .attr('fill', d => colorMode === 'scale' ? scaleColors[d.scale] : categoryColors[d.category])
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .call(d3.drag<SVGCircleElement, NetworkNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Node labels (only visible when zoomed in)
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(filteredNodes)
      .join('text')
      .text(d => d.name)
      .attr('font-size', 8)
      .attr('font-family', 'var(--font-dm-sans)')
      .attr('fill', '#374151')
      .attr('text-anchor', 'middle')
      .attr('dy', d => scaleSizes[d.scale] + 10)
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'network-tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #E5E7EB')
      .style('border-radius', '8px')
      .style('padding', '8px 12px')
      .style('font-size', '12px')
      .style('font-family', 'var(--font-dm-sans)')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);

    // Node interactions
    node
      .on('mouseover', function(event, d) {
        tooltip
          .html(`<strong>${d.number}</strong> ${d.name}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .style('opacity', 1);
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        onNodeSelect(d);
        highlightConnections(d);
      });

    // Click background to deselect
    svg.on('click', () => {
      onNodeSelect(null);
      resetHighlight();
    });

    function highlightConnections(d: NetworkNode) {
      const connectedIds = new Set<number>();
      connectedIds.add(d.id);

      filteredLinks.forEach(l => {
        const sourceId = typeof l.source === 'number' ? l.source : (l.source as NetworkNode).id;
        const targetId = typeof l.target === 'number' ? l.target : (l.target as NetworkNode).id;
        if (sourceId === d.id) connectedIds.add(targetId);
        if (targetId === d.id) connectedIds.add(sourceId);
      });

      node.style('opacity', n => connectedIds.has(n.id) ? 1 : 0.2);
      link.style('opacity', l => {
        const sourceId = typeof l.source === 'number' ? l.source : (l.source as NetworkNode).id;
        const targetId = typeof l.target === 'number' ? l.target : (l.target as NetworkNode).id;
        return sourceId === d.id || targetId === d.id ? 1 : 0.1;
      });
      link.attr('stroke', l => {
        const sourceId = typeof l.source === 'number' ? l.source : (l.source as NetworkNode).id;
        const targetId = typeof l.target === 'number' ? l.target : (l.target as NetworkNode).id;
        return sourceId === d.id || targetId === d.id ? '#B5734A' : '#9CA3AF';
      });
    }

    function resetHighlight() {
      node.style('opacity', 1);
      link.style('opacity', 0.4);
      link.attr('stroke', '#9CA3AF');
    }

    // Search highlighting
    if (searchQuery) {
      node.style('opacity', n => matchingNodeIds.has(n.id) ? 1 : 0.2);
      node.attr('stroke', n => matchingNodeIds.has(n.id) ? '#B5734A' : '#fff');
      node.attr('stroke-width', n => matchingNodeIds.has(n.id) ? 3 : 1.5);
    }

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NetworkNode).x!)
        .attr('y1', d => (d.source as NetworkNode).y!)
        .attr('x2', d => (d.target as NetworkNode).x!)
        .attr('y2', d => (d.target as NetworkNode).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>, d: NetworkNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [dimensions, colorMode, visibleScales, searchQuery, nodes, links, onNodeSelect]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-surface-warm rounded-card">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
