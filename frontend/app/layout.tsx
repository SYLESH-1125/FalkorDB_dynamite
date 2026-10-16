import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { ToastProvider } from "@/src/presentation/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: {
    default: "CMPDI Intelligence Platform",
    template: "%s · CMPDI Intelligence Platform",
  },
  description:
    "Document digitisation, AI-assisted query and automated reporting platform for Central Mine Planning & Design Institute, Coal India Limited.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
