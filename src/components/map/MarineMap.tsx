/**
 * MarineMap — the app's sea chart.
 *
 * Renders with Leaflet inside a WebView on raster tiles (Esri World Ocean Base /
 * Reference for the depth-shaded chart, Esri World Imagery for satellite), so it
 * needs no Google Maps API key and no Google billing account. Leaflet itself is
 * bundled into the app (see scripts/build-leaflet-assets.js); only map tiles are
 * fetched from the network.
 *
 * Everything drawn here is passed in from live app state: fishing zones, the
 * planned route, per-port risk circles and the phone's real GPS position.
 */

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';

// The library's default generic (`WebView<undefined>`) collapses its props to `never` under
// strict TypeScript, so pin the prop type explicitly.
const MapWebView = WebView as unknown as React.ComponentType<WebViewProps & { ref?: React.Ref<any> }>;
import type { FishingZone, RiskZone } from '../../data/mockZones';
import type { GpsFix } from '../../services/location/deviceLocation';
import { LEAFLET_CSS, LEAFLET_JS } from './leafletAssets';
import {
  MAP_ATTRIBUTION,
  OCEAN_BASE_TILES,
  OCEAN_NATIVE_MAX_ZOOM,
  OCEAN_REFERENCE_TILES,
  SATELLITE_NATIVE_MAX_ZOOM,
  SATELLITE_TILES,
} from '../../theme/mapTiles';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends LatLng {
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MarineMapHandle {
  /** Show a lat/lon box (same shape as a react-native-maps region). */
  showRegion: (region: MapRegion) => void;
  /** Fit the view around a list of points. */
  fitCoordinates: (coordinates: LatLng[]) => void;
  /** Centre on a point, optionally at a given zoom level. */
  centerOn: (point: LatLng, zoom?: number) => void;
  zoomBy: (delta: number) => void;
}

interface MarineMapProps {
  mode: 'fishing' | 'risk';
  satellite: boolean;
  /** Fishing zones to draw (already limited to the ones worth showing). */
  zones: FishingZone[];
  selectedZoneId?: string | null;
  /** How many of the leading zones are highlighted "top picks"; the rest are drawn smaller. */
  topPickCount?: number;
  /** Planned route polyline; drawn only when `showRoute` is true. */
  routeCoordinates?: LatLng[] | null;
  showRoute: boolean;
  port?: (LatLng & { name: string }) | null;
  riskZones: RiskZone[];
  selectedRiskId?: string | null;
  gpsFix: GpsFix | null;
  initialRegion: MapRegion;
  onZonePress?: (zoneId: string) => void;
  onRiskPress?: (zoneId: string) => void;
}

function buildHtml(initial: MapRegion): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${LEAFLET_CSS}</style>
<style>
  html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #cfe3ee; }
  body { font-family: Roboto, 'Noto Sans Kannada', sans-serif; -webkit-user-select: none; user-select: none; }
  .leaflet-control-attribution { font-size: 9px; background: rgba(255,255,255,0.7); }
  .mm-pin { width: max-content; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; transform: translate(-50%, -100%);
    padding: 5px 9px; border-radius: 14px; color: #fff; font-weight: 800; font-size: 13px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 2px solid #fff; }
  .mm-pin:after { content: ''; position: absolute; left: 50%; bottom: -7px; margin-left: -5px;
    border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid #fff; }
  .mm-port { background: #0A2540; }
  .mm-dest { background: #DC2626; }
  .mm-rank { transform: translate(-50%, -50%); width: 38px; height: 38px; border-radius: 19px; background: #fff;
    border: 3px solid #0D9488; display: flex; align-items: center; justify-content: center;
    font-size: 19px; font-weight: 900; box-shadow: 0 2px 6px rgba(0,0,0,0.35); }
  .mm-rank.minor { width: 30px; height: 30px; border-radius: 15px; font-size: 15px; border-width: 2px;
    border-color: #64748B; color: #475569; background: #F1F5F9; }
  .mm-rank.sel { width: 46px; height: 46px; border-radius: 23px; font-size: 23px; border-width: 4px; }
  .mm-risk { width: max-content; transform: translate(-50%, -50%); padding: 3px 7px; border-radius: 11px; background: #fff;
    border: 2px solid #15803D; font-size: 12px; font-weight: 800; white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
  .mm-risk.sel { font-size: 14px; padding: 5px 9px; border-width: 3px; }
  .mm-boat { transform: translate(-50%, -50%); width: 22px; height: 22px; border-radius: 11px;
    background: #2563EB; border: 3px solid #fff; box-shadow: 0 0 0 2px rgba(37,99,235,0.45), 0 2px 6px rgba(0,0,0,0.4); }
  .mm-boat-arrow { position: absolute; left: 50%; top: 50%; width: 0; height: 0; margin: -22px 0 0 -7px;
    border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 13px solid #2563EB;
    transform-origin: 7px 22px; }
</style>
</head>
<body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
(function () {
  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  var RANK_COLORS = ['#D97706', '#059669', '#0284C7'];
  var RANK_GLYPHS = ['\\u2460', '\\u2461', '\\u2462', '\\u2463', '\\u2464'];
  var RISK = {
    critical: { fill: '#EF4444', stroke: '#B91C1C' },
    moderate: { fill: '#F59E0B', stroke: '#B45309' },
    low: { fill: '#10B981', stroke: '#15803D' }
  };

  var map = L.map('map', { zoomControl: false, attributionControl: true, minZoom: 5, maxZoom: 15, zoomSnap: 0.25 });
  map.attributionControl.setPrefix(false);
  var sw = [${initial.latitude - initial.latitudeDelta / 2}, ${initial.longitude - initial.longitudeDelta / 2}];
  var ne = [${initial.latitude + initial.latitudeDelta / 2}, ${initial.longitude + initial.longitudeDelta / 2}];
  map.fitBounds([sw, ne]);

  var oceanBase = L.tileLayer('${OCEAN_BASE_TILES}', { maxNativeZoom: ${OCEAN_NATIVE_MAX_ZOOM}, maxZoom: 15, attribution: '${MAP_ATTRIBUTION}' });
  var oceanRef = L.tileLayer('${OCEAN_REFERENCE_TILES}', { maxNativeZoom: ${OCEAN_NATIVE_MAX_ZOOM}, maxZoom: 15 });
  var satellite = L.tileLayer('${SATELLITE_TILES}', { maxNativeZoom: ${SATELLITE_NATIVE_MAX_ZOOM}, maxZoom: 15, attribution: 'Esri World Imagery' });
  var isSat = null;
  function setBase(sat) {
    if (sat === isSat) return;
    isSat = sat;
    [oceanBase, oceanRef, satellite].forEach(function (l) { if (map.hasLayer(l)) map.removeLayer(l); });
    if (sat) { satellite.addTo(map); oceanRef.addTo(map); } else { oceanBase.addTo(map); oceanRef.addTo(map); }
  }

  var overlay = L.layerGroup().addTo(map);
  var gpsLayer = L.layerGroup().addTo(map);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(html) { return L.divIcon({ html: html, className: '', iconSize: [0, 0] }); }
  function ll(p) { return [p.latitude, p.longitude]; }

  function draw(s) {
    setBase(!!s.satellite);
    overlay.clearLayers();

    if (s.mode === 'risk') {
      (s.riskZones || []).forEach(function (z) {
        var c = RISK[z.riskLevel] || RISK.low;
        var sel = z.id === s.selectedRiskId;
        var circle = L.circle(ll(z.center), { radius: z.radius, color: c.stroke, weight: sel ? 4 : 2,
          fillColor: c.fill, fillOpacity: sel ? 0.45 : 0.28 }).addTo(overlay);
        circle.on('click', function () { post({ type: 'risk', id: z.id }); });
        var label = z.waveHeight == null ? '\\u2014' : (z.waveHeight + ' m');
        var m = L.marker(ll(z.center), { icon: icon('<div class="mm-risk' + (sel ? ' sel' : '') +
          '" style="border-color:' + c.stroke + ';color:' + c.stroke + '">' + esc(label) + '</div>'),
          zIndexOffset: sel ? 500 : 0 }).addTo(overlay);
        m.on('click', function () { post({ type: 'risk', id: z.id }); });
      });
    } else {
      var zones = s.zones || [];
      zones.forEach(function (z, i) {
        var sel = z.id === s.selectedZoneId;
        if (s.showRoute && !sel) return; // route view shows only the destination zone
        var top = i < (s.topPickCount == null ? 3 : s.topPickCount);
        var color = top ? (RANK_COLORS[i] || '#0D9488') : '#64748B';
        if (z.coordinates && z.coordinates.length > 2) {
          var poly = L.polygon(z.coordinates.map(ll), { color: sel ? '#047857' : (top ? '#0D9488' : '#64748B'),
            weight: sel ? 3 : (top ? 2 : 1.5), dashArray: top || sel ? null : '5 5',
            fillColor: top || sel ? '#10B981' : '#94A3B8', fillOpacity: sel ? 0.35 : (top ? 0.2 : 0.12) }).addTo(overlay);
          poly.on('click', function () { post({ type: 'zone', id: z.id }); });
        }
        if (s.showRoute) {
          L.marker(ll(z.center), { icon: icon('<div class="mm-pin mm-dest">\\uD83C\\uDFA3 ' + esc(z.name) + '</div>'),
            zIndexOffset: 800 }).addTo(overlay);
        } else {
          var cls = 'mm-rank' + (top ? '' : ' minor') + (sel ? ' sel' : '');
          var style = top || sel ? ' style="border-color:' + color + ';color:' + color + '"' : '';
          var m = L.marker(ll(z.center), { icon: icon('<div class="' + cls + '"' + style + '>' +
            (RANK_GLYPHS[i] || '\\u2022') + '</div>'),
            zIndexOffset: sel ? 700 : (top ? 300 - i : 100) }).addTo(overlay);
          m.on('click', function () { post({ type: 'zone', id: z.id }); });
        }
      });

      if (s.showRoute && s.routeCoordinates && s.routeCoordinates.length > 1) {
        var pts = s.routeCoordinates.map(ll);
        L.polyline(pts, { color: '#ffffff', weight: 9, opacity: 0.85 }).addTo(overlay);
        L.polyline(pts, { color: '#0284C7', weight: 5, dashArray: '14 8' }).addTo(overlay);
      }
      if (s.port) {
        L.marker(ll(s.port), { icon: icon('<div class="mm-pin mm-port">\\u2693 ' + esc(s.port.name) + '</div>'),
          zIndexOffset: 600 }).addTo(overlay);
      }
    }
  }

  function drawGps(fix) {
    gpsLayer.clearLayers();
    if (!fix) return;
    var p = [fix.latitude, fix.longitude];
    if (fix.accuracy && fix.accuracy > 25) {
      L.circle(p, { radius: fix.accuracy, color: '#2563EB', weight: 1, fillColor: '#3B82F6', fillOpacity: 0.12,
        interactive: false }).addTo(gpsLayer);
    }
    var arrow = (fix.heading != null && fix.speed != null && fix.speed > 0.5)
      ? '<div class="mm-boat-arrow" style="transform: rotate(' + fix.heading + 'deg)"></div>' : '';
    L.marker(p, { icon: icon('<div class="mm-boat">' + arrow + '</div>'), zIndexOffset: 1000, interactive: false })
      .addTo(gpsLayer);
  }

  window.MM = {
    update: function (s) { try { draw(s); } catch (e) { post({ type: 'error', message: String(e) }); } },
    gps: function (fix) { try { drawGps(fix); } catch (e) { post({ type: 'error', message: String(e) }); } },
    showRegion: function (r) {
      map.flyToBounds([[r.latitude - r.latitudeDelta / 2, r.longitude - r.longitudeDelta / 2],
        [r.latitude + r.latitudeDelta / 2, r.longitude + r.longitudeDelta / 2]], { duration: 0.6 });
    },
    fit: function (pts) {
      if (!pts || !pts.length) return;
      map.flyToBounds(L.latLngBounds(pts.map(ll)), { duration: 0.6, maxZoom: 12,
        paddingTopLeft: [110, 96], paddingBottomRight: [96, 48] });
    },
    centerOn: function (p, zoom) {
      if (zoom == null) map.panTo(ll(p), { animate: true, duration: 0.5 });
      else map.flyTo(ll(p), zoom, { duration: 0.6 });
    },
    zoomBy: function (d) { map.setZoom(map.getZoom() + d); }
  };

  window.addEventListener('resize', function () { map.invalidateSize(); });
  post({ type: 'ready' });
})();
</script>
</body>
</html>`;
}

const MarineMap = forwardRef<MarineMapHandle, MarineMapProps>(
  (
    {
      mode,
      satellite,
      zones,
      selectedZoneId,
      topPickCount = 3,
      routeCoordinates,
      showRoute,
      port,
      riskZones,
      selectedRiskId,
      gpsFix,
      initialRegion,
      onZonePress,
      onRiskPress,
    },
    ref,
  ) => {
    const webRef = useRef<any>(null);
    const [ready, setReady] = useState(false);
    // The page is built once; later changes are pushed in as data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const html = useMemo(() => buildHtml(initialRegion), []);

    const run = useCallback((script: string) => {
      webRef.current?.injectJavaScript(`${script}; true;`);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        showRegion: (region) => run(`window.MM && window.MM.showRegion(${JSON.stringify(region)})`),
        fitCoordinates: (coordinates) => run(`window.MM && window.MM.fit(${JSON.stringify(coordinates)})`),
        centerOn: (point, zoom) =>
          run(`window.MM && window.MM.centerOn(${JSON.stringify(point)}, ${zoom === undefined ? 'null' : zoom})`),
        zoomBy: (delta) => run(`window.MM && window.MM.zoomBy(${delta})`),
      }),
      [run],
    );

    const payload = useMemo(
      () =>
        JSON.stringify({
          mode,
          satellite,
          selectedZoneId: selectedZoneId ?? null,
          topPickCount,
          selectedRiskId: selectedRiskId ?? null,
          showRoute,
          routeCoordinates: showRoute ? routeCoordinates ?? null : null,
          port: port ?? null,
          zones: zones.map((z) => ({ id: z.id, name: z.name, center: z.center, coordinates: z.coordinates })),
          riskZones: riskZones.map((z) => ({
            id: z.id,
            riskLevel: z.riskLevel,
            center: z.center,
            radius: z.radius,
            waveHeight: z.waveHeight,
          })),
        }),
      [mode, satellite, selectedZoneId, topPickCount, selectedRiskId, showRoute, routeCoordinates, port, zones, riskZones],
    );

    useEffect(() => {
      if (ready) run(`window.MM.update(${payload})`);
    }, [ready, payload, run]);

    const gpsPayload = useMemo(
      () =>
        gpsFix
          ? JSON.stringify({
              latitude: gpsFix.latitude,
              longitude: gpsFix.longitude,
              accuracy: gpsFix.accuracy,
              heading: gpsFix.heading,
              speed: gpsFix.speed,
            })
          : 'null',
      [gpsFix],
    );

    useEffect(() => {
      if (ready) run(`window.MM.gps(${gpsPayload})`);
    }, [ready, gpsPayload, run]);

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if (message.type === 'ready') setReady(true);
          else if (message.type === 'zone') onZonePress?.(message.id);
          else if (message.type === 'risk') onRiskPress?.(message.id);
          else if (message.type === 'error') console.warn('MarineMap:', message.message);
        } catch {
          // ignore malformed messages
        }
      },
      [onZonePress, onRiskPress],
    );

    return (
      <View style={styles.container}>
        <MapWebView
          ref={webRef}
          style={styles.web}
          originWhitelist={['*']}
          source={{ html, baseUrl: 'https://localhost/' }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          scrollEnabled={false}
          overScrollMode="never"
          bounces={false}
          setSupportMultipleWindows={false}
          textZoom={100}
          androidLayerType="hardware"
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#CFE3EE',
  },
  web: {
    flex: 1,
    backgroundColor: '#CFE3EE',
  },
});

export default MarineMap;
