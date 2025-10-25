"use client";

import { useState, FormEvent } from "react";

type CheckItem = {
  id: number;
  patternId: number;
  name: string;
  description: string | null;
};

type Props = {
  patternId: number;
  checkItem?: CheckItem;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function CheckItemForm({
  patternId,
  checkItem,
  onSuccess,
  onCancel,
}: Props) {
  const [name, setName] = useState(checkItem?.name || "");
  const [description, setDescription] = useState(checkItem?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const mutation = checkItem
      ? `
        mutation UpdateCheckItem($id: Int!, $input: CheckItemInput!) {
          updateCheckItem(id: $id, input: $input) {
            success
            message
          }
        }
      `
      : `
        mutation CreateCheckItem($input: CheckItemInput!) {
          createCheckItem(input: $input) {
            success
            message
          }
        }
      `;

    const variables = checkItem
      ? {
          id: checkItem.id,
          input: {
            patternId,
            name,
            description: description.trim() || null,
          },
        }
      : {
          input: {
            patternId,
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

      const result = checkItem
        ? data.data.updateCheckItem
        : data.data.createCheckItem;

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
        <label htmlFor="item-name" className="block text-sm font-medium text-slate-700">
          チェック項目名 <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例: Readiness Probe実装"
        />
      </div>

      <div>
        <label
          htmlFor="item-description"
          className="block text-sm font-medium text-slate-700"
        >
          説明
        </label>
        <textarea
          id="item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="チェック項目の説明を入力してください"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="rounded bg-slate-600 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting ? "保存中..." : checkItem ? "更新" : "追加"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
