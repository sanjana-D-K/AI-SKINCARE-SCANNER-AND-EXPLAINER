import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skincare Scanner — Understand Every Ingredient",
  description:
    "Upload a photo of any skincare product and get plain-English explanations of every ingredient, tailored for acne-prone skin.",
  openGraph: {
    title: "Skincare Ingredient Scanner",
    description: "Decode your skincare labels in seconds.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8faf9]">{children}</body>
    </html>
  );
}
