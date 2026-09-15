import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GeoPoint, RouteStop, RouteSession } from './types';
import {
  calculateDistance,
  INITIAL_SAMPLE_SESSION
} from './utils/geo';
import { MapView } from './components/MapView';
import { RouteControls } from './components/RouteControls';
import { StopDetailModal } from './components/StopDetailModal';
import { StopEditModal } from './components/StopEditModal';
import { StopsListDrawer } from './components/StopsListDrawer';
import { ResetRouteModal } from './components/ResetRouteModal';
import { MapPin, Info, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'route_tracking_session_v2';

export default function App() {
  // Load session from LocalStorage or fall back to Initial Sample Session
  const [session, setSession] = useState<RouteSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('faros_route_session_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean tracking state on load
        return { ...parsed, isTracking: false, isPaused: false };
      }
    } catch (e) {
      console.error('Error loading saved route session:', e);
    }
    return INITIAL_SAMPLE_SESSION;
  });

  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(() => {
    if (session.path.length > 0) {
      return session.path[session.path.length - 1];
    }
    return null;
  });

  // Modals & Drawers state
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [editingStop, setEditingStop] = useState<RouteStop | null>(null);
  const [addingCoords, setAddingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isStopsDrawerOpen, setIsStopsDrawerOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Time tracking
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Refs for tracking
  const watchIdRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Save session to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.warn('LocalStorage quota limit reached, consider cleaning older photos.', err);
    }
  }, [session]);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => {
      setStatusNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Active request for user's GPS position
  const requestUserLocation = useCallback((onSuccess?: (point: GeoPoint) => void) => {
    if (!('geolocation' in navigator)) {
      showNotification('Tu dispositivo o navegador no soporta geolocalización.');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGps(false);
        const { latitude, longitude, altitude, speed, accuracy } = position.coords;
        const newPoint: GeoPoint = {
          lat: latitude,
          lng: longitude,
          timestamp: position.timestamp,
          altitude,
          speed,
          accuracy,
        };
        setCurrentLocation(newPoint);
        if (onSuccess) {
          onSuccess(newPoint);
        } else {
          showNotification('Ubicación GPS detectada correctamente.');
        }
      },
      (error) => {
        setIsLocatingGps(false);
        console.warn('Geolocation error:', error.message);
        if (error.code === error.PERMISSION_DENIED) {
          showNotification('Permiso de GPS no concedido. Permite la ubicación en los ajustes del navegador.');
        } else {
          showNotification('Buscando señal GPS... Asegúrate de tener la ubicación activada en tu móvil.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Request location on startup
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Timer loop for tracking duration
  useEffect(() => {
    if (session.isTracking && !session.isPaused) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [session.isTracking, session.isPaused]);

  // Geolocation watchPosition
  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, altitude, speed, accuracy } = position.coords;
    const newPoint: GeoPoint = {
      lat: latitude,
      lng: longitude,
      timestamp: position.timestamp,
      altitude,
      speed,
      accuracy,
    };

    setCurrentLocation(newPoint);

    setSession((prev) => {
      if (!prev.isTracking || prev.isPaused) return prev;

      const lastPoint = prev.path[prev.path.length - 1];
      if (lastPoint) {
        const deltaKm = calculateDistance(
          lastPoint.lat,
          lastPoint.lng,
          newPoint.lat,
          newPoint.lng
        );
        // Ignore tiny jitter less than 4 meters unless moving
        if (deltaKm < 0.004) {
          return prev;
        }
        return {
          ...prev,
          path: [...prev.path, newPoint],
          totalDistanceKm: prev.totalDistanceKm + deltaKm,
        };
      } else {
        return {
          ...prev,
          path: [newPoint],
        };
      }
    });
  }, []);

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    console.warn('Geolocation error:', error.message);
    if (error.code === error.PERMISSION_DENIED) {
      showNotification('Permiso de ubicación denegado. Puedes usar el modo simulación o tocar el mapa para ubicar paradas.');
    }
  }, []);

  // Start real GPS tracking
  const startGpsTracking = () => {
    if (!('geolocation' in navigator)) {
      showNotification('Tu navegador no soporta geolocalización.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Toggle Live Tracking
  const toggleTracking = () => {
    if (session.isTracking) {
      // Stopping
      stopGpsTracking();
      if (isSimulating) {
        stopSimulation();
      }
      setSession((prev) => ({
        ...prev,
        isTracking: false,
        isPaused: false,
      }));
      showNotification('Recorrido finalizado y guardado.');
    } else {
      // Starting
      setSession((prev) => ({
        ...prev,
        isTracking: true,
        isPaused: false,
      }));
      startGpsTracking();
      showNotification('Rastreo de camino iniciado.');
    }
  };

  const togglePause = () => {
    setSession((prev) => {
      const nextPaused = !prev.isPaused;
      showNotification(nextPaused ? 'Rastreo pausado.' : 'Rastreo reanudado.');
      return {
        ...prev,
        isPaused: nextPaused,
      };
    });
  };

  // Simulation Mode for indoor/desktop testing
  const startSimulation = () => {
    setIsSimulating(true);
    setSession((prev) => ({ ...prev, isTracking: true, isPaused: false }));

    let simLat = currentLocation?.lat || 42.8835;
    let simLng = currentLocation?.lng || -9.2801;
    let stepCount = 0;

    simulationIntervalRef.current = window.setInterval(() => {
      // Create a smooth wandering path along the coast
      const heading = (stepCount * 0.15) % (Math.PI * 2);
      simLat += 0.0004 * Math.cos(heading);
      simLng += 0.0004 * Math.sin(heading);
      stepCount++;

      const simPoint: GeoPoint = {
        lat: simLat,
        lng: simLng,
        timestamp: Date.now(),
      };

      setCurrentLocation(simPoint);

      setSession((prev) => {
        const last = prev.path[prev.path.length - 1];
        const dist = last ? calculateDistance(last.lat, last.lng, simLat, simLng) : 0;
        return {
          ...prev,
          path: [...prev.path, simPoint],
          totalDistanceKm: prev.totalDistanceKm + dist,
        };
      });
    }, 1500);

    showNotification('Simulación activa: trazando camino automáticamente...');
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
  };

  const toggleSimulation = () => {
    if (isSimulating) {
      stopSimulation();
      showNotification('Simulación detenida.');
    } else {
      startSimulation();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGpsTracking();
      stopSimulation();
    };
  }, []);

  // Stop Actions
  const handleAddStopAtCurrent = () => {
    const targetLat = currentLocation?.lat || 42.8905;
    const targetLng = currentLocation?.lng || -9.2810;
    setAddingCoords({ lat: targetLat, lng: targetLng });
    setEditingStop(null);
  };

  const handleMapClickAdd = (lat: number, lng: number) => {
    setAddingCoords({ lat, lng });
    setEditingStop(null);
  };

  const handleSaveStop = (stopData: Omit<RouteStop, 'id' | 'createdAt'> & { id?: string }) => {
    setSession((prev) => {
      let updatedStops: RouteStop[];
      if (stopData.id) {
        // Edit existing
        updatedStops = prev.stops.map((s) =>
          s.id === stopData.id
            ? {
                ...s,
                ...stopData,
              }
            : s
        );
        showNotification(`Punto "${stopData.name}" actualizado.`);
      } else {
        // Create new
        const newStop: RouteStop = {
          ...stopData,
          id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          createdAt: Date.now(),
          distanceFromStartKm: prev.totalDistanceKm,
        };
        updatedStops = [...prev.stops, newStop];
        showNotification(`Punto "${newStop.name}" guardado exitosamente.`);
      }

      return {
        ...prev,
        stops: updatedStops,
      };
    });

    setAddingCoords(null);
    setEditingStop(null);
  };

  const handleDeleteStop = (stopId: string) => {
    setSession((prev) => ({
      ...prev,
      stops: prev.stops.filter((s) => s.id !== stopId),
    }));
    if (selectedStop?.id === stopId) {
      setSelectedStop(null);
    }
    showNotification('Punto eliminado.');
  };

  const handleResetRoute = () => {
    setIsResetModalOpen(true);
  };

  const handleResetFromScratchAtLocation = () => {
    stopGpsTracking();
    stopSimulation();
    setIsLocatingGps(true);

    const applyCleanReset = (locPoint?: GeoPoint) => {
      setIsLocatingGps(false);
      const freshSession: RouteSession = {
        id: `route-${Date.now()}`,
        name: 'Mi Recorrido',
        startedAt: Date.now(),
        isTracking: false,
        isPaused: false,
        path: locPoint ? [locPoint] : [],
        stops: [],
        totalDistanceKm: 0,
      };
      setSession(freshSession);
      setElapsedSeconds(0);
      setSelectedStop(null);
      setIsResetModalOpen(false);
      showNotification('¡Ruta reiniciada de cero en tu ubicación actual con 0.00 km!');
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPoint: GeoPoint = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: pos.timestamp,
            accuracy: pos.coords.accuracy,
          };
          setCurrentLocation(userPoint);
          applyCleanReset(userPoint);
        },
        () => {
          applyCleanReset(currentLocation || undefined);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      applyCleanReset(currentLocation || undefined);
    }
  };

  const handleResetDistanceKeepStops = () => {
    stopGpsTracking();
    stopSimulation();
    setIsLocatingGps(true);

    const applyKeepReset = (locPoint?: GeoPoint) => {
      setIsLocatingGps(false);
      setSession((prev) => ({
        ...prev,
        startedAt: Date.now(),
        isTracking: false,
        isPaused: false,
        path: locPoint ? [locPoint] : [],
        totalDistanceKm: 0,
      }));
      setElapsedSeconds(0);
      setIsResetModalOpen(false);
      showNotification('Distancia reiniciada a 0.00 km. Paradas conservadas.');
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPoint: GeoPoint = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: pos.timestamp,
            accuracy: pos.coords.accuracy,
          };
          setCurrentLocation(userPoint);
          applyKeepReset(userPoint);
        },
        () => {
          applyKeepReset(currentLocation || undefined);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      applyKeepReset(currentLocation || undefined);
    }
  };

  // Export JSON
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ruta_paradas_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Copia de seguridad descargada.');
  };

  // Import JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && Array.isArray(imported.stops) && Array.isArray(imported.path)) {
          setSession(imported);
          if (imported.path.length > 0) {
            setCurrentLocation(imported.path[imported.path.length - 1]);
          }
          showNotification('Ruta importada correctamente.');
        } else {
          showNotification('El archivo no tiene el formato de ruta válido.');
        }
      } catch (err) {
        showNotification('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans text-slate-800">
      {/* Top Application Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-white shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-sm">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>Rastreador de Rutas y Paradas</span>
              {session.isTracking && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  En Vivo
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Trazando tu recorrido &bull; Toca para registrar puntos con sus datos: frecuencia, fotos y comentarios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="header-reset-route-btn"
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold text-rose-300 border border-rose-500/40 transition flex items-center gap-1.5 cursor-pointer"
            title="Reiniciar y empezar en mi ubicación"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Reiniciar en mi GPS</span>
            <span className="sm:hidden">Reiniciar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsStopsDrawerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>Ver Puntos ({session.stops.length})</span>
          </button>
        </div>
      </header>

      {/* Main Map Container */}
      <main className="flex-1 relative w-full h-full">
        {/* Banner if demo/large distance exists */}
        {session.totalDistanceKm > 100 && (
          <div className="absolute top-3 left-3 right-16 sm:left-4 sm:right-auto sm:max-w-md z-10 pointer-events-auto">
            <div className="bg-amber-400/95 text-slate-950 backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-amber-300 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 shrink-0 text-amber-950" />
                <span className="font-semibold leading-tight">
                  Distancia acumulada de prueba ({session.totalDistanceKm.toFixed(0)} km).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] shrink-0 transition cursor-pointer"
              >
                Reiniciar a 0 km
              </button>
            </div>
          </div>
        )}

        <MapView
          path={session.path}
          stops={session.stops}
          currentLocation={currentLocation}
          selectedStopId={selectedStop?.id || null}
          onSelectStop={(stop) => setSelectedStop(stop)}
          onMapClickAdd={handleMapClickAdd}
          isTracking={session.isTracking}
          onRequestLocateUser={() => requestUserLocation()}
        />

        {/* Dynamic Toast / Status Notification */}
        {statusNotification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{statusNotification}</span>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Route Controls & HUD */}
      <footer className="shrink-0 z-20">
        <RouteControls
          isTracking={session.isTracking}
          isPaused={session.isPaused}
          isSimulating={isSimulating}
          totalDistanceKm={session.totalDistanceKm}
          elapsedSeconds={elapsedSeconds}
          stopsCount={session.stops.length}
          onToggleTracking={toggleTracking}
          onTogglePause={togglePause}
          onToggleSimulation={toggleSimulation}
          onAddStopAtCurrentLocation={handleAddStopAtCurrent}
          onOpenStopsDrawer={() => setIsStopsDrawerOpen(true)}
          onResetRoute={handleResetRoute}
          onExportData={handleExportData}
          onImportData={handleImportData}
          hasCurrentLocation={currentLocation !== null}
        />
      </footer>

      {/* Stop Detail Modal (when user taps a marker or list item) */}
      {selectedStop && (
        <StopDetailModal
          stop={selectedStop}
          onClose={() => setSelectedStop(null)}
          onEdit={(stop) => {
            setEditingStop(stop);
            setSelectedStop(null);
          }}
          onDelete={handleDeleteStop}
        />
      )}

      {/* Stop Create or Edit Form Modal */}
      {(editingStop !== null || addingCoords !== null) && (
        <StopEditModal
          initialStop={editingStop}
          initialCoords={addingCoords}
          onSave={handleSaveStop}
          onClose={() => {
            setEditingStop(null);
            setAddingCoords(null);
          }}
        />
      )}

      {/* Stops Drawer / Sidebar */}
      <StopsListDrawer
        isOpen={isStopsDrawerOpen}
        onClose={() => setIsStopsDrawerOpen(false)}
        stops={session.stops}
        selectedStopId={selectedStop?.id || null}
        onSelectStop={(stop) => {
          setSelectedStop(stop);
          setIsStopsDrawerOpen(false);
        }}
        onEditStop={(stop) => {
          setEditingStop(stop);
          setIsStopsDrawerOpen(false);
        }}
        onDeleteStop={handleDeleteStop}
        onAddNewStop={() => {
          setIsStopsDrawerOpen(false);
          handleAddStopAtCurrent();
        }}
      />

      {/* Reset Route Modal */}
      <ResetRouteModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetFromScratchAtLocation={handleResetFromScratchAtLocation}
        onResetDistanceKeepStops={handleResetDistanceKeepStops}
        stopsCount={session.stops.length}
        totalDistanceKm={session.totalDistanceKm}
        isLocating={isLocatingGps}
      />
    </div>
  );
}
