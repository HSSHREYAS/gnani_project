/**
 * MatsyaMitra API HTTP Client.
 */

import { API_CONFIG, getApiBaseUrl } from './config';
import type {
  AlertResponse,
  CurrentStateResponse,
  HealthResponse,
  IncoisAdvisoryResponse,
  VoiceQueryResponse,
} from './types';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchWithTimeout<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = API_CONFIG.TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal as any,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson: any = await response.json();
        if (errorJson?.detail) {
          errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Fall back to status text if body not json
      }
      throw new ApiError(errorMessage, response.status);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error?.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs / 1000}s to ${endpoint}`);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error?.message || 'Network connection failed. Backend might be unreachable.');
  }
}


async function fetchMultipartWithTimeout<T>(
  endpoint: string,
  body: FormData,
  timeoutMs: number = 120000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: body as any,
      signal: controller.signal as any,
    });
    if (!response.ok) {
      let message = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const payload: any = await response.json();
        if (payload?.detail) {
          message = typeof payload.detail === 'string' ? payload.detail : JSON.stringify(payload.detail);
        }
      } catch {
        // Keep the HTTP status fallback.
      }
      throw new ApiError(message, response.status);
    }
    return (await response.json()) as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError') throw new ApiError('Voice request timed out. Please try a shorter recording.');
    throw new ApiError(error?.message || 'Voice request failed. Check your network connection.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  /** Health check */
  getHealth(): Promise<HealthResponse> {
    return fetchWithTimeout<HealthResponse>(API_CONFIG.ENDPOINTS.HEALTH);
  },

  /** Get all 25 canonical sampling locations current state */
  getCurrentStates(): Promise<CurrentStateResponse[]> {
    return fetchWithTimeout<CurrentStateResponse[]>(API_CONFIG.ENDPOINTS.CURRENT_STATE);
  },

  /** Get current state for a single canonical location */
  getCurrentStateByLocation(locationId: string): Promise<CurrentStateResponse> {
    return fetchWithTimeout<CurrentStateResponse>(API_CONFIG.ENDPOINTS.CURRENT_STATE_BY_LOCATION(locationId));
  },

  /** Get INCOIS advisories with optional landing center filter */
  getAdvisories(landing?: string): Promise<IncoisAdvisoryResponse[]> {
    const query = landing ? `?landing=${encodeURIComponent(landing)}` : '';
    return fetchWithTimeout<IncoisAdvisoryResponse[]>(`${API_CONFIG.ENDPOINTS.ADVISORIES}${query}`);
  },

  /** Get live aggregated alerts */
  getAlerts(): Promise<AlertResponse[]> {
    return fetchWithTimeout<AlertResponse[]>(API_CONFIG.ENDPOINTS.ALERTS);
  },

  /** Send a text-only Kannada/English question for testing and accessibility. */
  queryVoiceText(text: string, locationId: string, includeAudio: boolean = true, languageHint: string = 'kn-IN'): Promise<VoiceQueryResponse> {
    return fetchWithTimeout<VoiceQueryResponse>(API_CONFIG.ENDPOINTS.VOICE_TEXT_QUERY, {
      method: 'POST',
      body: JSON.stringify({ text, location_id: locationId, include_audio: includeAudio, language_hint: languageHint }),
    }, 45000);
  },

  /** Upload a short audio recording; FormData manages its own multipart boundary. */
  queryVoiceAudio(uri: string, locationId: string, languageHint: string = 'kn-IN'): Promise<VoiceQueryResponse> {
    const body = new FormData();
    body.append('audio_file', {
      uri,
      name: 'matsyamitra-query.m4a',
      type: 'audio/mp4',
    } as any);
    body.append('location_id', locationId);
    body.append('include_audio', 'true');
    body.append('language_hint', languageHint);
    return fetchMultipartWithTimeout<VoiceQueryResponse>(API_CONFIG.ENDPOINTS.VOICE_QUERY, body);
  },

  /** Have the backend read a short Kannada text aloud (Gnani TTS). */
  speakKannada(text: string): Promise<{ audio_url: string | null; audio_error: string | null }> {
    return fetchWithTimeout(API_CONFIG.ENDPOINTS.VOICE_SPEAK, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }, 45000);
  },

  /** Resolve an ephemeral server-generated WAV URL. */
  getVoiceAudioUrl(path: string): string {
    return path.startsWith('http') ? path : `${getApiBaseUrl()}${path}`;
  },
};
