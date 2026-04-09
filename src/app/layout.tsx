import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "GBC Analytics Dashboard",
  description: "RetailCRM -> Supabase analytics dashboard MVP",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
