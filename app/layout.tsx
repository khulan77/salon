import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { getSettings } from "@/app/lib/db";
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

/**
 * Гарчиг, тайлбарыг админы Тохиргооноос уншина. `title.template`-ийн ачаар хүү
 * хуудсууд зөвхөн өөрсдийн нэрээ ("Үйлчилгээ") зарлахад салоны нэр автоматаар
 * залгагдана.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { salonName, tagline, about } = await getSettings();
  const title = tagline ? `${salonName} — ${tagline}` : salonName;
  const description =
    about ||
    `${salonName} — онлайн цаг захиалга, үс засалт, будалт, хумс, нүүр арчилгаа. Туршлагатай мастерууд, тансаг орчин.`;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — ${salonName}` },
    description,
    keywords: [
      "гоо сайхны салон",
      "цаг захиалга",
      "үс засалт",
      "нүүр будалт",
      "хумс",
      "Улаанбаатар",
      "beauty salon",
      salonName,
    ],
    openGraph: {
      type: "website",
      locale: "mn_MN",
      siteName: salonName,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

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
