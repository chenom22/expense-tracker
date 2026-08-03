"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTree, Mail, Menu, Plus, Truck, Wallet, X } from "lucide-react";
import { BusinessSwitcher } from "@/components/business-switcher";
import { Button } from "@/components/ui/button";
import { TransactionsProvider, useTransactionsContext } from "@/context/transactions-context";
import { IncomeFormDialog } from "@/components/transactions/income-form-dialog";
import { ExpenseFormDialog } from "@/components/transactions/expense-form-dialog";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/transactions", label: "תנועות", icon: ListTree },
  { href: "/vendors", label: "ספקים קבועים", icon: Truck },
  { href: "/contact", label: "צור קשר", icon: Mail },
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
  const [navOpen, setNavOpen] = useState(false);

  const pageTitle = NAV_ITEMS.find((item) => pathname?.startsWith(item.href))?.label ?? "דשבורד";

  return (
    <div className="flex min-h-screen">
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-64 shrink-0 flex-col border-e border-border bg-sidebar transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:transition-none",
          navOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="size-4" />
            </div>
            <span className="font-semibold text-foreground">ניהול תזרים</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="סגירת תפריט"
          >
            <X className="size-4" />
          </Button>
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
                onClick={() => setNavOpen(false)}
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
        <header className="flex h-16 items-center justify-between gap-2 border-b border-border px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setNavOpen(true)}
              aria-label="פתיחת תפריט"
            >
              <Menu className="size-4" />
            </Button>
            <h1 className="truncate text-lg font-semibold text-foreground">{pageTitle}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={() => setExpenseOpen(true)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">הוצאה</span>
            </Button>
            <Button onClick={() => setIncomeOpen(true)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">הכנסה</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
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
