ALTER TABLE "public"."Reservation" DROP CONSTRAINT IF EXISTS "Reservation_user_id_fkey";

ALTER TABLE "public"."Reservation" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "public"."Reservation"
  ADD CONSTRAINT "Reservation_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
