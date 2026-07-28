import { LocalStorageRepository } from "@/lib/data/local-storage-repository";
import type { DataRepository } from "@/lib/data/repository";

/**
 * נקודת החיבור היחידה לשכבת הנתונים. כדי לעבור ל-DB/API אמיתי מחר,
 * להחליף כאן את המימוש (לדוגמה `new ApiRepository()`) - שאר האפליקציה
 * צורכת רק את הטיפוס DataRepository ולא תלויה במימוש הספציפי.
 */
export const repository: DataRepository = new LocalStorageRepository();

export type { DataRepository } from "@/lib/data/repository";
