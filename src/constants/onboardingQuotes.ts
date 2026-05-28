import { ImageSourcePropType } from 'react-native';

// Decoy quotes shown during the flicker animation. The user CAN see these
// flash past, but the screen will never lock onto one of these.
export const ONBOARDING_QUOTE_FILLERS: ImageSourcePropType[] = [
  require('../../assets/quotes/filler-1.png'),
  require('../../assets/quotes/filler-2.png'),
  require('../../assets/quotes/filler-3.png'),
  require('../../assets/quotes/filler-4.png'),
  require('../../assets/quotes/filler-5.png'),
  require('../../assets/quotes/filler-6.png'),
  require('../../assets/quotes/filler-7.png'),
  require('../../assets/quotes/filler-8.png'),
  require('../../assets/quotes/filler-9.png'),
  require('../../assets/quotes/filler-10.png'),
  require('../../assets/quotes/filler-11.png'),
  require('../../assets/quotes/filler-12.png'),
  require('../../assets/quotes/filler-13.png'),
  require('../../assets/quotes/filler-14.png'),
  require('../../assets/quotes/filler-15.png'),
  require('../../assets/quotes/filler-16.png'),
  require('../../assets/quotes/filler-17.png'),
  require('../../assets/quotes/filler-18.png'),
  require('../../assets/quotes/filler-19.png'),
  require('../../assets/quotes/filler-20.png'),
  require('../../assets/quotes/filler-21.png'),
  require('../../assets/quotes/filler-22.png'),
];

// Curated quotes the user can actually receive. Tapping the flicker screen
// locks onto a random pick from this list.
export const ONBOARDING_QUOTE_FINALS: ImageSourcePropType[] = [
  require('../../assets/quotes/final-1.png'),
  require('../../assets/quotes/final-2.png'),
  require('../../assets/quotes/final-3.png'),
  require('../../assets/quotes/final-4.png'),
  require('../../assets/quotes/final-5.png'),
  require('../../assets/quotes/final-6.png'),
  require('../../assets/quotes/final-7.png'),
  require('../../assets/quotes/final-8.png'),
  require('../../assets/quotes/final-9.png'),
];

// Full pool used during the flicker animation only. Fillers + finals together
// so the cycle looks varied; the lock-in pick is still constrained to FINALS.
export const ONBOARDING_QUOTE_POOL: ImageSourcePropType[] = [
  ...ONBOARDING_QUOTE_FILLERS,
  ...ONBOARDING_QUOTE_FINALS,
];
