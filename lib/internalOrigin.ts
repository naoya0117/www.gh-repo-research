import { Buffer } from "node:buffer";

const FALLBACK_PORT = process.env.PORT ?? "3000";
const FALLBACK_ORIGIN = `http://localhost:${FALLBACK_PORT}`;

function resolvePublicAppUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value || !value.trim()) {
    return null;
  }
  try {
    const url = new URL(value);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    // Ignore invalid URLs; fall back below
    return null;
  }
}

export async function resolveInternalOrigin(): Promise<string> {
  const origin = resolvePublicAppUrl();
  if (origin) {
    return origin;
  }
  return FALLBACK_ORIGIN;
}

export async function resolveInternalUrl(path: string): Promise<string> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = await resolveInternalOrigin();
  return `${origin}${normalizedPath}`;
}

export function buildBasicAuthHeader():
  | {
      Authorization: string;
    }
  | undefined {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) {
    return undefined;
  }
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}
