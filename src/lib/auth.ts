import { AppError } from "@/lib/errors";

type DashboardAuthConfig = {
  username: string;
  password: string;
};

export function getDashboardAuthConfig() {
  const username = process.env.DASHBOARD_BASIC_AUTH_USERNAME;
  const password = process.env.DASHBOARD_BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return { username, password } satisfies DashboardAuthConfig;
}

export function parseBasicAuthHeader(headerValue: string | null) {
  if (!headerValue || !headerValue.startsWith("Basic ")) {
    return null;
  }

  const encoded = headerValue.slice("Basic ".length).trim();

  if (!encoded) {
    return null;
  }

  try {
    const decoded =
      typeof atob === "function"
        ? atob(encoded)
        : Buffer.from(encoded, "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export function isAuthorizedByBasicAuth(
  headerValue: string | null,
  config: DashboardAuthConfig | null,
) {
  if (!config) {
    return false;
  }

  const credentials = parseBasicAuthHeader(headerValue);

  if (!credentials) {
    return false;
  }

  return (
    credentials.username === config.username && credentials.password === config.password
  );
}

export function assertDashboardBasicAuth(headerValue: string | null) {
  const config = getDashboardAuthConfig();

  if (!config) {
    throw new AppError(
      "Dashboard basic auth is not configured.",
      503,
      "Set DASHBOARD_BASIC_AUTH_USERNAME and DASHBOARD_BASIC_AUTH_PASSWORD in the environment.",
    );
  }

  if (!isAuthorizedByBasicAuth(headerValue, config)) {
    throw new AppError(
      "Authentication required.",
      401,
      "Open /dashboard in a browser and sign in with the configured basic auth credentials.",
    );
  }
}
