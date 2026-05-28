import { ImageSourcePropType } from 'react-native';

// ════════════════════════════════════════════════════════════════════════════════
// HOURGLASS
// ════════════════════════════════════════════════════════════════════════════════

const HG_1_4_SQ = {
  lower: require('../../../assets/Plan Images/HourGlass/Week 1-4/Square/Hourglass_week1-4_lower_square.png'),
  lower2: require('../../../assets/Plan Images/HourGlass/Week 1-4/Square/Hourglass_week1-4_lower2_square.png'),
  upper: require('../../../assets/Plan Images/HourGlass/Week 1-4/Square/Hourglass_week1-4_upper_square.png'),
  fullbody: require('../../../assets/Plan Images/HourGlass/Week 1-4/Square/Hourglass_week1-4_fullbody_square.png'),
  abs: require('../../../assets/Plan Images/HourGlass/Week 1-4/Square/Hourglass_week1-4_abs_square.png'),
  cardio: require('../../../assets/Plan Images/HourGlass/Week 1-4/Square/Hourglass_week1-4_cardio_square.png'),
} as const;

const HG_1_4_RECT = {
  lower: require('../../../assets/Plan Images/HourGlass/Week 1-4/Rectangle/Hourglass_week1-4_lower_rectangle.png'),
  upper: require('../../../assets/Plan Images/HourGlass/Week 1-4/Rectangle/Hourglass_week1-4_upper_rectangle.png'),
  upper1: require('../../../assets/Plan Images/HourGlass/Week 1-4/Rectangle/Hourglass_week1-4_upper_rectangle-1.png'),
  upper2: require('../../../assets/Plan Images/HourGlass/Week 1-4/Rectangle/Hourglass_week1-4_upper_rectangle-2.png'),
  upper3: require('../../../assets/Plan Images/HourGlass/Week 1-4/Rectangle/Hourglass_week1-4_upper_rectangle-3.png'),
  upper4: require('../../../assets/Plan Images/HourGlass/Week 1-4/Rectangle/Hourglass_week1-4_upper_rectangle-4.png'),
} as const;

const HG_5_8_SQ = {
  lower: require('../../../assets/Plan Images/HourGlass/Week 5-8/Square/Hourglass_week5-8_lower_square.png'),
  lower2: require('../../../assets/Plan Images/HourGlass/Week 5-8/Square/Hourglass_week5-8_lower2_square.png'),
  upper: require('../../../assets/Plan Images/HourGlass/Week 5-8/Square/Hourglass_week5-8_upper_square.png'),
  fullbody: require('../../../assets/Plan Images/HourGlass/Week 5-8/Square/Hourglass_week5-8_fullbody_square.png'),
  abs: require('../../../assets/Plan Images/HourGlass/Week 5-8/Square/Hourglass_week5-8_abs_square.png'),
  cardio: require('../../../assets/Plan Images/HourGlass/Week 5-8/Square/Hourglass_week5-8_cardio_square.png'),
} as const;

const HG_5_8_RECT = {
  lower: require('../../../assets/Plan Images/HourGlass/Week 5-8/Rectangle/Hourglass_week5-8_lower_rectangle.png'),
  upper: require('../../../assets/Plan Images/HourGlass/Week 5-8/Rectangle/Hourglass_week5-8_upper_rectangle.png'),
  upper1: require('../../../assets/Plan Images/HourGlass/Week 5-8/Rectangle/Hourglass_week5-8_upper_rectangle-1.png'),
  upper2: require('../../../assets/Plan Images/HourGlass/Week 5-8/Rectangle/Hourglass_week5-8_upper_rectangle-2.png'),
  upper3: require('../../../assets/Plan Images/HourGlass/Week 5-8/Rectangle/Hourglass_week5-8_upper_rectangle-3.png'),
  upper4: require('../../../assets/Plan Images/HourGlass/Week 5-8/Rectangle/Hourglass_week5-8_upper_rectangle-4.png'),
} as const;

const HG_9_12_SQ = {
  lower: require('../../../assets/Plan Images/HourGlass/Week 9-12/Square/Hourglass_week9-12_lower_square.png'),
  lower2: require('../../../assets/Plan Images/HourGlass/Week 9-12/Square/Hourglass_week9-12_lower2_square.png'),
  upper: require('../../../assets/Plan Images/HourGlass/Week 9-12/Square/Hourglass_week9-12_upper_square.png'),
  fullbody: require('../../../assets/Plan Images/HourGlass/Week 9-12/Square/Hourglass_week9-12_fullbody_square.png'),
  abs: require('../../../assets/Plan Images/HourGlass/Week 9-12/Square/Hourglass_week9-12_abs_square.png'),
  cardio: require('../../../assets/Plan Images/HourGlass/Week 9-12/Square/Hourglass_week9-12_cardio_square.png'),
} as const;

const HG_9_12_RECT = {
  lower: require('../../../assets/Plan Images/HourGlass/Week 9-12/Rectangle/Hourglass_week9-12_lower_rectangle.png'),
  upper: require('../../../assets/Plan Images/HourGlass/Week 9-12/Rectangle/Hourglass_week9-12_upper_rectangle.png'),
  upper1: require('../../../assets/Plan Images/HourGlass/Week 9-12/Rectangle/Hourglass_week9-12_upper_rectangle-1.png'),
  upper2: require('../../../assets/Plan Images/HourGlass/Week 9-12/Rectangle/Hourglass_week9-12_upper_rectangle-2.png'),
  upper3: require('../../../assets/Plan Images/HourGlass/Week 9-12/Rectangle/Hourglass_week9-12_upper_rectangle-3.png'),
  upper4: require('../../../assets/Plan Images/HourGlass/Week 9-12/Rectangle/Hourglass_week9-12_upper_rectangle-4.png'),
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// BOOTY
// ────────────────────────────────────────────────────────────────────────────────
// Filename quirk: W1-4 uses `glutes_hamstrings` (plural), W5-9 and W9-12 use
// `glutes_hamstring` (singular). The constant maps below paper over the typo.

const BOOTY_1_4_SQ = {
  glutes: require('../../../assets/Plan Images/Booty/Week 1-4/Square/Booty_week1-4_glutes_square.png'),
  glutes_hams: require('../../../assets/Plan Images/Booty/Week 1-4/Square/Booty_week1-4_glutes_hamstrings_square.png'),
  glutes_quads: require('../../../assets/Plan Images/Booty/Week 1-4/Square/Booty_week1-4_glutes_quads_square.png'),
  upper: require('../../../assets/Plan Images/Booty/Week 1-4/Square/Booty_week1-4_upper_square.png'),
  upper2: require('../../../assets/Plan Images/Booty/Week 1-4/Square/Booty_week1-4_upper2_square.png'),
  abs: require('../../../assets/Plan Images/Booty/Week 1-4/Square/Booty_week1-4_abs_square.png'),
} as const;

const BOOTY_1_4_RECT = {
  glutes: require('../../../assets/Plan Images/Booty/Week 1-4/Rectangle/Booty_week1-4_glutes_rectangle.png'),
  glutes_hams: require('../../../assets/Plan Images/Booty/Week 1-4/Rectangle/Booty_week1-4_glutes_hamstrings_rectangle.png'),
  glutes_quads: require('../../../assets/Plan Images/Booty/Week 1-4/Rectangle/Booty_week1-4_glutes_quads_rectangle.png'),
  upper: require('../../../assets/Plan Images/Booty/Week 1-4/Rectangle/Booty_week1-4_upper_rectangle.png'),
  upper2: require('../../../assets/Plan Images/Booty/Week 1-4/Rectangle/Booty_week1-4_upper2_rectangle.png'),
  abs: require('../../../assets/Plan Images/Booty/Week 1-4/Rectangle/Booty_week1-4_abs_rectangle.png'),
} as const;

const BOOTY_5_9_SQ = {
  glutes: require('../../../assets/Plan Images/Booty/Week 5-9/Square/Booty_week5-9_glutes_square.png'),
  glutes_hams: require('../../../assets/Plan Images/Booty/Week 5-9/Square/Booty_week5-9_glutes_hamstring_square.png'),
  glutes_quads: require('../../../assets/Plan Images/Booty/Week 5-9/Square/Booty_week5-9_glutes_quads_square.png'),
  upper: require('../../../assets/Plan Images/Booty/Week 5-9/Square/Booty_week5-9_upper_square.png'),
  upper2: require('../../../assets/Plan Images/Booty/Week 5-9/Square/Booty_week5-9_upper2_square.png'),
  abs: require('../../../assets/Plan Images/Booty/Week 5-9/Square/Booty_week5-9_abs_square.png'),
} as const;

const BOOTY_5_9_RECT = {
  glutes: require('../../../assets/Plan Images/Booty/Week 5-9/Rectangle/Booty_week5-9_glutes_rectangle.png'),
  glutes_hams: require('../../../assets/Plan Images/Booty/Week 5-9/Rectangle/Booty_week5-9_glutes_hamstring_rectangle.png'),
  glutes_quads: require('../../../assets/Plan Images/Booty/Week 5-9/Rectangle/Booty_week5-9_glutes_quads_rectangle.png'),
  upper: require('../../../assets/Plan Images/Booty/Week 5-9/Rectangle/Booty_week5-9_upper_rectangle.png'),
  upper2: require('../../../assets/Plan Images/Booty/Week 5-9/Rectangle/Booty_week5-9_upper2_rectangle.png'),
  abs: require('../../../assets/Plan Images/Booty/Week 5-9/Rectangle/Booty_week5-9_abs_rectangle.png'),
} as const;

const BOOTY_9_12_SQ = {
  glutes: require('../../../assets/Plan Images/Booty/Week 9-12/Square/Booty_week9-12_glutes_square.png'),
  glutes_hams: require('../../../assets/Plan Images/Booty/Week 9-12/Square/Booty_week9-12_glutes_hamstring_square.png'),
  glutes_quads: require('../../../assets/Plan Images/Booty/Week 9-12/Square/Booty_week9-12_glutes_quads_square.png'),
  upper: require('../../../assets/Plan Images/Booty/Week 9-12/Square/Booty_week9-12_upper_square.png'),
  upper2: require('../../../assets/Plan Images/Booty/Week 9-12/Square/Booty_week9-12_upper2_square.png'),
  abs: require('../../../assets/Plan Images/Booty/Week 9-12/Square/Booty_week9-12_abs_square.png'),
} as const;

const BOOTY_9_12_RECT = {
  glutes: require('../../../assets/Plan Images/Booty/Week 9-12/Rectangle/Booty_week9-12_glutes_rectangle.png'),
  glutes_hams: require('../../../assets/Plan Images/Booty/Week 9-12/Rectangle/Booty_week9-12_glutes_hamstring_rectangle.png'),
  glutes_quads: require('../../../assets/Plan Images/Booty/Week 9-12/Rectangle/Booty_week9-12_glutes_quads_rectangle.png'),
  upper: require('../../../assets/Plan Images/Booty/Week 9-12/Rectangle/Booty_week9-12_upper_rectangle.png'),
  upper2: require('../../../assets/Plan Images/Booty/Week 9-12/Rectangle/Booty_week9-12_upper2_rectangle.png'),
  abs: require('../../../assets/Plan Images/Booty/Week 9-12/Rectangle/Booty_week9-12_abs_rectangle.png'),
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// IT GIRL
// ════════════════════════════════════════════════════════════════════════════════

const IT_GIRL_1_4_SQ = {
  glutes_hams: require('../../../assets/Plan Images/It Girl/Week 1-4/Square/ItGirl_week1-4_glutes_hamstrings_square.png'),
  glutes_quads: require('../../../assets/Plan Images/It Girl/Week 1-4/Square/ItGirl_week1-4_glutes_quads_square.png'),
  upper: require('../../../assets/Plan Images/It Girl/Week 1-4/Square/ItGirl_week1-4_upper_square.png'),
  upper2: require('../../../assets/Plan Images/It Girl/Week 1-4/Square/ItGirl_week1-4_upper2_square.png'),
  abs: require('../../../assets/Plan Images/It Girl/Week 1-4/Square/ItGirl_week1-4_abs_square.png'),
  cardio: require('../../../assets/Plan Images/It Girl/Week 1-4/Square/ItGirl_week1-4_cardio_square.png'),
} as const;

const IT_GIRL_1_4_RECT = {
  glutes_hams: require('../../../assets/Plan Images/It Girl/Week 1-4/Rectangle/ItGirl_week1-4_glutes_hamstrings_rectangle.png'),
  glutes_quads: require('../../../assets/Plan Images/It Girl/Week 1-4/Rectangle/ItGirl_week1-4_glutes_quads_rectangle.png'),
  upper: require('../../../assets/Plan Images/It Girl/Week 1-4/Rectangle/ItGirl_week1-4_upper_rectangle.png'),
  upper2: require('../../../assets/Plan Images/It Girl/Week 1-4/Rectangle/ItGirl_week1-4_upper2_rectangle.png'),
  abs: require('../../../assets/Plan Images/It Girl/Week 1-4/Rectangle/ItGirl_week1-4_abs_rectangle.png'),
  cardio: require('../../../assets/Plan Images/It Girl/Week 1-4/Rectangle/ItGirl_week1-4_cardio_rectangle.png'),
} as const;

const IT_GIRL_5_9_SQ = {
  glutes_hams: require('../../../assets/Plan Images/It Girl/Week 5-9/Square/ItGirl_week5-9_glutes_hamstrings_square.png'),
  glutes_quads: require('../../../assets/Plan Images/It Girl/Week 5-9/Square/ItGirl_week5-9_glutes_quads_square.png'),
  upper: require('../../../assets/Plan Images/It Girl/Week 5-9/Square/ItGirl_week5-9_upper_square.png'),
  upper2: require('../../../assets/Plan Images/It Girl/Week 5-9/Square/ItGirl_week5-9_upper2_square.png'),
  abs: require('../../../assets/Plan Images/It Girl/Week 5-9/Square/ItGirl_week5-9_abs_square.png'),
  cardio: require('../../../assets/Plan Images/It Girl/Week 5-9/Square/ItGirl_week5-9_cardio_square.png'),
} as const;

const IT_GIRL_5_9_RECT = {
  glutes_hams: require('../../../assets/Plan Images/It Girl/Week 5-9/Rectangle/ItGirl_week5-9_glutes_hamstrings_rectangle.png'),
  glutes_quads: require('../../../assets/Plan Images/It Girl/Week 5-9/Rectangle/ItGirl_week5-9_glutes_quads_rectangle.png'),
  upper: require('../../../assets/Plan Images/It Girl/Week 5-9/Rectangle/ItGirl_week5-9_upper_rectangle.png'),
  upper2: require('../../../assets/Plan Images/It Girl/Week 5-9/Rectangle/ItGirl_week5-9_upper2_rectangle.png'),
  abs: require('../../../assets/Plan Images/It Girl/Week 5-9/Rectangle/ItGirl_week5-9_abs_rectangle.png'),
  cardio: require('../../../assets/Plan Images/It Girl/Week 5-9/Rectangle/ItGirl_week5-9_cardio_rectangle.png'),
} as const;

const IT_GIRL_9_12_SQ = {
  glutes_hams: require('../../../assets/Plan Images/It Girl/Week 9-12/Square/ItGirl_week9-12_glutes_hamstrings_square.png'),
  glutes_quads: require('../../../assets/Plan Images/It Girl/Week 9-12/Square/ItGirl_week9-12_glutes_quads_square.png'),
  upper: require('../../../assets/Plan Images/It Girl/Week 9-12/Square/ItGirl_week9-12_upper_square.png'),
  upper2: require('../../../assets/Plan Images/It Girl/Week 9-12/Square/ItGirl_week9-12_upper2_square.png'),
  abs: require('../../../assets/Plan Images/It Girl/Week 9-12/Square/ItGirl_week9-12_abs_square.png'),
  cardio: require('../../../assets/Plan Images/It Girl/Week 9-12/Square/ItGirl_week9-12_cardio_square.png'),
} as const;

const IT_GIRL_9_12_RECT = {
  glutes_hams: require('../../../assets/Plan Images/It Girl/Week 9-12/Rectangle/ItGirl_week9-12_glutes_hamstrings_rectangle.png'),
  glutes_quads: require('../../../assets/Plan Images/It Girl/Week 9-12/Rectangle/ItGirl_week9-12_glutes_quads_rectangle.png'),
  upper: require('../../../assets/Plan Images/It Girl/Week 9-12/Rectangle/ItGirl_week9-12_upper_rectangle.png'),
  upper2: require('../../../assets/Plan Images/It Girl/Week 9-12/Rectangle/ItGirl_week9-12_upper2_rectangle.png'),
  abs: require('../../../assets/Plan Images/It Girl/Week 9-12/Rectangle/ItGirl_week9-12_abs_rectangle.png'),
  cardio: require('../../../assets/Plan Images/It Girl/Week 9-12/Rectangle/ItGirl_week9-12_cardio_rectangle.png'),
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// MUSCLE MOMMY
// ════════════════════════════════════════════════════════════════════════════════

const MM_1_4_SQ = {
  glutes_abs: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Square/Musclemommy_week1-4_glutes_abs_square.png'),
  pull: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Square/Musclemommy_week1-4_pull_square.png'),
  lower: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Square/Musclemommy_week1-4_lower_square.png'),
  push: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Square/Musclemommy_week1-4_push_square.png'),
  fullbody: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Square/Musclemommy_week1-4_fullbody_square.png'),
  abs: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Square/Musclemommy_week1-4_abs_square.png'),
} as const;

const MM_1_4_RECT = {
  glutes_abs: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Rectangle/Musclemommy_week1-4_glutes_abs_rectangle.png'),
  pull: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Rectangle/Musclemommy_week1-4_pull_rectangle.png'),
  lower: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Rectangle/Musclemommy_week1-4_lower_rectangle.png'),
  push: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Rectangle/Musclemommy_week1-4_push_rectangle.png'),
  fullbody: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Rectangle/Musclemommy_week1-4_fullbody_rectangle.png'),
  abs: require('../../../assets/Plan Images/Muscle Mommy/Week 1-4/Rectangle/Musclemommy_week1-4_abs_rectangle.png'),
} as const;

const MM_5_9_SQ = {
  glutes_abs: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Square/Musclemommy_week5-9_glutes_abs_square.png'),
  pull: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Square/Musclemommy_week5-9_pull_square.png'),
  lower: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Square/Musclemommy_week5-9_lower_square.png'),
  push: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Square/Musclemommy_week5-9_push_square.png'),
  fullbody: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Square/Musclemommy_week5-9_fullbody_square.png'),
  abs: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Square/Musclemommy_week5-9_abs_square.png'),
} as const;

const MM_5_9_RECT = {
  glutes_abs: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Rectangle/Musclemommy_week5-9_glutes_abs_rectangle.png'),
  pull: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Rectangle/Musclemommy_week5-9_pull_rectangle.png'),
  lower: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Rectangle/Musclemommy_week5-9_lower_rectangle.png'),
  push: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Rectangle/Musclemommy_week5-9_push_rectangle.png'),
  fullbody: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Rectangle/Musclemommy_week5-9_fullbody_rectangle.png'),
  abs: require('../../../assets/Plan Images/Muscle Mommy/Week 5-9/Rectangle/Musclemommy_week5-9_abs_rectangle.png'),
} as const;

const MM_9_12_SQ = {
  glutes_abs: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Square/Musclemommy_week9-12_glutes_abs_square.png'),
  pull: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Square/Musclemommy_week9-12_pull_square.png'),
  lower: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Square/Musclemommy_week9-12_lower_square.png'),
  push: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Square/Musclemommy_week9-12_push_square.png'),
  fullbody: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Square/Musclemommy_week9-12_fullbody_square.png'),
  abs: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Square/Musclemommy_week9-12_abs_square.png'),
} as const;

const MM_9_12_RECT = {
  glutes_abs: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Rectangle/Musclemommy_week9-12_glutes_abs_rectangle.png'),
  pull: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Rectangle/Musclemommy_week9-12_pull_rectangle.png'),
  lower: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Rectangle/Musclemommy_week9-12_lower_rectangle.png'),
  push: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Rectangle/Musclemommy_week9-12_push_rectangle.png'),
  fullbody: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Rectangle/Musclemommy_week9-12_fullbody_rectangle.png'),
  abs: require('../../../assets/Plan Images/Muscle Mommy/Week 9-12/Rectangle/Musclemommy_week9-12_abs_rectangle.png'),
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// PILATES PRINCESS — only 8 weeks (W9-12 assets exist on disk but stay unbundled)
// ════════════════════════════════════════════════════════════════════════════════

const PP_1_4_SQ = {
  glutes: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Square/PilatesPrincess_week1-4_glutes_square.png'),
  glutes2: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Square/PilatesPrincess_week1-4_glutes2_square.png'),
  upper: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Square/PilatesPrincess_week1-4_upper_square.png'),
  pilates: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Square/PilatesPrincess_week1-4_pilates_square.png'),
  pilates2: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Square/PilatesPrincess_week1-4_pilates2_square.png'),
  abs: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Square/PilatesPrincess_week1-4_abs_square.png'),
  cardio: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Square/PilatesPrincess_week1-4_cardio_square.png'),
} as const;

const PP_1_4_RECT = {
  glutes: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Rectangle/PilatesPrincess_week1-4_glutes_rectangle.png'),
  glutes2: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Rectangle/PilatesPrincess_week1-4_glutes2_rectangle.png'),
  upper: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Rectangle/PilatesPrincess_week1-4_upper_rectangle.png'),
  pilates: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Rectangle/PilatesPrincess_week1-4_pilates_rectangle.png'),
  pilates2: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Rectangle/PilatesPrincess_week1-4_pilates2_rectangle.png'),
  abs: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Rectangle/PilatesPrincess_week1-4_abs_rectangle.png'),
  cardio: require('../../../assets/Plan Images/Pilates Princess/Week 1-4/Rectangle/PilatesPrincess_week1-4_cardio_rectangle.png'),
} as const;

const PP_5_9_SQ = {
  glutes: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Square/PilatesPrincess_week5-9_glutes_square.png'),
  glutes2: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Square/PilatesPrincess_week5-9_glutes2_square.png'),
  upper: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Square/PilatesPrincess_week5-9_upper_square.png'),
  pilates: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Square/PilatesPrincess_week5-9_pilates_square.png'),
  pilates2: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Square/PilatesPrincess_week5-9_pilates2_square.png'),
  abs: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Square/PilatesPrincess_week5-9_abs_square.png'),
  cardio: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Square/PilatesPrincess_week5-9_cardio_square.png'),
} as const;

const PP_5_9_RECT = {
  glutes: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Rectangle/PilatesPrincess_week5-9_glutes_rectangle.png'),
  glutes2: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Rectangle/PilatesPrincess_week5-9_glutes2_rectangle.png'),
  upper: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Rectangle/PilatesPrincess_week5-9_upper_rectangle.png'),
  pilates: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Rectangle/PilatesPrincess_week5-9_pilates_rectangle.png'),
  pilates2: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Rectangle/PilatesPrincess_week5-9_pilates2_rectangle.png'),
  abs: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Rectangle/PilatesPrincess_week5-9_abs_rectangle.png'),
  cardio: require('../../../assets/Plan Images/Pilates Princess/Week 5-9/Rectangle/PilatesPrincess_week5-9_cardio_rectangle.png'),
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// BUSY GIRL (3 categories: full · glutesAbs · upper)
// ════════════════════════════════════════════════════════════════════════════════

const BG_1_4_SQ = {
  full: require('../../../assets/Plan Images/Busy Girl/Week 1-4/Square/Busygirl_week1-4_full_square.png'),
  glutesAbs: require('../../../assets/Plan Images/Busy Girl/Week 1-4/Square/Busygirl_week1-4_glutes_abs_square.png'),
  upper: require('../../../assets/Plan Images/Busy Girl/Week 1-4/Square/Busygirl_week1-4_upper_square.png'),
} as const;

const BG_1_4_RECT = {
  full: require('../../../assets/Plan Images/Busy Girl/Week 1-4/Rectangle/Busygirl_week1-4_full_rectangle.png'),
  glutesAbs: require('../../../assets/Plan Images/Busy Girl/Week 1-4/Rectangle/Busygirl_week1-4_glutes_abs_rectangle.png'),
  upper: require('../../../assets/Plan Images/Busy Girl/Week 1-4/Rectangle/Busygirl_week1-4_upper_rectangle.png'),
} as const;

const BG_5_9_SQ = {
  full: require('../../../assets/Plan Images/Busy Girl/Week 5-9/Square/Busygirl_week5-9_full_square.png'),
  glutesAbs: require('../../../assets/Plan Images/Busy Girl/Week 5-9/Square/Busygirl_week5-9_glutes_abs_square.png'),
  upper: require('../../../assets/Plan Images/Busy Girl/Week 5-9/Square/Busygirl_week5-9_upper_square.png'),
} as const;

const BG_5_9_RECT = {
  full: require('../../../assets/Plan Images/Busy Girl/Week 5-9/Rectangle/Busygirl_week5-9_full_rectangle.png'),
  glutesAbs: require('../../../assets/Plan Images/Busy Girl/Week 5-9/Rectangle/Busygirl_week5-9_glutes_abs_rectangle.png'),
  upper: require('../../../assets/Plan Images/Busy Girl/Week 5-9/Rectangle/Busygirl_week5-9_upper_rectangle.png'),
} as const;

const BG_9_12_SQ = {
  full: require('../../../assets/Plan Images/Busy Girl/Week 9-12/Square/Busygirl_week9-12_full_square.png'),
  glutesAbs: require('../../../assets/Plan Images/Busy Girl/Week 9-12/Square/Busygirl_week9-12_glutes_abs_square.png'),
  upper: require('../../../assets/Plan Images/Busy Girl/Week 9-12/Square/Busygirl_week9-12_upper_square.png'),
} as const;

const BG_9_12_RECT = {
  full: require('../../../assets/Plan Images/Busy Girl/Week 9-12/Rectangle/Busygirl_week9-12_full_rectangle.png'),
  glutesAbs: require('../../../assets/Plan Images/Busy Girl/Week 9-12/Rectangle/Busygirl_week9-12_glutes_abs_rectangle.png'),
  upper: require('../../../assets/Plan Images/Busy Girl/Week 9-12/Rectangle/Busygirl_week9-12_upper_rectangle.png'),
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// HOME (5 categories: glutes · absCardio · upper · absCardio2 · lowerbody)
// ════════════════════════════════════════════════════════════════════════════════

const HM_1_4_SQ = {
  glutes: require('../../../assets/Plan Images/Home/Week 1-4/Square/Home_week1-4_glutes_square.png'),
  absCardio: require('../../../assets/Plan Images/Home/Week 1-4/Square/Home_week1-4_abs_cardio_square.png'),
  upper: require('../../../assets/Plan Images/Home/Week 1-4/Square/Home_week1-4_upper_square.png'),
  absCardio2: require('../../../assets/Plan Images/Home/Week 1-4/Square/Home_week1-4_abs_cardio2_square.png'),
  lowerbody: require('../../../assets/Plan Images/Home/Week 1-4/Square/Home_week1-4_lowerbody_square.png'),
} as const;

const HM_1_4_RECT = {
  glutes: require('../../../assets/Plan Images/Home/Week 1-4/Rectangle/Home_week1-4_glutes_rectangle.png'),
  absCardio: require('../../../assets/Plan Images/Home/Week 1-4/Rectangle/Home_week1-4_abs_cardio_rectangle.png'),
  upper: require('../../../assets/Plan Images/Home/Week 1-4/Rectangle/Home_week1-4_upper_rectangle.png'),
  absCardio2: require('../../../assets/Plan Images/Home/Week 1-4/Rectangle/Home_week1-4_abs_cardio2_rectangle.png'),
  lowerbody: require('../../../assets/Plan Images/Home/Week 1-4/Rectangle/Home_week1-4_lowerbody_rectangle.png'),
} as const;

const HM_5_9_SQ = {
  glutes: require('../../../assets/Plan Images/Home/Week 5-9/Square/Home_week5-9_glutes_square.png'),
  absCardio: require('../../../assets/Plan Images/Home/Week 5-9/Square/Home_week5-9_abs_cardio_square.png'),
  upper: require('../../../assets/Plan Images/Home/Week 5-9/Square/Home_week5-9_upper_square.png'),
  absCardio2: require('../../../assets/Plan Images/Home/Week 5-9/Square/Home_week5-9_abs_cardio2_square.png'),
  lowerbody: require('../../../assets/Plan Images/Home/Week 5-9/Square/Home_week5-9_lowerbody_square.png'),
} as const;

const HM_5_9_RECT = {
  glutes: require('../../../assets/Plan Images/Home/Week 5-9/Rectangle/Home_week5-9_glutes_rectangle.png'),
  absCardio: require('../../../assets/Plan Images/Home/Week 5-9/Rectangle/Home_week5-9_abs_cardio_rectangle.png'),
  upper: require('../../../assets/Plan Images/Home/Week 5-9/Rectangle/Home_week5-9_upper_rectangle.png'),
  absCardio2: require('../../../assets/Plan Images/Home/Week 5-9/Rectangle/Home_week5-9_abs_cardio2_rectangle.png'),
  lowerbody: require('../../../assets/Plan Images/Home/Week 5-9/Rectangle/Home_week5-9_lowerbody_rectangle.png'),
} as const;

const HM_9_12_SQ = {
  glutes: require('../../../assets/Plan Images/Home/Week 9-12/Square/Home_week9-12_glutes_square.png'),
  absCardio: require('../../../assets/Plan Images/Home/Week 9-12/Square/Home_week9-12_abs_cardio_square.png'),
  upper: require('../../../assets/Plan Images/Home/Week 9-12/Square/Home_week9-12_upper_square.png'),
  absCardio2: require('../../../assets/Plan Images/Home/Week 9-12/Square/Home_week9-12_abs_cardio2_square.png'),
  lowerbody: require('../../../assets/Plan Images/Home/Week 9-12/Square/Home_week9-12_lowerbody_square.png'),
} as const;

const HM_9_12_RECT = {
  glutes: require('../../../assets/Plan Images/Home/Week 9-12/Rectangle/Home_week9-12_glutes_rectangle.png'),
  absCardio: require('../../../assets/Plan Images/Home/Week 9-12/Rectangle/Home_week9-12_abs_cardio_rectangle.png'),
  upper: require('../../../assets/Plan Images/Home/Week 9-12/Rectangle/Home_week9-12_upper_rectangle.png'),
  absCardio2: require('../../../assets/Plan Images/Home/Week 9-12/Rectangle/Home_week9-12_abs_cardio2_rectangle.png'),
  lowerbody: require('../../../assets/Plan Images/Home/Week 9-12/Rectangle/Home_week9-12_lowerbody_rectangle.png'),
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// SUMMER BODY (6 categories: glutesAbs · upperBack · glutesHams · upper · quadsAbs · cardio)
// ════════════════════════════════════════════════════════════════════════════════

const SB_1_4_SQ = {
  glutesAbs: require('../../../assets/Plan Images/Summer Body/Week 1-4/Square/Summerbody_week1-4_glutes_abs_square.png'),
  upperBack: require('../../../assets/Plan Images/Summer Body/Week 1-4/Square/Summerbody_week1-4_upper(backfocus)_square.png'),
  glutesHams: require('../../../assets/Plan Images/Summer Body/Week 1-4/Square/Summerbody_week1-4_glutes_hamstrings_square.png'),
  upper: require('../../../assets/Plan Images/Summer Body/Week 1-4/Square/Summerbody_week1-4_upper_square.png'),
  quadsAbs: require('../../../assets/Plan Images/Summer Body/Week 1-4/Square/Summerbody_week1-4_quads_abs_square.png'),
  cardio: require('../../../assets/Plan Images/Summer Body/Week 1-4/Square/Summerbody_week1-4_cardio_square.png'),
} as const;

const SB_1_4_RECT = {
  glutesAbs: require('../../../assets/Plan Images/Summer Body/Week 1-4/Rectangle/Summerbody_week1-4_glutes_abs_rectangle.png'),
  upperBack: require('../../../assets/Plan Images/Summer Body/Week 1-4/Rectangle/Summerbody_week1-4_upper(backfocus)_rectangle.png'),
  glutesHams: require('../../../assets/Plan Images/Summer Body/Week 1-4/Rectangle/Summerbody_week1-4_glutes_hamstrings_rectangle.png'),
  upper: require('../../../assets/Plan Images/Summer Body/Week 1-4/Rectangle/Summerbody_week1-4_upper_rectangle.png'),
  quadsAbs: require('../../../assets/Plan Images/Summer Body/Week 1-4/Rectangle/Summerbody_week1-4_quads_abs_rectangle.png'),
  cardio: require('../../../assets/Plan Images/Summer Body/Week 1-4/Rectangle/Summerbody_week1-4_cardio_rectangle.png'),
} as const;

const SB_5_9_SQ = {
  glutesAbs: require('../../../assets/Plan Images/Summer Body/Week 5-9/Square/Summerbody_week5-9_glutes_abs_square.png'),
  upperBack: require('../../../assets/Plan Images/Summer Body/Week 5-9/Square/Summerbody_week5-9_upper(backfocus)_square.png'),
  glutesHams: require('../../../assets/Plan Images/Summer Body/Week 5-9/Square/Summerbody_week5-9_glutes_hamstrings_square.png'),
  upper: require('../../../assets/Plan Images/Summer Body/Week 5-9/Square/Summerbody_week5-9_upper_square.png'),
  quadsAbs: require('../../../assets/Plan Images/Summer Body/Week 5-9/Square/Summerbody_week5-9_quads_abs_square.png'),
  cardio: require('../../../assets/Plan Images/Summer Body/Week 5-9/Square/Summerbody_week5-9_cardio_square.png'),
} as const;

const SB_5_9_RECT = {
  glutesAbs: require('../../../assets/Plan Images/Summer Body/Week 5-9/Rectangle/Summerbody_week5-9_glutes_abs_rectangle.png'),
  upperBack: require('../../../assets/Plan Images/Summer Body/Week 5-9/Rectangle/Summerbody_week5-9_upper(backfocus)_rectangle.png'),
  glutesHams: require('../../../assets/Plan Images/Summer Body/Week 5-9/Rectangle/Summerbody_week5-9_glutes_hamstrings_rectangle.png'),
  upper: require('../../../assets/Plan Images/Summer Body/Week 5-9/Rectangle/Summerbody_week5-9_upper_rectangle.png'),
  quadsAbs: require('../../../assets/Plan Images/Summer Body/Week 5-9/Rectangle/Summerbody_week5-9_quads_abs_rectangle.png'),
  cardio: require('../../../assets/Plan Images/Summer Body/Week 5-9/Rectangle/Summerbody_week5-9_cardio_rectangle.png'),
} as const;

const SB_9_12_SQ = {
  glutesAbs: require('../../../assets/Plan Images/Summer Body/Week 9-12/Square/Summerbody_week9-12_glutes_abs_square.png'),
  upperBack: require('../../../assets/Plan Images/Summer Body/Week 9-12/Square/Summerbody_week9-12_upper(backfocus)_square.png'),
  glutesHams: require('../../../assets/Plan Images/Summer Body/Week 9-12/Square/Summerbody_week9-12_glutes_hamstrings_square.png'),
  upper: require('../../../assets/Plan Images/Summer Body/Week 9-12/Square/Summerbody_week9-12_upper_square.png'),
  quadsAbs: require('../../../assets/Plan Images/Summer Body/Week 9-12/Square/Summerbody_week9-12_quads_abs_square.png'),
  cardio: require('../../../assets/Plan Images/Summer Body/Week 9-12/Square/Summerbody_week9-12_cardio_square.png'),
} as const;

const SB_9_12_RECT = {
  glutesAbs: require('../../../assets/Plan Images/Summer Body/Week 9-12/Rectangle/Summerbody_week9-12_glutes_abs_rectangle.png'),
  upperBack: require('../../../assets/Plan Images/Summer Body/Week 9-12/Rectangle/Summerbody_week9-12_upper(backfocus)_rectangle.png'),
  glutesHams: require('../../../assets/Plan Images/Summer Body/Week 9-12/Rectangle/Summerbody_week9-12_glutes_hamstrings_rectangle.png'),
  upper: require('../../../assets/Plan Images/Summer Body/Week 9-12/Rectangle/Summerbody_week9-12_upper_rectangle.png'),
  quadsAbs: require('../../../assets/Plan Images/Summer Body/Week 9-12/Rectangle/Summerbody_week9-12_quads_abs_rectangle.png'),
  cardio: require('../../../assets/Plan Images/Summer Body/Week 9-12/Rectangle/Summerbody_week9-12_cardio_rectangle.png'),
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// PARSERS
// ════════════════════════════════════════════════════════════════════════════════

type ParsedId = { week: number; day: number; sub: string };

function parseId(id: string, prefix: string): ParsedId | null {
  const re = new RegExp(`^${prefix}-w(\\d+)-d(\\d+)-(.+)$`);
  const m = id.match(re);
  if (!m) return null;
  return { week: parseInt(m[1], 10), day: parseInt(m[2], 10), sub: m[3] };
}

// ════════════════════════════════════════════════════════════════════════════════
// HOURGLASS LOOKUP (unchanged behaviour)
// ════════════════════════════════════════════════════════════════════════════════

function getHourglassSq(week: number) {
  if (week <= 4) return HG_1_4_SQ;
  if (week <= 8) return HG_5_8_SQ;
  return HG_9_12_SQ;
}
function getHourglassRect(week: number) {
  if (week <= 4) return HG_1_4_RECT;
  if (week <= 8) return HG_5_8_RECT;
  return HG_9_12_RECT;
}

function getHourglassSquare(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'hourglass');
  if (!p) return null;
  const sq = getHourglassSq(p.week);
  if (p.sub === 'abs') return sq.abs;
  if (p.sub === 'cardio') return sq.cardio;
  if (p.sub === 'main') {
    if (p.day === 1) return sq.lower;
    if (p.day === 2) return sq.upper;
    if (p.day === 3) return sq.lower2;
    if (p.day === 4) return sq.fullbody;
  }
  return null;
}

function getHourglassRectangle(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'hourglass');
  if (!p) return null;
  const rect = getHourglassRect(p.week);
  // Hourglass doesn't ship dedicated rectangle assets for abs/cardio sub-workouts.
  // Fall back to the day's main rectangle so every workout still has a hero image.
  if (p.day === 1) return rect.lower;
  if (p.day === 2) return rect.upper;
  if (p.day === 3) return rect.lower;
  if (p.day === 4) return rect.upper4;
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════
// BOOTY LOOKUP
// d1 glutes · d2 upper · d3 glutes_hams · d4 upper2 · d5 glutes_quads
// ════════════════════════════════════════════════════════════════════════════════

function getBootySq(week: number) {
  if (week <= 4) return BOOTY_1_4_SQ;
  if (week <= 8) return BOOTY_5_9_SQ;
  return BOOTY_9_12_SQ;
}
function getBootyRect(week: number) {
  if (week <= 4) return BOOTY_1_4_RECT;
  if (week <= 8) return BOOTY_5_9_RECT;
  return BOOTY_9_12_RECT;
}

function bootyKeyForDay(day: number): keyof typeof BOOTY_1_4_SQ | null {
  if (day === 1) return 'glutes';
  if (day === 2) return 'upper';
  if (day === 3) return 'glutes_hams';
  if (day === 4) return 'upper2';
  if (day === 5) return 'glutes_quads';
  return null;
}

function getBootySquare(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'booty');
  if (!p) return null;
  const sq = getBootySq(p.week);
  if (p.sub === 'abs') return sq.abs;
  if (p.sub === 'main') {
    const k = bootyKeyForDay(p.day);
    return k ? sq[k] : null;
  }
  return null;
}

function getBootyRectangle(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'booty');
  if (!p) return null;
  const rect = getBootyRect(p.week);
  if (p.sub === 'abs') return rect.abs;
  if (p.sub === 'main') {
    const k = bootyKeyForDay(p.day);
    return k ? rect[k] : null;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════
// IT GIRL LOOKUP
// d1 glutes_hams · d2 upper · d3 glutes_quads · d4 upper2 · d5 cardio (abs_cardio-only)
// ════════════════════════════════════════════════════════════════════════════════

function getItGirlSq(week: number) {
  if (week <= 4) return IT_GIRL_1_4_SQ;
  if (week <= 8) return IT_GIRL_5_9_SQ;
  return IT_GIRL_9_12_SQ;
}
function getItGirlRect(week: number) {
  if (week <= 4) return IT_GIRL_1_4_RECT;
  if (week <= 8) return IT_GIRL_5_9_RECT;
  return IT_GIRL_9_12_RECT;
}

function itGirlKeyForDay(day: number): keyof typeof IT_GIRL_1_4_SQ | null {
  if (day === 1) return 'glutes_hams';
  if (day === 2) return 'upper';
  if (day === 3) return 'glutes_quads';
  if (day === 4) return 'upper2';
  if (day === 5) return 'cardio';
  return null;
}

function getItGirlSquare(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'it-girl');
  if (!p) return null;
  const sq = getItGirlSq(p.week);
  if (p.sub === 'abs') return sq.abs;
  if (p.sub === 'cardio') return sq.cardio;
  if (p.sub === 'main') {
    const k = itGirlKeyForDay(p.day);
    return k ? sq[k] : null;
  }
  return null;
}

function getItGirlRectangle(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'it-girl');
  if (!p) return null;
  const rect = getItGirlRect(p.week);
  if (p.sub === 'abs') return rect.abs;
  if (p.sub === 'cardio') return rect.cardio;
  if (p.sub === 'main') {
    const k = itGirlKeyForDay(p.day);
    return k ? rect[k] : null;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════
// MUSCLE MOMMY LOOKUP
// d1 glutes_abs · d2 pull · d3 lower · d4 push · d5 fullbody
// ════════════════════════════════════════════════════════════════════════════════

function getMMSq(week: number) {
  if (week <= 4) return MM_1_4_SQ;
  if (week <= 8) return MM_5_9_SQ;
  return MM_9_12_SQ;
}
function getMMRect(week: number) {
  if (week <= 4) return MM_1_4_RECT;
  if (week <= 8) return MM_5_9_RECT;
  return MM_9_12_RECT;
}

function mmKeyForDay(day: number): keyof typeof MM_1_4_SQ | null {
  if (day === 1) return 'glutes_abs';
  if (day === 2) return 'pull';
  if (day === 3) return 'lower';
  if (day === 4) return 'push';
  if (day === 5) return 'fullbody';
  return null;
}

function getMuscleMommySquare(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'muscle-mommy');
  if (!p) return null;
  const sq = getMMSq(p.week);
  if (p.sub === 'abs') return sq.abs;
  if (p.sub === 'main') {
    const k = mmKeyForDay(p.day);
    return k ? sq[k] : null;
  }
  return null;
}

function getMuscleMommyRectangle(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'muscle-mommy');
  if (!p) return null;
  const rect = getMMRect(p.week);
  if (p.sub === 'abs') return rect.abs;
  if (p.sub === 'main') {
    const k = mmKeyForDay(p.day);
    return k ? rect[k] : null;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════
// PILATES PRINCESS LOOKUP (8 weeks total)
// d1 glutes · d2 pilates · d3 upper · d4 glutes2 · d5 pilates2
// ════════════════════════════════════════════════════════════════════════════════

function getPPSq(week: number) {
  if (week <= 4) return PP_1_4_SQ;
  return PP_5_9_SQ;
}
function getPPRect(week: number) {
  if (week <= 4) return PP_1_4_RECT;
  return PP_5_9_RECT;
}

function ppKeyForDay(day: number): keyof typeof PP_1_4_SQ | null {
  if (day === 1) return 'glutes';
  if (day === 2) return 'pilates';
  if (day === 3) return 'upper';
  if (day === 4) return 'glutes2';
  if (day === 5) return 'pilates2';
  return null;
}

function getPilatesPrincessSquare(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'pilates-princess');
  if (!p) return null;
  const sq = getPPSq(p.week);
  if (p.sub === 'abs') return sq.abs;
  if (p.sub === 'cardio') return sq.cardio;
  if (p.sub === 'main') {
    const k = ppKeyForDay(p.day);
    return k ? sq[k] : null;
  }
  return null;
}

function getPilatesPrincessRectangle(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'pilates-princess');
  if (!p) return null;
  const rect = getPPRect(p.week);
  if (p.sub === 'abs') return rect.abs;
  if (p.sub === 'cardio') return rect.cardio;
  if (p.sub === 'main') {
    const k = ppKeyForDay(p.day);
    return k ? rect[k] : null;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════
// BUSY GIRL LOOKUP (8 weeks · d1 glutes_abs · d2 upper · d3 full)
// ════════════════════════════════════════════════════════════════════════════════

function getBusyGirlSq(week: number) {
  if (week <= 4) return BG_1_4_SQ;
  if (week <= 9) return BG_5_9_SQ;
  return BG_9_12_SQ;
}
function getBusyGirlRect(week: number) {
  if (week <= 4) return BG_1_4_RECT;
  if (week <= 9) return BG_5_9_RECT;
  return BG_9_12_RECT;
}

function busyGirlKeyForDay(day: number): keyof typeof BG_1_4_SQ | null {
  if (day === 1) return 'glutesAbs';
  if (day === 2) return 'upper';
  if (day === 3) return 'full';
  return null;
}

function getBusyGirlSquare(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'busy-girl');
  if (!p) return null;
  const sq = getBusyGirlSq(p.week);
  if (p.sub === 'main') {
    const k = busyGirlKeyForDay(p.day);
    return k ? sq[k] : null;
  }
  return null;
}

function getBusyGirlRectangle(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'busy-girl');
  if (!p) return null;
  const rect = getBusyGirlRect(p.week);
  if (p.sub === 'main') {
    const k = busyGirlKeyForDay(p.day);
    return k ? rect[k] : null;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════
// HOME LOOKUP (8 weeks · d1 glutes · d2 abs_cardio · d3 upper · d4 abs_cardio2 · d5 lowerbody)
// Cardio sub-workouts on d2/d4 reuse the day's main image (no standalone cardio art).
// ════════════════════════════════════════════════════════════════════════════════

function getHomeSq(week: number) {
  if (week <= 4) return HM_1_4_SQ;
  if (week <= 9) return HM_5_9_SQ;
  return HM_9_12_SQ;
}
function getHomeRect(week: number) {
  if (week <= 4) return HM_1_4_RECT;
  if (week <= 9) return HM_5_9_RECT;
  return HM_9_12_RECT;
}

function homeKeyForDay(day: number): keyof typeof HM_1_4_SQ | null {
  if (day === 1) return 'glutes';
  if (day === 2) return 'absCardio';
  if (day === 3) return 'upper';
  if (day === 4) return 'absCardio2';
  if (day === 5) return 'lowerbody';
  return null;
}

function getHomeSquare(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'home');
  if (!p) return null;
  const sq = getHomeSq(p.week);
  if (p.sub === 'main' || p.sub === 'cardio') {
    const k = homeKeyForDay(p.day);
    return k ? sq[k] : null;
  }
  return null;
}

function getHomeRectangle(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'home');
  if (!p) return null;
  const rect = getHomeRect(p.week);
  if (p.sub === 'main' || p.sub === 'cardio') {
    const k = homeKeyForDay(p.day);
    return k ? rect[k] : null;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════
// SUMMER BODY LOOKUP (12 weeks · d1 glutes_abs · d2 upper(back) · d3 glutes_hams ·
// d4 upper · d5 quads_abs · d6 cardio)
// Cardio sub-workouts on d2/d4 use the dedicated cardio image.
// ════════════════════════════════════════════════════════════════════════════════

function getSummerBodySq(week: number) {
  if (week <= 4) return SB_1_4_SQ;
  if (week <= 9) return SB_5_9_SQ;
  return SB_9_12_SQ;
}
function getSummerBodyRect(week: number) {
  if (week <= 4) return SB_1_4_RECT;
  if (week <= 9) return SB_5_9_RECT;
  return SB_9_12_RECT;
}

function summerBodyKeyForDay(day: number): keyof typeof SB_1_4_SQ | null {
  if (day === 1) return 'glutesAbs';
  if (day === 2) return 'upperBack';
  if (day === 3) return 'glutesHams';
  if (day === 4) return 'upper';
  if (day === 5) return 'quadsAbs';
  if (day === 6) return 'cardio';
  return null;
}

function getSummerBodySquare(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'summer-body');
  if (!p) return null;
  const sq = getSummerBodySq(p.week);
  if (p.sub === 'cardio') return sq.cardio;
  if (p.sub === 'main') {
    const k = summerBodyKeyForDay(p.day);
    return k ? sq[k] : null;
  }
  return null;
}

function getSummerBodyRectangle(id: string): ImageSourcePropType | null {
  const p = parseId(id, 'summer-body');
  if (!p) return null;
  const rect = getSummerBodyRect(p.week);
  if (p.sub === 'cardio') return rect.cardio;
  if (p.sub === 'main') {
    const k = summerBodyKeyForDay(p.day);
    return k ? rect[k] : null;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════════════════
// PUBLIC API — dispatch by plan ID prefix
// ════════════════════════════════════════════════════════════════════════════════

/** Square image for calendar/list view thumbnail. */
export function getPlanSquareImage(programWorkoutId: string): ImageSourcePropType | null {
  if (programWorkoutId.startsWith('hourglass-')) return getHourglassSquare(programWorkoutId);
  if (programWorkoutId.startsWith('booty-')) return getBootySquare(programWorkoutId);
  if (programWorkoutId.startsWith('it-girl-')) return getItGirlSquare(programWorkoutId);
  if (programWorkoutId.startsWith('muscle-mommy-')) return getMuscleMommySquare(programWorkoutId);
  if (programWorkoutId.startsWith('pilates-princess-'))
    return getPilatesPrincessSquare(programWorkoutId);
  if (programWorkoutId.startsWith('busy-girl-')) return getBusyGirlSquare(programWorkoutId);
  if (programWorkoutId.startsWith('home-')) return getHomeSquare(programWorkoutId);
  if (programWorkoutId.startsWith('summer-body-')) return getSummerBodySquare(programWorkoutId);
  return null;
}

/** Rectangle image for workout preview hero card. */
export function getPlanRectangleImage(programWorkoutId: string): ImageSourcePropType | null {
  if (programWorkoutId.startsWith('hourglass-')) return getHourglassRectangle(programWorkoutId);
  if (programWorkoutId.startsWith('booty-')) return getBootyRectangle(programWorkoutId);
  if (programWorkoutId.startsWith('it-girl-')) return getItGirlRectangle(programWorkoutId);
  if (programWorkoutId.startsWith('muscle-mommy-'))
    return getMuscleMommyRectangle(programWorkoutId);
  if (programWorkoutId.startsWith('pilates-princess-'))
    return getPilatesPrincessRectangle(programWorkoutId);
  if (programWorkoutId.startsWith('busy-girl-')) return getBusyGirlRectangle(programWorkoutId);
  if (programWorkoutId.startsWith('home-')) return getHomeRectangle(programWorkoutId);
  if (programWorkoutId.startsWith('summer-body-')) return getSummerBodyRectangle(programWorkoutId);
  return null;
}
