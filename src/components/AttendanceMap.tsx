import React, { useEffect, useRef, useState } from 'react';

export interface AttendanceMapPoint {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  detail?: string;
  tone?: 'allowed' | 'blocked' | 'neutral';
  employeeId?: string;
  action?: string;
  time?: string;
  result?: string;
  distanceMeters?: number | null;
  accuracyMeters?: number | null;
  deviceLabel?: string;
  fingerprint?: string;
  qrVerified?: boolean | null;
  qrRequired?: boolean;
  qrMonth?: string;
}

interface AttendanceMapProps {
  points: AttendanceMapPoint[];
  center?: { latitude: number; longitude: number } | null;
  radiusMeters?: number | null;
  onSelect?: (id: string) => void;
}

const TILE_SIZE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const DEFAULT_CENTER = { latitude: 30.0444, longitude: 31.2357 };
const MAX_MERCATOR_LATITUDE = 85.05112878;

function clampLatitude(latitude: number): number {
  return Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
}

function normalizeLongitude(longitude: number): number {
  let value = longitude;
  while (value < -180) value += 360;
  while (value > 180) value -= 360;
  return value;
}

function project(latitude: number, longitude: number, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lat = clampLatitude(latitude) * (Math.PI / 180);
  const sinLat = Math.sin(lat);
  return {
    x: ((normalizeLongitude(longitude) + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function unproject(x: number, y: number, zoom: number): { latitude: number; longitude: number } {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude: clampLatitude(latitude), longitude: normalizeLongitude(longitude) };
}

const TONE_STYLES: Record<string, string> = {
  allowed: 'bg-emerald-500 border-white',
  blocked: 'bg-rose-500 border-white',
  neutral: 'bg-cyan-600 border-white',
};

export function AttendanceMap({ points, center, radiusMeters, onSelect }: AttendanceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const initial = center || (points[0] ? { latitude: points[0].latitude, longitude: points[0].longitude } : DEFAULT_CENTER);
  const [view, setView] = useState({
    latitude: initial.latitude,
    longitude: initial.longitude,
    zoom: points.length || center ? 16 : 12,
  });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startCenter: { latitude: number; longitude: number };
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: Math.max(0, Math.round(rect.width)), height: Math.max(0, Math.round(rect.height)) });
    };
    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (center) {
      setView(prev => ({ ...prev, latitude: center.latitude, longitude: center.longitude }));
    }
  }, [center?.latitude, center?.longitude]);

  const centerWorld = project(view.latitude, view.longitude, view.zoom);
  const tileCount = Math.pow(2, view.zoom);
  const startX = Math.floor((centerWorld.x - size.width / 2) / TILE_SIZE);
  const endX = Math.floor((centerWorld.x + size.width / 2) / TILE_SIZE);
  const startY = Math.max(0, Math.floor((centerWorld.y - size.height / 2) / TILE_SIZE));
  const endY = Math.min(tileCount - 1, Math.floor((centerWorld.y + size.height / 2) / TILE_SIZE));

  const tiles: Array<{ key: string; x: number; y: number; left: number; top: number }> = [];
  if (size.width > 0 && size.height > 0) {
    for (let tileY = startY; tileY <= endY; tileY += 1) {
      for (let tileX = startX; tileX <= endX; tileX += 1) {
        const normalizedX = ((tileX % tileCount) + tileCount) % tileCount;
        tiles.push({
          key: `${view.zoom}-${tileX}-${tileY}`,
          x: normalizedX,
          y: tileY,
          left: tileX * TILE_SIZE - centerWorld.x + size.width / 2,
          top: tileY * TILE_SIZE - centerWorld.y + size.height / 2,
        });
      }
    }
  }

  const centerPoint = center ? project(center.latitude, center.longitude, view.zoom) : null;
  const centerLeft = centerPoint ? centerPoint.x - centerWorld.x + size.width / 2 : null;
  const centerTop = centerPoint ? centerPoint.y - centerWorld.y + size.height / 2 : null;

  const metersPerPixel =
    (156543.03392 * Math.cos((view.latitude * Math.PI) / 180)) / Math.pow(2, view.zoom);
  const circleRadiusPx = center && radiusMeters && radiusMeters > 0
    ? Math.max(8, radiusMeters / Math.max(metersPerPixel, 0.0001))
    : null;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCenter: { latitude: view.latitude, longitude: view.longitude },
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) drag.moved = true;
    if (!drag.moved) return;
    const startWorld = project(drag.startCenter.latitude, drag.startCenter.longitude, view.zoom);
    const next = unproject(startWorld.x - deltaX, startWorld.y - deltaY, view.zoom);
    setView(prev => ({ ...prev, latitude: next.latitude, longitude: next.longitude }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    try {
      (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
    } catch {}
    dragRef.current = null;
  };

  const zoomBy = (delta: number) => {
    setView(prev => ({ ...prev, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom + delta)) }));
  };

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl border border-slate-200 overflow-hidden bg-slate-200 select-none">
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { dragRef.current = null; }}
      >
        {tiles.map(tile => (
          <img
            key={tile.key}
            src={`https://tile.openstreetmap.org/${view.zoom}/${tile.x}/${tile.y}.png`}
            alt=""
            draggable={false}
            className="absolute pointer-events-none"
            style={{ left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}
          />
        ))}

        {circleRadiusPx !== null && centerLeft !== null && centerTop !== null && (
          <div
            className="absolute rounded-full border-2 border-cyan-600/70 bg-cyan-500/15 pointer-events-none"
            style={{
              left: centerLeft - circleRadiusPx,
              top: centerTop - circleRadiusPx,
              width: circleRadiusPx * 2,
              height: circleRadiusPx * 2,
            }}
          />
        )}

        {points.map(point => {
          const world = project(point.latitude, point.longitude, view.zoom);
          const left = world.x - centerWorld.x + size.width / 2;
          const top = world.y - centerWorld.y + size.height / 2;
          if (left < -40 || top < -40 || left > size.width + 40 || top > size.height + 40) return null;
          return (
            <button
              key={point.id}
              type="button"
              onClick={() => onSelect?.(point.id)}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
              style={{ left, top }}
              title={`${point.label}${point.detail ? ` — ${point.detail}` : ''}${point.result ? ` — ${point.result}` : ''}`}
            >
              <span className={`block w-4 h-4 rounded-full border-[3px] shadow-lg ${TONE_STYLES[point.tone || 'neutral']}`} />
              <span className="hidden group-hover:block absolute start-1/2 -translate-x-1/2 top-5 whitespace-nowrap rounded-lg bg-slate-900 text-white text-[10px] font-bold px-2 py-1 shadow-lg">
                {point.label}
                {point.result ? <span className="block text-[9px] font-mono text-cyan-300">{point.result}</span> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="absolute top-3 end-3 flex flex-col gap-1 z-20">
        <button
          type="button"
          onClick={() => zoomBy(1)}
          className="w-8 h-8 rounded-lg bg-white/95 border border-slate-200 text-slate-800 text-lg font-bold leading-none shadow-sm hover:bg-white"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(-1)}
          className="w-8 h-8 rounded-lg bg-white/95 border border-slate-200 text-slate-800 text-lg font-bold leading-none shadow-sm hover:bg-white"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      <div className="absolute bottom-0 end-0 px-2 py-1 text-[10px] text-slate-700 bg-white/85 rounded-tl-md z-20">
        ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
          OpenStreetMap
        </a>{' '}
        contributors
      </div>
    </div>
  );
}

export default AttendanceMap;
