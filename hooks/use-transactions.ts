"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { repository } from "@/lib/data";
import { currentMonthKey, monthKey } from "@/lib/utils";
import type { BusinessId, Transaction, TransactionInput } from "@/lib/types";

export interface MonthlySeriesPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdownPoint {
  category: string;
  total: number;
}

export function useTransactions(businessId: BusinessId) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await repository.listTransactions(businessId);
    setTransactions(data);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    // Fetch on mount and whenever the selected business changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      await repository.createTransaction(input);
      await load();
    },
    [load]
  );

  const addTransactions = useCallback(
    async (inputs: TransactionInput[]) => {
      for (const input of inputs) {
        await repository.createTransaction(input);
      }
      await load();
    },
    [load]
  );

  const editTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      await repository.updateTransaction(id, input);
      await load();
    },
    [load]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await repository.deleteTransaction(id);
      await load();
    },
    [load]
  );

  const clearAllTransactions = useCallback(async () => {
    await repository.clearAllTransactions();
    await load();
  }, [load]);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    set.add(currentMonthKey());
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const monthStats = useMemo(() => {
    const monthTransactions = transactions.filter((t) => monthKey(t.date) === selectedMonth);
    const income = monthTransactions.filter((t) => t.type === "income");
    const expense = monthTransactions.filter((t) => t.type === "expense");
    const incomeTotal = income.reduce((sum, t) => sum + t.amount, 0);
    const expenseTotal = expense.reduce((sum, t) => sum + t.amount, 0);
    return {
      incomeTotal,
      expenseTotal,
      profit: incomeTotal - expenseTotal,
      incomeCount: income.length,
      expenseCount: expense.length,
    };
  }, [transactions, selectedMonth]);

  const monthlySeries = useMemo<MonthlySeriesPoint[]>(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of transactions) {
      const key = monthKey(t.date);
      const entry = map.get(key) ?? { income: 0, expense: 0 };
      if (t.type === "income") entry.income += t.amount;
      else entry.expense += t.amount;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, { income, expense }]) => ({
        month,
        label: monthShortLabel(month),
        income,
        expense,
      }));
  }, [transactions]);

  const categoryBreakdown = useMemo<CategoryBreakdownPoint[]>(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense" || monthKey(t.date) !== selectedMonth) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, selectedMonth]);

  const channelBreakdown = useMemo<CategoryBreakdownPoint[]>(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "income" || monthKey(t.date) !== selectedMonth) continue;
      map.set(t.channel, (map.get(t.channel) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, selectedMonth]);

  return {
    transactions,
    loading,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    monthStats,
    monthlySeries,
    categoryBreakdown,
    channelBreakdown,
    addTransaction,
    addTransactions,
    clearAllTransactions,
    editTransaction,
    removeTransaction,
  };
}

function monthShortLabel(key: string): string {
  const [, month] = key.split("-").map(Number);
  const short = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יונ׳", "יול׳", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"];
  return short[month - 1];
}
