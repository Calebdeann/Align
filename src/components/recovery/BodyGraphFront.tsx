import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

// Static require map — Metro bundler needs all paths to be string literals at build time
// Index corresponds to tier: [tier1, tier2, tier3, tier4]
const FRONT_MUSCLE_IMAGES: Record<string, [any, any, any, any]> = {
  abs: [
    require('../../../assets/body-graph/front/1/Front_Abs_1.png'),
    require('../../../assets/body-graph/front/2/Front_Abs_2.png'),
    require('../../../assets/body-graph/front/3/Front_Abs_3.png'),
    require('../../../assets/body-graph/front/4/Front_Abs_4.png'),
  ],
  arms: [
    require('../../../assets/body-graph/front/1/Front_Arms_1.png'),
    require('../../../assets/body-graph/front/2/Front_Arms_2.png'),
    require('../../../assets/body-graph/front/3/Front_Arms_3.png'),
    require('../../../assets/body-graph/front/4/Front_Arms_4.png'),
  ],
  calves: [
    require('../../../assets/body-graph/front/1/Front_Calves_1.png'),
    require('../../../assets/body-graph/front/2/Front_Calves_2.png'),
    require('../../../assets/body-graph/front/3/Front_Calves_3.png'),
    require('../../../assets/body-graph/front/4/Front_Calves_4.png'),
  ],
  chest: [
    require('../../../assets/body-graph/front/1/Front_Chest_1.png'),
    require('../../../assets/body-graph/front/2/Front_Chest_2.png'),
    require('../../../assets/body-graph/front/3/Front_Chest_3.png'),
    require('../../../assets/body-graph/front/4/Front_Chest_4.png'),
  ],
  legs: [
    require('../../../assets/body-graph/front/1/Front_Legs_1.png'),
    require('../../../assets/body-graph/front/2/Front_Legs_2.png'),
    require('../../../assets/body-graph/front/3/Front_Legs_3.png'),
    require('../../../assets/body-graph/front/4/Front_Legs_4.png'),
  ],
  shoulders: [
    require('../../../assets/body-graph/front/1/Front_Shoulders_1.png'),
    require('../../../assets/body-graph/front/2/Front_Shoulders_2.png'),
    require('../../../assets/body-graph/front/3/Front_Shoulders_3.png'),
    require('../../../assets/body-graph/front/4/Front_Shoulders_4.png'),
  ],
};

const FRONT_OUTLINE = require('../../../assets/body-graph/front/Front_Body_Graph.png');

// Original PNG dimensions: 1449 × 3440 — maintain this aspect ratio
const ASPECT_RATIO = 1449 / 3440;

interface BodyGraphFrontProps {
  tierMap: Record<string, number>;
  width?: number;
}

export default function BodyGraphFront({ tierMap, width = 130 }: BodyGraphFrontProps) {
  const height = width / ASPECT_RATIO;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Muscle layers — rendered below the outline */}
      {Object.entries(FRONT_MUSCLE_IMAGES).map(([muscle, images]) => {
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
      <Image
        source={FRONT_OUTLINE}
        style={[styles.layer, { width, height }]}
        resizeMode="contain"
      />
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
