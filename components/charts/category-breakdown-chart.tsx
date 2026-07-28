"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CHART_CATEGORY_PALETTE } from "@/lib/chart-colors";
import type { CategoryBreakdownPoint } from "@/hooks/use-transactions";

export function CategoryBreakdownChart({ data }: { data: CategoryBreakdownPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        אין הוצאות החודש להצגה
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={2}
          strokeWidth={2}
          stroke="var(--card)"
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={CHART_CATEGORY_PALETTE[index % CHART_CATEGORY_PALETTE.length]} />
          ))}
        </Pie>
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
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: 13, paddingInlineStart: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
