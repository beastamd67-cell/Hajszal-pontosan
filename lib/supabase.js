import { createClient } from "@supabase/supabase-js";

// FONTOS: ez a kliens csak szerver oldalon (API route-okban) fut le,
// a service_role kulcs SOHA nem jut el a bongeszobe.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
