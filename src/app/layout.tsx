import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });

export const metadata: Metadata = {
  title: "ClaritySME — Financial Intelligence for Growing Businesses",
  description: "Real-time KPI dashboards, cash flow forecasting, and AI insights for SMEs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${syne.variable}`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
