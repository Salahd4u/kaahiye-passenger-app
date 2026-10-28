import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { CTAButton } from '@/components/ui/CTAButton';
import { ButtonRow } from '@/components/ui/ButtonRow';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { MockMap } from '@/components/map/MockMap';
import { FadeIn } from '@/components/animation/FadeIn';
import { useRideStore } from '@/store/rideStore';
import {
  MOCK_CURRENT_LOCATION,
  MOCK_SAVED_ADDRESSES,
  getMapPosition,
} from '@/mock/destinations';
import { MOCK_RIDE_FARE } from '@/mock/fares';
import { RIDE_OPTIONS, fareForRideOption, type RideOption } from '@/mock/rideOptions';
import { vehicleImageFor } from '@/mock/vehicleImages';
import { useAuthStore } from '@/store/authStore';
import { layout, useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

export default function FareEstimateScreen() {
  const { colors, shadows, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedPickup = useRideStore((state) => state.selectedPickup);
  const selectedDestination = useRideStore((state) => state.selectedDestination);
  const storedVehicle = useRideStore((state) => state.selectedRideOption);
  const setRideOption = useRideStore((state) => state.setRideOption);
  const passenger = useAuthStore((state) => state.passenger);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [vehicle, setVehicle] = useState<RideOption | null>(storedVehicle);
  const [pending, setPending] = useState<RideOption | null>(storedVehicle);
  const [sheetAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!sheetOpen) return;
    if (reducedMotion) {
      sheetAnim.setValue(1);
      return;
    }
    sheetAnim.setValue(0);
    Animated.spring(sheetAnim, {
      toValue: 1,
      speed: 16,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, sheetAnim, sheetOpen]);

  const pickup = selectedPickup ?? MOCK_CURRENT_LOCATION;
  const destination = selectedDestination ?? MOCK_SAVED_ADDRESSES[2];
  const pickupPoint = getMapPosition(pickup.id);
  const destinationPoint = getMapPosition(destination.id);
  const fareTotal = vehicle ? vehicle.fare : MOCK_RIDE_FARE.total;

  const handleEdit = () => {
    if (router.canGoBack()) router.back();
    else router.push('/search-destination');
  };

  const openSheet = () => {
    setPending(vehicle);
    setSheetOpen(true);
  };

  const handleCancel = () => setSheetOpen(false);

  const handleDone = () => {
    if (!pending) return;
    setVehicle(pending);
    setRideOption(pending);
    setSheetOpen(false);
  };

  const handleConfirm = () => {
    if (loading || !vehicle) return;
    setLoading(true);
    // Keep the shared ride state in sync with the vehicle used for this trip.
    setRideOption(vehicle);
    const state = useRideStore.getState();
    if (state.phase !== 'IDLE') state.resetToIdle();
    try {
      state.createRide(
        { pickup, destination, paymentMethod: 'cash' },
        passenger?.id ?? 'psg_001',
        fareForRideOption(vehicle),
      );
      router.push('/finding-driver');
    } catch {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.mapArea}>
        <MockMap
          pickup={pickupPoint}
          destination={destinationPoint}
          showRoute
          showDestination
          style={StyleSheet.absoluteFill}
          label="Route preview map"
        />
        <IconButton
          icon="arrow-left"
          variant="white"
          onPress={handleEdit}
          accessibilityLabel="Go back"
          style={[styles.floatingBack, { top: insets.top + 8 }]}
        />
      </View>

      <FadeIn delay={80} offset={14}>
        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 14) + 18 }]}>
        <View style={styles.panelHeader}>
          <AppText variant="h3">Ride Details</AppText>
          <Pressable onPress={handleEdit} hitSlop={10} accessibilityRole="link">
            <AppText variant="bodySmall" color={colors.blue} weight="semibold">
              Edit
            </AppText>
          </Pressable>
        </View>

        <View style={styles.timeline}>
          <View style={styles.timelineRow}>
            <View style={styles.timelineMarker}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              <View style={styles.connector} />
            </View>
            <View style={styles.timelineText}>
              <AppText variant="caption" color={colors.textSecondary}>
                Pickup
              </AppText>
              <AppText variant="subtitle" numberOfLines={1}>
                {pickup.label}
              </AppText>
            </View>
          </View>

          <View style={styles.timelineRow}>
            <View style={styles.timelineMarker}>
              <View style={[styles.timelineDot, { backgroundColor: colors.red }]} />
            </View>
            <View style={styles.timelineText}>
              <AppText variant="caption" color={colors.textSecondary}>
                Destination
              </AppText>
              <AppText variant="subtitle" numberOfLines={1}>
                {destination.label}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {destination.title}
              </AppText>
            </View>
          </View>
        </View>

        <Pressable
          onPress={openSheet}
          accessibilityRole="button"
          accessibilityLabel={vehicle ? `Selected vehicle ${vehicle.name}. Change vehicle` : 'Select vehicle'}
          style={({ pressed }) => [styles.vehicleCard, pressed && styles.vehicleCardPressed]}
        >
          {vehicle ? (
            <>
              <View style={styles.vehicleArt}>
                <Image
                  source={vehicleImageFor(vehicle.id)}
                  style={styles.vehiclePhoto}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.vehicleInfo}>
                <AppText variant="bodySmall" weight="semibold" numberOfLines={1}>
                  {vehicle.name}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  ${vehicle.fare.toFixed(2)} · {vehicle.etaMinutes} min away
                </AppText>
              </View>
              <AppText variant="bodySmall" color={colors.blue} weight="semibold">
                Change
              </AppText>
            </>
          ) : (
            <>
              <View style={styles.vehicleIcon}>
                <Icon name="car" size={19} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={styles.vehicleInfo}>
                <AppText variant="bodySmall" weight="semibold">
                  Select Vehicle
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Choose a ride type for your trip
                </AppText>
              </View>
              <Icon name="chevron-right" size={18} color={colors.textFaint} strokeWidth={2} />
            </>
          )}
        </Pressable>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Icon name="route" size={19} color={colors.blue} strokeWidth={1.7} />
            <View>
              <AppText variant="subtitle">{MOCK_RIDE_FARE.distance.toFixed(1)} km</AppText>
              <AppText variant="micro" color={colors.textSecondary}>
                Distance
              </AppText>
            </View>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Icon name="clock" size={19} color={colors.navy} strokeWidth={1.7} />
            <View>
              <AppText variant="subtitle">{MOCK_RIDE_FARE.duration} min</AppText>
              <AppText variant="micro" color={colors.textSecondary}>
                Est. time
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.fareBox}>
          <AppText variant="bodySmall" color={colors.navySoft} weight="medium">
            Estimated Fare
          </AppText>
          <AppText variant="h2" style={styles.fareValue}>
            ${fareTotal.toFixed(2)}
          </AppText>
        </View>

        <CTAButton
          title="Confirm Ride"
          subtitle={vehicle ? `$${vehicle.fare.toFixed(2)} • ${vehicle.etaMinutes} min away` : undefined}
          onPress={handleConfirm}
          loading={loading}
          disabled={loading || !vehicle}
          accessibilityLabel="Confirm ride"
        />
        </View>
      </FadeIn>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={handleCancel}
            accessibilityLabel="Close vehicle selection"
          />
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 12) + 8,
                opacity: sheetAnim,
                transform: [
                  {
                    translateY: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [64, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <AppText variant="h3">Select Vehicle</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Choose a ride type for your trip
              </AppText>
            </View>

            <View style={styles.sheetList}>
              {RIDE_OPTIONS.map((option) => {
                const selected = pending?.id === option.id;
                return (
                  <SelectionScale key={option.id} selected={selected}>
                  <Pressable
                    onPress={() => setPending(option)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${option.name}, ${option.fare.toFixed(2)} dollars, ${option.passengers} passengers, ${option.etaMinutes} minutes away`}
                    style={({ pressed }) => [
                      styles.sheetOption,
                      selected && styles.sheetOptionSelected,
                      pressed && styles.vehicleCardPressed,
                    ]}
                  >
                    <View style={styles.sheetOptionArt}>
                      <Image
                        source={vehicleImageFor(option.id)}
                        style={styles.vehiclePhoto}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.sheetOptionInfo}>
                      <AppText variant="bodySmall" weight="semibold" numberOfLines={1}>
                        {option.name}
                      </AppText>
                      <AppText variant="micro" color={colors.textSecondary} numberOfLines={1}>
                        {option.passengers} passenger{option.passengers > 1 ? 's' : ''} ·{' '}
                        {option.bags} bag{option.bags === 1 ? '' : 's'}
                      </AppText>
                      <AppText variant="micro" color={colors.textSecondary}>
                        {option.etaMinutes} min away
                      </AppText>
                    </View>
                    <AppText variant="subtitle" style={styles.sheetOptionFare}>
                      ${option.fare.toFixed(2)}
                    </AppText>
                    <View
                      style={[styles.radio, selected ? styles.radioSelected : styles.radioUnselected]}
                    >
                      {selected ? (
                        <Icon name="check" size={13} color={colors.white} strokeWidth={3} />
                      ) : null}
                    </View>
                  </Pressable>
                  </SelectionScale>
                );
              })}
            </View>

            <ButtonRow style={styles.sheetActions}>
              <CTAButton
                title="Cancel"
                variant="secondary"
                onPress={handleCancel}
                accessibilityLabel="Cancel vehicle selection"
              />
              <CTAButton
                title="Done"
                onPress={handleDone}
                disabled={!pending}
                accessibilityLabel="Save vehicle selection"
              />
            </ButtonRow>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}


/**
 * Tiny spring pulse that plays when a ride option becomes selected.
 * Skipped entirely when the system asks for reduced motion.
 */
function SelectionScale({
  selected,
  children,
}: {
  selected: boolean;
  children: React.ReactNode;
}) {
  const { reducedMotion } = useTheme();
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!selected || reducedMotion) return;
    scale.setValue(0.972);
    Animated.spring(scale, {
      toValue: 1,
      speed: 22,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, scale, selected]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mapArea: {
    flex: 1,
    minHeight: 220,
  },
  floatingBack: {
    position: 'absolute',
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  panel: {
    minHeight: 470,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between',
    ...shadows.bottomSheet,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeline: {
    marginBottom: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 58,
  },
  timelineMarker: {
    width: 24,
    alignItems: 'center',
    paddingTop: 7,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  connector: {
    width: 1.5,
    height: 38,
    backgroundColor: colors.border,
    marginTop: 5,
  },
  timelineText: {
    flex: 1,
    paddingLeft: 8,
    gap: 1,
    paddingBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    marginTop: 2,
  },
  metric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: colors.border,
  },
  fareBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
  },
  fareValue: {
    fontSize: 23,
    letterSpacing: -0.5,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  vehicleCardPressed: {
    opacity: 0.85,
  },
  vehicleArt: {
    width: 54,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePhoto: {
    width: 52,
    height: 34,
  },
  vehicleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
    gap: 1,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16,24,40,0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: layout.screenPadding,
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
  sheetHeader: {
    gap: 2,
    marginBottom: 10,
  },
  sheetList: {
    gap: 6,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sheetOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  sheetOptionArt: {
    width: 56,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionInfo: {
    flex: 1,
    gap: 1,
  },
  sheetOptionFare: {
    minWidth: 58,
    textAlign: 'right',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.primary,
  },
  radioUnselected: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sheetActions: {
    marginTop: 12,
  },
  });
