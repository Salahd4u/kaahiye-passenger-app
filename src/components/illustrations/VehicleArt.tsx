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
  Svg,
} from 'react-native-svg';
import { SedanArtwork } from './Sedan';
import type { VehicleArtKind } from '@/mock/rideOptions';

function Motorbike() {
  return (
    <G>
      <Ellipse cx="60" cy="70" rx="46" ry="5" fill="#0B1B2B" opacity="0.14" />
      {/* Wheels */}
      <Circle cx="26" cy="58" r="13" fill="#191D24" />
      <Circle cx="96" cy="58" r="13" fill="#191D24" />
      <Circle cx="26" cy="58" r="6" fill="#B9C0C8" />
      <Circle cx="96" cy="58" r="6" fill="#B9C0C8" />
      {/* Frame */}
      <Path d="M26 58 L48 40 L76 38 L96 58" stroke="#2A2F37" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <Path d="M48 40 L62 58" stroke="#2A2F37" strokeWidth="3" strokeLinecap="round" />
      {/* Fairing */}
      <Path d="M38 46 C44 30 58 24 72 28 L84 36 L74 52 L48 56 Z" fill="#F5B301" />
      <Path d="M72 28 C84 24 96 32 99 44 L86 50 L72 40 Z" fill="#FFC93C" />
      <Path d="M44 44 C50 32 60 28 70 30 L64 40 L48 46 Z" fill="#FFD766" opacity="0.9" />
      {/* Seat */}
      <Path d="M42 42 L70 34 L76 40 L48 50 Z" fill="#1F2430" />
      {/* Handlebar / windscreen */}
      <Path d="M74 28 L90 20" stroke="#2A2F37" strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M84 24 L96 17" stroke="#8FA6B8" strokeWidth="2.2" strokeLinecap="round" />
      {/* Engine + exhaust */}
      <Rect x="48" y="44" width="18" height="12" rx="3" fill="#3A424D" />
      <Path d="M40 56 L22 62" stroke="#B0B6BF" strokeWidth="4" strokeLinecap="round" />
      {/* Headlight */}
      <Path d="M95 40 L103 43 L101 49 L94 47 Z" fill="#FFE9A8" />
      <Circle cx="99" cy="45" r="1.8" fill="#FFFFFF" />
    </G>
  );
}

function Suv({ large = false }: { large?: boolean }) {
  const bodyPath = large
    ? 'M6 46 C6 36 10 31 19 29 L30 17 C35 12 42 10 51 10 L98 10 C108 10 114 15 118 23 L126 30 C131 34 133 39 133 45 L131 52 C130 55 127 57 123 57 L12 57 C8 57 6 55 6 52 Z'
    : 'M8 46 C8 36 12 31 20 29 L30 17 C34 13 40 11 48 11 L84 11 C92 11 98 15 102 23 L110 30 C114 34 116 39 116 45 L114 52 C113 55 110 57 106 57 L14 57 C10 57 8 55 8 52 Z';
  const frontWindow = large
    ? 'M78 24 L96 24 C104 24 109 28 113 34 L113 40 L78 40 Z'
    : 'M68 24 L82 24 C89 24 94 28 98 34 L98 40 L68 40 Z';
  const rearWindow = large
    ? 'M40 40 L40 24 L72 24 L72 40 Z'
    : 'M38 40 L38 24 L62 24 L62 40 Z';
  const secondWindow = large ? 'M76 24 L76 40 L74 40 L74 24 Z' : null;

  return (
    <G>
      <Ellipse cx={large ? 70 : 62} cy="60" rx={large ? 66 : 56} ry="5" fill="#0B1B2B" opacity="0.14" />
      <Defs>
        <LinearGradient id={large ? 'suv-large-body' : 'suv-body'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.6" stopColor="#F7F9FB" />
          <Stop offset="1" stopColor="#D7E0E9" />
        </LinearGradient>
      </Defs>
      <Path d={bodyPath} fill={`url(#${large ? 'suv-large-body' : 'suv-body'})`} stroke="#D3DCE5" strokeWidth="1" />
      {/* Windows */}
      <Path d={rearWindow} fill="#2A3C4E" />
      <Path d={frontWindow} fill="#33475B" />
      {secondWindow ? <Path d={secondWindow} fill="#2A3C4E" /> : null}
      <Rect x={large ? 72 : 62} y="22" width="6" height="19" fill="#F1F5F8" />
      {/* Roof rails */}
      <Path
        d={large ? 'M34 12 L96 12' : 'M34 13 L80 13'}
        stroke="#C3CDD7"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Wheels */}
      <Circle cx={large ? 34 : 32} cy="56" r="13" fill="#191D24" />
      <Circle cx={large ? 104 : 92} cy="56" r="13" fill="#191D24" />
      <Circle cx={large ? 34 : 32} cy="56" r="6" fill="#C4CBD3" />
      <Circle cx={large ? 104 : 92} cy="56" r="6" fill="#C4CBD3" />
      <Path
        d={large ? 'M18 55 A16 16 0 0 1 50 55' : 'M16 55 A16 16 0 0 1 48 55'}
        stroke="#BCC6D1"
        strokeWidth="1.8"
        fill="none"
      />
      <Path
        d={large ? 'M88 55 A16 16 0 0 1 120 55' : 'M76 55 A16 16 0 0 1 108 55'}
        stroke="#BCC6D1"
        strokeWidth="1.8"
        fill="none"
      />
      {/* Lights + trim */}
      <Path d="M110 38 L122 39 L121 46 L109 45 Z" fill="#E8F5FF" stroke="#B7D8F2" strokeWidth="0.9" />
      <Path d="M10 39 L22 40 L21 47 L10 46 Z" fill="#FF6A78" />
      <Path d="M20 50 L116 50" stroke="#DEE6ED" strokeWidth="1.4" />
      <Path d="M20 34 L116 34" stroke="#E6EDF3" strokeWidth="1.2" />
    </G>
  );
}

export function MotorbikeArtwork() {
  return <Motorbike />;
}

type VehicleArtProps = {
  kind: VehicleArtKind;
  width?: number;
  height?: number;
};

/**
 * Bundled vehicle artwork for the Choose a Ride options.
 * All illustrations are local SVG — no remote images.
 */
export function VehicleArt({ kind, width = 86, height = 54 }: VehicleArtProps) {
  if (kind === 'sedanBlack') {
    return (
      <Svg width={width} height={height} viewBox="0 0 330 150">
        <SedanArtwork variant="black" />
      </Svg>
    );
  }
  if (kind === 'motorbike') {
    return (
      <Svg width={width} height={height} viewBox="0 0 120 80">
        <Motorbike />
      </Svg>
    );
  }
  if (kind === 'suvLarge') {
    return (
      <Svg width={width} height={height} viewBox="0 0 140 70">
        <Suv large />
      </Svg>
    );
  }
  return (
    <Svg width={width} height={height} viewBox="0 0 120 70">
      <Suv />
    </Svg>
  );
}

export default VehicleArt;
