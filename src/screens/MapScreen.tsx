/**
 * MapScreen — Marine Chartplotter Navigation with Fishing/Risk zone toggle,
 * Dynamic departure port anchoring, Top 3 PFZ Multi-Criteria Recommendations,
 * and realistic multi-leg nautical sea routing.
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../theme';
import ZoneToggle from '../components/map/ZoneToggle';
import MapControls from '../components/map/MapControls';
import MarineMap, { type MarineMapHandle, type MapRegion } from '../components/map/MarineMap';
import RiskBottomSheet from '../components/map/RiskBottomSheet';
import FishermanRouteView from '../components/map/FishermanRouteView';
import LocationSelectorModal from '../components/home/LocationSelectorModal';
import { mapInitialRegion } from '../data/mockZones';
import type { FishingZone, RiskZone } from '../data/mockZones';
import {
  useCurrentState,
  useAdvisories,
  transformIncoisToFishingZones,
  transformCurrentStatesToFishingZones,
  transformCurrentStatesToRiskZones,
  getLandingCenterCoordinates,
  CANONICAL_PORT_COORDINATES,
  getCanonicalCityName,
  localizeCityName,
} from '../services/api';
import {
  getUserProfile,
  saveUserProfile,
  type UserProfile,
} from '../services/storage/userProfileStorage';
import {
  getRecommendedZones,
  type RecommendedPfzZone,
} from '../services/navigation/pfzRecommendationEngine';
import {
  generateRealisticSeaRoute,
  type RealisticSeaRoute,
} from '../services/navigation/nauticalRoutingEngine';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n';
import {
  hasLocationPermission,
  requestLocationPermission,
  startLocationUpdates,
  useDeviceLocation,
} from '../services/location/deviceLocation';


const MapScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const gpsFix = useDeviceLocation();
  const [gpsAllowed, setGpsAllowed] = useState<boolean | null>(null);
  const [isFollowing, setIsFollowing] = useState(false); // live GPS guidance to the zone
  const [activeMode, setActiveMode] = useState(0); // 0 = Fishing, 1 = Risk
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isPortModalVisible, setIsPortModalVisible] = useState(false);
  const [sheetSnapIndex, setSheetSnapIndex] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false); // Tracks Google Maps style navigation state
  const mapRef = useRef<MarineMapHandle>(null);

  // Active departure port (synced with userProfile or fallback to Malpe KARN_018)
  const [activePortId, setActivePortId] = useState<string>('KARN_018');
  const [activePortName, setActivePortName] = useState<string>('Malpe');

  // Live telemetry hook (25 canonical locations)
  const { states, isOnline: statesOnline, isLoading: statesLoading, refresh: refreshStates } = useCurrentState(activePortId);

  // Live INCOIS Advisories hook (29 real PFZ advisories)
  const { rawAdvisories, isOnline: advisoriesOnline, isLoading: advisoriesLoading, refresh: refreshAdvisories } = useAdvisories();

  const isOnline = statesOnline || advisoriesOnline;

  // Load and synchronize user profile on mount and focus
  const loadProfile = useCallback(async () => {
    try {
      const p = await getUserProfile();
      setUserProfile(p);
      if (p.defaultPortId && p.defaultPortName) {
        setActivePortId(p.defaultPortId);
        setActivePortName(p.defaultPortName);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadProfile();
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
      refreshStates();
      refreshAdvisories();
    });
    return unsubscribe;
  }, [navigation, loadProfile, refreshStates, refreshAdvisories]);

  // Active departure port coordinates
  const departurePortCoords = useMemo(() => {
    if (CANONICAL_PORT_COORDINATES[activePortId]) {
      return CANONICAL_PORT_COORDINATES[activePortId];
    }
    return getLandingCenterCoordinates(activePortName);
  }, [activePortId, activePortName]);

  // All live candidate zones along the coast: official INCOIS bulletin zones plus the
  // app's own satellite-scored zones. Which of them are shown is decided per port below.
  const fishingZones = useMemo<FishingZone[]>(() => {
    const official =
      rawAdvisories && rawAdvisories.length > 0
        ? transformIncoisToFishingZones(rawAdvisories, states || undefined)
        : [];
    const satellite = states && states.length > 0 ? transformCurrentStatesToFishingZones(states) : [];
    return [...official, ...satellite];
  }, [rawAdvisories, states]);

  // Compute Top 3 Recommended Zones for the active departure port
  const top3RecommendedZones = useMemo<RecommendedPfzZone[]>(() => {
    if (fishingZones.length === 0) return [];
    // Re-ranked from scratch whenever the departure port (or the live data) changes:
    // best five for this port, of which the first three are the highlighted picks.
    return getRecommendedZones(fishingZones, {
      id: activePortId,
      name: activePortName,
      coordinates: departurePortCoords,
    });
  }, [fishingZones, activePortId, activePortName, departurePortCoords]);

  // Compute live risk zones from 25 canonical points (or fallback)
  const riskZones = useMemo<RiskZone[]>(() => {
    if (states && states.length > 0) {
      const liveZones = transformCurrentStatesToRiskZones(states);
      if (liveZones.length > 0) return liveZones;
    }
    return []; // no live readings -> show nothing rather than sample zones
  }, [states]);

  const [selectedFishingZone, setSelectedFishingZone] = useState<FishingZone | null>(null);
  const top3Key = top3RecommendedZones.map((r) => r.zone.id).join('|');
  const [selectedRiskZone, setSelectedRiskZone] = useState<RiskZone | null>(null);

  // Select this port's #1 zone when the port changes (or once its ranking first arrives);
  // otherwise keep whatever the fisher tapped, as long as it is still on the list.
  const lastPortForSelectionRef = useRef<string | null>(null);
  useEffect(() => {
    if (top3RecommendedZones.length === 0) return;
    const stillListed =
      selectedFishingZone !== null &&
      top3RecommendedZones.some((r) => r.zone.id === selectedFishingZone.id);
    if (lastPortForSelectionRef.current !== activePortId || !stillListed) {
      lastPortForSelectionRef.current = activePortId;
      setSelectedFishingZone(top3RecommendedZones[0].zone);
    }
  }, [top3RecommendedZones, activePortId, selectedFishingZone]);

  // Compute active realistic sea route from selected zone and active departure port
  const activeRealisticRoute = useMemo<RealisticSeaRoute | null>(() => {
    if (!selectedFishingZone) return null;

    // Check if the selected zone is one of the top 3 recommendations
    const matchingRec = top3RecommendedZones.find((r) => r.zone.id === selectedFishingZone.id);
    if (matchingRec) {
      return matchingRec.realisticRoute;
    }

    // Otherwise generate realistic route dynamically
    return generateRealisticSeaRoute({
      originPortId: activePortId,
      originPortName: activePortName,
      originCoords: departurePortCoords,
      targetPfzId: selectedFishingZone.id,
      targetPfzName: selectedFishingZone.name,
      targetPfzCoords: selectedFishingZone.center,
    });
  }, [selectedFishingZone, top3RecommendedZones, activePortId, activePortName, departurePortCoords]);

  // Ask once for location so the boat can be shown on the chart.
  useEffect(() => {
    if (!isFocused || gpsAllowed !== null) return;
    let active = true;
    hasLocationPermission().then(async (granted) => {
      const ok = granted || (await requestLocationPermission());
      if (active) setGpsAllowed(ok);
    });
    return () => {
      active = false;
    };
  }, [isFocused, gpsAllowed]);

  // Receive real GPS fixes while the map is on screen.
  useEffect(() => {
    if (!isFocused || gpsAllowed !== true) return undefined;
    return startLocationUpdates();
  }, [isFocused, gpsAllowed]);

  const handleRequestGps = useCallback(async () => {
    setGpsAllowed(await requestLocationPermission());
  }, []);

  // While following, keep the boat centred on the chart.
  useEffect(() => {
    if (!isFollowing || !gpsFix) return;
    mapRef.current?.centerOn({ latitude: gpsFix.latitude, longitude: gpsFix.longitude });
  }, [isFollowing, gpsFix]);

  // Opened from an alert: jump to that alert's position on the right layer.
  const targetNonce = route.params?.targetNonce;
  useEffect(() => {
    const lat = route.params?.targetLatitude;
    const lon = route.params?.targetLongitude;
    if (!targetNonce || typeof lat !== 'number' || typeof lon !== 'number') return;
    setIsNavigating(false);
    setIsFollowing(false);
    setActiveMode(route.params?.targetIsRisk ? 1 : 0);
    const timer = setTimeout(() => {
      mapRef.current?.showRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.9, longitudeDelta: 0.9 });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetNonce]);

  // Camera framing helper for a route
  const frameRoute = useCallback((seaRoute: RealisticSeaRoute) => {
    if (!seaRoute || seaRoute.coordinates.length < 2) return;
    mapRef.current?.fitCoordinates(seaRoute.coordinates);
  }, []);

  // Handle switching departure port
  const handleSelectPort = useCallback(async (portId: string) => {
    const cityName = getCanonicalCityName(portId);
    setActivePortId(portId);
    setActivePortName(cityName);
    setIsPortModalVisible(false);
    setIsNavigating(false);
    setIsFollowing(false);
    setSelectedFishingZone(null); // Clear stale route from previous port
    lastPortForSelectionRef.current = null; // pick this port's #1 zone once ranking is ready

    // Persist as user's profile port
    try {
      await saveUserProfile({
        defaultPortId: portId,
        defaultPortName: cityName,
      });
      setUserProfile((prev) => (prev ? { ...prev, defaultPortId: portId, defaultPortName: cityName } : null));
    } catch {
      // ignore
    }

    // Recenter camera on the new port and offshore area
    const coords = CANONICAL_PORT_COORDINATES[portId] || getLandingCenterCoordinates(cityName);
    mapRef.current?.showRegion({
      latitude: coords.latitude,
      longitude: coords.longitude - 0.25,
      latitudeDelta: 1.1,
      longitudeDelta: 1.1,
    });
  }, []);

  // Handle selecting one of the Top 3 cards
  const handleSelectRecommendedZone = useCallback((rec: RecommendedPfzZone) => {
    setSelectedFishingZone(rec.zone);
    frameRoute(rec.realisticRoute);
  }, [frameRoute]);

  const handleZoomIn = () => mapRef.current?.zoomBy(1);
  const handleZoomOut = () => mapRef.current?.zoomBy(-1);

  const handleMyLocation = async () => {
    // Real GPS position when the phone has one; otherwise the departure port.
    if (gpsFix) {
      mapRef.current?.centerOn({ latitude: gpsFix.latitude, longitude: gpsFix.longitude }, 11);
      return;
    }
    if (gpsAllowed === false) {
      setGpsAllowed(await requestLocationPermission());
    }
    mapRef.current?.showRegion({
      latitude: departurePortCoords.latitude,
      longitude: departurePortCoords.longitude - 0.2, // offset offshore to view the zones
      latitudeDelta: 1.2,
      longitudeDelta: 1.2,
    });
  };

  const handleFishingZonePress = useCallback((zone: FishingZone) => {
    setSelectedFishingZone(zone);
    const route = generateRealisticSeaRoute({
      originPortId: activePortId,
      originPortName: activePortName,
      originCoords: departurePortCoords,
      targetPfzId: zone.id,
      targetPfzName: zone.name,
      targetPfzCoords: zone.center,
    });
    frameRoute(route);
  }, [activePortId, activePortName, departurePortCoords, frameRoute]);

  const handleRiskZonePress = useCallback((zone: RiskZone) => {
    setSelectedRiskZone(zone);
  }, []);

  // Zones drawn on the chart: the ranked top picks (kept in rank order).
  const displayZones = useMemo<FishingZone[]>(
    () => top3RecommendedZones.map((r) => r.zone),
    [top3RecommendedZones],
  );

  // When the port or the zone list changes, frame the port together with its top zones.
  useEffect(() => {
    if (isNavigating || activeMode !== 0 || displayZones.length === 0) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitCoordinates([departurePortCoords, ...displayZones.map((z) => z.center)]);
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top3Key, activePortId, activeMode]);

  // Switching to the Sea Risk layer: show the whole coast's readings.
  const riskCount = riskZones.length;
  useEffect(() => {
    if (activeMode !== 1 || riskCount === 0) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitCoordinates(riskZones.map((z) => z.center));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, riskCount]);

  const handleRefresh = async () => {
    await Promise.all([refreshStates(), refreshAdvisories(), loadProfile()]);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Top bar (hidden while a route is on screen) */}
      {!isNavigating && (
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.leftAction}>
            <Icon name="compass-outline" size={24} color={Colors.primaryAccent} />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.topBarTitle} numberOfLines={1}>{t('map_title')}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsPortModalVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.subStatusRow}>
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: isOnline ? Colors.safe : Colors.caution },
                ]}
              />
              <Text style={styles.subStatusText} numberOfLines={1}>
                {t('map_from')}: <Text style={styles.portHighlight}>{localizeCityName(activePortName, language)}</Text>
              </Text>
              <Icon name="menu-down" size={20} color={Colors.oceanBlue} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={handleRefresh} style={styles.actionIconBtn}>
            <Icon name="refresh" size={22} color={Colors.primaryAccent} />
          </TouchableOpacity>
        </View>
      )}

      {/* Map View Container */}
      <View style={styles.mapContainer}>
        <MarineMap
          ref={mapRef}
          mode={activeMode === 0 ? 'fishing' : 'risk'}
          satellite={isSatellite}
          initialRegion={mapInitialRegion as MapRegion}
          zones={displayZones}
          topPickCount={top3RecommendedZones.filter((r) => r.isTopPick).length}
          selectedZoneId={selectedFishingZone?.id}
          routeCoordinates={activeRealisticRoute?.coordinates}
          showRoute={isNavigating}
          port={{ ...departurePortCoords, name: activePortName }}
          riskZones={riskZones}
          selectedRiskId={selectedRiskZone?.id}
          gpsFix={gpsAllowed === true ? gpsFix : null}
          onZonePress={(zoneId) => {
            const zone = fishingZones.find((z) => z.id === zoneId);
            if (zone) handleFishingZonePress(zone);
          }}
          onRiskPress={(zoneId) => {
            const zone = riskZones.find((z) => z.id === zoneId);
            if (zone) handleRiskZonePress(zone);
          }}
        />

        {/* Zone Toggle (Fishing vs Risk) */}
        {!isNavigating && (
          <ZoneToggle
            activeIndex={activeMode}
            onToggle={setActiveMode}
            labels={[t('map_fishing'), t('map_risk')]}
          />
        )}

        {/* Map Controls */}
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onMyLocation={handleMyLocation}
          onToggleLayer={() => setIsSatellite(!isSatellite)}
          isSatellite={isSatellite}
          topOffset={isNavigating ? insets.top + 76 : 70}
        />

      </View>

      {/* Bottom panel */}
      {activeMode === 0 ? (
        <FishermanRouteView
          recommendedZones={top3RecommendedZones}
          selectedZone={
            top3RecommendedZones.find((z) => z.zone.id === selectedFishingZone?.id) ||
            (selectedFishingZone && activeRealisticRoute
              ? {
                  zone: selectedFishingZone,
                  rank: 1,
                  isTopPick: true,
                  score: 0,
                  distanceNm: activeRealisticRoute.totalDistanceNm,
                  distanceKm: activeRealisticRoute.totalDistanceKm,
                  realisticRoute: activeRealisticRoute,
                }
              : null)
          }
          activeRoute={activeRealisticRoute}
          isNavigating={isNavigating}
          isFollowing={isFollowing}
          gpsFix={gpsFix}
          gpsAllowed={gpsAllowed}
          isLoading={statesLoading || advisoriesLoading}
          topInset={insets.top}
          bottomInset={0}
          onSelectZone={handleSelectRecommendedZone}
          onStartNavigation={() => {
            setIsNavigating(true);
            if (activeRealisticRoute) {
              frameRoute(activeRealisticRoute);
            }
          }}
          onExitNavigation={() => {
            setIsNavigating(false);
            setIsFollowing(false);
          }}
          onToggleFollow={() => {
            if (isFollowing) {
              setIsFollowing(false);
              if (activeRealisticRoute) frameRoute(activeRealisticRoute);
              return;
            }
            setIsFollowing(true);
            if (gpsAllowed !== true) handleRequestGps();
          }}
          onRequestGps={handleRequestGps}
          departurePortName={activePortName}
        />
      ) : (
        <RiskBottomSheet riskZones={riskZones} selectedZone={selectedRiskZone} bottomInset={0} />
      )}

      {/* 25 Canonical Coastal Ports Selector Modal */}
      <LocationSelectorModal
        visible={isPortModalVisible}
        onClose={() => setIsPortModalVisible(false)}
        onSelectLocation={handleSelectPort}
        selectedLocationId={activePortId}
        states={states || []}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    zIndex: 25,
    ...Shadows.card,
  },
  leftAction: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryAccentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  topBarTitle: {
    ...Typography.screenTitle,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  subStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subStatusText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  portHighlight: {
    color: Colors.oceanBlue,
    fontWeight: '800',
  },
  topActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconBtnActive: {
    backgroundColor: Colors.oceanBlue,
    borderColor: Colors.oceanBlue,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
});

export default MapScreen;
