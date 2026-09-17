import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoPoint, RouteStop } from '../types';
import { MapPin, Locate, Maximize2, Layers } from 'lucide-react';

interface MapViewProps {
  path: GeoPoint[];
  stops: RouteStop[];
  currentLocation: GeoPoint | null;
  selectedStopId: string | null;
  onSelectStop: (stop: RouteStop) => void;
  onMapClickAdd: (lat: number, lng: number) => void;
  isTracking: boolean;
  onRequestLocateUser?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  path,
  stops,
  currentLocation,
  selectedStopId,
  onSelectStop,
  onMapClickAdd,
  isTracking,
  onRequestLocateUser,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  const pathGlowPolylineRef = useRef<L.Polyline | null>(null);
  const gapPolylineRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapStyle, setMapStyle] = React.useState<'osm' | 'streets' | 'satellite'>('osm');
  const [showStyleMenu, setShowStyleMenu] = React.useState(false);
  const [followUser, setFollowUser] = React.useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initial center: if stops or path exist, use them, otherwise default to current or center
    const initialLat = currentLocation?.lat || stops[0]?.lat || path[0]?.lat || 8.6226;
    const initialLng = currentLocation?.lng || stops[0]?.lng || path[0]?.lng || -70.2075;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer (Standard OpenStreetMap - 100% free, no API key needed, no watermarks)
    const initialTiles = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map);
    tileLayerRef.current = initialTiles;

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Polylines for path
    const pathGlow = L.polyline([], {
      color: '#38bdf8',
      weight: 7,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    pathGlowPolylineRef.current = pathGlow;

    const pathMain = L.polyline([], {
      color: '#0284c7',
      weight: 4,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: undefined,
    }).addTo(map);
    pathPolylineRef.current = pathMain;

    const pathGap = L.polyline([], {
      color: '#f59e0b',
      weight: 2.5,
      opacity: 0.8,
      dashArray: '6, 8',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    gapPolylineRef.current = pathGap;

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickAdd(e.latlng.lat, e.latlng.lng);
    });

    map.on('dragstart', () => {
      setFollowUser(false);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = '';
    let attribution = '';

    if (mapStyle === 'osm') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    } else if (mapStyle === 'streets') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, HERE, Garmin, USGS, NGA';
    } else if (mapStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, Maxar, Earthstar Geographics';
    }

    const newTiles = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(map);
    tileLayerRef.current = newTiles;
  }, [mapStyle]);

  // Update Path Polyline with Gap Handling
  useEffect(() => {
    if (!pathPolylineRef.current || !pathGlowPolylineRef.current) return;

    const segments: [number, number][][] = [];
    const gapSegments: [number, number][][] = [];
    let currentSegment: [number, number][] = [];

    for (let i = 0; i < path.length; i++) {
      const pt = path[i];
      if (pt.isGapStart && currentSegment.length > 0) {
        segments.push(currentSegment);
        const prevPt = currentSegment[currentSegment.length - 1];
        gapSegments.push([prevPt, [pt.lat, pt.lng]]);
        currentSegment = [];
      }
      currentSegment.push([pt.lat, pt.lng]);
    }
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    pathPolylineRef.current.setLatLngs(segments as any);
    pathGlowPolylineRef.current.setLatLngs(segments as any);
    if (gapPolylineRef.current) {
      gapPolylineRef.current.setLatLngs(gapSegments as any);
    }
  }, [path]);

  // Update Stop Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const group = markersGroupRef.current;
    group.clearLayers();

    stops.forEach((stop, index) => {
      const isSelected = stop.id === selectedStopId;
      const photoCount = stop.photos?.length || 0;

      // Frequency badge color mapping
      const freqColor =
        stop.visitFrequency === 'Diario'
          ? '#ef4444'
          : stop.visitFrequency === 'Semanal'
          ? '#f59e0b'
          : stop.visitFrequency === 'Quincenal'
          ? '#3b82f6'
          : stop.visitFrequency === 'Mensual'
          ? '#10b981'
          : '#8b5cf6';

      // Custom Stop Pin Marker
      const customIcon = L.divIcon({
        className: 'custom-stop-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <div style="
              background: ${isSelected ? '#0f172a' : '#ffffff'};
              color: ${isSelected ? '#ffffff' : '#0f172a'};
              border: 2.5px solid ${freqColor};
              border-radius: 9999px;
              padding: 5px 9.5px;
              box-shadow: 0 4px 14px rgba(0,0,0,0.22);
              display: flex;
              align-items: center;
              gap: 5px;
              font-weight: 600;
              font-size: 11px;
              white-space: nowrap;
              transition: all 0.2s ease;
              ${isSelected ? 'transform: scale(1.12); box-shadow: 0 8px 20px rgba(0,0,0,0.35);' : ''}
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#38bdf8' : freqColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>#${index + 1} ${escapeHtml(stop.name.length > 18 ? stop.name.slice(0, 18) + '...' : stop.name)}</span>
              ${
                photoCount > 0
                  ? `<span style="background: ${freqColor}; color: white; font-size: 9px; border-radius: 999px; padding: 1px 5px;">📷 ${photoCount}</span>`
                  : ''
              }
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid ${freqColor};
              margin-top: -1px;
            "></div>
            <div style="
              width: 6px;
              height: 6px;
              background: ${freqColor};
              border-radius: 50%;
              margin-top: 1px;
              box-shadow: 0 0 6px ${freqColor};
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: customIcon });
      marker.on('click', () => {
        onSelectStop(stop);
      });

      marker.addTo(group);
    });
  }, [stops, selectedStopId, onSelectStop]);

  // Update Current User GPS Position Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (!currentLocation) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    const userIcon = L.divIcon({
      className: 'user-gps-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px; transform: translate(-50%, -50%);">
          <div style="
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            background: rgba(14, 165, 233, 0.35);
            animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 24px;
            height: 24px;
            background: #0284c7;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    if (followUser) {
      map.panTo([currentLocation.lat, currentLocation.lng], { animate: true, duration: 0.6 });
    }
  }, [currentLocation, followUser]);

  // Center on Selected Stop
  useEffect(() => {
    if (!selectedStopId || !mapInstanceRef.current) return;
    const stop = stops.find((s) => s.id === selectedStopId);
    if (stop) {
      mapInstanceRef.current.setView([stop.lat, stop.lng], 16, { animate: true });
    }
  }, [selectedStopId, stops]);

  const handleCenterOnUser = () => {
    if (currentLocation && mapInstanceRef.current) {
      setFollowUser(true);
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 16, {
        animate: true,
      });
    }
    if (onRequestLocateUser) {
      onRequestLocateUser();
    }
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [];
    path.forEach((p) => points.push([p.lat, p.lng]));
    stops.forEach((s) => points.push([s.lat, s.lng]));
    if (currentLocation) points.push([currentLocation.lat, currentLocation.lng]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
      setFollowUser(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Layer Switcher */}
        <div className="relative">
          <button
            id="map-style-toggle-btn"
            type="button"
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="w-11 h-11 bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-950 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-transform active:scale-95"
            title="Cambiar tipo de mapa"
          >
            <Layers className="w-5 h-5 text-slate-700" />
          </button>

          {showStyleMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 py-1 z-20 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMapStyle('osm');
                  setShowStyleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sky-50 ${
                  mapStyle === 'osm' ? 'text-sky-700 font-bold bg-sky-50/50' : 'text-slate-700'
                }`}
              >
                <span>OpenStreetMap (Nítido)</span>
                {mapStyle === 'osm' && <span className="w-2 h-2 rounded-full bg-sky-600"></span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapStyle('streets');
                  setShowStyleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sky-50 ${
                  mapStyle === 'streets' ? 'text-sky-700 font-bold bg-sky-50/50' : 'text-slate-700'
                }`}
              >
                <span>Calles y Rutas (Esri)</span>
                {mapStyle === 'streets' && <span className="w-2 h-2 rounded-full bg-sky-600"></span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapStyle('satellite');
                  setShowStyleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sky-50 ${
                  mapStyle === 'satellite' ? 'text-sky-700 font-bold bg-sky-50/50' : 'text-slate-700'
                }`}
              >
                <span>Satélite / Ortofoto</span>
                {mapStyle === 'satellite' && <span className="w-2 h-2 rounded-full bg-sky-600"></span>}
              </button>
            </div>
          )}
        </div>

        {/* Fit All Bounds */}
        <button
          id="map-fit-bounds-btn"
          type="button"
          onClick={handleFitBounds}
          className="w-11 h-11 bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-950 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-transform active:scale-95"
          title="Ver ruta completa"
        >
          <Maximize2 className="w-5 h-5 text-slate-700" />
        </button>

        {/* Center on Current Location */}
        {currentLocation && (
          <button
            id="map-locate-user-btn"
            type="button"
            onClick={handleCenterOnUser}
            className={`w-11 h-11 rounded-xl shadow-md border flex items-center justify-center transition-all active:scale-95 ${
              followUser
                ? 'bg-sky-600 text-white border-sky-700 shadow-sky-200'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:text-sky-600'
            }`}
            title="Centrar en mi posición actual"
          >
            <Locate className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Helper Map Click Toast / Hint */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full shadow-lg border border-slate-700/50 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span>Toca cualquier punto del mapa para colocar un punto y registrar sus datos</span>
        </div>
      </div>
    </div>
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
