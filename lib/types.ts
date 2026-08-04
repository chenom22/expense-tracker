export type BusinessId = "chen-digital" | "omri-pizza";

export type PaymentMethod =
  | "מזומן"
  | "העברה בנקאית"
  | "אשראי"
  | "ביט"
  | "צ'ק"
  | "אחר";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "מזומן",
  "העברה בנקאית",
  "אשראי",
  "ביט",
  "צ'ק",
  "אחר",
];

export type ExpenseRecurrence = "קבועה" | "חד פעמית";

export const EXPENSE_RECURRENCES: ExpenseRecurrence[] = ["קבועה", "חד פעמית"];

export interface Business {
  id: BusinessId;
  name: string;
  incomeCategories: string[];
  expenseCategories: string[];
  incomeChannels: string[];
}

interface BaseTransaction {
  id: string;
  businessId: BusinessId;
  date: string; // ISO yyyy-MM-dd
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  note?: string;
  createdAt: string;
}

export interface IncomeTransaction extends BaseTransaction {
  type: "income";
  source: string;
  channel: string;
}

export interface ExpenseTransaction extends BaseTransaction {
  type: "expense";
  vendor: string;
  recurrence: ExpenseRecurrence;
}

export type Transaction = IncomeTransaction | ExpenseTransaction;

export type TransactionInput =
  | Omit<IncomeTransaction, "id" | "createdAt">
  | Omit<ExpenseTransaction, "id" | "createdAt">;

export interface RecurringVendor {
  id: string;
  businessId: BusinessId;
  name: string;
  category: string;
  paymentMethod: PaymentMethod;
  defaultAmount?: number;
}

export type RecurringVendorInput = Omit<RecurringVendor, "id">;
