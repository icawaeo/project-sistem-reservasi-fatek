ALTER TABLE "User"
ADD COLUMN "rank" TEXT,
ADD COLUMN "position" TEXT;

ALTER TABLE "Reservation"
ADD COLUMN "res_decisionDocumentUrl" TEXT;
