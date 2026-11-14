/**
 * Raster tile sources for the marine map (see components/map/MarineMap.tsx).
 *
 * The chart is drawn from these tiles with Leaflet, so it needs no Google Maps API
 * key. Tiles: Esri / GEBCO / NOAA / Garmin (World Ocean Base and Reference) and
 * Esri World Imagery — attribution is shown on the map. Check Esri's terms of use
 * before a commercial release; the URLs below are the only place to change provider.
 */

const ARCGIS = 'https://server.arcgisonline.com/ArcGIS/rest/services';

/** Bathymetric sea chart (depth shading, coastline). */
export const OCEAN_BASE_TILES = `${ARCGIS}/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`;
/** Place names and depth labels drawn over the sea chart. */
export const OCEAN_REFERENCE_TILES = `${ARCGIS}/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}`;
/** Satellite imagery. */
export const SATELLITE_TILES = `${ARCGIS}/World_Imagery/MapServer/tile/{z}/{y}/{x}`;

/** Deepest zoom level the ocean chart has real tiles for offshore; deeper zooms upscale. */
export const OCEAN_NATIVE_MAX_ZOOM = 10;
export const SATELLITE_NATIVE_MAX_ZOOM = 15;
export const MAP_ATTRIBUTION = 'Esri, GEBCO, NOAA, Garmin';
