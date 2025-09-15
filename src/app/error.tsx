"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>エラーが発生しました</h1>
      <p style={{ color: '#c00' }}>{error.message}</p>
      {error.digest ? <p>digest: {error.digest}</p> : null}
      <button onClick={() => reset()} className="btn" style={{ marginTop: 12 }}>
        もう一度試す
      </button>
    </main>
  );
}
