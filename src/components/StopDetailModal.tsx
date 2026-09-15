import React, { useState } from 'react';
import { RouteStop } from '../types';
import { formatDateTime } from '../utils/geo';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  MessageSquare
} from 'lucide-react';

interface StopDetailModalProps {
  stop: RouteStop | null;
  onClose: () => void;
  onEdit: (stop: RouteStop) => void;
  onDelete: (stopId: string) => void;
}

export const StopDetailModal: React.FC<StopDetailModalProps> = ({
  stop,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPhotoFullscreen, setIsPhotoFullscreen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!stop) return null;

  const photos = stop.photos || [];
  const hasPhotos = photos.length > 0;

  // Frequency colors
  const getFrequencyBadgeClass = (freq: string) => {
    switch (freq) {
      case 'Diario':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'Semanal':
        return 'bg-amber-500/10 text-amber-800 border-amber-200';
      case 'Quincenal':
        return 'bg-blue-500/10 text-blue-800 border-blue-200';
      case 'Mensual':
        return 'bg-emerald-500/10 text-emerald-800 border-emerald-200';
      default:
        return 'bg-purple-500/10 text-purple-800 border-purple-200';
    }
  };

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div
          id="stop-detail-modal"
          className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between">
            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  <MapPin className="w-3 h-3 text-sky-300" />
                  Punto de Interés
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getFrequencyBadgeClass(
                    stop.visitFrequency
                  )}`}
                >
                  <Clock className="w-3 h-3" />
                  Frecuencia: {stop.visitFrequency}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                {stop.name}
              </h2>
            </div>
            <button
              id="close-stop-detail-btn"
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-5 text-slate-700 text-sm">
            {/* Photos Section */}
            {hasPhotos ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video shadow-inner group">
                  <img
                    src={photos[activePhotoIndex]}
                    alt={`${stop.name} foto ${activePhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Photo controls */}
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-xs transition"
                        title="Foto anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-xs transition"
                        title="Siguiente foto"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPhotoFullscreen(true)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition"
                    title="Ver en pantalla completa"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                    {activePhotoIndex + 1} / {photos.length}
                  </div>
                </div>

                {/* Thumbnails row */}
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative rounded-lg overflow-hidden shrink-0 w-16 h-12 border-2 transition ${
                          activePhotoIndex === idx
                            ? 'border-sky-600 ring-2 ring-sky-300'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-slate-500 bg-slate-50/50">
                <p className="text-xs">Sin fotos asociadas a este punto.</p>
              </div>
            )}

            {/* Comments & Personal Notes */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-xs tracking-wider uppercase">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Comentarios personales</span>
              </div>
              {stop.notes ? (
                <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">
                  {stop.notes}
                </p>
              ) : (
                <p className="text-slate-400 italic text-sm">
                  No se registraron comentarios en esta parada.
                </p>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-500 font-medium">Fecha y Hora</div>
                  <div className="text-slate-800 font-semibold mt-0.5">
                    {formatDateTime(stop.createdAt)}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-500 font-medium">Coordenadas</div>
                  <div className="text-slate-800 font-semibold mt-0.5 font-mono text-[11px]">
                    {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            {confirmDelete ? (
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-red-700 font-medium">¿Confirmas eliminar?</span>
                <button
                  type="button"
                  onClick={() => onDelete(stop.id)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <button
                  id="delete-stop-btn"
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
                  title="Eliminar parada"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    id="edit-stop-btn"
                    type="button"
                    onClick={() => onEdit(stop)}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar Punto</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox */}
      {isPhotoFullscreen && hasPhotos && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setIsPhotoFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setIsPhotoFullscreen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={photos[activePhotoIndex]}
            alt={stop.name}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-4 text-white/70 text-sm font-medium">
            {stop.name} &bull; {activePhotoIndex + 1} de {photos.length}
          </div>
        </div>
      )}
    </>
  );
};
