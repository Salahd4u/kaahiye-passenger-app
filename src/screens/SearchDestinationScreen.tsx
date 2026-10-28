import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { GradientFill } from '@/components/ui/GradientFill';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { MockMap } from '@/components/map/MockMap';
import { useRideStore } from '@/store/rideStore';
import { MOCK_DESTINATIONS } from '@/mock/destinations';
import { layout, useTheme, type ThemeColors, type ThemeShadows } from '@/theme';
import type { Address } from '@/types';

const ICON_BY_ID: Record<string, IconName> = {
  addr_1: 'home',
  addr_2: 'briefcase',
  addr_3: 'shopping-bag',
  addr_4: 'plane',
  addr_5: 'building',
};

/** Decorative route drawn in the header illustration. */
const MAP_PICKUP = { x: 0.2, y: 0.8 };
const MAP_DESTINATION = { x: 0.84, y: 0.18 };

export default function SearchDestinationScreen() {
  const { colors, shadows, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const pickupMode = params.mode === 'pickup';
  const setDestination = useRideStore((state) => state.setDestination);
  const setPickup = useRideStore((state) => state.setPickup);
  const [query, setQuery] = useState('');
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 720;
  const inputRef = useRef<TextInputInstance>(null);
  const listRef = useRef<ScrollViewInstance>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return MOCK_DESTINATIONS;
    return MOCK_DESTINATIONS.filter((address) =>
      [address.label, address.title, address.subtitle]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(needle)),
    );
  }, [query]);

  /** Colourful icon tiles — same palette language in light and dark mode. */
  const tiles = useMemo(
    () => ({
      addr_1: { bg: colors.primaryLight, fg: colors.primary },
      addr_2: { bg: colors.blueSoft, fg: colors.blue },
      addr_3: {
        bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FFF3E2',
        fg: isDark ? colors.warning : '#F79009',
      },
      addr_4: {
        bg: isDark ? 'rgba(124, 92, 252, 0.2)' : '#F1EDFF',
        fg: isDark ? '#A78BFA' : '#7C5CFC',
      },
      addr_5: { bg: colors.redSoft, fg: colors.red },
    }),
    [colors, isDark],
  );

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/select-location');
  };

  const handleSelect = (address: Address) => {
    Keyboard.dismiss();
    if (pickupMode) {
      setPickup(address);
      goBack();
      return;
    }
    setDestination(address);
    router.push('/fare-estimate');
  };

  /** Keyboard "search" key + the green send button both finish the search. */
  const handleSubmit = () => {
    if (!query.trim()) {
      inputRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
  };

  const showAll = () => {
    Keyboard.dismiss();
    setQuery('');
    listRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[styles.mapBackdrop, compact && styles.mapBackdropCompact]}
        pointerEvents="none"
      >
        <MockMap
          pickup={MAP_PICKUP}
          destination={MAP_DESTINATION}
          showRoute
          showPickup
          showDestination
          routeColor={colors.primary}
          style={StyleSheet.absoluteFill}
          label="Destination map illustration"
        />
        <View style={[StyleSheet.absoluteFill, styles.mapWash]} />
        <View style={styles.mapFadeLeft}>
          <GradientFill from={colors.surface} to={`${colors.surface}00`} direction="horizontal" />
        </View>
        <View style={styles.mapFadeBottom}>
          <GradientFill from={`${colors.surface}00`} to={colors.surface} direction="vertical" />
        </View>
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            variant="white"
            onPress={goBack}
            accessibilityLabel="Go back"
          />

          <View style={[styles.headingBlock, compact && styles.headingBlockCompact]}>
            <AppText style={[styles.heading, compact && styles.headingCompact]}>
              {pickupMode ? 'Where are you starting?' : 'Where are you going?'}
            </AppText>
            <AppText
              style={[styles.subheading, compact && styles.subheadingCompact]}
              color={colors.textSecondary}
            >
              {pickupMode
                ? 'Choose a saved place or search for your pickup.'
                : 'Choose a saved place or search for a destination.'}
            </AppText>
          </View>

          <View style={[styles.searchCard, compact && styles.searchCardCompact]}>
            <View style={styles.searchField}>
              <Icon name="search" size={18} color={colors.textMuted} strokeWidth={1.9} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder={pickupMode ? 'Search pickup...' : 'Search destination...'}
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
                style={styles.searchInput}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSubmit}
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Icon name="close" size={16} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={handleSubmit}
              accessibilityRole="button"
              accessibilityLabel="Search destinations"
              style={({ pressed }) => [
                styles.searchSend,
                compact && styles.searchSendCompact,
                pressed && styles.pressed,
              ]}
            >
              <Icon name="send" size={compact ? 17 : 18} color={colors.primary} strokeWidth={1.9} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={listRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Saved Places</AppText>
            <Pressable
              onPress={showAll}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Show all saved places"
              style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
            >
              <AppText style={styles.seeAllText} color={colors.primary}>
                See All
              </AppText>
              <Icon name="chevron-right" size={14} color={colors.primary} strokeWidth={2.2} />
            </Pressable>
          </View>

          {filtered.map((address) => {
            const tile = tiles[address.id as keyof typeof tiles] ?? {
              bg: colors.surfaceMuted,
              fg: colors.textSecondary,
            };
            return (
              <Pressable
                key={address.id}
                onPress={() => handleSelect(address)}
                accessibilityRole="button"
                accessibilityLabel={`${address.label}, ${address.title}`}
                style={({ pressed }) => [
                  styles.card,
                  compact && styles.cardCompact,
                  pressed && styles.cardPressed,
                ]}
              >
                <View
                  style={[
                    styles.iconTile,
                    compact && styles.iconTileCompact,
                    { backgroundColor: tile.bg },
                  ]}
                >
                  <Icon
                    name={ICON_BY_ID[address.id] ?? 'map-pin'}
                    size={compact ? 19 : 21}
                    color={tile.fg}
                    strokeWidth={1.9}
                  />
                </View>

                <View style={styles.cardText}>
                  <AppText
                    style={[styles.cardTitle, compact && styles.cardTitleCompact]}
                    numberOfLines={1}
                  >
                    {address.label}
                  </AppText>
                  <AppText style={styles.cardAddress} color={colors.textSecondary} numberOfLines={1}>
                    {address.title}
                  </AppText>
                </View>

                <View style={[styles.chevronCircle, compact && styles.chevronCircleCompact]}>
                  <Icon name="chevron-right" size={15} color={colors.textMuted} strokeWidth={2.1} />
                </View>
              </Pressable>
            );
          })}

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Icon name="search" size={24} color={colors.textMuted} strokeWidth={1.6} />
              </View>
              <AppText variant="subtitle" align="center">
                No destinations found
              </AppText>
              <AppText variant="bodySmall" color={colors.textSecondary} align="center">
                Try a different street, place or airport.
              </AppText>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    safe: {
      flex: 1,
    },
    mapBackdrop: {
      position: 'absolute',
      top: -16,
      right: -16,
      width: '76%',
      height: 280,
      overflow: 'hidden',
    },
    mapBackdropCompact: {
      top: -12,
      height: 250,
    },
    mapWash: {
      backgroundColor: colors.surface,
      opacity: 0.24,
    },
    mapFadeLeft: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '46%',
    },
    mapFadeBottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 96,
    },
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: 4,
    },
    headingBlock: {
      marginTop: 14,
      maxWidth: 236,
    },
    headingBlockCompact: {
      marginTop: 8,
      maxWidth: 220,
    },
    heading: {
      fontSize: 27,
      lineHeight: 32,
      letterSpacing: -0.9,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
    },
    headingCompact: {
      fontSize: 24,
      lineHeight: 29,
    },
    subheading: {
      marginTop: 6,
      maxWidth: 236,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Inter_400Regular',
    },
    subheadingCompact: {
      marginTop: 4,
      maxWidth: 226,
      fontSize: 12.5,
      lineHeight: 17,
    },
    searchCard: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 6,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      ...shadows.card,
    },
    searchCardCompact: {
      marginTop: 12,
      padding: 5,
      borderRadius: 20,
    },
    searchField: {
      flex: 1,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingHorizontal: 12,
      borderRadius: 17,
      backgroundColor: colors.inputBg,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 0,
      fontFamily: 'Inter_400Regular',
      fontSize: 14.5,
      color: colors.textPrimary,
    },
    searchSend: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchSendCompact: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    list: {
      flex: 1,
      marginTop: 4,
    },
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      paddingBottom: 10,
    },
    sectionTitle: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.35,
      fontFamily: 'Inter_700Bold',
      color: colors.navy,
    },
    seeAll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    seeAllText: {
      fontSize: 12.5,
      lineHeight: 17,
      fontFamily: 'Inter_600SemiBold',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      marginBottom: 10,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      ...shadows.card,
    },
    cardCompact: {
      gap: 10,
      paddingHorizontal: 11,
      paddingVertical: 9,
      marginBottom: 8,
      borderRadius: 16,
    },
    cardPressed: {
      opacity: 0.85,
    },
    iconTile: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconTileCompact: {
      width: 42,
      height: 42,
      borderRadius: 21,
    },
    cardText: {
      flex: 1,
      gap: 2,
    },
    cardTitle: {
      fontSize: 14.5,
      lineHeight: 19,
      letterSpacing: -0.2,
      fontFamily: 'Inter_600SemiBold',
      color: colors.textPrimary,
    },
    cardTitleCompact: {
      fontSize: 14,
      lineHeight: 18,
    },
    cardAddress: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'Inter_400Regular',
    },
    chevronCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    chevronCircleCompact: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    empty: {
      alignItems: 'center',
      paddingTop: 56,
      gap: 8,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    pressed: {
      opacity: 0.6,
    },
  });
