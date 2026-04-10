import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDashboardAuthConfig, isAuthorizedByBasicAuth } from "@/lib/auth";

function withBasicAuthChallenge(request: NextRequest) {
  const config = getDashboardAuthConfig();

  if (!config) {
    return new NextResponse(
      "Dashboard basic auth is not configured. Set DASHBOARD_BASIC_AUTH_USERNAME and DASHBOARD_BASIC_AUTH_PASSWORD.",
      { status: 503 },
    );
  }

  if (isAuthorizedByBasicAuth(request.headers.get("authorization"), config)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="GBC Dashboard", charset="UTF-8"',
    },
  });
}

export function proxy(request: NextRequest) {
  return withBasicAuthChallenge(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/sync", "/api/telegram/test"],
};
