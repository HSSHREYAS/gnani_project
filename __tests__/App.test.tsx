/**
 * Live-data guarantees: the UI models must carry only what the backend sent.
 * A reading the backend does not have stays null (shown as "—" in the app) —
 * it is never replaced by a default number.
 *
 * @format
 */

import {
  transformAlertsToUI,
  transformCurrentStateToWeather,
  transformCurrentStatesToRiskZones,
  transformIncoisToFishingZones,
} from '../src/services/api/transformers';
import type {
  AlertResponse,
  CurrentStateResponse,
  IncoisAdvisoryResponse,
} from '../src/services/api/types';

const baseState: CurrentStateResponse = {
  sampling_location_id: 18,
  location_id: 'KARN_018',
  city_name: 'Malpe',
  latitude: 13.35,
  longitude: 74.4,
  pfz: null,
  risk: null,
};

test('weather card model has no invented values when the backend has no readings', () => {
  const weather = transformCurrentStateToWeather(baseState);
  expect(weather.seaState).toBe('unknown');
  expect(weather.windSpeed).toBeNull();
  expect(weather.waveHeight).toBeNull();
  expect(weather.riskScore).toBeNull();
  expect(weather.seaTemp).toBeNull();
  expect(weather.chlorophyll).toBeNull();
  expect(weather.marineStale).toBe(true);
});

test('weather card model passes live readings through and flags stale ones', () => {
  const weather = transformCurrentStateToWeather({
    ...baseState,
    risk: {
      score: 6.8,
      category: 'High Risk',
      confidence: 100,
      observation_timestamp: '2026-11-12T10:00:00Z',
      source: 'open-meteo',
      age_hours: 30,
      status: 'STALE',
      wind_speed: 10,
      wave_height: 2.44,
    },
  });
  expect(weather.seaState).toBe('rough');
  expect(weather.windSpeed).toBe(36); // 10 m/s -> km/h
  expect(weather.waveHeight).toBe(2.4);
  expect(weather.riskScore).toBe(6.8);
  expect(weather.marineStale).toBe(true);
  expect(weather.marineAge).toBe('30 hr');
});

test('risk zones are only created for locations that have a live risk score', () => {
  expect(transformCurrentStatesToRiskZones([baseState])).toEqual([]);
});

test('INCOIS zones carry no made-up score, temperature or species', () => {
  const advisory: IncoisAdvisoryResponse = {
    id: 1,
    advisory_date: '2026-11-12',
    sector_id: 'SEC004',
    landing_center: 'Malpe',
    city_name: 'Malpe',
    bearing_degrees: 270,
    distance_km: 40,
    depth_m: 55,
    latitude: 13.35,
    longitude: 74.35,
    raw_text: null,
    nearest_sampling_location_id: 18,
    distance_to_nearest_km: 5,
  };
  const [zone] = transformIncoisToFishingZones([advisory], [baseState]);
  expect(zone.potential).toBeNull();
  expect(zone.sst).toBeNull();
  expect(zone.chlorophyll).toBeNull();
  expect(zone.species).toEqual([]);
  expect(zone.advisoryDate).toBe('2026-11-12');
  expect(zone.depthM).toBe(55);
});

test('alerts get a Kannada rendering built from their own figures', () => {
  const alert: AlertResponse = {
    id: 'incois-1',
    severity: 'info',
    badge_label: 'PFZ ADVISORY',
    title: 'Potential Fishing Zone: Malpe',
    body: 'INCOIS bulletin announces PFZ near Malpe.',
    source: 'INCOIS',
    timestamp: '2026-11-12',
    icon: 'fish',
    category: 'advisory',
    location_id: null,
    city_name: 'Malpe',
    latitude: 13.35,
    longitude: 74.35,
    kind: 'pfz',
    distance_km: 40,
    bearing_degrees: 270,
    depth_m: 55,
  };
  const [item] = transformAlertsToUI([alert]);
  expect(item.kn?.title).toContain('ಮಲ್ಪೆ');
  expect(item.kn?.body).toContain('40.0');
  expect(item.kn?.body).toContain('55');
  expect(item.latitude).toBe(13.35);
});
