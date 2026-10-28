import React from 'react';
import {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

type SedanVariant = 'white' | 'black';

/**
 * Hand-drawn sedan used by the splash/onboarding scenes and the Premium
 * vehicle option. Rendered as bundled SVG artwork — no remote images.
 */
export function SedanArtwork({ variant = 'white' }: { variant?: SedanVariant }) {
  const black = variant === 'black';
  const bodyTop = black ? '#3C424B' : '#FFFFFF';
  const bodyMid = black ? '#2A2F37' : '#FBFCFE';
  const bodyBottom = black ? '#14181D' : '#D9E2EB';
  const bodyStroke = black ? '#0C1014' : '#D6DFE8';
  const lowerShade = black ? '#0F1317' : '#DCE5EE';
  const wheelWell = black ? '#20252B' : '#D5DFE9';
  const glassFrom = black ? '#4C5866' : '#425A70';
  const glassTo = black ? '#232C36' : '#1B2C3D';
  const pillar = black ? '#2C323A' : '#F4F7FA';
  const seam = black ? '#3E454E' : '#C6D2DD';
  const seamSoft = black ? '#343B43' : '#E3EAF1';
  const handle = black ? '#5A636E' : '#B8C5D2';
  const arch = black ? '#39414A' : '#C2CFDB';
  const bumper = black ? '#22272D' : '#E4EBF2';
  const rimFrom = black ? '#6E7885' : '#F1F4F7';
  const rimTo = black ? '#232930' : '#AEBBC8';
  const rimHub = black ? '#171C21' : '#8B99A8';

  return (
    <G>
      <Defs>
        <LinearGradient id={`sedan-body-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={bodyTop} />
          <Stop offset="0.55" stopColor={bodyMid} />
          <Stop offset="1" stopColor={bodyBottom} />
        </LinearGradient>
        <LinearGradient id={`sedan-glass-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={glassFrom} />
          <Stop offset="1" stopColor={glassTo} />
        </LinearGradient>
        <LinearGradient id={`sedan-rim-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={rimFrom} />
          <Stop offset="1" stopColor={rimTo} />
        </LinearGradient>
      </Defs>

      <Ellipse cx="164" cy="136" rx="136" ry="9" fill="#0B1B2B" opacity="0.14" />
      <Ellipse cx="164" cy="136" rx="96" ry="5" fill="#0B1B2B" opacity="0.08" />

      <Path
        d="M24 102 C24 90 32 83 47 80 L82 74 C96 53 114 42 138 40 L186 40 C210 42 228 53 242 73 L281 79 C298 82 305 89 305 99 L303 106 C301 111 294 114 286 114 L43 114 C32 114 24 110 24 102 Z"
        fill={`url(#sedan-body-${variant})`}
        stroke={bodyStroke}
        strokeWidth="1"
      />

      <Path
        d="M30 104 C55 110 270 110 300 103 L300 108 C294 113 286 114 286 114 L43 114 C34 114 30 112 30 108 Z"
        fill={lowerShade}
        opacity="0.7"
      />

      <Circle cx="92" cy="115" r="27" fill={wheelWell} />
      <Circle cx="244" cy="115" r="27" fill={wheelWell} />

      <Path d="M100 73 C110 57 121 49 140 47 L140 73 Z" fill={`url(#sedan-glass-${variant})`} />
      <Path
        d="M152 47 L192 47 C209 49 220 58 230 73 L152 73 Z"
        fill={`url(#sedan-glass-${variant})`}
      />
      <Path d="M104 71 C113 58 123 51 138 49 L138 55 C125 57 116 62 109 71 Z" fill="#FFFFFF" opacity="0.18" />
      <Path d="M156 50 L190 50 C202 52 212 59 221 71 L157 71 Z" fill="#FFFFFF" opacity="0.12" />
      <Rect x="139" y="45" width="11" height="29" fill={pillar} />
      <Path
        d="M138 40 L186 40"
        stroke={black ? '#5A636E' : '#FFFFFF'}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      <Path d="M150 74 L150 110" stroke={seam} strokeWidth="1.2" />
      <Path d="M216 74 L216 108" stroke={seam} strokeWidth="1.2" />
      <Rect x="160" y="83" width="17" height="4.5" rx="2.2" fill={handle} />
      <Rect x="225" y="83" width="17" height="4.5" rx="2.2" fill={handle} />
      <Path d="M42 92 L286 92" stroke={seamSoft} strokeWidth="1.2" />

      <Path d="M232 70 L242 72 L240 79 L230 77 Z" fill={bumper} stroke={seam} strokeWidth="0.8" />

      <Path d="M289 84 L303 86 L302 94 L288 92 Z" fill="#E8F5FF" stroke="#B7D8F2" strokeWidth="0.9" />
      <Path d="M291 86 L298 87 L297 90 L290 89 Z" fill="#FFFFFF" opacity="0.9" />
      <Path d="M26 84 L38 86 L37 94 L26 93 Z" fill="#FF6A78" />
      <Rect x="28" y="99" width="7" height="3" rx="1.5" fill="#F0A0A8" opacity="0.8" />

      <Circle cx="92" cy="115" r="22.5" fill="#111A26" />
      <Circle cx="244" cy="115" r="22.5" fill="#111A26" />
      <Circle cx="92" cy="115" r="13" fill={`url(#sedan-rim-${variant})`} />
      <Circle cx="244" cy="115" r="13" fill={`url(#sedan-rim-${variant})`} />
      <Circle cx="92" cy="115" r="6" fill={rimHub} />
      <Circle cx="244" cy="115" r="6" fill={rimHub} />
      <Path d="M92 103 L92 111 M244 103 L244 111" stroke={rimHub} strokeWidth="1.6" />
      <Path d="M81 115 L88 115 M104 115 L111 115" stroke={rimHub} strokeWidth="1.6" />
      <Path d="M233 115 L240 115 M256 115 L263 115" stroke={rimHub} strokeWidth="1.6" />
      <Path d="M65 114 A27 27 0 0 1 119 114" stroke={arch} strokeWidth="1.8" fill="none" />
      <Path d="M217 114 A27 27 0 0 1 271 114" stroke={arch} strokeWidth="1.8" fill="none" />

      <Path d="M292 103 L303 102 L302 107 L291 108 Z" fill={bumper} />
      <Path d="M27 104 L38 105 L37 109 L28 108 Z" fill={bumper} />
    </G>
  );
}

export default SedanArtwork;
