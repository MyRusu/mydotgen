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
      <h1>作品詳細の表示でエラー</h1>
      <p style={{ color: '#c00' }}>{error.message}</p>
      <button onClick={() => reset()} style={{ marginTop: 12, padding: '6px 10px' }}>再試行</button>
    </main>
  );
}

