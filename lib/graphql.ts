import { buildBasicAuthHeader, resolveInternalOrigin } from "./internalOrigin";

type GraphQLErrorItem = {
  message: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLErrorItem[];
};

async function resolveGraphQLEndpoint(): Promise<string> {
  const proxyPath =
    process.env.NEXT_PUBLIC_GRAPHQL_PROXY_PATH?.trim() || "/api/graphql";
  const normalizedPath = proxyPath.startsWith("/") ? proxyPath : `/${proxyPath}`;

  if (typeof window !== "undefined") {
    return normalizedPath;
  }

  const origin = await resolveInternalOrigin();
  return `${origin}${normalizedPath}`;
}

function buildAPIKeyHeader():
  | {
      Authorization: string;
    }
  | undefined {
  const apiKey = process.env.API_SECRET_KEY;
  if (!apiKey) {
    return undefined;
  }
  return { Authorization: `Bearer ${apiKey}` };
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const endpoint = await resolveGraphQLEndpoint();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // サーバーサイドの場合、API Key認証を使用
  if (typeof window === "undefined") {
    const apiKeyHeader = buildAPIKeyHeader();
    if (apiKeyHeader) {
      headers.Authorization = apiKeyHeader.Authorization;
    } else {
      // Fallback to Basic Auth if API_SECRET_KEY is not set
      const authHeader = buildBasicAuthHeader();
      if (authHeader) {
        headers.Authorization = authHeader.Authorization;
      }
    }
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const rawBody = await res.text().catch(() => "");
    const snippet = rawBody.slice(0, 200);
    const hintedType = contentType || "unknown";
    throw new Error(
      `Unexpected GraphQL response (content-type: ${hintedType}). Body preview: ${snippet}`,
    );
  }

  const body = (await res.json()) as GraphQLResponse<T>;

  if (!res.ok || body.errors?.length) {
    const message =
      body.errors?.[0]?.message ??
      `GraphQL request failed with status ${res.status}`;
    throw new Error(message);
  }

  if (!body.data) {
    throw new Error("GraphQL response does not contain data");
  }

  return body.data;
}
