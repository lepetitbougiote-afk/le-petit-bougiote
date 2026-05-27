import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseConfig(): SupabaseConfig | null {
  if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}

let singletonClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  if (!singletonClient) {
    singletonClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return singletonClient;
}

export const supabaseClient = getSupabaseClient();
