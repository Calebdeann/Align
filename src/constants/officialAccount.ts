import { supabase } from '@/services/supabase';

export const IT_GIRL_USER_ID = '00000000-0000-0000-0000-000000000001';
export const IT_GIRL_NAME = 'It Girl';

const IT_GIRL_AVATAR_PATH = 'branding/itgirl-avatar.png';

export const IT_GIRL_AVATAR_URL = supabase.storage
  .from('motivational-posts')
  .getPublicUrl(IT_GIRL_AVATAR_PATH).data.publicUrl;

export function getMotivationalPostUrl(storagePath: string): string {
  return supabase.storage.from('motivational-posts').getPublicUrl(storagePath).data.publicUrl;
}
