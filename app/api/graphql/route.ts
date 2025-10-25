import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";
const GRAPHQL_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/query`;

export async function POST(request: NextRequest) {
  try {
    // クライアントからのリクエストボディを取得
    const body = await request.json();

    // バックエンドのGraphQLサーバーにプロキシ
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    // レスポンスのContent-Typeを確認
    const contentType = response.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      console.error(`[GraphQL Proxy] Unexpected content-type: ${contentType}`);
      console.error(`[GraphQL Proxy] Status: ${response.status}`);

      // HTMLなどが返ってきた場合
      const text = await response.text();
      console.error(`[GraphQL Proxy] Response body: ${text.substring(0, 200)}...`);

      return NextResponse.json(
        {
          errors: [
            {
              message: `GraphQLサーバーから予期しないレスポンス形式が返されました (${contentType})`,
            },
          ],
        },
        { status: 502 }
      );
    }

    // JSONレスポンスを取得
    const data = await response.json();

    // ステータスコードをそのまま返す
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[GraphQL Proxy] Error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "GraphQLリクエストの処理中にエラーが発生しました";

    return NextResponse.json(
      {
        errors: [{ message }],
      },
      { status: 500 }
    );
  }
}

// GETリクエストは許可しない（GraphQLはPOSTのみ）
export async function GET() {
  return NextResponse.json(
    {
      errors: [
        {
          message: "GraphQL endpoint requires POST method",
        },
      ],
    },
    { status: 405 }
  );
}
