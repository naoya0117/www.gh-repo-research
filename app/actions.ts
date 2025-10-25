"use server";

import { revalidatePath } from "next/cache";

import { graphqlRequest } from "@/lib/graphql";

import type { FormState } from "./formState";

const CREATE_CHECK_RESULT_MUTATION = /* GraphQL */ `
  mutation CreateCheckResult($input: NewCheckResultInput!) {
    createCheckResult(input: $input) {
      success
      message
    }
  }
`;

type MutationResult = {
  success: boolean;
  message?: string | null;
};

function successState(message: string): FormState {
  return { status: "success", message };
}

function errorState(message: string): FormState {
  return { status: "error", message };
}

export async function createCheckQueryAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = formData.get("name");
  const description = formData.get("description");

  if (typeof name !== "string" || !name.trim()) {
    return errorState("名前は必須です");
  }

  const params = new URLSearchParams();
  params.set("name", name.trim());
  if (typeof description === "string" && description.trim()) {
    params.set("description", description.trim());
  }

  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/admin/check-queries`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html",
      },
      body: params.toString(),
      redirect: "manual",
    });

    if (response.status === 303) {
      let message = "チェッククエリを登録しました";
      const location = response.headers.get("location");

      if (location) {
        try {
          const redirected = new URL(location, endpoint);
          const flash = redirected.searchParams.get("flash");
          if (flash) {
            message = flash;
          }
        } catch {
          // ignore invalid redirect values and fall back to default message
        }
      }

      revalidatePath("/");
      return successState(message);
    }

    const rawHtml = await response.text().catch(() => null);
    if (rawHtml) {
      const errorMatch = rawHtml.match(/<div class="error">([\s\S]*?)<\/div>/);
      if (errorMatch?.[1]) {
        const sanitized = errorMatch[1]
          .replace(/<[^>]*>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .trim();
        if (sanitized) {
          return errorState(sanitized);
        }
      }
    }

    return errorState("チェッククエリの登録に失敗しました");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "チェッククエリの登録に失敗しました";
    return errorState(message);
  }
}

export async function createCheckResultAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const repositoryId = formData.get("repository_id");
  const checkItemId = formData.get("check_item_id");
  const result = formData.get("result");
  const memo = formData.get("memo");

  if (typeof repositoryId !== "string" || !repositoryId.trim()) {
    return errorState("リポジトリIDを入力してください");
  }
  if (typeof checkItemId !== "string" || !checkItemId.trim()) {
    return errorState("チェック項目IDを入力してください");
  }
  if (typeof result !== "string" || !result.trim()) {
    return errorState("結果を選択してください");
  }

  const input = {
    repositoryId: Number.parseInt(repositoryId, 10),
    checkItemId: Number.parseInt(checkItemId, 10),
    result: result === "true",
    memo:
      typeof memo === "string" && memo.trim() ? memo.trim() : undefined,
  };

  if (Number.isNaN(input.repositoryId) || input.repositoryId <= 0) {
    return errorState("リポジトリIDが不正です");
  }
  if (Number.isNaN(input.checkItemId) || input.checkItemId <= 0) {
    return errorState("チェック項目IDが不正です");
  }

  try {
    const data = await graphqlRequest<{
      createCheckResult: MutationResult;
    }>(CREATE_CHECK_RESULT_MUTATION, { input });

    const resultData = data.createCheckResult;
    if (!resultData.success) {
      return errorState(resultData.message ?? "チェック結果の保存に失敗しました");
    }

    const message = resultData.message ?? "チェック結果を登録しました";
    revalidatePath("/");
    return successState(message);
  } catch (error) {
    return errorState(
      error instanceof Error ? error.message : "通信に失敗しました",
    );
  }
}
