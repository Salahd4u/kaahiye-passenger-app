import React, { type ReactNode, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeIn } from '@/components/animation/FadeIn';
import { layout, useTheme, type ThemeColors } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  backgroundColor?: string;
  footer?: ReactNode;
  keyboardAware?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
};

/**
 * Standard page shell: safe areas, consistent 16px horizontal padding and an
 * optional pinned footer. Forms can opt into keyboard avoidance.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  backgroundColor,
  footer,
  keyboardAware = false,
  contentContainerStyle,
  style,
  showsVerticalScrollIndicator = false,
}: ScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const background = backgroundColor ?? colors.background;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        padded && styles.padded,
        styles.scrollContent,
        styles.contentMax,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, styles.contentMax, style]}>
      {children}
    </View>
  );

  const content = (
    <FadeIn style={styles.flex}>
      {body}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </FadeIn>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]} edges={['top', 'left', 'right', 'bottom']}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  contentMax: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  padded: { paddingHorizontal: layout.screenPadding },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.background,
  },
  });

export default Screen;
