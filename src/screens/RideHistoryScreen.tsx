import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { CTAButton } from '@/components/ui/CTAButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { DriverAvatar } from '@/components/brand/DriverAvatar';
import { MockMap } from '@/components/map/MockMap';
import { mockService } from '@/services/mockService';
import {
  MOCK_RIDE_HISTORY,
  type HistoryEntry,
  type HistoryStatus,
} from '@/mock/history';
import { MOCK_DRIVERS, MOCK_DRIVER_BY_ID } from '@/mock/drivers';
import { rideOptionById } from '@/mock/rideOptions';
import { assignedVehicleFor } from '@/mock/assignedVehicle';
import { layout, useTheme, type ThemeColors, type ThemeShadows } from '@/theme';
import type { Coordinates } from '@/types';

type Tab = 'All' | 'Completed' | 'Cancelled';
const TABS: Tab[] = ['All', 'Completed', 'Cancelled'];

/** Receipt sheet never grows past this share of the screen, so the modal stays a sheet. */
const SHEET_HEIGHT_RATIO = 0.84;

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatRideDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} - ${hour12}:${minutes} ${suffix}`;
}

function monthLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function iconForDestination(id: string): IconName {
  if (id === 'addr_3') return 'shopping-bag';
  if (id === 'addr_4') return 'plane';
  if (id === 'addr_5') return 'building';
  return 'map-pin';
}

/** Resolves the booked vehicle + assigned driver for any history entry. */
function vehicleForEntry(entry: HistoryEntry) {
  const option = rideOptionById(entry.vehicleCategory);
  const driver = MOCK_DRIVER_BY_ID[entry.driverId] ?? MOCK_DRIVERS[0];
  return { driver, vehicle: assignedVehicleFor(option, driver) };
}

/** Maps Fargo coordinates onto the illustration, filling the framed map. */
function routePointsFor(entry: HistoryEntry) {
  const project = (point: Coordinates) => ({
    x: (point.longitude + 96.87) / 0.13,
    y: (46.95 - point.latitude) / 0.13,
  });
  const pickup = project(entry.pickupCoordinates);
  const destination = project(entry.destinationCoordinates);
  const minX = Math.min(pickup.x, destination.x);
  const maxX = Math.max(pickup.x, destination.x);
  const minY = Math.min(pickup.y, destination.y);
  const maxY = Math.max(pickup.y, destination.y);
  const spanX = Math.max(maxX - minX, 0.05);
  const spanY = Math.max(maxY - minY, 0.05);
  const fit = (value: number, min: number, span: number) => 0.2 + ((value - min) / span) * 0.6;
  return {
    pickup: { x: fit(pickup.x, minX, spanX), y: fit(pickup.y, minY, spanY) },
    destination: {
      x: fit(destination.x, minX, spanX),
      y: fit(destination.y, minY, spanY),
    },
  };
}

function buildReceipt(entry: HistoryEntry) {
  const { driver, vehicle } = vehicleForEntry(entry);
  return [
    'Kaahiye — Trip Receipt',
    `Receipt: ${entry.id}`,
    `Date: ${entry.dateLabel}`,
    `Status: ${entry.status === 'completed' ? 'Completed' : 'Cancelled'}`,
    '',
    `Pickup: ${entry.pickupLabel} — ${entry.pickup}`,
    `Destination: ${entry.destination} — ${entry.address}`,
    `Driver: ${driver.name} · ${driver.rating.toFixed(1)}★`,
    `Vehicle: ${vehicle.category ?? 'Kaahiye ride'} · ${vehicle.label} (${vehicle.plate})`,
    `Trip time: ${entry.durationMinutes} min · ${entry.distanceKm.toFixed(1)} km`,
    '',
    `Base fare: ${money(entry.fareBreakdown.base)}`,
    `Distance & time: ${money(entry.fareBreakdown.ride)}`,
    `Taxes & fees: ${money(entry.fareBreakdown.tax)}`,
    `Total (${entry.paymentMethod}): ${money(entry.fare)}`,
  ].join('\n');
}


export default function RideHistoryScreen() {
  const { colors, shadows, isDark, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 720;
  const [tab, setTab] = useState<Tab>('All');
  const [stored, setStored] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [sheetAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rides = await mockService.getRideHistory();
      if (!mounted) return;
      const mapped: HistoryEntry[] = rides
        .filter((ride) => ride.status === 'COMPLETED' || ride.status === 'CANCELLED')
        .map((ride) => {
          const driver = ride.driver ?? MOCK_DRIVERS[0];
          const when = ride.completedAt ?? ride.cancelledAt ?? ride.createdAt;
          const base = ride.fare.base;
          return {
            id: ride.id,
            destination: ride.destination.label,
            address: ride.destination.title,
            pickup: ride.pickup.title,
            pickupLabel: ride.pickup.label,
            dateLabel: formatRideDate(when),
            fare: ride.fare.total,
            status: (ride.status === 'CANCELLED' ? 'cancelled' : 'completed') as HistoryStatus,
            icon: iconForDestination(ride.destination.id),
            sortDate: when,
            vehicleCategory: ride.vehicleCategory ?? 'comfort',
            driverId: driver.id,
            distanceKm: ride.distanceMiles ?? ride.fare.distance,
            durationMinutes: ride.fare.duration,
            pickupCoordinates: ride.pickup.coordinates,
            destinationCoordinates: ride.destination.coordinates,
            fareBreakdown: {
              base,
              ride: Math.max(0, Math.round((ride.fare.subtotal - base) * 100) / 100),
              tax: ride.fare.tax,
            },
            paymentMethod: ride.paymentMethod === 'cash' ? 'Cash' : 'Card',
          };
        });
      setStored(mapped);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      sheetAnim.setValue(0);
      return;
    }
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
  }, [reducedMotion, selected, sheetAnim]);

  const entries = useMemo(() => {
    const seen = new Set<string>();
    return [...stored, ...MOCK_RIDE_HISTORY]
      .filter((entry) => {
        if (seen.has(entry.id)) return false;
        seen.add(entry.id);
        return true;
      })
      .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
  }, [stored]);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        if (tab === 'All') return true;
        return tab === 'Completed' ? entry.status === 'completed' : entry.status === 'cancelled';
      }),
    [entries, tab],
  );

  /** Month-grouped sections, newest first. */
  const sections = useMemo(() => {
    const groups: { title: string; rides: HistoryEntry[] }[] = [];
    filtered.forEach((entry) => {
      const title = monthLabel(entry.sortDate);
      const last = groups[groups.length - 1];
      if (last && last.title === title) last.rides.push(entry);
      else groups.push({ title, rides: [entry] });
    });
    return groups;
  }, [filtered]);

  const completedCount = useMemo(
    () => entries.filter((entry) => entry.status === 'completed').length,
    [entries],
  );

  const closeSheet = () => setSelected(null);

  const handleDownload = async () => {
    if (!selected) return;
    const receipt = buildReceipt(selected);

    // Browser preview: download a text receipt file.
    if (Platform.OS === 'web') {
      const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kaahiye-receipt-${selected.id}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    }

    // Native: the share sheet saves/sends the receipt.
    try {
      await Share.share({
        title: 'Kaahiye trip receipt',
        message: receipt,
      });
    } catch {
      Alert.alert('Receipt unavailable', 'Sharing is not available on this device.');
    }
  };

  const selectedDetails = selected ? vehicleForEntry(selected) : null;
  const selectedRoute = selected ? routePointsFor(selected) : null;
  const selectedCompleted = selected?.status === 'completed';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          variant="ghost"
          size="sm"
          onPress={() => router.replace('/select-location')}
          accessibilityLabel="Go back"
        />
        <View style={styles.headerText}>
          <AppText style={[styles.title, compact && styles.titleCompact]}>Ride History</AppText>
          <AppText style={styles.subtitle} color={colors.textSecondary}>
            {entries.length} trips · {completedCount} completed
          </AppText>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = item === tab;
          return (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${item} rides`}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={[styles.tabLabel, active && styles.tabLabelActive]}>{item}</AppText>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {sections.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="clock" size={26} color={colors.textMuted} strokeWidth={1.6} />
            </View>
            <AppText variant="subtitle" align="center">
              No rides here yet
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} align="center">
              Completed and cancelled trips will show up here.
            </AppText>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <AppText style={styles.sectionTitle}>{section.title}</AppText>

              {section.rides.map((entry) => {
                const completed = entry.status === 'completed';
                const { vehicle } = vehicleForEntry(entry);
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => setSelected(entry)}
                    accessibilityRole="button"
                    accessibilityLabel={`Trip to ${entry.destination}, ${entry.dateLabel}, ${completed ? 'Completed' : 'Cancelled'}, ${money(entry.fare)}`}
                    style={({ pressed }) => [
                      styles.card,
                      compact && styles.cardCompact,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.cardTop}>
                      <Image
                        source={vehicle.image}
                        style={styles.vehicleThumb}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                      />
                      <View style={styles.cardIdentity}>
                        <AppText style={styles.cardCategory} numberOfLines={1}>
                          {vehicle.category ?? 'Kaahiye ride'}
                        </AppText>
                        <AppText
                          style={styles.cardVehicle}
                          color={colors.textSecondary}
                          numberOfLines={1}
                        >
                          {vehicle.label}
                        </AppText>
                      </View>
                      <View style={styles.cardAmount}>
                        <AppText style={styles.cardFare}>{money(entry.fare)}</AppText>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: completed ? colors.primaryLight : colors.redSoft,
                            },
                          ]}
                        >
                          <AppText
                            style={[
                              styles.statusText,
                              { color: completed ? colors.primaryDeep : colors.red },
                            ]}
                          >
                            {completed ? 'Completed' : 'Cancelled'}
                          </AppText>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.routeBlock}>
                      <View style={styles.routeRow}>
                        <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                        <View style={styles.routePickupLine}>
                          <AppText style={styles.routeLabel} numberOfLines={1}>
                            {entry.pickupLabel}
                          </AppText>
                          <AppText
                            style={styles.routeAddress}
                            color={colors.textSecondary}
                            numberOfLines={1}
                          >
                            · {entry.pickup}
                          </AppText>
                        </View>
                      </View>

                      <View style={styles.routeConnector} />

                      <View style={styles.routeRow}>
                        <View style={[styles.routeDot, { backgroundColor: colors.red }]} />
                        <View style={styles.routeLineText}>
                          <AppText style={styles.routeDestination} numberOfLines={1}>
                            {entry.destination}
                          </AppText>
                          <AppText
                            style={styles.routeAddress}
                            color={colors.textSecondary}
                            numberOfLines={1}
                          >
                            {entry.address}
                          </AppText>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.cardDateRow}>
                        <Icon name="clock" size={12} color={colors.textMuted} strokeWidth={1.8} />
                        <AppText style={styles.cardDate} color={colors.textMuted}>
                          {entry.dateLabel}
                        </AppText>
                      </View>
                      <Icon
                        name="chevron-right"
                        size={16}
                        color={colors.textFaint}
                        strokeWidth={2.1}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={closeSheet}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeSheet}
            accessibilityRole="button"
            accessibilityLabel="Close trip receipt"
          />

          <Animated.View
            style={[
              styles.sheet,
              {
                maxHeight: Math.round(windowHeight * SHEET_HEIGHT_RATIO),
                paddingBottom: Math.max(insets.bottom, 14) + 8,
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
              <View style={styles.sheetHeaderText}>
                <AppText style={styles.sheetTitle}>Trip Receipt</AppText>
                {selected ? (
                  <AppText style={styles.sheetDate} color={colors.textSecondary} numberOfLines={1}>
                    {selected.dateLabel} · {selected.durationMinutes} min ·{' '}
                    {selected.distanceKm.toFixed(1)} km
                  </AppText>
                ) : null}
              </View>
              <Pressable
                onPress={closeSheet}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close trip receipt"
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <Icon name="close" size={17} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
            </View>

            {selected && selectedDetails && selectedRoute ? (
              <>
                <ScrollView
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.mapCard}>
                    <MockMap
                      pickup={selectedRoute.pickup}
                      destination={selectedRoute.destination}
                      showRoute
                      showPickup
                      showDestination
                      routeColor={colors.primary}
                      style={StyleSheet.absoluteFill}
                      label="Trip route map"
                    />
                    <View style={styles.mapBadge}>
                      <View
                        style={[
                          styles.mapBadgeDot,
                          { backgroundColor: selectedCompleted ? colors.primary : colors.red },
                        ]}
                      />
                      <AppText style={styles.mapBadgeText}>
                        {selectedCompleted ? 'Completed trip' : 'Cancelled trip'}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.vehicleCard}>
                    <Image
                      source={selectedDetails.vehicle.image}
                      style={styles.sheetVehicleImage}
                      resizeMode="contain"
                      accessibilityIgnoresInvertColors
                    />
                    <View style={styles.sheetVehicleInfo}>
                      <AppText style={styles.sheetVehicleCategory} numberOfLines={1}>
                        {selectedDetails.vehicle.category ?? 'Kaahiye ride'}
                      </AppText>
                      <AppText
                        style={styles.sheetVehicleLabel}
                        color={colors.textSecondary}
                        numberOfLines={1}
                      >
                        {selectedDetails.vehicle.label}
                      </AppText>
                      <View style={styles.platePill}>
                        <AppText style={styles.plate}>{selectedDetails.vehicle.plate}</AppText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.driverCard}>
                    <DriverAvatar size={36} ringColor={colors.primaryLight} />
                    <View style={styles.driverInfo}>
                      <AppText style={styles.driverName} numberOfLines={1}>
                        {selectedDetails.driver.name}
                      </AppText>
                      <View style={styles.driverRatingRow}>
                        <Icon name="star" size={11} color={colors.yellow} />
                        <AppText style={styles.driverRating} weight="semibold">
                          {selectedDetails.driver.rating.toFixed(1)}
                        </AppText>
                        <AppText style={styles.driverRatingMuted}>
                          ({selectedDetails.driver.ridesCount} rides)
                        </AppText>
                      </View>
                    </View>
                    <View style={styles.paymentPill}>
                      <AppText style={styles.paymentText}>{selected.paymentMethod}</AppText>
                    </View>
                  </View>

                  <View style={styles.timeline}>
                    <View style={styles.stopRow}>
                      <View style={[styles.stopIcon, { backgroundColor: colors.primaryLight }]}>
                        <Icon name="map-pin" size={15} color={colors.primary} strokeWidth={2.1} />
                      </View>
                      <View style={styles.stopText}>
                        <AppText style={styles.stopLabel} color={colors.textSecondary}>
                          Pickup
                        </AppText>
                        <AppText style={styles.stopValue} numberOfLines={1}>
                          {selected.pickupLabel} · {selected.pickup}
                        </AppText>
                      </View>
                    </View>

                    <View style={styles.stopConnector}>
                      <View style={styles.stopDot} />
                      <View style={styles.stopDot} />
                      <View style={styles.stopDot} />
                    </View>

                    <View style={styles.stopRow}>
                      <View style={[styles.stopIcon, { backgroundColor: colors.redSoft }]}>
                        <Icon name="map-pin" size={15} color={colors.red} strokeWidth={2.1} />
                      </View>
                      <View style={styles.stopText}>
                        <AppText style={styles.stopLabel} color={colors.textSecondary}>
                          Destination
                        </AppText>
                        <AppText style={styles.stopValue} numberOfLines={1}>
                          {selected.destination}
                        </AppText>
                        <AppText
                          style={styles.stopAddress}
                          color={colors.textSecondary}
                          numberOfLines={1}
                        >
                          {selected.address}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.fareCard}>
                    <AppText style={styles.fareTitle}>Fare breakdown</AppText>

                    <View style={styles.fareRow}>
                      <AppText style={styles.fareRowLabel} color={colors.textSecondary}>
                        Base fare
                      </AppText>
                      <AppText style={styles.fareRowValue}>
                        {money(selected.fareBreakdown.base)}
                      </AppText>
                    </View>
                    <View style={styles.fareRow}>
                      <AppText style={styles.fareRowLabel} color={colors.textSecondary}>
                        Distance & time
                      </AppText>
                      <AppText style={styles.fareRowValue}>
                        {money(selected.fareBreakdown.ride)}
                      </AppText>
                    </View>
                    <View style={styles.fareRow}>
                      <AppText style={styles.fareRowLabel} color={colors.textSecondary}>
                        Taxes & fees
                      </AppText>
                      <AppText style={styles.fareRowValue}>
                        {money(selected.fareBreakdown.tax)}
                      </AppText>
                    </View>

                    <View style={styles.fareDivider} />

                    <View style={styles.fareTotalRow}>
                      <View style={styles.fareTotalText}>
                        <AppText style={styles.fareTotalLabel}>Total</AppText>
                        <View style={styles.paidRow}>
                          <Icon name="check" size={11} color={colors.primary} strokeWidth={2.6} />
                          <AppText style={styles.paidText} color={colors.primaryDeep}>
                            Paid with {selected.paymentMethod.toLowerCase()}
                          </AppText>
                        </View>
                      </View>
                      <AppText style={styles.fareTotalValue}>{money(selected.fare)}</AppText>
                    </View>
                  </View>

                  <AppText style={styles.receiptMeta} color={colors.textMuted}>
                    Receipt #{selected.id}
                  </AppText>
                </ScrollView>

                <View style={styles.sheetFooter}>
                  <CTAButton
                    title="Download Receipt"
                    onPress={handleDownload}
                    accessibilityLabel="Download receipt"
                  />
                </View>
              </>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: layout.screenPadding,
      paddingTop: 4,
      paddingBottom: 2,
    },
    headerText: {
      flex: 1,
      gap: 1,
    },
    title: {
      fontSize: 24,
      lineHeight: 29,
      letterSpacing: -0.7,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
    },
    titleCompact: {
      fontSize: 22,
      lineHeight: 27,
    },
    subtitle: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'Inter_500Medium',
    },
    tabs: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: layout.screenPadding,
      marginTop: 12,
    },
    tab: {
      flex: 1,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabLabel: {
      fontSize: 12.5,
      lineHeight: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.textSecondary,
    },
    tabLabelActive: {
      color: colors.white,
      fontFamily: 'Inter_700Bold',
    },
    pressed: {
      opacity: 0.7,
    },
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 28,
      flexGrow: 1,
    },
    section: {
      marginTop: 14,
    },
    sectionTitle: {
      marginLeft: 2,
      marginBottom: 8,
      fontSize: 11,
      lineHeight: 15,
      letterSpacing: 0.6,
      fontFamily: 'Inter_600SemiBold',
      color: colors.textMuted,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      padding: 12,
      marginBottom: 10,
      ...shadows.card,
    },
    cardCompact: {
      padding: 10,
      marginBottom: 8,
      borderRadius: 16,
    },
    cardPressed: {
      opacity: 0.88,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    vehicleThumb: {
      width: 62,
      height: 30,
    },
    cardIdentity: {
      flex: 1,
      gap: 1,
    },
    cardCategory: {
      fontSize: 13.5,
      lineHeight: 18,
      letterSpacing: -0.2,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
    },
    cardVehicle: {
      fontSize: 11,
      lineHeight: 15,
      fontFamily: 'Inter_400Regular',
    },
    cardAmount: {
      alignItems: 'flex-end',
      gap: 4,
    },
    cardFare: {
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: -0.3,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
    },
    statusBadge: {
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    statusText: {
      fontSize: 9.5,
      lineHeight: 13,
      letterSpacing: 0.2,
      fontFamily: 'Inter_700Bold',
    },
    cardDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSoft,
      marginVertical: 9,
    },
    routeBlock: {
      gap: 0,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    routeDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      marginTop: 4,
    },
    routePickupLine: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    routeLineText: {
      flex: 1,
      gap: 1,
    },
    routeLabel: {
      fontSize: 11.5,
      lineHeight: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.textPrimary,
    },
    routeDestination: {
      fontSize: 12.5,
      lineHeight: 16,
      letterSpacing: -0.1,
      fontFamily: 'Inter_600SemiBold',
      color: colors.textPrimary,
    },
    routeAddress: {
      flexShrink: 1,
      fontSize: 11,
      lineHeight: 15,
      fontFamily: 'Inter_400Regular',
    },
    routeConnector: {
      width: 1.5,
      height: 8,
      borderRadius: 1,
      marginLeft: 2.75,
      marginVertical: 2,
      backgroundColor: colors.border,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 9,
    },
    cardDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    cardDate: {
      fontSize: 10.5,
      lineHeight: 14,
      fontFamily: 'Inter_500Medium',
    },
    empty: {
      alignItems: 'center',
      paddingTop: 80,
      gap: 8,
    },
    emptyIcon: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    modalRoot: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 18,
      paddingTop: 8,
      ...shadows.sheet,
    },
    handle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 8,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingBottom: 6,
    },
    sheetHeaderText: {
      flex: 1,
      gap: 1,
    },
    sheetTitle: {
      fontSize: 20,
      lineHeight: 25,
      letterSpacing: -0.45,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
    },
    sheetDate: {
      fontSize: 11.5,
      lineHeight: 15,
      fontFamily: 'Inter_400Regular',
    },
    closeButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetScroll: {
      flexShrink: 1,
    },
    sheetContent: {
      paddingBottom: 8,
      gap: 8,
    },
    mapCard: {
      height: 96,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.mapBase,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    mapBadge: {
      position: 'absolute',
      top: 9,
      left: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    mapBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    mapBadgeText: {
      fontSize: 10,
      lineHeight: 13,
      fontFamily: 'Inter_600SemiBold',
      color: colors.textPrimary,
    },
    vehicleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      borderRadius: 14,
      backgroundColor: colors.surfaceSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    sheetVehicleImage: {
      width: 88,
      height: 38,
    },
    sheetVehicleInfo: {
      flex: 1,
      gap: 3,
      alignItems: 'flex-start',
    },
    sheetVehicleCategory: {
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: -0.2,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
    },
    sheetVehicleLabel: {
      fontSize: 11.5,
      lineHeight: 15,
      fontFamily: 'Inter_400Regular',
    },
    platePill: {
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
      backgroundColor: colors.surfaceMuted,
    },
    plate: {
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 0.4,
      fontFamily: 'Inter_700Bold',
      color: colors.textPrimary,
    },
    driverCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    driverInfo: {
      flex: 1,
      gap: 1,
    },
    driverName: {
      fontSize: 13.5,
      lineHeight: 18,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
    },
    driverRatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    driverRating: {
      fontSize: 11.5,
      lineHeight: 15,
    },
    driverRatingMuted: {
      fontSize: 11,
      lineHeight: 15,
      color: colors.textMuted,
    },
    paymentPill: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
    },
    paymentText: {
      fontSize: 10,
      lineHeight: 13,
      fontFamily: 'Inter_700Bold',
      color: colors.primaryDeep,
    },
    // SHEET_STYLES_2
    timeline: {
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    stopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    stopIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopText: {
      flex: 1,
      gap: 0,
    },
    stopLabel: {
      fontSize: 10,
      lineHeight: 13,
      fontFamily: 'Inter_500Medium',
    },
    stopValue: {
      fontSize: 12.5,
      lineHeight: 17,
      fontFamily: 'Inter_600SemiBold',
      color: colors.textPrimary,
    },
    stopAddress: {
      fontSize: 10.5,
      lineHeight: 14,
      fontFamily: 'Inter_400Regular',
    },
    stopConnector: {
      width: 30,
      height: 10,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 1,
    },
    stopDot: {
      width: 2.5,
      height: 2.5,
      borderRadius: 1.25,
      backgroundColor: colors.border,
    },
    fareCard: {
      gap: 4,
      padding: 10,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    fareTitle: {
      fontSize: 12.5,
      lineHeight: 16,
      letterSpacing: -0.2,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
      marginBottom: 1,
    },
    fareRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fareRowLabel: {
      fontSize: 11.5,
      lineHeight: 15,
      fontFamily: 'Inter_400Regular',
    },
    fareRowValue: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.textPrimary,
    },
    fareDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSoft,
      marginVertical: 2,
    },
    fareTotalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fareTotalText: {
      gap: 1,
    },
    fareTotalLabel: {
      fontSize: 13,
      lineHeight: 17,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
    },
    fareTotalValue: {
      fontSize: 18,
      lineHeight: 22,
      letterSpacing: -0.3,
      fontFamily: 'Inter_700Bold',
      color: colors.primaryDeep,
    },
    paidRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    paidText: {
      fontSize: 10.5,
      lineHeight: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    receiptMeta: {
      fontSize: 10,
      lineHeight: 14,
      textAlign: 'center',
      fontFamily: 'Inter_500Medium',
    },
    sheetFooter: {
      paddingTop: 10,
    },
  });


