-- CreateIndex
CREATE INDEX "activation_keys_createdBy_idx" ON "activation_keys"("createdBy");

-- AddForeignKey
ALTER TABLE "activation_keys" ADD CONSTRAINT "activation_keys_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
