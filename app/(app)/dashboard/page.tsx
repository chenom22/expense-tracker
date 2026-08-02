"use client";

import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/kpi-card";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { useTransactionsContext } from "@/context/transactions-context";
import { cn, formatCurrency, formatDate, monthLabel } from "@/lib/utils";

export default function DashboardPage() {
  const {
    transactions,
    monthStats,
    monthlySeries,
    categoryBreakdown,
    channelBreakdown,
    loading,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
  } = useTransactionsContext();

  const recent = transactions.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Select
          value={selectedMonth}
          onValueChange={(v) => v && setSelectedMonth(v)}
          items={Object.fromEntries(availableMonths.map((m) => [m, monthLabel(m)]))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="בחרו חודש" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <KpiCard label="הכנסות החודש" value={formatCurrency(monthStats.incomeTotal)} icon={ArrowUpCircle} tone="income" />
        <KpiCard label="הוצאות החודש" value={formatCurrency(monthStats.expenseTotal)} icon={ArrowDownCircle} tone="expense" />
        <KpiCard
          label="רווח החודש"
          value={formatCurrency(monthStats.profit)}
          icon={TrendingUp}
          tone={monthStats.profit >= 0 ? "income" : "expense"}
        />
        <KpiCard label="מספר הכנסות" value={String(monthStats.incomeCount)} icon={Wallet} />
        <KpiCard label="מספר הוצאות" value={String(monthStats.expenseCount)} icon={Receipt} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>הכנסות מול הוצאות לפי חודשים</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeExpenseChart data={monthlySeries} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>חלוקת הוצאות לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart data={categoryBreakdown} emptyMessage="אין הוצאות החודש להצגה" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>חלוקת הכנסות לפי ערוץ</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart data={channelBreakdown} emptyMessage="אין הכנסות החודש להצגה" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>תנועות אחרונות</CardTitle>
          <Link href="/transactions" className="text-sm text-primary hover:underline">
            לכל התנועות
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">טוען נתונים...</p>
          ) : recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">אין עדיין תנועות</p>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {t.type === "income" ? t.source : t.vendor}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(t.date)}</span>
                      <Badge variant="outline" className="font-normal">
                        {t.category}
                      </Badge>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold",
                      t.type === "income" ? "text-income" : "text-expense"
                    )}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
