import i18n from '@/i18n';

export type MonthData = {
  id: string;
  year: number;
  month: number;
  weeks: (number | null)[][];
};

// Keep English arrays for non-display logic (data keys, date calculations)
const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

const DAY_KEYS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] as const;

// Translated month names - call these functions to get current-language values
export function getMonthNames(): string[] {
  return MONTH_KEYS.map((key) => i18n.t(`calendar.months.${key}`));
}

export function getDayAbbreviations(): string[] {
  return DAY_KEYS.map((key) => i18n.t(`calendar.daysAbbr.${key}`));
}

// Keep legacy exports for backward compatibility during migration
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export function generateMonthData(year: number, month: number): MonthData {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get day of week (0 = Sunday, convert to Monday = 0)
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  // Fill empty days at start
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Fill in days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill empty days at end
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return {
    id: `${year}-${month}`,
    year,
    month,
    weeks,
  };
}

export function generateMonths(
  centerYear: number,
  centerMonth: number,
  range: number
): MonthData[] {
  const months: MonthData[] = [];
  for (let i = -range; i <= range; i++) {
    let year = centerYear;
    let month = centerMonth + i;
    while (month < 0) {
      month += 12;
      year -= 1;
    }
    while (month > 11) {
      month -= 12;
      year += 1;
    }
    months.push(generateMonthData(year, month));
  }
  return months;
}
