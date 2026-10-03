import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "Tendril Docs",
  description: "Learn to rent compute, build agents, and integrate Tendril's HTTP and x402 APIs.",
  metadataBase: new URL("https://docs.tendrilhq.com"),
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
