import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Vanessa — If You Qualify",
  description:
    "A highly exclusive, questionably serious private entertainment booking experience.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
