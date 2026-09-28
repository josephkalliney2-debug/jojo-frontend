import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JOJO Cloud — The Ultimate Cloud Business Suite",
  description:
    "Instantly launch your own fully isolated ERP instance — accounting, payroll, contracts, helpdesk, inventory and more, all in one subscription.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
