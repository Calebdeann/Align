import * as Notifications from 'expo-notifications';

const DAILY_REMINDER_ID = 'daily-reminder';
const WORKOUT_IN_PROGRESS_ID = 'workout-in-progress';

// Configure how notifications behave when the app is in the foreground
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Request notification permissions from the user
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Check if notifications are currently permitted at the OS level
export async function getNotificationPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// Parse a time string like "9:00 AM" into { hour24, minute }
function parseTimeString(timeString: string): { hour: number; minute: number } | null {
  const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'AM' && hour === 12) hour = 0;
  else if (period === 'PM' && hour !== 12) hour += 12;

  return { hour, minute };
}

// Schedule a daily repeating notification at the given time
export async function scheduleDailyReminder(timeString: string): Promise<boolean> {
  const parsed = parseTimeString(timeString);
  if (!parsed) {
    console.warn('[Notifications] Could not parse time:', timeString);
    return false;
  }

  // Cancel any existing daily reminder first
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Time to work out!',
      body: "Your workout is waiting for you. Let's get it done.",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: parsed.hour,
      minute: parsed.minute,
    },
  });

  return true;
}

// Cancel the daily reminder notification
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
}

// Schedule a one-time notification 15 minutes from now for workout in progress
export async function scheduleWorkoutInProgressReminder(): Promise<void> {
  // Cancel any existing one first
  await cancelWorkoutInProgressReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: WORKOUT_IN_PROGRESS_ID,
    content: {
      title: 'You have a workout in progress',
      body: 'Are you still working out?',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 15 * 60,
      repeats: false,
    },
  });
}

// Cancel the workout-in-progress notification
export async function cancelWorkoutInProgressReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(WORKOUT_IN_PROGRESS_ID);
}
