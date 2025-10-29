"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Repository } from "@/lib/adminTypes";
import { graphqlRequest } from "@/lib/graphql";

function FormattedDateTime({ value }: { value: string | null | undefined }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span>-</span>;
  }

  if (!value) {
    return <span>-</span>;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return <span>-</span>;
  }

  return (
    <span>
      {date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}

function boolLabel(value: boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }
  return value ? "True" : "False";
}

const SEARCH_EVALUATED_REPOSITORIES_QUERY = /* GraphQL */ `
  query SearchEvaluatedRepositories($query: String!, $limit: Int) {
    searchEvaluatedRepositories(query: $query, limit: $limit) {
      id
      nameWithOwner
      stargazerCount
      primaryLanguage
      hasDockerfile
      createdAt
      isWebApp
      webAppCheckedAt
    }
  }
`;

interface EvaluatedRepositoriesSectionProps {
  initialRepositories: Repository[];
}

export function EvaluatedRepositoriesSection({
  initialRepositories,
}: EvaluatedRepositoriesSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [repositories, setRepositories] = useState<Repository[]>(initialRepositories);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchRepositories = async () => {
      if (!searchQuery.trim()) {
        setRepositories(initialRepositories);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const data = await graphqlRequest<{
          searchEvaluatedRepositories: Repository[];
        }>(SEARCH_EVALUATED_REPOSITORIES_QUERY, {
          query: searchQuery,
          limit: 50,
        });

        setRepositories(data.searchEvaluatedRepositories);
      } catch (err) {
        console.error("Search failed:", err);
        setError("検索に失敗しました");
        setRepositories([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchRepositories();
    }, 300); // デバウンス: 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, initialRepositories]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 className="text-xl font-semibold">
          評価済みリポジトリ
          {!searchQuery && " (最近の評価10件)"}
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="リポジトリ名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {isSearching && (
            <span className="text-sm text-slate-500">検索中...</span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

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
            {repositories.length ? (
              repositories.map((repo) => (
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
                    <FormattedDateTime value={repo.webAppCheckedAt} />
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
                  {searchQuery
                    ? "検索結果が見つかりませんでした。"
                    : "Dockerfileを持つ評価済みリポジトリはありません。"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
