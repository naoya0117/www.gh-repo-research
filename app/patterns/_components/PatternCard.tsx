"use client";

import { useState } from "react";
import { PatternForm } from "./PatternForm";
import { CheckItemForm } from "./CheckItemForm";
import { CheckItemList } from "./CheckItemList";

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

type Props = {
  pattern: Pattern;
  checkItems: CheckItem[];
  onUpdateAction: () => void;
  onDeleteAction: () => void;
};

export function PatternCard({ pattern, checkItems, onUpdateAction, onDeleteAction }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showCheckItemForm, setShowCheckItemForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`パターン「${pattern.name}」を削除しますか?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation DeletePattern($id: Int!) {
              deletePattern(id: $id) {
                success
                message
              }
            }
          `,
          variables: { id: pattern.id },
        }),
      });

      const data = await res.json();
      if (data.errors) {
          alert(data.errors[0].message);
      }

      if (data.data.deletePattern.success) {
        onDeleteAction();
      } else {
        alert(data.data.deletePattern.message || "削除に失敗しました");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePatternUpdated = () => {
    setIsEditing(false);
    onUpdateAction();
  };

  const handleCheckItemCreated = () => {
    setShowCheckItemForm(false);
    onUpdateAction();
  };

  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        {isEditing ? (
          <div>
            <h3 className="mb-4 text-lg font-semibold">パターンを編集</h3>
            <PatternForm
              pattern={pattern}
              onSuccessAction={handlePatternUpdated}
              onCancelAction={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{pattern.name}</h3>
                {pattern.description && (
                  <p className="mt-2 text-sm text-slate-600">{pattern.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded border border-rose-300 bg-white px-3 py-1 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  {isDeleting ? "削除中..." : "削除"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">
            チェック項目 ({checkItems.length}件)
          </h4>
          <button
            type="button"
            onClick={() => setShowCheckItemForm(!showCheckItemForm)}
            className="rounded bg-slate-600 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700"
          >
            {showCheckItemForm ? "キャンセル" : "項目を追加"}
          </button>
        </div>

        {showCheckItemForm && (
          <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-4">
            <CheckItemForm
              patternId={pattern.id}
              onSuccessAction={handleCheckItemCreated}
            />
          </div>
        )}

        <CheckItemList checkItems={checkItems} onUpdateAction={onUpdateAction} />
      </div>
    </div>
  );
}
