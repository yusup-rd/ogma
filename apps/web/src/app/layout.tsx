import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

interface RootLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "Ogma",
  description: "A private resume builder.",
};

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-canvas text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
