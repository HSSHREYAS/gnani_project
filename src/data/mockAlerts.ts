/**
 * Alert display model. (File name is historical — alerts shown in the app come only
 * from the live backend; there is no sample data in here.)
 */

export type AlertSeverity = 'urgent' | 'caution' | 'info' | 'seasonal';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  badgeLabel: string;
  title: string;
  body: string;
  source: string;
  timestamp: string;
  icon: string;
  category: 'official' | 'weather' | 'advisory' | 'news';
  latitude?: number | null;
  longitude?: number | null;
  /** Kannada rendering of the same alert, built from the alert's own figures. */
  kn?: { badgeLabel: string; title: string; body: string };
}
