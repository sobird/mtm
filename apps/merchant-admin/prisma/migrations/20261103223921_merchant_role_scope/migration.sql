-- Scope merchant roles per merchant. Existing rows belong to the seeded
-- merchant ('1'), so add the column nullable, backfill, then enforce it.
ALTER TABLE "MerchantRole" ADD COLUMN "merchantId" TEXT;
UPDATE "MerchantRole" SET "merchantId" = '1' WHERE "merchantId" IS NULL;
ALTER TABLE "MerchantRole" ALTER COLUMN "merchantId" SET NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "MerchantRole_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "MerchantRole_merchantId_code_key" ON "MerchantRole"("merchantId", "code");

-- CreateIndex
CREATE INDEX "MerchantRole_merchantId_idx" ON "MerchantRole"("merchantId");
