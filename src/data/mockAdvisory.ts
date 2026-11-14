/**
 * Advisory display model. (File name is historical — advisories shown in the app come
 * only from live INCOIS bulletins; there is no sample data in here.)
 */

export type AdvisorySeverity = 'safe' | 'caution' | 'danger';

export interface Advisory {
  id: string;
  severity: AdvisorySeverity;
  badgeLabel: string;
  title: string;
  description: string;
  subLabel: string;
  subIcon?: string;
  /** Structured bulletin values (all straight from INCOIS). */
  place?: string;
  date?: string | null;
  bearingDeg?: number | null;
  depthM?: number | null;
  latitude?: number;
  longitude?: number;
  /** Straight-line distance from the fisher's chosen port, when known. */
  kmFromPort?: number | null;
}
