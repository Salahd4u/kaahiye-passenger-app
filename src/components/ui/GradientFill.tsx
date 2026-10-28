import React, { useId } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type GradientFillProps = {
  from: string;
  to: string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** Direction of the gradient. Defaults to a soft diagonal. */
  direction?: 'diagonal' | 'vertical' | 'horizontal';
};

/**
 * A true linear gradient painted with react-native-svg, so the app keeps the
 * exact premium green gradient without pulling in an extra native module.
 */
export function GradientFill({
  from,
  to,
  radius = 0,
  style,
  direction = 'diagonal',
}: GradientFillProps) {
  const rawId = useId();
  const id = `grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const end =
    direction === 'vertical' ? { x: 0, y: 1 } : direction === 'horizontal' ? { x: 1, y: 0 } : { x: 1, y: 1 };

  return (
    <Svg
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}
      width="100%"
      height="100%"
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={end.x} y2={end.y}>
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={radius} ry={radius} fill={`url(#${id})`} />
    </Svg>
  );
}

export default GradientFill;
