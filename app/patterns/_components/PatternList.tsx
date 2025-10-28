"use client";

import { useState, useEffect } from "react";
import { PatternCard } from "./PatternCard";
import { PatternForm } from "./PatternForm";

type Pattern = {
  id: number;
  name: string;
  description: string | null;
};

type CheckItem = {
  id: number;
  patternId: number;
  name: string;
  description: string | null;
};

export function PatternList() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewPatternForm, setShowNewPatternForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [patternsRes, itemsRes] = await Promise.all([
        fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query {
                patterns {
                  id
                  name
                  description
                }
              }
            `,
          }),
        }),
        fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query {
                checkItems {
                  id
                  patternId
                  name
                  description
                }
              }
            `,
          }),
        }),
      ]);

      const patternsData = await patternsRes.json();
      const itemsData = await itemsRes.json();

      if (patternsData.errors) {
        setError(patternsData.errors[0].message);
      }
      if (itemsData.errors) {
        setError(itemsData.errors[0].message);
      }

      setPatterns(patternsData.data.patterns);
      setCheckItems(itemsData.data.checkItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePatternCreated = () => {
    setShowNewPatternForm(false);
    fetchData();
  };

  const handlePatternDeleted = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Kubernetesパターン ({patterns.length}件)
        </h2>
        <button
          type="button"
          onClick={() => setShowNewPatternForm(!showNewPatternForm)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showNewPatternForm ? "キャンセル" : "新しいパターンを追加"}
        </button>
      </div>

      {showNewPatternForm && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">新しいパターン</h3>
          <PatternForm onSuccessAction={handlePatternCreated} />
        </div>
      )}

      <div className="space-y-4">
        {patterns.map((pattern) => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            checkItems={checkItems.filter((item) => item.patternId === pattern.id)}
            onUpdateAction={fetchData}
            onDeleteAction={handlePatternDeleted}
          />
        ))}

        {patterns.length === 0 && (
          <div className="rounded-lg bg-white px-4 py-8 text-center text-slate-500 shadow-sm">
            パターンが登録されていません。
          </div>
        )}
      </div>
    </div>
  );
}
