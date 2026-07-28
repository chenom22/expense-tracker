"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CHART_EXPENSE, CHART_INCOME } from "@/lib/chart-colors";
import type { MonthlySeriesPoint } from "@/hooks/use-transactions";

export function IncomeExpenseChart({ data }: { data: MonthlySeriesPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        אין עדיין נתונים להצגה
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={data} barGap={6} barCategoryGap="24%">
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="var(--muted-foreground)"
          tickFormatter={(v) => new Intl.NumberFormat("he-IL", { notation: "compact" }).format(v)}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            direction: "rtl",
            borderRadius: 12,
            border: "1px solid var(--border)",
            fontSize: 13,
          }}
        />
        <Legend
          formatter={(value) => (value === "income" ? "הכנסות" : "הוצאות")}
          wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
        />
        <Bar dataKey="income" name="income" fill={CHART_INCOME} radius={[6, 6, 0, 0]} />
        <Bar dataKey="expense" name="expense" fill={CHART_EXPENSE} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
