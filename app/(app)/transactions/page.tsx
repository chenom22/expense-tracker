"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionFilters, type TransactionTypeFilter } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { IncomeFormDialog } from "@/components/transactions/income-form-dialog";
import { ExpenseFormDialog } from "@/components/transactions/expense-form-dialog";
import { ImportTransactionsDialog } from "@/components/transactions/import-transactions-dialog";
import { ImportWoltPdfDialog } from "@/components/transactions/import-wolt-pdf-dialog";
import { useTransactionsContext } from "@/context/transactions-context";
import { useBusiness } from "@/context/business-context";
import { monthKey } from "@/lib/utils";
import type { IncomeTransaction, ExpenseTransaction, Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const { transactions, editTransaction, removeTransaction, addTransaction, addTransactions, clearAllTransactions } =
    useTransactionsContext();
  const { business } = useBusiness();
  const [importType, setImportType] = useState<"income" | "expense" | null>(null);
  const [woltImportOpen, setWoltImportOpen] = useState(false);

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

  async function handleClearAll() {
    const confirmed = window.confirm(
      "פעולה זו תמחק לצמיתות את כל ההכנסות וההוצאות של שני העסקים (Chen Digital והפיצרייה). ספקים קבועים ופניות לא יימחקו. להמשיך?"
    );
    if (!confirmed) return;
    await clearAllTransactions();
    toast.success("כל התנועות נמחקו");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>כל התנועות</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setImportType("income")}>
              <Upload className="size-4" />
              ייבוא הכנסות מקובץ
            </Button>
            <Button variant="outline" onClick={() => setImportType("expense")}>
              <Upload className="size-4" />
              ייבוא הוצאות מקובץ
            </Button>
            {business.incomeChannels.some((c) => c.includes("וולט")) && (
              <Button variant="outline" onClick={() => setWoltImportOpen(true)}>
                <Upload className="size-4" />
                ייבוא Wolt מ-PDF
              </Button>
            )}
            {transactions.length > 0 && (
              <Button variant="ghost" className="text-destructive" onClick={handleClearAll}>
                <Trash2 className="size-4" />
                איפוס כל התנועות
              </Button>
            )}
          </div>
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
      {importType && (
        <ImportTransactionsDialog
          type={importType}
          open={importType !== null}
          onOpenChange={(open) => !open && setImportType(null)}
          onImport={addTransactions}
        />
      )}
      <ImportWoltPdfDialog open={woltImportOpen} onOpenChange={setWoltImportOpen} onImport={addTransaction} />
    </div>
  );
}
