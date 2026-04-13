-- CreateTable
CREATE TABLE "Building" (
	"building_id" TEXT NOT NULL,
	"building_name" TEXT NOT NULL,
	"operational_days" TEXT[] DEFAULT ARRAY[]::TEXT[],
	"open_time" TEXT NOT NULL,
	"close_time" TEXT NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "Building_pkey" PRIMARY KEY ("building_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Building_building_name_key" ON "Building"("building_name");
