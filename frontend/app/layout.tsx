import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LEVERAGE — Negotiation Memory",
  description: "Vendor negotiation intelligence powered by Hindsight + OpenAI Agents SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-[#f8f9fa] text-gray-900">
        <AuthProvider>
          <nav className="border-b border-neutral-200 bg-white px-6 py-3 flex items-center justify-between">
            <a href="/" className="text-sm font-bold tracking-widest text-gray-900">LEVERAGE</a>
            <UserMenu />
          </nav>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
