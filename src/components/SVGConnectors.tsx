/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Person, LayoutNode, LayoutLink } from '../types';

interface SVGConnectorsProps {
  links: LayoutLink[];
  people: Record<string, Person>;
  selectedId: string | null;
  hoveredId: string | null;
  highlightedPath: string[] | null;
  filterHighlightedIds: Set<string> | null;
  statHighlightedIds: Set<string> | null;
  isHighContrastLight: boolean;
  isFocused: (nodeId: string) => boolean;
  minNodeX: number;
  maxGen: number;
  orientation?: 'TB' | 'LR';
}

const SVGConnectors = React.memo(function SVGConnectors({
  links,
  people,
  selectedId,
  hoveredId,
  highlightedPath,
  filterHighlightedIds,
  statHighlightedIds,
  isHighContrastLight,
  isFocused,
  minNodeX,
  maxGen,
  orientation = 'TB',
}: SVGConnectorsProps) {
  return (
    <svg
      className="absolute pointer-events-none overflow-visible"
      style={{ width: '1px', height: '1px' }}
    >
      {/* Relationship Connector Lines */}
      {links.map((link) => {
        const isBright =
          !selectedId || (isFocused(link.fromId) && isFocused(link.toId));
        const isDirectConnection =
          selectedId &&
          (link.fromId === selectedId || link.toId === selectedId);
        const isLineagePath =
          filterHighlightedIds !== null &&
          filterHighlightedIds.has(link.fromId) &&
          filterHighlightedIds.has(link.toId);

        const isTracedLink =
          highlightedPath !== null &&
          highlightedPath.includes(link.fromId) &&
          highlightedPath.includes(link.toId) &&
          Math.abs(
            highlightedPath.indexOf(link.fromId) -
              highlightedPath.indexOf(link.toId)
          ) === 1;

        const isHoverDirectLink =
          hoveredId !== null &&
          (link.fromId === hoveredId || link.toId === hoveredId);

        const shouldAnimateFlow =
          (isDirectConnection && isBright) ||
          isLineagePath ||
          isTracedLink ||
          isHoverDirectLink;

        const fromX = link.from.x;
        const fromY = link.from.y;
        const toX = link.to.x;
        const toY = link.to.y;
        let pathStr = '';
        if (orientation === 'LR') {
          const midX = fromX + (toX - fromX) * 0.45;
          pathStr = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
        } else {
          const midY = fromY + (toY - fromY) * 0.45;
          pathStr = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
        }

        let strokeColor = isHighContrastLight
          ? 'rgba(0,0,0,0.22)'
          : 'rgba(255,255,255,0.08)';
        let linkOpacity = 1.0;

        if (statHighlightedIds !== null) {
          const isBothInGroup =
            statHighlightedIds.has(link.fromId) &&
            statHighlightedIds.has(link.toId);
          linkOpacity = isBothInGroup ? 1.0 : 0.03;
        } else if (highlightedPath !== null) {
          linkOpacity = isTracedLink ? 1.0 : 0.03;
        } else if (hoveredId !== null) {
          linkOpacity = isHoverDirectLink ? 1.0 : 0.03;
        }

        if (linkOpacity > 0.05) {
          if (link.type === 'marriage') {
            if (isHoverDirectLink) {
              strokeColor = 'rgba(244, 63, 94, 0.75)';
            } else {
              strokeColor = isBright
                ? isHighContrastLight
                  ? 'rgba(180, 83, 9, 0.85)'
                  : 'rgba(245, 158, 11, 0.45)'
                : isHighContrastLight
                  ? 'rgba(180, 83, 9, 0.35)'
                  : 'rgba(245, 158, 11, 0.1)';
            }
          } else if (link.type === 'parent-child') {
            if (isHoverDirectLink) {
              const parentNode = people[link.fromId];
              const isMother = parentNode?.gender === 'female';
              strokeColor = isMother
                ? 'rgba(16, 185, 129, 0.75)'
                : 'rgba(59, 130, 246, 0.75)';
            } else {
              strokeColor = isBright
                ? isHighContrastLight
                  ? 'rgba(0,0,0,0.65)'
                  : 'rgba(255,255,255,0.3)'
                : isHighContrastLight
                  ? 'rgba(0,0,0,0.15)'
                  : 'rgba(255,255,255,0.05)';
            }
          }
        }

        return (
          <g
            key={link.id}
            style={{ opacity: linkOpacity, transition: 'all 0.3s ease' }}
          >
            <path
              d={pathStr}
              fill="none"
              stroke={strokeColor}
              strokeWidth={link.type === 'marriage' ? '2' : '1.5'}
              strokeDasharray={link.type === 'marriage' ? '4 2' : 'none'}
              className="transition-opacity duration-300"
            />
            {shouldAnimateFlow && (
              <path
                d={pathStr}
                fill="none"
                stroke={
                  isTracedLink
                    ? '#F59E0B'
                    : isHoverDirectLink
                      ? link.type === 'marriage'
                        ? '#F43F5E'
                        : '#10B981'
                      : link.type === 'marriage'
                        ? '#F59E0B'
                        : '#10B981'
                }
                strokeWidth={
                  isTracedLink
                    ? '3.5'
                    : isHoverDirectLink
                      ? '2.5'
                      : link.type === 'marriage'
                        ? '2.5'
                        : '2'
                }
                className="animate-flow opacity-75"
                style={{
                  filter: isTracedLink
                    ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))'
                    : isHoverDirectLink
                      ? link.type === 'marriage'
                        ? 'drop-shadow(0 0 4px rgba(244, 63, 94, 0.6))'
                        : 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))'
                      : link.type === 'marriage'
                        ? 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.4))'
                        : 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.4))',
                }}
              />
            )}
            {linkOpacity > 0.1 && link.type === 'parent-child' && (
              <circle
                r={isTracedLink ? '3.5' : '2.5'}
                fill={
                  isTracedLink
                    ? '#F59E0B'
                    : isHoverDirectLink
                      ? '#10B981'
                      : isHighContrastLight
                        ? 'rgba(0,0,0,0.65)'
                        : 'rgba(255,255,255,0.45)'
                }
                style={{
                  filter: isTracedLink
                    ? 'drop-shadow(0 0 3px #F59E0B)'
                    : isHoverDirectLink
                      ? 'drop-shadow(0 0 3px #10B981)'
                      : 'none',
                }}
              >
                <animateMotion
                  dur={isTracedLink ? '1.8s' : '2.8s'}
                  repeatCount="indefinite"
                  path={pathStr}
                />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
});

export default SVGConnectors;
