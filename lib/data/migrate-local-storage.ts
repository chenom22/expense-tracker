import { repository } from "@/lib/data";
import type { RecurringVendor, Transaction } from "@/lib/types";

const TRANSACTIONS_KEY = "expense-tracker:transactions";
const VENDORS_KEY = "expense-tracker:vendors";
const MIGRATED_IDS_KEY = "expense-tracker:migrated-ids";
/** דגל מגרסה קודמת של ההגירה (בוליאני יחיד, "הכל או כלום"). דפדפן שכבר סימן
 * את עצמו כך השלים בעבר הגירה מלאה בהצלחה - אין להריץ שוב ולשכפל נתונים. */
const LEGACY_MIGRATED_FLAG_KEY = "expense-tracker:migrated-to-supabase";

interface MigratedIds {
  transactions: string[];
  vendors: string[];
}

function readMigratedIds(): MigratedIds {
  const raw = window.localStorage.getItem(MIGRATED_IDS_KEY);
  if (!raw) return { transactions: [], vendors: [] };
  try {
    return JSON.parse(raw) as MigratedIds;
  } catch {
    return { transactions: [], vendors: [] };
  }
}

function writeMigratedIds(ids: MigratedIds): void {
  window.localStorage.setItem(MIGRATED_IDS_KEY, JSON.stringify(ids));
}

/**
 * הרצה חד-פעמית (לכל רשומה בנפרד, ניתנת לחזרה) לכל דפדפן: מעביר תנועות/ספקים
 * שנשמרו קודם ב-localStorage (לפני המעבר ל-Supabase) אל מסד הנתונים המשותף,
 * כדי לא לאבד נתונים שכבר הוזנו במכשיר הזה. רשומה שכבר עברה בהצלחה לא תועבר
 * שוב, ורשומה שנכשלה לא עוצרת את השאר - כך שרענון הדף פשוט ממשיך מאיפה שנעצר.
 */
export async function migrateLocalStorageIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(LEGACY_MIGRATED_FLAG_KEY)) return;

  const rawTransactions = window.localStorage.getItem(TRANSACTIONS_KEY);
  const rawVendors = window.localStorage.getItem(VENDORS_KEY);
  const transactions: Transaction[] = rawTransactions ? JSON.parse(rawTransactions) : [];
  const vendors: RecurringVendor[] = rawVendors ? JSON.parse(rawVendors) : [];
  if (transactions.length === 0 && vendors.length === 0) return;

  const migrated = readMigratedIds();
  const migratedTransactionIds = new Set(migrated.transactions);
  const migratedVendorIds = new Set(migrated.vendors);

  for (const { id, createdAt, ...input } of transactions) {
    if (migratedTransactionIds.has(id)) continue;
    try {
      await repository.createTransaction(input);
      migratedTransactionIds.add(id);
      writeMigratedIds({ transactions: [...migratedTransactionIds], vendors: [...migratedVendorIds] });
    } catch (err) {
      console.error("migrateLocalStorageIfNeeded: failed to migrate transaction", id, err);
    }
  }

  for (const { id, ...input } of vendors) {
    if (migratedVendorIds.has(id)) continue;
    try {
      await repository.createVendor(input);
      migratedVendorIds.add(id);
      writeMigratedIds({ transactions: [...migratedTransactionIds], vendors: [...migratedVendorIds] });
    } catch (err) {
      console.error("migrateLocalStorageIfNeeded: failed to migrate vendor", id, err);
    }
  }
}
