import { supabase } from '@/services/supabase';
import { logger } from '@/utils/logger';

// Apple Guideline 1.2 — content reporting. Backed by the `reports` table
// from migration 090. The table's RLS only lets the reporter insert their
// own rows (auth.uid() = reporter_id); reads/updates are admin-only.

export type ReportTargetType = 'workout' | 'profile' | 'photo';

export const REPORT_REASONS = [
  'Inappropriate content',
  'Harassment',
  'Spam',
  'Misinformation',
  'Other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * Submit a report for a piece of UGC. Caller's auth.uid() is used as the
 * reporter_id (enforced by RLS). Returns true on success, false on any
 * failure (network, RLS, table missing). Failures are logged but never
 * thrown so report UIs can just show a generic confirmation/error.
 *
 * @param targetType  one of 'workout' | 'profile' | 'photo'
 * @param targetId    UUID of the offending row
 * @param reason      one of the REPORT_REASONS values
 * @param notes       optional free-text up to 200 chars (caller should truncate)
 */
export async function reportContent(
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  notes?: string
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[reportContent] no authenticated user');
    return false;
  }

  // Log the payload up-front so a Metro reader can correlate the failure
  // with the row that was attempted. Useful when target_id is malformed
  // (e.g. a non-UUID workout id) or the reports table doesn't exist yet.
  const payload = {
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    notes: notes?.trim() ? notes.trim().slice(0, 200) : null,
  };
  console.log('[reportContent] inserting', payload);

  const { error } = await supabase.from('reports').insert(payload);

  if (error) {
    // Surface full error details to the console — code, message, details,
    // hint — so we can diagnose whether it's a missing table (42P01 / 'does
    // not exist'), bad UUID (22P02), RLS violation (42501), or something
    // else.
    console.warn('[reportContent] insert failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    logger.warn('reportContent insert failed', { targetType, targetId, error });
    return false;
  }
  return true;
}
