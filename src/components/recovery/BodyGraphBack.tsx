import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

// Color map: simplified muscle group ID -> fill color
interface BodyGraphBackProps {
  colorMap: Record<string, string>;
  width?: number;
  height?: number;
}

// SVG paths for the back-facing female body outline and muscle fill regions.
// ViewBox is 200x460. Muscle fills are approximate shapes that sit under the outline.

export default function BodyGraphBack({ colorMap, width = 160, height = 380 }: BodyGraphBackProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 460" fill="none">
      {/* === MUSCLE FILL REGIONS (bottom layer) === */}
      <G id="muscle-fills">
        {/* Traps / upper back */}
        <Path
          d="M78,68 C72,74 68,82 66,92 C66,100 68,106 74,108 C80,106 88,100 92,92 C94,86 94,78 92,72 C88,68 84,66 78,68 Z"
          fill={colorMap.back || 'transparent'}
        />
        <Path
          d="M122,68 C128,74 132,82 134,92 C134,100 132,106 126,108 C120,106 112,100 108,92 C106,86 106,78 108,72 C112,68 116,66 122,68 Z"
          fill={colorMap.back || 'transparent'}
        />

        {/* Lats / mid-back - left */}
        <Path
          d="M68,110 C64,118 62,128 62,140 C62,152 64,162 68,170 C72,166 78,158 82,148 C84,140 84,130 82,120 C80,114 76,110 68,110 Z"
          fill={colorMap.back || 'transparent'}
        />
        {/* Lats / mid-back - right */}
        <Path
          d="M132,110 C136,118 138,128 138,140 C138,152 136,162 132,170 C128,166 122,158 118,148 C116,140 116,130 118,120 C120,114 124,110 132,110 Z"
          fill={colorMap.back || 'transparent'}
        />

        {/* Lower back / spinal erectors */}
        <Path
          d="M82,170 C78,180 76,192 76,206 C76,216 78,224 82,228 C88,224 94,218 96,210 C98,202 98,192 96,182 C94,176 90,172 82,170 Z"
          fill={colorMap.back || 'transparent'}
        />
        <Path
          d="M118,170 C122,180 124,192 124,206 C124,216 122,224 118,228 C112,224 106,218 104,210 C102,202 102,192 104,182 C106,176 110,172 118,170 Z"
          fill={colorMap.back || 'transparent'}
        />

        {/* Rear delts / shoulders - left */}
        <Path
          d="M52,96 C44,98 38,104 36,112 C34,120 36,126 40,130 C44,126 50,118 54,110 C56,104 56,100 52,96 Z"
          fill={colorMap.shoulders || 'transparent'}
        />
        {/* Rear delts / shoulders - right */}
        <Path
          d="M148,96 C156,98 162,104 164,112 C166,120 164,126 160,130 C156,126 150,118 146,110 C144,104 144,100 148,96 Z"
          fill={colorMap.shoulders || 'transparent'}
        />

        {/* Triceps - left */}
        <Path
          d="M38,134 C34,140 32,150 32,162 C32,172 34,180 38,186 C42,180 46,170 46,160 C46,150 44,140 38,134 Z"
          fill={colorMap.triceps || 'transparent'}
        />
        {/* Triceps - right */}
        <Path
          d="M162,134 C166,140 168,150 168,162 C168,172 166,180 162,186 C158,180 154,170 154,160 C154,150 156,140 162,134 Z"
          fill={colorMap.triceps || 'transparent'}
        />

        {/* Glutes - left */}
        <Path
          d="M76,228 C70,232 66,240 66,250 C66,260 70,266 78,268 C86,268 92,264 96,258 C98,252 98,244 94,238 C90,232 84,228 76,228 Z"
          fill={colorMap.glutes || 'transparent'}
        />
        {/* Glutes - right */}
        <Path
          d="M124,228 C130,232 134,240 134,250 C134,260 130,266 122,268 C114,268 108,264 104,258 C102,252 102,244 106,238 C110,232 116,228 124,228 Z"
          fill={colorMap.glutes || 'transparent'}
        />

        {/* Hamstrings - left */}
        <Path
          d="M68,272 C64,280 62,292 62,306 C62,318 64,328 68,334 C72,328 76,318 78,306 C80,294 80,282 76,274 C74,272 72,270 68,272 Z"
          fill={colorMap.legs || 'transparent'}
        />
        {/* Hamstrings - right */}
        <Path
          d="M132,272 C136,280 138,292 138,306 C138,318 136,328 132,334 C128,328 124,318 122,306 C120,294 120,282 124,274 C126,272 128,270 132,272 Z"
          fill={colorMap.legs || 'transparent'}
        />

        {/* Calves - left */}
        <Path
          d="M64,358 C60,368 58,380 58,394 C58,406 60,414 64,420 C68,414 72,406 72,394 C72,382 70,370 64,358 Z"
          fill={colorMap.calves || 'transparent'}
        />
        {/* Calves - right */}
        <Path
          d="M136,358 C140,368 142,380 142,394 C142,406 140,414 136,420 C132,414 128,406 128,394 C128,382 130,370 136,358 Z"
          fill={colorMap.calves || 'transparent'}
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
        <Path d="M94,50 L92,62 M106,50 L108,62" />

        {/* Shoulders and upper back */}
        <Path d="M92,62 L78,66 C60,72 44,84 36,98 C30,110 30,122 34,134" />
        <Path d="M108,62 L122,66 C140,72 156,84 164,98 C170,110 170,122 166,134" />

        {/* Spine line */}
        <Path d="M100,62 L100,230" strokeDasharray="2,4" opacity={0.4} />

        {/* Back muscle definition - traps */}
        <Path d="M92,66 C86,74 80,86 78,98 C76,108 78,116 82,120" />
        <Path d="M108,66 C114,74 120,86 122,98 C124,108 122,116 118,120" />

        {/* Lat lines */}
        <Path d="M68,108 C64,120 62,136 62,152 C62,166 64,176 68,184" />
        <Path d="M132,108 C136,120 138,136 138,152 C138,166 136,176 132,184" />

        {/* Scapula / shoulder blade suggestions */}
        <Path d="M74,94 C72,100 72,108 74,114 C78,118 84,120 88,118" />
        <Path d="M126,94 C128,100 128,108 126,114 C122,118 116,120 112,118" />

        {/* Waist to hips */}
        <Path d="M68,184 C66,196 64,210 64,224 C64,234 66,240 70,244" />
        <Path d="M132,184 C134,196 136,210 136,224 C136,234 134,240 130,244" />

        {/* Glute definition */}
        <Path d="M70,244 C66,250 64,258 66,266 C68,274 74,278 82,278 C90,278 96,274 100,268" />
        <Path d="M130,244 C134,250 136,258 134,266 C132,274 126,278 118,278 C110,278 104,274 100,268" />

        {/* Arms - left */}
        <Path d="M34,134 C30,146 28,162 30,178 C32,192 36,204 38,212" />
        <Path d="M50,130 C48,142 46,158 46,174 C46,188 48,200 48,212" />
        {/* Forearm - left */}
        <Path d="M38,212 C36,224 34,238 32,250 C30,260 28,266 24,274" />
        <Path d="M48,212 C46,224 44,236 42,246 C40,254 38,262 34,270" />

        {/* Arms - right */}
        <Path d="M166,134 C170,146 172,162 170,178 C168,192 164,204 162,212" />
        <Path d="M150,130 C152,142 154,158 154,174 C154,188 152,200 152,212" />
        {/* Forearm - right */}
        <Path d="M162,212 C164,224 166,238 168,250 C170,260 172,266 176,274" />
        <Path d="M152,212 C154,224 156,236 158,246 C160,254 162,262 166,270" />

        {/* Legs - left */}
        <Path d="M70,276 C66,288 62,306 60,324 C58,340 60,352 64,362" />
        <Path d="M94,272 C92,286 90,302 90,318 C90,332 88,342 86,352" />
        {/* Knee - left */}
        <Path d="M64,362 C62,368 62,374 64,378 M86,352 C84,360 84,368 86,374" />
        {/* Lower leg - left */}
        <Path d="M64,378 C60,394 58,410 60,424 C62,432 64,438 66,442" />
        <Path d="M86,374 C84,390 82,404 82,416 C82,426 80,434 78,440" />
        {/* Foot */}
        <Path d="M66,442 C62,444 58,446 54,448 M78,440 C74,442 70,444 66,446" />

        {/* Legs - right */}
        <Path d="M130,276 C134,288 138,306 140,324 C142,340 140,352 136,362" />
        <Path d="M106,272 C108,286 110,302 110,318 C110,332 112,342 114,352" />
        {/* Knee - right */}
        <Path d="M136,362 C138,368 138,374 136,378 M114,352 C116,360 116,368 114,374" />
        {/* Lower leg - right */}
        <Path d="M136,378 C140,394 142,410 140,424 C138,432 136,438 134,442" />
        <Path d="M114,374 C116,390 118,404 118,416 C118,426 120,434 122,440" />
        {/* Foot */}
        <Path d="M134,442 C138,444 142,446 146,448 M122,440 C126,442 130,444 134,446" />

        {/* Muscle definition - tricep separation */}
        <Path d="M42,132 C40,144 38,158 38,172" />
        <Path d="M158,132 C160,144 162,158 162,172" />

        {/* Hamstring definition lines */}
        <Path d="M78,280 C76,296 76,312 78,326" />
        <Path d="M122,280 C124,296 124,312 122,326" />

        {/* Calf definition */}
        <Path d="M72,380 C70,394 70,408 72,420" />
        <Path d="M128,380 C130,394 130,408 128,420" />
      </G>
    </Svg>
  );
}
