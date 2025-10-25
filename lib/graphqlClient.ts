/**
 * クライアントサイド用のGraphQLリクエスト関数
 * Next.js API Route (/api/graphql) を経由してバックエンドに接続
 */

type GraphQLErrorItem = {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLErrorItem[];
};

export class GraphQLError extends Error {
  constructor(
    message: string,
    public errors?: GraphQLErrorItem[]
  ) {
    super(message);
    this.name = "GraphQLError";
  }
}

/**
 * GraphQLリクエストを実行（クライアントサイド用）
 */
export async function graphqlClientRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    const response = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    // Content-Typeを確認してHTMLが返ってきていないかチェック
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error(`Unexpected content-type: ${contentType}`);
      console.error(`Response preview: ${text.substring(0, 200)}...`);

      throw new GraphQLError(
        `サーバーから予期しないレスポンス形式が返されました (${contentType})`
      );
    }

    // JSONとしてパース
    const body = (await response.json()) as GraphQLResponse<T>;

    // GraphQLエラーをチェック
    if (body.errors?.length) {
      const errorMessage = body.errors.map((e) => e.message).join(", ");
      throw new GraphQLError(errorMessage, body.errors);
    }

    // HTTPエラーをチェック
    if (!response.ok) {
      throw new GraphQLError(
        `GraphQLリクエストが失敗しました (HTTP ${response.status})`
      );
    }

    // データが存在しない場合
    if (!body.data) {
      throw new GraphQLError("GraphQLレスポンスにデータが含まれていません");
    }

    return body.data;
  } catch (error) {
    // GraphQLErrorはそのまま再スロー
    if (error instanceof GraphQLError) {
      throw error;
    }

    // ネットワークエラーや予期しないエラー
    if (error instanceof Error) {
      throw new GraphQLError(`通信エラー: ${error.message}`);
    }

    throw new GraphQLError("不明なエラーが発生しました");
  }
}

/**
 * エラーメッセージを抽出（ユーザー表示用）
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof GraphQLError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "不明なエラーが発生しました";
}
