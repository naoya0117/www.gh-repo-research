import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";
const UPSTREAM_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/admin/check-queries`;

function buildUpstreamHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const forwardKeys = ["content-type", "cookie", "authorization", "accept"];

  for (const key of forwardKeys) {
    const value = request.headers.get(key);
    if (value) {
      headers.set(key, value);
    }
  }

  return headers;
}

async function proxyRequest(request: NextRequest) {
  const target = `${UPSTREAM_ENDPOINT}${request.nextUrl.search}`;

  const init: RequestInit = {
    method: request.method,
    headers: buildUpstreamHeaders(request),
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const upstream = await fetch(target, init);

  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-length") {
      return;
    }
    headers.set(key, value);
  });

  if ([301, 302, 303, 307, 308, 204].includes(upstream.status)) {
    return new NextResponse(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}
