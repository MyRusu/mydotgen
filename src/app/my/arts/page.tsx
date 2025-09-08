import Link from 'next/link';
import { getMyArts } from '@/lib/arts';

export const dynamic = 'force-dynamic';

export default async function MyArtsPage() {
  const arts = await getMyArts();

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 12 }}>マイ作品一覧（RSC）</h1>
      <div style={{ marginBottom: 16 }}>
        <Link href="/editor" style={{ color: '#06c', textDecoration: 'underline' }}>
          新規作成（エディタ）
        </Link>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {arts.map((art) => (
          <li key={art.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <strong>{art.title}</strong>
              <span style={{ color: '#666' }}>{art.size}x{art.size}</span>
              <span style={{ color: art.public ? '#090' : '#999' }}>{art.public ? '公開' : '非公開'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <Link href={`/art/${art.id}`} style={{ color: '#06c' }}>詳細（RSC）</Link>
              <Link href={`/editor/${art.id}`} style={{ color: '#06c' }}>編集（Client）</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
