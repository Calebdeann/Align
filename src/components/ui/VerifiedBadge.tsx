import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type Props = { size: number };

// 9-lobe scalloped burst. Each lobe is a quadratic-bezier petal whose control
// point sits inside the outer ring (valleyR < outerR), giving smooth concave
// valleys with softly pointed outer tips — matches the App Store / verified
// badge silhouette.
function buildBurstPath(
  lobes: number,
  outerR: number,
  valleyR: number,
  cx: number,
  cy: number
): string {
  let d = '';
  for (let i = 0; i < lobes; i++) {
    const aOuter = (2 * Math.PI * i) / lobes - Math.PI / 2;
    const aValley = aOuter + Math.PI / lobes;
    const aNextOuter = aOuter + (2 * Math.PI) / lobes;
    const x0 = cx + outerR * Math.cos(aOuter);
    const y0 = cy + outerR * Math.sin(aOuter);
    const xv = cx + valleyR * Math.cos(aValley);
    const yv = cy + valleyR * Math.sin(aValley);
    const x1 = cx + outerR * Math.cos(aNextOuter);
    const y1 = cy + outerR * Math.sin(aNextOuter);
    if (i === 0) d += `M${x0.toFixed(2)},${y0.toFixed(2)}`;
    d += ` Q${xv.toFixed(2)},${yv.toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`;
  }
  return d + ' Z';
}

export default function VerifiedBadge({ size }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2;
  const valleyR = outerR * 0.78;
  const path = buildBurstPath(9, outerR, valleyR, cx, cy);

  // Thick rounded checkmark; coordinates tuned for visual centering.
  const checkSW = size * 0.13;
  const c1x = size * 0.3;
  const c1y = size * 0.53;
  const c2x = size * 0.44;
  const c2y = size * 0.66;
  const c3x = size * 0.72;
  const c3y = size * 0.37;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="vbGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE57F" />
          <Stop offset="50%" stopColor="#FFC83D" />
          <Stop offset="100%" stopColor="#D49B00" />
        </LinearGradient>
      </Defs>
      <Path d={path} fill="url(#vbGold)" />
      <Path
        d={`M${c1x} ${c1y} L${c2x} ${c2y} L${c3x} ${c3y}`}
        stroke="#FFFFFF"
        strokeWidth={checkSW}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
