import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bran Go - Plataforma de Logística y Torre de Control",
  description: "Sistema inteligente para la gestión de pedidos, hojas de ruta y telemetría de conductores en tiempo real.",
};

import { ThemeProvider } from "@/shared/components/providers/ThemeProvider";
import { QueryProvider } from "@/shared/components/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} min-h-full bg-slate-50 text-slate-900 antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
