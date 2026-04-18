import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { NavLink } from "@/components/NavLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TactIQ — Negotiation Intelligence",
  description: "AI-powered vendor negotiation coaching. Real-time guidance, institutional memory, deal intelligence.",
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
          <nav className="border-b border-neutral-200 bg-white/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-2 group">
                <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-sm font-black tracking-widest text-gray-900">TACTIQ</span>
              </a>
              <div className="hidden md:flex items-center gap-1">
                <NavLink href="/dashboard">Portfolio</NavLink>
                <NavLink href="/analytics">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                  </span>
                </NavLink>
                <NavLink href="/pricing">Pricing</NavLink>
              </div>
            </div>
            <UserMenu />
          </nav>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
