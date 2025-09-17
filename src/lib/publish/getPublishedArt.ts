import prisma from '@/lib/prisma';

export type PublishedArt = {
  entry: {
    id: string;
    slug: string;
    title: string;
    body: string;
    updatedAt: Date;
  };
  art: {
    id: string;
    title: string;
    size: 16 | 32 | 64;
    pixels: number[];
    updatedAt: Date;
    user: {
      name: string | null;
      email: string;
    };
  };
};

export async function getPublishedArtBySlug(slug: string): Promise<PublishedArt | null> {
  const record = await prisma.publishEntry.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      body: true,
      public: true,
      updatedAt: true,
      art: {
        select: {
          id: true,
          title: true,
          size: true,
          pixels: true,
          public: true,
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
  });

  if (!record || !record.public || !record.art.public) {
    return null;
  }

  return {
    entry: {
      id: record.id,
      slug: record.slug,
      title: record.title,
      body: record.body ?? '',
      updatedAt: record.updatedAt,
    },
    art: {
      id: record.art.id,
      title: record.art.title,
      size: record.art.size as 16 | 32 | 64,
      pixels: (record.art.pixels as number[]) ?? [],
      updatedAt: record.art.updatedAt,
      user: {
        name: record.art.user?.name ?? null,
        email: record.art.user?.email ?? '',
      },
    },
  };
}
