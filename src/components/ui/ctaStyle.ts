import { type ViewStyle } from 'react-native';

/** Exact CTA dimensions shared by every primary (green) button in the app. */
export const CTA_HEIGHT = 56;
export const CTA_RADIUS = 14;
export const CTA_HORIZONTAL_PADDING = 16;
/** Comfortable gap between a CTA and the bottom safe-area edge. */
export const CTA_BOTTOM_GAP = 16;
/** Label size used by every CTA. */
export const CTA_TEXT_SIZE = 15;

/**
 * ONE shared geometry for every full-width CTA in the app.
 *
 * The style describes ONLY the box — `width: '100%'` of the parent, a fixed
 * height and the corner radius. It carries **no padding and no margins**, so the
 * painted box is exactly the parent's content width on every device:
 *
 *   width  = parent content width  (screen − 40 in the app's 20pt gutter layout)
 *   height = 56
 *   radius = 14
 *
 * Horizontal padding for the label/icon row lives inside `Button`'s content
 * layer (`CTA_HORIZONTAL_PADDING`), never on the box itself. Screens must only
 * add vertical spacing (marginTop/marginBottom).
 */
export const CTA_STYLE: ViewStyle = {
  width: '100%',
  height: CTA_HEIGHT,
  alignSelf: 'stretch',
  marginHorizontal: 0,
  borderRadius: CTA_RADIUS,
};

export default CTA_STYLE;
