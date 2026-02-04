import { supabase } from '../supabase';
import { ReferralCodeSchema } from '@/schemas/user.schema';

// Validate a referral code and return the referrer's userId if valid.
// Uses a SECURITY DEFINER function to bypass RLS safely.
export async function validateReferralCode(
  code: string
): Promise<{ valid: boolean; referrerId: string | null }> {
  const parsed = ReferralCodeSchema.safeParse(code);
  if (!parsed.success) {
    return { valid: false, referrerId: null };
  }

  const { data, error } = await supabase.rpc('validate_referral_code', {
    code: parsed.data,
  });

  if (error) {
    console.warn('Error validating referral code:', error);
    return { valid: false, referrerId: null };
  }

  return {
    valid: data !== null,
    referrerId: data,
  };
}

// Apply a referral code for the current user.
// Records who referred whom in the referrals table and updates referred_by on profile.
export async function applyReferralCode(userId: string, referrerUserId: string): Promise<boolean> {
  if (userId === referrerUserId) {
    console.warn('Cannot refer yourself');
    return false;
  }

  const { error: referralError } = await supabase.from('referrals').insert({
    referrer_id: referrerUserId,
    referred_id: userId,
  });

  if (referralError) {
    // Unique constraint violation = already referred
    if (referralError.code === '23505') {
      return true;
    }
    console.warn('Error recording referral:', referralError);
    return false;
  }

  // Update the user's profile with referred_by
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ referred_by: referrerUserId })
    .eq('id', userId);

  if (profileError) {
    console.warn('Error updating referred_by:', profileError);
  }

  return true;
}

// Get the current user's referral code from their profile.
export async function getUserReferralCode(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Error fetching referral code:', error);
    return null;
  }

  return data?.referral_code ?? null;
}

// Get count of successful referrals made by a user.
export async function getReferralCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId);

  if (error) {
    console.warn('Error fetching referral count:', error);
    return 0;
  }

  return count ?? 0;
}
