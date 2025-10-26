import { headers } from "next/headers";

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

  let origin: string | null = null;
  try {
    const headerList = await headers();
    const host =
      headerList.get("x-forwarded-host") ?? headerList.get("host") ?? undefined;
    if (host) {
      const protocol =
        headerList.get("x-forwarded-proto") ??
        headerList.get("forwarded-proto") ??
        "http";
      origin = `${protocol}://${host}`;
    }
  } catch {
    origin = null;
  }

  if (!origin) {
    const port = process.env.PORT ?? "3000";
    origin = `http://localhost:${port}`;
  }

  return `${origin}${normalizedPath}`;
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const endpoint = await resolveGraphQLEndpoint();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

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
