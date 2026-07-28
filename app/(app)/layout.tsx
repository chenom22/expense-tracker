"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTree, Plus, Wallet } from "lucide-react";
import { BusinessSwitcher } from "@/components/business-switcher";
import { Button } from "@/components/ui/button";
import { TransactionsProvider, useTransactionsContext } from "@/context/transactions-context";
import { IncomeFormDialog } from "@/components/transactions/income-form-dialog";
import { ExpenseFormDialog } from "@/components/transactions/expense-form-dialog";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/transactions", label: "תנועות", icon: ListTree },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransactionsProvider>
      <AppShell>{children}</AppShell>
    </TransactionsProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { addTransaction } = useTransactionsContext();
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const pageTitle = NAV_ITEMS.find((item) => pathname?.startsWith(item.href))?.label ?? "דשבורד";

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-e border-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </div>
          <span className="font-semibold text-foreground">ניהול תזרים</span>
        </div>

        <div className="px-4 pb-4">
          <BusinessSwitcher />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setExpenseOpen(true)}>
              <Plus className="size-4" />
              הוצאה
            </Button>
            <Button onClick={() => setIncomeOpen(true)}>
              <Plus className="size-4" />
              הכנסה
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      <IncomeFormDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        onSubmit={addTransaction}
      />
      <ExpenseFormDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSubmit={addTransaction}
      />
    </div>
  );
}
