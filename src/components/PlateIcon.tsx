import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  size?: number;
  // 'filled' = full color challah; 'empty' = grey outline (used in empty states)
  state?: 'filled' | 'empty';
  background?: 'cream' | 'transparent';
};

const VIEWBOX = 100;

export function PlateIcon({
  size = 96,
  state = 'filled',
  background = 'transparent',
}: Props) {
  const main = state === 'empty' ? '#C9C2B0' : colors.primary;
  const seed = state === 'empty' ? '#C9C2B0' : '#1F2A44';

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
        {/* sesame seeds */}
        <G fill={seed} opacity={0.85}>
          <Ellipse cx={32} cy={28} rx={1} ry={1.4} />
          <Ellipse cx={42} cy={25} rx={1} ry={1.4} />
          <Ellipse cx={50} cy={24} rx={1} ry={1.4} />
          <Ellipse cx={58} cy={25} rx={1} ry={1.4} />
          <Ellipse cx={68} cy={28} rx={1} ry={1.4} />
        </G>

        {/* loaf outline */}
        <Path
          d="M 22 52 Q 22 37 38 37 L 62 37 Q 78 37 78 52 Q 78 67 62 67 L 38 67 Q 22 67 22 52 Z"
          fill="none"
          stroke={main}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* braid strands */}
        <G fill="none" stroke={main} strokeWidth={2.4} strokeLinecap="round">
          <Path d="M 28 50 C 36 43, 44 57, 52 50 S 68 43, 76 50" opacity={0.95} />
          <Path d="M 28 53 C 36 60, 44 46, 52 53 S 68 60, 76 53" opacity={0.95} />
        </G>

        {/* knot accents */}
        <G fill={main}>
          <Ellipse cx={36} cy={51.5} rx={1.2} ry={0.7} />
          <Ellipse cx={44} cy={51.5} rx={1.2} ry={0.7} />
          <Ellipse cx={52} cy={51.5} rx={1.2} ry={0.7} />
          <Ellipse cx={60} cy={51.5} rx={1.2} ry={0.7} />
          <Ellipse cx={68} cy={51.5} rx={1.2} ry={0.7} />
        </G>

        {/* end caps */}
        <Circle cx={22} cy={52} r={1.8} fill={main} />
        <Circle cx={78} cy={52} r={1.8} fill={main} />
      </Svg>
    </View>
  );
}
