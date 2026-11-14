/**
 * AlertDetailModal — Detailed view for an alert: the bulletin's own figures, a plain
 * Kannada summary built only from those figures, and a real read-aloud button
 * (Gnani text-to-speech through the MatsyaMitra backend).
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Sound from 'react-native-nitro-sound';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../services/api/client';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import Badge from '../common/Badge';
import type { AlertItem } from '../../data/mockAlerts';
import { useLanguage } from '../../i18n';

interface AlertDetailModalProps {
  visible: boolean;
  alert: AlertItem | null;
  onClose: () => void;
  onNavigateToMap?: (alert: AlertItem) => void;
}

const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  visible,
  alert,
  onClose,
  onNavigateToMap,
}) => {
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const stopAudio = () => {
    Sound.stopPlayer().catch(() => undefined);
    Sound.removePlaybackEndListener();
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    if (!visible) {
      stopAudio();
      setIsLoadingAudio(false);
      setAudioError(null);
    }
  }, [visible]);

  if (!alert) return null;

  // Figures quoted in the bulletin text itself
  const isAdvisory = alert.category === 'advisory' || alert.source.includes('INCOIS');
  const distanceMatch = alert.body.match(/(\d+\.?\d*)\s*km/i);
  const bearingMatch = alert.body.match(/bearing\s*(\d+)/i);
  const depthMatch = alert.body.match(/depth\s*(\d+)\s*m/i);
  const scoreMatch = alert.body.match(/score:\s*(\d+\.?\d*)\s*\/\s*10/i);
  const shown = language === 'kn' && alert.kn ? { ...alert, ...alert.kn } : alert;
  const place = alert.title.includes(':') ? alert.title.split(':').slice(1).join(':').trim() : alert.title;

  // Plain Kannada summary — only restates what the bulletin says, adds no new claims.
  const kannadaNarrative = alert.kn
    ? `${alert.kn.title}. ${alert.kn.body}`
    : isAdvisory
    ? [
        `INCOIS ಮೀನುಗಾರಿಕೆ ವಲಯ: ${place}.`,
        distanceMatch ? `ದೂರ ${distanceMatch[1]} ಕಿಲೋಮೀಟರ್.` : '',
        bearingMatch ? `ದಿಕ್ಕು ${bearingMatch[1]} ಡಿಗ್ರಿ.` : '',
        depthMatch ? `ಆಳ ${depthMatch[1]} ಮೀಟರ್.` : '',
        'ಹೊರಡುವ ಮೊದಲು ಸಮುದ್ರದ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ.',
      ]
        .filter(Boolean)
        .join(' ')
    : [
        `ಸಮುದ್ರ ಎಚ್ಚರಿಕೆ: ${place}.`,
        scoreMatch ? `ಅಪಾಯದ ಅಂಕ ಹತ್ತರಲ್ಲಿ ${scoreMatch[1]}.` : '',
        alert.severity === 'urgent'
          ? 'ಗಾಳಿ ಅಥವಾ ಅಲೆ ಅಪಾಯ ಹೆಚ್ಚಿದೆ. ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯಬೇಡಿ.'
          : 'ಸಣ್ಣ ದೋಣಿಗಳು ಎಚ್ಚರಿಕೆ ವಹಿಸಿ.',
      ]
        .filter(Boolean)
        .join(' ');

  const handleToggleAudio = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }
    setAudioError(null);
    setIsLoadingAudio(true);
    try {
      // Spell out units and symbols so the voice reads them naturally.
      const spoken = kannadaNarrative
        .replace(/\s*\([A-Z]{1,3}\)/g, '')
        .replace(/ಕಿ\.ಮೀ\/ಗಂ/g, 'ಕಿಲೋಮೀಟರ್ ಪ್ರತಿ ಗಂಟೆ')
        .replace(/ಕಿ\.ಮೀ/g, 'ಕಿಲೋಮೀಟರ್')
        .replace(/(\d)\s*ಮೀ(?![ಀ-೿])/g, '$1 ಮೀಟರ್')
        .replace(/°/g, ' ಡಿಗ್ರಿ')
        .replace(/(\d+\.?\d*)\/10/g, 'ಹತ್ತರಲ್ಲಿ $1');
      const result = await apiClient.speakKannada(spoken);
      if (!result.audio_url) {
        setAudioError(result.audio_error || 'Audio unavailable');
        return;
      }
      await Sound.startPlayer(apiClient.getVoiceAudioUrl(result.audio_url));
      setIsPlayingAudio(true);
      Sound.addPlaybackEndListener(() => setIsPlayingAudio(false));
    } catch (err: any) {
      setIsPlayingAudio(false);
      setAudioError(err?.message || 'Audio unavailable');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, Spacing.md) + 4 }]}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Icon
                  name={alert.icon || (isAdvisory ? 'fish' : 'alert-circle')}
                  size={22}
                  color={isAdvisory ? Colors.primaryAccent : Colors.danger}
                />
              </View>
              <View>
                <Badge
                  label={shown.badgeLabel}
                  variant={alert.severity}
                  small
                />
                <Text style={styles.sourceText}>
                  {alert.source} • {alert.timestamp}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}>
              <Icon name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.alertTitle}>{shown.title}</Text>

            {/* Nautical Parameters Grid (for INCOIS advisories) */}
            {isAdvisory && (distanceMatch || bearingMatch || depthMatch) && (
              <View style={styles.metricsCard}>
                <Text style={styles.metricsCardTitle}>{language === 'kn' ? 'ಬುಲೆಟಿನ್ ವಿವರ' : 'FROM THE BULLETIN'}</Text>
                <View style={styles.metricsGrid}>
                  {distanceMatch && (
                    <View style={styles.metricItem}>
                      <Icon name="map-marker-distance" size={18} color={Colors.primaryAccent} />
                      <Text style={styles.metricItemLabel}>{language === 'kn' ? 'ದೂರ' : 'DISTANCE'}</Text>
                      <Text style={styles.metricItemValue}>{distanceMatch[1]} km</Text>
                      <Text style={styles.metricItemSub}>
                        ({(parseFloat(distanceMatch[1]) / 1.852).toFixed(1)} NM)
                      </Text>
                    </View>
                  )}
                  {bearingMatch && (
                    <View style={styles.metricItem}>
                      <Icon name="compass" size={18} color={Colors.oceanBlue} />
                      <Text style={styles.metricItemLabel}>{language === 'kn' ? 'ದಿಕ್ಕು' : 'BEARING'}</Text>
                      <Text style={styles.metricItemValue}>{bearingMatch[1]}°</Text>
                    </View>
                  )}
                  {depthMatch && (
                    <View style={styles.metricItem}>
                      <Icon name="wave" size={18} color={Colors.caution} />
                      <Text style={styles.metricItemLabel}>{language === 'kn' ? 'ಆಳ' : 'SEA DEPTH'}</Text>
                      <Text style={styles.metricItemValue}>{depthMatch[1]} m</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Official English Bulletin */}
            <View style={styles.bulletinSection}>
              <Text style={styles.sectionHeader}>{language === 'kn' ? 'ಮೂಲ ಪ್ರಕಟಣೆ' : 'BULLETIN TEXT'}</Text>
              <Text style={styles.bulletinBody}>{alert.body}</Text>
            </View>

            {/* Coastal Kannada Translation & Advice */}
            <View style={styles.kannadaCard}>
              <View style={styles.kannadaHeader}>
                <Icon name="translate" size={18} color={Colors.primaryAccent} />
                <Text style={styles.kannadaHeaderTitle}>ಕನ್ನಡದಲ್ಲಿ</Text>
              </View>
              <Text style={styles.kannadaBody}>{kannadaNarrative}</Text>
            </View>

            {/* Read aloud — real Kannada speech from the backend (Gnani TTS) */}
            <TouchableOpacity
              style={[styles.playButton, isPlayingAudio && styles.playButtonActive]}
              activeOpacity={0.8}
              disabled={isLoadingAudio}
              onPress={handleToggleAudio}>
              {isLoadingAudio ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Icon name={isPlayingAudio ? 'stop' : 'volume-high'} size={24} color="#FFFFFF" />
              )}
              <Text style={styles.playButtonText}>
                {isPlayingAudio ? 'ನಿಲ್ಲಿಸಿ (Stop)' : 'ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ (Listen)'}
              </Text>
            </TouchableOpacity>
            {!!audioError && <Text style={styles.audioErrorText}>{audioError}</Text>}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.modalFooter}>
            {isAdvisory && onNavigateToMap && (
              <TouchableOpacity
                style={styles.mapButton}
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  onNavigateToMap(alert);
                }}>
                <Icon name="map-marker-path" size={18} color="#FFFFFF" />
                <Text style={styles.mapButtonText}>
                  {language === 'kn' ? 'ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ' : 'Plot on Marine Map'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.dismissButton}
              activeOpacity={0.7}
              onPress={onClose}>
              <Text style={styles.dismissButtonText}>
                {language === 'kn' ? 'ಮುಚ್ಚಿ' : 'Dismiss'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '88%',
    ...Shadows.bottomSheet,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceText: {
    ...Typography.micro,
    color: Colors.textSecondary,
    marginTop: 3,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  alertTitle: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  metricsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: Spacing.md,
  },
  metricsCardTitle: {
    ...Typography.micro,
    color: '#15803D',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  metricItemLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
    fontWeight: '700',
  },
  metricItemValue: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
    fontSize: 14,
    marginTop: 2,
  },
  metricItemSub: {
    ...Typography.micro,
    color: Colors.textMuted,
    fontSize: 9,
  },
  bulletinSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.oceanBlue,
  },
  sectionHeader: {
    ...Typography.micro,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bulletinBody: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  kannadaCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  kannadaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  kannadaHeaderTitle: {
    ...Typography.micro,
    color: '#1E40AF',
    fontWeight: '700',
  },
  kannadaBody: {
    ...Typography.body,
    color: '#1E293B',
    lineHeight: 22,
    fontWeight: '500',
  },
  audioPlayerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.xl,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  audioTitle: {
    ...Typography.micro,
    color: Colors.oceanBlue,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.oceanBlue,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  playButtonActive: {
    backgroundColor: '#D97706',
  },
  playButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
  },
  waveBar: {
    width: 4,
    backgroundColor: Colors.oceanBlue,
    borderRadius: 2,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.oceanBlue,
  },
  audioErrorText: {
    color: '#B45309',
    fontSize: 12.5,
    marginTop: 6,
    marginBottom: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  mapButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAccent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.fab,
  },
  mapButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dismissButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  dismissButtonText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

export default AlertDetailModal;
