import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Research Desk",
  description:
    "A personal learning OS for transitioning to frontier-lab research engineering. Curriculum, flashcards, papers, notes.",
  applicationName: "Research Desk",
  authors: [{ name: "Hanyu" }],
  keywords: [
    "RLHF",
    "post-training",
    "research engineering",
    "PPO",
    "DPO",
    "flashcards",
    "learning",
  ],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // Solarized Light cream — the honest color of the app shell.
  themeColor: "#FDF6E3",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-solar-50 text-solar-700 antialiased">
        {children}
      </body>
    </html>
  );
}
