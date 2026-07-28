import type { Business } from "@/lib/types";

export const BUSINESSES: Business[] = [
  {
    id: "chen-digital",
    name: "Chen Digital",
    incomeCategories: ["בניית אתרים", "עיצוב", "תחזוקה", "אוטומציות", "אחר"],
    incomeChannels: ["Sumit", "העברה ישירה", "אחר"],
    expenseCategories: [
      "תוכנות",
      "פרסום",
      "הנהלת חשבונות",
      "ביטוח לאומי",
      "פנסיה",
      "ציוד",
      "אחר",
    ],
  },
  {
    id: "omri-pizza",
    name: "העסק של עומרי – פיצה",
    incomeCategories: ["מכירות", "משלוחים", "אירועים", "אחר"],
    incomeChannels: ["אתר", "וולט", "משלוחה עצמאית", "קופה/חנות", "אחר"],
    expenseCategories: [
      "חומרי גלם",
      "עובדים",
      "שכירות",
      "חשמל",
      "משלוחים",
      "אריזות",
      "ציוד",
      "פרסום",
      "אחר",
    ],
  },
];

export function getBusiness(id: string): Business | undefined {
  return BUSINESSES.find((b) => b.id === id);
}
