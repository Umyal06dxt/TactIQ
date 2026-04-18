"use client";
import { useEffect } from "react";
import { setToken } from "@/lib/authClient";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const { refresh } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setToken(token);
      refresh().then(() => { window.location.href = "/dashboard"; });
    } else {
      window.location.href = "/login";
    }
  }, [refresh]);

  return (
    <div className="min-h-screen bg-[#05080f] flex items-center justify-center">
      <p className="text-white/40 text-sm">Signing you in…</p>
    </div>
  );
}
