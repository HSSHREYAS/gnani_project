/**
 * HomeScreen — Main dashboard with full-bleed ocean sunrise hero header,
 * live GEE satellite telemetry, INCOIS advisories, view on map, and 2x2 quick actions.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TopBar from '../components/home/TopBar';
import HeroScene from '../components/home/HeroScene';
import { nameForLanguage } from '../utils/kannadaName';
import LocationSelectorModal from '../components/home/LocationSelectorModal';
import WeatherCard from '../components/home/WeatherCard';
import FishingAdvisory from '../components/home/FishingAdvisory';
import QuickActions from '../components/home/QuickActions';
import CatchLogModal from '../components/home/CatchLogModal';
import DistressModal from '../components/home/DistressModal';
import EquipmentChecklistModal from '../components/home/EquipmentChecklistModal';
import FleetTrackingModal from '../components/home/FleetTrackingModal';
import {
  useCurrentState,
  useAdvisories,
  transformCurrentStateToWeather,
  transformIncoisAdvisoriesToUI,
  localizeCityName,
  getCanonicalCityName,
  CANONICAL_PORT_COORDINATES,
} from '../services/api';
import { useLanguage } from '../i18n';
import { calculateHaversineDistanceKm } from '../services/navigation/nauticalRoutingEngine';
import { getUserProfile, saveUserProfile } from '../services/storage/userProfileStorage';

interface HomeScreenProps {
  navigation?: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t, language } = useLanguage();
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [activeModal, setActiveModal] = useState<'catch' | 'distress' | 'equipment' | 'fleet' | null>(null);
  const [fisherName, setFisherName] = useState<string>('');
  const [fisherNameKn, setFisherNameKn] = useState<string>('');

  // Live backend hooks
  const {
    states,
    selectedState,
    isLoading: isStateLoading,
    isOnline: isStateOnline,
    refresh: refreshCurrentState,
    selectLocation,
  } = useCurrentState('KARN_001');

  // Synchronize default location from saved profile on mount and on tab focus
  useEffect(() => {
    const syncProfilePort = () => {
      getUserProfile().then((profile) => {
        if (profile?.defaultPortId) {
          selectLocation(profile.defaultPortId);
        }
        setFisherName((profile?.fisherName || '').trim());
        setFisherNameKn((profile?.fisherNameKn || '').trim());
      });
    };

    syncProfilePort();
    const unsubscribe = navigation?.addListener?.('focus', syncProfilePort);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigation, selectLocation]);

  const {
    rawAdvisories,
    isLoading: isAdvLoading,
    refresh: refreshAdvisories,
  } = useAdvisories();

  const isRefreshing = isStateLoading || isAdvLoading;

  const handleRefresh = async () => {
    await Promise.all([refreshCurrentState(), refreshAdvisories()]);
  };

  const handleLocationPress = () => {
    setIsLocationModalVisible(true);
  };

  const handleSelectLocation = async (locationId: string) => {
    selectLocation(locationId);
    setIsLocationModalVisible(false);
    
    // Dynamically update the default port in the user's profile so the Map screen syncs!
    const cityName = getCanonicalCityName(locationId);
    try {
      await saveUserProfile({
        defaultPortId: locationId,
        defaultPortName: cityName,
      });
    } catch {
      // ignore
    }
  };

  // Derive weather data: strictly live backend current state with GEE observations
  const weatherData = useMemo(() => {
    if (selectedState && (selectedState.risk || selectedState.pfz)) {
      return transformCurrentStateToWeather(selectedState);
    }
    return null;
  }, [selectedState]);

  // Live INCOIS bulletins, nearest to the fisher's own port first.
  const activeAdvisories = useMemo(() => {
    if (!rawAdvisories || rawAdvisories.length === 0) return [];
    const port = selectedState ? CANONICAL_PORT_COORDINATES[selectedState.location_id] : undefined;
    const items = transformIncoisAdvisoriesToUI(rawAdvisories).map((item) => ({
      ...item,
      kmFromPort:
        port && typeof item.latitude === 'number' && typeof item.longitude === 'number'
          ? calculateHaversineDistanceKm(port, { latitude: item.latitude, longitude: item.longitude })
          : null,
    }));
    return items.sort((x, y) => (x.kmFromPort ?? Infinity) - (y.kmFromPort ?? Infinity));
  }, [rawAdvisories, selectedState]);

  const currentCityName = selectedState
    ? getCanonicalCityName(selectedState.location_id, selectedState.city_name)
    : '—';

  // Greet by the fisher's own first name once they have set up a profile.
  const shownName = nameForLanguage(fisherName, fisherNameKn, language);
  const greetingName = shownName ? `${shownName.split(/\s+/)[0]}!` : t('greeting_friend');

  // Greeting follows the real time of day, like the sky behind it.
  const hourNow = new Date().getHours();
  const greetingWord =
    hourNow >= 5 && hourNow < 12
      ? t('greet_morning')
      : hourNow >= 12 && hourNow < 16
      ? t('greet_afternoon')
      : hourNow >= 16 && hourNow < 20
      ? t('greet_evening')
      : t('greeting_namaskara');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0284C7"
            colors={['#0284C7']}
          />
        }>
        {/* Living header: sky follows the clock, the sea follows the live reading */}
        <HeroScene seaState={weatherData?.seaState || 'unknown'}>
          <TopBar
            onNotificationPress={() => navigation?.navigate('Alerts')}
            unreadCount={activeAdvisories.length}
          />

          <TouchableOpacity
            style={styles.locationPill}
            onPress={handleLocationPress}
            activeOpacity={0.85}>
            <Icon name="map-marker" size={18} color="#0A2540" />
            <Text style={styles.locationText}>{localizeCityName(currentCityName, language)}</Text>
            <Icon name="chevron-down" size={20} color="#0A2540" />
          </TouchableOpacity>

          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>
              {greetingWord},{'\n'}{greetingName}
            </Text>
            <Text style={styles.greetingSubtitle}>{t('check_sea_conditions')}</Text>
          </View>
        </HeroScene>

        {/* Current Conditions Weather Card (Overlapping Hero) */}
        <View style={styles.weatherCardWrapper}>
          {weatherData ? (
            <WeatherCard weather={weatherData} />
          ) : (
            <View style={styles.unavailableCard}>
              <Icon name="cloud-off-outline" size={36} color="#94A3B8" />
              <Text style={styles.unavailableTitle}>{t('offline_cached')}</Text>
              <Text style={styles.unavailableSubtitle}>
                {t('connecting')}
              </Text>
            </View>
          )}
        </View>

        {/* Today's Fishing Advisory */}
        {activeAdvisories.length > 0 ? (
          <FishingAdvisory
            advisories={activeAdvisories}
            onViewMap={() => navigation?.navigate('Map')}
            onViewAll={() => navigation?.navigate('Alerts')}
            portName={currentCityName}
          />
        ) : (
          <View style={styles.advisoryUnavailableCard}>
            <Icon name="information-outline" size={24} color="#0D9488" />
            <Text style={styles.advisoryUnavailableText}>
              {isAdvLoading ? t('advisory_loading') : t('adv_none')}
            </Text>
          </View>
        )}

        {/* Full-Width "View on Map" Royal Blue Button */}
        <View style={styles.mapButtonContainer}>
          <TouchableOpacity
            style={styles.viewOnMapButton}
            onPress={() => navigation?.navigate('Map')}
            activeOpacity={0.85}>
            <Icon name="map-outline" size={20} color="#FFFFFF" />
            <Text style={styles.viewOnMapText}>{t('view_on_map')}</Text>
          </TouchableOpacity>
        </View>

        {/* 2×2 Quick Actions Grid (Catch Logs, Distress Alerts, Fleet Tracking, Equipment) */}
        <QuickActions
          onActionPress={(actionId) => {
            setActiveModal(actionId);
          }}
        />
      </ScrollView>

      {/* Coastal Location Selector Modal */}
      <LocationSelectorModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onSelectLocation={handleSelectLocation}
        selectedLocationId={selectedState?.location_id}
        states={states}
      />

      {/* Catch Log Modal */}
      <CatchLogModal
        visible={activeModal === 'catch'}
        onClose={() => setActiveModal(null)}
        currentPort={currentCityName}
      />

      {/* Distress / SOS Modal */}
      <DistressModal
        visible={activeModal === 'distress'}
        onClose={() => setActiveModal(null)}
        currentPort={currentCityName}
        latitude={selectedState ? CANONICAL_PORT_COORDINATES[selectedState.location_id]?.latitude : undefined}
        longitude={selectedState ? CANONICAL_PORT_COORDINATES[selectedState.location_id]?.longitude : undefined}
      />

      {/* Equipment Checklist Modal */}
      <EquipmentChecklistModal
        visible={activeModal === 'equipment'}
        onClose={() => setActiveModal(null)}
        currentPort={currentCityName}
      />

      {/* Fleet Tracking Modal */}
      <FleetTrackingModal
        visible={activeModal === 'fleet'}
        onClose={() => setActiveModal(null)}
        currentPort={currentCityName}
        states={states}
        selectedLocationId={selectedState?.location_id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  heroBackground: {
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    marginTop: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2540',
  },
  greetingSection: {
    marginTop: 14,
    maxWidth: '78%',
  },
  greetingTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  greetingSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 3,
    lineHeight: 17,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  weatherCardWrapper: {
    marginTop: -34,
  },
  mapButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  viewOnMapButton: {
    backgroundColor: '#0284C7',
    height: 48,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  viewOnMapText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  unavailableCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  unavailableTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A2540',
    marginTop: 8,
    marginBottom: 4,
  },
  unavailableSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  advisoryUnavailableCard: {
    marginHorizontal: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 12,
  },
  advisoryUnavailableText: {
    fontSize: 13,
    color: '#065F46',
    flex: 1,
    lineHeight: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;
