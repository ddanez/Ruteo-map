export interface GeoPoint {
  lat: number;
  lng: number;
  timestamp: number;
  altitude?: number | null;
  speed?: number | null;
  accuracy?: number | null;
}

export type VisitFrequency =
  | 'Diario'
  | 'Semanal'
  | 'Quincenal'
  | 'Mensual'
  | 'Ocasional'
  | 'Anual'
  | 'Primera vez'
  | 'Personalizada';

export interface RouteStop {
  id: string;
  name: string;
  visitFrequency: VisitFrequency | string;
  customFrequency?: string;
  photos: string[]; // Base64 or Object URLs
  notes: string; // Comentarios personales
  lat: number;
  lng: number;
  createdAt: number;
  distanceFromStartKm?: number;
  tags?: string[];
}

export interface RouteSession {
  id: string;
  name: string;
  startedAt: number;
  isTracking: boolean;
  isPaused: boolean;
  path: GeoPoint[];
  stops: RouteStop[];
  totalDistanceKm: number;
}
