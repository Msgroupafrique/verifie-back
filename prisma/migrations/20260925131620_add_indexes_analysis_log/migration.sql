-- DropIndex
DROP INDEX "analysis_logs_analysisType_idx";

-- CreateIndex
CREATE INDEX "analysis_logs_analysisType_createdAt_idx" ON "analysis_logs"("analysisType", "createdAt");

-- CreateIndex
CREATE INDEX "analysis_logs_riskLevel_createdAt_idx" ON "analysis_logs"("riskLevel", "createdAt");
