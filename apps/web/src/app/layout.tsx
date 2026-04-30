import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n";

const manrope = localFont({
  src: [
    { path: "../fonts/Manrope-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../fonts/Manrope-Light.ttf", weight: "300", style: "normal" },
    { path: "../fonts/Manrope-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Manrope-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Manrope-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Manrope-Bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/Manrope-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
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
      <body className={`${manrope.variable} font-sans bg-background text-foreground antialiased`} suppressHydrationWarning>
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
