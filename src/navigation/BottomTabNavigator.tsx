/**
 * BottomTabNavigator — 4-tab coastal navigation (Home, Map, Alerts, Profile).
 * Features solid teal active capsule for Home, and dynamic INCOIS alert badge that clears on visit.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen';
import { useLanguage, type TranslationKey } from '../i18n';
import { useAdvisories } from '../services/api';

const Tab = createBottomTabNavigator();

interface TabConfigItem {
  name: string;
  labelKey: TranslationKey;
  component: React.ComponentType<any>;
  icon: string;
  iconOutline: string;
}

const tabConfig: TabConfigItem[] = [
  { name: 'Home', labelKey: 'tab_home', component: HomeScreen, icon: 'home', iconOutline: 'home-outline' },
  { name: 'Map', labelKey: 'tab_map', component: MapScreen, icon: 'map-marker', iconOutline: 'map-marker-outline' },
  { name: 'Alerts', labelKey: 'tab_alerts', component: AlertsScreen, icon: 'bell', iconOutline: 'bell-outline' },
  { name: 'Voice', labelKey: 'tab_voice', component: VoiceAssistantScreen, icon: 'microphone', iconOutline: 'microphone-outline' },
  { name: 'Profile', labelKey: 'tab_profile', component: ProfileScreen, icon: 'account', iconOutline: 'account-outline' },
];

const BottomTabNavigator: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { advisories } = useAdvisories();
  const [hasReadAlerts, setHasReadAlerts] = useState(false);

  // Dynamic unread count based on active INCOIS bulletins
  const unreadAlertCount = hasReadAlerts ? 0 : Math.max(0, advisories?.length || 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          { height: 66 + insets.bottom, paddingBottom: insets.bottom + 6 },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
      }}>
      {tabConfig.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          listeners={{
            tabPress: () => {
              if (tab.name === 'Alerts') {
                setHasReadAlerts(true);
              }
            },
          }}
          options={{
            tabBarIcon: ({ focused }) => {

              // If Home is focused, render the solid dark teal capsule matching the reference image
              if (focused) {
                return (
                  <View style={styles.homeActiveCapsule}>
                    <Icon name={tab.icon} size={21} color="#FFFFFF" />
                    <Text style={styles.homeActiveText} numberOfLines={1}>
                      {t(tab.labelKey)}
                    </Text>
                  </View>
                );
              }

              // Standard inactive or active tab layout
              const iconColor = focused ? '#0D9488' : '#64748B';
              const labelColor = focused ? '#0D9488' : '#64748B';
              const iconName = focused ? tab.icon : tab.iconOutline;

              return (
                <View style={styles.standardTabItem}>
                  <View style={styles.iconWithBadge}>
                    <Icon name={iconName} size={22} color={iconColor} />
                    {tab.name === 'Alerts' && unreadAlertCount > 0 && (
                      <View style={styles.dynamicBadge}>
                        <Text style={styles.dynamicBadgeText}>
                          {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.standardLabel, { color: labelColor }]} numberOfLines={1}>
                    {t(tab.labelKey)}
                  </Text>
                </View>
              );
            },
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarIcon: {
    width: '100%',
    height: 50,
  },
  homeActiveCapsule: {
    backgroundColor: '#0D9488',
    minWidth: 66,
    paddingHorizontal: 6,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  homeActiveText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 1,
  },
  standardTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 3,
  },
  dynamicBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dynamicBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});

export default BottomTabNavigator;
