import { BUSINESSES } from "@/lib/data/businesses";
import type { DataRepository } from "@/lib/data/repository";
import type {
  Business,
  BusinessId,
  RecurringVendor,
  RecurringVendorInput,
  Transaction,
  TransactionInput,
} from "@/lib/types";

const TRANSACTIONS_KEY = "expense-tracker:transactions";
const VENDORS_KEY = "expense-tracker:vendors";

function readAll(): Transaction[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(TRANSACTIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

function writeAll(transactions: Transaction[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readVendors(): RecurringVendor[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(VENDORS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecurringVendor[];
  } catch {
    return [];
  }
}

function writeVendors(vendors: RecurringVendor[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
}

/**
 * מימוש נוכחי של שכבת הנתונים מעל localStorage. כדי לחבר DB/API אמיתי מחר,
 * יש לכתוב מימוש חדש ל-DataRepository (לדוגמה מעל fetch) ולהחליף את
 * ה-export ב-lib/data/index.ts - שאר האפליקציה לא צריכה להשתנות.
 */
export class LocalStorageRepository implements DataRepository {
  async listBusinesses(): Promise<Business[]> {
    return BUSINESSES;
  }

  async listTransactions(businessId: BusinessId): Promise<Transaction[]> {
    return readAll()
      .filter((t) => t.businessId === businessId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    const transaction = {
      ...input,
      id: createId(),
      createdAt: new Date().toISOString(),
    } as Transaction;
    const all = readAll();
    all.push(transaction);
    writeAll(all);
    return transaction;
  }

  async updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
    const all = readAll();
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error("תנועה לא נמצאה");
    }
    const updated = { ...all[index], ...input } as Transaction;
    all[index] = updated;
    writeAll(all);
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    const all = readAll();
    writeAll(all.filter((t) => t.id !== id));
  }

  async clearAllTransactions(): Promise<void> {
    writeAll([]);
  }

  async listVendors(businessId: BusinessId): Promise<RecurringVendor[]> {
    return readVendors()
      .filter((v) => v.businessId === businessId)
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
  }

  async createVendor(input: RecurringVendorInput): Promise<RecurringVendor> {
    const vendor: RecurringVendor = { ...input, id: createId() };
    const all = readVendors();
    all.push(vendor);
    writeVendors(all);
    return vendor;
  }

  async updateVendor(id: string, input: RecurringVendorInput): Promise<RecurringVendor> {
    const all = readVendors();
    const index = all.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error("ספק לא נמצא");
    }
    const updated: RecurringVendor = { ...input, id };
    all[index] = updated;
    writeVendors(all);
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    const all = readVendors();
    writeVendors(all.filter((v) => v.id !== id));
  }
}
