import {
  CTA_BOTTOM_GAP,
  CTA_HEIGHT,
  CTA_HORIZONTAL_PADDING,
  CTA_RADIUS,
  CTA_STYLE,
  CTA_TEXT_SIZE,
} from '@/components/ui/ctaStyle';

describe('CTA style — one shared button container', () => {
  it('locks the CTA box (width 100%, height 56, radius 14)', () => {
    expect(CTA_STYLE.width).toBe('100%');
    expect(CTA_STYLE.height).toBe(56);
    expect(CTA_STYLE.borderRadius).toBe(14);
    expect(CTA_STYLE.alignSelf).toBe('stretch');
    expect(CTA_STYLE.marginHorizontal).toBe(0);
    expect(CTA_STYLE.paddingHorizontal).toBeUndefined();
  });

  it('exposes tokens that match the shared style', () => {
    expect(CTA_HEIGHT).toBe(56);
    expect(CTA_RADIUS).toBe(14);
    expect(CTA_HORIZONTAL_PADDING).toBe(16);
    expect(CTA_BOTTOM_GAP).toBe(16);
    expect(CTA_TEXT_SIZE).toBe(15);
  });

  it('keeps the green button box free of padding, margins and width limits', () => {
    // The box is geometry only; horizontal padding belongs to the label row so it
    // can never change the button's width.
    expect(CTA_STYLE.paddingHorizontal).toBeUndefined();
    expect(CTA_STYLE.marginHorizontal).toBe(0);
    expect(CTA_STYLE.width).toBe('100%');
  });
});