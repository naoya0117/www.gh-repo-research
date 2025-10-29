import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";
const GRAPHQL_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/query`;

export async function POST(request: NextRequest) {
  try {
    // クライアントからのリクエストボディを取得
    const body = await request.json();

    // API認証用のヘッダーを準備
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // API_SECRET_KEYを使用してバックエンドに認証
    const apiKey = process.env.API_SECRET_KEY;
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    // バックエンドのGraphQLサーバーにプロキシ
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    // 認証エラー（401）の場合は特別に処理
    if (response.status === 401) {
      const text = await response.text();
      console.error(`[GraphQL Proxy] Authentication failed: ${text}`);

      return NextResponse.json(
        {
          errors: [
            {
              message: `認証エラー: ${text || "APIキーが無効です"}`,
            },
          ],
        },
        { status: 401 }
      );
    }

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
