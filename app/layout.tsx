import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FactuPro",
  description: "SaaS de gestion de factures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      telemetry={false}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html
        lang="fr"
        data-theme="fantasy"
        className={`${geistSans.variable} h-full antialiased`}
      >
        <body className="min-h-full font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
