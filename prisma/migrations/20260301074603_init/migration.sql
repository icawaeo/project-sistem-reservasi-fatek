-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('STUDENT', 'STAFF', 'PUBLIC');

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "identifier" TEXT,
    "userType" "UserType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Room" (
    "room_id" TEXT NOT NULL,
    "room_name" TEXT NOT NULL,
    "room_building" TEXT NOT NULL,
    "room_locDetail" TEXT NOT NULL,
    "room_capacity" INTEGER NOT NULL,
    "room_imageUrl" TEXT,
    "room_isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("room_id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "fac_id" TEXT NOT NULL,
    "fac_name" TEXT NOT NULL,
    "fac_qty" INTEGER NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("fac_id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "res_id" TEXT NOT NULL,
    "res_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "res_startTime" TIMESTAMP(3) NOT NULL,
    "res_endTime" TIMESTAMP(3) NOT NULL,
    "res_purpose" TEXT NOT NULL,
    "res_status" TEXT NOT NULL DEFAULT 'PENDING',
    "res_documentUrl" TEXT,
    "res_processedBy" TEXT,
    "res_processedAt" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("res_id")
);

-- CreateTable
CREATE TABLE "ReservationItem" (
    "id" TEXT NOT NULL,
    "res_id" TEXT NOT NULL,
    "fac_id" TEXT NOT NULL,
    "resItem_qty" INTEGER NOT NULL,

    CONSTRAINT "ReservationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_res_id_fkey" FOREIGN KEY ("res_id") REFERENCES "Reservation"("res_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_fac_id_fkey" FOREIGN KEY ("fac_id") REFERENCES "Facility"("fac_id") ON DELETE RESTRICT ON UPDATE CASCADE;
