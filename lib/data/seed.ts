import type {
  BusinessId,
  ExpenseTransaction,
  IncomeTransaction,
  PaymentMethod,
  Transaction,
} from "@/lib/types";

const PAYMENT_METHODS: PaymentMethod[] = [
  "מזומן",
  "העברה בנקאית",
  "אשראי",
  "ביט",
  "צ'ק",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) / 10) * 10;
}

function randomDateInMonthsAgo(monthsAgo: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthsAgo;
  const target = new Date(year, month, 1);
  const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const day =
    monthsAgo === 0
      ? Math.min(now.getDate(), Math.floor(Math.random() * now.getDate()) + 1)
      : Math.floor(Math.random() * daysInMonth) + 1;
  const d = new Date(target.getFullYear(), target.getMonth(), day);
  return d.toISOString().slice(0, 10);
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-seed-${counter}`;
}

interface IncomeSeedSpec {
  category: string;
  sources: string[];
  amountRange: [number, number];
  perMonth: [number, number];
}

interface ExpenseSeedSpec {
  category: string;
  vendors: string[];
  amountRange: [number, number];
  perMonth: [number, number];
  recurring: boolean;
}

function buildIncome(
  businessId: BusinessId,
  monthsAgo: number,
  spec: IncomeSeedSpec
): IncomeTransaction[] {
  const count =
    Math.floor(Math.random() * (spec.perMonth[1] - spec.perMonth[0] + 1)) + spec.perMonth[0];
  return Array.from({ length: count }, () => {
    const date = randomDateInMonthsAgo(monthsAgo);
    return {
      id: nextId("income"),
      businessId,
      type: "income",
      date,
      amount: randomAmount(spec.amountRange[0], spec.amountRange[1]),
      category: spec.category,
      source: pick(spec.sources),
      paymentMethod: pick(PAYMENT_METHODS),
      createdAt: new Date(date).toISOString(),
    } satisfies IncomeTransaction;
  });
}

function buildExpense(
  businessId: BusinessId,
  monthsAgo: number,
  spec: ExpenseSeedSpec
): ExpenseTransaction[] {
  const count =
    Math.floor(Math.random() * (spec.perMonth[1] - spec.perMonth[0] + 1)) + spec.perMonth[0];
  return Array.from({ length: count }, () => {
    const date = randomDateInMonthsAgo(monthsAgo);
    return {
      id: nextId("expense"),
      businessId,
      type: "expense",
      date,
      amount: randomAmount(spec.amountRange[0], spec.amountRange[1]),
      category: spec.category,
      vendor: pick(spec.vendors),
      paymentMethod: pick(PAYMENT_METHODS),
      recurrence: spec.recurring ? "קבועה" : "חד פעמית",
      createdAt: new Date(date).toISOString(),
    } satisfies ExpenseTransaction;
  });
}

const CHEN_INCOME: IncomeSeedSpec[] = [
  {
    category: "בניית אתרים",
    sources: ["סטודיו נועה עיצוב פנים", "קליניקת שיניים ד\"ר לוי", "יוגה עם רוני", "חברת טאטू בע\"מ"],
    amountRange: [2500, 8500],
    perMonth: [1, 2],
  },
  {
    category: "עיצוב",
    sources: ["מסעדת הבית", "פרילנסר - עיצוב לוגו", "סטודיו נועה עיצוב פנים"],
    amountRange: [600, 2200],
    perMonth: [1, 3],
  },
  {
    category: "תחזוקה",
    sources: ["קליניקת שיניים ד\"ר לוי", "חברת טאטू בע\"מ", "יוגה עם רוני"],
    amountRange: [300, 900],
    perMonth: [2, 4],
  },
  {
    category: "אוטומציות",
    sources: ["חברת טאטו בע\"מ", "עסק קטן - ייעוץ עסקי מיכל"],
    amountRange: [800, 3000],
    perMonth: [0, 2],
  },
  {
    category: "אחר",
    sources: ["לקוח מזדמן"],
    amountRange: [200, 700],
    perMonth: [0, 1],
  },
];

const CHEN_EXPENSE: ExpenseSeedSpec[] = [
  {
    category: "תוכנות",
    vendors: ["Google Workspace", "Adobe Creative Cloud", "Canva Pro", "Notion"],
    amountRange: [40, 350],
    perMonth: [2, 4],
    recurring: true,
  },
  {
    category: "פרסום",
    vendors: ["פייסבוק אדס", "גוגל אדס", "אינסטגרם קידום"],
    amountRange: [200, 1200],
    perMonth: [1, 2],
    recurring: false,
  },
  {
    category: "הנהלת חשבונות",
    vendors: ["משרד רואה חשבון כהן"],
    amountRange: [350, 600],
    perMonth: [1, 1],
    recurring: true,
  },
  {
    category: "ביטוח לאומי",
    vendors: ["המוסד לביטוח לאומי"],
    amountRange: [750, 1100],
    perMonth: [1, 1],
    recurring: true,
  },
  {
    category: "פנסיה",
    vendors: ["קרן פנסיה מגדל"],
    amountRange: [450, 850],
    perMonth: [1, 1],
    recurring: true,
  },
  {
    category: "ציוד",
    vendors: ["iStore", "KSP", "משרד ציוד"],
    amountRange: [200, 2800],
    perMonth: [0, 1],
    recurring: false,
  },
  {
    category: "אחר",
    vendors: ["הוצאות שונות"],
    amountRange: [80, 400],
    perMonth: [0, 1],
    recurring: false,
  },
];

const PIZZA_INCOME: IncomeSeedSpec[] = [
  {
    category: "מכירות",
    sources: ["לקוח מזדמן", "הזמנה בטלפון", "הזמנה במקום"],
    amountRange: [60, 350],
    perMonth: [10, 16],
  },
  {
    category: "משלוחים",
    sources: ["הזמנת Wolt", "הזמנת 10ביס"],
    amountRange: [80, 260],
    perMonth: [8, 14],
  },
  {
    category: "אירועים",
    sources: ["מסיבת יום הולדת", "אירוע חברה היי-טק", "אירוע בית ספר"],
    amountRange: [1200, 5500],
    perMonth: [0, 2],
  },
  {
    category: "אחר",
    sources: ["מכירת שוברים", "אחר"],
    amountRange: [50, 300],
    perMonth: [0, 1],
  },
];

const PIZZA_EXPENSE: ExpenseSeedSpec[] = [
  {
    category: "חומרי גלם",
    vendors: ["סיטונאי גבינות", "מאפיית קמח", "ירקן השוק", "סיטונאי בשר ונקניקים"],
    amountRange: [300, 1800],
    perMonth: [4, 7],
    recurring: false,
  },
  {
    category: "עובדים",
    vendors: ["עובד - דני", "עובד - שירה", "עובד - משמרת סוף שבוע"],
    amountRange: [2800, 5800],
    perMonth: [2, 3],
    recurring: true,
  },
  {
    category: "שכירות",
    vendors: ["בעל הנכס - שכירות חודשית"],
    amountRange: [4200, 6200],
    perMonth: [1, 1],
    recurring: true,
  },
  {
    category: "חשמל",
    vendors: ["חברת חשמל"],
    amountRange: [500, 1500],
    perMonth: [1, 1],
    recurring: true,
  },
  {
    category: "משלוחים",
    vendors: ["שליחי Wolt", "שליח פרילנסר"],
    amountRange: [100, 500],
    perMonth: [2, 4],
    recurring: false,
  },
  {
    category: "אריזות",
    vendors: ["חברת אריזות פארם", "קופסאות פיצה סיטונאי"],
    amountRange: [250, 900],
    perMonth: [1, 2],
    recurring: false,
  },
  {
    category: "ציוד",
    vendors: ["ציוד מטבח מקצועי", "תיקון תנור"],
    amountRange: [300, 3200],
    perMonth: [0, 1],
    recurring: false,
  },
  {
    category: "פרסום",
    vendors: ["פרסום פייסבוק/אינסטגרם", "עיצוב פליירים"],
    amountRange: [150, 900],
    perMonth: [0, 2],
    recurring: false,
  },
  {
    category: "אחר",
    vendors: ["הוצאות שונות"],
    amountRange: [80, 400],
    perMonth: [0, 1],
    recurring: false,
  },
];

export function generateSeedTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const months = [0, 1, 2];

  for (const monthsAgo of months) {
    for (const spec of CHEN_INCOME) {
      transactions.push(...buildIncome("chen-digital", monthsAgo, spec));
    }
    for (const spec of CHEN_EXPENSE) {
      transactions.push(...buildExpense("chen-digital", monthsAgo, spec));
    }
    for (const spec of PIZZA_INCOME) {
      transactions.push(...buildIncome("omri-pizza", monthsAgo, spec));
    }
    for (const spec of PIZZA_EXPENSE) {
      transactions.push(...buildExpense("omri-pizza", monthsAgo, spec));
    }
  }

  return transactions.sort((a, b) => b.date.localeCompare(a.date));
}
