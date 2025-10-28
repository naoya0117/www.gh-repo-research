import { headers } from "next/headers";
import Link from "next/link";

import type { AdminDashboardData } from "@/lib/adminTypes";
import { buildBasicAuthHeader } from "@/lib/internalOrigin";

export const revalidate = 0;

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function boolLabel(value: boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }
  return value ? "True" : "False";
}

export default async function AdminPage() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const url = `${protocol}://${host}/api/admin/dashboard`;

  let data: AdminDashboardData | null = null;
  let loadError: string | null = null;

  try {
    const authHeader = buildBasicAuthHeader();
    const res = await fetch(url, {
      cache: "no-store",
      headers: authHeader ? authHeader : undefined,
    });
    const payload = (await res.json().catch(() => null)) as
      | AdminDashboardData
      | { error?: string }
      | null;

    if (!res.ok) {
      loadError =
        (payload && "error" in payload && payload?.error) ||
        "管理用データの取得に失敗しました";

    }

    data = payload as AdminDashboardData;
  } catch (error) {
    console.error("Failed to fetch admin dashboard data:", error);
    loadError = "管理用データの取得に失敗しました";
  }

  const repositories =
    data?.repositories?.filter((repo) => repo.hasDockerfile) ?? [];

  const evaluatedRepositories = repositories.filter(
    (repo) => repo.isWebApp !== null && repo.isWebApp !== undefined
  );
  
  // 新しいAPIから未評価リポジトリを取得（確実に50件）
  const pendingRepositories = data?.unevaluatedRepositoriesWithDockerfile ?? [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-semibold">Kubernetes パターン分析</h1>
          <Link
            href="/patterns"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            パターン管理
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        {loadError ? (
          <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            {loadError}
          </div>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-200 pb-2">
            Kubernetesパターン一覧
          </h2>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    ID
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    名前
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    説明
                  </th>
                </tr>
              </thead>
              <tbody>
                {data && data.patterns && data.patterns.length ? (
                  data.patterns.map((pattern) => (
                    <tr
                      key={pattern.id}
                      className="border-t border-slate-200 last:border-b"
                    >
                      <td className="px-4 py-3 text-sm">{pattern.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{pattern.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {pattern.description ?? "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-200">
                    <td
                      className="px-4 py-4 text-center text-sm text-slate-500"
                      colSpan={3}
                    >
                      パターンが登録されていません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-200 pb-2">
            チェック結果 (最新100件)
          </h2>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    ID
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    リポジトリID
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    チェック項目ID
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    結果
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    メモ
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    更新日時
                  </th>
                </tr>
              </thead>
              <tbody>
                {data && data.checkResults && data.checkResults.length ? (
                  data.checkResults.map((result) => (
                    <tr
                      key={result.id}
                      className="border-t border-slate-200 last:border-b"
                    >
                      <td className="px-4 py-3 text-sm">{result.id}</td>
                      <td className="px-4 py-3 text-sm">{result.repositoryId}</td>
                      <td className="px-4 py-3 text-sm">{result.checkItemId}</td>
                      <td className="px-4 py-3 text-sm">
                        {boolLabel(result.result)}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-pre-wrap max-w-xs">
                        {result.memo ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDateTime(result.updatedAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-200">
                    <td
                      className="px-4 py-4 text-center text-sm text-slate-500"
                      colSpan={6}
                    >
                      チェック結果はまだ登録されていません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-slate-200 pb-2">
            評価済みリポジトリ (Dockerfileあり)
          </h2>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    ID
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Name With Owner
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    スター数
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    主要言語
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Webアプリ判定
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    判定日時
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {evaluatedRepositories.length ? (
                  evaluatedRepositories.map((repo) => (
                    <tr key={repo.id} className="border-t border-slate-200 last:border-b">
                      <td className="px-4 py-3 text-sm">{repo.id}</td>
                      <td className="px-4 py-3 text-sm">{repo.nameWithOwner}</td>
                      <td className="px-4 py-3 text-sm">
                        {repo.stargazerCount.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {repo.primaryLanguage ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {boolLabel(repo.isWebApp)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDateTime(repo.webAppCheckedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/evaluate?id=${repo.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          再評価
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-200">
                    <td
                      className="px-4 py-4 text-center text-sm text-slate-500"
                      colSpan={7}
                    >
                      Dockerfileを持つ評価済みリポジトリはありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 pb-10">
          <h2 className="text-xl font-semibold border-b border-slate-200 pb-2">
            未評価リポジトリ (Dockerfileあり)
          </h2>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="min-w-full">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    ID
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Name With Owner
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    スター数
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    主要言語
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingRepositories.length ? (
                  pendingRepositories.map((repo) => (
                    <tr key={repo.id} className="border-t border-slate-200 last:border-b">
                      <td className="px-4 py-3 text-sm">{repo.id}</td>
                      <td className="px-4 py-3 text-sm">{repo.nameWithOwner}</td>
                      <td className="px-4 py-3 text-sm">
                        {repo.stargazerCount.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {repo.primaryLanguage ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/evaluate?id=${repo.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          評価
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-200">
                    <td
                      className="px-4 py-4 text-center text-sm text-slate-500"
                      colSpan={5}
                    >
                      Dockerfileを持つ未評価リポジトリはありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
