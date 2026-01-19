// Unit conversion utilities
// All weights are stored in kg in the database
// All heights are stored in cm in the database
// Convert to/from imperial for display based on user preference

const KG_TO_LBS = 2.20462;
const CM_TO_INCHES = 0.393701;
const INCHES_TO_CM = 2.54;

export type UnitSystem = 'metric' | 'imperial';

// ===== WEIGHT CONVERSIONS =====

// Convert kg to lbs (rounded to 1 decimal)
export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

// Convert lbs to kg (rounded to 1 decimal)
export function lbsToKg(lbs: number): number {
  return Math.round((lbs / KG_TO_LBS) * 10) / 10;
}

// ===== HEIGHT CONVERSIONS =====

// Convert cm to total inches
export function cmToInches(cm: number): number {
  return Math.round(cm * CM_TO_INCHES);
}

// Convert inches to cm
export function inchesToCm(inches: number): number {
  return Math.round(inches * INCHES_TO_CM);
}

// Convert cm to feet and inches { feet, inches }
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cmToInches(cm);
  return {
    feet: Math.floor(totalInches / 12),
    inches: totalInches % 12,
  };
}

// Convert feet and inches to cm
export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}

// Format weight for display based on user's unit preference
export function formatWeight(kg: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${kg} kg`;
}

// Format weight with just the number (no unit label)
export function formatWeightValue(kg: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${kgToLbs(kg)}`;
  }
  return `${kg}`;
}

// Get the unit label
export function getWeightUnit(units: UnitSystem): string {
  return units === 'imperial' ? 'lbs' : 'kg';
}

// Convert user input to kg for storage
export function toKgForStorage(value: number, units: UnitSystem): number {
  if (units === 'imperial') {
    return lbsToKg(value);
  }
  return value;
}

// Convert kg from storage to display value
export function fromKgForDisplay(kg: number, units: UnitSystem): number {
  if (units === 'imperial') {
    return kgToLbs(kg);
  }
  return kg;
}

// Format previous set display: "60 x 8" or "132.3 x 8"
export function formatPreviousSet(weightKg: number, reps: number, units: UnitSystem): string {
  const weight = units === 'imperial' ? kgToLbs(weightKg) : weightKg;
  return `${weight} x ${reps}`;
}

// ===== HEIGHT FORMATTING =====

// Format height for display based on user's unit preference
export function formatHeight(cm: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}ft ${inches}in`;
  }
  return `${cm} cm`;
}

// Convert height input to cm for storage
export function toCmForStorage(value: number, units: UnitSystem): number {
  if (units === 'imperial') {
    return inchesToCm(value);
  }
  return value;
}

// Convert cm from storage to display value (total inches or cm)
export function fromCmForDisplay(cm: number, units: UnitSystem): number {
  if (units === 'imperial') {
    return cmToInches(cm);
  }
  return cm;
}

// Get height unit label
export function getHeightUnit(units: UnitSystem): string {
  return units === 'imperial' ? 'ft' : 'cm';
}

// ===== INPUT FILTERING =====

/**
 * Filter input to only allow numeric characters (digits and optional decimal point).
 * Use this in TextInput onChangeText to prevent letters from being entered.
 * @param value - The input string to filter
 * @param allowDecimal - Whether to allow a decimal point (default: true)
 * @returns Filtered string containing only valid numeric characters
 */
export function filterNumericInput(value: string, allowDecimal: boolean = true): string {
  if (allowDecimal) {
    // Allow digits and at most one decimal point
    const filtered = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = filtered.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return filtered;
  }
  // Only allow digits (no decimal)
  return value.replace(/[^0-9]/g, '');
}
