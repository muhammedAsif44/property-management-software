'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, Trash2, Maximize2 } from 'lucide-react';

export interface DriftWallItem {
  id: string;
  image: string;
  title?: string;
  href?: string;
  alt?: string;
}

export interface DriftWallProps {
  items: DriftWallItem[];
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  speed?: number;
  direction?: 'up' | 'down' | 'alternate';
  parallax?: boolean;
  pauseOnHover?: boolean;
  lift?: boolean;
  fade?: boolean;
  dim?: boolean;
  grayscale?: boolean;
  overlayColor?: string;
  theme?: 'dark' | 'light';
  className?: string;
  onItemClick?: (item: DriftWallItem) => void;
  onItemDelete?: (item: DriftWallItem) => void;
}

export function DriftWall({
  items,
  columns = 5,
  tileWidth = 210,
  tileHeight = 140,
  gap = 18,
  radius = 16,
  speed = 1,
  direction = 'alternate',
  parallax = true,
  pauseOnHover = true,
  lift = true,
  fade = false,
  dim = true,
  grayscale = false,
  overlayColor,
  theme = 'dark',
  className = '',
  onItemClick,
  onItemDelete,
}: DriftWallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const isDark = theme === 'dark';

  // Reduced motion preference check
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  // Track pointer for 3D perspective wall tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!parallax || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  // Staggered infinite masonry data generator - 100% box fill with zero blank gaps
  const columnData = useMemo(() => {
    if (!items || items.length === 0) return [];

    const cols: DriftWallItem[][] = [];

    for (let c = 0; c < columns; c++) {
      const offsetIndex = c % items.length;
      const staggeredList = [...items.slice(offsetIndex), ...items.slice(0, offsetIndex)];

      let fullColumn: DriftWallItem[] = [];
      while (fullColumn.length < 12) {
        fullColumn = [...fullColumn, ...staggeredList];
      }
      cols.push(fullColumn);
    }

    return cols;
  }, [items, columns]);

  if (!items || items.length === 0) return null;

  // Exact 3D Wall Perspective transform
  const baseRotateX = 12;
  const baseRotateY = -6;
  const baseRotateZ = 1.5;

  const currentRotateX = parallax && isHovered && !prefersReducedMotion
    ? baseRotateX + mousePos.y * -12
    : baseRotateX;
  const currentRotateY = parallax && isHovered && !prefersReducedMotion
    ? baseRotateY + mousePos.x * 12
    : baseRotateY;

  const wallTransform = prefersReducedMotion
    ? 'none'
    : `rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg) rotateZ(${baseRotateZ}deg) scale(1.15)`;

  const resolvedOverlayColor = overlayColor || (isDark ? 'rgba(9, 16, 13, 0.35)' : 'transparent');

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
      className={`relative w-full h-[540px] overflow-hidden rounded-3xl transition-colors duration-300 ${
        isDark
          ? 'bg-[#09100d] border border-[#1d3329] shadow-2xl'
          : 'bg-[#F8FAFC] dark:bg-[#09100d] border border-slate-200/90 dark:border-[#1d3329] shadow-sm'
      } ${className}`}
      style={{ perspective: '1200px' }}
    >
      {/* Dark/Light Ambient Overlay Tint */}
      {resolvedOverlayColor && resolvedOverlayColor !== 'transparent' && (
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-3xl transition-opacity duration-300"
          style={{ backgroundColor: resolvedOverlayColor }}
        />
      )}

      {/* 4-Edge Seamless Vignette Shadows matching PMS dark brand theme */}
      <div
        className={`absolute top-0 inset-x-0 h-24 z-20 pointer-events-none rounded-t-3xl transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-b from-[#09100d] via-[#09100d]/75 to-transparent'
            : 'bg-gradient-to-b from-[#F8FAFC] dark:from-[#09100d] via-[#F8FAFC]/75 dark:via-[#09100d]/75 to-transparent'
        }`}
      />
      <div
        className={`absolute bottom-0 inset-x-0 h-24 z-20 pointer-events-none rounded-b-3xl transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-t from-[#09100d] via-[#09100d]/75 to-transparent'
            : 'bg-gradient-to-t from-[#F8FAFC] dark:from-[#09100d] via-[#F8FAFC]/75 dark:via-[#09100d]/75 to-transparent'
        }`}
      />
      <div
        className={`absolute inset-y-0 left-0 w-24 z-20 pointer-events-none rounded-l-3xl transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-r from-[#09100d] via-[#09100d]/75 to-transparent'
            : 'bg-gradient-to-r from-[#F8FAFC] dark:from-[#09100d] via-[#F8FAFC]/75 dark:via-[#09100d]/75 to-transparent'
        }`}
      />
      <div
        className={`absolute inset-y-0 right-0 w-24 z-20 pointer-events-none rounded-r-3xl transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-l from-[#09100d] via-[#09100d]/75 to-transparent'
            : 'bg-gradient-to-l from-[#F8FAFC] dark:from-[#09100d] via-[#F8FAFC]/75 dark:via-[#09100d]/75 to-transparent'
        }`}
      />

      {/* 3D Perspective Wall Canvas */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: wallTransform,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="flex justify-center items-center w-full"
          style={{ gap: `${gap}px` }}
        >
          {columnData.map((colItems, colIdx) => {
            const isUp = direction === 'up' || (direction === 'alternate' && colIdx % 2 === 0);
            const animDuration = Math.max(22, 60 / Math.max(0.2, speed));
            const shouldPause = pauseOnHover && isHovered;

            return (
              <div
                key={`col-${colIdx}`}
                className="flex flex-col shrink-0 flex-1 max-w-[280px] overflow-hidden"
                style={{
                  gap: `${gap}px`,
                }}
              >
                <div
                  className={`flex flex-col transition-all duration-300 ${
                    prefersReducedMotion ? '' : isUp ? 'animate-[#driftUp]' : 'animate-[#driftDown]'
                  }`}
                  style={{
                    gap: `${gap}px`,
                    animation: prefersReducedMotion
                      ? 'none'
                      : `${isUp ? 'driftUp' : 'driftDown'} ${animDuration}s linear infinite`,
                    animationPlayState: shouldPause ? 'paused' : 'running',
                  }}
                >
                  {colItems.map((item, itemIdx) => (
                    <div
                      key={`tile-${colIdx}-${itemIdx}-${item.id}`}
                      className={`group relative overflow-hidden cursor-pointer transition-all duration-300 ${
                        isDark
                          ? 'bg-[#121f1a] border border-[#1d3329] shadow-md'
                          : 'bg-white dark:bg-[#121f1a] border border-slate-200/90 dark:border-[#1d3329] shadow-xs'
                      } ${
                        lift ? 'hover:-translate-y-2 hover:scale-[1.05] hover:shadow-2xl hover:z-30 hover:border-emerald-700/80' : ''
                      } ${grayscale ? 'grayscale hover:grayscale-0' : ''}`}
                      style={{
                        width: '100%',
                        height: `${tileHeight}px`,
                        borderRadius: `${radius}px`,
                      }}
                      onClick={() => onItemClick?.(item)}
                    >
                      <img
                        src={item.image}
                        alt={item.title || item.alt || 'Property Photo'}
                        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                          isDark && dim
                            ? 'brightness-75 group-hover:brightness-105'
                            : 'group-hover:brightness-100'
                        }`}
                        loading="lazy"
                      />

                      {/* Action Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080c0a]/90 via-[#080c0a]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-20">
                        {/* Delete action top right */}
                        <div className="flex justify-end">
                          {onItemDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onItemDelete(item);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-md bg-rose-600/90 text-white hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Title & Maximize bottom */}
                        <div className="flex items-end justify-between gap-2">
                          <p className="text-white text-xs font-bold truncate drop-shadow-xs">
                            {item.title || 'Property Photo'}
                          </p>
                          <div className="p-1 rounded-md bg-white/20 text-white backdrop-blur-xs shrink-0">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes driftUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes driftDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
