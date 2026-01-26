/**
 * Align Design System
 *
 * Use these values for consistent styling across the app.
 * Import with: import { colors, fonts, spacing } from '@/constants/theme';
 */

// Main color palette
export const colors = {
  // Primary brand color (purple)
  primary: '#947AFF',
  primaryLight: '#B8A8FF',
  primaryDark: '#7559E6',

  // Backgrounds
  background: '#FFFFFF',
  backgroundOnboarding: '#FAFAFA', // Light gray for onboarding screens
  surface: '#F5F5F5',
  surfaceSecondary: '#FAFAFA',

  // Card backgrounds (use with cardStroke for containers)
  card: '#F5F4FA',
  cardStroke: '#FFFFFF',

  // Text
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  // UI elements
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  divider: '#EEEEEE',

  // Feedback
  error: '#FF4444',
  errorLight: '#FFE5E5',
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FFA726',
  warningLight: '#FFF3E0',

  // Workout type colors (for calendar dots and labels)
  workout: {
    legs: '#FF6B9D',
    arms: '#64B5F6',
    back: '#81C784',
    chest: '#FFB74D',
    shoulders: '#BA68C8',
    core: '#4DD0E1',
    cardio: '#FF8A65',
    fullBody: '#947AFF',
    rest: '#BDBDBD',
  },
} as const;

// Font family names (must match the font file names in assets/fonts)
export const fonts = {
  regular: 'Quicksand-Regular',
  medium: 'Quicksand-Medium',
  semiBold: 'Quicksand-SemiBold',
  bold: 'Quicksand-Bold',
  // Display font for logo/headings
  canela: 'Canela-Medium',
} as const;

// Consistent spacing scale (in pixels)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius values
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Shadow styles (for cards, buttons, etc.)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/**
 * Container Styles
 *
 * Screen backgrounds:
 * - Primary screens (Planner, Workout tabs): #FFFFFF (colors.background)
 * - Secondary screens (Profile, Schedule Workout, modals): #FAFAFA (colors.surfaceSecondary)
 *
 * Card containers:
 * - Background: #F5F4FA
 * - Border: 2px solid #FFFFFF (pure white stroke)
 * - Border radius: 16px
 *
 * Dividers inside cards:
 * - Height: 1px
 * - Color: rgba(217, 217, 217, 0.25)
 * - Horizontal margin: spacing.sm (8px) on each side
 */

// Common card style - use for all containers across the app
export const cardStyle = {
  backgroundColor: '#F5F4FA',
  borderWidth: 2,
  borderColor: '#FFFFFF',
  borderRadius: 16,
} as const;

// Divider style for use inside cards
export const dividerStyle = {
  height: 1,
  backgroundColor: 'rgba(217, 217, 217, 0.25)',
} as const;
