import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "FormFlow - Professionele Form Builder",
  description: "Een moderne, commercieel inzetbare form builder en survey tool gebouwd met Next.js, Supabase en Vercel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
