"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import {
  FormState,
  createCheckResultAction,
  initialFormState,
} from "../actions";

type Props = {
  resultOptions: string[];
};

export function CheckResultForm({ resultOptions }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<FormState, FormData>(
    createCheckResultAction,
    initialFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold border-b border-slate-200 pb-2">
        手動チェック結果の登録
      </h2>

      <form
        ref={formRef}
        action={formAction}
        className="space-y-4 rounded-lg bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-2 block font-semibold"
              htmlFor="repository_id"
            >
              リポジトリID *
            </label>
            <input
              id="repository_id"
              name="repository_id"
              type="number"
              min={1}
              required
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              className="mb-2 block font-semibold"
              htmlFor="check_query_id"
            >
              チェッククエリID *
            </label>
            <input
              id="check_query_id"
              name="check_query_id"
              type="number"
              min={1}
              required
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-semibold" htmlFor="result">
              結果 *
            </label>
            <select
              id="result"
              name="result"
              required
              defaultValue=""
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="" disabled>
                選択してください
              </option>
              {resultOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-semibold" htmlFor="is_web_app">
              Webアプリ判定 *
            </label>
            <select
              id="is_web_app"
              name="is_web_app"
              required
              defaultValue=""
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="" disabled>
                選択してください
              </option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block font-semibold" htmlFor="memo">
            メモ
          </label>
          <textarea
            id="memo"
            name="memo"
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="補足情報があれば記入"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          結果を保存する
        </button>

        {state.status === "success" ? (
          <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
            {state.message}
          </p>
        ) : null}
        {state.status === "error" ? (
          <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
