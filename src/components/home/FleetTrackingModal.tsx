/**
 * Port Sea Status board (opened from the "Port Status" quick action).
 *
 * Shows the live wind / wave / risk reading for every Karnataka port the backend
 * tracks, roughest first, so a fisher can compare harbours before choosing where
 * to launch. Built entirely from the live `/current-state` feed — the app has no
 * vessel-tracking (AIS) source, so it does not show boat counts.
 */

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useLanguage } from '../../i18n';
import { getCanonicalCityName, localizeCityName } from '../../services/api/canonicalLocations';
import { formatAge } from '../../services/api/transformers';
import type { CurrentStateResponse } from '../../services/api/types';

interface FleetTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  currentPort: string;
  states?: CurrentStateResponse[];
  selectedLocationId?: string;
}

type Level = 'calm' | 'caution' | 'rough';

const LEVEL_STYLE: Record<Level, { color: string; bg: string; icon: string }> = {
  calm: { color: '#15803D', bg: '#DCFCE7', icon: 'check-circle' },
  caution: { color: '#B45309', bg: '#FEF3C7', icon: 'alert' },
  rough: { color: '#B91C1C', bg: '#FEE2E2', icon: 'alert-octagon' },
};

function levelFor(category: string): Level {
  if (category === 'High Risk' || category === 'Extreme Risk') return 'rough';
  if (category === 'Moderate Risk') return 'caution';
  return 'calm';
}

const FleetTrackingModal: React.FC<FleetTrackingModalProps> = ({
  visible,
  onClose,
  currentPort,
  states = [],
  selectedLocationId,
}) => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();

  const ports = useMemo(() => {
    return states
      .filter((s) => s.risk && s.risk.score !== null)
      .map((s) => {
        const risk = s.risk!;
        return {
          id: s.location_id,
          name: getCanonicalCityName(s.location_id, s.city_name),
          level: levelFor(risk.category),
          score: risk.score as number,
          windKmh:
            risk.wind_speed !== null && risk.wind_speed !== undefined
              ? Math.round(risk.wind_speed * 3.6)
              : null,
          waveM:
            risk.wave_height !== null && risk.wave_height !== undefined
              ? risk.wave_height.toFixed(1)
              : null,
          age: formatAge(risk.age_hours),
          stale: risk.status !== 'CURRENT',
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [states]);

  const counts = useMemo(
    () => ({
      calm: ports.filter((p) => p.level === 'calm').length,
      caution: ports.filter((p) => p.level === 'caution').length,
      rough: ports.filter((p) => p.level === 'rough').length,
    }),
    [ports],
  );

  const levelLabel = (level: Level) =>
    level === 'rough' ? t('ps_rough') : level === 'caution' ? t('ps_caution') : t('ps_calm');

  const localiseAge = (age: string | null): string =>
    (age || '')
      .replace('min', t('unit_min'))
      .replace('hr', t('unit_hr'))
      .replace('days', t('unit_days'));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Icon name="anchor" size={24} color={Colors.primaryAccent} />
              </View>
              <View style={styles.headerTexts}>
                <Text style={styles.headerTitle} numberOfLines={1}>{t('ft_title')}</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {t('ft_subtitle')} • {localizeCityName(currentPort, language)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Icon name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {ports.length === 0 ? (
              <View style={styles.emptyBox}>
                <Icon name="cloud-off-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyText}>{t('ps_no_data')}</Text>
              </View>
            ) : (
              <>
                {/* Coast summary */}
                <View style={styles.summaryRow}>
                  {(['calm', 'caution', 'rough'] as Level[]).map((level) => (
                    <View
                      key={level}
                      style={[styles.summaryTile, { backgroundColor: LEVEL_STYLE[level].bg }]}>
                      <Text style={[styles.summaryValue, { color: LEVEL_STYLE[level].color }]}>
                        {counts[level]}
                      </Text>
                      <Text
                        style={[styles.summaryLabel, { color: LEVEL_STYLE[level].color }]}
                        numberOfLines={1}>
                        {levelLabel(level)}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>{t('ps_ports_heading')}</Text>

                <View style={styles.portsList}>
                  {ports.map((port) => {
                    const look = LEVEL_STYLE[port.level];
                    const isMine = port.id === selectedLocationId;
                    return (
                      <View key={port.id} style={[styles.portCard, isMine && styles.portCardMine]}>
                        <View style={styles.portTop}>
                          <View style={styles.portNameWrap}>
                            <Text style={styles.portName} numberOfLines={1}>{localizeCityName(port.name, language)}</Text>
                            {isMine && (
                              <View style={styles.minePill}>
                                <Text style={styles.minePillText}>{t('ps_your_port')}</Text>
                              </View>
                            )}
                          </View>
                          <View style={[styles.levelBadge, { backgroundColor: look.bg }]}>
                            <Icon name={look.icon} size={14} color={look.color} />
                            <Text style={[styles.levelBadgeText, { color: look.color }]}>
                              {levelLabel(port.level)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.portMetrics}>
                          <View style={styles.metricItem}>
                            <Icon name="weather-windy" size={16} color="#0D9488" />
                            <Text style={styles.metricText}>
                              {port.windKmh === null ? '—' : `${port.windKmh} km/h`}
                            </Text>
                          </View>
                          <View style={styles.metricItem}>
                            <Icon name="waves" size={16} color="#0284C7" />
                            <Text style={styles.metricText}>
                              {port.waveM === null ? '—' : `${port.waveM} m`}
                            </Text>
                          </View>
                          <View style={styles.metricItem}>
                            <Icon name="shield-alert-outline" size={16} color={look.color} />
                            <Text style={styles.metricText}>{port.score.toFixed(1)} / 10</Text>
                          </View>
                        </View>

                        {!!port.age && (
                          <Text style={[styles.ageText, port.stale && styles.ageTextStale]}>
                            {(port.stale ? t('old_data_warning') : t('updated_ago')).replace(
                              '{age}',
                              localiseAge(port.age),
                            )}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                <View style={styles.noteBox}>
                  <Icon name="information-outline" size={18} color={Colors.primaryAccent} />
                  <Text style={styles.noteText}>{t('ps_source_note')}</Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.cardHeavy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTexts: {
    flex: 1,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryAccentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.body,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  summaryTile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: Spacing.sm,
  },
  portsList: {
    gap: Spacing.sm,
  },
  portCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  portCardMine: {
    borderColor: '#0D9488',
    borderWidth: 1.5,
    backgroundColor: '#F0FDFA',
  },
  portTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  portNameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2540',
  },
  minePill: {
    backgroundColor: '#0D9488',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  minePillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
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
  portMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A2540',
  },
  ageText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  ageTextStale: {
    color: '#B45309',
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.primaryAccentLight,
    borderRadius: 12,
    padding: 12,
    marginTop: Spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#0F766E',
    fontWeight: '500',
  },
});

export default FleetTrackingModal;
