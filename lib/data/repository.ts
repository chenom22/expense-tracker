import type {
  Business,
  BusinessId,
  RecurringVendor,
  RecurringVendorInput,
  Transaction,
  TransactionInput,
} from "@/lib/types";

/**
 * חוזה שכבת הנתונים. המימוש הנוכחי (local-storage-repository.ts) עובד מעל
 * localStorage, אך כל המתודות אסינכרוניות מראש - כדי שהחלפה עתידית במימוש
 * שמדבר עם API/DB אמיתי (למשל מעל fetch) תדרוש שינוי רק בקובץ index.ts,
 * בלי לגעת בקוד שצורך את ה-repository.
 */
export interface DataRepository {
  listBusinesses(): Promise<Business[]>;
  listTransactions(businessId: BusinessId): Promise<Transaction[]>;
  createTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, input: TransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  clearAllTransactions(): Promise<void>;
  listVendors(businessId: BusinessId): Promise<RecurringVendor[]>;
  createVendor(input: RecurringVendorInput): Promise<RecurringVendor>;
  updateVendor(id: string, input: RecurringVendorInput): Promise<RecurringVendor>;
  deleteVendor(id: string): Promise<void>;
}
