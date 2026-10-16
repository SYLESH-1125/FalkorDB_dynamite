import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Anton, Bowlby_One_SC } from "next/font/google";
import { ToastProvider } from "@/src/presentation/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const bowlby = Bowlby_One_SC({
  variable: "--font-bowlby",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BHUMI",
    template: "%s · BHUMI",
  },
  description:
    "Document digitisation, AI-assisted query and automated reporting platform — Bharat Hub for Unified Mining Intelligence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} ${anton.variable} ${bowlby.variable} h-full`}>
      <body className="min-h-full bg-canvas text-ink-0 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
