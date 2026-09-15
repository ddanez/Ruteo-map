import React from 'react';
import { RotateCcw, MapPin, Trash2, X, Navigation, Check } from 'lucide-react';

interface ResetRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetFromScratchAtLocation: () => void;
  onResetDistanceKeepStops: () => void;
  stopsCount: number;
  totalDistanceKm: number;
  isLocating: boolean;
}

export const ResetRouteModal: React.FC<ResetRouteModalProps> = ({
  isOpen,
  onClose,
  onResetFromScratchAtLocation,
  onResetDistanceKeepStops,
  stopsCount,
  totalDistanceKm,
  isLocating,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Reiniciar Recorrido
              </h2>
              <p className="text-xs text-slate-400">
                Empezar en tu ubicación real con 0 km
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-950">
              <Navigation className="w-4 h-4 text-amber-600" />
              ¿Por qué marcaba miles de kilómetros?
            </p>
            Al abrir la app por primera vez, se cargó una ruta de prueba. Al añadir tu punto local, la aplicación sumó la distancia desde la ruta inicial hasta tu país ({totalDistanceKm.toFixed(1)} km).
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-normal">
            Elige cómo deseas reiniciar:
          </p>

          <div className="space-y-2.5">
            {/* Option 1: Full restart at user location */}
            <button
              id="reset-scratch-gps-btn"
              type="button"
              onClick={onResetFromScratchAtLocation}
              disabled={isLocating}
              className="w-full text-left p-3.5 rounded-xl border-2 border-sky-500 bg-sky-50/60 hover:bg-sky-100/80 transition group flex items-start gap-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs sm:text-sm font-bold text-sky-950 flex items-center justify-between">
                  <span>Empezar de cero en mi ubicación actual</span>
                  {isLocating && <span className="text-[10px] text-sky-700 animate-pulse">Obteniendo GPS...</span>}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Borra paradas de prueba y camino anterior. Centra el mapa en tu casa/GPS y pone distancia a <strong>0.00 km</strong>.
                </p>
              </div>
            </button>

            {/* Option 2: Keep current stops if any */}
            {stopsCount > 0 && (
              <button
                id="reset-distance-keep-stops-btn"
                type="button"
                onClick={onResetDistanceKeepStops}
                disabled={isLocating}
                className="w-full text-left p-3.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition flex items-start gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    Conservar mis paradas ({stopsCount}) y reiniciar distancia a 0 km
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Mantiene los puntos que ya creaste (como tus notas y fotos), pero limpia el trazado anterior y pone el kilometraje en 0 km.
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
