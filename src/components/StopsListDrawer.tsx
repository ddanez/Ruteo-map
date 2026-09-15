import React, { useState } from 'react';
import { RouteStop } from '../types';
import { formatDateTime } from '../utils/geo';
import {
  X,
  MapPin,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';

interface StopsListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stops: RouteStop[];
  selectedStopId: string | null;
  onSelectStop: (stop: RouteStop) => void;
  onEditStop: (stop: RouteStop) => void;
  onDeleteStop: (stopId: string) => void;
  onAddNewStop: () => void;
}

export const StopsListDrawer: React.FC<StopsListDrawerProps> = ({
  isOpen,
  onClose,
  stops,
  selectedStopId,
  onSelectStop,
  onEditStop,
  onDeleteStop,
  onAddNewStop,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('Todas');

  if (!isOpen) return null;

  const frequencies = ['Todas', 'Diario', 'Semanal', 'Quincenal', 'Mensual', 'Ocasional'];

  const filteredStops = stops.filter((stop) => {
    const matchesSearch =
      stop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stop.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFreq =
      frequencyFilter === 'Todas' || stop.visitFrequency === frequencyFilter;
    return matchesSearch && matchesFreq;
  });

  const getFreqBadgeColor = (freq: string) => {
    switch (freq) {
      case 'Diario':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Semanal':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Quincenal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Mensual':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        id="stops-list-drawer"
        className="relative w-full max-w-md bg-white h-full shadow-2xl z-50 flex flex-col border-l border-slate-200"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">Puntos y Paradas Registradas</h3>
            <span className="bg-sky-500/20 text-sky-300 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
              {stops.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o comentario..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
            {frequencies.map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setFrequencyFilter(freq)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  frequencyFilter === freq
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        {/* List of Stops */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredStops.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-500">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron paradas</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || frequencyFilter !== 'Todas'
                  ? 'Prueba modificando tus filtros de búsqueda.'
                  : 'Inicia el recorrido o toca cualquier punto del mapa para registrar tu primer punto con sus datos.'}
              </p>
            </div>
          ) : (
            filteredStops.map((stop, index) => {
              const isSelected = stop.id === selectedStopId;
              const photoCount = stop.photos?.length || 0;

              return (
                <div
                  key={stop.id}
                  onClick={() => onSelectStop(stop)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/60 shadow-sm ring-1 ring-sky-400'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 shadow-xs'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                      {photoCount > 0 ? (
                        <img
                          src={stop.photos[0]}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                          <MapPin className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      {photoCount > 1 && (
                        <div className="absolute bottom-0.5 right-0.5 bg-black/75 text-white text-[9px] px-1 rounded font-bold">
                          +{photoCount - 1}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          #{index + 1} {stop.name}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getFreqBadgeColor(
                            stop.visitFrequency
                          )}`}
                        >
                          {stop.visitFrequency}
                        </span>
                      </div>

                      {stop.notes && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-1.5">
                          {stop.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(stop.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditStop(stop);
                            }}
                            className="p-1 hover:text-sky-600 transition"
                            title="Editar punto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteStop(stop.id);
                            }}
                            className="p-1 hover:text-red-600 transition"
                            title="Eliminar punto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Action */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onAddNewStop}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Punto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
