import type { Metadata } from "next";
import { Geist_Mono, Rubik } from "next/font/google";
import { Header } from "@/components/Header";
import { he } from "@/lib/i18n/he";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: he.home.metaTitle,
  description: he.home.metaDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${rubik.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface font-sans">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
