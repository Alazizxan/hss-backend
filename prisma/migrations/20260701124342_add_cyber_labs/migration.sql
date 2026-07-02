-- CreateTable
CREATE TABLE "CyberLab" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "briefing" TEXT NOT NULL,
    "hostname" TEXT NOT NULL DEFAULT 'web-03',
    "username" TEXT NOT NULL DEFAULT 'analyst',
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "estimatedTime" INTEGER NOT NULL DEFAULT 30,
    "fileSystem" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "objectives" JSONB NOT NULL,
    "flags" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CyberLab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyberLabSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "currentDirectory" TEXT NOT NULL,
    "commandHistory" JSONB NOT NULL,
    "discoveredFlags" JSONB NOT NULL,
    "environmentState" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "CyberLabSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyberLabReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "feedback" JSONB NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyberLabReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CyberLab_code_key" ON "CyberLab"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CyberLabReport_sessionId_key" ON "CyberLabReport"("sessionId");

-- AddForeignKey
ALTER TABLE "CyberLabSession" ADD CONSTRAINT "CyberLabSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyberLabSession" ADD CONSTRAINT "CyberLabSession_labId_fkey" FOREIGN KEY ("labId") REFERENCES "CyberLab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyberLabReport" ADD CONSTRAINT "CyberLabReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CyberLabSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyberLabReport" ADD CONSTRAINT "CyberLabReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
