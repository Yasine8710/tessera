import type { Metadata, Viewport } from "next";
import { DesktopBridge } from "@/components/desktop-bridge";
import { isDesktop } from "@/server/desktop";
import { themeInitScript } from "@/components/theme";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Tessera — Connected care. Better everyday health.", template: "%s · Tessera" },
  description:
    "Tessera is a free healthcare coordination platform for patient medication tracking, daily routines, and authorized clinical follow-up.",
  openGraph: {
    title: "Tessera — Connected care. Better everyday health.",
    description: "Free medication tracking, routines and follow-up coordination for patients and their care teams.",
    type: "website",
    siteName: "Tessera",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f5f7" }, { media: "(prefers-color-scheme: dark)", color: "#0e1218" }], width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <ToastProvider>{children}</ToastProvider>
        {isDesktop() && <DesktopBridge />}
      </body>
    </html>
  );
}
