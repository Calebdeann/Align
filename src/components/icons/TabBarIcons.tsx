import Svg, { Path, Circle, Rect } from 'react-native-svg';

export function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M3 9h18" stroke={color} strokeWidth={1.5} />
      <Path d="M8 2v4M16 2v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Rect x={7} y={13} width={3} height={3} rx={0.5} fill={color} />
      <Rect x={7} y={17} width={3} height={3} rx={0.5} fill={color} />
      <Rect x={11} y={13} width={3} height={3} rx={0.5} fill={color} />
    </Svg>
  );
}

export function WorkoutIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M2 8.5v7M22 8.5v7M4.25 7v10M19.75 7v10"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.5} />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
