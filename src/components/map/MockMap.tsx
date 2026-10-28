import React, { useState, type ReactNode, useMemo } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme, type ThemeColors } from '@/theme';

import { buildRoute, distance, locateOnPath, type MapPoint } from '@/utils/mapRoute';

export type { MapPoint };
/** A nearby car drawn on the map (normalised coordinates + heading). */
export type MapCar = MapPoint & { angle?: number };

type MockMapProps = {
  pickup?: MapPoint;
  destination?: MapPoint;
  driver?: MapPoint;
  /** Nearby idle vehicles — white car or green motorbike markers. */
  cars?: (MapCar & { kind?: 'car' | 'motorbike'; halo?: boolean })[];
  /** Road-following approach path from the driver to the pickup point. */
  approach?: { from: MapPoint; to: MapPoint; progress?: number };
  /** Driver vehicle that follows the approach path (rotates with the road). */
  vehicle?: MapCar & { kind?: 'car' | 'motorbike' };
  /** Optional blue pill rendered above the pickup marker. */
  pickupLabel?: string;
  showRoute?: boolean;
  /** 0..1 — how far the vehicle has travelled along the route. */
  routeProgress?: number;
  showPickup?: boolean;
  showDestination?: boolean;
  showDriver?: boolean;
  destinationTone?: 'red' | 'blue';
  /** Route stroke colour (defaults to the blue navigation colour). */
  routeColor?: string;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  label?: string;
};

const V_ROADS = [
  0.045, 0.135, 0.225, 0.315, 0.405, 0.495, 0.585, 0.675, 0.765, 0.855, 0.945,
];
const H_ROADS = [
  0.035, 0.108, 0.181, 0.254, 0.327, 0.4, 0.473, 0.546, 0.619, 0.692, 0.765, 0.838, 0.911, 0.975,
];
const MAJOR_V = 0.405;
const MAJOR_H = 0.4;
const PARKS: Record<string, { trees: MapPoint[]; pond?: MapPoint }> = {
  '2-1': { trees: [{ x: 0.155, y: 0.2 }, { x: 0.195, y: 0.235 }, { x: 0.145, y: 0.25 }] },
  '3-7': {
    trees: [{ x: 0.71, y: 0.3 }, { x: 0.745, y: 0.33 }, { x: 0.7, y: 0.36 }],
    pond: { x: 0.73, y: 0.285 },
  },
  '5-1': { trees: [{ x: 0.16, y: 0.46 }, { x: 0.195, y: 0.49 }] },
  '5-2': { trees: [{ x: 0.25, y: 0.47 }, { x: 0.285, y: 0.5 }] },
  '6-1': { trees: [{ x: 0.145, y: 0.535 }, { x: 0.18, y: 0.565 }] },
  '6-2': { trees: [{ x: 0.27, y: 0.51 }, { x: 0.31, y: 0.54 }, { x: 0.25, y: 0.55 }] },
  '8-8': {
    trees: [{ x: 0.81, y: 0.71 }, { x: 0.845, y: 0.74 }, { x: 0.8, y: 0.76 }],
    pond: { x: 0.83, y: 0.69 },
  },
  '10-0': { trees: [{ x: 0.075, y: 0.86 }, { x: 0.11, y: 0.89 }, { x: 0.07, y: 0.9 }] },
  '11-4': { trees: [{ x: 0.45, y: 0.93 }, { x: 0.485, y: 0.95 }, { x: 0.44, y: 0.96 }] },
};

function roundedPath(points: MapPoint[], radiusPx: number) {
  if (points.length < 2) return '';
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    const inLength = distance(prev, current) || 1;
    const outLength = distance(current, next) || 1;
    const r = Math.min(radiusPx, inLength / 2, outLength / 2);
    const inVec = { x: (current.x - prev.x) / inLength, y: (current.y - prev.y) / inLength };
    const outVec = { x: (next.x - current.x) / outLength, y: (next.y - current.y) / outLength };
    path += ` L${current.x - inVec.x * r} ${current.y - inVec.y * r}`;
    path += ` Q${current.x} ${current.y} ${current.x + outVec.x * r} ${current.y + outVec.y * r}`;
  }
  const last = points[points.length - 1];
  path += ` L${last.x} ${last.y}`;
  return path;
}

/** Deterministic subtle variation for city blocks. */
function blockTone(row: number, col: number, isDark: boolean) {
  const tones = isDark
    ? ['#141D28', '#111A24', '#151F2B', '#121B25']
    : ['#F8F9FA', '#F3F5F7', '#F7F6F3', '#F1F4F6'];
  return tones[(row * 7 + col * 3) % tones.length];
}
function CityLayer({ width, height }: { width: number; height: number }) {
  const { colors, isDark } = useTheme();
  const w = width;
  const h = height;
  const blocks: ReactNode[] = [];
  // Night-map neutrals — the light values are unchanged in Light Mode.
  const blockStroke = isDark ? '#1A2431' : '#E9EDF1';
  const footprint = isDark ? '#1B2532' : '#E9EDF1';
  const footprintAlt = isDark ? '#18222E' : '#ECF0F3';
  const baseFill = isDark ? '#0F1620' : '#EFF2F4';
  const roadEdge = isDark ? '#1B2735' : '#E4E9EE';

  for (let row = 0; row < H_ROADS.length - 1; row += 1) {
    for (let col = 0; col < V_ROADS.length - 1; col += 1) {
      const key = `${row}-${col}`;
      const x = V_ROADS[col] * w + 2.5;
      const y = H_ROADS[row] * h + 2.5;
      const blockWidth = (V_ROADS[col + 1] - V_ROADS[col]) * w - 5;
      const blockHeight = (H_ROADS[row + 1] - H_ROADS[row]) * h - 5;
      const park = PARKS[key];

      blocks.push(
        <Rect
          key={`block-${key}`}
          x={x}
          y={y}
          width={Math.max(0, blockWidth)}
          height={Math.max(0, blockHeight)}
          rx={1.2}
          fill={park ? colors.mapPark : blockTone(row, col, isDark)}
          stroke={blockStroke}
          strokeWidth={0.35}
        />,
      );

      if (park) {
        if (park.pond) {
          blocks.push(
            <Ellipse
              key={`pond-${key}`}
              cx={park.pond.x * w}
              cy={park.pond.y * h}
              rx={Math.max(9, blockWidth * 0.18)}
              ry={Math.max(6, blockHeight * 0.22)}
              fill={colors.mapWater}
            />,
          );
        }
        park.trees.forEach((tree, index) => {
          blocks.push(
            <G key={`tree-${key}-${index}`}>
              <Circle cx={tree.x * w} cy={tree.y * h} r={4.4} fill={colors.mapTree} />
              <Circle
                cx={tree.x * w - 1.6}
                cy={tree.y * h - 1.2}
                r={2.8}
                fill={colors.mapParkDeep}
              />
            </G>,
          );
        });
      } else if ((row * 5 + col * 3) % 3 === 0 && blockWidth > 14 && blockHeight > 16) {
        blocks.push(
          <Rect
            key={`footprint-${key}`}
            x={x + blockWidth * 0.16}
            y={y + blockHeight * 0.18}
            width={blockWidth * 0.52}
            height={blockHeight * 0.48}
            rx={1}
            fill={footprint}
          />,
        );
        if ((row + col) % 2 === 0) {
          blocks.push(
            <Rect
              key={`footprint2-${key}`}
              x={x + blockWidth * 0.58}
              y={y + blockHeight * 0.55}
              width={blockWidth * 0.26}
              height={blockHeight * 0.28}
              rx={0.8}
              fill={footprintAlt}
            />,
          );
        }
      }
    }
  }

  return (
    <G>
      <Rect x="0" y="0" width={w} height={h} fill={baseFill} />
      {blocks}

      {/* Street grid */}
      {V_ROADS.map((road, index) => {
        const major = road === MAJOR_V;
        return (
          <G key={`v-road-${index}`}>
            <Line
              x1={road * w}
              y1={0}
              x2={road * w}
              y2={h}
              stroke={roadEdge}
              strokeWidth={major ? 11 : 6}
            />
            <Line
              x1={road * w}
              y1={0}
              x2={road * w}
              y2={h}
              stroke={colors.mapRoad}
              strokeWidth={major ? 7 : 3.5}
            />
          </G>
        );
      })}
      {H_ROADS.map((road, index) => {
        const major = road === MAJOR_H;
        return (
          <G key={`h-road-${index}`}>
            <Line
              x1={0}
              y1={road * h}
              x2={w}
              y2={road * h}
              stroke={roadEdge}
              strokeWidth={major ? 11 : 6}
            />
            <Line
              x1={0}
              y1={road * h}
              x2={w}
              y2={road * h}
              stroke={colors.mapRoad}
              strokeWidth={major ? 7 : 3.5}
            />
          </G>
        );
      })}

      {/* Diagonal avenue + curved connector */}
      <Path
        d={`M${-12} ${h * 0.93} L${w * 0.7} ${h * 0.32} L${w + 12} ${h * 0.06}`}
        stroke={roadEdge}
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={`M${-12} ${h * 0.93} L${w * 0.7} ${h * 0.32} L${w + 12} ${h * 0.06}`}
        stroke={colors.mapRoad}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={`M${w * 1.04} ${h * 0.58} C${w * 0.8} ${h * 0.68}, ${w * 0.72} ${h * 0.82}, ${w * 0.55} ${h * 1.04}`}
        stroke={roadEdge}
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d={`M${w * 1.04} ${h * 0.58} C${w * 0.8} ${h * 0.68}, ${w * 0.72} ${h * 0.82}, ${w * 0.55} ${h * 1.04}`}
        stroke={colors.mapRoad}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />

      {/* Faint street names */}
      <SvgText
        x={V_ROADS[6] * w + 4}
        y={h * 0.29}
        fill={colors.mapLabel}
        fontSize={5}
        letterSpacing={0.8}
        transform={`rotate(90 ${V_ROADS[6] * w + 4} ${h * 0.29})`}
      >
        BROADWAY N
      </SvgText>
      <SvgText
        x={w * 0.46}
        y={H_ROADS[5] * h - 3}
        fill={colors.mapLabel}
        fontSize={5}
        letterSpacing={0.8}
      >
        13TH AVE S
      </SvgText>
      <SvgText
        x={w * 0.08}
        y={H_ROADS[8] * h - 3}
        fill={colors.mapLabel}
        fontSize={5}
        letterSpacing={0.8}
      >
        MAIN AVE
      </SvgText>
      <SvgText
        x={w * 0.53}
        y={h * 0.68}
        fill={colors.mapLabel}
        fontSize={5}
        letterSpacing={0.8}
        transform={`rotate(-38 ${w * 0.53} ${h * 0.68})`}
      >
        UNIVERSITY DR
      </SvgText>
    </G>
  );
}

function PickupMarker({ x, y }: MapPoint) {
  const { colors } = useTheme();
  return (
    <G>
      <Circle cx={x} cy={y} r={22} fill={colors.blue} opacity={0.12} />
      <Circle cx={x} cy={y} r={13} fill={colors.blue} opacity={0.2} />
      <Circle cx={x} cy={y} r={9.5} fill={colors.blue} stroke={colors.white} strokeWidth={3} />
      <Circle cx={x} cy={y} r={3.2} fill={colors.white} />
    </G>
  );
}

function DestinationMarker({
  x,
  y,
  tone,
}: MapPoint & { tone: 'red' | 'blue' }) {
  const { colors } = useTheme();
  if (tone === 'blue') {
    return (
      <G>
        <Circle cx={x} cy={y} r={20} fill={colors.blue} opacity={0.12} />
        <Circle cx={x} cy={y} r={8.5} fill={colors.blue} stroke={colors.white} strokeWidth={2.8} />
        <Circle cx={x} cy={y} r={3} fill={colors.white} />
      </G>
    );
  }

  return (
    <G>
      <Ellipse cx={x} cy={y + 3} rx={8} ry={2.6} fill={colors.black} opacity={0.13} />
      <G transform={`translate(${x - 13.5}, ${y - 37}) scale(0.9)`}>
        <Path
          d="M15 0C6.7 0 0 6.6 0 14.8 0 25.9 15 40 15 40s15-14.1 15-25.2C30 6.6 23.3 0 15 0z"
          fill={colors.mapDestination}
        />
        <Circle cx="15" cy="14.6" r="5.4" fill={colors.white} />
      </G>
    </G>
  );
}

function CarMarker({ x, y, angle = 0 }: MapCar) {
  const { colors } = useTheme();
  return (
    <G transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <Ellipse cx={0} cy={3} rx={11} ry={19} fill={colors.black} opacity={0.12} />
      <Rect
        x={-9.5}
        y={-18}
        width={19}
        height={36}
        rx={7}
        fill={colors.white}
        stroke="#DFE5EB"
        strokeWidth={0.8}
      />
      <Path d="M-7.4 -9.4H7.4L8.6 -3.6H-8.6Z" fill="#26333F" />
      <Path d="M-8.2 -3H8.2L7.1 1.2H-7.1Z" fill="#F2F5F8" />
      <Path d="M-8 5.2H8L7 10H-7Z" fill="#33414E" />
      <Rect x={-8.6} y={12.4} width={4} height={2.2} rx={1.1} fill="#E25C6A" />
      <Rect x={4.6} y={12.4} width={4} height={2.2} rx={1.1} fill="#E25C6A" />
      <Rect x={-9.7} y={-2} width={1.6} height={3.6} rx={0.8} fill="#CBD4DE" />
      <Rect x={8.1} y={-2} width={1.6} height={3.6} rx={0.8} fill="#CBD4DE" />
    </G>
  );
}

/** Top-down motorbike marker used for motorbike bookings. */
function MotorbikeMarker({ x, y, angle = 0 }: MapCar) {
  const { colors } = useTheme();
  return (
    <G transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <Ellipse cx={0} cy={2} rx={13} ry={16} fill={colors.blue} opacity={0.12} />
      <Ellipse cx={0} cy={3} rx={7} ry={15} fill={colors.black} opacity={0.16} />
      {/* Wheels */}
      <Ellipse cx={0} cy={-11} rx={3.4} ry={5.6} fill="#1B1F24" stroke={colors.white} strokeWidth={0.7} />
      <Ellipse cx={0} cy={11} rx={3.4} ry={5.6} fill="#1B1F24" stroke={colors.white} strokeWidth={0.7} />
      {/* Body */}
      <Path d="M0 -9 L0 9" stroke="#0E9C7B" strokeWidth={4.2} strokeLinecap="round" />
      <Ellipse cx={0} cy={0.5} rx={5.1} ry={7.4} fill="#00B894" stroke={colors.white} strokeWidth={0.7} />
      {/* Handlebars + rider */}
      <Path d="M-6 -2.6 H6" stroke="#1F2937" strokeWidth={1.8} strokeLinecap="round" />
      <Ellipse cx={0} cy={0.8} rx={3.5} ry={4.6} fill="#22303F" />
      <Circle cx={0} cy={-1.6} r={2.1} fill="#D7E1EA" />
    </G>
  );
}

/** Driver vehicle with the soft spotlight the live map shows under it. */
function DriverVehicleMarker({
  x,
  y,
  angle = 0,
  kind = 'car',
}: MapCar & { kind?: 'car' | 'motorbike' }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={kind === 'motorbike' ? 20 : 24} ry={kind === 'motorbike' ? 26 : 30} fill="#1689F9" opacity={0.1} />
      {kind === 'motorbike' ? (
        <MotorbikeMarker x={x} y={y} angle={angle} />
      ) : (
        <CarMarker x={x} y={y} angle={angle} />
      )}
    </G>
  );
}

function VehicleMarker({ x, y }: MapPoint) {
  const { colors } = useTheme();
  return (
    <G transform={`translate(${x - 16}, ${y - 18}) rotate(-16 16 18)`}>
      <Ellipse cx="16" cy="35" rx="12" ry="3.2" fill={colors.black} opacity={0.16} />
      <Path
        d="M15 3.5C11 3.5 8.2 6.2 7.6 10L6.1 26.5C5.9 29.5 7.8 31.5 10.4 31.5H21.6C24.2 31.5 26.1 29.5 25.9 26.5L24.4 10C23.8 6.2 21 3.5 17 3.5H15Z"
        fill="#16202E"
        stroke="#FFFFFF"
        strokeWidth={1.6}
      />
      <Path
        d="M9.4 10.4C9.9 7.8 11.9 5.8 15 5.8H17C20.1 5.8 22.1 7.8 22.6 10.4L23.2 14.2H8.8L9.4 10.4Z"
        fill="#E9F1F8"
        opacity={0.9}
      />
      <Path
        d="M8.6 22.5H23.4L23.8 26.3C23.9 28 22.6 29.3 20.9 29.3H11.1C9.4 29.3 8.1 28 8.2 26.3L8.6 22.5Z"
        fill="#E9F1F8"
        opacity={0.85}
      />
      <Path d="M15 15.5H17V21H15Z" fill="#243140" />
      <Rect x="3.7" y="12.2" width="2.2" height="4.1" rx="1.1" fill="#16202E" />
      <Rect x="26.1" y="12.2" width="2.2" height="4.1" rx="1.1" fill="#16202E" />
    </G>
  );
}

/**
 * MockMap — a fully local, SVG-rendered city map.
 *
 * No real maps, tiles or GPS are used. The street grid, parks, route and
 * markers are deterministic and bundled with the app.
 */
export function MockMap({
  pickup,
  destination,
  driver,
  cars,
  approach,
  vehicle,
  pickupLabel,
  showRoute = false,
  routeProgress = 1,
  showPickup = true,
  showDestination = true,
  showDriver = false,
  destinationTone = 'red',
  routeColor,
  rounded,
  style,
  children,
  label = 'Simulated city map',
}: MockMapProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const routeStroke = routeColor ?? colors.mapRoute;
  const [layout, setLayout] = useState({ width: 390, height: 600 });
  const w = layout.width;
  const h = layout.height;

  const progress = Math.min(1, Math.max(0, routeProgress));

  const route = pickup && destination ? buildRoute(pickup, destination) : [];

  const toPx = (point: MapPoint) => ({ x: point.x * w, y: point.y * h });
  const pPickup = pickup ? toPx(pickup) : undefined;
  const pDestination = destination ? toPx(destination) : undefined;
  const pDriver = driver ? toPx(driver) : undefined;

  const located = route.length > 1 ? locateOnPath(route, progress) : null;
  const currentPoint = located ? toPx(located.point) : undefined;
  const routePointsPx = route.map(toPx);
  const remainingPoints =
    located && route.length > 1
      ? [located.point, ...route.slice(located.index + 1)].map(toPx)
      : [];
  const travelledPoints =
    located && progress < 1
      ? [...route.slice(0, located.index + 1), located.point].map(toPx)
      : [];
  const drawPoints = progress >= 1 ? routePointsPx : remainingPoints;

  const vehiclePoint =
    showDriver && route.length > 1 && progress < 1 && currentPoint
      ? currentPoint
      : pDriver;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (Math.abs(width - w) > 1 || Math.abs(height - h) > 1) {
      setLayout({ width, height });
    }
  };

  return (
    <View
      style={[styles.container, rounded !== undefined && { borderRadius: rounded }, style]}
      onLayout={handleLayout}
      accessibilityLabel={label}
    >
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <CityLayer width={w} height={h} />

        {cars && cars.length > 0
          ? cars.map((car, index) => (
              <G key={`car-${index}`}>
                {car.halo ? (
                  <Ellipse
                    cx={car.x * w}
                    cy={car.y * h}
                    rx={24}
                    ry={24}
                    fill={colors.greenSoft}
                    opacity={0.9}
                  />
                ) : null}
                {car.kind === 'motorbike' ? (
                  <MotorbikeMarker x={car.x * w} y={car.y * h} angle={car.angle} />
                ) : (
                  <CarMarker x={car.x * w} y={car.y * h} angle={car.angle} />
                )}
              </G>
            ))
          : null}

        {approach
          ? (() => {
              const approachRoute = buildRoute(approach.from, approach.to);
              const located = locateOnPath(approachRoute, approach.progress ?? 0);
              const travelled = [
                ...approachRoute.slice(0, located.index + 1),
                located.point,
              ].map(toPx);
              const remaining = [
                located.point,
                ...approachRoute.slice(located.index + 1),
              ].map(toPx);
              return (
                <G>
                  {travelled.length > 1 ? (
                    <Path
                      d={roundedPath(travelled, 10)}
                      stroke={colors.mapRouteSoft}
                      strokeWidth={5}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                  {remaining.length > 1 ? (
                    <G>
                      <Path
                        d={roundedPath(remaining, 10)}
                        stroke={colors.white}
                        strokeWidth={8}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.92}
                      />
                      <Path
                        d={roundedPath(remaining, 10)}
                        stroke={colors.mapRoute}
                        strokeWidth={4.6}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </G>
                  ) : null}
                </G>
              );
            })()
          : null}

        {vehicle ? (
          <DriverVehicleMarker
            x={vehicle.x * w}
            y={vehicle.y * h}
            angle={vehicle.angle}
            kind={vehicle.kind}
          />
        ) : null}

        {showRoute && route.length > 1 ? (
          <G>
            {progress < 1 && travelledPoints.length > 1 ? (
              <Path
                d={roundedPath(travelledPoints, 9)}
                stroke={colors.mapRouteSoft}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            <Path
              d={roundedPath(drawPoints, 12)}
              stroke={colors.white}
              strokeWidth={8.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
            />
            <Path
              d={roundedPath(drawPoints, 12)}
              stroke={routeStroke}
              strokeWidth={4.6}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        ) : null}

        {showPickup && pPickup ? <PickupMarker x={pPickup.x} y={pPickup.y} /> : null}

        {pickupLabel && pPickup ? (
          <G>
            <Rect
              x={Math.min(Math.max(pPickup.x - 46, 6), w - 98)}
              y={pPickup.y - 62}
              width={92}
              height={26}
              rx={13}
              fill={colors.blue}
            />
            <SvgText
              x={Math.min(Math.max(pPickup.x, 52), w - 52)}
              y={pPickup.y - 45}
              fill={colors.white}
              fontSize={11}
              fontWeight="600"
              textAnchor="middle"
            >
              {pickupLabel}
            </SvgText>
          </G>
        ) : null}

        {vehiclePoint ? <VehicleMarker x={vehiclePoint.x} y={vehiclePoint.y} /> : null}
        {showDestination && pDestination ? (
          <DestinationMarker
            x={pDestination.x}
            y={pDestination.y}
            tone={destinationTone}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.mapBase,
  },
  });

export default MockMap;

