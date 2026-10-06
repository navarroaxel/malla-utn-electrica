import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { es } from "@/i18n/es";
import { I18nProvider } from "@/i18n/provider";
import { OG_IMAGE, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Static metadata is in the default locale; the provider updates the title on the client.
export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: es.app.title,
  description: es.app.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: es.app.title,
    description: es.app.description,
    siteName: es.app.name,
    type: "website",
    locale: "es_AR",
    images: [{ ...OG_IMAGE, alt: es.app.title }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
