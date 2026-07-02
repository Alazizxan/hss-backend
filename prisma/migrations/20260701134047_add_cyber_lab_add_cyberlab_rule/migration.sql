-- CreateTable
CREATE TABLE "CyberLabRule" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "rewardFlag" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyberLabRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CyberLabRule_labId_idx" ON "CyberLabRule"("labId");

-- AddForeignKey
ALTER TABLE "CyberLabRule" ADD CONSTRAINT "CyberLabRule_labId_fkey" FOREIGN KEY ("labId") REFERENCES "CyberLab"("id") ON DELETE CASCADE ON UPDATE CASCADE;
