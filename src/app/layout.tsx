import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/shared/components/providers/ThemeProvider";
import { QueryProvider } from "@/shared/components/providers/QueryProvider";
import { DEFAULT_APP_THEME } from "@/shared/constants/map-config";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BranGo - Control Tower & Logística",
  description: "Sistema inteligente para la gestión de pedidos, hojas de ruta y telemetría de conductores en tiempo real.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

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
          defaultTheme={DEFAULT_APP_THEME}
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
