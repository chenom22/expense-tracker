"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionFilters, type TransactionTypeFilter } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { IncomeFormDialog } from "@/components/transactions/income-form-dialog";
import { ExpenseFormDialog } from "@/components/transactions/expense-form-dialog";
import { useTransactionsContext } from "@/context/transactions-context";
import { useBusiness } from "@/context/business-context";
import { monthKey } from "@/lib/utils";
import type { IncomeTransaction, ExpenseTransaction, Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const { transactions, editTransaction, removeTransaction } = useTransactionsContext();
  const { business } = useBusiness();

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("all");
  const [type, setType] = useState<TransactionTypeFilter>("all");
  const [category, setCategory] = useState("all");

  const [editingIncome, setEditingIncome] = useState<IncomeTransaction | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseTransaction | null>(null);

  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const categories = useMemo(() => {
    if (type === "income") return business.incomeCategories;
    if (type === "expense") return business.expenseCategories;
    return Array.from(new Set([...business.incomeCategories, ...business.expenseCategories]));
  }, [type, business]);

  function handleTypeChange(value: TransactionTypeFilter) {
    setType(value);
    setCategory("all");
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (month !== "all" && monthKey(t.date) !== month) return false;
      if (type !== "all" && t.type !== type) return false;
      if (category !== "all" && t.category !== category) return false;
      if (query) {
        const haystack = [
          t.type === "income" ? t.source : t.vendor,
          t.note ?? "",
          t.category,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [transactions, search, month, type, category]);

  function handleEdit(transaction: Transaction) {
    if (transaction.type === "income") setEditingIncome(transaction);
    else setEditingExpense(transaction);
  }

  async function handleDelete(transaction: Transaction) {
    const label = transaction.type === "income" ? transaction.source : transaction.vendor;
    if (!window.confirm(`למחוק את התנועה "${label}"?`)) return;
    await removeTransaction(transaction.id);
    toast.success("התנועה נמחקה");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>כל התנועות</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TransactionFilters
            search={search}
            onSearchChange={setSearch}
            month={month}
            onMonthChange={setMonth}
            months={months}
            type={type}
            onTypeChange={handleTypeChange}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
          />
          <TransactionTable transactions={filtered} onEdit={handleEdit} onDelete={handleDelete} />
        </CardContent>
      </Card>

      <IncomeFormDialog
        open={editingIncome !== null}
        onOpenChange={(open) => !open && setEditingIncome(null)}
        transaction={editingIncome ?? undefined}
        onSubmit={(input) => editTransaction(editingIncome!.id, input)}
      />
      <ExpenseFormDialog
        open={editingExpense !== null}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        transaction={editingExpense ?? undefined}
        onSubmit={(input) => editTransaction(editingExpense!.id, input)}
      />
    </div>
  );
}
