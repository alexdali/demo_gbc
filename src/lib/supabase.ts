import { createClient } from "@supabase/supabase-js";

import { env, publicEnv } from "@/lib/env";

export function getSupabaseAdminClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabasePublicClient() {
  return createClient(publicEnv.SUPABASE_URL, publicEnv.SUPABASE_ANON_KEY);
}
