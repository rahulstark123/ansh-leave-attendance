import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hjnqlybokoljhxyzsqqi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_GbWUE3qA8Uv80ssHRUKqsQ_FwANa9OY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
