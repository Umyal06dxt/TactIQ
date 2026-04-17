"use client";
import { useAuth } from "@/contexts/AuthContext";

export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return (
    <a href="/login" className="text-sm text-neutral-500 hover:text-neutral-800 transition">Sign in</a>
  );
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-neutral-500">{user.email}</span>
      <button onClick={logout} className="text-xs text-neutral-400 hover:text-neutral-600 transition">Sign out</button>
    </div>
  );
}
