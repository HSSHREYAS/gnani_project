/**
 * MatsyaMitra API Configuration.
 */

import { Platform } from 'react-native';

// Development: the backend runs on the laptop. Both the emulator and a USB-connected
// phone reach it as localhost:8000 through `adb reverse tcp:8000 tcp:8000`
// (quick-start.ps1 and phone-setup.ps1 set this up). `Platform` is kept for future
// per-platform hosts.
const DEFAULT_DEV_HOST = Platform.OS === 'android' ? 'http://localhost:8000' : 'http://localhost:8000';

export const API_CONFIG = {
  BASE_URL: DEFAULT_DEV_HOST,
  TIMEOUT_MS: 8000,
  ENDPOINTS: {
    HEALTH: '/api/v1/health',
    CURRENT_STATE: '/api/v1/current-state',
    CURRENT_STATE_BY_LOCATION: (locId: string) => `/api/v1/current-state/${encodeURIComponent(locId)}`,
    ADVISORIES: '/api/v1/advisories',
    ALERTS: '/api/v1/alerts',
    VOICE_QUERY: '/api/v1/voice/query',
    VOICE_TEXT_QUERY: '/api/v1/voice/text-query',
    VOICE_HEALTH: '/api/v1/voice/health',
    VOICE_SPEAK: '/api/v1/voice/speak',
  },
};

let currentBaseUrl = API_CONFIG.BASE_URL;

export function setApiBaseUrl(newUrl: string): void {
  currentBaseUrl = newUrl.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  return currentBaseUrl;
}
