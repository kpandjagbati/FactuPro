import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import RoleGate from "@/app/components/RoleGate";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FactuPro",
  description:
    "SaaS de facturation en français et en XOF — factures, devis, PDF, clients.",
};

const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem("factupro-theme");
    if (t === "dark" || t === "fantasy") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      telemetry={false}
      signInFallbackRedirectUrl="/invoices"
      signUpFallbackRedirectUrl="/invoices"
    >
      <html
        lang="fr"
        data-theme="fantasy"
        suppressHydrationWarning
        className={`${geistSans.variable} h-full antialiased`}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className="min-h-full bg-base-100 font-sans text-base-content">
          <ThemeProvider>
            <RoleGate>{children}</RoleGate>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
