-- CreateIndex
CREATE INDEX "activation_keys_status_expiresAt_idx" ON "activation_keys"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "activation_keys_createdAt_idx" ON "activation_keys"("createdAt");
