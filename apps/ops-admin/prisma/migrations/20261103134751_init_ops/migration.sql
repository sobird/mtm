-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('MENU', 'BUTTON', 'API');

-- CreateTable
CREATE TABLE "OpsAccount" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsRole" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "OpsRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsPermission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PermissionType" NOT NULL,
    "parentCode" TEXT,
    "path" TEXT,
    "icon" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OpsPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsAccountRole" (
    "accountId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "OpsAccountRole_pkey" PRIMARY KEY ("accountId","roleId")
);

-- CreateTable
CREATE TABLE "OpsRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "OpsRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "OpsRoleMerchantScope" (
    "roleId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,

    CONSTRAINT "OpsRoleMerchantScope_pkey" PRIMARY KEY ("roleId","merchantId")
);

-- CreateTable
CREATE TABLE "OpsLoginLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsLoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsOperationLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsMenuItem" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "url" TEXT,
    "code" TEXT,
    "auth" BOOLEAN NOT NULL DEFAULT false,
    "index" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "sortId" INTEGER NOT NULL DEFAULT 0,
    "toolMenu" BOOLEAN NOT NULL DEFAULT false,
    "permissionCode" TEXT,

    CONSTRAINT "OpsMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeedMeta" (
    "version" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeedMeta_pkey" PRIMARY KEY ("version")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpsAccount_username_key" ON "OpsAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "OpsRole_code_key" ON "OpsRole"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OpsPermission_code_key" ON "OpsPermission"("code");

-- CreateIndex
CREATE INDEX "OpsAccountRole_roleId_idx" ON "OpsAccountRole"("roleId");

-- CreateIndex
CREATE INDEX "OpsRolePermission_permissionId_idx" ON "OpsRolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "OpsRoleMerchantScope_merchantId_idx" ON "OpsRoleMerchantScope"("merchantId");

-- CreateIndex
CREATE INDEX "OpsLoginLog_accountId_createdAt_idx" ON "OpsLoginLog"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "OpsOperationLog_accountId_createdAt_idx" ON "OpsOperationLog"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "OpsAccountRole" ADD CONSTRAINT "OpsAccountRole_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "OpsAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsAccountRole" ADD CONSTRAINT "OpsAccountRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "OpsRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsRolePermission" ADD CONSTRAINT "OpsRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "OpsRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsRolePermission" ADD CONSTRAINT "OpsRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "OpsPermission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsRoleMerchantScope" ADD CONSTRAINT "OpsRoleMerchantScope_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "OpsRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
