import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "$DEGEN Tips Extension Server",
  description: "API for $DEGEN tips validation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="overflow-hidden">{children}</body>
    </html>
  );
}
