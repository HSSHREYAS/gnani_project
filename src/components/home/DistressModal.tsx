/**
 * DistressModal — Emergency Distress Beacon & Coastal Guard Hotline.
 * Prepares an SMS with the phone's real GPS position (from the device location
 * store). If the phone has no fix, the card says so plainly and falls back to the
 * home port position, clearly labelled as NOT the boat's position.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fixAgeMinutes,
  hasLocationPermission,
  requestLocationPermission,
  startLocationUpdates,
  useDeviceLocation,
} from '../../services/location/deviceLocation';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useLanguage, type TranslationKey } from '../../i18n';

interface DistressModalProps {
  visible: boolean;
  onClose: () => void;
  currentPort: string;
  latitude?: number;
  longitude?: number;
}

interface EmergencyContactItem {
  id: string;
  titleKey: TranslationKey;
  subKey: TranslationKey;
  titleFallback: string;
  subFallback: string;
  phone: string;
  icon: string;
}

const EMERGENCY_CONTACTS: EmergencyContactItem[] = [
  {
    id: 'coast_guard',
    titleKey: 'sos_coast_guard',
    subKey: 'sos_coast_guard_sub',
    titleFallback: 'Indian Coast Guard SAR',
    subFallback: 'National Maritime Search & Rescue (Toll Free)',
    phone: '1554',
    icon: 'shield-alert',
  },
  {
    id: 'karnataka_coastal_police',
    titleKey: 'sos_coastal_police',
    subKey: 'sos_coastal_police_sub',
    titleFallback: 'Karnataka Coastal Police',
    subFallback: 'Coastal Security Police Helpline (CSP)',
    phone: '1093',
    icon: 'police-badge',
  },
  {
    id: 'emergency_national',
    titleKey: 'sos_emergency_112',
    subKey: 'sos_emergency_112_sub',
    titleFallback: 'National Emergency Service',
    subFallback: 'Police, Ambulance & Fire Integrated',
    phone: '112',
    icon: 'phone-alert',
  },
];

const DistressModal: React.FC<DistressModalProps> = ({
  visible,
  onClose,
  currentPort,
  latitude,
  longitude,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [isSosActive, setIsSosActive] = useState(false);
  const [gpsAllowed, setGpsAllowed] = useState<boolean | null>(null);
  const [, setClock] = useState(0);
  const fix = useDeviceLocation();

  // Ask for location as soon as the SOS sheet opens, and keep the "age" label ticking.
  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    setIsSosActive(false);
    hasLocationPermission().then(async (granted) => {
      const ok = granted || (await requestLocationPermission());
      if (active) setGpsAllowed(ok);
    });
    const timer = setInterval(() => setClock((n) => n + 1), 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [visible]);

  // Keep the GPS running for as long as the SOS sheet is open.
  useEffect(() => {
    if (!visible || gpsAllowed !== true) return undefined;
    return startLocationUpdates();
  }, [visible, gpsAllowed]);

  const ageMin = fix ? fixAgeMinutes(fix) : null;
  const isLive = fix !== null && ageMin !== null && ageMin < 2;
  const hasGps = fix !== null;
  const posLat = hasGps ? fix!.latitude : latitude;
  const posLon = hasGps ? fix!.longitude : longitude;
  const latStr = typeof posLat === 'number' ? posLat.toFixed(5) : '—';
  const lonStr = typeof posLon === 'number' ? posLon.toFixed(5) : '—';

  const ageLabel = (() => {
    if (ageMin === null) return '';
    if (ageMin < 60) return `${Math.max(1, Math.round(ageMin))} ${t('unit_min')}`;
    if (ageMin < 48 * 60) return `${Math.round(ageMin / 60)} ${t('unit_hr')}`;
    return `${Math.round(ageMin / 1440)} ${t('unit_days')}`;
  })();

  const positionTitle = isLive
    ? t('sos_gps_live')
    : hasGps
    ? t('sos_gps_old').replace('{age}', ageLabel)
    : t('sos_no_gps');

  const handleAllowGps = async () => {
    const ok = await requestLocationPermission();
    setGpsAllowed(ok);
    if (!ok) Linking.openSettings().catch(() => {});
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Call Failed', `Could not automatically dial ${phoneNumber}. Please dial manually.`);
    });
  };

  const handleSendEmergencySms = () => {
    const timestamp = new Date().toLocaleTimeString();
    const positionText = hasGps
      ? `GPS position${isLive ? '' : ` (${Math.round(ageMin || 0)} min old)`}: Lat ${latStr} N, Lon ${lonStr} E. Map: https://maps.google.com/?q=${latStr},${lonStr}`
      : `No GPS fix. Home port: ${currentPort}${typeof posLat === 'number' ? ` (Lat ${latStr} N, Lon ${lonStr} E)` : ''}`;
    const smsBody = `MAYDAY! EMERGENCY from MatsyaMitra. Vessel needs immediate assistance. ${positionText}. Time: ${timestamp}. Please dispatch Search & Rescue.`;
    // 1093 is standard coastal emergency receiver
    const smsUrl = `sms:1093?body=${encodeURIComponent(smsBody)}`;

    Linking.openURL(smsUrl)
      .then(() => {
        setIsSosActive(true);
      })
      .catch(() => {
        Alert.alert(
          'SMS Client Not Available',
          `Could not open default SMS client.\n\nPlease send text to 1093 with:\n"MAYDAY at Lat ${latStr}, Lon ${lonStr}"`,
        );
      });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Icon name="alert-octagon" size={26} color="#FF4D4D" />
              </View>
              <View>
                <Text style={styles.headerTitle}>{t('sos_title')}</Text>
                <Text style={styles.headerSubtitle}>{t('sos_subtitle')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Position card — real device GPS, honestly labelled */}
            <View style={[styles.beaconCard, !hasGps && styles.beaconCardNoGps]}>
              <View style={styles.beaconHeader}>
                <View
                  style={[
                    styles.beaconIndicator,
                    { backgroundColor: isLive ? '#16A34A' : hasGps ? '#D97706' : '#DC2626' },
                  ]}
                />
                <Text style={styles.beaconTitle}>{positionTitle}</Text>
              </View>
              <View style={styles.coordsRow}>
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>{t('sos_latitude')}</Text>
                  <Text style={styles.coordValue} numberOfLines={1} adjustsFontSizeToFit>
                    {latStr}° N
                  </Text>
                </View>
                <View style={styles.coordDivider} />
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>{t('sos_longitude')}</Text>
                  <Text style={styles.coordValue} numberOfLines={1} adjustsFontSizeToFit>
                    {lonStr}° E
                  </Text>
                </View>
              </View>
              <Text style={styles.stationNote}>
                {hasGps && fix!.accuracy !== null
                  ? t('sos_accuracy').replace('{m}', String(Math.round(fix!.accuracy as number)))
                  : !hasGps && gpsAllowed
                  ? t('sos_gps_searching')
                  : currentPort}
              </Text>

              {gpsAllowed === false && (
                <TouchableOpacity style={styles.gpsAllowBtn} onPress={handleAllowGps} activeOpacity={0.8}>
                  <Icon name="crosshairs-gps" size={18} color="#FFFFFF" />
                  <View style={styles.gpsAllowTexts}>
                    <Text style={styles.gpsAllowTitle}>{t('sos_allow_gps')}</Text>
                    <Text style={styles.gpsAllowSub}>{t('sos_gps_denied')}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Main SOS Trigger Button */}
            <TouchableOpacity
              style={[styles.sosButton, isSosActive && styles.sosButtonActive]}
              activeOpacity={0.8}
              onPress={handleSendEmergencySms}>
              <View style={styles.sosPulseIcon}>
                <Icon name="broadcast" size={32} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosBtnTitle}>
                  {isSosActive ? 'DISTRESS BROADCAST SENT' : t('sos_broadcast_btn')}
                </Text>
                <Text style={styles.sosBtnSubtitle}>
                  {t('sos_broadcast_sub')}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Helpline Section */}
            <Text style={styles.sectionHeader}>{t('sos_helpline_heading')}</Text>
            <View style={styles.contactsWrap}>
              {EMERGENCY_CONTACTS.map((contact) => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactLeft}>
                    <View style={styles.contactIconBox}>
                      <Icon name={contact.icon} size={22} color="#FF6B6B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>{t(contact.titleKey, contact.titleFallback)}</Text>
                      <Text style={styles.contactSubtitle}>{t(contact.subKey, contact.subFallback)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(contact.phone)}
                    activeOpacity={0.7}>
                    <Icon name="phone" size={16} color="#FFFFFF" />
                    <Text style={styles.callBtnText}>
                      {t('sos_call_btn')} {contact.phone}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Important Info Alert */}
            <View style={styles.infoBox}>
              <Icon name="information-outline" size={20} color={Colors.primaryAccent} />
              <Text style={styles.infoText}>
                {t('sos_2g_notice')}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 12, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.body,
    fontSize: 18,
    fontWeight: '700',
    color: '#D32F2F',
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  beaconCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: Spacing.lg,
  },
  beaconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  beaconIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
  },
  beaconTitle: {
    ...Typography.micro,
    color: '#D32F2F',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  coordBox: {
    flex: 1,
    alignItems: 'center',
  },
  coordDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#FCA5A5',
  },
  coordLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  coordValue: {
    ...Typography.body,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  beaconCardNoGps: {
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
  },
  gpsAllowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#B91C1C',
    borderRadius: 12,
    padding: 12,
    marginTop: Spacing.sm,
  },
  gpsAllowTexts: {
    flex: 1,
  },
  gpsAllowTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  gpsAllowSub: {
    color: '#FEE2E2',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  stationNote: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  sosButton: {
    backgroundColor: '#D32F2F',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadows.cardHeavy,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sosButtonActive: {
    backgroundColor: '#388E3C',
  },
  sosPulseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosBtnTitle: {
    ...Typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
    fontSize: 15,
  },
  sosBtnSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  sectionHeader: {
    ...Typography.micro,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.micro,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  contactsWrap: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  contactsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    flex: 1,
    marginRight: Spacing.sm,
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  contactSubtitle: {
    ...Typography.bodySmall,
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  callBtn: {
    backgroundColor: '#FF4D4D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  callBtnText: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 166, 136, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(15, 166, 136, 0.2)',
  },
  infoText: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
});

export default DistressModal;
