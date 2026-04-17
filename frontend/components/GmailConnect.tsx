"use client";
import { useState } from "react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function GmailConnect({ onConnected }: { onConnected?: () => void }) {
  const [loading, setLoading] = useState(false);

  const connect = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("leverage_token") : null;
      const res = await fetch(`${BASE}/api/gmail/auth-url`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const { url } = await res.json();
      window.open(url, "_blank", "width=500,height=600");
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={connect}
      disabled={loading}
      className="flex items-center gap-2 text-sm bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-lg transition font-medium shadow-sm"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
      {loading ? "Opening…" : "Connect Gmail"}
    </button>
  );
}
