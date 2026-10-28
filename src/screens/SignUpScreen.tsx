import React, { useState, useMemo } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { CTAButton } from '@/components/ui/CTAButton';
import { Input } from '@/components/Input';
import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { useAuthStore } from '@/store/authStore';
import { useTheme, type ThemeColors } from '@/theme';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    Keyboard.dismiss();
    const name = fullName.trim();
    if (name.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Enter a valid email address.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 7) {
      setError('Enter a valid phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const parts = name.split(/\s+/);
      await signUp({
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || 'Passenger',
        email: email.trim(),
        password,
      });
      router.replace('/location-permission');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Create Account"
      subtitle="Join Kaahiye to start riding."
      footer={
        <Pressable
          onPress={() => router.push('/sign-in')}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="Go to sign in"
          style={styles.footerLink}
        >
          <AppText variant="bodySmall" color={colors.textSecondary}>
            Already have an account?{' '}
          </AppText>
          <AppText variant="bodySmall" color={colors.primary} weight="semibold">
            Sign In
          </AppText>
        </Pressable>
      }
    >
      <View style={styles.form}>
        <Input
          icon="user"
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          compact
        />
        <Input
          icon="mail"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          compact
        />
        <Input
          icon="phone"
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
          compact
        />
        <Input
          icon="lock"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          compact
          onSubmitEditing={handleSignUp}
        />
      </View>

      <Pressable
        onPress={() => setAgreed((value) => !value)}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        accessibilityLabel="Agree to the Terms and Privacy Policy"
        style={styles.terms}
      >
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed ? <Icon name="check" size={12} color={colors.white} strokeWidth={3} /> : null}
        </View>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.termsText}>
          I agree to the <AppText variant="bodySmall" color={colors.primary} weight="semibold">Terms</AppText> and{' '}
          <AppText variant="bodySmall" color={colors.primary} weight="semibold">Privacy Policy</AppText>
        </AppText>
      </Pressable>

      {error ? (
        <AppText variant="bodySmall" color={colors.error} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <CTAButton
        title="Sign Up"
        icon="arrow-right"
        iconPosition="right"
        onPress={handleSignUp}
        loading={loading}
        disabled={loading}
        accessibilityLabel="Create account"
        style={styles.ctaSpacing}
      />
    </AuthScaffold>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  form: {
    gap: 10,
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingVertical: 4,
  },
  termsText: {
    flex: 1,
    lineHeight: 18,
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
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  error: {
    marginTop: 8,
  },
  ctaSpacing: {
    // Vertical spacing only; width, horizontal margins and radius come from the
    // shared CTA_STYLE inside Button.
    marginTop: 12,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  });

