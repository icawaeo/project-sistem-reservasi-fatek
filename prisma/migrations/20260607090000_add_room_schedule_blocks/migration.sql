ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'KAPRODI';
ALTER TYPE "LabProgram" ADD VALUE IF NOT EXISTS 'INDUSTRI';

CREATE TABLE "RoomScheduleBlock" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduleDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "buildingName" TEXT NOT NULL,
    "departmentScope" "LabDepartment",
    "programScope" "LabProgram",
    "source" TEXT NOT NULL DEFAULT 'INTERNAL',
    "googleEventId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "RoomScheduleBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoomScheduleBlock_roomId_scheduleDate_isActive_idx" ON "RoomScheduleBlock"("roomId", "scheduleDate", "isActive");
CREATE INDEX "RoomScheduleBlock_departmentScope_idx" ON "RoomScheduleBlock"("departmentScope");
CREATE INDEX "RoomScheduleBlock_programScope_idx" ON "RoomScheduleBlock"("programScope");
CREATE INDEX "RoomScheduleBlock_buildingName_idx" ON "RoomScheduleBlock"("buildingName");

ALTER TABLE "RoomScheduleBlock" ADD CONSTRAINT "RoomScheduleBlock_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("room_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomScheduleBlock" ADD CONSTRAINT "RoomScheduleBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoomScheduleBlock" ADD CONSTRAINT "RoomScheduleBlock_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
