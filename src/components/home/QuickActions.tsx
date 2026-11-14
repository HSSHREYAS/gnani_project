/**
 * QuickActions — the four everyday tools on Home, as large tap-friendly cards:
 * a big coloured icon, a clear name and one line saying what it does.
 * The SOS card is solid red so it can be found instantly.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage, type TranslationKey } from '../../i18n';

type ActionId = 'catch' | 'distress' | 'fleet' | 'equipment';

interface QuickActionsProps {
  onActionPress?: (actionId: ActionId) => void;
}

const ACTIONS: {
  id: ActionId;
  icon: string;
  labelKey: TranslationKey;
  subKey: TranslationKey;
  tint: string;
  iconBg: string;
  solid?: boolean;
}[] = [
  { id: 'distress', icon: 'lifebuoy', labelKey: 'qa_distress', subKey: 'qa_distress_sub', tint: '#DC2626', iconBg: 'rgba(255,255,255,0.22)', solid: true },
  { id: 'fleet', icon: 'anchor', labelKey: 'qa_fleet', subKey: 'qa_fleet_sub', tint: '#0284C7', iconBg: '#E0F2FE' },
  { id: 'catch', icon: 'fish', labelKey: 'qa_catch', subKey: 'qa_catch_sub', tint: '#0D9488', iconBg: '#CCFBF1' },
  { id: 'equipment', icon: 'clipboard-check-outline', labelKey: 'qa_equipment', subKey: 'qa_equipment_sub', tint: '#7C3AED', iconBg: '#EDE9FE' },
];

const QuickActions: React.FC<QuickActionsProps> = ({ onActionPress }) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('qa_heading')}</Text>
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.card, action.solid && { backgroundColor: action.tint, borderColor: action.tint }]}
            onPress={() => onActionPress?.(action.id)}
            activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: action.iconBg }]}>
              <Icon name={action.icon} size={28} color={action.solid ? '#FFFFFF' : action.tint} />
            </View>
            <Text style={[styles.label, action.solid && styles.labelOnSolid]} numberOfLines={2}>
              {t(action.labelKey)}
            </Text>
            <Text style={[styles.sub, action.solid && styles.subOnSolid]} numberOfLines={2}>
              {t(action.subKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 10,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48.2%',
    minHeight: 132,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2540',
    lineHeight: 21,
  },
  labelOnSolid: {
    color: '#FFFFFF',
  },
  sub: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3,
    lineHeight: 17,
  },
  subOnSolid: {
    color: 'rgba(255, 255, 255, 0.92)',
  },
});

export default QuickActions;
