/**
 * Device location store — single source of truth for the phone's real GPS position.
 *
 * Fixes come from the phone's GPS through @react-native-community/geolocation,
 * are kept in memory, and are persisted so the SOS screen can show the last known
 * position (with its age) even before a fresh fix arrives.
 * Nothing in here is ever fabricated: when there is no fix, `getLastFix()` is null.
 */

import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';

export interface GpsFix {
  latitude: number;
  longitude: number;
  /** Horizontal accuracy in metres, when the device reports it. */
  accuracy: number | null;
  /** Speed over ground in m/s, when the device reports it. */
  speed: number | null;
  /** Course over ground in degrees, when the device reports it. */
  heading: number | null;
  /** Epoch milliseconds of the fix. */
  timestamp: number;
}

const STORAGE_KEY = '@matsyamitra_last_gps_fix';
const PERSIST_EVERY_MS = 30 * 1000;

let lastFix: GpsFix | null = null;
let lastPersistedAt = 0;
let hydrated = false;
const listeners = new Set<(fix: GpsFix | null) => void>();

function notify(): void {
  listeners.forEach((listener) => listener(lastFix));
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw && !lastFix) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number') {
        lastFix = parsed;
        notify();
      }
    }
  } catch {
    // No stored fix — stay null.
  }
}

/** Ask for precise location permission. Returns true when granted. */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'MatsyaMitra location',
        message:
          'MatsyaMitra uses your GPS position to show your boat on the map, guide you to fishing zones and share your position in an emergency.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  } catch {
    return false;
  }
}

/** Record a real fix reported by the device. */
export function reportFix(coordinate: {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
} | null | undefined): void {
  if (!coordinate) return;
  const { latitude, longitude } = coordinate;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
  if (!isFinite(latitude) || !isFinite(longitude)) return;
  if (latitude === 0 && longitude === 0) return;

  lastFix = {
    latitude,
    longitude,
    accuracy: typeof coordinate.accuracy === 'number' && coordinate.accuracy >= 0 ? coordinate.accuracy : null,
    speed: typeof coordinate.speed === 'number' && coordinate.speed >= 0 ? coordinate.speed : null,
    heading: typeof coordinate.heading === 'number' && coordinate.heading >= 0 ? coordinate.heading : null,
    timestamp: Date.now(),
  };
  notify();

  if (lastFix.timestamp - lastPersistedAt > PERSIST_EVERY_MS) {
    lastPersistedAt = lastFix.timestamp;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lastFix)).catch(() => {});
  }
}

let watchers = 0;
let watchId: number | null = null;

/**
 * Start receiving GPS fixes (call only after location permission is granted).
 * Returns a function that stops them again. Several screens may hold a
 * subscription at once; the GPS is switched off when the last one lets go.
 */
export function startLocationUpdates(): () => void {
  watchers += 1;
  if (watchId === null) {
    const onFix = (position: any) => reportFix(position?.coords);
    const onError = () => {
      // No fix yet (indoors, GPS off) — keep waiting; the UI shows "searching".
    };
    try {
      Geolocation.getCurrentPosition(onFix, onError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      });
      watchId = Geolocation.watchPosition(onFix, onError, {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 4000,
        fastestInterval: 2000,
      });
    } catch {
      watchId = null;
    }
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    watchers = Math.max(0, watchers - 1);
    if (watchers === 0 && watchId !== null) {
      try {
        Geolocation.clearWatch(watchId);
      } catch {
        // already stopped
      }
      watchId = null;
    }
  };
}

export function getLastFix(): GpsFix | null {
  return lastFix;
}

/** Minutes since the fix was taken. */
export function fixAgeMinutes(fix: GpsFix): number {
  return Math.max(0, (Date.now() - fix.timestamp) / 60000);
}

/** React hook: the latest real GPS fix, or null when the phone has none. */
export function useDeviceLocation(): GpsFix | null {
  const [fix, setFix] = useState<GpsFix | null>(lastFix);

  useEffect(() => {
    listeners.add(setFix);
    hydrate();
    setFix(lastFix);
    return () => {
      listeners.delete(setFix);
    };
  }, []);

  return fix;
}
