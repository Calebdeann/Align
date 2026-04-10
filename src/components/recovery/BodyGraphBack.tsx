import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

// Static require map — Metro bundler needs all paths to be string literals at build time
// Index corresponds to tier: [tier1, tier2, tier3, tier4]
const BACK_MUSCLE_IMAGES: Record<string, [any, any, any, any]> = {
  arms: [
    require('../../../assets/body-graph/back/1/Back_Arms_1.png'),
    require('../../../assets/body-graph/back/2/Back_Arms_2.png'),
    require('../../../assets/body-graph/back/3/Back_Arms_3.png'),
    require('../../../assets/body-graph/back/4/Back_Arms_4.png'),
  ],
  back: [
    require('../../../assets/body-graph/back/1/Back_Back_1.png'),
    require('../../../assets/body-graph/back/2/Back_Back_2.png'),
    require('../../../assets/body-graph/back/3/Back_Back_3.png'),
    require('../../../assets/body-graph/back/4/Back_Back_4.png'),
  ],
  calves: [
    require('../../../assets/body-graph/back/1/Back_Calves_1.png'),
    require('../../../assets/body-graph/back/2/Back_Calves_2.png'),
    require('../../../assets/body-graph/back/3/Back_Calves_3.png'),
    require('../../../assets/body-graph/back/4/Back_Calves_4.png'),
  ],
  glutes: [
    require('../../../assets/body-graph/back/1/Back_Glutes_1.png'),
    require('../../../assets/body-graph/back/2/Back_Glutes_2.png'),
    require('../../../assets/body-graph/back/3/Back_Glutes_3.png'),
    require('../../../assets/body-graph/back/4/Back_Glutes_4.png'),
  ],
  legs: [
    require('../../../assets/body-graph/back/1/Back_Legs_1.png'),
    require('../../../assets/body-graph/back/2/Back_Legs_2.png'),
    require('../../../assets/body-graph/back/3/Back_Legs_3.png'),
    require('../../../assets/body-graph/back/4/Back_Legs_4.png'),
  ],
  shoulders: [
    require('../../../assets/body-graph/back/1/Back_Shoulders_1.png'),
    require('../../../assets/body-graph/back/2/Back_Shoulders_2.png'),
    require('../../../assets/body-graph/back/3/Back_Shoulders_3.png'),
    require('../../../assets/body-graph/back/4/Back_Shoulders_4.png'),
  ],
};

const BACK_OUTLINE = require('../../../assets/body-graph/back/Back_Body_Graph.png');

// Original PNG dimensions: 1449 × 3440 — maintain this aspect ratio
const ASPECT_RATIO = 1449 / 3440;

interface BodyGraphBackProps {
  tierMap: Record<string, number>;
  width?: number;
}

export default function BodyGraphBack({ tierMap, width = 130 }: BodyGraphBackProps) {
  const height = width / ASPECT_RATIO;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Muscle layers — rendered below the outline */}
      {Object.entries(BACK_MUSCLE_IMAGES).map(([muscle, images]) => {
        const tier = tierMap[muscle] ?? 0;
        if (tier === 0) return null;
        return (
          <Image
            key={muscle}
            source={images[tier - 1]} // tier 1→index 0, tier 4→index 3
            style={[styles.layer, { width, height }]}
            resizeMode="contain"
          />
        );
      })}

      {/* Outline on top — its black lines clean up the muscle edges */}
      <Image source={BACK_OUTLINE} style={[styles.layer, { width, height }]} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
