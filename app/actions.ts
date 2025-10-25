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
