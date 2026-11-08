import React, { useEffect, useRef, useState } from 'react';

interface GeofenceMapProps {
  latitude: number | null;
  longitude: number | null;
  onPick: (latitude: number, longitude: number) => void;
}

const TILE_SIZE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const DEFAULT_CENTER = { latitude: 30.0444, longitude: 31.2357 };
const MAX_MERCATOR_LATITUDE = 85.05112878;

function hasValidPoint(latitude: number | null, longitude: number | null): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

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

/**
 * Lightweight interactive OpenStreetMap picker for the IT Administrator
 * geofencing settings. It uses no third-party map library and never exposes
 * company coordinates to employee-facing views.
 */
export function GeofenceMap({ latitude, longitude, onPick }: GeofenceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState(() => ({
    latitude: hasValidPoint(latitude, longitude) ? (latitude as number) : DEFAULT_CENTER.latitude,
    longitude: hasValidPoint(latitude, longitude) ? (longitude as number) : DEFAULT_CENTER.longitude,
    zoom: hasValidPoint(latitude, longitude) ? 16 : 12,
  }));

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

  // Re-center, and zoom in, when an address search selects a new point.
  useEffect(() => {
    if (!hasValidPoint(latitude, longitude)) return;
    setView(prev => ({
      latitude: latitude as number,
      longitude: longitude as number,
      zoom: Math.max(prev.zoom, 16),
    }));
  }, [latitude, longitude]);

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

  const pickedPoint = hasValidPoint(latitude, longitude)
    ? project(latitude as number, longitude as number, view.zoom)
    : null;
  const markerLeft = pickedPoint ? pickedPoint.x - centerWorld.x + size.width / 2 : null;
  const markerTop = pickedPoint ? pickedPoint.y - centerWorld.y + size.height / 2 : null;

  const pickAtPoint = (clientX: number, clientY: number) => {
    const element = containerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const worldX = centerWorld.x + (clientX - rect.left - rect.width / 2);
    const worldY = centerWorld.y + (clientY - rect.top - rect.height / 2);
    const next = unproject(worldX, worldY, view.zoom);
    onPick(Number(next.latitude.toFixed(6)), Number(next.longitude.toFixed(6)));
  };

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
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.moved = true;
    }
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
    const wasMoved = drag.moved;
    dragRef.current = null;
    if (!wasMoved) {
      pickAtPoint(event.clientX, event.clientY);
    }
  };

  const zoomBy = (delta: number) => {
    setView(prev => ({ ...prev, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom + delta)) }));
  };

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-2xl border border-slate-200 overflow-hidden bg-slate-200 select-none">
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair touch-none"
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
            style={{
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
          />
        ))}

        {markerLeft !== null && markerTop !== null && (
          <div
            className="absolute pointer-events-none"
            style={{ left: markerLeft, top: markerTop, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-5 h-5 rounded-full bg-cyan-600 border-[3px] border-white shadow-lg" />
            <div className="absolute inset-0 w-5 h-5 rounded-full bg-cyan-500/40 animate-ping" />
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => zoomBy(1)}
          className="w-8 h-8 rounded-lg bg-white/95 border border-slate-200 text-slate-800 text-lg font-bold leading-none shadow-sm cursor-pointer hover:bg-white"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(-1)}
          className="w-8 h-8 rounded-lg bg-white/95 border border-slate-200 text-slate-800 text-lg font-bold leading-none shadow-sm cursor-pointer hover:bg-white"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      <div className="absolute bottom-0 right-0 px-2 py-1 text-[10px] text-slate-700 bg-white/85 rounded-tl-md">
        ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          OpenStreetMap
        </a>{' '}
        contributors
      </div>
    </div>
  );
}
