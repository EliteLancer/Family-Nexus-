import React, { useMemo } from 'react';
import { Person, LayoutNode } from '../types';

interface TimelineRulerProps {
  nodesArr: LayoutNode[];
  people: Record<string, Person>;
  transform: { x: number; y: number; zoom: number };
  orientation: 'TB' | 'LR';
  containerRef: React.RefObject<HTMLDivElement>;
}

const TimelineRuler = React.memo(function TimelineRuler({
  nodesArr,
  people,
  transform,
  orientation,
  containerRef
}: TimelineRulerProps) {
  // Constants matching layout.ts
  const ROW_GAP = 220;
  const CARD_WIDTH = 220;
  const CARD_HEIGHT = 100;

  // Group nodes by generation
  const generationData = useMemo(() => {
    const gens = Array.from(new Set(nodesArr.map(n => n.generation))).sort((a, b) => a - b);
    
    return gens.map(g => {
      // Find all people in this generation
      const nodesInGen = nodesArr.filter(n => n.generation === g);
      const birthYears: number[] = [];
      
      nodesInGen.forEach(n => {
        const person = people[n.id];
        if (person && person.dob) {
          const year = new Date(person.dob).getFullYear();
          if (!isNaN(year)) birthYears.push(year);
        }
      });

      let eraLabel = '';
      if (birthYears.length > 0) {
        const minYear = Math.min(...birthYears);
        const maxYear = Math.max(...birthYears);
        eraLabel = minYear === maxYear ? `${minYear}` : `${minYear}–${maxYear}`;
      } else {
        // Fallback estimate
        const estStart = 1910 + g * 30;
        eraLabel = `${estStart}s–${estStart + 20}s`;
      }

      // Generation default titles
      let title = '';
      switch (g) {
        case 0: title = 'Pioneers'; break;
        case 1: title = 'Homesteaders'; break;
        case 2: title = 'Expansion Cohort'; break;
        case 3: title = 'Mid-Century'; break;
        case 4: title = 'Contemporary'; break;
        default: title = `Gen ${g + 1}`; break;
      }

      return {
        generation: g,
        title,
        eraLabel,
      };
    });
  }, [nodesArr, people]);

  if (!containerRef.current || nodesArr.length === 0) return null;
  const rect = containerRef.current.getBoundingClientRect();

  if (orientation === 'TB') {
    // Top-to-Bottom: Draw timeline strip along the left side
    return (
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-neutral-950/20 backdrop-blur-[2px] border-r border-neutral-800/40 pointer-events-none z-20 overflow-hidden">
        <div className="absolute left-3 top-3 text-[9px] font-mono font-semibold tracking-wider text-neutral-500 uppercase">
          Timeline
        </div>
        {generationData.map(g => {
          const canvasY = g.generation * ROW_GAP + 100 + CARD_HEIGHT / 2;
          const screenY = transform.y + canvasY * transform.zoom;

          // Hide if off-screen vertically
          if (screenY < 40 || screenY > rect.height - 40) return null;

          return (
            <div
              key={g.generation}
              className="absolute left-0 right-0 flex items-center transition-all duration-300 pl-4"
              style={{ top: `${screenY}px`, transform: 'translateY(-50%)' }}
            >
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-neutral-300 font-sans tracking-tight leading-none">
                  {g.title}
                </div>
                <div className="text-[9px] font-mono text-emerald-400/80 leading-none">
                  {g.eraLabel}
                </div>
              </div>
              <div className="absolute right-0 w-2 h-[1px] bg-neutral-700" />
            </div>
          );
        })}
      </div>
    );
  } else {
    // Left-to-Right: Draw timeline strip along the top side
    return (
      <div className="absolute left-0 top-0 right-0 h-14 bg-neutral-950/20 backdrop-blur-[2px] border-b border-neutral-800/40 pointer-events-none z-20 overflow-hidden">
        <div className="absolute left-3 top-3 text-[9px] font-mono font-semibold tracking-wider text-neutral-500 uppercase">
          Timeline
        </div>
        {generationData.map(g => {
          // In LR layout, coordinate mappings swap (generation represents X direction instead of Y)
          const canvasX = g.generation * ROW_GAP + 100 + CARD_WIDTH / 2;
          const screenX = transform.x + canvasX * transform.zoom;

          // Hide if off-screen horizontally
          if (screenX < 80 || screenX > rect.width - 80) return null;

          return (
            <div
              key={g.generation}
              className="absolute top-0 bottom-0 flex flex-col justify-center items-center transition-all duration-300"
              style={{ left: `${screenX}px`, transform: 'translateX(-50%)' }}
            >
              <div className="text-center space-y-0.5 mt-2">
                <div className="text-[10px] font-bold text-neutral-300 font-sans tracking-tight leading-none">
                  {g.title}
                </div>
                <div className="text-[9px] font-mono text-emerald-400/80 leading-none">
                  {g.eraLabel}
                </div>
              </div>
              <div className="absolute bottom-0 w-[1px] h-2 bg-neutral-700" />
            </div>
          );
        })}
      </div>
    );
  }
});

export default TimelineRuler;
