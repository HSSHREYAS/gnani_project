/**
 * WeatherCard — the "can I go out today?" card.
 *
 * Leads with one large go / caution / no-go verdict, then live wind, waves and the
 * backend risk score, then satellite sea temperature and chlorophyll.
 * Every number is a live backend reading. A missing reading is shown as "—",
 * and old readings are flagged — nothing is filled in with made-up values.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { WeatherData } from '../../data/mockWeather';
import { useLanguage } from '../../i18n';

interface WeatherCardProps {
  weather: WeatherData;
}

const DASH = '—';

const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const { t } = useLanguage();

  const verdict = useMemo(() => {
    switch (weather.seaState) {
      case 'rough':
        return {
          label: t('unsafe_to_fish'),
          condition: t('cond_rough_sea'),
          icon: 'alert-octagon',
          bg: '#FEE2E2',
          border: '#FCA5A5',
          text: '#B91C1C',
        };
      case 'moderate':
        return {
          label: t('caution_to_fish'),
          condition: t('cond_moderate'),
          icon: 'alert',
          bg: '#FEF3C7',
          border: '#FCD34D',
          text: '#B45309',
        };
      case 'calm':
        return {
          label: t('safe_to_fish'),
          condition: t('cond_clear_calm'),
          icon: 'check-circle',
          bg: '#DCFCE7',
          border: '#86EFAC',
          text: '#15803D',
        };
      default:
        return {
          label: t('no_reading_badge'),
          condition: t('sea_state_unknown'),
          icon: 'help-circle',
          bg: '#F1F5F9',
          border: '#CBD5E1',
          text: '#475569',
        };
    }
  }, [weather.seaState, t]);

  const localiseAge = (age: string): string =>
    age
      .replace('min', t('unit_min'))
      .replace('hr', t('unit_hr'))
      .replace('days', t('unit_days'));

  const freshness = useMemo(() => {
    if (!weather.marineAge) return null;
    const age = localiseAge(weather.marineAge);
    if (weather.marineStale) {
      return { stale: true, text: t('old_data_warning').replace('{age}', age) };
    }
    return { stale: false, text: t('updated_ago').replace('{age}', age) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather.marineAge, weather.marineStale, t]);

  const show = (value: number | null, unit: string): string =>
    value === null || value === undefined ? DASH : `${value} ${unit}`;

  return (
    <View style={styles.card}>
      {/* Verdict banner — the one thing a fisher needs at a glance */}
      <View style={[styles.verdict, { backgroundColor: verdict.bg, borderColor: verdict.border }]}>
        <Icon name={verdict.icon} size={38} color={verdict.text} />
        <View style={styles.verdictTexts}>
          <Text style={[styles.verdictLabel, { color: verdict.text }]} numberOfLines={2}>
            {verdict.label}
          </Text>
          <Text style={styles.verdictCondition} numberOfLines={1}>
            {verdict.condition}
          </Text>
        </View>
      </View>

      {/* Freshness line */}
      {freshness && (
        <View style={styles.freshRow}>
          <Icon
            name={freshness.stale ? 'clock-alert-outline' : 'access-point'}
            size={14}
            color={freshness.stale ? '#B45309' : '#0D9488'}
          />
          <Text
            style={[styles.freshText, freshness.stale && styles.freshTextStale]}
            numberOfLines={2}>
            {freshness.text}
          </Text>
        </View>
      )}

      {/* Row 1: live wind, waves, risk score */}
      <View style={styles.metricsRow}>
        <View style={styles.metricTile}>
          <Icon name="weather-windy" size={22} color="#0D9488" />
          <Text style={styles.tileLabel} numberOfLines={1}>{t('wind_label')}</Text>
          <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
            {show(weather.windSpeed, weather.windUnit)}
          </Text>
        </View>

        <View style={styles.metricTile}>
          <Icon name="waves" size={22} color="#0284C7" />
          <Text style={styles.tileLabel} numberOfLines={1}>{t('waves_label')}</Text>
          <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
            {show(weather.waveHeight, weather.waveUnit)}
          </Text>
        </View>

        <View style={styles.metricTile}>
          <Icon name="shield-alert-outline" size={22} color={verdict.text} />
          <Text style={styles.tileLabel} numberOfLines={1}>{t('risk_label')}</Text>
          <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
            {weather.riskScore === null ? DASH : `${weather.riskScore} / 10`}
          </Text>
        </View>
      </View>

      {/* Row 2: satellite sea temperature and chlorophyll */}
      <View style={styles.oceanRow}>
        <View style={styles.oceanTile}>
          <Icon name="thermometer" size={22} color="#0D9488" />
          <View style={styles.oceanTileTexts}>
            <Text style={styles.oceanTileLabel} numberOfLines={1}>{t('sea_temp_label')}</Text>
            <Text style={styles.oceanTileValue} numberOfLines={1}>
              {show(weather.seaTemp, '°C')}
            </Text>
          </View>
        </View>

        <View style={styles.oceanTile}>
          <Icon name="leaf" size={22} color="#0D9488" />
          <View style={styles.oceanTileTexts}>
            <Text style={styles.oceanTileLabel} numberOfLines={1}>{t('chlorophyll_label')}</Text>
            <Text style={styles.oceanTileValue} numberOfLines={1} adjustsFontSizeToFit>
              {show(weather.chlorophyll, weather.chlorophyllUnit)}
            </Text>
          </View>
        </View>
      </View>

      {weather.satelliteDate && (
        <Text style={styles.satelliteNote} numberOfLines={1}>
          {t('satellite_on').replace('{date}', weather.satelliteDate)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 10,
  },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  verdictTexts: {
    flex: 1,
  },
  verdictLabel: {
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 27,
  },
  verdictCondition: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  freshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  freshText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  freshTextStale: {
    color: '#B45309',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  metricTile: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
    marginBottom: 2,
  },
  tileValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2540',
  },
  oceanRow: {
    flexDirection: 'row',
    gap: 8,
  },
  oceanTile: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  oceanTileTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  oceanTileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 1,
  },
  oceanTileValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A2540',
  },
  satelliteNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default WeatherCard;
