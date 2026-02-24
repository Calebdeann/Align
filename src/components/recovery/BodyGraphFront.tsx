import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

// Color map: simplified muscle group ID -> fill color
interface BodyGraphFrontProps {
  colorMap: Record<string, string>;
  width?: number;
  height?: number;
}

// SVG paths for the front-facing female body outline and muscle fill regions.
// ViewBox is 200x460. Muscle fills are approximate shapes that sit under the outline.

export default function BodyGraphFront({
  colorMap,
  width = 160,
  height = 380,
}: BodyGraphFrontProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 460" fill="none">
      {/* === MUSCLE FILL REGIONS (bottom layer) === */}
      <G id="muscle-fills">
        {/* Shoulders (front delts) - left */}
        <Path
          d="M52,100 C44,100 36,106 34,114 C32,122 34,130 38,134 C42,130 48,122 52,114 Z"
          fill={colorMap.shoulders || 'transparent'}
        />
        {/* Shoulders (front delts) - right */}
        <Path
          d="M148,100 C156,100 164,106 166,114 C168,122 166,130 162,134 C158,130 152,122 148,114 Z"
          fill={colorMap.shoulders || 'transparent'}
        />

        {/* Chest (pectorals) - left */}
        <Path
          d="M62,112 C56,114 52,120 52,128 C52,136 56,142 64,144 C72,146 82,144 88,140 C92,136 94,130 94,124 C94,118 90,114 84,112 C78,110 68,110 62,112 Z"
          fill={colorMap.chest || 'transparent'}
        />
        {/* Chest (pectorals) - right */}
        <Path
          d="M138,112 C144,114 148,120 148,128 C148,136 144,142 136,144 C128,146 118,144 112,140 C108,136 106,130 106,124 C106,118 110,114 116,112 C122,110 132,110 138,112 Z"
          fill={colorMap.chest || 'transparent'}
        />

        {/* Biceps - left */}
        <Path
          d="M42,138 C38,142 36,150 36,160 C36,170 38,180 42,186 C46,180 48,170 48,160 C48,150 46,142 42,138 Z"
          fill={colorMap.biceps || 'transparent'}
        />
        {/* Biceps - right */}
        <Path
          d="M158,138 C162,142 164,150 164,160 C164,170 162,180 158,186 C154,180 152,170 152,160 C152,150 154,142 158,138 Z"
          fill={colorMap.biceps || 'transparent'}
        />

        {/* Core (abs) */}
        <Path
          d="M78,146 C74,148 72,152 72,158 L72,210 C72,216 74,220 78,222 L88,224 C94,225 100,226 106,226 C112,225 118,224 122,222 C126,220 128,216 128,210 L128,158 C128,152 126,148 122,146 L112,144 C106,143 100,142 94,142 C88,143 82,144 78,146 Z"
          fill={colorMap.core || 'transparent'}
        />

        {/* Quads - left */}
        <Path
          d="M72,234 C68,238 66,246 64,258 C62,270 62,284 64,296 C66,308 68,318 72,324 C76,318 80,308 82,296 C84,284 84,270 82,258 C80,246 78,238 72,234 Z"
          fill={colorMap.legs || 'transparent'}
        />
        {/* Quads - right */}
        <Path
          d="M128,234 C132,238 134,246 136,258 C138,270 138,284 136,296 C134,308 132,318 128,324 C124,318 120,308 118,296 C116,284 116,270 118,258 C120,246 122,238 128,234 Z"
          fill={colorMap.legs || 'transparent'}
        />

        {/* Inner thigh / adductors - left */}
        <Path
          d="M86,240 C84,250 84,264 86,280 C88,290 90,296 94,300 C96,290 96,276 94,262 C92,250 90,244 86,240 Z"
          fill={colorMap.legs || 'transparent'}
        />
        {/* Inner thigh / adductors - right */}
        <Path
          d="M114,240 C116,250 116,264 114,280 C112,290 110,296 106,300 C104,290 104,276 106,262 C108,250 110,244 114,240 Z"
          fill={colorMap.legs || 'transparent'}
        />
      </G>

      {/* === BODY OUTLINE (top layer) === */}
      <G
        id="outline"
        stroke="#1A1A1A"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Head */}
        <Path d="M88,30 C88,18 94,10 100,10 C106,10 112,18 112,30 C112,42 106,50 100,50 C94,50 88,42 88,30 Z" />
        {/* Neck */}
        <Path d="M94,50 L94,62 M106,50 L106,62" />

        {/* Shoulders and upper torso */}
        <Path d="M94,62 L78,66 C60,72 44,82 36,96 C30,108 30,120 34,132" />
        <Path d="M106,62 L122,66 C140,72 156,82 164,96 C170,108 170,120 166,132" />

        {/* Chest outline */}
        <Path d="M56,108 C52,116 50,126 52,136 C56,146 66,150 78,148 C88,146 94,140 96,132" />
        <Path d="M144,108 C148,116 150,126 148,136 C144,146 134,150 122,148 C112,146 106,140 104,132" />
        <Path d="M96,132 L96,148 M104,132 L104,148" />

        {/* Core/torso lines */}
        <Path d="M100,132 L100,226" />
        <Path d="M80,158 L120,158 M80,174 L120,174 M80,190 L120,190 M80,208 L120,208" />

        {/* Waist to hips */}
        <Path d="M72,148 C68,160 66,180 66,200 C66,216 68,228 72,236" />
        <Path d="M128,148 C132,160 134,180 134,200 C134,216 132,228 128,236" />

        {/* Arms - left */}
        <Path d="M34,132 C30,144 28,160 30,176 C32,192 36,204 38,210" />
        <Path d="M50,132 C48,144 46,160 46,176 C46,190 48,200 48,210" />
        {/* Forearm - left */}
        <Path d="M38,210 C36,222 34,236 32,248 C30,258 28,264 24,272" />
        <Path d="M48,210 C46,222 44,234 42,244 C40,252 38,260 34,268" />

        {/* Arms - right */}
        <Path d="M166,132 C170,144 172,160 170,176 C168,192 164,204 162,210" />
        <Path d="M150,132 C152,144 154,160 154,176 C154,190 152,200 152,210" />
        {/* Forearm - right */}
        <Path d="M162,210 C164,222 166,236 168,248 C170,258 172,264 176,272" />
        <Path d="M152,210 C154,222 156,234 158,244 C160,252 162,260 166,268" />

        {/* Legs - left */}
        <Path d="M72,236 C66,248 62,266 60,286 C58,306 60,322 64,336" />
        <Path d="M94,232 C92,244 90,260 90,278 C90,296 90,312 88,326" />
        {/* Knee area - left */}
        <Path d="M64,336 C62,342 62,348 64,354 M88,326 C86,336 86,344 88,352" />
        {/* Lower leg - left */}
        <Path d="M64,354 C62,370 60,388 60,404 C60,418 62,428 64,436" />
        <Path d="M88,352 C86,370 84,388 84,404 C84,416 82,426 80,436" />
        {/* Foot - left */}
        <Path d="M64,436 C60,440 56,444 52,446 M80,436 C76,440 72,444 68,446" />

        {/* Legs - right */}
        <Path d="M128,236 C134,248 138,266 140,286 C142,306 140,322 136,336" />
        <Path d="M106,232 C108,244 110,260 110,278 C110,296 110,312 112,326" />
        {/* Knee area - right */}
        <Path d="M136,336 C138,342 138,348 136,354 M112,326 C114,336 114,344 112,352" />
        {/* Lower leg - right */}
        <Path d="M136,354 C138,370 140,388 140,404 C140,418 138,428 136,436" />
        <Path d="M112,352 C114,370 116,388 116,404 C116,416 118,426 120,436" />
        {/* Foot - right */}
        <Path d="M136,436 C140,440 144,444 148,446 M120,436 C124,440 128,444 132,446" />

        {/* Muscle definition lines - shoulders */}
        <Path d="M56,108 C50,100 44,96 38,96" />
        <Path d="M144,108 C150,100 156,96 162,96" />

        {/* Muscle definition - bicep separation */}
        <Path d="M42,134 C40,146 38,160 38,174" />
        <Path d="M158,134 C160,146 162,160 162,174" />
      </G>
    </Svg>
  );
}
