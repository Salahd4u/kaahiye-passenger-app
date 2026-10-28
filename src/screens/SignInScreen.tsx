import React, { useState, useMemo } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { CTAButton } from '@/components/ui/CTAButton';
import { Input } from '@/components/Input';
import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { useAuthStore } from '@/store/authStore';
import { useTheme, type ThemeColors } from '@/theme';

export default function SignInScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const enterApp = () => router.replace('/location-permission');

  const handleSignIn = async () => {
    Keyboard.dismiss();
    if (!identifier.trim()) {
      setError('Enter your email or phone number.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn({ email: identifier.trim(), password });
      enterApp();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setAppleLoading(true);
    try {
      await signIn({ email: 'alex@kaahiye.demo', password: 'apple-demo' });
      enterApp();
    } finally {
      setAppleLoading(false);
    }
  };

  const handleForgot = () => {
    Alert.alert(
      'Reset Password',
      'A password reset link would be sent to your email. This demo does not connect to a backend.',
      [{ text: 'OK' }],
    );
  };

  return (
    <AuthScaffold
      title="Welcome Back"
      subtitle="Sign in to your account and get moving."
      footer={
        <Pressable
          onPress={() => router.push('/sign-up')}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="Create a new account"
          style={styles.footerLink}
        >
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Don&apos;t have an account?{' '}
          </AppText>
          <AppText variant="bodySmall" color={colors.primary} weight="semibold">
            Sign Up
          </AppText>
        </Pressable>
      }
    >
      <View style={styles.form}>
        <Input
          icon="user"
          placeholder="Email or Phone"
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          compact
        />
        <Input
          icon="lock"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
          compact
        />
      </View>

      <View style={styles.optionsRow}>
        <Pressable
          onPress={() => setRemember((value) => !value)}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
          accessibilityLabel="Remember me"
          style={styles.remember}
        >
          <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
            {remember ? <Icon name="check" size={12} color={colors.white} strokeWidth={3} /> : null}
          </View>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Remember Me
          </AppText>
        </Pressable>

        <Pressable onPress={handleForgot} hitSlop={8} accessibilityRole="link">
          <AppText variant="bodySmall" color={colors.primary} weight="semibold">
            Forgot Password?
          </AppText>
        </Pressable>
      </View>

      {error ? (
        <AppText variant="bodySmall" color={colors.error} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <View style={styles.ctaStack}>
        <CTAButton
          title="Sign In"
          icon="arrow-right"
          iconPosition="right"
          onPress={handleSignIn}
          loading={loading}
          disabled={loading || appleLoading}
          accessibilityLabel="Sign in"
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <AppText variant="caption" color={colors.textMuted}>
            or
          </AppText>
          <View style={styles.dividerLine} />
        </View>

        <CTAButton
          variant="outline"
          title="Continue with Apple"
          icon="apple"
          onPress={handleApple}
          loading={appleLoading}
          disabled={loading || appleLoading}
          accessibilityLabel="Continue with Apple"
        />
      </View>
    </AuthScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  form: {
    gap: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  error: {
    marginTop: 8,
  },
  ctaStack: {
    // Vertical rhythm only — width, horizontal margins and radius are owned by
    // the shared CTA_STYLE inside Button, so both CTAs stay pixel-identical.
    width: '100%',
    marginTop: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  });

