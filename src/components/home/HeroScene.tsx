/**
 * HeroScene — the living sea picture behind the Home header.
 *
 * Nothing here is a static photo: the sky follows the phone's real clock (dawn,
 * day, dusk, night with moon and stars) and the water follows the live sea
 * reading for the fisher's port — gentle swell when calm, taller and faster waves
 * and a darker sea when it is rough. A small boat rides the waves.
 *
 * Drawn only with gradients and native-driven animations, so it stays smooth on
 * low-end phones and needs no image downloads.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type SeaMood = 'calm' | 'moderate' | 'rough' | 'unknown';

interface HeroSceneProps {
  seaState: SeaMood;
  children: React.ReactNode;
}

export function getDayPhase(date: Date = new Date()): DayPhase {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour >= 5 && hour < 7.5) return 'dawn';
  if (hour >= 7.5 && hour < 16.5) return 'day';
  if (hour >= 16.5 && hour < 19) return 'dusk';
  return 'night';
}

const SKY: Record<DayPhase, string[]> = {
  dawn: ['#27406E', '#C96A6A', '#F6A56B', '#FFD9A0'],
  day: ['#0A57A8', '#1E7FD6', '#58B1F0', '#B5E2FB'],
  dusk: ['#241F5C', '#8A3F86', '#E8695A', '#FBB45C'],
  night: ['#030817', '#081737', '#0F2A55', '#1B4379'],
};

// [back wave, middle wave, front wave] — lighter at the back, deeper in front.
const SEA: Record<DayPhase, [string, string, string]> = {
  dawn: ['#5C8FB0', '#2F6E96', '#134E7A'],
  day: ['#4FB3E8', '#1E8FD0', '#0B6BAE'],
  dusk: ['#6B6AA8', '#3F4C8C', '#1E2F66'],
  night: ['#1D3F73', '#12305C', '#0A2147'],
};
const ROUGH_SEA: [string, string, string] = ['#6E8496', '#47607A', '#2B4159'];

// bump = swell length, steep = how tall the swell stands (0 flat … 1 round), speed = ms per swell
const MOTION: Record<SeaMood, { bump: number; steep: number; speed: number; bob: number; tilt: number }> = {
  calm: { bump: 86, steep: 0.3, speed: 9000, bob: 3, tilt: 2 },
  unknown: { bump: 86, steep: 0.3, speed: 9000, bob: 3, tilt: 2 },
  moderate: { bump: 78, steep: 0.5, speed: 5600, bob: 6, tilt: 5 },
  rough: { bump: 70, steep: 0.8, speed: 3200, bob: 10, tilt: 9 },
};

/** Set to a phase / mood to preview it during development; keep null in the app. */
const PREVIEW_PHASE: DayPhase | null = null;
const PREVIEW_MOOD: SeaMood | null = null;

const STARS = [
  { x: 0.08, y: 0.1, s: 2 }, { x: 0.2, y: 0.22, s: 1.5 }, { x: 0.33, y: 0.08, s: 2.5 },
  { x: 0.46, y: 0.18, s: 1.5 }, { x: 0.58, y: 0.07, s: 2 }, { x: 0.7, y: 0.25, s: 1.5 },
  { x: 0.9, y: 0.3, s: 2 }, { x: 0.14, y: 0.36, s: 1.5 }, { x: 0.4, y: 0.34, s: 2 },
  { x: 0.62, y: 0.4, s: 1.5 }, { x: 0.27, y: 0.48, s: 1.5 }, { x: 0.52, y: 0.52, s: 2 },
];

/** One row of rounded swells that scrolls sideways forever. */
const WaveRow: React.FC<{
  color: string;
  bump: number;
  steep: number;
  height: number;
  duration: number;
  bottom: number;
  reverse?: boolean;
  width: number;
}> = ({ color, bump, steep, height, duration, bottom, reverse, width }) => {
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    shift.setValue(0);
    const loop = Animated.loop(
      Animated.timing(shift, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shift, duration, bump]);

  const count = Math.ceil(width / bump) + 3;
  const translateX = shift.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? [-bump, 0] : [0, -bump],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.waveRow, { bottom, height: height + bump / 2, transform: [{ translateX }] }]}>
      <View style={[styles.waveBumps, { transform: [{ scaleY: steep }] }]}>
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            style={{ width: bump, height: bump, borderRadius: bump / 2, backgroundColor: color }}
          />
        ))}
      </View>
      <View style={[styles.waveBody, { top: bump / 2, backgroundColor: color }]} />
    </Animated.View>
  );
};

const HeroScene: React.FC<HeroSceneProps> = ({ seaState, children }) => {
  const { width } = useWindowDimensions();
  const [clockPhase, setPhase] = useState<DayPhase>(getDayPhase());
  const phase = PREVIEW_PHASE || clockPhase;

  // Follow the clock while the screen is open.
  useEffect(() => {
    const timer = setInterval(() => setPhase(getDayPhase()), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const mood = PREVIEW_MOOD || seaState;
  const motion = MOTION[mood] || MOTION.calm;
  const sea = mood === 'rough' ? ROUGH_SEA : SEA[phase];
  const isNight = phase === 'night';

  // Slow breathing value shared by the boat, glow and stars.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: Math.max(1100, motion.speed / 3.2),
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: Math.max(1100, motion.speed / 3.2),
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, motion.speed]);

  // Clouds drift across the sky.
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration: 70000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const boatY = pulse.interpolate({ inputRange: [0, 1], outputRange: [-motion.bob, motion.bob] });
  const boatTilt = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [`-${motion.tilt}deg`, `${motion.tilt}deg`],
  });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const starOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const starOpacityAlt = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });
  const cloudX = drift.interpolate({ inputRange: [0, 1], outputRange: [-140, width + 40] });
  const cloudX2 = drift.interpolate({ inputRange: [0, 1], outputRange: [width * 0.4, width + 220] });

  const orb = useMemo(() => {
    switch (phase) {
      case 'dawn':
        return { color: '#FFE2A8', glow: 'rgba(255, 214, 150, 0.28)', size: 54, right: 150, bottomOffset: -8 };
      case 'dusk':
        return { color: '#FFC56B', glow: 'rgba(255, 170, 90, 0.3)', size: 58, right: 150, bottomOffset: -14 };
      case 'day':
        return { color: '#FFF3B0', glow: 'rgba(255, 245, 190, 0.3)', size: 46, right: 40, bottomOffset: 150 };
      default:
        return { color: '#F4F1DE', glow: 'rgba(200, 215, 255, 0.1)', size: 40, right: 44, bottomOffset: 150 };
    }
  }, [phase]);

  const seaTop = 62; // height of the water band at the bottom of the header

  return (
    <View style={styles.root}>
      <LinearGradient colors={SKY[phase]} style={StyleSheet.absoluteFill} />

      {/* Stars */}
      {isNight &&
        STARS.map((star, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.star,
              {
                left: star.x * width,
                top: `${star.y * 100}%`,
                width: star.s,
                height: star.s,
                borderRadius: star.s,
                opacity: i % 2 === 0 ? starOpacity : starOpacityAlt,
              },
            ]}
          />
        ))}

      {/* Sun or moon with a soft breathing glow */}
      <View
        pointerEvents="none"
        style={[styles.orbWrap, { right: orb.right, bottom: seaTop + orb.bottomOffset, width: orb.size, height: orb.size }]}>
        <Animated.View
          style={[
            styles.orbGlow,
            {
              width: orb.size * 2.4,
              height: orb.size * 2.4,
              borderRadius: orb.size * 1.2,
              backgroundColor: orb.glow,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
        <View
          style={{ width: orb.size, height: orb.size, borderRadius: orb.size / 2, backgroundColor: orb.color }}
        />
        {isNight && (
          <View
            style={[
              styles.moonShade,
              { width: orb.size * 0.82, height: orb.size * 0.82, borderRadius: orb.size, backgroundColor: SKY.night[1] },
            ]}
          />
        )}
      </View>

      {/* Clouds */}
      {!isNight && (
        <>
          <Animated.View pointerEvents="none" style={[styles.cloud, { top: '30%', transform: [{ translateX: cloudX }] }]}>
            <View style={[styles.cloudPuff, { width: 46, height: 22 }]} />
            <View style={[styles.cloudPuff, { width: 34, height: 30, marginLeft: -18, marginTop: -10 }]} />
            <View style={[styles.cloudPuff, { width: 52, height: 22, marginLeft: -16 }]} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.cloud, { top: '46%', opacity: 0.7, transform: [{ translateX: cloudX2 }] }]}>
            <View style={[styles.cloudPuff, { width: 36, height: 16 }]} />
            <View style={[styles.cloudPuff, { width: 26, height: 22, marginLeft: -14, marginTop: -8 }]} />
            <View style={[styles.cloudPuff, { width: 40, height: 16, marginLeft: -12 }]} />
          </Animated.View>
        </>
      )}

      {/* Keeps the white header text readable over the bright part of the sky */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(2, 12, 32, 0.42)', 'rgba(2, 12, 32, 0.18)', 'rgba(2, 12, 32, 0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* The sea: three rows of swell moving at different speeds */}
      <WaveRow color={sea[0]} bump={motion.bump} steep={motion.steep} height={seaTop} duration={motion.speed * 1.5} bottom={10} reverse width={width} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.boat,
          { bottom: seaTop - 14 + motion.bump * motion.steep * 0.35, transform: [{ translateY: boatY }, { rotate: boatTilt }] },
        ]}>
        <Icon name="sail-boat" size={58} color="#FFFFFF" />
      </Animated.View>
      <WaveRow color={sea[1]} bump={motion.bump * 1.2} steep={motion.steep} height={seaTop - 14} duration={motion.speed} bottom={0} width={width} />
      <WaveRow color={sea[2]} bump={motion.bump * 0.9} steep={motion.steep} height={seaTop - 34} duration={motion.speed * 0.75} bottom={-6} reverse width={width} />

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  orbWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
  },
  moonShade: {
    position: 'absolute',
    top: -2,
    right: -8,
  },
  cloud: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    opacity: 0.85,
  },
  cloudPuff: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 20,
  },
  waveRow: {
    position: 'absolute',
    left: 0,
    right: -400,
  },
  waveBumps: {
    flexDirection: 'row',
  },
  waveBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  boat: {
    position: 'absolute',
    right: 30,
  },
});

export default HeroScene;
