import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { CTAButton } from '@/components/ui/CTAButton';
import { Icon } from '@/components/ui/Icon';
import { DriverAvatar } from '@/components/brand/DriverAvatar';
import { mockService } from '@/services/mockService';
import type { Driver, Rating, Ride } from '@/types';
import { fonts, useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

const MAX_COMMENT_LENGTH = 200;
const DEFAULT_SCORE = 5;
const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export type DriverRatingSheetProps = {
  visible: boolean;
  driver: Driver;
  /** Completed ride being rated — ratings are keyed by ride id. */
  ride: Ride | null;
  /** Rating already stored for this ride; blocks a second submission. */
  submittedRating: Rating | null;
  onClose: () => void;
  onSubmitted: (rating: Rating) => void;
};

/**
 * Bottom-sheet driver rating, shown over the Trip Completed screen.
 *
 * Replaces the former standalone Rate Your Driver screen: the submission goes
 * through the same `mockService.createRating` payload and the same optional
 * comment handling. Only one rating per ride is ever persisted — the sheet is
 * guarded both locally (in-flight ref) and against storage.
 */
export function DriverRatingSheet({
  visible,
  driver,
  ride,
  submittedRating,
  onClose,
  onSubmitted,
}: DriverRatingSheetProps) {
  const { colors, shadows, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const insets = useSafeAreaInsets();
  const [score, setScore] = useState(DEFAULT_SCORE);
  const [comment, setComment] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anim] = useState(() => new Animated.Value(0));
  const inFlight = useRef(false);
  const alreadyRated = Boolean(submittedRating);

  /** Fresh draft every time the sheet is dismissed. */
  const resetDraft = () => {
    setScore(DEFAULT_SCORE);
    setComment('');
    setFocused(false);
    setError(null);
    setSubmitting(false);
    inFlight.current = false;
  };

  /** Entrance spring run whenever the sheet becomes visible. */
  useEffect(() => {
    if (!visible) return;
    if (reducedMotion) {
      anim.setValue(1);
      return;
    }
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      speed: 16,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [anim, reducedMotion, visible]);

  const close = () => {
    if (submitting) return;
    Keyboard.dismiss();
    resetDraft();
    anim.setValue(0);
    onClose();
  };

  const submit = async () => {
    if (submitting || inFlight.current || alreadyRated) return;
    inFlight.current = true;
    Keyboard.dismiss();
    setSubmitting(true);
    setError(null);

    try {
      let rating: Rating;

      if (ride) {
        // Never post a second rating for the same ride.
        const existing = (await mockService.getRatings()).find((item) => item.rideId === ride.id);
        if (existing) {
          resetDraft();
          onSubmitted(existing);
          return;
        }
        rating = await mockService.createRating({
          rideId: ride.id,
          driverId: driver.id,
          passengerId: ride.passengerId,
          score,
          comment: comment.trim() || undefined,
        });
      } else {
        // Dev-panel preview with no live ride: keep the sheet functional locally.
        rating = {
          id: `rating_${Date.now()}`,
          rideId: 'ride_preview',
          driverId: driver.id,
          passengerId: 'psg_001',
          score,
          comment: comment.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 320));
      resetDraft();
      onSubmitted(rating);
    } catch {
      setError('We could not submit your rating. Please try again.');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close rating"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 4,
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [56, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.handle} />

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <AppText variant="h2">Rate Your Driver</AppText>
              <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
                How was your ride with {driver.name.split(' ')[0]}?
              </AppText>

              <View style={styles.driverRow}>
                <DriverAvatar size={54} ringColor="transparent" />
                <View style={styles.driverInfo}>
                  <AppText variant="h3" numberOfLines={1}>
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
              </View>

              <View style={styles.stars}>
                {STAR_VALUES.map((value) => {
                  const active = value <= score;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setScore(value)}
                      hitSlop={6}
                      disabled={alreadyRated}
                      accessibilityRole="button"
                      accessibilityLabel={`Rate ${value} star${value > 1 ? 's' : ''}`}
                      accessibilityState={{ selected: value === score, disabled: alreadyRated }}
                      style={({ pressed }) => [styles.starButton, pressed && styles.starPressed]}
                    >
                      <Icon
                        name="star"
                        size={36}
                        color={active ? colors.yellow : colors.border}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.commentField, focused && styles.commentFieldFocused]}>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Tell us about your ride (optional)"
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.primary}
                  multiline
                  maxLength={MAX_COMMENT_LENGTH}
                  textAlignVertical="top"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  accessibilityLabel="Rating comment"
                  style={styles.commentInput}
                />
                <AppText variant="caption" color={colors.textMuted} style={styles.counter}>
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </AppText>
              </View>

              {error ? (
                <AppText variant="caption" color={colors.error} style={styles.error}>
                  {error}
                </AppText>
              ) : null}

              <View style={styles.submitWrap}>
                <CTAButton
                  title="Submit Rating"
                  onPress={submit}
                  loading={submitting}
                  disabled={submitting || alreadyRated}
                  accessibilityLabel="Submit rating"
                />
              </View>

              <Pressable
                onPress={close}
                hitSlop={8}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Not now"
                style={({ pressed }) => [styles.notNow, pressed && styles.pressed]}
              >
                <AppText variant="subtitle" weight="semibold" color={colors.primary}>
                  Not now
                </AppText>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    modalRoot: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    keyboardWrap: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '100%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingTop: 10,
      ...shadows.sheet,
    },
    handle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 14,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 4,
    },
    subtitle: {
      marginTop: 4,
    },
    driverRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 18,
    },
    driverInfo: {
      flex: 1,
      gap: 2,
    },
    driverRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    stars: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 18,
    },
    starButton: {
      padding: 1,
    },
    starPressed: {
      transform: [{ scale: 0.92 }],
    },
    commentField: {
      marginTop: 18,
      minHeight: 106,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 8,
    },
    commentFieldFocused: {
      borderColor: colors.primary,
    },
    commentInput: {
      minHeight: 62,
      padding: 0,
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textPrimary,
    },
    counter: {
      alignSelf: 'flex-end',
      marginTop: 2,
    },
    error: {
      marginTop: 10,
    },
    submitWrap: {
      marginTop: 20,
    },
    notNow: {
      alignSelf: 'center',
      marginTop: 14,
      paddingVertical: 6,
      paddingHorizontal: 20,
    },
    pressed: {
      opacity: 0.6,
    },
  });

export default DriverRatingSheet;
