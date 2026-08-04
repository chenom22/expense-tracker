import { BUSINESSES } from "@/lib/data/businesses";
import type { DataRepository } from "@/lib/data/repository";
import { supabase } from "@/lib/supabase-client";
import type {
  Business,
  BusinessId,
  RecurringVendor,
  RecurringVendorInput,
  Transaction,
  TransactionInput,
} from "@/lib/types";

interface TransactionRow {
  id: string;
  business_id: BusinessId;
  type: "income" | "expense";
  date: string;
  amount: number;
  category: string;
  payment_method: string;
  note: string | null;
  source: string | null;
  channel: string | null;
  vendor: string | null;
  recurrence: string | null;
  created_at: string;
}

interface VendorRow {
  id: string;
  business_id: BusinessId;
  name: string;
  category: string;
  payment_method: string;
  default_amount: number | null;
}

function rowToTransaction(row: TransactionRow): Transaction {
  const base = {
    id: row.id,
    businessId: row.business_id,
    date: row.date,
    amount: Number(row.amount),
    category: row.category,
    paymentMethod: row.payment_method as Transaction["paymentMethod"],
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
  if (row.type === "income") {
    return { ...base, type: "income", source: row.source ?? "", channel: row.channel ?? "" };
  }
  return {
    ...base,
    type: "expense",
    vendor: row.vendor ?? "",
    recurrence: (row.recurrence ?? "חד פעמית") as "קבועה" | "חד פעמית",
  };
}

function inputToRow(input: TransactionInput) {
  return {
    business_id: input.businessId,
    type: input.type,
    date: input.date,
    amount: input.amount,
    category: input.category,
    payment_method: input.paymentMethod,
    note: input.note ?? null,
    source: input.type === "income" ? input.source : null,
    channel: input.type === "income" ? input.channel : null,
    vendor: input.type === "expense" ? input.vendor : null,
    recurrence: input.type === "expense" ? input.recurrence : null,
  };
}

function rowToVendor(row: VendorRow): RecurringVendor {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    category: row.category,
    paymentMethod: row.payment_method as RecurringVendor["paymentMethod"],
    defaultAmount: row.default_amount ?? undefined,
  };
}

function vendorInputToRow(input: RecurringVendorInput) {
  return {
    business_id: input.businessId,
    name: input.name,
    category: input.category,
    payment_method: input.paymentMethod,
    default_amount: input.defaultAmount ?? null,
  };
}

/**
 * מימוש שכבת הנתונים מעל Supabase - כך שהנתונים משותפים ומסונכרנים בין כל המכשירים.
 */
export class SupabaseRepository implements DataRepository {
  async listBusinesses(): Promise<Business[]> {
    return BUSINESSES;
  }

  async listTransactions(businessId: BusinessId): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("business_id", businessId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as TransactionRow[]).map(rowToTransaction);
  }

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    const { data, error } = await supabase
      .from("transactions")
      .insert(inputToRow(input))
      .select()
      .single();
    if (error) throw error;
    return rowToTransaction(data as TransactionRow);
  }

  async updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
    const { data, error } = await supabase
      .from("transactions")
      .update(inputToRow(input))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return rowToTransaction(data as TransactionRow);
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
  }

  async clearAllTransactions(): Promise<void> {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("business_id", BUSINESSES.map((b) => b.id));
    if (error) throw error;
  }

  async listVendors(businessId: BusinessId): Promise<RecurringVendor[]> {
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("business_id", businessId)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data as VendorRow[]).map(rowToVendor);
  }

  async createVendor(input: RecurringVendorInput): Promise<RecurringVendor> {
    const { data, error } = await supabase
      .from("vendors")
      .insert(vendorInputToRow(input))
      .select()
      .single();
    if (error) throw error;
    return rowToVendor(data as VendorRow);
  }

  async updateVendor(id: string, input: RecurringVendorInput): Promise<RecurringVendor> {
    const { data, error } = await supabase
      .from("vendors")
      .update(vendorInputToRow(input))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return rowToVendor(data as VendorRow);
  }

  async deleteVendor(id: string): Promise<void> {
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) throw error;
  }
}
