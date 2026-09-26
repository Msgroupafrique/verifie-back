-- CreateTable
CREATE TABLE "history" (
    "id" TEXT NOT NULL,
    "analysisLogId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "history_analysisLogId_key" ON "history"("analysisLogId");

-- CreateIndex
CREATE INDEX "history_createdAt_idx" ON "history"("createdAt");

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_analysisLogId_fkey" FOREIGN KEY ("analysisLogId") REFERENCES "analysis_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
