import { BUSINESSES } from "@/lib/data/businesses";
import { generateSeedTransactions } from "@/lib/data/seed";
import type { DataRepository } from "@/lib/data/repository";
import type { Business, BusinessId, Transaction, TransactionInput } from "@/lib/types";

const TRANSACTIONS_KEY = "expense-tracker:transactions";
const SEEDED_KEY = "expense-tracker:seeded";

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

function ensureSeeded(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEEDED_KEY)) return;
  writeAll(generateSeedTransactions());
  window.localStorage.setItem(SEEDED_KEY, "1");
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
    ensureSeeded();
    return readAll()
      .filter((t) => t.businessId === businessId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    ensureSeeded();
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
}
