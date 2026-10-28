import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { DriverAvatar } from '@/components/brand/DriverAvatar';
import { useChatStore, CHAT_DATE_LABEL, type ChatMessage } from '@/store/chatStore';
import { MOCK_DRIVERS } from '@/mock/drivers';
import { useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

const DRIVER = MOCK_DRIVERS[0];

export default function DriverMessagingScreen() {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const messages = useChatStore((state) => state.messages);
  const typing = useChatStore((state) => state.typing);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      120,
    );
    return () => clearTimeout(timer);
  }, [messages.length, typing]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/select-location');
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    sendMessage(text);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <IconButton
          icon="arrow-left"
          variant="ghost"
          size="sm"
          onPress={handleBack}
          accessibilityLabel="Go back"
        />

        <View style={styles.avatarWrap}>
          <DriverAvatar size={42} ringColor={colors.white} />
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerText}>
          <AppText variant="title">{DRIVER.name}</AppText>
          <View style={styles.subtitleRow}>
            <View style={styles.subtitleDot} />
            <AppText variant="caption" color={colors.textSecondary}>
              Your Driver
            </AppText>
          </View>
        </View>

        <IconButton
          icon="phone"
          variant="muted"
          onPress={() => Alert.alert('Call driver', `${DRIVER.name} · demo phone call`)}
          accessibilityLabel="Call driver"
        />
      </View>
      <View style={styles.divider} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.conversation}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View style={styles.dateSeparator}>
            <AppText variant="caption" color={colors.textSecondary}>
              {CHAT_DATE_LABEL}
            </AppText>
          </View>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {typing ? <TypingIndicator /> : null}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
          <View style={styles.inputPill}>
            <IconButton
              icon="paperclip"
              variant="ghost"
              size="sm"
              iconSize={18}
              onPress={() => Alert.alert('Attachment', 'Attachments are disabled in this demo.')}
              accessibilityLabel="Add attachment"
            />

            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={styles.input}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>

          <IconButton
            icon="send"
            variant="primary"
            size="lg"
            iconSize={19}
            onPress={handleSend}
            accessibilityLabel="Send message"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const mine = message.sender === 'passenger';

  if (mine) {
    return (
      <View style={styles.myRow}>
        <View style={styles.myBubble}>
          <AppText variant="body" color={colors.white}>
            {message.text}
          </AppText>
        </View>
        <View style={styles.myMeta}>
          <AppText variant="micro" color={colors.textMuted}>
            {message.timeLabel}
          </AppText>
          <View style={styles.receipt}>
            <Icon name="check" size={12} color={colors.primary} strokeWidth={2.6} />
            <Icon
              name="check"
              size={12}
              color={colors.primary}
              strokeWidth={2.6}
              style={styles.receiptSecond}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.driverRow}>
      <DriverAvatar size={30} ringColor={colors.white} />
      <View style={styles.driverColumn}>
        <View style={styles.driverBubble}>
          <AppText variant="body">{message.text}</AppText>
        </View>
        <AppText variant="micro" color={colors.textMuted} style={styles.driverTime}>
          {message.timeLabel}
        </AppText>
      </View>
    </View>
  );
}

function TypingIndicator() {
  const { colors, shadows, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [dots] = useState(() => [
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]);

  useEffect(() => {
    if (reducedMotion) {
      dots.forEach((value) => value.setValue(0.75));
      return undefined;
    }
    const animations = dots.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 180),
          Animated.timing(value, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.35, duration: 320, useNativeDriver: true }),
          Animated.delay(360 - index * 120),
        ]),
      ),
    );
    const group = Animated.parallel(animations);
    group.start();
    return () => animations.forEach((animation) => animation.stop());
  }, [dots, reducedMotion]);

  return (
    <View style={styles.driverRow}>
      <DriverAvatar size={30} ringColor={colors.white} />
      <View style={styles.driverColumn}>
        <View style={styles.typingBubble}>
          {dots.map((value, index) => (
            <Animated.View key={`dot-${index}`} style={[styles.typingDot, { opacity: value }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.surface,
  },
  back: {
    width: 34,
    height: 34,
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  subtitleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  phoneButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  conversation: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 12,
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '86%',
  },
  driverColumn: {
    flexShrink: 1,
    gap: 4,
  },
  driverBubble: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    borderTopLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  driverTime: {
    marginLeft: 4,
  },
  myRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderTopRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '86%',
  },
  myMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  receipt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptSecond: {
    marginLeft: -6,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    borderTopLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    maxHeight: 110,
    borderRadius: 23,
    backgroundColor: colors.surfaceMuted,
    paddingLeft: 4,
    paddingRight: 12,
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  });

