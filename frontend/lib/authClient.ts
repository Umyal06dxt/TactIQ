const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://set-daring-tadpole.ngrok-free.app";
const TOKEN_KEY = "leverage_token";

export type User = { id: string; email: string; full_name: string | null };

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchMe(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearToken();
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).detail ?? "Login failed");
  const data = await res.json();
  setToken(data.token);
  return { id: data.user_id, email: data.email, full_name: null };
}

export async function signup(
  email: string,
  password: string,
  fullName: string,
): Promise<User> {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (!res.ok) throw new Error((await res.json()).detail ?? "Signup failed");
  const data = await res.json();
  setToken(data.token);
  return { id: data.user_id, email: data.email, full_name: fullName };
}

export function logout(): void {
  clearToken();
  window.location.href = "/login";
}
