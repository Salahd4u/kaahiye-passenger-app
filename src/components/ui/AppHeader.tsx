import React, { type ReactNode, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { useTheme, type ThemeColors } from '@/theme';

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  variant?: 'page' | 'auth';
  style?: StyleProp<ViewStyle>;
};

/**
 * Centered screen header with a thin back arrow. Used by auth, search,
 * history and rating screens.
 */
export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
  variant = 'page',
  style,
}: AppHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (variant === 'auth') {
    return (
      <View style={[styles.authWrap, style]}>
        <IconButton
          icon="arrow-left"
          variant="ghost"
          size="sm"
          onPress={handleBack}
          accessibilityLabel="Go back"
        />
        {title ? (
          <AppText variant="h2" align="center" style={styles.authTitle}>
            {title}
          </AppText>
        ) : null}
        {subtitle ? (
          <AppText variant="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.pageHeader, style]}>
      <IconButton
        icon="arrow-left"
        variant="ghost"
        size="sm"
        onPress={handleBack}
        accessibilityLabel="Go back"
      />
      <View pointerEvents="none" style={styles.centeredTitle}>
        {title ? (
          <AppText variant="title" align="center" numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  authWrap: {
    paddingTop: 4,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  authTitle: {
    marginTop: 64,
  },
  subtitle: {
    marginTop: 5,
    paddingHorizontal: 12,
  },
  pageHeader: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  centeredTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    alignItems: 'center',
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  });

export default AppHeader;
