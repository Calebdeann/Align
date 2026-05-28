import { supabase } from '../supabase';

// Module-level cache so repeat reads on the same session don't re-query.
const cache = new Map<string, string | null>();

export async function getAppConfig(key: string): Promise<string | null> {
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();
    if (error || !data) {
      cache.set(key, null);
      return null;
    }
    const value = data.value ?? null;
    cache.set(key, value);
    return value;
  } catch {
    cache.set(key, null);
    return null;
  }
}
