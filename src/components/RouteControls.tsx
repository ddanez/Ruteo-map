import React from 'react';
import { formatDistance, formatDuration } from '../utils/geo';
import {
  Play,
  Pause,
  PlusCircle,
  List,
  MapPin,
  Zap,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck
} from 'lucide-react';

interface RouteControlsProps {
  isTracking: boolean;
  isPaused: boolean;
  isSimulating: boolean;
  totalDistanceKm: number;
  elapsedSeconds: number;
  stopsCount: number;
  onToggleTracking: () => void;
  onTogglePause: () => void;
  onToggleSimulation: () => void;
  onAddStopAtCurrentLocation: () => void;
  onOpenStopsDrawer: () => void;
  onOpenPocketMode: () => void;
  onResetRoute: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasCurrentLocation: boolean;
}

export const RouteControls: React.FC<RouteControlsProps> = ({
  isTracking,
  isPaused,
  isSimulating,
  totalDistanceKm,
  elapsedSeconds,
  stopsCount,
  onToggleTracking,
  onTogglePause,
  onToggleSimulation,
  onAddStopAtCurrentLocation,
  onOpenStopsDrawer,
  onOpenPocketMode,
  onResetRoute,
  onExportData,
  onImportData,
  hasCurrentLocation,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-3 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Metrics & Stats */}
        <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isTracking
                  ? isPaused
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500 animate-ping'
                  : 'bg-slate-300'
              }`}
            />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isTracking ? (isPaused ? 'Pausado' : 'Trazando Camino') : 'En Espera'}
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {isSimulating ? 'Simulación Activa' : isTracking ? 'GPS En Vivo' : 'Listo para iniciar'}
              </div>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-200" />

          {/* Distance */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Distancia
            </div>
            <div className="text-sm font-bold text-slate-800 font-mono">
              {formatDistance(totalDistanceKm)}
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-200" />

          {/* Time */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tiempo
            </div>
            <div className="text-sm font-bold text-slate-800 font-mono">
              {formatDuration(elapsedSeconds)}
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-200" />

          {/* Stops Count */}
          <button
            id="open-stops-drawer-btn"
            type="button"
            onClick={onOpenStopsDrawer}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition cursor-pointer"
            title="Ver lista de puntos guardados"
          >
            <MapPin className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold">{stopsCount} {stopsCount === 1 ? 'punto' : 'puntos'}</span>
          </button>
        </div>

        {/* Center & Right: Primary Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Add Stop Button */}
          <button
            id="add-stop-current-btn"
            type="button"
            onClick={onAddStopAtCurrentLocation}
            className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            title="Registrar un punto en tu ubicación actual"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Colocar Punto Aquí</span>
          </button>

          {/* Tracking Play/Pause */}
          {!isTracking ? (
            <button
              id="start-tracking-btn"
              type="button"
              onClick={onToggleTracking}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Trazado</span>
            </button>
          ) : (
            <>
              <button
                id="pause-tracking-btn"
                type="button"
                onClick={onTogglePause}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  isPaused
                    ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Reanudar</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pausar</span>
                  </>
                )}
              </button>

              <button
                id="stop-tracking-btn"
                type="button"
                onClick={onToggleTracking}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Finalizar</span>
              </button>
            </>
          )}

          {/* Pocket / Motorcycle Mode Button */}
          <button
            id="pocket-mode-btn"
            type="button"
            onClick={onOpenPocketMode}
            className="px-3 py-2 bg-neutral-900 hover:bg-black text-amber-300 border border-neutral-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="Modo Bolsillo / Moto: Pantalla negra de bajo consumo para guardar en el bolsillo sin apagar el GPS"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Modo Bolsillo / Moto</span>
          </button>

          {/* Simulation Toggle */}
          <button
            id="simulation-toggle-btn"
            type="button"
            onClick={onToggleSimulation}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              isSimulating
                ? 'bg-indigo-600 text-white border-indigo-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Simular un recorrido en vivo para probar el trazado sin moverte de casa"
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'text-amber-300' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {isSimulating ? 'Detener Simulación' : 'Simular Ruta'}
            </span>
          </button>

          {/* Drawer Button */}
          <button
            id="drawer-toggle-btn"
            type="button"
            onClick={onOpenStopsDrawer}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Ver paradas registradas"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Extra Options: Export/Import/Reset */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5">
            <button
              type="button"
              onClick={onExportData}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Exportar copia de seguridad (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Importar ruta (JSON)"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={onImportData}
              className="hidden"
            />
            <button
              id="reset-route-btn"
              type="button"
              onClick={onResetRoute}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Reiniciar trazado y empezar en tu ubicación"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
