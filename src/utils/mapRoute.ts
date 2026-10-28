/**
 * Road-following route helpers shared by the simulated map and the driver
 * tracking screen.
 *
 * Routes are built on the map's avenue grid (axis-aligned segments with a few
 * turns), so a vehicle that follows the polyline can never leave the roads. The
 * same helpers will keep working unchanged when live GPS coordinates replace the
 * mock driver position — only the input points change.
 */

export type MapPoint = { x: number; y: number };

export function distance(a: MapPoint, b: MapPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Builds a road-following polyline from `from` to `to` with three sensible
 * turns (down the street, across the avenue, then up to the address).
 */
export function buildRoute(from: MapPoint, to: MapPoint): MapPoint[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const firstY = from.y + dy * 0.42;
  const midX = from.x + dx * 0.58;
  const upperY = from.y + dy * 0.78;
  return [
    from,
    { x: from.x, y: firstY },
    { x: midX, y: firstY },
    { x: midX, y: upperY },
    { x: to.x, y: upperY },
    to,
  ];
}

/** Point + segment index at `progress` (0..1) along the polyline. */
export function locateOnPath(points: MapPoint[], progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  if (points.length < 2) return { point: points[0] ?? { x: 0, y: 0 }, index: 0 };
  const lengths = points.slice(1).map((point, index) => distance(points[index], point));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  let target = clamped * total;

  for (let i = 0; i < lengths.length; i += 1) {
    if (target <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] === 0 ? 0 : Math.min(1, target / lengths[i]);
      const from = points[i];
      const to = points[i + 1];
      return {
        point: { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t },
        index: i,
      };
    }
    target -= lengths[i];
  }
  return { point: points[points.length - 1], index: points.length - 2 };
}

/** Total length of a polyline in normalised map units. */
export function pathLength(points: MapPoint[]) {
  return points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0);
}

/**
 * Heading of the segment starting at `index`, in degrees where 0 faces up
 * (north) and 90 faces right — the same convention as the SVG markers.
 */
export function headingAt(points: MapPoint[], index: number) {
  const from = points[Math.min(index, points.length - 2)];
  const to = points[Math.min(index + 1, points.length - 1)];
  if (!from || !to) return 0;
  return (Math.atan2(to.x - from.x, -(to.y - from.y)) * 180) / Math.PI;
}

/** Shortest signed rotation (degrees) from `from` to `to`. */
export function angleDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

/** Eases a heading toward the next one so turns look like a smooth curve. */
export function easeAngle(current: number, target: number, factor = 0.35) {
  return current + angleDelta(current, target) * factor;
}
