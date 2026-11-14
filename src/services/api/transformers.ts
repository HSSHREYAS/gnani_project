/**
 * Data Transformers — Maps backend API response schemas into frontend UI data models.
 */

import type { Advisory, AdvisorySeverity } from '../../data/mockAdvisory';
import type { AlertItem, AlertSeverity } from '../../data/mockAlerts';
import type { FishingZone, RiskZone } from '../../data/mockZones';
import type { WeatherData } from '../../data/mockWeather';
import { getCanonicalCityName, getLandingCenterCoordinates, generatePfzPolygon, localizeCityName } from './canonicalLocations';
import type {
  AlertResponse,
  CurrentStateResponse,
  IncoisAdvisoryResponse,
} from './types';

export type { AlertItem, AlertSeverity, Advisory, AdvisorySeverity, FishingZone, RiskZone, WeatherData };

/** Human-readable age of an observation ("12 min", "3 hr", "5 days"). */
export function formatAge(ageHours: number | null | undefined): string | null {
  if (ageHours === null || ageHours === undefined || !isFinite(ageHours)) return null;
  if (ageHours < 1) return `${Math.max(1, Math.round(ageHours * 60))} min`;
  if (ageHours < 48) return `${Math.round(ageHours)} hr`;
  return `${Math.round(ageHours / 24)} days`;
}

/**
 * Maps a single CurrentStateResponse to WeatherCard display model.
 * Every value comes straight from the backend; anything the backend does not
 * have is passed through as null so the UI shows "—" instead of an invented number.
 */
export function transformCurrentStateToWeather(
  state: CurrentStateResponse,
  locationName?: string
): WeatherData {
  const pfz = state.pfz;
  const risk = state.risk;
  const cityName = getCanonicalCityName(state.location_id, state.city_name);

  let seaState: WeatherData['seaState'] = 'unknown';
  if (risk && risk.score !== null) {
    if (risk.category === 'Safe' || risk.category === 'Low Risk') seaState = 'calm';
    else if (risk.category === 'Moderate Risk') seaState = 'moderate';
    else if (risk.category === 'High Risk' || risk.category === 'Extreme Risk') seaState = 'rough';
  }

  const num = (v: number | null | undefined, digits: number): number | null =>
    v === null || v === undefined || !isFinite(v) ? null : parseFloat(v.toFixed(digits));

  return {
    seaState,
    riskScore: num(risk?.score, 1),
    riskCategory: risk?.category ?? null,
    windSpeed: risk?.wind_speed !== null && risk?.wind_speed !== undefined ? Math.round(risk.wind_speed * 3.6) : null,
    windUnit: 'km/h',
    waveHeight: num(risk?.wave_height, 1),
    waveUnit: 'm',
    seaTemp: num(pfz?.sst, 1),
    chlorophyll: num(pfz?.chlorophyll, 2),
    chlorophyllUnit: 'mg/m³',
    marineAge: risk ? formatAge(risk.age_hours) : null,
    marineStale: !risk || risk.status !== 'CURRENT',
    marineSource: risk?.source ?? null,
    satelliteDate: pfz?.observation_date ?? null,
    satelliteStale: !pfz || pfz.status !== 'CURRENT',
    location: locationName || `${cityName} (${state.latitude.toFixed(2)}°N, ${state.longitude.toFixed(2)}°E)`,
  };
}

/**
 * Returns cardinal compass direction for a bearing angle.
 */
export function getCompassHeading(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
}

/**
 * Transforms real INCOIS advisory bulletins into rich FishingZone models with navigation vectors.
 */
export function transformIncoisToFishingZones(
  advisories: IncoisAdvisoryResponse[],
  states?: CurrentStateResponse[]
): FishingZone[] {
  if (!advisories || advisories.length === 0) {
    return [];
  }

  // Map canonical states by sampling_location_id for rapid telemetry lookup
  const stateByLocId = new Map<number, CurrentStateResponse>();
  if (states) {
    for (const s of states) {
      stateByLocId.set(s.sampling_location_id, s);
    }
  }

  return advisories.map((adv, index) => {
    const matchedState = adv.nearest_sampling_location_id
      ? stateByLocId.get(adv.nearest_sampling_location_id)
      : undefined;

    const pfzTelemetry = matchedState?.pfz;
    const sst = pfzTelemetry?.sst ?? null;
    const chlorophyll = pfzTelemetry?.chlorophyll ?? null;

    // Satellite suitability score of the nearest sampling point (0–100), when the model has one.
    // INCOIS itself publishes a location, not a percentage, so there is no value to show otherwise.
    const potential =
      pfzTelemetry?.score !== null && pfzTelemetry?.score !== undefined
        ? Math.round(Math.min(100, Math.max(0, pfzTelemetry.score * 10)))
        : null;

    const bearing = adv.bearing_degrees;
    const distKm = adv.distance_km;
    const depth = adv.depth_m;
    const portName = adv.landing_center || getCanonicalCityName(
      adv.nearest_sampling_location_id ? `KARN_${String(adv.nearest_sampling_location_id).padStart(3, '0')}` : null,
      adv.city_name
    );
    const portCoords = getLandingCenterCoordinates(portName);

    const bulletinParts = [
      bearing !== null && bearing !== undefined ? `${bearing.toFixed(0)}° (${getCompassHeading(bearing)})` : null,
      distKm !== null && distKm !== undefined ? `${distKm.toFixed(1)} km from ${portName}` : null,
      depth !== null && depth !== undefined ? `${depth.toFixed(0)} m depth` : null,
    ].filter(Boolean);

    return {
      id: `incois-pfz-${adv.id}`,
      name: `${portName} Fishing Ground`,
      sectorCode: adv.sector_id || 'SEC004',
      region: 'Karnataka Continental Shelf',
      potential,
      chlorophyll: chlorophyll !== null ? parseFloat(chlorophyll.toFixed(2)) : null,
      chlorophyllStatus: potential === null ? 'moderate' : potential >= 70 ? 'optimal' : potential < 40 ? 'low' : 'moderate',
      sst: sst !== null ? parseFloat(sst.toFixed(1)) : null,
      sstStatus: pfzTelemetry?.category ? pfzTelemetry.category.toUpperCase() : '',
      coordinates: generatePfzPolygon(adv.latitude, adv.longitude, index),
      center: { latitude: adv.latitude, longitude: adv.longitude },
      fishingIntelligence: `INCOIS bulletin ${adv.advisory_date}${bulletinParts.length ? `: ${bulletinParts.join(', ')}` : ''}.`,
      species: [],
      advisoryDate: adv.advisory_date,
      depthM: depth ?? null,
      source: 'incois',
      navigationVector:
        bearing !== null && bearing !== undefined && distKm !== null && distKm !== undefined
          ? {
              originPortName: portName,
              originPortCoordinates: portCoords,
              bearingDegrees: bearing,
              distanceKm: distKm,
              depthM: depth ?? 0,
            }
          : undefined,
    };
  });
}

/**
 * Transforms all 25 canonical current states into FishingZone items for MapScreen.
 */
export function transformCurrentStatesToFishingZones(
  states: CurrentStateResponse[]
): FishingZone[] {
  return states
    .filter((s) => s.pfz !== null && s.pfz.score !== null)
    .map((s, index) => {
      const pfz = s.pfz!;
      const potential = Math.round(Math.min(100, Math.max(0, (pfz.score ?? 0) * 10)));
      const displayName = getCanonicalCityName(s.location_id, s.city_name);

      let chStatus: 'optimal' | 'moderate' | 'low' = 'moderate';
      if (potential >= 70) chStatus = 'optimal';
      else if (potential < 40) chStatus = 'low';

      return {
        id: `pfz-loc-${s.location_id}`,
        name: /offshore|deep sea|coast/i.test(displayName) ? displayName : `${displayName} Offshore`,
        sectorCode: `Zone ${displayName}`,
        region: 'Karnataka Coast',
        potential,
        chlorophyll:
          pfz.chlorophyll !== null && pfz.chlorophyll !== undefined
            ? parseFloat(pfz.chlorophyll.toFixed(2))
            : null,
        chlorophyllStatus: chStatus,
        sst: pfz.sst !== null && pfz.sst !== undefined ? parseFloat(pfz.sst.toFixed(1)) : null,
        sstStatus: pfz.category.toUpperCase(),
        coordinates: generatePfzPolygon(s.latitude, s.longitude, index),
        center: { latitude: s.latitude, longitude: s.longitude },
        fishingIntelligence: `PFZ Score: ${pfz.score?.toFixed(1)}/10 (${pfz.category}) near ${displayName}. Source: ${pfz.source.toUpperCase()}. Data status: ${pfz.status} (Age: ${pfz.age_hours.toFixed(0)}h). Confidence: ${(pfz.confidence <= 1 ? pfz.confidence * 100 : pfz.confidence).toFixed(0)}%.`,
        species: [],
        advisoryDate: pfz.observation_date,
        depthM: null,
        source: 'model',
      };
    });
}

/**
 * Transforms all 25 canonical current states into RiskZone items for MapScreen.
 */
export function transformCurrentStatesToRiskZones(
  states: CurrentStateResponse[]
): RiskZone[] {
  return states
    .filter((s) => s.risk !== null && s.risk.score !== null)
    .map((s) => {
      const risk = s.risk!;
      const displayName = getCanonicalCityName(s.location_id, s.city_name);
      let riskLevel: 'critical' | 'moderate' | 'low' = 'low';
      let desc = `Risk score: ${risk.score?.toFixed(1)}/10 (${risk.category}) near ${displayName}. Normal marine operations.`;

      if (risk.category === 'High Risk' || risk.category === 'Extreme Risk') {
        riskLevel = 'critical';
        desc = `Critical wave/wind hazards near ${displayName}. Risk score: ${risk.score?.toFixed(1)}/10 (${risk.category}).`;
      } else if (risk.category === 'Moderate Risk') {
        riskLevel = 'moderate';
        desc = `Moderate swell conditions near ${displayName}. Score: ${risk.score?.toFixed(1)}/10. Caution advised.`;
      }

      return {
        id: `risk-loc-${s.location_id}`,
        name: `${displayName}`,
        riskLevel,
        waveHeight:
          risk.wave_height !== null && risk.wave_height !== undefined
            ? parseFloat(risk.wave_height.toFixed(1))
            : null,
        windSpeed:
          risk.wind_speed !== null && risk.wind_speed !== undefined
            ? Math.round(risk.wind_speed * 3.6)
            : null,
        score: risk.score,
        category: risk.category,
        ageLabel: formatAge(risk.age_hours),
        isStale: risk.status !== 'CURRENT',
        description: desc,
        center: { latitude: s.latitude, longitude: s.longitude },
        radius: riskLevel === 'critical' ? 14000 : riskLevel === 'moderate' ? 10000 : 7000,
      };
    });
}

/**
 * Transforms INCOIS advisory responses to HomeScreen Advisory model.
 */
export function transformIncoisAdvisoriesToUI(
  advisories: IncoisAdvisoryResponse[]
): Advisory[] {
  if (!advisories || advisories.length === 0) {
    return [];
  }

  return advisories.map((adv) => {
    const distStr = adv.distance_km ? `${adv.distance_km.toFixed(1)} km` : '';
    const bearingStr = adv.bearing_degrees ? `${adv.bearing_degrees.toFixed(0)}°` : '';
    const depthStr = adv.depth_m ? `${adv.depth_m.toFixed(0)}m depth` : '';
    const navDetails = [distStr, bearingStr, depthStr].filter(Boolean).join(' • ');

    const targetCity = getCanonicalCityName(
      adv.nearest_sampling_location_id
        ? `KARN_${String(adv.nearest_sampling_location_id).padStart(3, '0')}`
        : null,
      adv.city_name || adv.landing_center
    );

    return {
      id: `incois-adv-${adv.id}`,
      severity: 'safe' as AdvisorySeverity,
      badgeLabel: 'PFZ ACTIVE',
      title: `${targetCity}`,
      description: `Potential Fishing Zone near ${targetCity} (${adv.latitude.toFixed(2)}°N, ${adv.longitude.toFixed(2)}°E)${navDetails ? ` • ${navDetails}` : ''}.`,
      subLabel: adv.advisory_date ? `BULLETIN: ${adv.advisory_date}` : 'INCOIS ADVISORY',
      subIcon: 'check-circle-outline',
      place: targetCity,
      date: adv.advisory_date ?? null,
      bearingDeg: adv.bearing_degrees,
      depthM: adv.depth_m,
      latitude: adv.latitude,
      longitude: adv.longitude,
    };
  });
}

/**
 * Transforms AlertResponse items into AlertItem model for AlertsScreen.
 */
export function transformAlertsToUI(alerts: AlertResponse[]): AlertItem[] {
  return alerts.map((a) => {
    let severity: AlertSeverity = 'info';
    if (a.severity === 'urgent') severity = 'urgent';
    else if (a.severity === 'caution') severity = 'caution';
    else if (a.severity === 'seasonal') severity = 'seasonal';

    let category: 'official' | 'weather' | 'advisory' | 'news' = 'weather';
    if (a.category === 'advisory') category = 'advisory';
    else if (a.category === 'official') category = 'official';
    else if (a.category === 'news') category = 'news';

    // Sanitize any internal KARN_XXX in alert title or body
    let title = a.title || '';
    let body = a.body || '';
    title = title.replace(/KARN_(\d{3})/gi, (match) => getCanonicalCityName(match.toUpperCase(), match));
    body = body.replace(/KARN_(\d{3})/gi, (match) => getCanonicalCityName(match.toUpperCase(), match));
    if (a.location_id) {
      const cityName = getCanonicalCityName(a.location_id, a.city_name);
      title = title.replace(new RegExp(a.location_id, 'gi'), cityName);
      body = body.replace(new RegExp(a.location_id, 'gi'), cityName);
    }

    // Kannada rendering, built only from the alert's own structured figures.
    let kn: AlertItem['kn'];
    const placeKn = localizeCityName(getCanonicalCityName(a.location_id, a.city_name), 'kn');
    const has = (v: number | null | undefined): v is number => v !== null && v !== undefined && isFinite(v);
    if (a.kind === 'pfz') {
      const parts = [
        has(a.distance_km) ? `ದೂರ ${a.distance_km.toFixed(1)} ಕಿ.ಮೀ` : '',
        has(a.bearing_degrees) ? `ದಿಕ್ಕು ${a.bearing_degrees.toFixed(0)}° (${getCompassHeading(a.bearing_degrees)})` : '',
        has(a.depth_m) ? `ಆಳ ${a.depth_m.toFixed(0)} ಮೀ` : '',
      ].filter(Boolean);
      kn = {
        badgeLabel: 'ಮೀನು ವಲಯ',
        title: `ಮೀನುಗಾರಿಕೆ ವಲಯ: ${placeKn}`,
        body: `INCOIS ಪ್ರಕಟಣೆ: ${placeKn} ಸಮೀಪ ಮೀನು ಸಿಗುವ ಸಾಧ್ಯತೆಯ ವಲಯ.${parts.length ? ` ${parts.join(', ')}.` : ''}`,
      };
    } else if (a.kind === 'risk_high' || a.kind === 'risk_moderate') {
      const parts = [
        has(a.risk_score) ? `ಅಪಾಯದ ಅಂಕ ${a.risk_score.toFixed(1)}/10` : '',
        has(a.wind_speed) ? `ಗಾಳಿ ${Math.round(a.wind_speed * 3.6)} ಕಿ.ಮೀ/ಗಂ` : '',
        has(a.wave_height) ? `ಅಲೆ ${a.wave_height.toFixed(1)} ಮೀ` : '',
      ].filter(Boolean);
      const high = a.kind === 'risk_high';
      kn = {
        badgeLabel: high ? 'ಅಪಾಯ' : 'ಎಚ್ಚರಿಕೆ',
        title: high ? `ಸಮುದ್ರ ಪ್ರಕ್ಷುಬ್ಧ: ${placeKn}` : `ಅಲೆ ಎಚ್ಚರಿಕೆ: ${placeKn}`,
        body: `${parts.join(', ')}${parts.length ? '. ' : ''}${
          high ? 'ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯಬೇಡಿ.' : 'ಸಣ್ಣ ದೋಣಿಗಳು ಎಚ್ಚರಿಕೆ ವಹಿಸಿ.'
        }`,
      };
    }

    return {
      kn,
      id: a.id,
      severity,
      badgeLabel: a.badge_label || severity.toUpperCase(),
      title,
      body,
      source: a.source,
      timestamp: a.timestamp,
      icon: a.icon || 'alert-circle',
      category,
      latitude: a.latitude,
      longitude: a.longitude,
    };
  });
}
