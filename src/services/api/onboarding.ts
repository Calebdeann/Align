import { supabase } from '../supabase';
import { getAnonymousSessionId, clearAnonymousSession } from '../anonymousSession';

// Field mapping from store property names to database column names
// Also used to identify which field was skipped
const fieldToColumn: Record<string, string> = {
  name: 'name',
  experienceLevel: 'experience_level',
  triedOtherApps: 'tried_other_apps',
  mainGoal: 'main_goal',
  bodyChangeGoal: 'body_change_goal',
  otherGoals: 'goals',
  referralSource: 'referral_source',
  age: 'age',
  heightInches: 'height',
  currentWeight: 'weight',
  targetWeight: 'target_weight',
  unit: 'units',
  trainingLocation: 'training_location',
  workoutFrequency: 'workout_frequency',
  workoutDays: 'workout_days',
  mainObstacle: 'main_obstacle',
  healthSituation: 'health_situation',
  energyFluctuation: 'energy_fluctuation',
  notificationsEnabled: 'notifications_enabled',
  reminderTime: 'reminder_time',
};

export async function saveOnboardingField(field: string, value: unknown): Promise<boolean> {
  const anonymousId = await getAnonymousSessionId();
  const columnName = fieldToColumn[field] || field;

  // Convert values to match database format
  let dbValue = value;
  if (field === 'unit') {
    dbValue = value === 'lb' ? 'imperial' : 'metric';
  } else if (field === 'workoutFrequency') {
    // Convert "4 days / week" or "Every day" to integer
    if (value === 'Every day') {
      dbValue = 7;
    } else if (typeof value === 'string') {
      const match = value.match(/^(\d+)/);
      dbValue = match ? parseInt(match[1], 10) : null;
    }
  }

  const { error } = await supabase.from('onboarding_sessions').upsert(
    {
      anonymous_id: anonymousId,
      [columnName]: dbValue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'anonymous_id' }
  );

  if (error) {
    console.warn('Error saving onboarding field:', error);
    return false;
  }
  return true;
}

export async function linkOnboardingToUser(userId: string): Promise<boolean> {
  const anonymousId = await getAnonymousSessionId();

  // Get the onboarding data from anonymous session
  const { data: session, error: fetchError } = await supabase
    .from('onboarding_sessions')
    .select('*')
    .eq('anonymous_id', anonymousId)
    .single();

  if (fetchError) {
    // No anonymous data to link - that's okay, user might have skipped onboarding
    console.log('No onboarding session found to link:', fetchError.message);
    return true;
  }

  if (!session) {
    return true;
  }

  // Get user info for profile creation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Transfer data to profiles table using upsert (creates if doesn't exist)
  const { error: updateError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: user?.email,
      name: session.name || null,
      full_name: user?.user_metadata?.full_name || user?.user_metadata?.name,
      avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
      experience_level: session.experience_level,
      main_goal: session.main_goal,
      goals: session.goals,
      referral_source: session.referral_source,
      age: session.age,
      height: session.height,
      weight: session.weight,
      target_weight: session.target_weight,
      units: session.units,
      tried_other_apps: session.tried_other_apps,
      body_change_goal: session.body_change_goal,
      training_location: session.training_location,
      workout_frequency: session.workout_frequency,
      workout_days: session.workout_days,
      main_obstacle: session.main_obstacle,
      health_situation: session.health_situation,
      energy_fluctuation: session.energy_fluctuation,
      notifications_enabled: session.notifications_enabled,
      reminder_time: session.reminder_time,
      skipped_fields: session.skipped_fields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (updateError) {
    console.warn('Error transferring onboarding data to profile:', updateError);
    return false;
  }

  // Delete the anonymous session data (no longer needed)
  const { error: deleteError } = await supabase
    .from('onboarding_sessions')
    .delete()
    .eq('anonymous_id', anonymousId);

  if (deleteError) {
    console.warn('Error deleting anonymous session:', deleteError);
    // Don't fail the whole operation, data was transferred successfully
  }

  return true;
}

export async function getOnboardingSession() {
  const anonymousId = await getAnonymousSessionId();

  const { data, error } = await supabase
    .from('onboarding_sessions')
    .select('*')
    .eq('anonymous_id', anonymousId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Track when a user skips a question during onboarding
export async function saveSkippedField(field: string): Promise<boolean> {
  const anonymousId = await getAnonymousSessionId();
  const columnName = fieldToColumn[field] || field;

  // First, get the current skipped_fields array
  const { data: session } = await supabase
    .from('onboarding_sessions')
    .select('skipped_fields')
    .eq('anonymous_id', anonymousId)
    .single();

  const currentSkipped = session?.skipped_fields || [];

  // Add the new skipped field if not already present
  if (!currentSkipped.includes(columnName)) {
    currentSkipped.push(columnName);
  }

  const { error } = await supabase.from('onboarding_sessions').upsert(
    {
      anonymous_id: anonymousId,
      skipped_fields: currentSkipped,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'anonymous_id' }
  );

  if (error) {
    console.warn('Error saving skipped field:', error);
    return false;
  }
  return true;
}
