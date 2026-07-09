import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://salon-ecru-seven.vercel.app";
const DESCRIPTION =
  "Lumière гоо сайхны салон — онлайн цаг захиалга, үс засалт, будалт, хумс, нүүр арчилгаа. Туршлагатай мастерууд, тансаг орчин.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Lumière — Гоо сайхны салон",
  description: DESCRIPTION,
  keywords: [
    "гоо сайхны салон",
    "цаг захиалга",
    "үс засалт",
    "нүүр будалт",
    "хумс",
    "Улаанбаатар",
    "beauty salon",
    "Lumière",
  ],
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: "Lumière",
    title: "Lumière — Гоо сайхны салон",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumière — Гоо сайхны салон",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
