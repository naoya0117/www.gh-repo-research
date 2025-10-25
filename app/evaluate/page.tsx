'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type Repository = {
  id: number;
  nameWithOwner: string;
  stargazerCount: number;
  primaryLanguage: string | null;
  hasDockerfile: boolean;
  createdAt: string;
  isWebApp: boolean | null;
  webAppCheckedAt: string | null;
};

type K8sPattern = {
  id: number;
  name: string;
  description: string | null;
  checkItems: CheckItem[];
};

type CheckItem = {
  id: number;
  patternId: number;
  name: string;
  description: string | null;
};

type CheckResultInput = {
  checkItemId: number;
  result: boolean;
  memo: string;
};

function EvaluatePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const repoId = searchParams.get('id');

  const [repository, setRepository] = useState<Repository | null>(null);
  const [patterns, setPatterns] = useState<K8sPattern[]>([]);
  const [isWebApp, setIsWebApp] = useState<boolean | null>(null);
  const [checkResults, setCheckResults] = useState<Map<number, CheckResultInput>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch repository and patterns on mount
  useEffect(() => {
    if (!repoId) {
      setError('リポジトリIDが指定されていません');
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetRepository($id: Int!) {
              repository(id: $id) {
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
          `,
          variables: { id: parseInt(repoId) },
        }),
      }).then((res) => res.json()),
      fetch(`/api/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetPatterns {
              patterns {
                id
                name
                description
                checkItems {
                  id
                  patternId
                  name
                  description
                }
              }
            }
          `,
        }),
      }).then((res) => res.json()),
    ])
      .then(([repoData, patternsData]) => {
        if (repoData.errors) {
          setError(repoData.errors[0].message);
          return;
        }
        if (patternsData.errors) {
          setError(patternsData.errors[0].message);
          return;
        }

        setRepository(repoData.data.repository);
        setPatterns(patternsData.data.patterns);
        setIsWebApp(repoData.data.repository?.isWebApp);
      })
      .catch((err) => {
        setError(`データの取得に失敗しました: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [repoId]);

  const handleCheckChange = (checkItemId: number, result: boolean) => {
    setCheckResults((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(checkItemId) || { checkItemId, result: false, memo: '' };
      newMap.set(checkItemId, { ...existing, result });
      return newMap;
    });
  };

  const handleMemoChange = (checkItemId: number, memo: string) => {
    setCheckResults((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(checkItemId) || { checkItemId, result: false, memo: '' };
      newMap.set(checkItemId, { ...existing, memo });
      return newMap;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isWebApp === null) {
      setError('Webアプリケーションかどうかを選択してください');
      return;
    }

    setSaving(true);
    setError(null);

    const checkResultsArray = isWebApp ? Array.from(checkResults.values()) : [];

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation SaveRepositoryEvaluation($input: RepositoryEvaluationInput!) {
              saveRepositoryEvaluation(input: $input) {
                success
                message
              }
            }
          `,
          variables: {
            input: {
              repositoryId: parseInt(repoId!),
              isWebApp,
              checkResults: checkResultsArray,
            },
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        setError(data.errors[0].message);
        return;
      }

      if (data.data.saveRepositoryEvaluation.success) {
        alert(data.data.saveRepositoryEvaluation.message);
        router.push('/');
      } else {
        setError(data.data.saveRepositoryEvaluation.message || '保存に失敗しました');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`保存に失敗しました: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">リポジトリが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">リポジトリ評価</h1>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{repository.nameWithOwner}</h2>
            <div className="text-sm text-gray-600 mt-2">
              <p>⭐ {repository.stargazerCount.toLocaleString()} stars</p>
              {repository.primaryLanguage && <p>言語: {repository.primaryLanguage}</p>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          {/* WebApp判定セクション */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Webアプリケーション判定 (必須)</h3>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isWebApp"
                  value="true"
                  checked={isWebApp === true}
                  onChange={() => setIsWebApp(true)}
                  className="mr-2"
                />
                Webアプリケーション
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isWebApp"
                  value="false"
                  checked={isWebApp === false}
                  onChange={() => setIsWebApp(false)}
                  className="mr-2"
                />
                Webアプリケーションではない
              </label>
            </div>
          </div>

          {/* チェック項目セクション (Webアプリの場合のみ) */}
          {isWebApp && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Kubernetes Pattern チェック項目</h3>
              {patterns.map((pattern) => (
                <div key={pattern.id} className="mb-6 border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-md mb-2">{pattern.name}</h4>
                  {pattern.description && (
                    <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>
                  )}
                  <div className="space-y-3">
                    {pattern.checkItems.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded">
                        <div className="font-medium mb-2">{item.name}</div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        <div className="flex gap-4 items-center mb-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`check-${item.id}`}
                              checked={checkResults.get(item.id)?.result === true}
                              onChange={() => handleCheckChange(item.id, true)}
                              className="mr-1"
                            />
                            ○ 満たす
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`check-${item.id}`}
                              checked={checkResults.get(item.id)?.result === false}
                              onChange={() => handleCheckChange(item.id, false)}
                              className="mr-1"
                            />
                            ✕ 満たさない
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="メモ (任意)"
                          value={checkResults.get(item.id)?.memo || ''}
                          onChange={(e) => handleMemoChange(item.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 送信ボタン */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || isWebApp === null}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '登録'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg">読み込み中...</p>
        </div>
      }
    >
      <EvaluatePageContent />
    </Suspense>
  );
}
