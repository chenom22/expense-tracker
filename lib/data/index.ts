import { SupabaseRepository } from "@/lib/data/supabase-repository";
import type { DataRepository } from "@/lib/data/repository";

/**
 * נקודת החיבור היחידה לשכבת הנתונים. שאר האפליקציה צורכת רק את הטיפוס
 * DataRepository ולא תלויה במימוש הספציפי.
 */
export const repository: DataRepository = new SupabaseRepository();

export type { DataRepository } from "@/lib/data/repository";
