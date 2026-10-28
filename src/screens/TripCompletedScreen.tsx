import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { CTA_BOTTOM_GAP } from '@/components/ui/ctaStyle';
import { CTAButton } from '@/components/ui/CTAButton';
import { GradientFill } from '@/components/ui/GradientFill';
import { Icon } from '@/components/ui/Icon';
import { MockMap } from '@/components/map/MockMap';
import { DriverAvatar } from '@/components/brand/DriverAvatar';
import { DriverRatingSheet } from '@/components/trip/DriverRatingSheet';
import { useRideStore } from '@/store/rideStore';
import { mockService } from '@/services/mockService';
import { MOCK_DRIVERS } from '@/mock/drivers';
import { MOCK_RIDE_FARE } from '@/mock/fares';
import { assignedVehicleFor } from '@/mock/assignedVehicle';
import { rideOptionById } from '@/mock/rideOptions';
import { buildRoute, headingAt } from '@/utils/mapRoute';
import type { Rating } from '@/types';
import { layout, useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

/** Completed trip drawn faintly on the mock map behind the receipt. */
const ROUTE_START = { x: 0.02, y: 0.3 };
const ROUTE_END = { x: 0.7, y: 0.14 };
const ROUTE = buildRoute(ROUTE_START, ROUTE_END);
const ROUTE_CAR = [
  {
    x: ROUTE_END.x,
    y: ROUTE_END.y,
    angle: headingAt(ROUTE, ROUTE.length - 2),
    halo: true,
  },
];

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatCompletedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${hour12}:${minutes} ${suffix}`;
}

export default function TripCompletedScreen() {
  const { colors, shadows, isDark, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const ride = useRideStore((state) => state.ride);
  const resetToIdle = useRideStore((state) => state.resetToIdle);
  const clearSelection = useRideStore((state) => state.clearSelection);
  const selectedOption = useRideStore((state) => state.selectedRideOption);

  const [checkScale] = useState(() => new Animated.Value(0.6));
  const [checkOpacity] = useState(() => new Animated.Value(0));
  const [ratingOpen, setRatingOpen] = useState(false);
  const [submittedRating, setSubmittedRating] = useState<Rating | null>(null);

  const driver = ride?.driver ?? MOCK_DRIVERS[0];
  /** Selected category first, then the category snapshotted on the ride. */
  const rideOption = useMemo(
    () => selectedOption ?? (ride?.vehicleCategory ? rideOptionById(ride.vehicleCategory) : null),
    [ride, selectedOption],
  );
  const assigned = useMemo(() => assignedVehicleFor(rideOption, driver), [driver, rideOption]);
  const fare = ride?.fare ?? MOCK_RIDE_FARE;
  const distanceKm = ride?.distanceMiles ?? fare.distance;
  const durationMinutes = Math.max(1, Math.round(fare.duration));
  const fallbackCompletedAt = useMemo(() => new Date().toISOString(), []);
  const completedLabel = formatCompletedAt(ride?.completedAt ?? fallbackCompletedAt);
  const submittedScore = submittedRating?.score ?? 0;
  const rated = Boolean(submittedRating);

  /** Map sits behind the status bar and fades into the receipt below. */
  const compact = windowHeight < 720;
  const mapHeight = compact
    ? Math.max(220, Math.round(windowHeight * 0.33))
    : Math.min(360, Math.max(270, windowHeight * 0.4));
  const contentTop = Math.round(mapHeight * (compact ? 0.32 : 0.37));

  useEffect(() => {
    if (reducedMotion) {
      checkScale.setValue(1);
      checkOpacity.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkOpacity, checkScale, reducedMotion]);

  /** Ratings are stored per ride — restore it so a duplicate can never be sent. */
  useEffect(() => {
    if (!ride) return;
    let active = true;
    mockService
      .getRatings()
      .then((ratings) => {
        if (!active) return;
        const existing = ratings.find((rating) => rating.rideId === ride.id);
        if (existing) setSubmittedRating(existing);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [ride]);

  const openRating = () => {
    if (rated) return;
    setRatingOpen(true);
  };

  const handleSubmitted = (rating: Rating) => {
    setSubmittedRating(rating);
    setRatingOpen(false);
  };

  const handleDone = () => {
    setRatingOpen(false);
    resetToIdle();
    clearSelection();
    router.replace('/select-location');
  };

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.mapWrap, { height: mapHeight }]} pointerEvents="none">
        <MockMap
          pickup={ROUTE_START}
          destination={ROUTE_END}
          showRoute
          routeProgress={1}
          routeColor={colors.primary}
          showPickup={false}
          showDestination={false}
          cars={ROUTE_CAR}
          style={StyleSheet.absoluteFill}
          label="Completed trip route map"
        />
        <View style={[StyleSheet.absoluteFill, styles.mapWash]} />
        <View style={styles.mapFade}>
          <GradientFill from={`${colors.surface}00`} to={colors.surface} direction="vertical" />
        </View>
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingTop: contentTop }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.success}>
            <View style={styles.successHalo} />
            <View style={[styles.spark, { top: 4, left: 8, backgroundColor: colors.yellow }]} />
            <View
              style={[
                styles.spark,
                styles.sparkSmall,
                { top: 22, right: 2, backgroundColor: colors.primary },
              ]}
            />
            <View
              style={[
                styles.spark,
                styles.sparkSmall,
                { bottom: 16, left: 0, backgroundColor: colors.textFaint },
              ]}
            />
            <View
              style={[styles.spark, { bottom: 2, right: 20, backgroundColor: colors.yellow }]}
            />
            <Animated.View
              style={[
                styles.checkCircle,
                { opacity: checkOpacity, transform: [{ scale: checkScale }] },
              ]}
            >
              <Icon name="check" size={26} color={colors.white} strokeWidth={3} />
            </Animated.View>
          </View>

          <AppText variant="h1" weight="bold" align="center" style={styles.title}>
            Trip Completed
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
            Thank you for riding with Kaahiye!
          </AppText>

          <View style={styles.card}>
            <View style={styles.fareHeader}>
              <View style={styles.fareBlock}>
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  Total Fare
                </AppText>
                <AppText variant="display" style={styles.fareValue}>
                  ${fare.total.toFixed(2)}
                </AppText>
              </View>
              <View style={styles.paymentPill}>
                <Icon name="cash" size={15} color={colors.primary} strokeWidth={1.9} />
                <AppText variant="caption" weight="semibold" color={colors.primaryDeep}>
                  Paid in Cash
                </AppText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Icon name="map-pin" size={17} color={colors.primary} strokeWidth={2} />
              <AppText variant="bodySmall" color={colors.textSecondary} style={styles.detailLabel}>
                Distance
              </AppText>
              <AppText variant="bodySmall" weight="semibold">
                {distanceKm.toFixed(1)} km
              </AppText>
            </View>

            <View style={styles.detailRow}>
              <Icon name="clock" size={17} color={colors.textMuted} strokeWidth={1.9} />
              <AppText variant="bodySmall" color={colors.textSecondary} style={styles.detailLabel}>
                Trip Time
              </AppText>
              <AppText variant="bodySmall" weight="semibold">
                {durationMinutes} min
              </AppText>
            </View>

            <View style={styles.detailRow}>
              <Icon name={assigned.icon} size={17} color={colors.textMuted} strokeWidth={1.9} />
              <AppText variant="bodySmall" color={colors.textSecondary} style={styles.detailLabel}>
                Vehicle
              </AppText>
              <View style={styles.vehicleValue}>
                <Image
                  source={assigned.image}
                  style={styles.vehicleThumb}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
                <AppText variant="bodySmall" weight="semibold" numberOfLines={1}>
                  {assigned.category ?? assigned.label}
                </AppText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Icon name="calendar" size={17} color={colors.textMuted} strokeWidth={1.9} />
              <AppText variant="bodySmall" color={colors.textSecondary} style={styles.detailLabel}>
                Completed
              </AppText>
              <AppText
                variant="bodySmall"
                weight="semibold"
                style={styles.detailValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {completedLabel}
              </AppText>
            </View>
          </View>

          <Pressable
            onPress={openRating}
            disabled={rated}
            accessibilityRole="button"
            accessibilityLabel={
              rated
                ? `You rated ${driver.name} ${submittedScore} star${submittedScore === 1 ? '' : 's'}`
                : `Rate your driver ${driver.name}`
            }
            accessibilityState={{ disabled: rated }}
            style={({ pressed }) => [styles.card, styles.driverCard, pressed && styles.pressed]}
          >
            <View style={styles.driverTop}>
              <DriverAvatar size={58} ringColor="transparent" />
              <View style={styles.driverInfo}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Your Driver
                </AppText>
                <AppText variant="h3" numberOfLines={1} style={styles.driverName}>
                  {driver.name}
                </AppText>
                <View style={styles.driverRating}>
                  <Icon name="star" size={13} color={colors.yellow} />
                  <AppText variant="bodySmall" weight="semibold">
                    {driver.rating.toFixed(1)}
                  </AppText>
                  <AppText variant="bodySmall" color={colors.textSecondary}>
                    {' · '}
                    {driver.ridesCount} trips
                  </AppText>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} strokeWidth={2.1} />
            </View>

            <View style={styles.rateStrip}>
              {rated ? (
                <>
                  <View style={styles.ratedStars}>
                    {STAR_VALUES.map((value) => (
                      <Icon
                        key={value}
                        name="star"
                        size={12}
                        color={value <= submittedScore ? colors.yellow : colors.border}
                      />
                    ))}
                  </View>
                  <AppText
                    variant="bodySmall"
                    weight="semibold"
                    color={colors.primaryDeep}
                    style={styles.rateLabel}
                  >
                    You rated {submittedScore} star{submittedScore === 1 ? '' : 's'}
                  </AppText>
                </>
              ) : (
                <>
                  <Icon name="star" size={15} color={colors.primary} />
                  <AppText
                    variant="bodySmall"
                    weight="semibold"
                    color={colors.primaryDeep}
                    style={styles.rateLabel}
                  >
                    Tap to rate this driver
                  </AppText>
                  <Icon name="chevron-right" size={16} color={colors.primary} strokeWidth={2.1} />
                </>
              )}
            </View>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <CTAButton title="Done" onPress={handleDone} accessibilityLabel="Done" />
        </View>
      </SafeAreaView>

      <DriverRatingSheet
        visible={ratingOpen}
        driver={driver}
        ride={ride}
        submittedRating={submittedRating}
        onClose={() => setRatingOpen(false)}
        onSubmitted={handleSubmitted}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    flex: {
      flex: 1,
    },
    mapWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      overflow: 'hidden',
    },
    mapWash: {
      backgroundColor: colors.surface,
      opacity: 0.28,
    },
    mapFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 136,
    },
    safe: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 14,
      alignItems: 'stretch',
    },
    success: {
      width: 96,
      height: 96,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    successHalo: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 48,
      backgroundColor: colors.primaryLight,
    },
    spark: {
      position: 'absolute',
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    sparkSmall: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    checkCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginTop: 12,
      fontSize: 25,
      lineHeight: 31,
      letterSpacing: -0.7,
    },
    subtitle: {
      marginTop: 6,
      marginBottom: 22,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      padding: 15,
      ...shadows.card,
    },
    fareHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    fareBlock: {
      flexShrink: 1,
      gap: 1,
    },
    fareValue: {
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -1.1,
    },
    paymentPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primaryMist,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
      flexShrink: 0,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSoft,
      marginVertical: 10,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
    },
    detailLabel: {
      flex: 1,
    },
    detailValue: {
      maxWidth: '62%',
      textAlign: 'right',
    },
    vehicleValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      maxWidth: '62%',
    },
    vehicleThumb: {
      width: 38,
      height: 20,
    },
    driverCard: {
      marginTop: 10,
      paddingTop: 14,
      paddingBottom: 14,
    },
    driverTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    driverInfo: {
      flex: 1,
      gap: 1,
    },
    driverName: {
      letterSpacing: -0.4,
    },
    driverRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    rateStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      backgroundColor: colors.primaryMist,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    rateLabel: {
      flex: 1,
    },
    ratedStars: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
    },
    pressed: {
      opacity: 0.88,
    },
    footer: {
      width: '100%',
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.screenPadding,
      paddingTop: 10,
      paddingBottom: CTA_BOTTOM_GAP,
      backgroundColor: colors.surface,
    },
  });

