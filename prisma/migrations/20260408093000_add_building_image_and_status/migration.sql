-- AlterTable
ALTER TABLE "Building"
ADD COLUMN "building_imageUrl" TEXT,
ADD COLUMN "building_isActive" BOOLEAN NOT NULL DEFAULT true;
