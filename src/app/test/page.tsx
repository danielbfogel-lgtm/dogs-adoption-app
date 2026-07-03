"use client";

import { useEffect, useState } from "react";

export default function TestPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 font-mono">
      <h1 className="text-2xl font-bold">Next.js ↔ Python connection test</h1>

      {!data && !error && (
        <p className="text-gray-500">Fetching /api/ …</p>
      )}

      {data && (
        <div className="rounded-lg border border-green-400 bg-green-50 px-6 py-4 text-green-800">
          <p className="text-sm font-semibold mb-1">Response from /api/</p>
          <pre className="text-base">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-400 bg-red-50 px-6 py-4 text-red-800">
          <p className="text-sm font-semibold mb-1">Error</p>
          <pre className="text-base">{error}</pre>
          <p className="mt-2 text-xs text-red-600">
            Run <code className="font-bold">npx vercel dev</code> (not{" "}
            <code>npm run dev</code>) to execute Python functions locally.
          </p>
        </div>
      )}
    </main>
  );
}
