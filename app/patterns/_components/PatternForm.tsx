"use client";

import { useState, FormEvent } from "react";

type Pattern = {
  id: number;
  name: string;
  description: string | null;
};

type Props = {
  pattern?: Pattern;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function PatternForm({ pattern, onSuccess, onCancel }: Props) {
  const [name, setName] = useState(pattern?.name || "");
  const [description, setDescription] = useState(pattern?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const mutation = pattern
      ? `
        mutation UpdatePattern($id: Int!, $input: K8sPatternInput!) {
          updatePattern(id: $id, input: $input) {
            success
            message
          }
        }
      `
      : `
        mutation CreatePattern($input: K8sPatternInput!) {
          createPattern(input: $input) {
            success
            message
          }
        }
      `;

    const variables = pattern
      ? {
          id: pattern.id,
          input: {
            name,
            description: description.trim() || null,
          },
        }
      : {
          input: {
            name,
            description: description.trim() || null,
          },
        };

    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const data = await res.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const result = pattern
        ? data.data.updatePattern
        : data.data.createPattern;

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || "保存に失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          パターン名 <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例: Health Probe"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-700"
        >
          説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="パターンの説明を入力してください"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "保存中..." : pattern ? "更新" : "作成"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
