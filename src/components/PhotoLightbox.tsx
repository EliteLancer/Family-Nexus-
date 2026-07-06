import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface PhotoLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const PhotoLightbox = React.memo(function PhotoLightbox({ images, initialIndex, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageZoom, setImageZoom] = useState(1);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
    setImageZoom(1);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    setImageZoom(1);
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setImageZoom(prev => Math.min(prev * 1.3, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageZoom(prev => Math.max(prev / 1.3, 0.5));
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-neutral-900/80 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-white transition-all cursor-pointer border border-neutral-700/50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 z-10 p-3 bg-neutral-900/80 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-white transition-all cursor-pointer border border-neutral-700/50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 z-10 p-3 bg-neutral-900/80 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-white transition-all cursor-pointer border border-neutral-700/50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image */}
        <img
          src={images[currentIndex]}
          alt={`Photo ${currentIndex + 1} of ${images.length}`}
          referrerPolicy="no-referrer"
          className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
          style={{ transform: `scale(${imageZoom})` }}
        />

        {/* Bottom controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-neutral-900/80 backdrop-blur-md border border-neutral-700/50 rounded-full px-4 py-2">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-neutral-400 min-w-[40px] text-center">
            {Math.round(imageZoom * 100)}%
          </span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <ZoomIn className="w-4 h-4" />
          </button>
          {images.length > 1 && (
            <>
              <div className="w-[1px] h-4 bg-neutral-700" />
              <span className="text-[10px] font-mono text-neutral-400">
                {currentIndex + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
});

export default PhotoLightbox;
