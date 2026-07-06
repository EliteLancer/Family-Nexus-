import React, { useState, useRef, useCallback, useEffect, MouseEvent } from 'react';
import { TreeLayout } from '../types';
import { playTick, playSwoosh } from '../utils/audio';

interface CanvasTransform {
  x: number;
  y: number;
  zoom: number;
}

export function useCanvasTransform(layout: TreeLayout) {
  const [transform, setTransform] = useState<CanvasTransform>({ x: 100, y: 50, zoom: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastWheelTickRef = useRef<number>(0);

  // Touch gesture refs
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDistRef = useRef<number | null>(null);
  const touchVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const lastTouchTimeRef = useRef<number>(0);
  const inertiaFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (inertiaFrameRef.current) {
        cancelAnimationFrame(inertiaFrameRef.current);
      }
    };
  }, []);

  const zoomAtPoint = useCallback((clientX: number, clientY: number, factor: number) => {
    const container = document.getElementById('infinite-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    setTransform(prev => {
      const canvasX = (mouseX - prev.x) / prev.zoom;
      const canvasY = (mouseY - prev.y) / prev.zoom;
      const newZoom = Math.max(0.18, Math.min(2.5, prev.zoom * factor));
      return {
        x: mouseX - canvasX * newZoom,
        y: mouseY - canvasY * newZoom,
        zoom: newZoom,
      };
    });
  }, []);

  const centerOnNode = useCallback((nodeId: string, customZoom?: number) => {
    const node = layout.nodes[nodeId];
    const container = document.getElementById('infinite-canvas-container');
    if (!node || !container) return;

    const rect = container.getBoundingClientRect();
    setTransform(prev => {
      const targetZoom = customZoom || prev.zoom || 0.95;
      const targetX = rect.width / 2 - (node.x + node.width / 2) * targetZoom;
      const targetY = rect.height / 2 - (node.y + node.height / 2) * targetZoom;
      return { x: targetX, y: targetY, zoom: targetZoom };
    });

    setIsAnimating(true);
    playSwoosh();
    setTimeout(() => setIsAnimating(false), 700);
  }, [layout.nodes]);

  const fitTree = useCallback(() => {
    const container = document.getElementById('infinite-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nodesArr = Object.values(layout.nodes);
    if (nodesArr.length === 0) return;

    const xs = nodesArr.map(n => n.x);
    const ys = nodesArr.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) + 220;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) + 100;

    const treeW = maxX - minX;
    const treeH = maxY - minY;
    const padding = 100;
    const scaleX = (rect.width - padding * 2) / treeW;
    const scaleY = (rect.height - padding * 2) / treeH;
    const targetZoom = Math.max(0.18, Math.min(1.2, Math.min(scaleX, scaleY)));

    const midX = minX + treeW / 2;
    const midY = minY + treeH / 2;

    setIsAnimating(true);
    setTransform({
      x: rect.width / 2 - midX * targetZoom,
      y: rect.height / 2 - midY * targetZoom,
      zoom: targetZoom,
    });
    setTimeout(() => setIsAnimating(false), 700);
  }, [layout.nodes]);

  const handleMiniMapPan = useCallback((canvasX: number, canvasY: number) => {
    const container = document.getElementById('infinite-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setIsAnimating(true);
    setTransform(prev => ({
      x: rect.width / 2 - canvasX * prev.zoom,
      y: rect.height / 2 - canvasY * prev.zoom,
      zoom: prev.zoom,
    }));
    setTimeout(() => setIsAnimating(false), 600);
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    const isBgClick = (e.target as HTMLElement).id === 'infinite-canvas-bg' ||
                      (e.target as HTMLElement).id === 'grid-pattern' ||
                      (e.target as HTMLElement).tagName === 'svg';
    if (isSpacePressed || isBgClick) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  }, [isSpacePressed, transform.x, transform.y]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback((e: MouseEvent) => {
    const isBg = (e.target as HTMLElement).id === 'infinite-canvas-bg';
    if (isBg) {
      zoomAtPoint(e.clientX, e.clientY, 1.4);
    }
  }, [zoomAtPoint]);

  // Imperatively attach Wheel and Touch Events globally on document to solve React conditional mounting timing issues
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const container = document.getElementById('infinite-canvas-container');
      if (!container || !container.contains(e.target as Node)) return;

      e.preventDefault();
      const factor = e.ctrlKey ? Math.exp(-e.deltaY * 0.01) : Math.exp(-e.deltaY * 0.0015);
      zoomAtPoint(e.clientX, e.clientY, factor);
      const now = Date.now();
      if (now - lastWheelTickRef.current > 160) {
        playTick();
        lastWheelTickRef.current = now;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      const container = document.getElementById('infinite-canvas-container');
      if (!container || !container.contains(e.target as Node)) return;

      if (inertiaFrameRef.current) {
        cancelAnimationFrame(inertiaFrameRef.current);
        inertiaFrameRef.current = null;
      }
      touchVelocityRef.current = { vx: 0, vy: 0 };

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        lastTouchDistRef.current = null;
        lastTouchTimeRef.current = Date.now();
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        lastTouchDistRef.current = dist;
        lastTouchRef.current = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
        lastTouchTimeRef.current = Date.now();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const container = document.getElementById('infinite-canvas-container');
      if (!container || !container.contains(e.target as Node)) return;

      e.preventDefault();
      const now = Date.now();
      const dt = now - lastTouchTimeRef.current;

      if (e.touches.length === 1 && lastTouchRef.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));

        if (dt > 0) {
          const newVx = dx / dt;
          const newVy = dy / dt;
          touchVelocityRef.current = {
            vx: touchVelocityRef.current.vx * 0.3 + newVx * 0.7,
            vy: touchVelocityRef.current.vy * 0.3 + newVy * 0.7,
          };
        }
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        lastTouchTimeRef.current = now;
      } else if (e.touches.length === 2 && lastTouchDistRef.current && lastTouchRef.current) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const factor = dist / lastTouchDistRef.current;
        zoomAtPoint(midX, midY, factor);
        lastTouchDistRef.current = dist;
        lastTouchRef.current = { x: midX, y: midY };
        lastTouchTimeRef.current = now;
        touchVelocityRef.current = { vx: 0, vy: 0 };
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const container = document.getElementById('infinite-canvas-container');
      if (!container || !container.contains(e.target as Node)) return;

      lastTouchRef.current = null;
      lastTouchDistRef.current = null;
      const timeSinceLastMove = Date.now() - lastTouchTimeRef.current;
      if (timeSinceLastMove < 80) {
        const friction = 0.94;
        let { vx, vy } = touchVelocityRef.current;
        const minSpeed = 0.03;
        const speed = Math.hypot(vx, vy);
        if (speed > minSpeed) {
          let lastFrameTime = performance.now();
          const animateInertia = (time: number) => {
            const deltaFrame = time - lastFrameTime;
            lastFrameTime = time;
            const frameRatio = deltaFrame / 16.67;
            const currentFriction = Math.pow(friction, frameRatio);
            vx *= currentFriction;
            vy *= currentFriction;
            if (Math.hypot(vx, vy) < minSpeed) {
              inertiaFrameRef.current = null;
              return;
            }
            setTransform(prev => ({ ...prev, x: prev.x + vx * deltaFrame, y: prev.y + vy * deltaFrame }));
            inertiaFrameRef.current = requestAnimationFrame(animateInertia);
          };
          inertiaFrameRef.current = requestAnimationFrame(animateInertia);
        }
      }
    };

    const onGestureStart = (e: any) => {
      const container = document.getElementById('infinite-canvas-container');
      if (container && container.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    document.addEventListener('gesturestart', onGestureStart, { passive: false });
    document.addEventListener('gesturechange', onGestureStart, { passive: false });

    return () => {
      document.removeEventListener('wheel', onWheel);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('gesturestart', onGestureStart);
      document.removeEventListener('gesturechange', onGestureStart);
    };
  }, [zoomAtPoint, setTransform]);

  const zoomIn = useCallback(() => {
    const container = document.getElementById('infinite-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomAtPoint(rect.width / 2 + rect.left, rect.height / 2 + rect.top, 1.15);
    playTick();
  }, [zoomAtPoint]);

  const zoomOut = useCallback(() => {
    const container = document.getElementById('infinite-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomAtPoint(rect.width / 2 + rect.left, rect.height / 2 + rect.top, 1 / 1.15);
    playTick();
  }, [zoomAtPoint]);

  return {
    transform, setTransform,
    isDragging, isAnimating,
    isSpacePressed, setIsSpacePressed,
    containerRef,
    centerOnNode, fitTree, zoomAtPoint, zoomIn, zoomOut,
    handleMouseDown, handleMouseMove, handleMouseUp, handleDoubleClick,
    handleMiniMapPan,
  };
}
