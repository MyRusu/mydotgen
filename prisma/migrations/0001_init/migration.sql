-- Initial migration for My Dot Gen (PostgreSQL)

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PixelArt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "pixels" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PixelArt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImageAsset" (
    "id" TEXT NOT NULL,
    "artId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PublishEntry" (
    "id" TEXT NOT NULL,
    "artId" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "body" TEXT,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "PixelArt_userId_idx" ON "public"."PixelArt"("userId");

-- CreateIndex
CREATE INDEX "PixelArt_userId_updatedAt_idx" ON "public"."PixelArt"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "PixelArt_public_updatedAt_idx" ON "public"."PixelArt"("public", "updatedAt");

-- CreateIndex
CREATE INDEX "ImageAsset_artId_idx" ON "public"."ImageAsset"("artId");

-- CreateIndex
CREATE UNIQUE INDEX "PublishEntry_slug_key" ON "public"."PublishEntry"("slug");

-- CreateIndex
CREATE INDEX "PublishEntry_artId_idx" ON "public"."PublishEntry"("artId");

-- CreateIndex
CREATE INDEX "PublishEntry_public_updatedAt_idx" ON "public"."PublishEntry"("public", "updatedAt");

-- AddForeignKey
ALTER TABLE "public"."PixelArt" ADD CONSTRAINT "PixelArt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImageAsset" ADD CONSTRAINT "ImageAsset_artId_fkey" FOREIGN KEY ("artId") REFERENCES "public"."PixelArt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublishEntry" ADD CONSTRAINT "PublishEntry_artId_fkey" FOREIGN KEY ("artId") REFERENCES "public"."PixelArt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
