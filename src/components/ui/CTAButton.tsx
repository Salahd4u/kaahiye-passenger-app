import React from 'react';
import { Button, type ButtonProps } from '@/components/Button';
import { CTA_STYLE } from './ctaStyle';

export type CTAButtonProps = ButtonProps;

/**
 * The ONE reusable primary-button component used across the app.
 *
 * Every primary CTA — Sign In, Continue with Apple, Get Started, Allow Location,
 * Sign Up, Confirm Ride, Driver Arriving, Done, Submit, … — renders through this
 * wrapper, which forces the shared `CTA_STYLE` box on top of whatever
 * vertical spacing a screen passes in:
 *
 *   width  : '100%' of the parent container (never stretched or squeezed)
 *   height : 56
 *   radius : 14
 *   margins/padding: identical for every button
 *
 * The screen style is applied first and `CTA_STYLE` last, so a screen can only
 * ever influence vertical spacing — never width, height, horizontal margins,
 * padding or radius. Colors, icons, labels and handlers pass straight through
 * to `Button` unchanged.
 */
export function CTAButton({ style, ...rest }: CTAButtonProps) {
  return <Button {...rest} style={[style, CTA_STYLE]} />;
}

export default CTAButton;
