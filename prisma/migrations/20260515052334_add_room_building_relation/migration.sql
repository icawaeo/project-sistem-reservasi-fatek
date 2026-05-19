-- Add the Room -> Building relation without recreating tables from earlier migrations.
-- Existing rooms are backfilled from their legacy `room_building` text value.

ALTER TABLE "Room"
ADD COLUMN IF NOT EXISTS "building_id" TEXT;

INSERT INTO "Building" (
  "building_id",
  "building_name",
  "operational_days",
  "open_time",
  "close_time",
  "updatedAt"
)
SELECT
  'building_' || md5("room_building"),
  "room_building",
  ARRAY['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']::TEXT[],
  '08:00',
  '16:00',
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "room_building"
  FROM "Room"
  WHERE "room_building" IS NOT NULL AND "room_building" <> ''
) AS room_buildings
ON CONFLICT ("building_name") DO NOTHING;

UPDATE "Room"
SET "building_id" = "Building"."building_id"
FROM "Building"
WHERE "Room"."building_id" IS NULL
  AND "Room"."room_building" = "Building"."building_name";

ALTER TABLE "Room"
ALTER COLUMN "building_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Room_building_id_idx" ON "Room"("building_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Room_building_id_fkey'
  ) THEN
    ALTER TABLE "Room"
    ADD CONSTRAINT "Room_building_id_fkey"
    FOREIGN KEY ("building_id") REFERENCES "Building"("building_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
