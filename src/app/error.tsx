"use client";

import { AlertTriangle } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <AlertTriangle className="h-6 w-6 text-rose-700" />
      </div>
      <h2 className="text-2xl font-black text-slate-900">Something went wrong</h2>
      <p className="max-w-xl text-sm font-medium text-slate-600">
        We could not complete this request. You can retry safely without losing existing workflow state.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
      >
        Retry
      </button>
      {process.env.NODE_ENV !== "production" && (
        <p className="max-w-xl break-words text-xs text-slate-500">{error.message}</p>
      )}
    </div>
  );
}
