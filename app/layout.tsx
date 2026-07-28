import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BusinessProvider } from "@/context/business-context";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-sans",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ניהול הכנסות והוצאות",
  description: "מערכת לניהול הכנסות והוצאות לעסקים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <BusinessProvider>
          {children}
          <Toaster position="top-center" richColors />
        </BusinessProvider>
      </body>
    </html>
  );
}
