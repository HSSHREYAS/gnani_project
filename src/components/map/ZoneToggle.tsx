/**
 * ZoneToggle — Floating pill toggle for Fishing Zones / Risk Zones
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import PillToggle from '../common/PillToggle';
import { Colors, Spacing, Shadows } from '../../theme';

interface ZoneToggleProps {
  activeIndex: number;
  onToggle: (index: number) => void;
  labels?: [string, string];
}

const ZoneToggle: React.FC<ZoneToggleProps> = ({ activeIndex, onToggle, labels }) => {
  return (
    <View style={styles.container}>
      <PillToggle
        options={labels || ['Fishing Zones', 'Sea Risk']}
        activeIndex={activeIndex}
        onToggle={onToggle}
        activeColor={activeIndex === 0 ? Colors.primaryAccent : Colors.danger}
        inactiveTextColor={Colors.textPrimary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: Spacing.md,
    width: 262,
    zIndex: 14,
    ...Shadows.fab,
    elevation: 10,
  },
});

export default ZoneToggle;
