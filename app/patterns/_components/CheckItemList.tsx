"use client";

import { useState } from "react";
import { CheckItemForm } from "./CheckItemForm";

type CheckItem = {
  id: number;
  patternId: number;
  name: string;
  description: string | null;
};

type Props = {
  checkItems: CheckItem[];
  onUpdateAction: () => void;
};

export function CheckItemList({ checkItems, onUpdateAction }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (item: CheckItem) => {
    if (!confirm(`チェック項目「${item.name}」を削除しますか?`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation DeleteCheckItem($id: Int!) {
              deleteCheckItem(id: $id) {
                success
                message
              }
            }
          `,
          variables: { id: item.id },
        }),
      });

      const data = await res.json();
      if (data.errors) {
        alert(data.errors[0].message);
      }

      if (data.data.deleteCheckItem.success) {
        onUpdateAction();
      } else {
        alert(data.data.deleteCheckItem.message || "削除に失敗しました");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCheckItemUpdated = () => {
    setEditingId(null);
    onUpdateAction();
  };

  if (checkItems.length === 0) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        チェック項目がありません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {checkItems.map((item) => (
        <div
          key={item.id}
          className="rounded border border-slate-200 bg-white p-4"
        >
          {editingId === item.id ? (
            <CheckItemForm
              patternId={item.patternId}
              checkItem={item}
              onSuccessAction={handleCheckItemUpdated}
              onCancelAction={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-medium text-slate-900">{item.name}</h5>
                {item.description && (
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(item.id)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  className="rounded border border-rose-300 bg-white px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  {deletingId === item.id ? "削除中..." : "削除"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
