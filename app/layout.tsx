import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanji Dojo",
  description: "Your daily JLPT N5 Kanji training ground.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
