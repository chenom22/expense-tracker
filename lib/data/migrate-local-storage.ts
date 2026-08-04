import { repository } from "@/lib/data";
import type { RecurringVendor, Transaction } from "@/lib/types";

const TRANSACTIONS_KEY = "expense-tracker:transactions";
const VENDORS_KEY = "expense-tracker:vendors";
const MIGRATED_KEY = "expense-tracker:migrated-to-supabase";

/**
 * הרצה חד-פעמית לכל דפדפן: מעביר תנועות/ספקים שנשמרו קודם ב-localStorage
 * (לפני המעבר ל-Supabase) אל מסד הנתונים המשותף, כדי לא לאבד נתונים
 * שכבר הוזנו במכשיר הזה.
 */
export async function migrateLocalStorageIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATED_KEY)) return;

  try {
    const rawTransactions = window.localStorage.getItem(TRANSACTIONS_KEY);
    const rawVendors = window.localStorage.getItem(VENDORS_KEY);
    const transactions: Transaction[] = rawTransactions ? JSON.parse(rawTransactions) : [];
    const vendors: RecurringVendor[] = rawVendors ? JSON.parse(rawVendors) : [];

    for (const { id, createdAt, ...input } of transactions) {
      await repository.createTransaction(input);
    }
    for (const { id, ...input } of vendors) {
      await repository.createVendor(input);
    }
  } finally {
    window.localStorage.setItem(MIGRATED_KEY, "1");
  }
}
