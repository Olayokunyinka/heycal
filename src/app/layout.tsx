import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { OfflineProvider } from "@/hooks/use-offline";
import { WebVitals } from "@/components/web-vitals";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
  preload: true,
});

export const metadata: Metadata = {
  title: "Heycal | Simple Meeting Scheduling",
  description: "Eliminate back-and-forth emails. Connect your calendar and let people book time with you instantly. A professional scheduling tool built for speed.",
  keywords: ["scheduling", "calendar", "meetings", "google calendar", "productivity"],
  authors: [{ name: "Heycal Team" }],
  openGraph: {
    title: "Heycal",
    description: "Simplifying meeting scheduling.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a73e8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
    >
      <html lang="en">
        <body
          className={`${roboto.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <WebVitals />
          <OfflineProvider>
            {children}
            <Toaster />
          </OfflineProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
