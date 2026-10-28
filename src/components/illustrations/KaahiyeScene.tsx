import React from 'react';
import { Circle, Ellipse, G, Path, Rect, Svg } from 'react-native-svg';
import { SedanArtwork } from './Sedan';

type Building = {
  x: number;
  w: number;
  h: number;
  fill: string;
  lines?: number;
};

const SPLASH_SKYLINE: Building[] = [
  { x: -8, w: 40, h: 78, fill: '#C9DAE8', lines: 4 },
  { x: 32, w: 34, h: 112, fill: '#B7CCDD', lines: 6 },
  { x: 68, w: 28, h: 86, fill: '#CBDDEA', lines: 4 },
  { x: 98, w: 44, h: 134, fill: '#ABC3D7', lines: 7 },
  { x: 144, w: 26, h: 96, fill: '#BFD3E3', lines: 5 },
  { x: 172, w: 54, h: 120, fill: '#9EB9D0', lines: 6 },
  { x: 228, w: 30, h: 76, fill: '#CBDDEA', lines: 3 },
  { x: 260, w: 46, h: 108, fill: '#B0C8DB', lines: 5 },
  { x: 308, w: 34, h: 132, fill: '#A5BFD4', lines: 7 },
  { x: 344, w: 46, h: 94, fill: '#C2D5E4', lines: 4 },
];

const ONBOARDING_SKYLINE: Building[] = [
  { x: 24, w: 30, h: 64, fill: '#C3D6E5', lines: 3 },
  { x: 54, w: 26, h: 96, fill: '#A9C2D6', lines: 5 },
  { x: 82, w: 34, h: 124, fill: '#93B0C8', lines: 6 },
  { x: 118, w: 24, h: 82, fill: '#BBD0E0', lines: 4 },
  { x: 144, w: 40, h: 108, fill: '#9DB9CF', lines: 5 },
  { x: 186, w: 30, h: 72, fill: '#C6D8E6', lines: 3 },
  { x: 218, w: 36, h: 116, fill: '#A3BDD2', lines: 6 },
  { x: 256, w: 26, h: 88, fill: '#B8CEDF', lines: 4 },
  { x: 284, w: 30, h: 68, fill: '#CBDCE9', lines: 3 },
];

function Skyline({ buildings, baseline }: { buildings: Building[]; baseline: number }) {
  return (
    <G>
      {buildings.map((building, index) => {
        const top = baseline - building.h;
        const lineCount = building.lines ?? 4;
        return (
          <G key={`b-${index}`}>
            <Rect
              x={building.x}
              y={top}
              width={building.w}
              height={building.h}
              fill={building.fill}
              rx={2}
            />
            {/* Window bands */}
            {Array.from({ length: lineCount }).map((_, line) => (
              <Path
                key={`l-${line}`}
                d={`M${building.x + 4} ${top + 9 + line * 11} H${building.x + building.w - 4}`}
                stroke="#EAF3FA"
                strokeWidth={1.6}
                opacity={0.55}
                strokeLinecap="round"
              />
            ))}
            <Path
              d={`M${building.x + building.w / 2} ${top + 4} V${baseline - 2}`}
              stroke="#FFFFFF"
              strokeWidth={0.8}
              opacity={0.25}
            />
            {index % 3 === 0 ? (
              <Path
                d={`M${building.x + building.w / 2} ${top} V${top - 12}`}
                stroke="#93AFC7"
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            ) : null}
          </G>
        );
      })}
    </G>
  );
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Rect x={-2.4} y={0} width={4.8} height={24} rx={2} fill="#9A7A5C" />
      <Circle cx={0} cy={-4} r={14} fill="#9FD0AE" />
      <Circle cx={-9} cy={4} r={10} fill="#8FC9A1" />
      <Circle cx={9} cy={5} r={9} fill="#ADD9BA" />
    </G>
  );
}

type SceneProps = {
  variant?: 'splash' | 'onboarding';
};

/**
 * City + sedan hero artwork for the splash and onboarding screens.
 * ViewBox proportions are tuned for a 390pt wide phone.
 */
export function KaahiyeScene({ variant = 'onboarding' }: SceneProps) {
  if (variant === 'splash') {
    return (
      <Svg width="100%" height="100%" viewBox="0 0 390 340" preserveAspectRatio="xMidYMax slice">
        <Circle cx="318" cy="78" r="58" fill="#FFFFFF" opacity="0.4" />
        <Ellipse cx="205" cy="236" rx="225" ry="64" fill="#FFE2CA" opacity="0.6" />
        <Ellipse cx="316" cy="222" rx="74" ry="34" fill="#FFEFD9" opacity="0.75" />
        <Skyline buildings={SPLASH_SKYLINE} baseline={242} />

        {/* Ground + boulevard */}
        <Rect x="0" y="238" width="390" height="104" fill="#E8EEF3" />
        <Rect x="0" y="238" width="390" height="4" fill="#DDE6EE" />
        <Path d="M0 282 H390" stroke="#DDE5ED" strokeWidth="2" />
        <Path d="M0 312 H390" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="16 14" opacity="0.85" />

        {/* Landscaping */}
        <Tree x={28} y={242} scale={0.85} />
        <Tree x={366} y={244} scale={1} />
        <Ellipse cx="70" cy="262" rx="34" ry="7" fill="#D6E2EA" opacity="0.7" />
        <Ellipse cx="322" cy="264" rx="28" ry="6" fill="#D6E2EA" opacity="0.6" />

        {/* Hero sedan */}
        <G transform="translate(58, 158) scale(0.76)">
          <SedanArtwork />
        </G>
      </Svg>
    );
  }

  return (
    <Svg width="100%" height="100%" viewBox="0 0 340 250" preserveAspectRatio="xMidYMax meet">
      <Ellipse cx="170" cy="142" rx="154" ry="95" fill="#F1FAF7" />
      <Skyline buildings={ONBOARDING_SKYLINE} baseline={196} />
      <Rect x="24" y="194" width="292" height="3" rx="1.5" fill="#DCE7EE" />
      <Tree x={34} y={194} scale={0.9} />
      <Tree x={308} y={196} scale={0.8} />
      <Tree x={66} y={198} scale={0.6} />
      <Ellipse cx="170" cy="224" rx="112" ry="8" fill="#DCE8E2" opacity="0.55" />
      <G transform="translate(66, 110) scale(0.68)">
        <SedanArtwork />
      </G>
    </Svg>
  );
}

export default KaahiyeScene;
