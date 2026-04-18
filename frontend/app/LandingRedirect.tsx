"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authClient";

export function LandingRedirect() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    } else {
      setReady(true);
    }
  }, [router]);

  if (ready) return null;
  return (
    <div className="fixed inset-0 z-50 bg-white" aria-hidden="true" />
  );
}
