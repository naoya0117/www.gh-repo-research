import Link from "next/link";
import { PatternList } from "./_components/PatternList";

export const revalidate = 0;

export default function PatternsPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-semibold">パターン管理</h1>
          <Link
            href="/"
            className="rounded bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <PatternList />
      </main>
    </div>
  );
}
