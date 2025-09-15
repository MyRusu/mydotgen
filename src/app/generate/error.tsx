"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>生成ページでエラー</h1>
      <p style={{ color: '#c00' }}>{error.message}</p>
      <button onClick={() => reset()} className="btn" style={{ marginTop: 12 }}>再試行</button>
    </main>
  );
}
