import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { FadeIn } from '@/components/animation/FadeIn';
import { KaahiyeLogo } from '@/components/brand/KaahiyeLogo';
import { DriverAvatar } from '@/components/brand/DriverAvatar';
import { MockMap } from '@/components/map/MockMap';
import { useRideStore } from '@/store/rideStore';
import { useAuthStore } from '@/store/authStore';
import { MOCK_CURRENT_LOCATION, MOCK_SAVED_ADDRESSES } from '@/mock/destinations';
import {
  HOME_MAP_CARS,
  HOME_RECENT_RIDES,
  HOME_SHORTCUTS,
  type HomeShortcut,
  type RecentRidePreview,
} from '@/mock/home';
import { useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

type SheetMode = 'menu' | 'settings' | null;

/** Passenger position on the simulated map (normalised 0..1). */
const PICKUP_POINT = { x: 0.5, y: 0.32 };

/** Bottom sheet geometry — ratios keep it responsive on every device. */
const SHEET_EXPANDED_RATIO = 0.58;
const SHEET_MIN_HEIGHT = 360;
const SHEET_MAX_HEIGHT = 520;
const SHEET_PEEK_RATIO = 0.35;

export default function SelectLocationScreen() {
  const { colors, shadows, isDark, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [sheet, setSheet] = useState<SheetMode>(null);
  const [expanded, setExpanded] = useState(true);
  const [menuAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!sheet) return;
    if (reducedMotion) {
      menuAnim.setValue(1);
      return;
    }
    menuAnim.setValue(0);
    Animated.spring(menuAnim, {
      toValue: 1,
      speed: 16,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [menuAnim, reducedMotion, sheet]);
  const [translateY] = useState(() => new Animated.Value(0));

  const selectedPickup = useRideStore((state) => state.selectedPickup);
  const setPickup = useRideStore((state) => state.setPickup);
  const setDestination = useRideStore((state) => state.setDestination);
  const passenger = useAuthStore((state) => state.passenger);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    if (!selectedPickup) setPickup(MOCK_CURRENT_LOCATION);
  }, [selectedPickup, setPickup]);

  const sheetHeight = Math.min(
    Math.max(Math.round(windowHeight * SHEET_EXPANDED_RATIO), SHEET_MIN_HEIGHT),
    SHEET_MAX_HEIGHT,
  );
  const peekHeight = Math.min(Math.round(windowHeight * SHEET_PEEK_RATIO), sheetHeight - 96);
  const dragRange = Math.max(0, sheetHeight - peekHeight);

  const settleSheet = useCallback(
    (toExpanded: boolean) => {
      setExpanded(toExpanded);
      Animated.spring(translateY, {
        toValue: toExpanded ? 0 : dragRange,
        speed: 20,
        bounciness: 0,
        useNativeDriver: false,
      }).start();
    },
    [dragRange, translateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,
        onPanResponderMove: (_, gesture) => {
          // Dragging always starts from a resting position, so the offset is
          // known without tracking the animated value.
          const base = expanded ? 0 : dragRange;
          translateY.setValue(Math.min(dragRange, Math.max(0, base + gesture.dy)));
        },
        onPanResponderRelease: (_, gesture) => {
          const base = expanded ? 0 : dragRange;
          // A tap on the handle toggles the sheet.
          if (Math.abs(gesture.dy) < 4 && Math.abs(gesture.vx) < 0.2) {
            settleSheet(!expanded);
            return;
          }
          if (gesture.vy < -0.4) settleSheet(true);
          else if (gesture.vy > 0.4) settleSheet(false);
          else settleSheet(base + gesture.dy < dragRange / 2);
        },
        onPanResponderTerminate: () => settleSheet(expanded),
      }),
    [dragRange, expanded, settleSheet, translateY],
  );

  const closeSheet = () => setSheet(null);

  const go = (path: string) => {
    closeSheet();
    router.push(path as never);
  };

  /** Continues into the existing booking flow with a mock saved address. */
  const startBooking = (destinationId?: string) => {
    const address = MOCK_SAVED_ADDRESSES.find((item) => item.id === destinationId);
    if (!address) return;
    setDestination(address);
    router.push('/fare-estimate' as never);
  };



  const openShortcut = (shortcut: HomeShortcut) => {
    if (shortcut.route) {
      router.push(shortcut.route as never);
      return;
    }
    startBooking(shortcut.destinationId);
  };

  const openRecentRide = (ride: RecentRidePreview) => startBooking(ride.destinationId);

  const openNotifications = () =>
    Alert.alert(
      'Notifications',
      'Your driver Marcus is finishing a trip nearby and can pick you up in 3 minutes.',
    );
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <MockMap
        pickup={PICKUP_POINT}
        cars={HOME_MAP_CARS}
        showRoute={false}
        showDestination={false}
        style={StyleSheet.absoluteFill}
        label="Home map with current location and nearby cars"
      />

      <View style={[styles.header, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <View style={styles.headerSide}>
          <IconButton
            icon="menu"
            variant="white"
            onPress={() => setSheet('menu')}
            accessibilityLabel="Open menu"
          />
        </View>

        <View style={styles.brand} pointerEvents="none">
          <KaahiyeLogo size={24} />
          <AppText variant="h2" style={styles.brandName}>
            Kaahiye
          </AppText>
        </View>

        <View style={[styles.headerSide, styles.headerSideRight]}>
          <IconButton
            icon="bell"
            variant="white"
            iconSize={21}
            onPress={openNotifications}
            accessibilityLabel="Notifications, 2 unread"
          />
          <View style={styles.bellDot} pointerEvents="none" />
        </View>
      </View>

      <Animated.View
        style={[styles.mapControls, { bottom: sheetHeight + 14, transform: [{ translateY }] }]}
        pointerEvents="box-none"
      >
        <IconButton
          icon="settings"
          variant="white"
          size="sm"
          iconSize={19}
          onPress={() => setSheet('settings')}
          accessibilityLabel="Map settings"
        />
      </Animated.View>

      <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]}>
        <View
          style={styles.dragZone}
          {...panResponder.panHandlers}
          accessibilityLabel="Bottom sheet drag handle"
        >
          <View style={styles.handle} />
        </View>

        <FadeIn delay={90} offset={12} style={styles.sheetScroll}>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={expanded}
          bounces={expanded}
        >
          <AppText variant="h2" style={styles.title}>
            Where are you going?
          </AppText>

          <Pressable
            onPress={() => router.push('/search-destination' as never)}
            accessibilityRole="button"
            accessibilityLabel="Search destination"
            style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
          >
            <Icon name="search" size={20} color={colors.navy} strokeWidth={2} />
            <AppText variant="body" color={colors.textSecondary} style={styles.searchLabel}>
              Search destination
            </AppText>
          </Pressable>


          <View style={styles.shortcuts}>
            {HOME_SHORTCUTS.map((shortcut) => (
              <Pressable
                key={shortcut.id}
                onPress={() => openShortcut(shortcut)}
                accessibilityRole="button"
                accessibilityLabel={`${shortcut.label}, ${shortcut.subtitle}`}
                style={({ pressed }) => [
                  styles.shortcut,
                  { backgroundColor: isDark ? shortcut.backgroundDark : shortcut.background },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.shortcutIcon,
                    shortcut.badgeColor ? { backgroundColor: shortcut.badgeColor } : null,
                  ]}
                >
                  <Icon
                    name={shortcut.icon}
                    size={shortcut.badgeColor ? 15 : 24}
                    color={shortcut.tint}
                    strokeWidth={shortcut.badgeColor ? 2.1 : 1.9}
                  />
                </View>
                <AppText variant="subtitle" style={styles.shortcutLabel}>
                  {shortcut.label}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.textSecondary}
                  align="center"
                  numberOfLines={2}
                  style={styles.shortcutSubtitle}
                >
                  {shortcut.subtitle}
                </AppText>
              </Pressable>
            ))}
          </View>


          <View style={styles.sectionRow}>
            <AppText variant="h3" style={styles.sectionTitle}>
              Recent Rides
            </AppText>
            <Pressable
              onPress={() => router.push('/ride-history' as never)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="See all recent rides"
              style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
            >
              <AppText variant="link" color={colors.primary} style={styles.seeAllText}>
                See all
              </AppText>
              <Icon name="chevron-right" size={15} color={colors.primary} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={styles.rideList}>
            {HOME_RECENT_RIDES.map((ride) => (
              <Pressable
                key={ride.id}
                onPress={() => openRecentRide(ride)}
                accessibilityRole="button"
                accessibilityLabel={`${ride.destination}, ${ride.address}, ${ride.dateLabel}, $${ride.fare.toFixed(2)}. Book again`}
                style={({ pressed }) => [styles.rideCard, pressed && styles.rideCardPressed]}
              >
                <View style={styles.rideIndicators}>
                  <View style={[styles.rideDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.rideConnector} />
                  <View style={[styles.rideDot, { backgroundColor: colors.red }]} />
                </View>
                <View style={styles.rideBody}>
                  <AppText variant="subtitle" numberOfLines={1}>
                    {ride.destination}
                  </AppText>
                  <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={1}>
                    {ride.address}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {ride.dateLabel}
                  </AppText>
                </View>
                <AppText variant="subtitle" weight="bold" style={styles.rideFare}>
                  ${ride.fare.toFixed(2)}
                </AppText>
                <Icon name="chevron-right" size={18} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
        </FadeIn>
      </Animated.View>


      <Modal visible={sheet !== null} transparent animationType="fade" onRequestClose={closeSheet}>
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeSheet}
            accessibilityLabel="Close menu"
          />
          <Animated.View
            style={[
              styles.menuSheet,
              {
                paddingBottom: Math.max(insets.bottom, 12) + 2,
                opacity: menuAnim,
                transform: [
                  {
                    translateY: menuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [46, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {sheet === 'settings' ? (
              <SettingsSheet onClose={closeSheet} onRideHistory={() => go('/ride-history')} />
            ) : (
              <>
            <View style={styles.menuHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.profile}>
                <View style={styles.profileBadge}>
                  <Icon name="user" size={20} color={colors.primary} strokeWidth={1.8} />
                </View>
                <View>
                  <AppText variant="subtitle">
                    {passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Alex Passenger'}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {passenger?.email ?? 'alex@kaahiye.demo'}
                  </AppText>
                </View>
              </View>
              <Pressable onPress={closeSheet} hitSlop={10} accessibilityLabel="Close">
                <Icon name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>


            <View style={styles.sheetLinks}>
              <SheetLink icon="clock" label="Ride History" onPress={() => go('/ride-history')} />
              <SheetLink
                icon="map-pin"
                label="Saved Places"
                onPress={() => {
                  closeSheet();
                  Alert.alert(
                    'Saved Places',
                    'Home, Work, Fargo Mall, Hector Airport and City Center are saved in this demo.',
                  );
                }}
              />
              <SheetLink
                icon="sparkle"
                label="Screen Previews"
                onPress={() => go('/dev-panel')}
              />
              <SheetLink
                icon="info"
                label="About Kaahiye"
                onPress={() => {
                  closeSheet();
                  Alert.alert('Kaahiye', 'Your Ride, Anywhere. A local UI demo for Fargo, ND.');
                }}
              />
              <View style={styles.sheetDivider} />
              <SheetLink
                icon="logout"
                label="Sign Out"
                color={colors.red}
                onPress={() => {
                  closeSheet();
                  signOut();
                  router.replace('/sign-in');
                }}
              />
            </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

/**
 * Settings sheet — profile header, Kaahiye Passenger card, Preferences
 * (Dark Mode), Account, Support and a soft pink Sign Out button.
 * Scrolls smoothly inside the rounded sheet and follows the active theme.
 */
function SettingsSheet({
  onClose,
  onRideHistory,
}: {
  onClose: () => void;
  onRideHistory: () => void;
}) {
  const { colors, shadows, isDark, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const { height } = useWindowDimensions();
  const passenger = useAuthStore((state) => state.passenger);
  const signOut = useAuthStore((state) => state.signOut);

  const name = passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Alex Passenger';
  const email = passenger?.email ?? 'alex@kaahiye.demo';
  const phone = passenger?.phone ?? '+1 (701) 555-0123';

  const handleSignOut = () => {
    onClose();
    signOut();
    router.replace('/sign-in');
  };

  return (
    <>
      <View style={styles.menuHandle} />

      <ScrollView
        style={[styles.settingsScroll, { maxHeight: height * 0.78 }]}
        contentContainerStyle={styles.settingsContent}
        showsVerticalScrollIndicator={false}
        bounces
        decelerationRate="normal"
      >
        <Pressable
          onPress={() =>
            Alert.alert('Edit profile', 'Editing your passenger profile is mocked in this demo.')
          }
          accessibilityRole="button"
          accessibilityLabel={`Edit profile for ${name}`}
          style={({ pressed }) => [styles.profileRow, pressed && styles.rowPressed]}
        >
          <View style={styles.avatarWrap}>
            <DriverAvatar size={68} ringColor="transparent" />
            <View style={styles.editBadge}>
              <Icon name="pencil" size={12} color={colors.white} strokeWidth={2.2} />
            </View>
          </View>

          <View style={styles.profileText}>
            <AppText variant="h2" numberOfLines={1} style={styles.profileName}>
              {name}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {email}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {phone}
            </AppText>
          </View>

          <Icon name="chevron-right" size={20} color={colors.textFaint} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert(
              'Kaahiye Passenger',
              'Your passenger account is active. Manage your preferences below.',
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Kaahiye Passenger account"
          style={({ pressed }) => [styles.accountCard, pressed && styles.rowPressed]}
        >
          <View style={styles.accountIcon}>
            <Icon name="crown" size={22} color={colors.white} strokeWidth={1.7} />
          </View>
          <View style={styles.accountText}>
            <AppText variant="h3" style={styles.accountTitle}>
              Kaahiye Passenger
            </AppText>
            <AppText
              variant="bodySmall"
              color={colors.textSecondary}
              numberOfLines={1}
              style={styles.accountSubtitle}
            >
              Manage your account and preferences
            </AppText>
          </View>
          <Icon name="chevron-right" size={19} color={colors.primaryDeep} strokeWidth={2} />
        </Pressable>

        <AppText variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          PREFERENCES
        </AppText>
        <View style={styles.card}>
          <View style={styles.preferenceRow}>
            <View style={styles.rowIcon}>
              <Icon name="moon" size={18} color={colors.primary} strokeWidth={1.9} />
            </View>
            <View style={styles.rowText}>
              <AppText variant="title">Dark Mode</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Use dark theme
              </AppText>
            </View>
            <ThemeToggle
              value={isDark}
              onChange={(next) => setMode(next ? 'dark' : 'light')}
              accessibilityLabel="Dark mode"
            />
          </View>
        </View>

        <AppText variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          ACCOUNT
        </AppText>
        <View style={styles.card}>
          <SettingsRow icon="clock" label="Ride History" onPress={onRideHistory} />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="map-pin"
            label="Saved Places"
            onPress={() =>
              Alert.alert(
                'Saved Places',
                'Home, Work, Fargo Mall, Hector Airport and City Center are saved in this demo.',
              )
            }
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="credit-card"
            label="Payment Methods"
            onPress={() =>
              Alert.alert('Payment Methods', 'Cash and Visa •••• 4242 are saved in this demo.')
            }
          />
        </View>

        <AppText variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          SUPPORT
        </AppText>
        <View style={styles.card}>
          <SettingsRow
            icon="help"
            label="Help & Support"
            onPress={() =>
              Alert.alert('Help & Support', 'Kaahiye support is available 24/7 in this demo.', [
                { text: 'Close', style: 'cancel' },
                { text: 'Call support' },
              ])
            }
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="info"
            label="About Kaahiye"
            onPress={() =>
              Alert.alert('Kaahiye', 'Your Ride, Anywhere. A local UI demo for Fargo, ND.')
            }
          />
        </View>

        <Pressable
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          style={({ pressed }) => [styles.signOut, pressed && styles.rowPressed]}
        >
          <Icon name="logout" size={19} color={colors.red} strokeWidth={2} />
          <AppText variant="button" weight="bold" color={colors.red}>
            Sign Out
          </AppText>
        </Pressable>
      </ScrollView>
    </>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.settingsRow, pressed && styles.rowPressed]}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon} size={18} color={colors.primary} strokeWidth={1.9} />
      </View>
      <AppText variant="title" style={styles.rowLabel}>
        {label}
      </AppText>
      <Icon name="chevron-right" size={19} color={colors.textFaint} strokeWidth={2} />
    </Pressable>
  );
}


function SheetLink({
  icon,
  label,
  onPress,
  color,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const tone = color ?? colors.navy;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.sheetLink, pressed && styles.rowPressed]}
    >
      <View style={styles.sheetIcon}>
        <Icon name={icon} size={18} color={tone} strokeWidth={1.8} />
      </View>
      <AppText variant="subtitle" color={tone} style={styles.sheetLabel}>
        {label}
      </AppText>
      <Icon name="chevron-right" size={17} color={colors.textFaint} />
    </Pressable>
  );
}


const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mapBase,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerSide: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  brandName: {
    fontSize: 21,
    letterSpacing: -0.6,
    color: colors.navy,
  },
  bellDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.red,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    zIndex: 9,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...shadows.bottomSheet,
  },
  dragZone: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  title: {
    marginTop: 2,
    marginBottom: 12,
    letterSpacing: -0.7,
  },
  searchBar: {
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchLabel: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  shortcut: {
    flex: 1,
    minWidth: 0,
    minHeight: 94,
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  shortcutIcon: {
    height: 28,
    width: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  shortcutLabel: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  shortcutSubtitle: {
    fontSize: 10,
    lineHeight: 13,
    marginTop: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    letterSpacing: -0.3,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
  },
  rideList: {
    gap: 12,
  },
  rideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rideCardPressed: {
    opacity: 0.85,
  },
  rideIndicators: {
    width: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rideConnector: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.border,
    marginVertical: 3,
  },
  rideBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rideFare: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  rowPressed: {
    opacity: 0.65,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(16,24,40,0.32)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...shadows.bottomSheet,
  },
  menuHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  profileBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetLinks: {
    paddingTop: 2,
  },
  settingsScroll: {
    flexGrow: 0,
  },
  settingsContent: {
    paddingBottom: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 2,
    paddingBottom: 2,
  },
  avatarWrap: {
    width: 68,
    height: 68,
  },
  editBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
    gap: 1,
  },
  profileName: {
    fontSize: 22,
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: {
    flex: 1,
    gap: 2,
  },
  accountTitle: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  accountSubtitle: {
    fontSize: 12.5,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.4,
    marginTop: 12,
    marginBottom: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 12,
    paddingVertical: 0,
    ...shadows.card,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rowLabel: {
    flex: 1,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSoft,
    marginLeft: 50,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.redSoft,
    marginTop: 14,
  },
  sheetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  sheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetLabel: {
    flex: 1,
    fontSize: 15,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSoft,
    marginVertical: 4,
  },
  });

