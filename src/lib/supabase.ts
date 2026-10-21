import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_SUPABASE_URL = 'tawseel_supabase_url';
const STORAGE_SUPABASE_KEY = 'tawseel_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; key: string } {
  let url = import.meta.env.VITE_SUPABASE_URL || '';
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined' && window.localStorage) {
    const savedUrl = window.localStorage.getItem(STORAGE_SUPABASE_URL);
    const savedKey = window.localStorage.getItem(STORAGE_SUPABASE_KEY);
    if (savedUrl && savedKey) {
      url = savedUrl;
      key = savedKey;
    }
  }

  return { url: url.trim(), key: key.trim() };
}

export function checkIsSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project.supabase.co')
  );
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  const { url, key } = getSupabaseCredentials();
  if (checkIsSupabaseConfigured()) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return clientInstance;
    } catch (err) {
      console.warn('[Supabase] Failed to initialize client:', err);
      return null;
    }
  }
  return null;
}

export function saveSupabaseCredentials(url: string, key: string): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_SUPABASE_URL, url.trim());
    window.localStorage.setItem(STORAGE_SUPABASE_KEY, key.trim());
    clientInstance = null; // Reset to recreate
    return checkIsSupabaseConfigured();
  }
  return false;
}

export function clearSupabaseCredentials(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_SUPABASE_URL);
    window.localStorage.removeItem(STORAGE_SUPABASE_KEY);
    clientInstance = null;
  }
}

export const isSupabaseConfigured = checkIsSupabaseConfigured();
export const supabase = getSupabaseClient();
