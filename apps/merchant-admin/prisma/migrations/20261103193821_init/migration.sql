-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('MENU', 'BUTTON', 'API');

-- CreateTable
CREATE TABLE "MerchantAccount" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "interCode" TEXT NOT NULL DEFAULT '86',
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantRole" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MerchantRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantPermission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PermissionType" NOT NULL,
    "parentCode" TEXT,
    "path" TEXT,
    "icon" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MerchantPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantAccountRole" (
    "accountId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "MerchantAccountRole_pkey" PRIMARY KEY ("accountId","roleId")
);

-- CreateTable
CREATE TABLE "MerchantRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "MerchantRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "MerchantLoginLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantLoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOperationLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "status" INTEGER,
    "type" INTEGER,
    "payload" JSONB,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantCategory" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "MerchantCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantLicense" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" INTEGER,
    "name" TEXT,
    "url" TEXT,
    "status" INTEGER,
    "expireAt" TEXT,

    CONSTRAINT "MerchantLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantEntry" (
    "merchantId" TEXT NOT NULL,
    "step" INTEGER,
    "status" INTEGER,
    "payload" JSONB,

    CONSTRAINT "MerchantEntry_pkey" PRIMARY KEY ("merchantId")
);

-- CreateTable
CREATE TABLE "EntryTask" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "bizType" INTEGER,
    "localCommerce" INTEGER,
    "status" INTEGER,

    CONSTRAINT "EntryTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryType" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateUrl" TEXT,
    "payload" JSONB,

    CONSTRAINT "EntryType_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "url" TEXT,
    "code" TEXT,
    "auth" BOOLEAN NOT NULL,
    "index" TEXT,
    "level" INTEGER NOT NULL,
    "sortId" INTEGER NOT NULL,
    "toolMenu" BOOLEAN NOT NULL,
    "permissionCode" TEXT,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuBadge" (
    "menuId" TEXT NOT NULL,
    "actionType" INTEGER,
    "noticeStyle" INTEGER,
    "noticeContent" TEXT,

    CONSTRAINT "MenuBadge_pkey" PRIMARY KEY ("menuId")
);

-- CreateTable
CREATE TABLE "MenuPreference" (
    "accountId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuPreference_pkey" PRIMARY KEY ("accountId","menuId")
);

-- CreateTable
CREATE TABLE "MenuFavorite" (
    "accountId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuFavorite_pkey" PRIMARY KEY ("accountId","menuId")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "displayName" TEXT,
    "type" INTEGER,
    "target" INTEGER,
    "status" INTEGER,
    "ctime" INTEGER,
    "stime" INTEGER,
    "etime" INTEGER,
    "price" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "validDays" INTEGER,
    "validStime" INTEGER,
    "validEtime" INTEGER,
    "sendCount" INTEGER,
    "leftCount" INTEGER,
    "stock" INTEGER,
    "limit" INTEGER,
    "putCrowd" INTEGER,
    "useCrowd" INTEGER,
    "position" INTEGER,
    "ticketType" INTEGER,
    "rule" JSONB,
    "putTerm" JSONB,
    "useTerm" JSONB,
    "spuList" JSONB,
    "spuIds" JSONB,
    "wmPoiIds" JSONB,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "applyStartTime" TEXT,
    "applyEndTime" TEXT,
    "startTimeStr" TEXT,
    "endTimeStr" TEXT,
    "applyStartTimeStr" TEXT,
    "applyEndTimeStr" TEXT,
    "applyStatus" INTEGER,
    "applySpuCount" INTEGER,
    "applySkuCount" INTEGER,
    "minStock" TEXT,
    "maxStock" TEXT,
    "cover" TEXT,
    "canClickApply" BOOLEAN,
    "payload" JSONB,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "kind" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "title" TEXT,
    "type" INTEGER,
    "content" TEXT,
    "createTime" INTEGER,
    "publishTime" INTEGER,
    "duration" INTEGER,
    "noticeStyle" INTEGER,
    "notifyEnable" BOOLEAN,
    "actionList" JSONB,
    "payload" JSONB,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("kind","id")
);

-- CreateTable
CREATE TABLE "Violation" (
    "id" TEXT NOT NULL,
    "issueCount" INTEGER,
    "appealCount" INTEGER,
    "ticketAmount" INTEGER,
    "payload" JSONB,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoldPeriod" (
    "id" TEXT NOT NULL,
    "lastPeriodStatus" INTEGER,
    "currentPeriodSTime" TEXT,
    "currentPeriodETime" TEXT,
    "payload" JSONB,

    CONSTRAINT "GoldPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoldStandard" (
    "key" TEXT NOT NULL,
    "periodId" TEXT NOT NULL DEFAULT '1',
    "name" TEXT,
    "desc" TEXT,
    "progress" TEXT,
    "url" TEXT,
    "qualified" INTEGER,
    "payload" JSONB,

    CONSTRAINT "GoldStandard_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MerchantTask" (
    "id" TEXT NOT NULL,
    "poiId" TEXT NOT NULL DEFAULT '0',
    "curTaskCount" INTEGER,
    "curAwardCount" INTEGER,
    "payload" JSONB,

    CONSTRAINT "MerchantTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "interCode" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceData" (
    "key" TEXT NOT NULL,
    "payload" JSONB,

    CONSTRAINT "ReferenceData_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AnalysisSnapshot" (
    "key" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "payload" JSONB,

    CONSTRAINT "AnalysisSnapshot_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SeedMeta" (
    "version" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeedMeta_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "poiId" TEXT NOT NULL DEFAULT '0',
    "payload" JSONB,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantAccount_username_key" ON "MerchantAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantRole_code_key" ON "MerchantRole"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantPermission_code_key" ON "MerchantPermission"("code");

-- CreateIndex
CREATE INDEX "MerchantAccountRole_roleId_idx" ON "MerchantAccountRole"("roleId");

-- CreateIndex
CREATE INDEX "MerchantRolePermission_permissionId_idx" ON "MerchantRolePermission"("permissionId");

-- AddForeignKey
ALTER TABLE "MerchantAccountRole" ADD CONSTRAINT "MerchantAccountRole_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MerchantAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAccountRole" ADD CONSTRAINT "MerchantAccountRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "MerchantRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantRolePermission" ADD CONSTRAINT "MerchantRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "MerchantRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantRolePermission" ADD CONSTRAINT "MerchantRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "MerchantPermission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

