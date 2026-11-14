/**
 * RiskBottomSheet — bottom panel for the map's Sea Risk layer.
 *
 * Shows how many ports are currently calm / caution / rough and the live wind,
 * wave and risk reading of the port the fisher tapped. All figures come from the
 * live current-state feed; there are no placeholder tide or visibility values.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Shadows } from '../../theme';
import { useLanguage } from '../../i18n';
import type { RiskZone } from '../../data/mockZones';

interface RiskBottomSheetProps {
  riskZones: RiskZone[];
  selectedZone?: RiskZone | null;
  bottomInset: number;
}

const LEVEL_LOOK = {
  low: { color: '#15803D', bg: '#DCFCE7', icon: 'check-circle' },
  moderate: { color: '#B45309', bg: '#FEF3C7', icon: 'alert' },
  critical: { color: '#B91C1C', bg: '#FEE2E2', icon: 'alert-octagon' },
} as const;

const RiskBottomSheet: React.FC<RiskBottomSheetProps> = ({ riskZones, selectedZone, bottomInset }) => {
  const { t } = useLanguage();

  const counts = useMemo(
    () => ({
      low: riskZones.filter((z) => z.riskLevel === 'low').length,
      moderate: riskZones.filter((z) => z.riskLevel === 'moderate').length,
      critical: riskZones.filter((z) => z.riskLevel === 'critical').length,
    }),
    [riskZones],
  );

  const label = (level: keyof typeof LEVEL_LOOK) =>
    level === 'critical' ? t('ps_rough') : level === 'moderate' ? t('ps_caution') : t('ps_calm');

  const localiseAge = (age: string): string =>
    age.replace('min', t('unit_min')).replace('hr', t('unit_hr')).replace('days', t('unit_days'));

  return (
    <View style={[styles.container, { paddingBottom: Math.max(bottomInset, 10) + 6 }]}>
      <Text style={styles.title}>{t('risk_sheet_title')}</Text>

      {riskZones.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="cloud-off-outline" size={28} color="#94A3B8" />
          <Text style={styles.hint}>{t('risk_no_data')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.countsRow}>
            {(['low', 'moderate', 'critical'] as const).map((level) => (
              <View key={level} style={[styles.countTile, { backgroundColor: LEVEL_LOOK[level].bg }]}>
                <Text style={[styles.countValue, { color: LEVEL_LOOK[level].color }]}>{counts[level]}</Text>
                <Text style={[styles.countLabel, { color: LEVEL_LOOK[level].color }]} numberOfLines={1}>
                  {label(level)}
                </Text>
              </View>
            ))}
          </View>

          {selectedZone ? (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailName} numberOfLines={1}>{selectedZone.name}</Text>
                <View style={[styles.levelBadge, { backgroundColor: LEVEL_LOOK[selectedZone.riskLevel].bg }]}>
                  <Icon
                    name={LEVEL_LOOK[selectedZone.riskLevel].icon}
                    size={14}
                    color={LEVEL_LOOK[selectedZone.riskLevel].color}
                  />
                  <Text style={[styles.levelBadgeText, { color: LEVEL_LOOK[selectedZone.riskLevel].color }]}>
                    {label(selectedZone.riskLevel)}
                  </Text>
                </View>
              </View>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Icon name="weather-windy" size={18} color="#0D9488" />
                  <Text style={styles.metricText}>
                    {selectedZone.windSpeed === null ? '—' : `${selectedZone.windSpeed} km/h`}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Icon name="waves" size={18} color="#0284C7" />
                  <Text style={styles.metricText}>
                    {selectedZone.waveHeight === null ? '—' : `${selectedZone.waveHeight} m`}
                  </Text>
                </View>
                {selectedZone.score !== null && selectedZone.score !== undefined && (
                  <View style={styles.metric}>
                    <Icon name="shield-alert-outline" size={18} color={LEVEL_LOOK[selectedZone.riskLevel].color} />
                    <Text style={styles.metricText}>{selectedZone.score.toFixed(1)} / 10</Text>
                  </View>
                )}
              </View>
              {!!selectedZone.ageLabel && (
                <Text style={[styles.ageText, selectedZone.isStale && styles.ageTextStale]}>
                  {(selectedZone.isStale ? t('old_data_warning') : t('updated_ago')).replace(
                    '{age}',
                    localiseAge(selectedZone.ageLabel),
                  )}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.hintRow}>
              <Icon name="gesture-tap" size={20} color={Colors.oceanBlue} />
              <Text style={styles.hint}>{t('risk_tap_hint')}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.cardHeavy,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 10,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  countTile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  countValue: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  detailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  detailName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0A2540',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 10,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0A2540',
  },
  ageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
    marginTop: 8,
  },
  ageTextStale: {
    color: '#B45309',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  hint: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#475569',
    fontWeight: '600',
  },
});

export default RiskBottomSheet;
