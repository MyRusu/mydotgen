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
      <button
        onClick={() => reset()}
        style={{ marginTop: 12, padding: '8px 12px', cursor: 'pointer' }}
      >
        もう一度試す
      </button>
    </main>
  );
}

