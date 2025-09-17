import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { listPublishedArts } from '@/lib/publish/listPublishedArts';
import PixelArtPreview from '@/components/PixelArtPreview';
import { z } from 'zod';

const SortSchema = z.enum(['latest', 'oldest', 'title', 'size']).catch('latest');
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  sort: SortSchema,
});

export const dynamic = 'force-dynamic';

function buildPageLink(page: number, sort: string): Route {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (sort !== 'latest') params.set('sort', sort);
  const query = params.toString();
  return (query ? `/gallery?${query}` : '/gallery') as Route;
}

function buildDetailLink(slug: string, page: number, sort: string): Route {
  const params = new URLSearchParams();
  params.set('from', 'gallery');
  if (page > 1) params.set('page', String(page));
  if (sort !== 'latest') params.set('sort', sort);
  const query = params.toString();
  return (query ? `/p/${slug}?${query}` : `/p/${slug}`) as Route;
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolved = await searchParams;
  const parsed = QuerySchema.parse({
    page: Array.isArray(resolved.page) ? resolved.page[0] : resolved.page,
    sort: Array.isArray(resolved.sort) ? resolved.sort[0] : resolved.sort,
  });

  const { items, page, pageCount, sort, total } = await listPublishedArts({
    page: parsed.page,
    sort: parsed.sort,
    pageSize: 12,
  });

  const sortOptions: { value: 'latest' | 'oldest' | 'title' | 'size'; label: string }[] = [
    { value: 'latest', label: '新着順' },
    { value: 'oldest', label: '古い順' },
    { value: 'title', label: 'タイトル順' },
    { value: 'size', label: 'サイズ順' },
  ];

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>公開ギャラリー</h1>
          <p style={{ margin: 0, color: '#475569' }}>公開設定された作品の一覧です（全 {total} 件）。</p>
        </div>
        <form method="get" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 14, color: '#475569' }}>
            並び替え
            <select
              name="sort"
              defaultValue={sort}
              style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5f5' }}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </form>
      </header>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
          公開作品がまだありません。
        </div>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24,
            marginBottom: 32,
          }}
        >
          {items.map(({ entry, art, author }) => {
            const detailHref = buildDetailLink(entry.slug, page, sort);
            return (
            <article
              key={entry.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 16,
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {entry.thumbUrl ? (
                  <Image
                    src={entry.thumbUrl}
                    alt={`${entry.title} のサムネイル`}
                    width={200}
                    height={200}
                    style={{ width: 200, height: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                ) : (
                  <PixelArtPreview size={art.size} pixels={art.pixels} maxPx={200} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Link href={detailHref} style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>
                  {entry.title}
                </Link>
                <div style={{ fontSize: 13, color: '#475569', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>作者: {author.name ?? author.email}</span>
                  <span>| サイズ: {art.size}x{art.size}</span>
                </div>
                <time style={{ fontSize: 12, color: '#94a3b8' }} dateTime={entry.updatedAt.toISOString()}>
                  更新: {entry.updatedAt.toLocaleString('ja-JP')}
                </time>
              </div>
              <div style={{ marginTop: 'auto' }}>
                <Link href={detailHref} className="btn btn-outline btn-sm">
                  詳細を見る
                </Link>
              </div>
            </article>
          );
          })}
        </section>
      )}

      {pageCount > 1 && (
        <nav style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', flexWrap: 'wrap' }} aria-label="ページネーション">
          <Link href={buildPageLink(Math.max(page - 1, 1), sort)} className="btn btn-outline btn-sm" aria-disabled={page === 1}>
            前へ
          </Link>
          <span style={{ fontSize: 14, color: '#475569' }}>
            {page} / {pageCount}
          </span>
          <Link href={buildPageLink(Math.min(page + 1, pageCount), sort)} className="btn btn-outline btn-sm" aria-disabled={page === pageCount}>
            次へ
          </Link>
        </nav>
      )}
    </main>
  );
}
