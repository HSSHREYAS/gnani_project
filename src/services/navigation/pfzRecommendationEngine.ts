/**
 * PFZ Recommendation Engine (Karnataka Coast).
 *
 * Every time the fisher picks a departure port, all live fishing zones are scored
 * again FOR THAT PORT and the best five are returned in rank order; the first three
 * are the "top picks" the map highlights.
 *
 * Candidates (all live, never sample data):
 *   - official INCOIS bulletin zones, and
 *   - the app's own satellite-scored zones along the coast, but only those the
 *     model rates at least "moderate" — a low-scoring patch of sea is not suggested.
 *
 * Score = distance from the port (shorter run = less diesel, back sooner)
 *       + satellite suitability, with a small preference for official INCOIS zones.
 *
 * The app has no vessel-tracking feed, so fleet crowding is deliberately NOT part
 * of the ranking and no boat counts are shown.
 */

import type { FishingZone } from '../../data/mockZones';
import {
  calculateHaversineDistanceKm,
  generateRealisticSeaRoute,
  type RealisticSeaRoute,
  type GeoPoint,
} from './nauticalRoutingEngine';

export interface RecommendedPfzZone {
  /** 1 = best for this port. */
  rank: number;
  /** True for the highlighted top picks (ranks 1–3). */
  isTopPick: boolean;
  zone: FishingZone;
  /** Composite 0–100 ranking score. */
  score: number;
  distanceKm: number;
  distanceNm: number;
  realisticRoute: RealisticSeaRoute;
}

/** Zones farther than this from the port are only suggested when nothing closer exists. */
export const PRACTICAL_RANGE_KM = 150;
export const MAX_RECOMMENDATIONS = 5;
export const TOP_PICK_COUNT = 3;

const DISTANCE_WEIGHT = 0.55;
const SUITABILITY_WEIGHT = 0.45;
/** Neutral suitability used for ranking only when a zone has no satellite score. */
const NEUTRAL_SUITABILITY = 50;
/** Extra points for a zone published in an official INCOIS bulletin. */
const OFFICIAL_BONUS = 10;
/** Satellite-model zones below this suitability (0–100) are not offered as fishing spots. */
const MIN_MODEL_SUITABILITY = 45;

export function getRecommendedZones(
  allZones: FishingZone[],
  departurePort: {
    id: string;
    name: string;
    coordinates: GeoPoint;
  },
  limit: number = MAX_RECOMMENDATIONS,
): RecommendedPfzZone[] {
  if (!allZones || allZones.length === 0) {
    return [];
  }

  const candidates = allZones.filter(
    (zone) => zone.source !== 'model' || (zone.potential !== null && zone.potential >= MIN_MODEL_SUITABILITY),
  );

  const scored = candidates.map((zone) => {
    const distKm = calculateHaversineDistanceKm(departurePort.coordinates, zone.center);
    // 100 at the harbour mouth, falling linearly to 0 at the edge of practical range.
    const distanceScore = Math.max(0, Math.min(100, 100 - (distKm / PRACTICAL_RANGE_KM) * 100));
    const suitability = zone.potential ?? NEUTRAL_SUITABILITY;
    const composite =
      distanceScore * DISTANCE_WEIGHT +
      suitability * SUITABILITY_WEIGHT +
      (zone.source === 'model' ? 0 : OFFICIAL_BONUS);
    return { zone, distKm, composite: parseFloat(composite.toFixed(1)) };
  });

  // Prefer zones a day boat can actually reach; top up with the nearest others if needed.
  const inRange = scored
    .filter((item) => item.distKm <= PRACTICAL_RANGE_KM)
    .sort((a, b) => b.composite - a.composite);
  const outOfRange = scored
    .filter((item) => item.distKm > PRACTICAL_RANGE_KM)
    .sort((a, b) => a.distKm - b.distKm);
  const best = [...inRange, ...outOfRange].slice(0, Math.max(1, limit));

  return best.map((item, index) => {
    const realisticRoute = generateRealisticSeaRoute({
      originPortId: departurePort.id,
      originPortName: departurePort.name,
      originCoords: departurePort.coordinates,
      targetPfzId: item.zone.id,
      targetPfzName: item.zone.name,
      targetPfzCoords: item.zone.center,
    });

    return {
      rank: index + 1,
      isTopPick: index < TOP_PICK_COUNT,
      zone: item.zone,
      score: item.composite,
      distanceKm: parseFloat(item.distKm.toFixed(1)),
      distanceNm: parseFloat((item.distKm / 1.852).toFixed(1)),
      realisticRoute,
    };
  });
}

/** The three highlighted picks only (kept for callers that just need the top picks). */
export function getTop3RecommendedZones(
  allZones: FishingZone[],
  departurePort: { id: string; name: string; coordinates: GeoPoint },
): RecommendedPfzZone[] {
  return getRecommendedZones(allZones, departurePort, TOP_PICK_COUNT);
}
