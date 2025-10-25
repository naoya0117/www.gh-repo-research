type GraphQLErrorItem = {
  message: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLErrorItem[];
};

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";
const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_ENDPOINT ??
  `${API_BASE_URL.replace(/\/$/, "")}/query`;

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
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
