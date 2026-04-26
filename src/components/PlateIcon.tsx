import { View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  size?: number;
  // 'filled' = baked golden challah; 'empty' = grey outline (used in empty states)
  state?: 'filled' | 'empty';
  background?: 'cream' | 'transparent';
};

const VIEWBOX = 100;

export function PlateIcon({
  size = 96,
  state = 'filled',
  background = 'transparent',
}: Props) {
  const isEmpty = state === 'empty';

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
          <LinearGradient id="loaf" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={isEmpty ? '#D9D3C4' : '#F0BB6F'} />
            <Stop offset="0.55" stopColor={isEmpty ? '#B5AE9D' : '#B07434'} />
            <Stop offset="1" stopColor={isEmpty ? '#8C8678' : '#5E3814'} />
          </LinearGradient>
          <RadialGradient id="sheen" cx="50%" cy="20%" rx="55%" ry="55%">
            <Stop offset="0" stopColor="#FFE4B5" stopOpacity={isEmpty ? 0 : 0.6} />
            <Stop offset="1" stopColor="#FFE4B5" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* ground shadow */}
        <Ellipse cx={50} cy={73} rx={38} ry={2} fill="#1F2A44" opacity={0.16} />

        {/* main loaf body */}
        <Path
          d="M 16 50 Q 16 36 35 36 L 65 36 Q 84 36 84 50 Q 84 66 65 66 L 35 66 Q 16 66 16 50 Z"
          fill="url(#loaf)"
          stroke={isEmpty ? '#7A7466' : '#4A2D11'}
          strokeWidth={0.7}
          strokeLinejoin="round"
        />

        {/* sheen on top */}
        <Path
          d="M 16 50 Q 16 36 35 36 L 65 36 Q 84 36 84 50 Q 84 66 65 66 L 35 66 Q 16 66 16 50 Z"
          fill="url(#sheen)"
        />

        {/* braid grooves — 4 diagonal twists */}
        <G
          fill="none"
          stroke={isEmpty ? '#7A7466' : '#5E3814'}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
        >
          <Path d="M 28 37 Q 23 50 32 64" />
          <Path d="M 41 37 Q 36 50 45 64" />
          <Path d="M 54 37 Q 49 50 58 64" />
          <Path d="M 67 37 Q 62 50 71 64" />
        </G>

        {/* highlight ridges between grooves */}
        {!isEmpty && (
          <G
            fill="none"
            stroke="#F2C57E"
            strokeWidth={0.9}
            strokeLinecap="round"
            opacity={0.55}
          >
            <Path d="M 22 40 Q 19 50 27 60" />
            <Path d="M 34 40 Q 29 50 38 60" />
            <Path d="M 47 40 Q 42 50 51 60" />
            <Path d="M 60 40 Q 55 50 64 60" />
            <Path d="M 74 40 Q 70 50 78 60" />
          </G>
        )}

        {/* sesame seeds */}
        {!isEmpty && (
          <G fill="#FFFBE8">
            <Ellipse cx={29} cy={43} rx={0.5} ry={0.9} />
            <Ellipse cx={37} cy={42} rx={0.5} ry={0.9} />
            <Ellipse cx={45} cy={44} rx={0.5} ry={0.9} />
            <Ellipse cx={53} cy={42} rx={0.5} ry={0.9} />
            <Ellipse cx={61} cy={44} rx={0.5} ry={0.9} />
            <Ellipse cx={69} cy={42} rx={0.5} ry={0.9} />
            <Ellipse cx={33} cy={48} rx={0.4} ry={0.7} />
            <Ellipse cx={49} cy={48} rx={0.4} ry={0.7} />
            <Ellipse cx={64} cy={48} rx={0.4} ry={0.7} />
          </G>
        )}
      </Svg>
    </View>
  );
}
