import Link from 'next/link';
import { notFound } from 'next/navigation';
import PixelArtPreview from '@/components/PixelArtPreview';
import { getPublishedArtBySlug } from '@/lib/publish/getPublishedArt';
import { renderMarkdownToHtml } from '@/lib/markdown/render';

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function PublicArtPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: SearchParams;
}) {
  const { slug } = params;
  const resolvedSearch = searchParams ?? {};
  const fromQuery = firstParam(resolvedSearch?.from);
  const pageParam = firstParam(resolvedSearch?.page);
  const sortParam = firstParam(resolvedSearch?.sort);
  const fromGallery = fromQuery === 'gallery';

  const galleryParams = new URLSearchParams();
  if (fromGallery) {
    if (pageParam && Number(pageParam) > 1) galleryParams.set('page', pageParam);
    if (sortParam && ['latest', 'oldest', 'title', 'size'].includes(sortParam) && sortParam !== 'latest') {
      galleryParams.set('sort', sortParam);
    }
  }
  const galleryBackHref = galleryParams.toString() ? `/gallery?${galleryParams.toString()}` : '/gallery';

  const published = await getPublishedArtBySlug(slug);
  if (!published) return notFound();

  const { entry, art } = published;
  const author = art.user.name || art.user.email;
  const bodyHtml = entry.body ? renderMarkdownToHtml(entry.body) : '';

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>{entry.title}</h1>
        <div style={{ color: '#475569', fontSize: 14 }}>
          <span>by {author}</span>
          <span style={{ margin: '0 8px' }}>·</span>
          <time dateTime={entry.updatedAt.toISOString()}>{entry.updatedAt.toLocaleString('ja-JP')}</time>
        </div>
      </header>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ flex: '0 1 320px', display: 'flex', justifyContent: 'center' }}>
          <PixelArtPreview
            size={art.size}
            pixels={art.pixels}
            maxPx={320}
            title={art.title}
          />
        </div>
        <article
          style={{
            flex: '1 1 320px',
            maxWidth: 640,
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: 24,
            lineHeight: 1.6,
          }}
        >
          {bodyHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
              style={{ wordBreak: 'break-word' }}
            />
          ) : (
            <p style={{ color: '#64748b' }}>作品の説明はまだありません。</p>
          )}
        </article>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Link href={fromGallery ? galleryBackHref : '/gallery'} className="btn btn-outline btn-sm">
          ギャラリーに戻る
        </Link>
      </div>
    </main>
  );
}
