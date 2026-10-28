import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'search'
  | 'close'
  | 'menu'
  | 'settings'
  | 'bell'
  | 'moon'
  | 'motorbike'
  | 'layers'
  | 'more'
  | 'pencil'
  | 'crown'
  | 'chevrons-right'
  | 'steering'
  | 'headset'
  | 'navigation'
  | 'map-pin'
  | 'star'
  | 'home'
  | 'home-filled'
  | 'briefcase'
  | 'briefcase-filled'
  | 'shopping-bag'
  | 'plane'
  | 'building'
  | 'user'
  | 'mail'
  | 'phone'
  | 'phone-call'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'message'
  | 'share'
  | 'help'
  | 'car'
  | 'clock'
  | 'calendar'
  | 'route'
  | 'wallet'
  | 'check'
  | 'apple'
  | 'cash'
  | 'logout'
  | 'info'
  | 'shield'
  | 'credit-card'
  | 'sparkle'
  | 'plus'
  | 'minus'
  | 'locate'
  | 'users'
  | 'luggage'
  | 'send'
  | 'paperclip';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** Solid silhouettes (brand + status marks). */
const FILLED_PATHS: Partial<Record<IconName, string>> = {
  star: 'M12 2.3l3.06 6.2 6.84.99-4.95 4.83 1.17 6.82L12 17.93 5.88 21.14l1.17-6.82L2.1 9.49l6.84-.99L12 2.3z',
  'home-filled':
    'M11.2 3.3a1.3 1.3 0 0 1 1.6 0l7.8 6.2c.5.4.6 1.1.2 1.6-.4.5-1.1.6-1.6.2l-.3-.2v6.6a2.3 2.3 0 0 1-2.3 2.3h-2.8v-4.6a1.9 1.9 0 0 0-3.8 0V20H6.9a2.3 2.3 0 0 1-2.3-2.3v-6.6l-.3.2c-.5.4-1.2.3-1.6-.2-.4-.5-.3-1.2.2-1.6l7.8-6.2Z',
  'briefcase-filled':
    'M9.6 3h4.8a2.6 2.6 0 0 1 2.6 2.6V7h2.6A2.4 2.4 0 0 1 22 9.4v8.2a2.4 2.4 0 0 1-2.4 2.4H4.4A2.4 2.4 0 0 1 2 17.6V9.4A2.4 2.4 0 0 1 4.4 7H7V5.6A2.6 2.6 0 0 1 9.6 3Zm.2 4h4.4V5.8a.6.6 0 0 0-.6-.6H10.4a.6.6 0 0 0-.6.6V7Z',
  navigation:
    'M12 2.35l8.8 19.3c.31.69-.4 1.39-1.08 1.07L12 19l-7.72 3.72c-.68.32-1.39-.38-1.08-1.07L12 2.35z',
  plane:
    'M21.2 15.4v-1.9l-8-5V3.3a1.6 1.6 0 0 0-3.2 0v5.2l-8 5v1.9l8-2.4v5.3l-2.1 1.6v1.7l3.7-1 3.7 1v-1.7l-2.1-1.6v-5.3l8 2.4z',
  apple:
    'M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09h.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z',
};

/** Thin outline geometry (Feather/Lucide inspired). */
const OUTLINE_ICONS: Partial<Record<IconName, ReactNode>> = {
  'arrow-left': (
    <>
      <Line x1="19" y1="12" x2="5" y2="12" />
      <Path d="M12 19l-7-7 7-7" />
    </>
  ),
  'arrow-right': (
    <>
      <Line x1="5" y1="12" x2="19" y2="12" />
      <Path d="M12 5l7 7-7 7" />
    </>
  ),
  'chevron-right': <Path d="M9 18l6-6-6-6" />,
  'chevron-down': <Path d="M6 9l6 6 6-6" />,
  'chevron-up': <Path d="M18 15l-6-6-6 6" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M20.5 20.5l-4-4" />
    </>
  ),
  close: (
    <>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  menu: (
    <>
      <Line x1="3.5" y1="7" x2="20.5" y2="7" />
      <Line x1="3.5" y1="12" x2="20.5" y2="12" />
      <Line x1="3.5" y1="17" x2="20.5" y2="17" />
    </>
  ),
  settings: (
    <>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  'map-pin': (
    <>
      <Path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <Circle cx="12" cy="10" r="3" />
    </>
  ),
  bell: (
    <>
      <Path d="M18 8.6c0-3.3-2.7-6-6-6s-6 2.7-6 6c0 6.4-2.6 8.2-2.6 8.2h17.2S18 15 18 8.6Z" />
      <Path d="M13.7 20.7a2 2 0 0 1-3.4 0" />
    </>
  ),
  moon: <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  layers: (
    <>
      <Path d="M12 3 3 7.5l9 4.5 9-4.5L12 3z" />
      <Path d="M3 12.2 12 16.7l9-4.5" />
      <Path d="M3 16.7 12 21.2l9-4.5" />
    </>
  ),
  motorbike: (
    <>
      <Circle cx="5.6" cy="17" r="3.4" />
      <Circle cx="18.4" cy="17" r="3.4" />
      <Path d="M9 17h4.6l-2.3-7.4H8.2" />
      <Path d="M13.6 17 16 9.6h2.4" />
      <Path d="M9.5 6h3.1l1.1 3.6" />
    </>
  ),
  more: (
    <>
      <Line x1="5" y1="12" x2="5.01" y2="12" strokeWidth={3.2} />
      <Line x1="12" y1="12" x2="12.01" y2="12" strokeWidth={3.2} />
      <Line x1="19" y1="12" x2="19.01" y2="12" strokeWidth={3.2} />
    </>
  ),
  pencil: (
    <>
      <Path d="M12 20h9" />
      <Path d="M16.6 3.4a2.1 2.1 0 0 1 3 3L7.5 18.5 3.6 19.6l1.1-3.9L16.6 3.4z" />
    </>
  ),
  crown: (
    <Path d="M3 8.2l4.6 3.6L12 5l4.4 6.8L21 8.2l-1.7 10.1a1.6 1.6 0 0 1-1.6 1.3H6.3a1.6 1.6 0 0 1-1.6-1.3L3 8.2z" />
  ),
  'chevrons-right': <Path d="M5 5l7 7-7 7M12 5l7 7-7 7" />,
  steering: (
    <>
      <Circle cx="12" cy="12" r="8.6" />
      <Circle cx="12" cy="12" r="2.6" />
      <Path d="M12 14.6v6" />
      <Path d="M9.6 11.2 4 9.6" />
      <Path d="M14.4 11.2 20 9.6" />
    </>
  ),
  headset: (
    <>
      <Path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <Rect x="2.4" y="13.4" width="4.6" height="7" rx="2.3" />
      <Rect x="17" y="13.4" width="4.6" height="7" rx="2.3" />
      <Path d="M19.4 20.4a3.2 3.2 0 0 1-3.2 2.8h-2.4" />
    </>
  ),
  home: (
    <>
      <Path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <Path d="M9 22V12h6v10" />
    </>
  ),
  briefcase: (
    <>
      <Rect x="2.5" y="7" width="19" height="14" rx="2" />
      <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  'shopping-bag': (
    <>
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <Line x1="3" y1="6" x2="21" y2="6" />
      <Path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  building: (
    <>
      <Rect x="4" y="3" width="16" height="18" rx="1.5" />
      <Line x1="9" y1="7" x2="9.01" y2="7" />
      <Line x1="15" y1="7" x2="15.01" y2="7" />
      <Line x1="9" y1="11" x2="9.01" y2="11" />
      <Line x1="15" y1="11" x2="15.01" y2="11" />
      <Line x1="9" y1="15" x2="9.01" y2="15" />
      <Line x1="15" y1="15" x2="15.01" y2="15" />
      <Path d="M9 21v-3h6v3" />
    </>
  ),
  user: (
    <>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </>
  ),
  mail: (
    <>
      <Rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <Path d="M3 7l9 6 9-6" />
    </>
  ),
  phone: (
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  lock: (
    <>
      <Rect x="3.5" y="11" width="17" height="10.5" rx="2.5" />
      <Path d="M7.5 11V7a4.5 4.5 0 0 1 9 0v4" />
    </>
  ),
  eye: (
    <>
      <Path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <Line x1="2" y1="2" x2="22" y2="22" />
    </>
  ),
  message: <Path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  share: (
    <>
      <Circle cx="18" cy="5" r="3" />
      <Circle cx="6" cy="12" r="3" />
      <Circle cx="18" cy="19" r="3" />
      <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </>
  ),
  help: (
    <>
      <Circle cx="12" cy="12" r="9.5" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),

  car: (
    <>
      <Path d="M4.5 17h15" />
      <Path d="M3 17v-4l2-5.2A2 2 0 0 1 6.9 6.4h10.2A2 2 0 0 1 19 7.8L21 13v4" />
      <Path d="M5 13h14" />
      <Circle cx="7.2" cy="17" r="1.9" />
      <Circle cx="16.8" cy="17" r="1.9" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9.5" />
      <Path d="M12 6.5V12l3.5 2" />
    </>
  ),
  route: (
    <>
      <Circle cx="5.5" cy="18.5" r="2.5" />
      <Circle cx="18.5" cy="5.5" r="2.5" />
      <Path d="M8 18.5h6.5a4 4 0 0 0 0-8h-5a4 4 0 0 1 0-8H15" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3" y="4.5" width="18" height="17" rx="3" />
      <Line x1="3" y1="9.5" x2="21" y2="9.5" />
      <Line x1="8" y1="2.5" x2="8" y2="6" />
      <Line x1="16" y1="2.5" x2="16" y2="6" />
      <Line x1="7.5" y1="13.5" x2="7.51" y2="13.5" />
      <Line x1="12" y1="13.5" x2="12.01" y2="13.5" />
      <Line x1="16.5" y1="13.5" x2="16.51" y2="13.5" />
      <Line x1="7.5" y1="17.5" x2="7.51" y2="17.5" />
      <Line x1="12" y1="17.5" x2="12.01" y2="17.5" />
    </>
  ),
  wallet: (
    <>
      <Rect x="2.5" y="5.5" width="19" height="14" rx="2.5" />
      <Path d="M2.5 9.5h19" />
      <Path d="M16.5 14.5h.01" />
    </>
  ),
  cash: (
    <>
      <Rect x="2" y="6" width="20" height="12" rx="2.5" />
      <Circle cx="12" cy="12" r="2.6" />
      <Path d="M6 9.5v5M18 9.5v5" />
    </>
  ),
  check: <Path d="M20 6L9 17l-5-5" />,
  logout: (
    <>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="M16 17l5-5-5-5" />
      <Line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  info: (
    <>
      <Circle cx="12" cy="12" r="9.5" />
      <Line x1="12" y1="11" x2="12" y2="16" />
      <Line x1="12" y1="7.5" x2="12.01" y2="7.5" />
    </>
  ),
  shield: <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  'credit-card': (
    <>
      <Rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <Line x1="2.5" y1="10" x2="21.5" y2="10" />
    </>
  ),
  sparkle: (
    <>
      <Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <Path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </>
  ),
  plus: (
    <>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  minus: <Line x1="5" y1="12" x2="19" y2="12" />,
  locate: (
    <>
      <Circle cx="12" cy="12" r="6.5" />
      <Circle cx="12" cy="12" r="2" />
      <Line x1="12" y1="2" x2="12" y2="4.5" />
      <Line x1="12" y1="19.5" x2="12" y2="22" />
      <Line x1="2" y1="12" x2="4.5" y2="12" />
      <Line x1="19.5" y1="12" x2="22" y2="12" />
    </>
  ),
  users: (
    <>
      <Path d="M15.5 20.5v-1.6a3.4 3.4 0 0 0-3.4-3.4H6.4A3.4 3.4 0 0 0 3 18.9v1.6" />
      <Circle cx="9.2" cy="8.4" r="3.4" />
      <Path d="M20.5 20.5v-1.6a3.4 3.4 0 0 0-2.6-3.3" />
      <Path d="M15.6 5.2a3.4 3.4 0 0 1 0 6.4" />
    </>
  ),
  luggage: (
    <>
      <Rect x="4" y="7.5" width="16" height="13" rx="2.5" />
      <Path d="M9 7.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2.5" />
      <Line x1="9.5" y1="11" x2="9.5" y2="17" />
      <Line x1="14.5" y1="11" x2="14.5" y2="17" />
    </>
  ),
  send: (
    <>
      <Path d="M22 2L11 13" />
      <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </>
  ),
  paperclip: (
    <Path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  ),
};

export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 1.8,
  style,
}: IconProps) {
  const { colors } = useTheme();
  const tone = color ?? colors.navy;
  const filledPath = FILLED_PATHS[name];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={tone}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {filledPath ? (
        <Path d={filledPath} fill={tone} stroke="none" />
      ) : (
        OUTLINE_ICONS[name === 'phone-call' ? 'phone' : name] ?? null
      )}
    </Svg>
  );
}

export default Icon;

