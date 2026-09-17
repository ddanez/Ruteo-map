import React, { useState, useEffect, useRef } from 'react';
import { GeoPoint } from '../types';
import { formatDistance, formatDuration } from '../utils/geo';
import { ShieldCheck, MapPin, Gauge, Compass, Zap, Lock, Unlock, AlertCircle } from 'lucide-react';

interface PocketModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: GeoPoint | null;
  totalDistanceKm: number;
  elapsedSeconds: number;
  isTracking: boolean;
  isPaused: boolean;
  onQuickAddStop: () => void;
  stopsCount: number;
}

export const PocketModeModal: React.FC<PocketModeModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  totalDistanceKm,
  elapsedSeconds,
  isTracking,
  isPaused,
  onQuickAddStop,
  stopsCount,
}) => {
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [isHoldingUnlock, setIsHoldingUnlock] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [isUltraDark, setIsUltraDark] = useState(false);
  const [quickStopFeedback, setQuickStopFeedback] = useState<string | null>(null);

  const holdIntervalRef = useRef<number | null>(null);
  const wakeLockSentinelRef = useRef<any>(null);

  // Screen WakeLock management
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          if (isMounted) {
            wakeLockSentinelRef.current = sentinel;
            setWakeLockActive(true);
            sentinel.addEventListener('release', () => {
              if (isMounted) setWakeLockActive(false);
            });
          }
        }
      } catch (err) {
        console.warn('Wake Lock could not be acquired:', err);
      }
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isOpen) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
      }
    };
  }, [isOpen]);

  // Hold-to-unlock logic (prevents accidental pocket touches)
  const startHoldUnlock = () => {
    setIsHoldingUnlock(true);
    const startTime = Date.now();
    const duration = 1200; // 1.2 seconds hold

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setUnlockProgress(progress);

      if (progress >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        if ('vibrate' in navigator) navigator.vibrate?.([40, 40, 60]);
        onClose();
      }
    }, 30);
  };

  const endHoldUnlock = () => {
    setIsHoldingUnlock(false);
    setUnlockProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const handleQuickStop = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate?.([80, 50, 80]);
    }
    onQuickAddStop();
    setQuickStopFeedback('¡Parada guardada!');
    setTimeout(() => setQuickStopFeedback(null), 2500);
  };

  if (!isOpen) return null;

  const currentSpeedKmh =
    currentLocation?.speed && currentLocation.speed > 0
      ? Math.round(currentLocation.speed * 3.6)
      : 0;

  const accuracyMeters = currentLocation?.accuracy ? Math.round(currentLocation.accuracy) : null;

  return (
    <div
      id="pocket-mode-overlay"
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between select-none overflow-hidden touch-none"
      style={{
        backgroundColor: '#000000',
        opacity: isUltraDark ? 0.3 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Top Header */}
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-neutral-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-sky-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Modo Bolsillo & Moto
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                Bloqueo Antifalsos Toques
              </span>
            </div>
            <div className="text-[11px] text-neutral-500">
              {wakeLockActive ? 'Pantalla despierta (GPS continuo)' : 'GPS activo en vivo'}
            </div>
          </div>
        </div>

        {/* Dimmer toggle */}
        <button
          type="button"
          onClick={() => setIsUltraDark(!isUltraDark)}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white transition"
        >
          {isUltraDark ? 'Iluminar' : 'Ahorro OLED Máximo'}
        </button>
      </div>

      {/* Center: Motorcycle HUD / Stats */}
      <div className="px-6 py-4 flex-1 flex flex-col justify-center items-center text-center">
        {/* Speedometer */}
        <div className="mb-6">
          <div className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-white flex items-baseline justify-center gap-2">
            <span>{currentSpeedKmh}</span>
            <span className="text-xl sm:text-2xl font-sans font-bold text-neutral-500">km/h</span>
          </div>
          <div className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mt-1 flex items-center justify-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>Velocidad en tiempo real</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-900">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Distancia</div>
            <div className="text-base sm:text-lg font-mono font-bold text-sky-400 mt-0.5">
              {formatDistance(totalDistanceKm)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-900">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Tiempo</div>
            <div className="text-base sm:text-lg font-mono font-bold text-amber-400 mt-0.5">
              {formatDuration(elapsedSeconds)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-900">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Paradas</div>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-400 mt-0.5">
              {stopsCount}
            </div>
          </div>
        </div>

        {/* GPS Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {accuracyMeters !== null
              ? `GPS conectado (Precisión ±${accuracyMeters}m)`
              : 'Conectando satélites GPS...'}
          </span>
        </div>

        {/* Quick Stop Button */}
        <div className="w-full max-w-xs mb-2">
          <button
            type="button"
            onClick={handleQuickStop}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-sky-950 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-sky-200" />
            <span>{quickStopFeedback || 'Marcar Parada Rápida Aquí'}</span>
          </button>
        </div>
      </div>

      {/* Bottom: Hold-to-Unlock / Exit Area */}
      <div className="p-6 border-t border-neutral-900 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center">
        <p className="text-[11px] text-neutral-400 text-center mb-4 max-w-xs leading-relaxed">
          <strong>Listo para tu bolsillo:</strong> No presiones el botón de apagado físico del móvil.
          Esta pantalla negra ahorra batería y mantiene el GPS registrando cada esquina sin interrupciones.
        </p>

        {/* Unlock Button with Progress Indicator */}
        <div className="relative w-full max-w-xs">
          <button
            type="button"
            onPointerDown={startHoldUnlock}
            onPointerUp={endHoldUnlock}
            onPointerLeave={endHoldUnlock}
            onTouchStart={startHoldUnlock}
            onTouchEnd={endHoldUnlock}
            className="relative w-full py-3.5 px-6 rounded-2xl bg-neutral-900 active:bg-neutral-800 border border-neutral-700 text-white font-semibold text-sm flex items-center justify-center gap-2.5 overflow-hidden select-none cursor-pointer"
          >
            {/* Progress Fill */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-sky-600/40 transition-all duration-75 ease-linear pointer-events-none"
              style={{ width: `${unlockProgress}%` }}
            />

            <div className="relative z-10 flex items-center gap-2">
              {isHoldingUnlock ? (
                <Unlock className="w-4 h-4 text-sky-400 animate-bounce" />
              ) : (
                <Lock className="w-4 h-4 text-neutral-400" />
              )}
              <span>
                {isHoldingUnlock
                  ? 'Mantén presionado...'
                  : 'Mantén presionado para Salir'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
