import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const font = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "CareSync — Connected care. Better everyday health.", template: "%s · CareSync" },
  description:
    "CareSync is a free healthcare coordination platform for patient medication tracking, daily routines, and authorized clinical follow-up.",
  openGraph: {
    title: "CareSync — Connected care. Better everyday health.",
    description: "Free medication tracking, routines and follow-up coordination for patients and their care teams.",
    type: "website",
    siteName: "CareSync",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0f2a33", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
