import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "Tendril — Rent Real Compute by the Second",
  description: "Rent and contribute sandboxed compute with x402 on Algorand.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
