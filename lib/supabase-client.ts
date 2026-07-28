import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * קליינט ציבורי (anon key) - מותר לו רק להוסיף פניות (RLS), לא לקרוא אותן.
 * קריאת הפניות מתבצעת דרך Edge Function מוגן סיסמה (ר' app/admin/page.tsx).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
