-- CreateTable
CREATE TABLE "CyberLabSessionFile" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "permissions" TEXT NOT NULL DEFAULT 'rw-r--r--',
    "owner" TEXT NOT NULL DEFAULT 'root',
    "group" TEXT NOT NULL DEFAULT 'root',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyberLabSessionFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CyberLabSessionFile_sessionId_idx" ON "CyberLabSessionFile"("sessionId");

-- CreateIndex
CREATE INDEX "CyberLabSessionFile_path_idx" ON "CyberLabSessionFile"("path");

-- AddForeignKey
ALTER TABLE "CyberLabSessionFile" ADD CONSTRAINT "CyberLabSessionFile_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CyberLabSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
