import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { ButtonRow } from '@/components/ui/ButtonRow';
import { CTAButton } from '@/components/ui/CTAButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { SlideToConfirm } from '@/components/ui/SlideToConfirm';
import { MockMap } from '@/components/map/MockMap';
import { DriverAvatar } from '@/components/brand/DriverAvatar';
import { useRideStore } from '@/store/rideStore';
import { mockService } from '@/services/mockService';
import { MOCK_CURRENT_LOCATION, MOCK_SAVED_ADDRESSES } from '@/mock/destinations';
import { MOCK_DRIVERS } from '@/mock/drivers';
import { assignedVehicleFor } from '@/mock/assignedVehicle';
import { rideOptionById } from '@/mock/rideOptions';
import { buildRoute, easeAngle, headingAt, locateOnPath } from '@/utils/mapRoute';
import { useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

/** Trip visualisation points (mock GPS on the existing road grid). */
const TRIP_START = { x: 0.3, y: 0.35 };
const TRIP_END = { x: 0.73, y: 0.24 };

const TRIP_KM = 1.8;
const TRIP_MINUTES = 5;
const TICK_MS = 400;
const STEP = 0.0075;

export default function ActiveRideScreen() {
  const { colors, shadows, isDark, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const ride = useRideStore((state) => state.ride);
  const phase = useRideStore((state) => state.phase);
  const driver = useRideStore((state) => state.ride?.driver) ?? MOCK_DRIVERS[0];
  const selectedOption = useRideStore((state) => state.selectedRideOption);
  /** Selected category first, then the category snapshotted on the ride. */
  const rideOption = useMemo(
    () => selectedOption ?? (ride?.vehicleCategory ? rideOptionById(ride.vehicleCategory) : null),
    [ride, selectedOption],
  );
  const assigned = useMemo(() => assignedVehicleFor(rideOption, driver), [driver, rideOption]);

  const [progress, setProgress] = useState(0);
  const [angle, setAngle] = useState(() => headingAt(buildRoute(TRIP_START, TRIP_END), 0));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetAnim] = useState(() => new Animated.Value(0));
  const [confirmAnim] = useState(() => new Animated.Value(0));
  const [ending, setEnding] = useState(false);
  const [sheetH, setSheetH] = useState(480);
  const progressRef = useRef(0);
  const completed = useRef(false);
  const redirected = useRef(false);

  const tripRoute = useMemo(() => buildRoute(TRIP_START, TRIP_END), []);
  const destination = ride?.destination ?? MOCK_SAVED_ADDRESSES[2];

  useEffect(() => {
    const state = useRideStore.getState();
    if (state.phase === 'IN_PROGRESS') return;
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
      state.assignDriver();
      state.simulateDriverArriving();
      state.simulateDriverArrived();
      state.startRide();
    } catch {
      // The preview can still render with the fallback driver.
    }
  }, []);

  useEffect(() => {
    if (phase !== 'IN_PROGRESS') return;
    const interval = setInterval(() => {
      const next = Math.min(1, progressRef.current + STEP);
      progressRef.current = next;
      setProgress(next);

      const point = locateOnPath(tripRoute, next);
      setAngle((current) => easeAngle(current, headingAt(tripRoute, point.index), 0.45));

      const state = useRideStore.getState();
      state.updateProgress(next * 100);

      if (next >= 1 && !completed.current) {
        completed.current = true;
        if (state.phase === 'IN_PROGRESS') {
          state.completeRide();
          const finished = useRideStore.getState().ride;
          if (finished) void mockService.updateHistoryRide(finished);
        }
        if (!redirected.current) {
          redirected.current = true;
          setTimeout(() => router.replace('/trip-completed'), 700);
        }
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [phase, router, tripRoute]);

  /** Sheet entrance spring. */
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
    if (!confirmOpen) return;
    if (reducedMotion) {
      confirmAnim.setValue(1);
      return;
    }
    confirmAnim.setValue(0);
    Animated.spring(confirmAnim, {
      toValue: 1,
      speed: 16,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [confirmAnim, confirmOpen, reducedMotion]);

  const handleEnd = () => {
    if (ending) return;
    setEnding(true);
    const state = useRideStore.getState();
    if (state.phase === 'IN_PROGRESS') {
      state.completeRide();
      const finished = useRideStore.getState().ride;
      if (finished) void mockService.updateHistoryRide(finished);
    }
    setConfirmOpen(false);
    router.replace('/trip-completed');
  };

  const handleBack = () => {
    Alert.alert('Leave trip view?', 'Your ride is still in progress.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => router.replace('/select-location'),
      },
    ]);
  };

  const handleHelp = () => {
    Alert.alert('Trip Help', 'Kaahiye support is available 24/7 in this demo.', [
      { text: 'Close', style: 'cancel' },
      {
        text: 'Call Support',
        onPress: () => Alert.alert('Support', 'Demo call to Kaahiye support.'),
      },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I am on my way to ${destination.label} with ${driver.name} (${assigned.label}).`,
      });
    } catch {
      // Sharing cancelled.
    }
  };

  const openConfirm = useCallback(() => {
    if (ending) return;
    Vibration.vibrate(12);
    setConfirmOpen(true);
  }, [ending]);

  const located = locateOnPath(tripRoute, progress);
  const remainingKm = (TRIP_KM * Math.max(0, 1 - progress)).toFixed(1);
  const remainingMinutes = Math.max(1, Math.ceil(TRIP_MINUTES * Math.max(0, 1 - progress)));

  const destinationX = TRIP_END.x * width;
  const destinationY = TRIP_END.y * height;
  const calloutLeft = Math.min(Math.max(destinationX - 150, 12), width - 168);
  const calloutTop = Math.max(destinationY - 96, insets.top + 62);


  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <MockMap
        pickup={TRIP_START}
        destination={TRIP_END}
        showDestination
        destinationTone="red"
        approach={{ from: TRIP_START, to: TRIP_END, progress }}
        vehicle={{
          x: located.point.x,
          y: located.point.y,
          angle,
          kind: assigned.markerKind,
        }}
        style={StyleSheet.absoluteFill}
        label="Trip in progress map"
      />

      {/* Destination callout riding above the red pin */}
      <View
        style={[styles.destCallout, { left: calloutLeft, top: calloutTop }]}
        pointerEvents="none"
      >
        <View style={styles.calloutPin}>
          <Icon name="map-pin" size={14} color={colors.red} strokeWidth={2.2} />
        </View>
        <View style={styles.calloutText}>
          <AppText variant="caption" weight="bold">
            Destination
          </AppText>
          <AppText variant="micro" color={colors.textSecondary}>
            {remainingMinutes} min · {remainingKm} km
          </AppText>
        </View>
      </View>

      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton
          icon="arrow-left"
          variant="white"
          onPress={handleBack}
          accessibilityLabel="Go back"
        />
        <Pressable
          onPress={handleHelp}
          accessibilityRole="button"
          accessibilityLabel="Trip help"
          style={styles.helpPill}
        >
          <Icon name="headset" size={17} color={colors.navy} strokeWidth={1.9} />
          <AppText variant="subtitle" weight="semibold">
            Help
          </AppText>
        </Pressable>
      </View>

      <View style={[styles.mapControls, { bottom: sheetH + 16 }]} pointerEvents="box-none">
        <IconButton
          icon="locate"
          variant="white"
          size="sm"
          iconSize={18}
          onPress={() => Alert.alert('Following trip', `${remainingKm} km to ${destination.label}.`)}
          accessibilityLabel="Recenter on vehicle"
        />
        <IconButton
          icon="layers"
          variant="white"
          size="sm"
          iconSize={18}
          onPress={() => Alert.alert('Map style', 'Standard map style is active in this demo.')}
          accessibilityLabel="Map layers"
        />
        <IconButton
          icon="navigation"
          variant="white"
          size="sm"
          iconSize={17}
          onPress={() => Alert.alert('Navigation', 'Turn-by-turn navigation is simulated in this demo.')}
          accessibilityLabel="Open navigation"
        />
      </View>

      <Animated.View
        onLayout={(event) => setSheetH(event.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 2,
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

        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AppText variant="h2" style={styles.title}>
              Heading to your destination
            </AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.shared}>
              Shared with passenger
            </AppText>
          </View>

          <View style={styles.sharePill}>
            <View style={styles.shareIcon}>
              <Icon name="share" size={13} color={colors.primary} strokeWidth={2.1} />
            </View>
            <View style={styles.shareText}>
              <AppText variant="caption" weight="bold" color={colors.primaryDeep}>
                Live sharing
              </AppText>
              <AppText variant="micro" color={colors.primaryDeep} style={styles.shareSub}>
                Passenger can see your location
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.destinationRow}>
          <View style={styles.destIcon}>
            <Icon name="map-pin" size={18} color={colors.red} strokeWidth={2.1} />
          </View>
          <View style={styles.destText}>
            <AppText variant="subtitle" weight="bold" numberOfLines={1}>
              {destination.label}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {destination.title}
            </AppText>
          </View>
          <Pressable
            onPress={() => Alert.alert('View on map', `Showing the route to ${destination.label}.`)}
            accessibilityRole="button"
            accessibilityLabel="View destination on map"
            style={({ pressed }) => [styles.viewMap, pressed && styles.pressed]}
          >
            <Icon name="layers" size={15} color={colors.navy} strokeWidth={1.9} />
            <AppText variant="caption" weight="semibold">
              View on Map
            </AppText>
          </Pressable>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Icon name="route" size={20} color={colors.blue} strokeWidth={1.8} />
            <View>
              <AppText variant="h3" style={styles.metricValue}>
                {remainingKm} km
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Remaining
              </AppText>
            </View>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Icon name="clock" size={20} color={colors.navy} strokeWidth={1.8} />
            <View>
              <AppText variant="h3" style={styles.metricValue}>
                {remainingMinutes} min
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Est. time
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.driverRow}>
          <DriverAvatar size={62} ringColor={colors.primaryLight} />
          <View style={styles.driverInfo}>
            <AppText variant="h3" numberOfLines={1} style={styles.driverName}>
              {driver.name}
            </AppText>
            <View style={styles.ratingRow}>
              <Icon name="star" size={13} color={colors.yellow} />
              <AppText variant="caption" weight="semibold">
                {driver.rating.toFixed(1)}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                ({driver.ridesCount} rides)
              </AppText>
            </View>
            <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={1}>
              {assigned.label}
            </AppText>
            <View style={styles.vehicleMetaRow}>
              {assigned.categoryShort ? (
                <View style={styles.categoryPill}>
                  <AppText style={styles.categoryText} numberOfLines={1}>
                    {assigned.categoryShort}
                  </AppText>
                </View>
              ) : null}
              <AppText variant="bodySmall" weight="bold" style={styles.plate}>
                {assigned.plate}
              </AppText>
            </View>
          </View>
          <View style={styles.vehicleArt}>
            <Image source={assigned.image} style={styles.vehiclePhoto} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.actions}>
          <QuickAction
            icon="phone"
            label="Call"
            highlight
            onPress={() => Alert.alert('Calling driver', `${driver.name} · demo call`)}
          />
          <QuickAction
            icon="message"
            label="Message"
            onPress={() => router.push('/driver-messaging')}
          />
          <QuickAction icon="share" label="Share Trip" onPress={handleShare} />
          <QuickAction
            icon="more"
            label="More"
            onPress={() =>
              Alert.alert('Trip options', 'Safety and support tools are mocked in this demo.', [
                { text: 'Close', style: 'cancel' },
                { text: 'Call support', onPress: handleHelp },
              ])
            }
          />
        </View>

        <SlideToConfirm
          label="Slide to End Ride"
          onComplete={openConfirm}
          style={styles.slider}
        />
      </Animated.View>

      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setConfirmOpen(false)}
            accessibilityLabel="Keep riding"
          />
          <Animated.View
            style={[
              styles.confirmSheet,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                opacity: confirmAnim,
                transform: [
                  {
                    translateY: confirmAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [64, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.handle} />
            <AppText variant="h3" align="center">
              End this trip early?
            </AppText>
            <AppText
              variant="bodySmall"
              color={colors.textSecondary}
              align="center"
              style={styles.confirmSubtitle}
            >
              You are {remainingKm} km away from {destination.label}. Ending now completes the ride
              at the current fare.
            </AppText>

            <ButtonRow style={styles.confirmActions}>
              <CTAButton
                title="Keep Riding"
                variant="secondary"
                onPress={() => setConfirmOpen(false)}
                accessibilityLabel="Keep riding"
              />
              <CTAButton
                title="End Trip"
                variant="danger"
                onPress={handleEnd}
                loading={ending}
                disabled={ending}
                accessibilityLabel="End trip"
              />
            </ButtonRow>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  highlight = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  highlight?: boolean;
}) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <View style={[styles.actionCircle, highlight && styles.actionCirclePrimary]}>
        <Icon
          name={icon}
          size={19}
          color={highlight ? colors.primary : colors.navy}
          strokeWidth={1.9}
        />
      </View>
      <AppText variant="caption" color={colors.textSecondary} weight="medium">
        {label}
      </AppText>
    </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  helpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...shadows.floating,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    gap: 10,
    zIndex: 9,
  },
  destCallout: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 152,
    ...shadows.floating,
  },
  calloutPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutText: {
    gap: 1,
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
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.6,
  },
  shared: {
    fontSize: 14,
  },
  sharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 136,
  },
  shareIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    flex: 1,
    gap: 1,
  },
  shareSub: {
    lineHeight: 12,
    opacity: 0.9,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  destIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destText: {
    flex: 1,
    gap: 2,
  },
  viewMap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  metric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricValue: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  driverInfo: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    fontSize: 18,
    letterSpacing: -0.4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plate: {
    fontSize: 13.5,
    letterSpacing: 0.4,
  },
  vehicleArt: {
    width: 88,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  vehiclePhoto: {
    width: 88,
    height: 58,
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  categoryPill: {
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.primaryLight,
  },
  categoryText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.primaryDeep,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 2,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  actionCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCirclePrimary: {
    backgroundColor: colors.primaryLight,
  },
  pressed: {
    opacity: 0.85,
  },
  slider: {
    marginTop: 14,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  confirmSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...shadows.sheet,
  },
  confirmSubtitle: {
    marginTop: 6,
    marginBottom: 16,
    alignSelf: 'center',
    maxWidth: 310,
  },
  confirmActions: {
    marginBottom: 2,
  },
});

