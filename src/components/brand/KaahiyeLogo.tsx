import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

type LogoProps = {
  /** Rendered square box, in points. */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * Kaahiye mark — the emerald gradient location pin with the white car and road.
 *
 * Rendered from the master artwork (`assets/brand/kaahiye-logo.png`) so the same
 * logo stays sharp everywhere it appears: splash (96pt), auth header (46pt) and
 * the home header (24pt).
 */
export function KaahiyeLogo({ size = 72, style }: LogoProps) {
  return (
    <Image
      source={require('@assets/brand/kaahiye-logo.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

export default KaahiyeLogo;


