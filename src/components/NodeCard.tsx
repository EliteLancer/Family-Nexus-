/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Person } from '../types';
import { playTick } from '../utils/audio';

interface NodeCardProps {
  node: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    generation: number;
    person: Person;
  };
  isSelected: boolean;
  bright: boolean;
  relLabel: string;
  highlightedPath: string[] | null;
  hoveredId: string | null;
  relatedToHovered: Set<string> | null;
  searchFlashNodeId: string | null;
  people: Record<string, Person>;
  zoom: number;
  onSelect: (id: string) => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (id: string) => void;
}

const NodeCard = React.memo(function NodeCard({
  node,
  isSelected,
  bright,
  relLabel,
  highlightedPath,
  hoveredId,
  relatedToHovered,
  searchFlashNodeId,
  people,
  zoom,
  onSelect,
  onHoverStart,
  onHoverEnd,
  isCollapsed = false,
  onToggleCollapse,
}: NodeCardProps) {
  const person = node.person;
  const isFatherBranch = person.gender === 'male';
  const branchColorClass = isFatherBranch
    ? 'border-blue-500/20 shadow-blue-500/5'
    : 'border-emerald-500/20 shadow-emerald-500/5';

  // Compute node opacity & glow
  let nodeOpacity = bright ? 1.0 : 0.2;
  const isTraced = highlightedPath !== null && highlightedPath.includes(node.id);
  const isHoverRelated = relatedToHovered !== null && relatedToHovered.has(node.id);

  if (highlightedPath !== null) {
    nodeOpacity = isTraced ? 1.0 : 0.12;
  }

  if (hoveredId !== null) {
    if (node.id === hoveredId) {
      nodeOpacity = 1.0;
    } else if (isHoverRelated) {
      nodeOpacity = bright ? 0.95 : 0.45;
    } else {
      nodeOpacity = Math.min(nodeOpacity, 0.08);
    }
  }

  // Relationship label relative to hovered
  let relationToHoveredLabel = '';
  if (hoveredId && hoveredId !== node.id) {
    const hPerson = people[hoveredId];
    if (hPerson) {
      if (hPerson.parentIds.includes(node.id)) {
        relationToHoveredLabel = person.gender === 'female' ? 'Mother' : 'Father';
      } else if (hPerson.childIds.includes(node.id)) {
        relationToHoveredLabel = person.gender === 'female' ? 'Daughter' : 'Son';
      } else if (hPerson.spouseIds.includes(node.id)) {
        relationToHoveredLabel = 'Spouse';
      } else if (
        person.parentIds.length > 0 &&
        hPerson.parentIds.some((pid: string) => person.parentIds.includes(pid))
      ) {
        relationToHoveredLabel = person.gender === 'female' ? 'Sister' : 'Brother';
      }
    }
  }

  // Highlight ring classes
  let highlightRingClass = '';
  if (isSelected) {
    highlightRingClass = 'ring-2 ring-amber-400 shadow-amber-400/20 scale-[1.03] z-20';
  } else if (isTraced) {
    highlightRingClass = 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/10 scale-[1.02] border-amber-500/60 z-20';
  } else if (node.id === hoveredId) {
    highlightRingClass = 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/15 scale-[1.01] border-emerald-400/80 z-20';
  } else if (isHoverRelated) {
    if (relationToHoveredLabel === 'Mother' || relationToHoveredLabel === 'Father') {
      highlightRingClass = 'border-blue-400/80 shadow shadow-blue-500/10 ring-1 ring-blue-400/30';
    } else if (relationToHoveredLabel === 'Daughter' || relationToHoveredLabel === 'Son') {
      highlightRingClass = 'border-emerald-400/80 shadow shadow-emerald-500/10 ring-1 ring-emerald-400/30';
    } else if (relationToHoveredLabel === 'Spouse') {
      highlightRingClass = 'border-rose-400/80 shadow shadow-rose-500/10 ring-1 ring-rose-400/30';
    } else {
      highlightRingClass = 'border-amber-400/80 shadow shadow-amber-500/10 ring-1 ring-amber-400/30';
    }
  }

  return (
    <div
      key={node.id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
        playTick();
      }}
      onMouseEnter={() => {
        onHoverStart(node.id);
        if (bright && !isSelected) playTick();
      }}
      onMouseLeave={onHoverEnd}
      className={`absolute bg-white text-neutral-900 rounded-xl shadow-lg border p-3 flex gap-3 cursor-pointer select-none transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${branchColorClass} ${highlightRingClass}`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        opacity: nodeOpacity,
      }}
    >
      {/* Selection halo */}
      {isSelected && (
        <div className="absolute -inset-[3px] rounded-xl border-2 border-amber-500/80 animate-pulse pointer-events-none" />
      )}
      {searchFlashNodeId === node.id && (
        <div className="absolute -inset-4 rounded-xl border-4 border-amber-400 animate-ping opacity-60 pointer-events-none z-50" />
      )}

      {/* Hover relationship pill */}
      {relationToHoveredLabel && (
        <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-md text-[8px] font-mono font-extrabold uppercase tracking-widest bg-neutral-950 border border-neutral-800 text-amber-400 shadow shadow-black/50 z-30 pointer-events-none">
          {relationToHoveredLabel}
        </div>
      )}

      {/* Photo / Avatar */}
      <div className="relative shrink-0">
        <img
          src={person.photo}
          alt={person.name}
          referrerPolicy="no-referrer"
          className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
        />
        {!person.living && (
          <span className="absolute -bottom-1 -right-1 text-[8px] bg-neutral-900 text-neutral-300 font-mono px-1 rounded-sm border border-neutral-800 scale-90">
            RIP
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-900 block truncate leading-tight">
            {person.name}
          </span>
          {zoom >= 0.75 && (
            <span className="text-[10px] text-neutral-500 block truncate mt-0.5 font-light">
              {person.profession || 'Family Lineage'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-[9px] text-neutral-400">
          <span className="font-mono text-neutral-500 font-medium">
            {person.dob ? new Date(person.dob).getFullYear() : 'Birth'} –{' '}
            {person.living
              ? 'Present'
              : person.dod
                ? new Date(person.dod).getFullYear()
                : 'RIP'}
          </span>
          {zoom >= 0.4 && relLabel && (
            <span
              className={`px-1.5 py-0.2 rounded-full font-semibold text-[8px] tracking-wide uppercase ${
                isFatherBranch
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}
            >
              {relLabel}
            </span>
          )}
        </div>
      </div>
      {/* Collapse/Expand Toggle for branches */}
      {person.childIds.length > 0 && onToggleCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(node.id);
          }}
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500 flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-md z-30 cursor-pointer"
          title={isCollapsed ? "Expand branch" : "Collapse branch"}
        >
          {isCollapsed ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
});

export default NodeCard;
