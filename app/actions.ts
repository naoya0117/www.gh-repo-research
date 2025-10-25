"use server";

import { revalidatePath } from "next/cache";

import { graphqlRequest } from "@/lib/graphql";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialFormState: FormState = { status: "idle" };

const CREATE_CHECK_QUERY_MUTATION = /* GraphQL */ `
  mutation CreateCheckQuery($input: NewCheckQueryInput!) {
    createCheckQuery(input: $input) {
      success
      message
    }
  }
`;

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

  const input = {
    name: name.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : undefined,
  };

  try {
    const data = await graphqlRequest<{
      createCheckQuery: MutationResult;
    }>(CREATE_CHECK_QUERY_MUTATION, { input });

    const result = data.createCheckQuery;
    if (!result.success) {
      return errorState(result.message ?? "チェッククエリの登録に失敗しました");
    }

    const message = result.message ?? "チェッククエリを登録しました";
    revalidatePath("/");
    return successState(message);
  } catch (error) {
    return errorState(
      error instanceof Error ? error.message : "通信に失敗しました",
    );
  }
}

export async function createCheckResultAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const repositoryID = formData.get("repository_id");
  const checkQueryID = formData.get("check_query_id");
  const result = formData.get("result");
  const memo = formData.get("memo");
  const isWebApp = formData.get("is_web_app");

  if (typeof repositoryID !== "string" || !repositoryID.trim()) {
    return errorState("リポジトリIDを入力してください");
  }
  if (typeof checkQueryID !== "string" || !checkQueryID.trim()) {
    return errorState("チェッククエリIDを入力してください");
  }
  if (typeof result !== "string" || !result.trim()) {
    return errorState("結果を選択してください");
  }
  if (typeof isWebApp !== "string" || !isWebApp.trim()) {
    return errorState("Webアプリ判定を選択してください");
  }

  const input = {
    repositoryID: Number.parseInt(repositoryID, 10),
    checkQueryID: Number.parseInt(checkQueryID, 10),
    result: result.trim(),
    memo:
      typeof memo === "string" && memo.trim() ? memo.trim() : undefined,
    isWebApp: isWebApp === "true",
  };

  if (Number.isNaN(input.repositoryID) || input.repositoryID <= 0) {
    return errorState("リポジトリIDが不正です");
  }
  if (Number.isNaN(input.checkQueryID) || input.checkQueryID <= 0) {
    return errorState("チェッククエリIDが不正です");
  }

  try {
    const data = await graphqlRequest<{
      createCheckResult: MutationResult;
    }>(CREATE_CHECK_RESULT_MUTATION, { input });

    const resultData = data.createCheckResult;
    if (!resultData.success) {
      return errorState(resultData.message ?? "判定結果の保存に失敗しました");
    }

    const message = resultData.message ?? "判定結果を登録しました";
    revalidatePath("/");
    return successState(message);
  } catch (error) {
    return errorState(
      error instanceof Error ? error.message : "通信に失敗しました",
    );
  }
}
