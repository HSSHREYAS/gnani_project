/**
 * Map zone models. (File name is historical — the app renders only live zones built
 * from the backend; there is no sample data in here any more.)
 */

export interface NavigationVector {
  originPortName: string;
  originPortCoordinates: { latitude: number; longitude: number };
  bearingDegrees: number;
  distanceKm: number;
  depthM: number;
}

export interface FishingZone {
  id: string;
  name: string;
  sectorCode: string;
  region: string;
  /** Satellite suitability 0–100, or null when the model has no score for this zone. */
  potential: number | null;
  chlorophyll: number | null;
  chlorophyllStatus: 'optimal' | 'moderate' | 'low';
  sst: number | null;
  sstStatus: string;
  coordinates: { latitude: number; longitude: number }[];
  center: { latitude: number; longitude: number };
  fishingIntelligence: string;
  species: string[];
  /** Bulletin / observation date the zone comes from. */
  advisoryDate?: string | null;
  depthM?: number | null;
  source?: 'incois' | 'model';
  navigationVector?: NavigationVector;
}

export interface RiskZone {
  id: string;
  name: string;
  riskLevel: 'critical' | 'moderate' | 'low';
  /** metres */
  waveHeight: number | null;
  /** km/h */
  windSpeed: number | null;
  score?: number | null;
  category?: string;
  ageLabel?: string | null;
  isStale?: boolean;
  description: string;
  center: { latitude: number; longitude: number };
  radius: number; // in meters
}

export const mapInitialRegion = {
  latitude: 13.90,
  longitude: 73.90,
  latitudeDelta: 2.2,
  longitudeDelta: 2.2,
};

export default { mapInitialRegion };
