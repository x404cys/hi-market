DO $$
BEGIN
  CREATE TYPE "BannerPosition" AS ENUM ('HERO', 'HOME_MIDDLE', 'HOME_BOTTOM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Banner" (
  "id" TEXT NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "image" TEXT NOT NULL,
  "mobileImage" TEXT,
  "buttonText" TEXT,
  "link" TEXT,
  "position" "BannerPosition" NOT NULL DEFAULT 'HERO',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Banner_position_isActive_sortOrder_idx"
  ON "Banner"("position", "isActive", "sortOrder");

CREATE INDEX IF NOT EXISTS "Banner_startsAt_endsAt_idx"
  ON "Banner"("startsAt", "endsAt");
