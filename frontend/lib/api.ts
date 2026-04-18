import type {
  Briefing, Vendor, NoMemoryResponse, IngestRequest, IngestResponse,
  CallRecord, EmailThread, VendorCreateRequest, VendorAnalytics, PortfolioAnalytics,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return (await res.json()) as T;
}

const authHeader = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("leverage_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // ---------------------------------------------------------------------------
  // Vendors
  // ---------------------------------------------------------------------------
  vendors: () => j<{ vendors: Vendor[] }>(`${BASE}/api/vendors`),

  vendor: {
    create: (req: VendorCreateRequest) =>
      j<Vendor>(`${BASE}/api/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(req),
      }),
    update: (bank_id: string, req: Partial<VendorCreateRequest>) =>
      j<Vendor>(`${BASE}/api/vendors/${bank_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(req),
      }),
    delete: (bank_id: string) =>
      j<{ deleted: boolean }>(`${BASE}/api/vendors/${bank_id}`, {
        method: "DELETE",
        headers: authHeader(),
      }),
  },

  // ---------------------------------------------------------------------------
  // Briefing
  // ---------------------------------------------------------------------------
  briefing: (vendor: string) => j<Briefing>(`${BASE}/api/briefing?vendor=${vendor}`),
  nomemory: (vendor: string) =>
    j<NoMemoryResponse>(`${BASE}/api/briefing/nomemory?vendor=${vendor}`, { method: "POST" }),
  ingest: (req: IngestRequest) =>
    j<IngestResponse>(`${BASE}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    }),

  // ---------------------------------------------------------------------------
  // Calls
  // ---------------------------------------------------------------------------
  calls: {
    save: (body: {
      vendor: string;
      started_at: string;
      ended_at: string;
      duration_secs: number;
      transcript: string[];
      coaching_shown: object[];
      outcome: string | null;
      briefing_context: string;
      concessions_made?: number;
    }) =>
      j<{ id: string }>(`${BASE}/api/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      }),
    list: (vendor: string) =>
      j<{ calls: CallRecord[] }>(`${BASE}/api/calls/${vendor}`, {
        headers: authHeader(),
      }),
    get: (vendor: string, id: string) =>
      j<CallRecord>(`${BASE}/api/calls/${vendor}/${id}`, {
        headers: authHeader(),
      }),
  },

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------
  analytics: {
    portfolio: () =>
      j<PortfolioAnalytics>(`${BASE}/api/analytics/portfolio`, {
        headers: authHeader(),
      }),
    vendor: (vendor: string) =>
      j<VendorAnalytics>(`${BASE}/api/analytics/${vendor}`, {
        headers: authHeader(),
      }),
  },

  // ---------------------------------------------------------------------------
  // Gmail
  // ---------------------------------------------------------------------------
  gmail: {
    emails: (vendor: string, contactEmail: string) =>
      j<{ emails: EmailThread[] }>(
        `${BASE}/api/gmail/emails/${vendor}?contact_email=${encodeURIComponent(contactEmail)}`,
        { headers: authHeader() }
      ),
  },
};
