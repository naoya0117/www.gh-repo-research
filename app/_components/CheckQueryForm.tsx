"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import {
  FormState,
  createCheckQueryAction,
  initialFormState,
} from "../actions";

export function CheckQueryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<FormState, FormData>(
    createCheckQueryAction,
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
        チェッククエリの登録
      </h2>
      <form
        ref={formRef}
        action={formAction}
        className="space-y-4 rounded-lg bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-2 block font-semibold" htmlFor="name">
            名前 *
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="例: READMEチェック"
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold" htmlFor="description">
            説明
          </label>
          <textarea
            id="description"
            name="description"
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="チェック内容の概要"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          登録する
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
