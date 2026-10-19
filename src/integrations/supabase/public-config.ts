/** Public Supabase settings used by both the browser build and server auth. */
export const PUBLIC_SUPABASE_URL = "https://xeryqcbacmisrnuqyjab.supabase.co";
export const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XhXtKNovfwWIDZwUUMfZ_g_P4ihAQUs";

export function getSupabaseUrl(): string {
  return process.env["SUPABASE_URL"]
    || process.env["VITE_SUPABASE_URL"]
    || PUBLIC_SUPABASE_URL;
}

export function getSupabasePublishableKey(): string {
  return process.env["SUPABASE_PUBLISHABLE_KEY"]
    || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]
    || PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}
