import { View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

type SectorState = 'filled' | 'empty';

type Props = {
  size?: number;
  sectors?: {
    meat?: SectorState;
    fish?: SectorState;
    salad?: SectorState;
  };
  background?: 'cream' | 'transparent';
};

const PLATE_RADIUS = 38;
const RIM_WIDTH = 1.6;
const VIEWBOX = 100;
const CENTER = VIEWBOX / 2;

function arcPath(startAngleDeg: number, endAngleDeg: number, radius: number) {
  const toXY = (deg: number) => {
    const r = (deg - 90) * (Math.PI / 180);
    return {
      x: CENTER + radius * Math.cos(r),
      y: CENTER + radius * Math.sin(r),
    };
  };
  const start = toXY(startAngleDeg);
  const end = toXY(endAngleDeg);
  const largeArc = endAngleDeg - startAngleDeg <= 180 ? 0 : 1;
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

const EMPTY = '#E8E2D4';

export function PlateIcon({
  size = 96,
  sectors = { meat: 'filled', fish: 'filled', salad: 'filled' },
  background = 'transparent',
}: Props) {
  const meatColor = sectors.meat === 'empty' ? EMPTY : colors.secondary;
  const fishColor = sectors.fish === 'empty' ? EMPTY : colors.primary;
  const saladColor = sectors.salad === 'empty' ? EMPTY : colors.success;

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: background === 'cream' ? colors.background : 'transparent',
        borderRadius: background === 'cream' ? size * 0.22 : 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Defs>
          <RadialGradient id="plateShade" cx="50%" cy="48%" r="50%">
            <Stop offset="80%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F1ECE0" />
          </RadialGradient>
        </Defs>

        {/* shadow under plate */}
        <Circle
          cx={CENTER}
          cy={CENTER + 1.5}
          r={PLATE_RADIUS}
          fill="#1F2A44"
          opacity={0.08}
        />

        {/* plate body */}
        <Circle cx={CENTER} cy={CENTER} r={PLATE_RADIUS} fill="url(#plateShade)" />

        {/* sectors (3 wedges, 120° each, starting at top) */}
        <G>
          <Path
            d={arcPath(-30, 90, PLATE_RADIUS - 6)}
            fill={meatColor}
            opacity={0.92}
          />
          <Path
            d={arcPath(90, 210, PLATE_RADIUS - 6)}
            fill={saladColor}
            opacity={0.92}
          />
          <Path
            d={arcPath(210, 330, PLATE_RADIUS - 6)}
            fill={fishColor}
            opacity={0.92}
          />
        </G>

        {/* white dividers between sectors */}
        <G stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round">
          <Path d={`M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - PLATE_RADIUS + 6}`} />
          <Path
            d={`M ${CENTER} ${CENTER} L ${CENTER + (PLATE_RADIUS - 6) * Math.cos((210 - 90) * (Math.PI / 180))} ${CENTER + (PLATE_RADIUS - 6) * Math.sin((210 - 90) * (Math.PI / 180))}`}
          />
          <Path
            d={`M ${CENTER} ${CENTER} L ${CENTER + (PLATE_RADIUS - 6) * Math.cos((330 - 90) * (Math.PI / 180))} ${CENTER + (PLATE_RADIUS - 6) * Math.sin((330 - 90) * (Math.PI / 180))}`}
          />
        </G>

        {/* center dot */}
        <Circle cx={CENTER} cy={CENTER} r={2.2} fill="#FFFFFF" />

        {/* gold rim */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={PLATE_RADIUS}
          fill="none"
          stroke={colors.primary}
          strokeWidth={RIM_WIDTH}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={PLATE_RADIUS - 5}
          fill="none"
          stroke={colors.primary}
          strokeWidth={0.5}
          opacity={0.5}
        />
      </Svg>
    </View>
  );
}
