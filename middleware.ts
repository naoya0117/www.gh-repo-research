import { NextRequest, NextResponse } from "next/server";

const username = process.env.BASIC_AUTH_USER;
const password = process.env.BASIC_AUTH_PASSWORD;

function isAuthDisabled(): boolean {
  return !username || !password;
}

function isAuthorized(request: NextRequest): boolean {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) {
    return false;
  }

  const base64Credentials = header.replace("Basic ", "").trim();
  const decoded = Buffer.from(base64Credentials, "base64").toString("utf8");
  const [inputUser, inputPassword] = decoded.split(":");
  return inputUser === username && inputPassword === password;
}

export function middleware(request: NextRequest) {
  if (isAuthDisabled() || isAuthorized(request)) {
    return NextResponse.next();
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Authentication required"',
    },
  });
}

export const config = {
  matcher: "/:path*",
};
