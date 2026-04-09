import "dotenv/config";

import { z } from "zod";

const serverSchema = z.object({
  RETAILCRM_BASE_URL: z.string().url(),
  RETAILCRM_API_KEY: z.string().min(1),
  RETAILCRM_SITE_CODE: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().min(1),
  VERCEL_TOKEN: z.string().min(1).optional(),
  VERCEL_ORG_ID: z.string().min(1).optional(),
  VERCEL_PROJECT_ID: z.string().min(1).optional(),
});

const clientSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = serverSchema.parse(process.env);

export const publicEnv = clientSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
});
