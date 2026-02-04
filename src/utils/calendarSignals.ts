// Simple cross-screen signal for the calendar to switch to list view
// after a workout is scheduled. Module-level variable consumed on focus.

let _scheduledDate: string | null = null;

export function requestListViewForDate(dateKey: string) {
  _scheduledDate = dateKey;
}

export function consumeListViewRequest(): string | null {
  const date = _scheduledDate;
  _scheduledDate = null;
  return date;
}
