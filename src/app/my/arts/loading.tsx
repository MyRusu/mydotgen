export default function Loading() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 12 }}>マイ作品一覧</h1>
      <p>一覧を読み込み中…</p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #eee', opacity: 0.6 }}>
            <div style={{ background: '#f2f2f2', height: 14, width: 240 }} />
          </li>
        ))}
      </ul>
    </main>
  );
}

