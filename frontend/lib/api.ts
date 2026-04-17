import type { Briefing, Vendor, NoMemoryResponse, IngestRequest, IngestResponse } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return (await res.json()) as T;
}

export const api = {
  vendors: () => j<{ vendors: Vendor[] }>(`${BASE}/api/vendors`),
  briefing: (vendor: string) => j<Briefing>(`${BASE}/api/briefing?vendor=${vendor}`),
  nomemory: (vendor: string) =>
    j<NoMemoryResponse>(`${BASE}/api/briefing/nomemory?vendor=${vendor}`, { method: "POST" }),
  ingest: (req: IngestRequest) =>
    j<IngestResponse>(`${BASE}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    }),
};
