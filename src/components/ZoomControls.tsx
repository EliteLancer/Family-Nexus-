import React from 'react';
import { Plus, Minus, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitTree: () => void;
}

const ZoomControls = React.memo(function ZoomControls({ zoom, onZoomIn, onZoomOut, onFitTree }: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-24 left-6 z-30 flex flex-col items-center gap-1">
      <div className="bg-[#1D1E21]/80 backdrop-blur-md border border-neutral-800/80 rounded-xl p-1 shadow-xl flex flex-col items-center gap-0.5">
        <button
          onClick={onZoomIn}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-all duration-200 cursor-pointer"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="px-2 py-1">
          <span className="text-[10px] font-mono font-bold text-neutral-400 select-none">
            {zoomPercent}%
          </span>
        </div>

        <button
          onClick={onZoomOut}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-all duration-200 cursor-pointer"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-6 h-[1px] bg-neutral-800 my-0.5" />

        <button
          onClick={onFitTree}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-all duration-200 cursor-pointer"
          title="Fit Tree in View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default ZoomControls;
