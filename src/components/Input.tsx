import React, { useState, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { AppText } from './ui/AppText';
import { Icon, type IconName } from './ui/Icon';
import { useTheme, type ThemeColors } from '@/theme';

type InputProps = Omit<TextInputProps, 'onChangeText' | 'style'> & {
  label?: string;
  icon?: IconName;
  error?: string;
  /** Shorter field used on dense screens (auth forms). */
  compact?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * Rounded white form field with a thin outline, leading icon and an
 * integrated password visibility toggle.
 */
export function Input({
  label,
  icon,
  error,
  compact,
  value,
  onChangeText,
  containerStyle,
  inputStyle,
  secureTextEntry,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" color={colors.navySoft} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          compact && styles.fieldCompact,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          Boolean(error) && styles.fieldError,
        ]}
      >
        {icon ? (
          <Icon
            name={icon}
            size={19}
            color={focused ? colors.primary : colors.textMuted}
            strokeWidth={1.7}
            style={styles.leadingIcon}
          />
        ) : null}
        <TextInput
          {...rest}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? hidden : false}
          multiline={multiline}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((current) => !current)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={styles.trailing}
          >
            <Icon
              name={hidden ? 'eye' : 'eye-off'}
              size={19}
              color={colors.textMuted}
              strokeWidth={1.7}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.error} style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 7,
    marginLeft: 2,
  },
  field: {
    minHeight: 58,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  fieldCompact: {
    height: 50,
    minHeight: 50,
  },
  fieldMultiline: {
    height: 96,
    minHeight: 96,
    alignItems: 'flex-start',
    paddingTop: 13,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  fieldError: {
    borderColor: colors.error,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  inputMultiline: {
    height: 68,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  trailing: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  error: {
    marginTop: 6,
    marginLeft: 2,
  },
  });

export default Input;
