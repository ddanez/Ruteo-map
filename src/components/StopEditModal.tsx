import React, { useState, useRef } from 'react';
import { RouteStop, VisitFrequency } from '../types';
import { compressImageFile } from '../utils/geo';
import {
  X,
  Upload,
  Camera,
  Trash2,
  MapPin,
  Clock,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface StopEditModalProps {
  initialStop?: RouteStop | null;
  initialCoords?: { lat: number; lng: number } | null;
  onSave: (stopData: Omit<RouteStop, 'id' | 'createdAt'> & { id?: string }) => void;
  onClose: () => void;
}

const PRESET_FREQUENCIES: VisitFrequency[] = [
  'Diario',
  'Semanal',
  'Quincenal',
  'Mensual',
  'Ocasional',
  'Anual',
  'Primera vez',
  'Personalizada',
];

export const StopEditModal: React.FC<StopEditModalProps> = ({
  initialStop,
  initialCoords,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialStop?.name || '');
  const [frequency, setFrequency] = useState<VisitFrequency | string>(
    initialStop?.visitFrequency || 'Semanal'
  );
  const [customFrequency, setCustomFrequency] = useState(
    initialStop?.customFrequency || ''
  );
  const [notes, setNotes] = useState(initialStop?.notes || '');
  const [photos, setPhotos] = useState<string[]>(initialStop?.photos || []);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const lat = initialStop?.lat ?? initialCoords?.lat ?? 0;
  const lng = initialStop?.lng ?? initialCoords?.lng ?? 0;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    setErrorMsg(null);
    try {
      const newPhotoUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImageFile(file, 1200, 1200, 0.82);
        newPhotoUrls.push(compressed);
      }
      setPhotos((prev) => [...prev, ...newPhotoUrls]);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron procesar algunas fotos. Intenta con otra imagen.');
    } finally {
      setIsProcessingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa un nombre para este punto o parada.');
      return;
    }

    const finalFrequency =
      frequency === 'Personalizada' && customFrequency.trim()
        ? customFrequency.trim()
        : frequency;

    onSave({
      id: initialStop?.id,
      name: name.trim(),
      visitFrequency: finalFrequency,
      customFrequency: customFrequency.trim() || undefined,
      photos,
      notes: notes.trim(),
      lat,
      lng,
      distanceFromStartKm: initialStop?.distanceFromStartKm,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        id="stop-edit-modal"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                {initialStop ? 'Editar Punto / Parada' : 'Registrar Nuevo Punto'}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                <MapPin className="w-3 h-3 text-sky-400" />
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
            </div>
          </div>
          <button
            id="close-stop-edit-btn"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nombre del Punto */}
          <div className="space-y-1.5">
            <label
              htmlFor="point-name-input"
              className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5"
            >
              <span>Nombre del Punto / Parada</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              id="point-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mirador de la Costa, Cafetería del Puerto, Sendero Norte..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              autoFocus
            />
          </div>

          {/* Frecuencia de Visitar */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Frecuencia con que te interesa visitar</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_FREQUENCIES.map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFrequency(freq)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    frequency === freq
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>

            {frequency === 'Personalizada' && (
              <div className="pt-1">
                <input
                  type="text"
                  value={customFrequency}
                  onChange={(e) => setCustomFrequency(e.target.value)}
                  placeholder="Especifica tu frecuencia (ej. Cada temporada de verano, Fines de semana alternos...)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Fotos de la Parada */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-sky-600" />
                <span>Fotos del lugar ({photos.length})</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhotos}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir fotos</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              id="point-photos-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* Photos Preview Grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group shadow-xs"
                  >
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-600/90 text-white p-1 rounded-md opacity-90 hover:opacity-100 transition shadow-sm"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/50 flex flex-col items-center justify-center text-slate-500 hover:text-sky-600 transition cursor-pointer"
                >
                  <Camera className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-semibold">+ Añadir</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-sky-50/30 transition group"
              >
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-sky-600 mx-auto mb-1.5 transition-colors" />
                <p className="text-xs font-semibold text-slate-700">Toca para añadir fotos</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Puedes seleccionar varias imágenes o tomar fotos con tu cámara
                </p>
              </div>
            )}
            {isProcessingPhotos && (
              <p className="text-xs text-sky-600 animate-pulse">Optimizando fotos para guardar...</p>
            )}
          </div>

          {/* Comentarios Personales */}
          <div className="space-y-1.5">
            <label
              htmlFor="point-notes-textarea"
              className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
              <span>Comentarios personales</span>
            </label>
            <textarea
              id="point-notes-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Qué sensaciones te transmite? ¿Cómo llegar? Recuerdos especiales, clima o notas para tu próxima visita..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              id="cancel-edit-stop-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              id="save-stop-btn"
              type="submit"
              disabled={isProcessingPhotos}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>{initialStop ? 'Guardar Cambios' : 'Registrar Parada'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
