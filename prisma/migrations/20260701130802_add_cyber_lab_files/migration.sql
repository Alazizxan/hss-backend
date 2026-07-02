-- CreateTable
CREATE TABLE "CyberLabFile" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "permissions" TEXT NOT NULL DEFAULT 'rw-r--r--',
    "owner" TEXT NOT NULL DEFAULT 'root',
    "group" TEXT NOT NULL DEFAULT 'root',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyberLabFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CyberLabFile_labId_idx" ON "CyberLabFile"("labId");

-- CreateIndex
CREATE INDEX "CyberLabFile_path_idx" ON "CyberLabFile"("path");

-- AddForeignKey
ALTER TABLE "CyberLabFile" ADD CONSTRAINT "CyberLabFile_labId_fkey" FOREIGN KEY ("labId") REFERENCES "CyberLab"("id") ON DELETE CASCADE ON UPDATE CASCADE;
