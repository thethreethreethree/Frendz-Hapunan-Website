import type { Metadata } from "next";
import { Baloo_2, Mulish } from "next/font/google";
import "./globals.css";

const display = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
});

const body = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-mulish",
});

export const metadata: Metadata = {
  title: "Frendz Hapunan — Filipino Dinner & Social Night",
  description:
    "Authentic Filipino dinner and social night at Frendz Hostel El Nido. Reserve your seat, play the food trivia, and make new friends.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="font-body bg-cream text-ink min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
