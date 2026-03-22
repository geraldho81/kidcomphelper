import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "KidComp Helper",
  description: "AI-powered composition planning for Singapore P5/P6 students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="font-[family-name:var(--font-outfit)] h-full antialiased" style={{ background: "var(--bg)" }}>
        {children}
      </body>
    </html>
  );
}
