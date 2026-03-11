import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n";

const bricolage = localFont({
  src: "../fonts/BricolageGrotesque-Variable.ttf",
  variable: "--font-bricolage",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "POS Pizza - Realtime",
  description: "Modern Point of Sale System for Pizzerias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bricolage.variable} font-sans bg-background text-foreground antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider defaultLocale="es">
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
