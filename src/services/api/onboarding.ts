import { supabase } from '../supabase';
import { getAnonymousSessionId } from '../anonymousSession';

// Map store property names → onboarding_sessions column names.
// Only fields collected by It Girl onboarding screens. Body / notification preferences
// live exclusively on `profiles` (set post-onboarding via personal-details / settings),
// not on `onboarding_sessions`.
const fieldToColumn: Record<string, string> = {
  name: 'name',
  trafficSource: 'traffic_source',
  achieveGoals: 'achieve_goals',
  idealDay: 'ideal_day',
  challenges: 'challenges',
  workoutDays: 'workout_days',
  selectedPlanId: 'plan_id',
  matchedBuddyIndex: 'matched_buddy_index',
  programStartDate: 'program_start_date',
};

function isMissingColumnError(error: { code?: string; message?: string }): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  if (code === 'PGRST204' || code === '42703') return true;
  return /could not find.*column|column.*does not exist/i.test(error.message || '');
}

export async function saveOnboardingField(field: string, value: unknown): Promise<boolean> {
  const anonymousId = await getAnonymousSessionId();
  const columnName = fieldToColumn[field] || field;

  const { error } = await supabase.from('onboarding_sessions').upsert(
    {
      anonymous_id: anonymousId,
      [columnName]: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'anonymous_id' }
  );

  if (error) {
    // Column missing (migration not pushed yet) is non-fatal; linkOnboardingToUser will
    // still attempt to upsert known fields to profiles later. Don't break onboarding.
    if (isMissingColumnError(error)) {
      console.warn(
        `[onboarding] Column '${columnName}' missing on onboarding_sessions; skipping persist. Run pending migrations.`
      );
      return false;
    }
    throw new Error(`Error saving onboarding field '${columnName}': ${error.message}`);
  }
  return true;
}

// Standalone helper for sign-in paths that don't go through onboarding (the
// "Already have an account?" flow). Stamps terms acceptance on the existing
// profile. Backwards-compat retry per CLAUDE.md rule #9.
export async function markTermsAccepted(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: 'v1',
    })
    .eq('id', userId);

  if (error && error.code === 'PGRST204') {
    console.warn('markTermsAccepted: terms columns missing, run migration 091.', error);
    return;
  }
  if (error) {
    console.warn('markTermsAccepted error:', error);
  }
}

export async function linkOnboardingToUser(userId: string): Promise<boolean> {
  const anonymousId = await getAnonymousSessionId();

  const { data: session, error: fetchError } = await supabase
    .from('onboarding_sessions')
    .select('*')
    .eq('anonymous_id', anonymousId)
    .single();

  if (fetchError) {
    console.log('No onboarding session found to link:', fetchError.message);
    return true;
  }

  if (!session) {
    return true;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Base payload shared by both attempts.
  const baseRow = {
    id: userId,
    email: user?.email,
    name: session.name || null,
    full_name: user?.user_metadata?.full_name || user?.user_metadata?.name,
    avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
    // It Girl onboarding answers — every column an active onboarding screen wrote to.
    traffic_source: session.traffic_source,
    achieve_goals: session.achieve_goals,
    ideal_day: session.ideal_day,
    challenges: session.challenges,
    workout_days: session.workout_days,
    plan_id: session.plan_id || 'summer-body',
    matched_buddy_index: session.matched_buddy_index ?? null,
    program_start_date: session.program_start_date,
    skipped_fields: session.skipped_fields,
    updated_at: new Date().toISOString(),
  };

  // CLAUDE.md rule #9: never unconditionally write new columns. Build the
  // full row including terms_accepted_at + terms_version, retry without
  // them on PGRST204 (schema cache hasn't seen migration 091 yet).
  const rowWithTerms = {
    ...baseRow,
    terms_accepted_at: new Date().toISOString(),
    terms_version: 'v1',
  };

  let updateError = (await supabase.from('profiles').upsert(rowWithTerms, { onConflict: 'id' }))
    .error;

  if (updateError && updateError.code === 'PGRST204') {
    console.warn(
      'linkOnboardingToUser: terms columns missing, retrying without (run migration 091).',
      updateError
    );
    updateError = (await supabase.from('profiles').upsert(baseRow, { onConflict: 'id' })).error;
  }

  if (updateError) {
    console.warn('Error transferring onboarding data to profile:', updateError);
    return false;
  }

  const { error: deleteError } = await supabase
    .from('onboarding_sessions')
    .delete()
    .eq('anonymous_id', anonymousId);

  if (deleteError) {
    console.warn('Error deleting anonymous session:', deleteError);
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

export async function saveSkippedField(field: string): Promise<boolean> {
  const anonymousId = await getAnonymousSessionId();
  const columnName = fieldToColumn[field] || field;

  const { data: session } = await supabase
    .from('onboarding_sessions')
    .select('skipped_fields')
    .eq('anonymous_id', anonymousId)
    .single();

  const existing = session?.skipped_fields || [];
  const currentSkipped = existing.includes(columnName) ? existing : [...existing, columnName];

  const { error } = await supabase.from('onboarding_sessions').upsert(
    {
      anonymous_id: anonymousId,
      skipped_fields: currentSkipped,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'anonymous_id' }
  );

  if (error) {
    throw new Error(`Error saving skipped field '${columnName}': ${error.message}`);
  }
  return true;
}
