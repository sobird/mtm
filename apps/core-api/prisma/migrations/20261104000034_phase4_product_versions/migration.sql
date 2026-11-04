/*
  Warnings:

  - A unique constraint covering the columns `[productId,version]` on the table `ProductVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "AuditRecord_status_submittedAt_idx" ON "AuditRecord"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "AuditRecord_productVersionId_idx" ON "AuditRecord"("productVersionId");

-- CreateIndex
CREATE INDEX "Product_merchantId_deletedAt_idx" ON "Product"("merchantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_shopId_idx" ON "Product"("shopId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "ProductVersion_productId_status_idx" ON "ProductVersion"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVersion_productId_version_key" ON "ProductVersion"("productId", "version");

-- CreateIndex
CREATE INDEX "Sku_productVersionId_idx" ON "Sku"("productVersionId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "ProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "ProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
