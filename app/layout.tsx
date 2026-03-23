import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scope — Turn briefs into proposals",
  description: "Paste any client enquiry. Get a structured scope, risk analysis, and ready-to-send proposal in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0, background: "var(--bg)" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
