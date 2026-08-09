import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Prompt2Plan — Design spaces with words",
  description:
    "Transform simple prompts into interactive 3D floor plans instantly. Apple-inspired AI floor planning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-ds-bg font-sans text-ds-text antialiased">{children}</body>
    </html>
  );
}
