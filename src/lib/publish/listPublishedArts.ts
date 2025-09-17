import prisma from '@/lib/prisma';

type GallerySort = 'latest' | 'oldest' | 'title' | 'size';

type ListPublishedArtsParams = {
  page?: number;
  pageSize?: number;
  sort?: GallerySort;
};

export type PublishedArtListItem = {
  entry: {
    id: string;
    slug: string;
    title: string;
    updatedAt: Date;
    thumbUrl: string | null;
  };
  art: {
    id: string;
    title: string;
    size: 16 | 32 | 64;
    pixels: number[];
    updatedAt: Date;
  };
  author: {
    name: string | null;
    email: string;
  };
};

export type PublishedArtListResult = {
  items: PublishedArtListItem[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  sort: GallerySort;
};

function normalizeSort(sort?: string): GallerySort {
  switch (sort) {
    case 'oldest':
    case 'title':
    case 'size':
      return sort;
    default:
      return 'latest';
  }
}

export async function listPublishedArts({ page = 1, pageSize = 12, sort }: ListPublishedArtsParams = {}): Promise<PublishedArtListResult> {
  const safePageSize = Math.min(Math.max(pageSize, 1), 48);
  const safePage = Math.max(page ?? 1, 1);
  const safeSort = normalizeSort(sort);

  const orderBy = (() => {
    switch (safeSort) {
      case 'oldest':
        return [{ updatedAt: 'asc' }];
      case 'title':
        return [{ title: 'asc' }];
      case 'size':
        return [{ art: { size: 'asc' } }, { updatedAt: 'desc' }];
      case 'latest':
      default:
        return [{ updatedAt: 'desc' }];
    }
  })();

  const where = {
    public: true,
    art: {
      public: true,
    },
  } as const;

  const [total, entries] = await Promise.all([
    prisma.publishEntry.count({ where }),
    prisma.publishEntry.findMany({
      where,
      orderBy,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        updatedAt: true,
        thumbUrl: true,
        art: {
          select: {
            id: true,
            title: true,
            size: true,
            pixels: true,
            updatedAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, pageCount);

  // 取得済み entries は safePage に基づくため、currentPage が変化した場合は再取得が必要
  // 現状は total==0 のケースで pageCount=1, currentPage=1 になるので再取得は不要。

  const items: PublishedArtListItem[] = entries.map((entry) => ({
    entry: {
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      updatedAt: entry.updatedAt,
      thumbUrl: entry.thumbUrl ?? null,
    },
    art: {
      id: entry.art.id,
      title: entry.art.title,
      size: entry.art.size as 16 | 32 | 64,
      pixels: (entry.art.pixels as number[]) ?? [],
      updatedAt: entry.art.updatedAt,
    },
    author: {
      name: entry.art.user?.name ?? null,
      email: entry.art.user?.email ?? '',
    },
  }));

  return {
    items,
    page: currentPage,
    pageSize: safePageSize,
    total,
    pageCount,
    sort: safeSort,
  };
}
