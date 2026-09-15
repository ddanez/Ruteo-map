import { GeoPoint, RouteStop, RouteSession } from '../types';

/**
 * Calculates the great-circle distance between two points on the Earth (Haversine formula in km).
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates total distance of a path in km.
 */
export function calculatePathDistance(path: GeoPoint[]): number {
  if (path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += calculateDistance(
      path[i - 1].lat,
      path[i - 1].lng,
      path[i].lat,
      path[i].lng
    );
  }
  return total;
}

/**
 * Formats distance in km or meters nicely.
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

/**
 * Formats elapsed seconds to HH:MM:SS or MM:SS.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Formats a timestamp into human-readable Spanish date & time.
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Compresses an image file before saving to base64 to preserve storage and performance.
 */
export function compressImageFile(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Error al decodificar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

// Initial sample route along scenic points of interest
export const INITIAL_SAMPLE_SESSION: RouteSession = {
  id: 'sample-coastal-route',
  name: 'Ruta Costera y Miradores',
  startedAt: Date.now() - 3600 * 1000 * 2,
  isTracking: false,
  isPaused: false,
  totalDistanceKm: 4.85,
  path: [
    { lat: 42.8805, lng: -9.2810, timestamp: Date.now() - 7200000 },
    { lat: 42.8835, lng: -9.2801, timestamp: Date.now() - 6900000 },
    { lat: 42.8860, lng: -9.2785, timestamp: Date.now() - 6600000 },
    { lat: 42.8895, lng: -9.2760, timestamp: Date.now() - 6200000 },
    { lat: 42.8930, lng: -9.2740, timestamp: Date.now() - 5800000 },
    { lat: 42.8970, lng: -9.2725, timestamp: Date.now() - 5300000 },
    { lat: 42.9010, lng: -9.2710, timestamp: Date.now() - 4800000 },
    { lat: 42.9045, lng: -9.2700, timestamp: Date.now() - 4200000 },
    { lat: 42.9075, lng: -9.2720, timestamp: Date.now() - 3600000 },
    { lat: 42.9110, lng: -9.2750, timestamp: Date.now() - 3000000 },
    { lat: 42.9140, lng: -9.2780, timestamp: Date.now() - 2400000 },
  ],
  stops: [
    {
      id: 'stop-1',
      name: 'Mirador del Cabo',
      visitFrequency: 'Mensual',
      photos: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80'
      ],
      notes: 'Llegada al atardecer. Brisa marina agradable y vista panorámica del horizonte. Ideal para desconectar y pasear.',
      lat: 42.8835,
      lng: -9.2801,
      createdAt: Date.now() - 6900000,
      distanceFromStartKm: 0.35,
    },
    {
      id: 'stop-2',
      name: 'Punto de Descanso La Ensenada',
      visitFrequency: 'Semanal',
      photos: [
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1000&q=80'
      ],
      notes: 'Punto intermedio de la ruta. Gran panorámica de los acantilados. Me gusta venir semanalmente a caminar y observar las olas.',
      lat: 42.8970,
      lng: -9.2725,
      createdAt: Date.now() - 5300000,
      distanceFromStartKm: 2.15,
    },
    {
      id: 'stop-3',
      name: 'Entrada a la Ría',
      visitFrequency: 'Quincenal',
      photos: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
      ],
      notes: 'Punto final del recorrido. Zona muy tranquila con barcas tradicionales. Perfecto para descansar tras la caminata.',
      lat: 42.9140,
      lng: -9.2780,
      createdAt: Date.now() - 2400000,
      distanceFromStartKm: 4.85,
    }
  ]
};
