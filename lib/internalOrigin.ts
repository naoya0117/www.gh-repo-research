import { headers } from "next/headers";

const envOriginCandidates = [
  "INTERNAL_APP_ORIGIN",
  "APP_ORIGIN",
  "NEXT_PUBLIC_APP_URL",
  "NEXTAUTH_URL",
];

export async function resolveInternalOrigin(): Promise<string> {
  // Try to read from request headers when available
  try {
    const headerList = await headers();
    const host =
      headerList.get("x-forwarded-host") ?? headerList.get("host") ?? undefined;
    if (host) {
      const protocol =
        headerList.get("x-forwarded-proto") ??
        headerList.get("forwarded-proto") ??
        "http";
      return `${protocol}://${host}`;
    }
  } catch {
    // Ignore – fall back to environment variables
  }

  for (const key of envOriginCandidates) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.trim().replace(/\/$/, "");
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

export async function resolveInternalUrl(path: string): Promise<string> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = await resolveInternalOrigin();
  return `${origin}${normalizedPath}`;
}
