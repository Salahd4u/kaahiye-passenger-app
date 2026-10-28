import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Vibration,
  View,
  useWindowDimensions,
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
import { MOCK_CURRENT_LOCATION, MOCK_SAVED_ADDRESSES } from '@/mock/destinations';
import { MOCK_DRIVERS } from '@/mock/drivers';
import { assignedVehicleFor } from '@/mock/assignedVehicle';
import { rideOptionById } from '@/mock/rideOptions';
import { buildRoute, easeAngle, headingAt, locateOnPath } from '@/utils/mapRoute';
import { useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

/** Mock approach path — the driver finishes on the pickup marker. */
const DRIVER_START = { x: 0.5, y: 0.4 };
const PICKUP_VIEW = { x: 0.74, y: 0.17 };

const ETA_MINUTES = 2;
const ETA_MILES = 0.4;
const TICK_MS = 110;
const STEP = 0.0046;

const CANCEL_REASONS = [
  'Driver is too far away',
  'Wait time is too long',
  'I changed my plans',
  'Booked by mistake',
  'Other reason',
];

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function DriverAssignedScreen() {
  const { colors, shadows, isDark, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  /** Tighter sheet metrics for shorter phones (SE / small Android). */
  const compact = windowHeight < 720;

  const ride = useRideStore((state) => state.ride);
  const driver = useRideStore((state) => state.ride?.driver) ?? MOCK_DRIVERS[0];
  const selectedOption = useRideStore((state) => state.selectedRideOption);
  /** Selected category first, then the category snapshotted on the ride. */
  const rideOption = useMemo(
    () => selectedOption ?? (ride?.vehicleCategory ? rideOptionById(ride.vehicleCategory) : null),
    [ride, selectedOption],
  );
  const assigned = useMemo(() => assignedVehicleFor(rideOption, driver), [driver, rideOption]);

  const pickup = ride?.pickup ?? MOCK_CURRENT_LOCATION;
  const destination = ride?.destination ?? MOCK_SAVED_ADDRESSES[2];

  const approach = useMemo(
    () =>
      buildRoute(
        // Shorter, higher approach on short phones so the car stays visible
        // above the taller bottom sheet.
        { x: DRIVER_START.x, y: compact ? 0.3 : DRIVER_START.y },
        PICKUP_VIEW,
      ),
    [compact],
  );
  const [progress, setProgress] = useState(0);
  const [angle, setAngle] = useState(() => headingAt(approach, 0));
  const [starting, setStarting] = useState(false);
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [sheetAnim] = useState(() => new Animated.Value(0));
  const [cancelAnim] = useState(() => new Animated.Value(0));
  const progressRef = useRef(0);
  const arrivalHandled = useRef(false);

  /** Keeps the demo ride valid when the screen is opened directly. */
  useEffect(() => {
    const state = useRideStore.getState();
    if (state.phase === 'IN_PROGRESS') {
      router.replace('/active-ride');
      return;
    }
    if (state.phase === 'SEARCHING') {
      try {
        state.assignDriver();
      } catch {
        // ignore
      }
      return;
    }
    if (state.phase === 'IDLE' || state.phase === 'COMPLETED' || state.phase === 'CANCELLED') {
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
      } catch {
        // ignore
      }
    }
  }, [router]);

  /** Mock GPS ticks along the road polyline. */
  useEffect(() => {
    const tickMs = reducedMotion ? 700 : TICK_MS;
    const step = reducedMotion ? 0.035 : STEP;
    const timer = setInterval(() => {
      const next = Math.min(1, progressRef.current + step);
      progressRef.current = next;
      const point = locateOnPath(approach, next);
      setProgress(next);
      setAngle((current) => easeAngle(current, headingAt(approach, point.index), 0.4));
    }, tickMs);
    return () => clearInterval(timer);
  }, [approach, reducedMotion]);

  const arrived = progress >= 1;

  /**
   * On arrival the ride only moves to DRIVER_ARRIVED — it is never started
   * automatically. Starting is the passenger's explicit demo action (in
   * production it would be the driver's confirmed start).
   */
  useEffect(() => {
    if (!arrived || arrivalHandled.current) return;
    arrivalHandled.current = true;
    setArrivedAt(Date.now());
    const state = useRideStore.getState();
    try {
      if (state.phase === 'DRIVER_ASSIGNED') state.simulateDriverArriving();
      if (useRideStore.getState().phase === 'DRIVER_ARRIVING') state.simulateDriverArrived();
    } catch {
      // ignore
    }
  }, [arrived]);

  /** Waiting timer while the driver stands at the pickup. */
  useEffect(() => {
    if (!arrivedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [arrivedAt]);

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

  const located = locateOnPath(approach, progress);
  const minutesAway = Math.max(1, Math.ceil(ETA_MINUTES * (1 - progress)));
  const milesAway = Math.max(0.1, Math.round(ETA_MILES * (1 - progress) * 10) / 10);
  const waitSeconds = arrivedAt ? Math.max(0, Math.floor((now - arrivedAt) / 1000)) : 0;
  const cancellationFee = progress > 0.5 ? 2.5 : 0;
  const firstName = driver.name.split(' ')[0];

  const handleStartRide = () => {
    if (starting) return;
    setStarting(true);
    const state = useRideStore.getState();
    try {
      if (state.phase === 'DRIVER_ASSIGNED') state.simulateDriverArriving();
      if (useRideStore.getState().phase === 'DRIVER_ARRIVING') state.simulateDriverArrived();
      if (useRideStore.getState().phase === 'DRIVER_ARRIVED') state.startRide();
      router.replace('/active-ride');
    } catch {
      setStarting(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${driver.name} has arrived in a ${assigned.label} (${assigned.plate}) for our Kaahiye trip to ${destination.label}.`,
      });
    } catch {
      // Sharing cancelled.
    }
  };

  const openCancel = useCallback(() => {
    Vibration.vibrate(12);
    setCancelOpen(true);
  }, []);

  const handleConfirmCancel = () => {
    const state = useRideStore.getState();
    try {
      if (state.phase !== 'IDLE') state.cancelRide(reason);
    } catch {
      // ignore
    }
    state.resetToIdle();
    setCancelOpen(false);
    router.replace('/select-location');
  };


  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <MockMap
        pickup={PICKUP_VIEW}
        showPickup
        pickupLabel="Pickup"
        approach={{ from: DRIVER_START, to: PICKUP_VIEW, progress }}
        vehicle={{
          x: located.point.x,
          y: located.point.y,
          angle,
          kind: assigned.markerKind,
        }}
        style={StyleSheet.absoluteFill}
        label={`Driver ${arrived ? 'at the pickup point' : 'approaching'} in a ${assigned.kind}`}
      />

      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton
          icon="arrow-left"
          variant="white"
          size="sm"
          onPress={openCancel}
          accessibilityLabel="Cancel ride"
        />
      </View>

      {arrived ? (
        <View style={[styles.arrivedBadge, { top: insets.top + 10 }]} pointerEvents="none">
          <Icon name="check" size={13} color={colors.primary} strokeWidth={3} />
          <AppText style={styles.arrivedBadgeText} color={colors.primaryDeep}>
            Driver arrived
          </AppText>
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom - 4, 10),
            opacity: sheetAnim,
            transform: [
              {
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [48, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.headlineRow}>
          <AppText style={[styles.headline, compact && styles.headlineCompact]} numberOfLines={2}>
            {arrived ? 'Your driver has arrived' : 'Your driver is on the way'}
          </AppText>

          <View style={[styles.statusPill, compact && styles.statusPillCompact]}>
            <Icon
              name={arrived ? 'clock' : assigned.icon}
              size={compact ? 16 : 18}
              color={colors.primary}
              strokeWidth={2}
            />
            <View style={styles.statusText}>
              <AppText
                style={[styles.statusValue, compact && styles.statusValueCompact]}
                color={colors.primaryDeep}
                numberOfLines={1}
              >
                {arrived ? `Waiting ${formatTimer(waitSeconds)}` : `${minutesAway} min away`}
              </AppText>
              <AppText
                style={[styles.statusCaption, compact && styles.statusCaptionCompact]}
                color={colors.textSecondary}
                numberOfLines={1}
              >
                {arrived ? 'at pickup' : `${milesAway.toFixed(1)} mi`}
              </AppText>
            </View>
          </View>
        </View>

        <AppText
          style={[styles.headlineSub, compact && styles.headlineSubCompact]}
          color={colors.textSecondary}
          numberOfLines={2}
        >
          {arrived
            ? 'Meet your driver at the pickup location'
            : `${firstName} is heading to your pickup location.`}
        </AppText>

        <View style={[styles.driverRow, compact && styles.driverRowCompact]}>
          <DriverAvatar size={compact ? 46 : 52} ringColor={colors.primaryLight} />

          <View style={styles.driverInfo}>
            <View style={styles.nameRow}>
              <AppText
                style={[styles.driverName, compact && styles.driverNameCompact]}
                numberOfLines={1}
              >
                {driver.name}
              </AppText>
              <View style={styles.verifiedBadge}>
                <Icon name="check" size={8} color={colors.white} strokeWidth={3.6} />
              </View>
            </View>
            <View style={styles.ratingRow}>
              <Icon name="star" size={compact ? 11 : 12} color={colors.yellow} />
              <AppText style={styles.rating} weight="semibold">
                {driver.rating.toFixed(1)}
              </AppText>
              <AppText style={styles.ratingMuted}>({driver.ridesCount} rides)</AppText>
            </View>
            <AppText style={styles.vehicleLine} color={colors.textSecondary} numberOfLines={1}>
              {assigned.label}
            </AppText>
          </View>

          <View style={styles.vehicleBlock}>
            <Image
              source={assigned.image}
              style={[styles.vehicleImage, compact && styles.vehicleImageCompact]}
              resizeMode="contain"
            />
            <View style={styles.vehicleMeta}>
              {assigned.categoryShort ? (
                <View style={styles.categoryPill}>
                  <AppText style={styles.categoryText} numberOfLines={1}>
                    {assigned.categoryShort}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.platePill}>
                <AppText style={styles.plate} numberOfLines={1}>
                  {assigned.plate}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.actions, compact && styles.actionsCompact]}>
          <QuickAction
            icon="phone"
            label="Call"
            compact={compact}
            highlight
            onPress={() => Alert.alert('Calling driver', `${driver.name} · demo call`)}
          />
          <QuickAction
            icon="message"
            label="Message"
            compact={compact}
            onPress={() => router.push('/driver-messaging')}
          />
          <QuickAction icon="share" label="Share Trip" compact={compact} onPress={handleShare} />
          <QuickAction
            icon="more"
            label="More"
            compact={compact}
            onPress={() =>
              Alert.alert('Ride options', 'Safety and support tools are mocked in this demo.', [
                { text: 'Close', style: 'cancel' },
                { text: 'Cancel ride', style: 'destructive', onPress: openCancel },
              ])
            }
          />
        </View>

        <View style={styles.sectionDivider} />

        <View style={[styles.stops, compact && styles.stopsCompact]}>
          <View style={styles.stopRow}>
            <View style={styles.stopIcon}>
              <Icon name="map-pin" size={16} color={colors.primary} strokeWidth={2.1} />
            </View>
            <View style={styles.stopText}>
              <AppText style={styles.stopLabel} color={colors.textSecondary}>
                Pickup
              </AppText>
              <AppText style={styles.stopValue} numberOfLines={1}>
                {pickup.title}
              </AppText>
            </View>
          </View>

          <View style={styles.stopConnector} pointerEvents="none">
            <View style={styles.stopDot} />
            <View style={styles.stopDot} />
            <View style={styles.stopDot} />
          </View>

          <View style={styles.stopRow}>
            <View style={[styles.stopIcon, styles.stopIconDrop]}>
              <Icon name="map-pin" size={16} color={colors.red} strokeWidth={2.1} />
            </View>
            <View style={styles.stopText}>
              <AppText style={styles.stopLabel} color={colors.textSecondary}>
                Destination
              </AppText>
              <AppText style={styles.stopValue} numberOfLines={1}>
                {destination.title}
              </AppText>
            </View>
          </View>
        </View>

        {arrived ? (
          <Pressable
            onPress={handleStartRide}
            disabled={starting}
            accessibilityRole="button"
            accessibilityLabel="Start ride (demo)"
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.pressed,
              starting && styles.disabled,
            ]}
          >
            <Icon name="navigation" size={15} color={colors.white} strokeWidth={2.1} />
            <AppText style={styles.startLabel}>Start Ride (Demo)</AppText>
          </Pressable>
        ) : null}

        <SlideToConfirm
          compact={compact}
          label="Slide to Cancel Ride"
          onComplete={openCancel}
          style={styles.slider}
        />
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
            accessibilityLabel="Keep ride"
          />
          <Animated.View
            style={[
              styles.cancelSheet,
              {
                paddingBottom: Math.max(insets.bottom, 14) + 6,
                opacity: cancelAnim,
                transform: [
                  {
                    translateY: cancelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [56, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.cancelHandle} />
            <AppText style={styles.cancelTitle} align="center">
              Cancel this ride?
            </AppText>
            <AppText style={styles.cancelSubtitle} color={colors.textSecondary} align="center">
              {arrived
                ? `${driver.name} is waiting at your pickup point.`
                : `${driver.name} is already on the way to your pickup location.`}
            </AppText>

            <View style={styles.reasonList}>
              {CANCEL_REASONS.map((item) => {
                const selected = reason === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setReason(item)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item}
                    style={({ pressed }) => [
                      styles.reasonRow,
                      selected && styles.reasonRowSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[styles.radio, selected ? styles.radioSelected : styles.radioIdle]}
                    >
                      {selected ? (
                        <Icon name="check" size={9} color={colors.white} strokeWidth={3.4} />
                      ) : null}
                    </View>
                    <AppText style={styles.reasonLabel}>{item}</AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.feeRow}>
              <AppText style={styles.feeLabel} color={colors.textSecondary}>
                Cancellation fee
              </AppText>
              <AppText style={styles.feeValue}>
                {cancellationFee > 0 ? `$${cancellationFee.toFixed(2)}` : 'No fee'}
              </AppText>
            </View>

            <ButtonRow style={styles.cancelActions}>
              <CTAButton
                title="Keep Ride"
                variant="secondary"
                onPress={() => setCancelOpen(false)}
                accessibilityLabel="Keep ride"
              />
              <CTAButton
                title="Confirm Cancellation"
                variant="danger"
                onPress={handleConfirmCancel}
                accessibilityLabel="Confirm cancellation"
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
  compact = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  highlight?: boolean;
  compact?: boolean;
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
      <View
        style={[
          styles.actionCircle,
          compact && styles.actionCircleCompact,
          highlight && styles.actionCirclePrimary,
        ]}
      >
        <Icon
          name={icon}
          size={compact ? 18 : 19}
          color={highlight ? colors.primary : colors.navy}
          strokeWidth={1.9}
        />
      </View>
      <AppText style={styles.actionLabel} numberOfLines={1}>
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
    left: 14,
    right: 14,
    zIndex: 10,
  },
  arrivedBadge: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -62,
    width: 124,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingVertical: 7,
    zIndex: 9,
  },
  arrivedBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 8,
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
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headline: {
    flex: 1,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.55,
    fontFamily: 'Inter_700Bold',
  },
  headlineCompact: {
    fontSize: 18,
    lineHeight: 23,
  },
  headlineSub: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  headlineSubCompact: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexShrink: 0,
  },
  statusPillCompact: {
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statusText: {
    gap: 0,
  },
  statusValue: {
    fontSize: 12.5,
    lineHeight: 15,
    fontFamily: 'Inter_700Bold',
  },
  statusValueCompact: {
    fontSize: 11.5,
    lineHeight: 14,
  },
  statusCaption: {
    fontSize: 10.5,
    lineHeight: 13,
    fontFamily: 'Inter_500Medium',
  },
  statusCaptionCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 14,
  },
  driverRowCompact: {
    gap: 9,
    marginTop: 10,
  },
  driverInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  driverName: {
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: -0.3,
    fontFamily: 'Inter_700Bold',
    flexShrink: 1,
  },
  driverNameCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  verifiedBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    lineHeight: 16,
  },
  ratingMuted: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMuted,
  },
  vehicleLine: {
    fontSize: 12,
    lineHeight: 16,
  },
  vehicleBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  vehicleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  vehicleImage: {
    width: 124,
    height: 46,
  },
  vehicleImageCompact: {
    width: 104,
    height: 39,
  },
  platePill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  plate: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    fontFamily: 'Inter_700Bold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  actionsCompact: {
    marginTop: 10,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  actionCirclePrimary: {
    backgroundColor: colors.primaryLight,
  },
  actionLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSoft,
    marginTop: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  stops: {
    marginTop: 12,
  },
  stopsCompact: {
    marginTop: 8,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  stopIconDrop: {
    backgroundColor: colors.redSoft,
  },
  stopText: {
    flex: 1,
    gap: 0,
  },
  stopLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10.5,
    lineHeight: 14,
  },
  stopValue: {
    fontSize: 13.5,
    lineHeight: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  stopConnector: {
    width: 32,
    height: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginTop: 12,
    ...shadows.button,
  },
  startLabel: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  slider: {
    marginTop: 12,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  cancelSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    ...shadows.sheet,
  },
  cancelHandle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  cancelTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Inter_700Bold',
  },
  cancelSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 10,
    alignSelf: 'center',
    maxWidth: 300,
  },
  reasonList: {
    gap: 5,
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  reasonRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMist,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.primary,
  },
  radioIdle: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 10,
  },
  feeLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  feeValue: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: 'Inter_700Bold',
  },
  cancelActions: {
    marginBottom: 2,
  },
});

