-- CreateIndex
CREATE INDEX "EntryTask_merchantId_idx" ON "EntryTask"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantLicense_merchantId_idx" ON "MerchantLicense"("merchantId");

-- CreateIndex
CREATE INDEX "Registration_interCode_idx" ON "Registration"("interCode");
