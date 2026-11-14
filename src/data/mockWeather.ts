/**
 * Weather display model for the Home screen card.
 * (File name is historical — nothing here is mock data. Values are filled from the
 * live backend by `transformCurrentStateToWeather`; missing values stay null.)
 */

export interface WeatherData {
  /** Sea state derived from the backend risk category. */
  seaState: 'calm' | 'moderate' | 'rough' | 'unknown';
  riskScore: number | null;
  riskCategory: string | null;
  windSpeed: number | null;
  windUnit: string;
  waveHeight: number | null;
  waveUnit: string;
  seaTemp: number | null;
  chlorophyll: number | null;
  chlorophyllUnit: string;
  /** Age of the wind/wave reading, e.g. "25 min". */
  marineAge: string | null;
  marineStale: boolean;
  marineSource: string | null;
  /** Date of the satellite pass behind sea temperature / chlorophyll. */
  satelliteDate: string | null;
  satelliteStale: boolean;
  location: string;
}
