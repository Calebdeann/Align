/**
 * Converts a string to Title Case (capitalises the first letter of each word).
 * Useful for exercise names that come from the API in lowercase.
 * e.g. "barbell glute bridge" → "Barbell Glute Bridge"
 */
export function toTitleCase(text: string): string {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
