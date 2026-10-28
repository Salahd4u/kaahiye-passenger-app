import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { CTAButton } from '@/components/ui/CTAButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { MockMap } from '@/components/map/MockMap';
import { useRideStore } from '@/store/rideStore';
import { MOCK_CURRENT_LOCATION, MOCK_SAVED_ADDRESSES } from '@/mock/destinations';
import { MOCK_DRIVERS } from '@/mock/drivers';
import { assignedVehicleFor } from '@/mock/assignedVehicle';
import { useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

/** Passenger marker position on the simulated map. */
const PICKUP_POINT = { x: 0.5, y: 0.33 };

/** Nearby vehicles (mock positions on the road grid). */
const NEARBY = [
  { x: 0.21, y: 0.13, angle: 28 },
  { x: 0.82, y: 0.21, angle: -22 },
  { x: 0.14, y: 0.42, angle: 42 },
  { x: 0.87, y: 0.48, angle: -34 },
  { x: 0.48, y: 0.1, angle: 8 },
];

const SEARCH_DURATION = 6500;
const TICK_MS = 200;
const STEP = 0.035;
const SLIDER_THRESHOLD = 0.9;
const HANDLE_SIZE = 54;
const RADAR_SIZE = 268;

export default function FindingDriverScreen() {
  const { colors, shadows, isDark, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const selectedOption = useRideStore((state) => state.selectedRideOption);
  const assigned = useMemo(
    () => assignedVehicleFor(selectedOption, MOCK_DRIVERS[0]),
    [selectedOption],
  );

  const [progress, setProgress] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rings] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);
  const [pulse] = useState(() => new Animated.Value(0));
  const [sheetAnim] = useState(() => new Animated.Value(0));
  const [cancelAnim] = useState(() => new Animated.Value(0));
  const navigated = useRef(false);

  /** Keep the demo ride in a valid searching state (also when opened directly). */
  useEffect(() => {
    const state = useRideStore.getState();
    if (state.phase === 'IN_PROGRESS') {
      router.replace('/active-ride');
      return;
    }
    if (
      state.phase === 'DRIVER_ASSIGNED' ||
      state.phase === 'DRIVER_ARRIVING' ||
      state.phase === 'DRIVER_ARRIVED'
    ) {
      router.replace('/driver-assigned');
      return;
    }
    if (state.phase !== 'SEARCHING') {
      if (state.phase !== 'IDLE') state.resetToIdle();
      try {
        state.createRide(
          {
            pickup: state.selectedPickup ?? MOCK_CURRENT_LOCATION,
            destination: state.selectedDestination ?? MOCK_SAVED_ADDRESSES[2],
            paymentMethod: 'cash',
          },
          'psg_001',
        );
      } catch {
        // A ride already exists; the simulation below will continue.
      }
    }

    const timer = setTimeout(() => {
      if (navigated.current) return;
      const latest = useRideStore.getState();
      if (latest.phase === 'SEARCHING') {
        try {
          latest.assignDriver();
        } catch {
          return;
        }
      }
      navigated.current = true;
      router.replace('/driver-assigned');
    }, SEARCH_DURATION);

    return () => clearTimeout(timer);
  }, [router]);

  /** Matching progress drives the stepper + progress indicator. */
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((current) => Math.min(0.99, current + STEP));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  /** Expanding radar rings around the passenger marker. */
  useEffect(() => {
    if (reducedMotion) {
      rings.forEach((value) => value.setValue(0.35));
      return undefined;
    }
    const animations = rings.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 850),
          Animated.timing(value, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    const group = Animated.parallel(animations);
    group.start();
    return () => animations.forEach((animation) => animation.stop());
  }, [reducedMotion, rings]);

  /** Soft pulse behind the vehicle glyph in the sheet. */
  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, reducedMotion]);

  /** Sheet entrance. */
  useEffect(() => {
    if (reducedMotion) {
      sheetAnim.setValue(1);
      return;
    }
    Animated.spring(sheetAnim, {
      toValue: 1,
      speed: 14,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, sheetAnim]);

  /** Confirmation sheet entrance. */
  useEffect(() => {
    if (!cancelOpen) return;
    if (reducedMotion) {
      cancelAnim.setValue(1);
      return;
    }
    cancelAnim.setValue(0);
    Animated.spring(cancelAnim, {
      toValue: 1,
      speed: 16,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [cancelAnim, cancelOpen, reducedMotion]);

  const stage = progress >= 0.72 ? 2 : progress >= 0.34 ? 1 : 0;
  const pickupX = PICKUP_POINT.x * width;
  const pickupY = PICKUP_POINT.y * height;

  const handleCancelConfirmed = useCallback(() => {
    const state = useRideStore.getState();
    try {
      if (state.phase === 'SEARCHING') {
        state.cancelRide('Cancelled by passenger while searching.');
      }
    } catch {
      // ignore
    }
    state.resetToIdle();
    setCancelOpen(false);
    router.replace('/select-location');
  }, [router]);

  const openCancelSheet = useCallback(() => {
    Vibration.vibrate(12);
    setCancelOpen(true);
  }, []);


  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <MockMap
        pickup={PICKUP_POINT}
        cars={NEARBY.map((car) => ({ ...car, kind: assigned.markerKind, halo: true }))}
        style={StyleSheet.absoluteFill}
        label="Searching for nearby drivers"
      />

      {/* Expanding radar rings around the passenger marker */}
      {rings.map((value, index) => {
        const scale = value.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
        const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
        return (
          <Animated.View
            key={`ring-${index}`}
            pointerEvents="none"
            style={[
              styles.radarRing,
              {
                left: pickupX - RADAR_SIZE / 2,
                top: pickupY - RADAR_SIZE / 2,
                opacity,
                transform: [{ scale }],
              },
            ]}
          />
        );
      })}
      <View
        pointerEvents="none"
        style={[
          styles.radarEdge,
          { left: pickupX - RADAR_SIZE / 2, top: pickupY - RADAR_SIZE / 2 },
        ]}
      />

      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton
          icon="arrow-left"
          variant="white"
          onPress={openCancelSheet}
          accessibilityLabel="Cancel search"
        />
      </View>

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 4,
            opacity: sheetAnim,
            transform: [
              {
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [56, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.searchVisual}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseRing,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                transform: [
                  {
                    scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.35] }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.pulseSoft} />
          <View style={styles.vehicleBadge}>
            <Icon name={assigned.icon} size={30} color={colors.navy} strokeWidth={1.8} />
          </View>
        </View>

        <AppText variant="h2" align="center" style={styles.title}>
          Finding a Driver
        </AppText>
        <AppText variant="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
          Please wait while we find a nearby driver for you.
        </AppText>


        <View style={styles.steps}>
          <StepItem icon="map-pin" label="Searching" caption="near your area" active={stage === 0} />
          <View style={styles.stepsDivider} />
          <StepItem icon="users" label="Checking" caption="available drivers" active={stage === 1} />
          <View style={styles.stepsDivider} />
          <StepItem icon="steering" label="Matching" caption="the best driver" active={stage === 2} />
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressDot, styles.progressDotDone]}>
              <View style={styles.progressDotInner} />
            </View>
            <View style={[styles.progressLine, stage >= 1 && styles.progressLineDone]} />
            <View
              style={[
                styles.progressDot,
                stage >= 1 ? styles.progressDotActive : styles.progressDotIdle,
              ]}
            >
              {stage >= 1 ? <View style={styles.progressDotInner} /> : null}
            </View>
            <View style={[styles.progressLine, stage >= 2 && styles.progressLineDone]} />
            <View
              style={[
                styles.progressDot,
                stage >= 2 ? styles.progressDotActive : styles.progressDotIdle,
              ]}
            >
              {stage >= 2 ? <View style={styles.progressDotInner} /> : null}
            </View>
          </View>

          <View style={styles.progressLabels}>
            <AppText variant="caption" weight="semibold" style={styles.progressLabelLeft}>
              Searching
            </AppText>
            <AppText
              variant="caption"
              color={colors.textMuted}
              align="center"
              style={styles.progressLabelCenter}
            >
              Matching
            </AppText>
            <AppText
              variant="caption"
              color={colors.textMuted}
              align="right"
              style={styles.progressLabelRight}
            >
              Driver Found
            </AppText>
          </View>
        </View>

        <SlideToCancel onComplete={openCancelSheet} />
      </Animated.View>

      <Modal
        visible={cancelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCancelOpen(false)}
            accessibilityLabel="Keep searching"
          />
          <Animated.View
            style={[
              styles.cancelSheet,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                opacity: cancelAnim,
                transform: [
                  {
                    translateY: cancelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [64, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.cancelHandle} />
            <AppText variant="h3" align="center">
              Cancel this request?
            </AppText>
            <AppText
              variant="bodySmall"
              color={colors.textSecondary}
              align="center"
              style={styles.cancelSubtitle}
            >
              We are still searching for a nearby driver. Cancelling now ends this request.
            </AppText>

            <View style={styles.cancelActions}>
              <CTAButton
                title="Keep Searching"
                variant="secondary"
                onPress={() => setCancelOpen(false)}
                accessibilityLabel="Keep searching"
              />
              <CTAButton
                title="Confirm Cancellation"
                variant="danger"
                onPress={handleCancelConfirmed}
                accessibilityLabel="Confirm cancellation"
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function StepItem({
  icon,
  label,
  caption,
  active,
}: {
  icon: IconName;
  label: string;
  caption: string;
  active: boolean;
}) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  return (
    <View style={styles.step}>
      <View style={[styles.stepIcon, active && styles.stepIconActive]}>
        <Icon name={icon} size={16} color={colors.primary} strokeWidth={2} />
      </View>
      <AppText variant="subtitle" align="center" style={styles.stepLabel}>
        {label}
      </AppText>
      <AppText variant="micro" color={colors.textSecondary} align="center">
        {caption}
      </AppText>
    </View>
  );
}

/**
 * Uber-style slide to cancel. The handle is dragged with Gesture Handler and
 * animated on the UI thread with Reanimated; releasing below 90% springs back,
 * releasing at/above 90% fires the haptic + confirmation callback.
 */
/* Reanimated shared values are mutated by design (UI-thread writes). */
/* eslint-disable react-hooks/immutability */
function SlideToCancel({ onComplete }: { onComplete: () => void }) {
  const { colors, shadows, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);
  const maxX = Math.max(0, trackWidth - HANDLE_SIZE - 8);

  const complete = useCallback(() => {
    translateX.value = withTiming(0, { duration: reducedMotion ? 0 : 220 });
    onComplete();
  }, [onComplete, reducedMotion, translateX]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-6, 6])
        .onUpdate((event) => {
          translateX.value = Math.min(Math.max(0, event.translationX), maxX);
        })
        .onEnd(() => {
          const passed = maxX > 0 && translateX.value >= maxX * SLIDER_THRESHOLD;
          const spring = { damping: 20, stiffness: 220, mass: 0.6 };
          if (passed) {
            translateX.value = withSpring(maxX, spring, (finished) => {
              if (finished) runOnJS(complete)();
            });
          } else {
            translateX.value = reducedMotion ? 0 : withSpring(0, spring);
          }
        }),
    [complete, maxX, reducedMotion, translateX],
  );

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + HANDLE_SIZE + 8,
  }));

  return (
    <View
      style={styles.slider}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      <Reanimated.View style={[styles.sliderFill, fillStyle]} pointerEvents="none" />

      <AppText variant="button" weight="semibold" color={colors.red} style={styles.sliderLabel}>
        Slide to Cancel
      </AppText>

      <GestureDetector gesture={gesture}>
        <Reanimated.View
          style={[styles.sliderHandle, handleStyle]}
          accessibilityRole="adjustable"
          accessibilityLabel="Slide to cancel the ride search"
        >
          <Icon name="chevrons-right" size={20} color={colors.white} strokeWidth={2.6} />
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
}



const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mapBase,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  radarRing: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    backgroundColor: colors.blueSoft,
    opacity: 0.55,
  },
  radarEdge: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderStyle: 'dashed',
    opacity: 0.45,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...shadows.bottomSheet,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  searchVisual: {
    alignSelf: 'center',
    width: 114,
    height: 114,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.blueSoft,
    borderWidth: 1,
    borderColor: colors.blueBorder,
  },
  pulseSoft: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.blueSoft,
    opacity: 0.8,
  },
  vehicleBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  title: {
    marginTop: 2,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 300,
    alignSelf: 'center',
    lineHeight: 22,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMist,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginTop: 14,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepIconActive: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  stepLabel: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  stepsDivider: {
    width: StyleSheet.hairlineWidth,
    height: 46,
    backgroundColor: colors.border,
  },
  progressWrap: {
    marginTop: 12,
    paddingHorizontal: 6,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  progressDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotDone: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  progressDotActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  progressDotIdle: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  progressLineDone: {
    backgroundColor: colors.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  progressLabelLeft: {
    flex: 1,
  },
  progressLabelCenter: {
    flex: 1,
  },
  progressLabelRight: {
    flex: 1,
  },
  slider: {
    marginTop: 14,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.redSoft,
    justifyContent: 'center',
    padding: 4,
    ...shadows.card,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.red,
    opacity: 0.14,
    borderRadius: 31,
  },
  sliderLabel: {
    alignSelf: 'center',
    fontSize: 16.5,
  },
  sliderHandle: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  cancelSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...shadows.sheet,
  },
  cancelHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  cancelSubtitle: {
    marginTop: 6,
    marginBottom: 16,
    alignSelf: 'center',
    maxWidth: 300,
  },
  cancelActions: {
    gap: 10,
  },
});

