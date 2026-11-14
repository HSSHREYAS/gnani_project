/**
 * FishermanRouteView — bottom panel of the fishing map.
 *
 * Browse mode   : up to three reachable zones as large tabs, with distance and
 *                 planned run time / diesel for the selected one.
 * Route mode    : the planned sea route with its legs.
 * Follow mode   : live guidance from the phone's real GPS — distance to go,
 *                 bearing to steer, speed over ground and time to arrive.
 *
 * Planned figures are labelled as estimates; live figures come only from the
 * device GPS and are never shown without a fix.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { useLanguage } from '../../i18n';
import { localizeCityName } from '../../services/api/canonicalLocations';
import type { RecommendedPfzZone } from '../../services/navigation/pfzRecommendationEngine';
import {
  calculateBearingDegrees,
  calculateHaversineDistanceKm,
  getCompassHeading,
  type RealisticSeaRoute,
} from '../../services/navigation/nauticalRoutingEngine';
import type { GpsFix } from '../../services/location/deviceLocation';

interface FishermanRouteViewProps {
  recommendedZones: RecommendedPfzZone[];
  selectedZone: RecommendedPfzZone | null;
  activeRoute: RealisticSeaRoute | null;
  isNavigating: boolean;
  isFollowing: boolean;
  gpsFix: GpsFix | null;
  gpsAllowed: boolean | null;
  isLoading?: boolean;
  topInset: number;
  bottomInset: number;
  onSelectZone: (rec: RecommendedPfzZone) => void;
  onStartNavigation: () => void;
  onExitNavigation: () => void;
  onToggleFollow: () => void;
  onRequestGps: () => void;
  departurePortName: string;
}

const RANK_COLORS = ['#D97706', '#059669', '#0284C7'];
const MINOR_COLOR = '#64748B';
const RANK_GLYPHS = ['①', '②', '③', '④', '⑤'];
const ARRIVAL_RADIUS_KM = 2.5;
const PLANNING_SPEED_KN = 10.5;
const GPS_FRESH_MS = 60 * 1000;

function formatDuration(hours: number): string {
  if (!isFinite(hours) || hours < 0) return '—';
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

export const FishermanRouteView: React.FC<FishermanRouteViewProps> = ({
  recommendedZones,
  selectedZone,
  activeRoute,
  isNavigating,
  isFollowing,
  gpsFix,
  gpsAllowed,
  isLoading = false,
  topInset,
  bottomInset,
  onSelectZone,
  onStartNavigation,
  onExitNavigation,
  onToggleFollow,
  onRequestGps,
  departurePortName,
}) => {
  const { t, language } = useLanguage();
  const [showSteps, setShowSteps] = useState(false);
  const panelPadding = { paddingBottom: Math.max(bottomInset, 10) + 6 };

  const sourceLine = (rec: RecommendedPfzZone): string => {
    const zone = rec.zone;
    const parts: string[] = [];
    if (zone.advisoryDate) {
      parts.push(
        (zone.source === 'model' ? t('map_model_zone') : t('map_bulletin')).replace(
          '{date}',
          zone.advisoryDate,
        ),
      );
    }
    if (zone.depthM !== null && zone.depthM !== undefined) {
      parts.push(t('map_depth').replace('{m}', zone.depthM.toFixed(0)));
    }
    return parts.join(' • ');
  };

  // ---------------------------------------------------------------- route / follow mode
  if (isNavigating && activeRoute && selectedZone) {
    const target = selectedZone.zone.center;
    const fixIsFresh = gpsFix !== null && Date.now() - gpsFix.timestamp < GPS_FRESH_MS;
    const live = isFollowing && fixIsFresh ? gpsFix : null;

    const liveDistKm = live ? calculateHaversineDistanceKm(live, target) : null;
    const liveBearing = live ? calculateBearingDegrees(live, target) : null;
    const speedKn = live && live.speed !== null ? live.speed * 1.94384 : null;
    const arrived = liveDistKm !== null && liveDistKm <= ARRIVAL_RADIUS_KM;
    const moving = speedKn !== null && speedKn >= 1;
    const etaHours =
      liveDistKm !== null
        ? liveDistKm / 1.852 / (moving ? (speedKn as number) : PLANNING_SPEED_KN)
        : null;

    return (
      <>
        <View style={[styles.navTopBar, { top: topInset + 8 }]}>
          <View style={styles.navTopRouteInfo}>
            <View style={styles.greenDot} />
            <Text style={styles.navPortText} numberOfLines={1}>{departurePortName}</Text>
            <Icon name="arrow-right" size={18} color={Colors.textSecondary} />
            <View style={styles.redDot} />
            <Text style={styles.navDestText} numberOfLines={1}>{selectedZone.zone.name}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onExitNavigation}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            style={styles.exitRouteButton}>
            <Icon name="close" size={18} color="#DC2626" />
            <Text style={styles.exitRouteText}>{t('map_exit')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.navBottomPanel, panelPadding]}>
          {isFollowing ? (
            live ? (
              <>
                {arrived && (
                  <View style={styles.arrivedBanner}>
                    <Icon name="fish" size={20} color="#FFFFFF" />
                    <Text style={styles.arrivedText}>{t('map_arrived')}</Text>
                  </View>
                )}
                <View style={styles.statsRow}>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>{t('map_to_go')}</Text>
                    <Text style={styles.statBig} numberOfLines={1} adjustsFontSizeToFit>
                      {((liveDistKm as number) / 1.852).toFixed(1)}
                      <Text style={styles.statUnit}> NM</Text>
                    </Text>
                    <Text style={styles.statSub}>{(liveDistKm as number).toFixed(1)} km</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>{t('map_steer')}</Text>
                    <Text style={[styles.statBig, styles.statSteer]} numberOfLines={1} adjustsFontSizeToFit>
                      {Math.round(liveBearing as number)}°
                    </Text>
                    <Text style={styles.statSub}>{getCompassHeading(liveBearing as number)}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>{t('map_speed')}</Text>
                    <Text style={styles.statBig} numberOfLines={1} adjustsFontSizeToFit>
                      {speedKn === null ? '—' : speedKn.toFixed(1)}
                      <Text style={styles.statUnit}> kn</Text>
                    </Text>
                    <Text style={styles.statSub}>
                      {t('map_eta')} {moving ? '' : '~'}{formatDuration(etaHours as number)}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <TouchableOpacity
                activeOpacity={gpsAllowed === false ? 0.8 : 1}
                onPress={gpsAllowed === false ? onRequestGps : undefined}
                style={styles.waitingBox}>
                <Icon name="crosshairs-question" size={26} color="#B45309" />
                <Text style={styles.waitingText}>
                  {gpsAllowed === false ? t('map_gps_denied') : t('map_waiting_gps')}
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>{t('map_distance')}</Text>
                  <Text style={styles.statBig} numberOfLines={1} adjustsFontSizeToFit>
                    {activeRoute.totalDistanceNm.toFixed(1)}
                    <Text style={styles.statUnit}> NM</Text>
                  </Text>
                  <Text style={styles.statSub}>{activeRoute.totalDistanceKm.toFixed(0)} km</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>{t('map_run_time')}</Text>
                  <Text style={styles.statBig} numberOfLines={1} adjustsFontSizeToFit>
                    ~{formatDuration(activeRoute.totalDurationHours)}
                  </Text>
                  <Text style={styles.statSub}>@ {PLANNING_SPEED_KN} kn</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>{t('map_diesel')}</Text>
                  <Text style={[styles.statBig, styles.statDiesel]} numberOfLines={1} adjustsFontSizeToFit>
                    ~{activeRoute.estimatedDieselLiters}
                    <Text style={[styles.statUnit, styles.statDiesel]}> L</Text>
                  </Text>
                  <Text style={styles.statSub}>
                    ~₹{activeRoute.estimatedFuelCostInr.toLocaleString()}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.navTargetRow}>
            <View style={styles.targetTexts}>
              <Text style={styles.targetTitle} numberOfLines={1}>{selectedZone.zone.name}</Text>
              {!!sourceLine(selectedZone) && (
                <Text style={styles.targetSubtitle} numberOfLines={1}>{sourceLine(selectedZone)}</Text>
              )}
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSteps(!showSteps)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.stepsToggleBtn}>
              <Text style={styles.stepsToggleText}>{t('map_steps')}</Text>
              <Icon name={showSteps ? 'chevron-down' : 'chevron-up'} size={18} color={Colors.oceanBlue} />
            </TouchableOpacity>
          </View>

          {showSteps && (
            <ScrollView style={styles.legsScroll} nestedScrollEnabled>
              {activeRoute.legs.map((leg) => (
                <View key={leg.legIndex} style={styles.legStepCard}>
                  <View style={styles.legStepHeader}>
                    <View style={styles.legNumberBadge}>
                      <Text style={styles.legNumberText}>{leg.legIndex}</Text>
                    </View>
                    <Text style={styles.legStepTitle} numberOfLines={1}>{leg.titleKn}</Text>
                    <View style={styles.legCompassPill}>
                      <Icon name="compass" size={13} color={Colors.oceanBlue} />
                      <Text style={styles.legCompassText}>
                        {leg.bearingDegrees}° {leg.compassHeading}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.legInstruction}>{leg.instructionKn}</Text>
                  <Text style={styles.legSubText}>
                    {leg.distanceNm} NM • ~{leg.estMinutes} min
                  </Text>
                </View>
              ))}
              <Text style={styles.estimateNote}>{t('map_est_note')}</Text>
            </ScrollView>
          )}

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onToggleFollow}
            style={[styles.primaryBtn, isFollowing && styles.primaryBtnStop]}>
            <Icon name={isFollowing ? 'stop-circle-outline' : 'navigation-variant'} size={24} color="#FFFFFF" />
            <Text style={styles.primaryBtnText} numberOfLines={1} adjustsFontSizeToFit>
              {isFollowing ? t('map_stop_nav') : t('map_start_nav')}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // ---------------------------------------------------------------- browse mode
  if (!recommendedZones || recommendedZones.length === 0) {
    return (
      <View style={[styles.browseContainer, panelPadding]}>
        <View style={styles.emptyBox}>
          <Icon name={isLoading ? 'progress-clock' : 'fish-off'} size={28} color="#94A3B8" />
          <Text style={styles.emptyText}>{isLoading ? t('connecting') : t('map_no_zones')}</Text>
        </View>
      </View>
    );
  }

  const currentZone = selectedZone || recommendedZones[0];

  return (
    <View style={[styles.browseContainer, panelPadding]}>
      <Text style={styles.listHeading} numberOfLines={1}>
        {t('map_best_for').replace('{port}', localizeCityName(departurePortName, language))}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}>
        {recommendedZones.map((rec) => {
          const isSelected = rec.zone.id === currentZone.zone.id;
          const color = rec.isTopPick ? RANK_COLORS[rec.rank - 1] || MINOR_COLOR : MINOR_COLOR;
          return (
            <TouchableOpacity
              key={rec.zone.id}
              activeOpacity={0.8}
              onPress={() => onSelectZone(rec)}
              style={[
                styles.tabBtn,
                rec.isTopPick && styles.tabBtnTop,
                isSelected && [styles.tabBtnSelected, { borderColor: color }],
              ]}>
              {rec.isTopPick && (
                <View style={[styles.bestTag, { backgroundColor: color }]}>
                  <Icon name="star" size={9} color="#FFFFFF" />
                  <Text style={styles.bestTagText}>{t('map_best')}</Text>
                </View>
              )}
              <Text
                style={[styles.tabBtnText, (isSelected || rec.isTopPick) && { color }]}
                numberOfLines={1}>
                {RANK_GLYPHS[rec.rank - 1] || rec.rank} {t('map_pick')} {rec.rank}
              </Text>
              <Text style={styles.tabSubText} numberOfLines={1}>
                {rec.distanceNm.toFixed(0)} NM • {rec.zone.source === 'model' ? t('map_satellite') : t('map_official')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.zoneSummaryCard}>
        <View style={styles.zoneHeaderRow}>
          <View style={styles.zoneHeaderTexts}>
            <Text style={styles.zoneNameText} numberOfLines={1}>{currentZone.zone.name}</Text>
            {!!sourceLine(currentZone) && (
              <Text style={styles.zoneSourceText} numberOfLines={1}>{sourceLine(currentZone)}</Text>
            )}
          </View>
          {currentZone.zone.potential !== null && (
            <View style={styles.potentialBadge}>
              <Icon name="satellite-variant" size={14} color="#059669" />
              <Text style={styles.potentialBadgeText}>
                {t('map_sat_score').replace('{p}', String(currentZone.zone.potential))}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Icon name="map-marker-distance" size={18} color={Colors.oceanBlue} />
            <Text style={styles.metricValText} numberOfLines={1} adjustsFontSizeToFit>
              {currentZone.distanceNm.toFixed(1)} NM
            </Text>
            <Text style={styles.metricLabelText} numberOfLines={1}>{t('map_distance')}</Text>
          </View>
          <View style={styles.metricBox}>
            <Icon name="clock-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.metricValText} numberOfLines={1} adjustsFontSizeToFit>
              ~{formatDuration(currentZone.realisticRoute.totalDurationHours)}
            </Text>
            <Text style={styles.metricLabelText} numberOfLines={1}>{t('map_run_time')}</Text>
          </View>
          <View style={styles.metricBox}>
            <Icon name="gas-station" size={18} color="#D97706" />
            <Text style={styles.metricValText} numberOfLines={1} adjustsFontSizeToFit>
              ~{currentZone.realisticRoute.estimatedDieselLiters} L
            </Text>
            <Text style={styles.metricLabelText} numberOfLines={1}>{t('map_diesel')}</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.88} onPress={onStartNavigation} style={styles.primaryBtn}>
          <Icon name="map-marker-path" size={22} color="#FFFFFF" />
          <Text style={styles.primaryBtnText} numberOfLines={1} adjustsFontSizeToFit>
            {t('map_view_route')}
          </Text>
          <Icon name="chevron-right" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  browseContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.cardHeavy,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  listHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 7,
    paddingBottom: 10,
    paddingRight: 4,
  },
  tabBtn: {
    width: 112,
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabBtnTop: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  bestTag: {
    position: 'absolute',
    top: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  bestTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  tabBtnSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  tabSubText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  zoneSummaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  zoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  zoneHeaderTexts: {
    flex: 1,
  },
  zoneNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2540',
  },
  zoneSourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  potentialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  potentialBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  metricValText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A2540',
    marginTop: 3,
  },
  metricLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  primaryBtn: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
    ...Shadows.fab,
  },
  primaryBtnStop: {
    backgroundColor: '#B91C1C',
  },
  primaryBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  navTopBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    zIndex: 30,
    ...Shadows.cardHeavy,
  },
  navTopRouteInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  navPortText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0A2540',
  },
  navDestText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2540',
  },
  exitRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  exitRouteText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  navBottomPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.cardHeavy,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  statBig: {
    fontSize: 25,
    fontWeight: '900',
    color: '#0A2540',
    marginTop: 1,
  },
  statSteer: {
    color: '#0284C7',
  },
  statDiesel: {
    color: '#B45309',
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  statSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#E2E8F0',
  },
  arrivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  arrivedText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
  },
  waitingText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#92400E',
  },
  navTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  targetTexts: {
    flex: 1,
  },
  targetTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0A2540',
  },
  targetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  stepsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F0F9FF',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  stepsToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.oceanBlue,
  },
  legsScroll: {
    maxHeight: 190,
    marginBottom: 10,
  },
  legStepCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.oceanBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  legStepTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2540',
  },
  legCompassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E0F2FE',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  legCompassText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oceanBlue,
  },
  legInstruction: {
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
    marginTop: 5,
  },
  legSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  estimateNote: {
    fontSize: 11,
    lineHeight: 16,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 4,
  },
});

export default FishermanRouteView;
