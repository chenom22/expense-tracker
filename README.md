# מערכת ניהול הכנסות והוצאות

מערכת ווב בעברית (RTL) לניהול הכנסות והוצאות עבור שני עסקים נפרדים: **Chen Digital** ו-**העסק של עומרי – פיצה**. כוללת דשבורד עם KPIs וגרפים, טבלת תנועות עם חיפוש/סינון, והוספה/עריכה/מחיקה של הכנסות והוצאות.

## טכנולוגיות

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (מבוסס Base UI)
- **Recharts** לגרפים
- **react-hook-form** + **zod** לטפסים ואימות
- **localStorage** כשכבת נתונים זמנית (ראו הרחבה למטה)

## הרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה תרוץ בכתובת [http://localhost:3000](http://localhost:3000) ותפנה אוטומטית לדשבורד.

בהרצה ראשונה נטענים נתוני דמה (כ-3 חודשים אחורה) לכל עסק, כדי שהדשבורד והגרפים יהיו מלאים מיד.

## פקודות זמינות

```bash
npm run dev     # שרת פיתוח
npm run build   # build לפרודקשן + בדיקת טיפוסים
npm run start   # הרצת ה-build
npm run lint    # ESLint
```

## ארכיטקטורה

### שכבת נתונים

כל הגישה לנתונים עוברת דרך ממשק אחיד ב-`lib/data/repository.ts`:

```ts
interface DataRepository {
  listBusinesses(): Promise<Business[]>;
  listTransactions(businessId: BusinessId): Promise<Transaction[]>;
  createTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, input: TransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
}
```

המימוש הנוכחי, `lib/data/local-storage-repository.ts`, שומר הכל ב-`localStorage` בדפדפן. כל המתודות מוגדרות כ-`async` מראש, כך שהחלפה עתידית ב-DB/API אמיתי לא תדרוש שינוי בקוד שצורך את ה-repository.

**כדי לחבר מסד נתונים אמיתי מחר:**

1. כתבו מימוש חדש ל-`DataRepository` (למשל מעל `fetch` מול API, או Prisma/Supabase וכו').
2. החליפו את השורה היחידה ב-`lib/data/index.ts`:
   ```ts
   export const repository: DataRepository = new LocalStorageRepository();
   // ->
   export const repository: DataRepository = new MyApiRepository();
   ```
3. שאר האפליקציה (hooks, קומפוננטות, עמודים) לא צריכה להשתנות כלל.

### מבנה תיקיות עיקרי

```
app/(app)/dashboard/     דשבורד לעסק הנבחר
app/(app)/transactions/  טבלת כל התנועות עם סינון וחיפוש
components/transactions/ טפסי הוספה/עריכה + טבלה + פילטרים
components/charts/       גרפי הכנסות/הוצאות וחלוקת קטגוריות
context/                 עסק נבחר (business) + מצב תנועות משותף
hooks/use-transactions.ts CRUD + חישובי KPI/גרפים
lib/types.ts             מודל הנתונים (Business, Transaction וכו')
lib/data/                שכבת הנתונים (repository, seed, businesses)
```

### עסקים וקטגוריות

רשימת העסקים והקטגוריות שלהם (הכנסות/הוצאות) מוגדרת ב-`lib/data/businesses.ts`. הוספת עסק שלישי או שינוי קטגוריות נעשה שם.

## הערות

- העיצוב מותאם RTL מלא (`dir="rtl"`, קלאסים לוגיים `ms-`/`me-`/`ps-`/`pe-`).
- כל עסק שומר נתונים נפרדים ב-localStorage, כולל גוון accent עדין משלו בממשק.
- מחיקת תנועה דורשת אישור (confirm) לפני ביצוע.
