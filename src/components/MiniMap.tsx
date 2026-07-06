/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { MouseEvent, useRef, useEffect, useState } from 'react';
import { TreeLayout, Person } from '../types';

interface MiniMapProps {
  layout: TreeLayout;
  transform: { x: number; y: number; zoom: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
  people: Record<string, Person>;
  selectedId: string | null;
  onMiniMapClick: (x: number, y: number) => void;
}

const MAP_WIDTH = 190;
const MAP_HEIGHT = 110;

export default function MiniMap({
  layout,
  transform,
  containerRef,
  people,
  selectedId,
  onMiniMapClick
}: MiniMapProps) {
  const mapRef = useRef<SVGSVGElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 600 });
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);

  // Watch container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerSize({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  // Find overall bounding box of layout
  const nodes = Object.values(layout.nodes);
  if (nodes.length === 0) return null;

  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs) - 150;
  const maxX = Math.max(...xs) + 370; // Include card width
  const minY = Math.min(...ys) - 100;
  const maxY = Math.max(...ys) + 200;

  const treeW = maxX - minX;
  const treeH = maxY - minY;

  // Scale factor to fit MAP_WIDTH x MAP_HEIGHT
  const scaleX = MAP_WIDTH / treeW;
  const scaleY = MAP_HEIGHT / treeH;
  const mapScale = Math.min(scaleX, scaleY);

  // Center alignment within mini-map bounds
  const offsetX = (MAP_WIDTH - treeW * mapScale) / 2;
  const offsetY = (MAP_HEIGHT - treeH * mapScale) / 2;

  // Helper to translate tree coords to mini-map coords
  const mapCoords = (x: number, y: number) => ({
    x: (x - minX) * mapScale + offsetX,
    y: (y - minY) * mapScale + offsetY
  });

  // Calculate viewport frame in tree coordinates
  const viewLeft = -transform.x / transform.zoom;
  const viewTop = -transform.y / transform.zoom;
  const viewWidth = containerSize.width / transform.zoom;
  const viewHeight = containerSize.height / transform.zoom;

  const viewStart = mapCoords(viewLeft, viewTop);
  const viewW = viewWidth * mapScale;
  const viewH = viewHeight * mapScale;

  // Clamped viewport dimensions to fit map container
  const viewportX = Math.max(0, Math.min(MAP_WIDTH, viewStart.x));
  const viewportY = Math.max(0, Math.min(MAP_HEIGHT, viewStart.y));
  const viewportW = Math.max(8, Math.min(MAP_WIDTH - viewportX, viewW));
  const viewportH = Math.max(6, Math.min(MAP_HEIGHT - viewportY, viewH));

  const handleMapAction = (clientX: number, clientY: number) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(MAP_WIDTH, clientX - rect.left));
    const clickY = Math.max(0, Math.min(MAP_HEIGHT, clientY - rect.top));

    // Convert back from mini-map coords to tree coords
    const canvasX = (clickX - offsetX) / mapScale + minX;
    const canvasY = (clickY - offsetY) / mapScale + minY;

    onMiniMapClick(canvasX, canvasY);
  };

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    setIsDraggingViewport(true);
    handleMapAction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!isDraggingViewport) return;
    handleMapAction(e.clientX, e.clientY);
  };

  const handleMouseUpOrLeave = () => {
    setIsDraggingViewport(false);
  };

  return (
    <div
      id="mini-map-container"
      className="absolute bottom-24 right-6 z-30 bg-[#1D1E21]/80 backdrop-blur-md border border-neutral-800/80 rounded-xl p-2.5 shadow-xl select-none transition-all duration-300"
    >
      <div className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider mb-1 px-0.5">
        Mini Map
      </div>
      <svg
        ref={mapRef}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="bg-neutral-950/80 rounded border border-neutral-900 overflow-hidden cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        {/* Render tiny tree lines */}
        {layout.links.map((link) => {
          const from = mapCoords(link.from.x, link.from.y);
          const to = mapCoords(link.to.x, link.to.y);
          return (
            <line
              key={link.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={`minimap-line ${link.type === 'marriage' ? 'marriage' : 'parent-child'}`}
              stroke={
                link.type === 'marriage'
                  ? 'rgba(251, 191, 36, 0.25)'
                  : 'rgba(255, 255, 255, 0.1)'
              }
              strokeWidth="0.8"
            />
          );
        })}

        {/* Render tiny nodes */}
        {nodes.map((node) => {
          const mapped = mapCoords(node.x, node.y);
          const nw = node.width * mapScale;
          const nh = node.height * mapScale;
          const isSelected = node.id === selectedId;

          let color = 'rgba(255, 255, 255, 0.25)'; // fallback other
          if (node.gender === 'male') {
            color = 'rgba(59, 130, 246, 0.45)'; // Father Branch Blue
          } else if (node.gender === 'female') {
            color = 'rgba(16, 185, 129, 0.45)'; // Mother Branch Emerald
          }

          if (isSelected) {
            color = '#F59E0B'; // Selected Gold
          }

          return (
            <rect
              key={node.id}
              x={mapped.x}
              y={mapped.y}
              width={Math.max(4, nw)}
              height={Math.max(2.5, nh)}
              rx="1.5"
              className={`minimap-node ${isSelected ? 'selected' : ''}`}
              fill={color}
              stroke={isSelected ? '#F59E0B' : 'rgba(255,255,255,0.05)'}
              strokeWidth={isSelected ? '0.6' : '0.2'}
            />
          );
        })}

        {/* Viewport Tracker Box */}
        <rect
          x={viewportX}
          y={viewportY}
          width={viewportW}
          height={viewportH}
          className="minimap-viewport"
          fill="rgba(255, 255, 255, 0.04)"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="0.8"
          rx="1"
          style={{ transition: 'all 0.1s ease-out' }}
        />
      </svg>
    </div>
  );
}
