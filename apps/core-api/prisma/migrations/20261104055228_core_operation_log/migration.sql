-- CreateTable
CREATE TABLE "CoreOperationLog" (
    "id" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorMerchantId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoreOperationLog_resource_resourceId_createdAt_idx" ON "CoreOperationLog"("resource", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "CoreOperationLog_actorId_createdAt_idx" ON "CoreOperationLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "CoreOperationLog_createdAt_idx" ON "CoreOperationLog"("createdAt");
