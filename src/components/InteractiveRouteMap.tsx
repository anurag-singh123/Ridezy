import React, { useState } from 'react';
import { Compass, LocateFixed, MapPin, Navigation, Plus, Minus, RotateCcw } from 'lucide-react';
import { BENGALURU_LOCATIONS } from '../services/providerAdapters';
import { GeoPoint } from '../types/ridezy';

interface InteractiveRouteMapProps {
  pickup: GeoPoint | null;
  destination: GeoPoint | null;
  distanceKm: number;
  durationMinutes: number;
  onSelectPickupFromMap: (point: GeoPoint) => void;
  onSelectDestinationFromMap: (point: GeoPoint) => void;
  activeStatusLabel?: string;
}

// Convert Bengaluru lat/lng range into normalized 0..100 SVG coordinates
function projectToCanvas(lat: number, lng: number): { x: number; y: number } {
  const minLat = 12.89;
  const maxLat = 13.22;
  const minLng = 77.54;
  const maxLng = 77.76;

  const clampedLat = Math.max(minLat, Math.min(maxLat, lat));
  const clampedLng = Math.max(minLng, Math.min(maxLng, lng));

  const x = 12 + ((clampedLng - minLng) / (maxLng - minLng)) * 76;
  const y = 86 - ((clampedLat - minLat) / (maxLat - minLat)) * 72;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  pickup,
  destination,
  distanceKm,
  durationMinutes,
  onSelectPickupFromMap,
  onSelectDestinationFromMap,
  activeStatusLabel,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pinMode, setPinMode] = useState<'pickup' | 'destination'>('destination');
  const [nudgeOffsetMeters, setNudgeOffsetMeters] = useState<number>(0);

  const pCoord = pickup ? projectToCanvas(pickup.latitude, pickup.longitude) : { x: 42, y: 62 };
  const dCoord = destination ? projectToCanvas(destination.latitude, destination.longitude) : { x: 68, y: 34 };

  const midX = (pCoord.x + dCoord.x) / 2;
  const midY = Math.min(pCoord.y, dCoord.y) - 12;

  const handleAdjustPickupGate = () => {
    if (!pickup) return;
    const nextOffset = nudgeOffsetMeters === 0 ? 50 : nudgeOffsetMeters === 50 ? 120 : 0;
    setNudgeOffsetMeters(nextOffset);
    const gateSuffix = nextOffset === 0 ? '' : ` (Main Gate +${nextOffset}m)`;
    const baseLabel = pickup.label.replace(/\s*\(Main Gate \+\d+m\)$/, '');
    onSelectPickupFromMap({
      ...pickup,
      label: `${baseLabel}${gateSuffix}`,
      latitude: pickup.latitude + (nextOffset === 0 ? 0 : 0.0004),
    });
  };

  return (
    <div
      className="relative h-full flex flex-col justify-between rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs"
      data-testid="interactive-route-map"
    >
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-[#FAFAFF]">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Compass className="w-4 h-4 text-[#6C4DFF] shrink-0" />
          <span className="font-semibold text-[#181A2F]">Interactive Route Canvas</span>
          <span aria-hidden="true">·</span>
          <span>Fallback Map Panel (Bengaluru Metro Grid)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setPinMode('pickup')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                pinMode === 'pickup'
                  ? 'bg-[#6C4DFF] text-white'
                  : 'text-slate-600 hover:text-[#181A2F]'
              }`}
            >
              Tap sets Pickup
            </button>
            <button
              type="button"
              onClick={() => setPinMode('destination')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                pinMode === 'destination'
                  ? 'bg-[#FF6B6B] text-white'
                  : 'text-slate-600 hover:text-[#181A2F]'
              }`}
            >
              Tap sets Drop
            </button>
          </div>
        </div>
      </div>

      {/* SVG Map Surface */}
      <div className="relative flex-1 min-h-[280px] sm:min-h-[360px] w-full bg-[#F4F5FB] overflow-hidden select-none">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: '50% 50%' }}
        >
          {/* Subtle urban grid & ring roads */}
          <defs>
            <pattern id="cityGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E2E5F3" strokeWidth="0.35" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#cityGrid)" />

          {/* Ulsoor / Bellandur Lake water bodies */}
          <ellipse cx="64" cy="74" rx="9" ry="4.5" fill="#DBEAFE" />
          <ellipse cx="48" cy="56" rx="5" ry="3" fill="#DBEAFE" />
          {/* Cubbon Park green zone */}
          <rect x="28" y="54" width="11" height="8" rx="3" fill="#DCFCE7" />

          {/* Arterial corridors (Outer Ring Road, Airport Expressway, Old Airport Rd) */}
          <path
            d="M 10 72 Q 48 64 88 70"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1.4"
          />
          <path
            d="M 38 92 Q 52 50 66 8"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1.6"
          />
          <path
            d="M 18 46 Q 55 56 84 42"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1.1"
          />

          {/* Active Route Curve between Pickup and Destination */}
          {pickup && destination && (
            <>
              <path
                d={`M ${pCoord.x} ${pCoord.y} Q ${midX} ${midY} ${dCoord.x} ${dCoord.y}`}
                fill="none"
                stroke="#6C4DFF"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d={`M ${pCoord.x} ${pCoord.y} Q ${midX} ${midY} ${dCoord.x} ${dCoord.y}`}
                fill="none"
                stroke="#B8F34A"
                strokeWidth="0.9"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Interactive City Nodes */}
          {BENGALURU_LOCATIONS.map((loc) => {
            const pt = projectToCanvas(loc.latitude, loc.longitude);
            const isPickup = pickup?.id === loc.id;
            const isDest = destination?.id === loc.id;

            return (
              <g
                key={loc.id}
                onClick={() => {
                  if (pinMode === 'pickup') {
                    onSelectPickupFromMap(loc);
                  } else {
                    onSelectDestinationFromMap(loc);
                  }
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isPickup || isDest ? 3.2 : 1.9}
                  fill={isPickup ? '#6C4DFF' : isDest ? '#FF6B6B' : '#94A3B8'}
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                />
                <text
                  x={pt.x}
                  y={pt.y + 4.8}
                  textAnchor="middle"
                  fontSize="2.7"
                  fontWeight={isPickup || isDest ? '700' : '500'}
                  fill={isPickup ? '#6C4DFF' : isDest ? '#D9383A' : '#475569'}
                >
                  {loc.area}
                </text>
              </g>
            );
          })}

          {/* Pickup Marker Pin */}
          {pickup && (
            <g transform={`translate(${pCoord.x}, ${pCoord.y})`}>
              <circle r="4.5" fill="#6C4DFF" fillOpacity="0.18" />
              <circle r="2.6" fill="#6C4DFF" stroke="#FFFFFF" strokeWidth="1" />
            </g>
          )}

          {/* Destination Marker Pin */}
          {destination && (
            <g transform={`translate(${dCoord.x}, ${dCoord.y})`}>
              <circle r="4.5" fill="#FF6B6B" fillOpacity="0.2" />
              <circle r="2.6" fill="#FF6B6B" stroke="#FFFFFF" strokeWidth="1" />
            </g>
          )}
        </svg>

        {/* Floating Route Distance & ETA Overlay */}
        <div className="absolute top-3 left-3 right-14 flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#181A2F]/90 backdrop-blur-md text-white text-xs shadow-sm">
            <Navigation className="w-3.5 h-3.5 text-[#B8F34A] shrink-0" />
            <span className="font-mono font-semibold tabular-nums">{distanceKm.toFixed(1)} km</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="font-mono font-semibold tabular-nums">~{durationMinutes} min</span>
            {activeStatusLabel && (
              <>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="text-[#B8F34A] font-medium">{activeStatusLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Map Zoom & Reset Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label="Zoom in map"
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.2).toFixed(1))))}
            className="w-9 h-9 rounded-xl bg-white/95 border border-slate-200 text-[#181A2F] hover:bg-slate-50 flex items-center justify-center shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out map"
            onClick={() => setZoom((z) => Math.max(1.0, Number((z - 0.2).toFixed(1))))}
            className="w-9 h-9 rounded-xl bg-white/95 border border-slate-200 text-[#181A2F] hover:bg-slate-50 flex items-center justify-center shadow-sm cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Reset map zoom"
            onClick={() => setZoom(1)}
            className="w-9 h-9 rounded-xl bg-white/95 border border-slate-200 text-[#181A2F] hover:bg-slate-50 flex items-center justify-center shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Pickup Pin Adjustment Strip */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-[#6C4DFF] shrink-0" />
            <span className="text-slate-600 truncate">
              Pickup pin: <strong className="text-[#181A2F]">{pickup?.label || 'Not selected'}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleAdjustPickupGate}
            disabled={!pickup}
            className="inline-flex items-center gap-1 text-[#6C4DFF] hover:text-[#5234e0] font-semibold cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            Adjust Pickup Pin
          </button>
        </div>
      </div>

      {/* Transparency Footer — Never fabricate live traffic or real driver GPS */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>
          Route geometry &amp; road distance computed via Haversine urban corridor factor (1.34×).
        </span>
        <span>
          Live traffic &amp; driver telemetry disabled in Demo Mode (requires configured Google Maps &amp; Fleet APIs).
        </span>
      </div>
    </div>
  );
};
