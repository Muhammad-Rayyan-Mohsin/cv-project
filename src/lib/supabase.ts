import { createClient } from "@supabase/supabase-js";
import { Database } from "./supabase-types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client using service role key.
// This bypasses RLS — only use in API routes, never expose to the client.
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
