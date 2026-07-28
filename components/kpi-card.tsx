import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "income" | "expense";
}

const TONE_STYLES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-accent text-accent-foreground",
  income: "bg-income/10 text-income",
  expense: "bg-expense/10 text-expense",
};

export function KpiCard({ label, value, icon: Icon, tone = "default" }: KpiCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="flex items-center gap-3 px-5 py-4">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", TONE_STYLES[tone])}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl leading-tight font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
