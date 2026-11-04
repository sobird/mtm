# 开源电商运营后台 设计文档

> 状态：待评审（基线仓库适配版）
> 日期：2026-11-03
> 工作名：open-commerce-admin（最终名称待定）
> 基线仓库：`/Users/sobird/mtm`
> 前置文档：`docs/superpowers/specs/2026-11-03-nextjs-migration-design.md`（已完成的 Next.js 迁移）
> 说明：以 mtm 为底座原地演进为 monorepo，替代此前「新建空仓库」的方案。

## 1. 背景与意图

### 1.1 基线仓库现状

`/Users/sobird/mtm` 是一个已经可运行的商家后台：

- 单体 Next.js 15 + React 19，App Router，Bun + oxlint/oxfmt。
- Sequelize + SQLite，`sync + seed`，单商家（`merchantId = 1`），没有迁移文件。
- NextAuth v5 + JWT + 手机验证码；没有角色与权限点。
- 已有页面：登录/注册、入驻、店铺资料、设置、营销中心、优惠券。
- 商品只有 `selling` 列表的 JSON payload，没有商品 CRUD / SKU / 类目管理 / 审核。
- UI：antd 6 只允许出现在 `components/ui` 封装层内，页面使用 Base UI + CSS Modules。
- 仍包含美团品牌资源与内部文案，尚未脱敏。

### 1.2 参考系统

- 运营端前端（`fe-shop-admin`）：React 16 + Redux + antd 3 + Roo + qiankun + 内部 SSO/UAC。
- 商家端前端（`fe-merchant-admin`）：Yarn workspaces，同类技术栈，Epassport + 子账号 RBAC。
- 后端（`mall-admin`）：Java BFF/聚合层，自身几乎没有领域数据。

### 1.3 目标

不是把旧代码整体搬出来，而是在 mtm 的基础上演进成**可独立运行、可被其他团队复用的开源电商后台底座**：

1. 保留 mtm 已有业务与 UI 体系。
2. 补齐权限、商品、类目、审核四条链路。
3. 把单应用重构为「两门户 + core-api」的 monorepo。
4. 完成脱敏与开源化。

## 2. 范围

### 2.1 V1 必须完成

- 两个门户：
  - 运营端（平台视角，跨商家）。
  - 商家端（商家视角，租户隔离 + 子账号）。
- 保留现有商家功能：
  - 登录/注册、入驻、店铺资料、设置、营销中心、优惠券继续可用。
  - 现有页面迁入 `apps/merchant-admin`，不重写视觉与交互。
- 形态与数据层迁移：
  - 单应用改为 Bun workspaces monorepo。
  - SQLite + Sequelize 迁移到 PostgreSQL + Prisma。
  - 旧 SQLite 数据不导入，只保留/扩充演示种子数据。
- 权限：
  - 登录、会话、菜单权限、按钮权限。
  - 运营端 RBAC；商家端 RBAC + 子账号。
  - 服务端强制校验，前端只做展示控制。
- 商品：
  - 商品列表 / 新建 / 编辑 / 删除（商家端）。
  - 商品查看 + 审核（运营端）。
  - 多 SKU、价格、库存、主图、类目、品牌。
  - 图片真实上传（本地存储）。
  - 商品版本与状态流转。
- 类目：
  - 类目树、增删改、排序、启用/停用。
  - 类目属性定义（基础类型）。
- 商家与店铺：
  - 主数据由 `core-api` 管理，V1 由种子数据创建。
  - 运营端只读查看；商家端可编辑自己的基础资料。
  - 不提供运营端新建 / 删除商家与店铺的能力（见 16 节扩展点）。
- 审核：
  - 商家提交 → 运营审核（通过/驳回）→ 商家发布/下架。
  - 审核记录、审核意见、操作留痕。
- 工程化：
  - 一条命令本地启动。
  - 种子数据（虚构商家、店铺、类目、商品、账号）。
  - 中英双语（默认中文），界面、种子数据、错误信息都走 i18n。
  - 现有 Vitest 测试迁移后继续通过；新增模块补单元 / 集成 / E2E 测试。
  - CI、Docker、README、贡献指南、MIT 许可证。

### 2.2 非目标（V1 不做）

- 不迁移 `fe-shop-admin` / `fe-merchant-admin` / `mall-admin` 的代码、数据、Git 历史；它们只作为业务参考。
- 不删除 mtm 现有店铺、营销、优惠券功能；这些功能保留并迁入 `apps/merchant-admin`。
- 不做微前端（qiankun 明确移除）。
- 不做订单、结算、IM、H5 的实际功能；营销能力以现有优惠券/活动为准，不扩展新玩法。
- 不做旧 SQLite 历史数据迁移，只保留演示种子数据。
- 不做云厂商绑定、不做特定 PaaS 部署脚本。
- 不做复杂工作流引擎、不做消息队列。

### 2.3 反目标（做了也算失败）

- 只有假接口、没有真实领域模型的演示壳子。
- 1:1 复刻旧代码，把技术债（4 套 HTTP 封装、`indexOf` 权限匹配、硬编码微应用）一起带过来。
- 为了「通用」提前抽象出大量没人用的框架层。
- 任何页面泄露美团品牌、内部域名、员工信息、真实业务数据或密钥。

## 3. 约束

- **零美团元素**：名称、Logo、图片、域名、接口地址、埋点、员工姓名/工号、Token、真实商家/商品数据全部替换。
- **以 mtm 为基线原地演进**：保留现有页面、交互与业务能力，重构工程形态、数据层与权限模型。
- **不把旧系统代码直接搬入**：`fe-shop-admin` / `fe-merchant-admin` / `mall-admin` 只作为业务流程和接口清单的参考。
- **Git 历史**：保留 mtm 现有历史；合并/开源前必须审计历史中是否有密钥、内部域名或真实数据，必要时重写历史或重新初始化。
- **数据库隔离**：运营端、商家端、commerce-core 各自独立数据库。
- **一条命令启动**：新机器 clone 后无需手工建库、灌数据。
- **开源友好**：MIT 许可证；默认配置可直接跑；不依赖任何私有 npm 包或内部服务。
- **UI 架构不变**：页面只从 `components/ui` 导入；antd 只出现在封装层内部。

## 4. 总体架构

### 4.1 形态

Bun workspaces + Turborepo 单仓库（在 mtm 原地改造）：

```text
mtm/                        # 当前仓库；最终名称待定
├── apps/
│   ├── merchant-admin/     # 现有 mtm 应用迁入：Next.js UI + 本地 BFF
│   ├── ops-admin/          # 运营端 Next.js：UI + 门户 BFF
│   ├── core-api/           # commerce-core：Hono 纯 API 服务
│   └── docs/               # 文档站（V1 可选，见 18 节）
├── packages/
│   ├── ui/                 # 从 components/ui 分阶段提取的共享 UI
│   ├── auth/               # 会话、权限码、路由守卫、服务间签名
│   ├── contracts/          # Zod schema、权限码常量、OpenAPI 类型化客户端
│   ├── config/             # oxlint / oxfmt / TS 共享配置
│   └── i18n/               # 文案与语言包
├── scripts/
│   └── dev-bootstrap.mjs   # 启动前确保数据库、迁移、种子数据
├── docker-compose.yml      # PostgreSQL（+ 可选 MinIO）
├── turbo.json
├── bun.lock
└── package.json            # workspaces: apps/*, packages/*
```

迁移节奏：先保持现有应用可运行，再逐步搬入 `apps/merchant-admin`；`packages/ui` 的提取放在四模块打通之后，避免一次性重构面过大。

### 4.2 运行时拓扑

```text
Browser
  ├── :3000  merchant-admin (Next.js UI + /api/bff)   # 沿用现有端口
  └── :3001  ops-admin (Next.js UI + /api/bff)
                    │  HTTPS + 短期签名 JWT
                    ▼
              :4000  core-api (Hono)
                    │  Prisma
                    ▼
        PostgreSQL :5432
          ├── commerce_core       # 商品/类目/审核/商家/店铺
          ├── commerce_ops        # 运营端账号/角色/菜单/日志
          └── commerce_merchant   # 商家端账号/子账号/角色/日志
```

关键点：

- 浏览器**只**访问各自门户，不直接访问 `core-api`。
- 门户的 Next.js 服务端（RSC / Route Handler）代为调用 `core-api`，并携带服务间签名。
- 一个 PostgreSQL 实例、三个逻辑数据库。默认满足「数据库分开」；需要物理隔离时可拆成三个实例，只改连接串。

### 4.3 为什么 core-api 用 Hono

- 纯 API 服务，不需要 React / RSC。
- `@hono/zod-openapi` 打通「Zod 校验 → OpenAPI 文档 → 前端类型化客户端」。
- 轻量、可移植（Node / Bun / 边缘运行时）。

如果后续团队更希望「一个框架走到底」，可替换为 Next.js Route Handlers，架构不变。

### 4.4 工具链

| 用途          | 选择                                     | 说明                                 |
| ------------- | ---------------------------------------- | ------------------------------------ |
| 包管理        | Bun                                      | `bun install`，锁文件 `bun.lock`     |
| 任务编排      | Turborepo                                | 与 Bun workspaces 配合               |
| Lint          | oxlint                                   | Rust 实现，速度快；不做类型感知      |
| Format        | oxfmt                                    | Prettier 兼容目标，替代 Prettier     |
| 类型检查      | `tsc --noEmit`                           | CI 必跑，补足 oxlint 的类型盲区      |
| 单元/集成测试 | Vitest                                   | 由 Bun 运行脚本，测试框架保持 Vitest |
| E2E           | Playwright                               | 独立运行器                           |
| 运行时        | Node 22（Next.js）+ Bun（core-api 可选） | 见下方说明                           |

运行时说明：

- Bun 在本项目中**替代 pnpm**，负责依赖安装、脚本运行、workspace 管理。
- 两个 Next.js 门户保持 **Node 运行时**，确保 App Router / RSC / Auth.js 的官方兼容性。
- `core-api`（Hono）可以直接跑在 Bun 上；这也是选择 Hono 的收益之一。是否启用 `bun --bun` 由构建者决定。
- Prisma、Auth.js、Playwright 均通过 Bun 执行 CLI，运行时可执行文件按各自官方支持为准。

Lint / Format 说明：

- oxlint 覆盖 TypeScript、React、React Hooks、import 等常用规则，但**不支持类型感知规则**，也没有完整的 ESLint 插件生态（如 `eslint-config-next` 的部分规则）。
- 类型正确性由 `tsc --noEmit` 保证；oxlint 只负责语法、风格和常见错误。
- oxfmt 以 Prettier 兼容为目标；遇到不支持的语法时，优先升级版本，必要时回退 Prettier。
- 如果后续发现某条关键规则 oxlint 无法覆盖，允许「oxlint 为主 + 极少量 ESLint」的混合方案，但不在 V1 默认引入。

## 5. 数据库与数据归属

| 数据库              | 归属          | 内容                                                                                                                             | 访问方              |
| ------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `commerce_core`     | commerce-core | 商家、店铺、类目、品牌、商品、SKU、商品版本、审核记录、核心操作日志                                                              | 仅 `core-api`       |
| `commerce_ops`      | 运营门户      | 运营账号、角色、权限、菜单、登录日志、操作日志、会话                                                                             | 仅 `ops-admin`      |
| `commerce_merchant` | 商家门户      | 商家账号、子账号、角色、权限、菜单、登录日志、操作日志；现有商家业务表（入驻、资质、优惠券、活动、消息、违规、分析、金牌、任务） | 仅 `merchant-admin` |

规则：

- 跨库只通过 ID 引用，不做跨库外键。
- 运营端要跨商家查询，通过 `core-api` 的显式平台权限完成。
- 商家端所有读写都带 `merchantId`，由服务端从会话注入，**不信任前端传值**。
- 各应用的 Prisma schema 放在各自应用内（`apps/*/prisma/schema.prisma`），不抽公共 DB 包。
- 现有 Sequelize 模型按归属拆分：商家/店铺/类目主数据进 `commerce_core`；账号、菜单、营销、入驻等商家业务进 `commerce_merchant`。
- 旧 SQLite 数据库整体废弃，不做历史数据迁移。
- **主键统一使用 cuid 字符串**：旧 SQLite 的自增整数 ID 不保留，种子数据重新生成 cuid；现有页面与测试中的数字 ID 改为字符串。跨库引用 `merchantId` / `shopId` / `accountId` 同样使用字符串。

## 6. 数据模型

### 6.1 commerce_core

#### 商家与店铺

```prisma
model Merchant {
  id           String   @id @default(cuid())
  code         String   @unique
  name         String
  status       MerchantStatus @default(ACTIVE)
  contactName  String?
  contactPhone String?
  profile      Json?                 // 旧 merchant payload / 未建模字段
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  shops        Shop[]
}

model Shop {
  id           String   @id @default(cuid())
  merchantId   String
  name         String
  logoUrl      String?
  status       ShopStatus @default(ACTIVE)
  description  String?
  externalLink String?
  address      String?
  contactName  String?
  contactPhone String?
  profile      Json?                 // 旧 shop payload / 未建模字段
  createdAt    DateTime @default(now())
  merchant     Merchant @relation(fields: [merchantId], references: [id])
}
```

V1 中商家与店铺由种子数据创建；运营端只读，商家端可通过 `PATCH /merchants/me`、`PATCH /shops/:id` 编辑自己的基础资料。资质、钱包、结算等商家业务数据仍留在 `commerce_merchant`。

#### 类目与品牌

```prisma
model Category {
  id       String  @id @default(cuid())
  parentId String?
  name     String
  level    Int     @default(1)      // 1..3
  path     String                   // 形如 /root/child/leaf
  sort     Int     @default(0)
  status   CategoryStatus @default(ACTIVE)
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  attributes CategoryAttribute[]
}

model CategoryAttribute {
  id         String  @id @default(cuid())
  categoryId String
  name       String
  type       AttributeType  // TEXT / NUMBER / SELECT
  required   Boolean @default(false)
  options    Json?           // SELECT 类型的选项
  sort       Int     @default(0)
  category   Category @relation(fields: [categoryId], references: [id])
}

model Brand {
  id      String @id @default(cuid())
  name    String @unique
  logoUrl String?
  status  BrandStatus @default(ACTIVE)
}
```

约束：

- 类目最多 3 级；删除时若存在子类目或商品，拒绝删除并提示。
- 品牌在 V1 提供简单 CRUD（列表、新增、编辑、停用）。

#### 商品与版本

采用「商品身份 + 版本快照」模型，保证审核的是确定的商品内容，已发布内容不会被草稿改动影响。

```prisma
model Product {
  id                 String  @id @default(cuid())
  merchantId         String
  shopId             String
  categoryId         String
  brandId            String?
  code               String  @unique       // 商品编码，用户可见
  currentVersionId   String?               // 最新草稿/审核中版本
  publishedVersionId String?               // 线上版本
  deletedAt          DateTime?             // 软删除
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  versions           ProductVersion[]
}

model ProductVersion {
  id           String  @id @default(cuid())
  productId    String
  version      Int
  status       ProductVersionStatus @default(DRAFT)
  title        String
  subtitle     String?
  mainImageUrl String
  images       Json                 // 图片 URL 数组
  description  String
  attributes   Json                 // { [categoryAttributeId]: value }
  createdBy    String               // 商家端账号 ID
  createdAt    DateTime @default(now())
  submittedAt  DateTime?
  reviewedAt   DateTime?
  publishedAt  DateTime?
  audits       AuditRecord[]
  skus         Sku[]
  product      Product @relation(fields: [productId], references: [id])
}

model Sku {
  id               String  @id @default(cuid())
  productVersionId String
  skuCode          String
  specs            Json    // 例如 { "颜色": "红", "尺码": "L" }
  price            Decimal @db.Decimal(10, 2)
  stock            Int     @default(0)
  status           SkuStatus @default(ACTIVE)
  productVersion   ProductVersion @relation(fields: [productVersionId], references: [id])
}

model AuditRecord {
  id               String  @id @default(cuid())
  productVersionId String
  status           AuditStatus @default(PENDING)
  submitterId      String
  reviewerId       String?
  comment          String?
  submittedAt      DateTime @default(now())
  reviewedAt       DateTime?
  productVersion   ProductVersion @relation(fields: [productVersionId], references: [id])
}

model MediaAsset {
  id         String   @id @default(cuid())
  filename   String                    // 随机生成的文件名
  mimeType   String
  size       Int
  url        String                    // 对外可访问 URL
  uploadedBy String
  merchantId String?
  createdAt  DateTime @default(now())
}
```

图片上传：

- 两个门户都调用 `POST /api/v1/uploads/images`（multipart/form-data）。
- 权限：商家端需要 `product:update` 或 `shop:update`；运营端需要 `brand:manage` 或 `category:manage`。
- `merchantId` 由服务端从 JWT 注入：商家资源写入自己的 `merchantId`；运营端上传品牌/类目图片时写 `null`（平台资源）。
- 服务端校验 MIME（png/jpeg/webp）、大小上限、使用随机文件名，禁止路径穿越。
- 默认写入 `core-api` 本地 `var/uploads/`，通过公开静态路径 `/uploads/*` 提供访问；商品图片 URL 直接使用该路径。
- 通过 `StorageAdapter` 抽象存储实现，未来可替换为 S3 / MinIO。
- 图片是公开资源，浏览器可直接从 `core-api` 的 `/uploads/*` 加载。这是「浏览器只访问门户」的唯一例外，只用于公开图片，不暴露任何业务 API。

说明：

- SKU 属于版本，因此每个版本是完整快照。
- `specs` 使用自由 JSON。类目级的 SKU 规格模板留作扩展点，V1 不做。
- `attributes` 与 `CategoryAttribute` 对应，审核页按类目属性渲染。

### 6.2 commerce_ops

```prisma
model OpsAccount {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  name         String
  status       AccountStatus @default(ACTIVE)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  roles        OpsAccountRole[]
}

model OpsRole {
  id          String @id @default(cuid())
  code        String @unique
  name        String
  permissions OpsRolePermission[]
  accounts    OpsAccountRole[]
}

model OpsPermission {
  id         String @id @default(cuid())
  code       String @unique      // 如 product:view / product:audit
  name       String
  type       PermissionType     // MENU / BUTTON / API
  parentCode String?
  path       String?             // 菜单路径
  icon       String?
  sort       Int     @default(0)
  roles      OpsRolePermission[]
}

model OpsAccountRole {
  accountId String
  roleId    String
}

model OpsRolePermission {
  roleId       String
  permissionId String
}

// 运营角色的可见商家范围；拥有 platform:cross-tenant 的角色不受此表限制
model OpsRoleMerchantScope {
  roleId     String
  merchantId String
}

model OpsLoginLog {
  id        String   @id @default(cuid())
  accountId String
  ip        String?
  userAgent String?
  success   Boolean
  createdAt DateTime @default(now())
}

model OpsOperationLog {
  id         String   @id @default(cuid())
  accountId  String
  action     String
  resource   String
  resourceId String?
  detail     Json?
  createdAt  DateTime @default(now())
}
```

### 6.3 commerce_merchant

与运营端结构对应，但账号归属商家：

```prisma
model MerchantAccount {
  id           String   @id @default(cuid())
  merchantId   String
  username     String   @unique
  passwordHash String
  name         String
  phone        String?
  isOwner      Boolean  @default(false)
  status       AccountStatus @default(ACTIVE)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  roles        MerchantAccountRole[]
}

model MerchantRole { ... }
model MerchantPermission { ... }
model MerchantAccountRole { ... }
model MerchantRolePermission { ... }
model MerchantLoginLog { ... }
model MerchantOperationLog { ... }
```

- 子账号 = `isOwner = false` 的 `MerchantAccount`。
- 商家主账号默认拥有该商家全部权限；子账号按角色授权。
- 所有查询的 `merchantId` 来自会话，不来自请求参数。

#### 现有商家业务表迁移

| 现有 Sequelize 模型                                          | 新归属                                                 | 迁移说明                                                                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `Account`                                                    | `commerce_merchant` → `MerchantAccount`                | 现有 `login` 映射为 `username`；增加 `passwordHash`、`isOwner`、`status`、角色关系；保留 `mobile` / `interCode` |
| `Merchant`                                                   | `commerce_core` → `Merchant`                           | 主数据；商家端可改自己的基础资料，运营端只读                                                                    |
| `MerchantCategory`                                           | `commerce_core` → `Category`                           | 并入统一类目树                                                                                                  |
| `MerchantLicense`                                            | `commerce_merchant` → `MerchantLicense`                | 商家资质                                                                                                        |
| `MerchantEntry` / `EntryTask` / `EntryType`                  | `commerce_merchant`                                    | 入驻流程                                                                                                        |
| `MenuItem` / `MenuBadge` / `MenuPreference` / `MenuFavorite` | `commerce_merchant`                                    | 菜单表增加 `permissionCode`；`title` 改存 i18n key                                                              |
| `Coupon` / `Campaign`                                        | `commerce_merchant`                                    | 营销中心                                                                                                        |
| `Message` / `Violation`                                      | `commerce_merchant`                                    | 消息与违规                                                                                                      |
| `GoldPeriod` / `GoldStandard` / `MerchantTask`               | `commerce_merchant`                                    | 金牌与任务                                                                                                      |
| `AnalysisSnapshot`                                           | `commerce_merchant`                                    | 分析快照                                                                                                        |
| `Registration` / `Invitation` / `ReferenceData`              | `commerce_merchant`                                    | 注册、邀请、字典                                                                                                |
| `Product`（selling payload）                                 | `commerce_core` → `Product` / `ProductVersion` / `Sku` | 旧的 JSON payload 不再保留；`/api/product/selling` 改为读取 core-api 的商品投影                                 |
| `SeedMeta`                                                   | 每个库各自保留                                         | 分库后独立记录种子版本                                                                                          |

迁移原则：

- 模型字段能映射的直接映射，不能映射的放入 `payload` JSON，避免一次性拆完所有历史字段。
- 现有页面所需的 DTO 由 service 层适配，页面尽量不改。
- 现有 Vitest 测试跟随模型迁移更新，但断言保持不变。

## 7. 权限模型

### 7.1 权限码

统一在 `packages/contracts` 中定义常量，前后端共用：

```ts
export const PERMISSIONS = {
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_SUBMIT: 'product:submit',
  PRODUCT_PUBLISH: 'product:publish',
  PRODUCT_AUDIT: 'product:audit',
  CATEGORY_VIEW: 'category:view',
  CATEGORY_MANAGE: 'category:manage',
  BRAND_MANAGE: 'brand:manage',
  MERCHANT_VIEW: 'merchant:view',
  MERCHANT_UPDATE: 'merchant:update',
  SHOP_VIEW: 'shop:view',
  SHOP_UPDATE: 'shop:update',
  ACCOUNT_MANAGE: 'account:manage',
  ROLE_MANAGE: 'role:manage',
  PLATFORM_CROSS_TENANT: 'platform:cross-tenant',
} as const;
```

按门户划分：

- **运营端**：`product:view`、`product:audit`、`category:*`、`brand:manage`、`merchant:view`、`shop:view`、账号/角色管理、`platform:cross-tenant`。
- **商家端**：`product:view/create/update/delete/submit/publish`、`merchant:update`、`shop:update`、`account:manage`、`role:manage`。
- 运营端**不提供**商品新建 / 编辑 / 删除能力，权限码也不授予给运营角色。

### 7.2 菜单与路由

- 保留现有 DB 驱动菜单（`MenuItem`），新增 `permissionCode` 字段；运营端也使用 DB 驱动菜单。
- `MenuItem.title` 存 i18n key（如 `menu.product.list`），前端翻译；类目/品牌名属于业务数据，不翻译。
- 服务端根据会话权限过滤菜单后渲染；按钮级权限用 `<Can permission="...">` / `PermissionButton`。
- 直接访问无权限路由 → 403 页面。
- 不使用旧系统的 `indexOf` 字符串匹配；改用精确路径 / 路由段匹配。
- **类目与品牌由运营端管理**；商家端只读，用于商品表单中的类目 / 品牌选择。
- 菜单数据与权限点通过种子数据初始化，运营端提供角色-权限配置页。

### 7.3 服务端强制校验

三层：

1. **门户会话**：Auth.js 校验登录态。
2. **门户 BFF**：把会话转换为签名 JWT（含 `portal`、`userId`、`merchantId`、`permissions`），转发给 `core-api`。
3. **core-api 中间件**：校验 JWT；对每个资源校验 `merchantId` 归属与权限码。越权返回 403，不返回数据。

运营端的商家范围规则：

- 拥有 `platform:cross-tenant` → 可访问所有商家。
- 没有该权限 → 只能访问 `OpsRoleMerchantScope` 中显式授权的商家；未授权商家一律 403。
- 该范围在门户 BFF 生成 JWT 时注入，`core-api` 再次校验。

前端按钮隐藏只是体验，不作为安全边界。

## 8. 商品审核状态机

### 8.1 商品版本状态

```text
DRAFT ──提交──▶ SUBMITTED ──通过──▶ APPROVED ──发布──▶ PUBLISHED
  ▲                 │                                      │
  │                 └──驳回──▶ REJECTED ──编辑──▶ DRAFT     │
  │                                                        │
  └──编辑（新版本）── OFFLINE ◀────────下架────────────────┘
```

规则：

- 新建商品 = 新建 `Product` + 一个 `DRAFT` 版本。
- 提交 = 版本状态 `SUBMITTED`，生成 `AuditRecord(PENDING)`。
- 通过 = 版本 `APPROVED`，记录审核人、时间、意见。
- 驳回 = 版本 `REJECTED`，必须填写审核意见；商家可编辑后重新提交（产生新的审核记录，历史保留）。
- 发布 = 版本 `PUBLISHED`，`Product.publishedVersionId` 指向该版本；旧线上版本标记 `SUPERSEDED`。
- 下架 = 线上版本标记 `OFFLINE`，`publishedVersionId` 清空。
- **已发布商品编辑**：创建 `version + 1` 的新草稿，线上版本不受影响；新版本通过并发布后，线上内容才切换。
- **版本不可变**：一旦某个版本产生 `AuditRecord`，就不再原地修改。
  - `DRAFT`（尚未提交）：允许原地编辑。
  - `REJECTED` / `APPROVED` / `PUBLISHED` / `OFFLINE`：编辑时创建 `version + 1` 的新草稿，旧版本与审核记录保持原样。（`SUPERSEDED` 是发布切换旧线上版本时的标记，不会成为当前版本，编辑路径不可达。）
  - `SUBMITTED` 期间不允许编辑；需要修改时等待审核结果（V1 不提供撤回）。
- **删除**：商品使用软删除（`deletedAt`）。存在 `SUBMITTED` 审核或已发布版本时禁止删除，需先下架；删除不物理清除版本与审核记录，操作留痕保留。
- **SKU 价格与库存**：随版本快照。V1 没有订单，库存为手工维护；从线上版本创建新草稿时复制 SKU 价格与库存，发布新版本时线上库存以新版本为准。库存流水留作扩展点。
- **运营端可见性**：运营端商品列表只展示 `SUBMITTED` 及已通过/已发布的商品；`DRAFT` / `REJECTED` 不对运营端暴露。审核详情只渲染提交审核的那个版本快照。
- 任何状态变更写核心操作日志（`core`）和门户操作日志（`ops` / `merchant`）。
- **发布是商家端的手动动作**：运营端只有审核通过 / 驳回，没有发布按钮；审核通过不会自动上线。

### 8.2 审核分配

V1 不做审核人分配 / 抢单。任何拥有 `product:audit` 的运营账号都可以处理 `PENDING` 审核。并发处理时以后到者收到「已被处理」提示。

## 9. API 设计

### 9.1 约定

- 基础路径：`/api/v1`。
- REST + JSON。
- 错误统一：

```json
{ "error": { "code": "PRODUCT_NOT_FOUND", "message": "商品不存在", "details": null } }
```

- 分页：`?page=1&pageSize=20`，响应：

```json
{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0 } }
```

- 所有响应由 Zod schema 定义，OpenAPI 自动生成。
- 前端客户端由 OpenAPI 生成（`openapi-typescript` + `openapi-fetch`），放在 `packages/contracts`。

### 9.2 core-api 资源

```text
GET    /health

GET    /merchants
GET    /merchants/:id
PATCH  /merchants/me            # 商家端编辑自己的基础资料
GET    /shops
GET    /shops/:id
PATCH  /shops/:id               # 商家端编辑自己的店铺资料

GET    /categories/tree
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id

GET    /brands
POST   /brands
PATCH  /brands/:id

GET    /products
POST   /products
GET    /products/:id
PATCH  /products/:id
DELETE /products/:id
POST   /products/:id/submit
POST   /products/:id/publish
POST   /products/:id/offline
GET    /products/:id/versions   # 当前实现未单独提供该路由，版本历史随商品详情返回

GET    /audits
GET    /audits/:id
POST   /audits/:id/approve
POST   /audits/:id/reject

POST   /uploads/images        # multipart/form-data，返回 { id, url }
GET    /uploads/*             # 公开静态图片

GET    /me
```

约束：`DELETE /products/:id` 为软删除，存在审核中或已发布版本时返回 409；`PATCH /products/:id` 按 8.1 的版本规则执行。

### 9.3 门户 BFF

每个门户提供同源 `/api/bff/[...path]`：

- 读取门户会话。
- 校验资源级权限。
- 用 `CORE_API_JWT_SECRET` 签短期 JWT（默认 60 秒），转发到 `core-api`。
- 浏览器不接触 `core-api` 地址与密钥。

登录、登出、当前会话由门户自己实现（Auth.js），不经过 `core-api`。

### 9.4 门户本地接口与 core-api 的边界

- **core-api**：商品、类目、品牌、审核、商家/店铺主数据、图片上传。
- **merchant-admin 本地 Route Handlers**：登录/验证码、菜单、入驻、资质、钱包、结算、优惠券、活动、消息、违规、分析、金牌、任务等现有功能；店铺基础资料编辑走 core-api。
- **ops-admin 本地 Route Handlers**：登录、菜单、账号/角色；其余通过 core-api。
- 现有商家接口保留原路径，避免页面大改；新增四模块统一走 `/api/v1`。
- 两边的本地接口仍遵循统一响应格式与 Zod 校验。

### 9.5 商品 / 审核错误码（阶段 4 实现）

阶段 4 在 §9.1 的错误封装下使用以下稳定错误码，门户负责翻译：

| 错误码                       | HTTP | 场景                                         |
| ---------------------------- | ---- | -------------------------------------------- |
| `PRODUCT_NOT_FOUND`          | 404  | 商品不存在、跨租户访问，或不在运营可见范围内 |
| `PRODUCT_CODE_EXISTS`        | 409  | 商品编码重复                                 |
| `PRODUCT_CATEGORY_INVALID`   | 400  | 类目不存在                                   |
| `PRODUCT_BRAND_INVALID`      | 400  | 品牌不存在或已禁用                           |
| `PRODUCT_SHOP_INVALID`       | 400  | 店铺不属于当前商家                           |
| `PRODUCT_ATTRIBUTE_UNKNOWN`  | 400  | 提交了类目未定义的属性                       |
| `PRODUCT_ATTRIBUTE_REQUIRED` | 400  | 缺少必填属性                                 |
| `PRODUCT_ATTRIBUTE_INVALID`  | 400  | 属性值不符合类目定义                         |
| `PRODUCT_SKU_DUPLICATE`      | 400  | SKU 编码重复（忽略大小写）                   |
| `PRODUCT_IN_REVIEW`          | 409  | 审核中的商品不可编辑或删除                   |
| `PRODUCT_NOT_DRAFT`          | 409  | 仅草稿可提交审核                             |
| `PRODUCT_NOT_APPROVED`       | 409  | 仅审核通过的版本可发布                       |
| `PRODUCT_NOT_PUBLISHED`      | 409  | 无线上版本时不能下线（阶段 4 新增）          |
| `PRODUCT_PUBLISHED`          | 409  | 存在线上版本时不能删除                       |
| `PRODUCT_VERSION_CONFLICT`   | 409  | 并发创建版本冲突，可重试                     |
| `AUDIT_NOT_FOUND`            | 404  | 审核记录不存在                               |
| `AUDIT_ALREADY_REVIEWED`     | 409  | 审核已被处理（并发后到者）                   |
| `AUDIT_VERSION_CONFLICT`     | 409  | 审核决策时商品版本状态已变化                 |
| `FORBIDDEN`                  | 403  | 权限不足或商家范围不符                       |

## 10. 认证

- **Auth.js（NextAuth v5）+ JWT 会话**（沿用 mtm 现有实现）。
- 运营端、商家端各自独立的 Auth.js 实例、独立 `AUTH_SECRET`、独立会话 Cookie 名（`ops.session` / `merchant.session`）。
- 商家端保留现有「手机号 + 验证码」演示登录；同时新增主账号/子账号密码登录，子账号按角色授权。
- 运营端使用用户名 + 密码登录。
- 密码哈希：Argon2id。
- 验证码只作为演示入口保留，README 明确标注生产环境应关闭或替换为短信服务。
- 登录失败记录到各自登录日志；V1 提供基础限流（同一账号/IP 连续失败计数）。
- 会话过期时间沿用现有 2 小时，可配置。
- 门户调用 `core-api` 时使用短期签名 JWT，不复用浏览器会话 Cookie。
- 后续可迁移到数据库会话，V1 不做。
- 演示账号：
  - 运营端 `admin` / `admin123`。
  - 商家端主账号 `13412345678`（验证码登录）与 `merchant@example.com` / `merchant123`。
  - 商家端子账号 `staff@example.com` / `staff123`。
  - 仅在种子数据中创建；README 提示生产环境必须修改。

## 11. 前端架构

### 11.1 技术选择

| 项       | 选择                                                                                    |
| -------- | --------------------------------------------------------------------------------------- |
| 框架     | Next.js 15 App Router（沿用现有版本线）                                                 |
| UI       | 现有 `components/ui` + antd 6（仅封装层）+ Base UI + CSS Modules；不使用 Pro Components |
| 数据请求 | RSC 首屏 + TanStack Query（客户端表格/表单）                                            |
| 表单     | React Hook Form + Zod（沿用现有）                                                       |
| 样式     | CSS Modules + `styles/tokens.css`；antd 主题集中在 `app/providers.tsx`                  |
| 状态管理 | TanStack Query 管服务端状态，Zustand 只管 UI 偏好；不引入 Redux                         |
| 路由     | App Router 文件路由 + DB 驱动菜单                                                       |
| 国际化   | `next-intl`（或同类），`zh-CN` 默认、`en-US` 可选；文案集中在 `packages/i18n`           |

antd 6 已经是封装层的实现细节，不再引入 `@ant-design/pro-components`。页面与业务组件只能从 `@/components/ui` 导入，约束由 oxlint 的 `no-restricted-imports` 保证。

国际化范围：

- 界面文案、校验信息、服务端错误码对应的提示、状态/枚举标签：中英双语。
- 业务数据（商家名、商品标题、类目名等）按录入内容展示，不做自动翻译。
- 服务端返回稳定的错误码，门户负责翻译；`core-api` 不返回面向用户的自然语言。
- 所有语言包 key 必须完整，缺失 key 视为测试失败。

### 11.2 目录结构（两个门户）

```text
apps/merchant-admin/              # 现有 mtm 应用迁入
├── app/
│   ├── (auth)/login|register/
│   ├── (entry)/...
│   ├── (admin)/...               # 现有页面 + 新增 products/categories/audits
│   └── api/...                   # 现有本地接口 + /api/bff
├── components/ui/                # 暂留应用内，后续提取到 packages/ui
├── lib/
└── prisma/schema.prisma          # commerce_merchant

apps/ops-admin/                   # 新应用
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── layout.tsx            # AdminShell + 权限过滤菜单
│   │   ├── products/
│   │   ├── categories/
│   │   ├── brands/
│   │   ├── audits/
│   │   ├── merchants/
│   │   └── system/
│   └── api/...
└── prisma/schema.prisma          # commerce_ops
```

### 11.3 共享 UI 包

`packages/ui` 从现有 `components/ui` 提取，提供：

- `AdminShell` / `Sidebar` / `Header` / `Breadcrumbs` / `PageContainer`。
- `DataTable`（现有封装）、`SearchForm`、`Form` / `FormField`（React Hook Form）。
- `Can` / `PermissionButton`：按钮级权限控制。
- `StatusTag`：商品/审核状态展示。
- 基础组件：Button、Input、Select、DatePicker、Upload、Dialog、Drawer、Toast 等。
- 403 / 404 / 500 页面。

提取方式：先复制到 `packages/ui` 供 `ops-admin` 使用，`merchant-admin` 暂时保留原路径；四模块稳定后再统一切换，避免一次性重构面过大。

## 12. 多租户与安全

- 所有 `core_api` 商品/审核查询必须带 `merchantId`；该值来自 JWT，不接受查询参数覆盖。
- 运营端跨商家查询需要 `platform:cross-tenant`；普通运营角色只能看被授权的范围。
- 商家端子账号按角色权限过滤；主账号全量。
- SQL 注入：Prisma 参数化 + Zod 入参校验。
- XSS：React 默认转义；富文本如引入必须白名单清洗（V1 描述按纯文本/Markdown 处理）。
- CSRF：同源 BFF + Auth.js 内建保护。
- 密钥只放环境变量；仓库提供 `.env.example`。
- 日志不记录密码、Token、完整手机号（按需脱敏）。

## 13. 一条命令运行

目标：`bun install` 后执行 `bun run dev` 即可。即使从旧的 SQLite 版本升级，也不需要手工迁移数据。

`bun run dev` 由 `scripts/dev-bootstrap.mjs` 负责：

1. `docker compose up -d postgres`，等待健康检查通过。
2. 若数据库不存在，创建三个库。
3. 执行三个 Prisma schema 的 `migrate deploy`。
4. 幂等执行种子数据（已存在则跳过）。
5. 用 Turborepo 并行启动 `core-api`、`ops-admin`、`merchant-admin`（`docs` 可选）。

注意：现有 `./data/mtm.sqlite` 不参与迁移；新系统只使用 PostgreSQL 与种子数据。旧库文件应在 `.gitignore` 中，发布前从工作区删除。

常用脚本：

```json
{
  "packageManager": "bun@1",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun scripts/dev-bootstrap.mjs && turbo run dev",
    "db:migrate": "turbo run db:migrate",
    "db:seed": "turbo run db:seed",
    "db:reset": "turbo run db:reset",
    "lint": "turbo run lint",
    "format": "turbo run format",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:e2e": "playwright test"
  }
}
```

各应用 / 包内的脚本：

```json
{
  "lint": "oxlint .",
  "format": "oxfmt --check .",
  "format:fix": "oxfmt .",
  "typecheck": "tsc --noEmit"
}
```

种子数据：

- 3 个虚构商家、每商家 1~2 个店铺。
- 3 级类目树，约 20 个节点。
- 约 10 个品牌。
- 约 30 个商品，覆盖草稿、审核中、已通过、已驳回、已发布、已下架。
- 运营账号 3 个（超管、审核员、只读）。
- 商家账号：每个商家 1 个主账号 + 2 个子账号。
- 现有 mtm 种子（菜单、入驻、店铺、优惠券、活动、消息等）转换为 `commerce_merchant` 的 Prisma seed，保证现有页面仍可用。
- 所有名称、手机号、资质、商品信息均为虚构数据。

## 14. 脱敏与开源化清单

### 14.1 必须替换

| 旧系统                                                                                                                | 新系统                                |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 美团品牌、Logo、文案                                                                                                  | 新品牌与中性文案                      |
| 仓库名 `mtm`、包名、`package.json` 描述                                                                               | 新项目名与中性描述                    |
| `public/assets/mt_entry.png`、`mtm_logo.png`、`thh_*`、`thh_feo_market.html`、`public/index.html`、`public/jump.html` | 替换为自制占位图或删除                |
| 内部 SSO / UAC / Epassport                                                                                            | Auth.js + 本地 RBAC                   |
| Roo 组件库                                                                                                            | 现有 `components/ui` + antd 6 封装    |
| qiankun 微前端                                                                                                        | 两个独立 Next.js 应用                 |
| 内部接口域名 / 网关                                                                                                   | 本地 `core-api`                       |
| 内部图片 CDN / S3                                                                                                     | 本地文件存储（可替换为 MinIO/S3）     |
| Owl / Logan / LX 埋点                                                                                                 | 默认无埋点；预留可选适配器接口        |
| Talos / 内部 CI                                                                                                       | GitHub Actions + Docker               |
| 真实商家、商品、类目、员工数据                                                                                        | 全虚构种子数据                        |
| 旧 `.env`、Token、签名密钥、`./data/*.sqlite`                                                                         | `.env.example` 占位；数据库文件不入库 |
| IE 兼容代码                                                                                                           | 移除                                  |

### 14.2 检查项

- 全仓库搜索「美团」「mtm」「thh」、内部包名（`@mtfe`、`@wmfe`、`@roo`、`@thh`）、员工邮箱、真实商家名。
- 检查 `public/` 下所有品牌图片、`thh_*.html`、`index.html`、`jump.html`。
- 图片资源不得来自内部 CDN；使用自制占位图或开源图标。
- 审计 mtm 的 Git 历史：确认没有密钥、内部域名、真实数据；否则重写历史或重新初始化后再开源。
- 依赖中不得出现私有 registry 包。
- README 截图不得包含真实数据。

## 15. 旧系统参考映射

| 旧系统                       | 新位置                   | 说明                                 |
| ---------------------------- | ------------------------ | ------------------------------------ |
| `mtm`（基线仓库）            | `apps/merchant-admin`    | 现有 UI、页面与业务整体迁入          |
| `fe-shop-admin`              | `apps/ops-admin`（参考） | 菜单、权限、商品审核、类目流程       |
| `fe-merchant-admin/pc`       | 业务参考                 | 商品、子账号、角色权限；不直接搬代码 |
| `fe-merchant-admin/model`    | 不再需要                 | 新架构用 `packages/contracts`        |
| `fe-merchant-admin/h5`、`im` | 不做                     | 扩展点                               |
| `mall-admin`                 | 不迁移                   | 其能力由 `core-api` 重新实现         |
| 旧后端 Thrift IDL            | 仅参考字段语义           | 不生成代码、不导入                   |

业务参考点：

- 商品列表筛选条件、审核列表与审核计数。
- 类目 / 品牌 / 规格字段。
- 子账号与角色的权限点划分。
- 运营端菜单结构与页面归属。

## 16. 扩展点

V1 只预留「位置」，不写空壳代码：

- **订单**：`core-api` 预留 `/api/v1/orders` 命名空间；Prisma 新增 `Order` 相关模型；运营端新增 `app/(dashboard)/orders`；商家端新增发货页。
- **营销**：现有优惠券/活动保留在 `commerce_merchant`，不迁入 core-api；新增营销玩法再按 `/api/v1/marketing` 设计，避免塞进商品表。
- **结算**：账单与流水独立模块；金额统一 `Decimal`，不做浮点计算。
- **商家 / 店铺入驻**：V1 只有种子数据与只读查询；未来在 `core-api` 增加写入 API、运营端增加管理页面。
- **IM / H5**：如果未来需要，作为独立应用加入 `apps/`，不与 PC 后台耦合。
- **对象存储**：`packages` 中预留 `StorageAdapter` 接口，默认本地实现，可替换 S3/MinIO。
- **埋点**：前端预留 `AnalyticsAdapter`，默认空实现。

扩展点的判断标准：新增模块不应修改商品/审核核心表结构。

## 17. 测试

- **单元测试（Vitest）**
  - 权限码匹配、菜单过滤。
  - 审核状态机（合法/非法流转）。
  - Zod schema 边界。
  - 中英文案 key 完整性、错误码到文案的映射。
- **集成测试（Vitest + 测试数据库）**
  - `core-api` 每个资源的成功、校验失败、未授权、跨租户四类用例。
  - 商品提交流程与并发审核。
  - 运营端只能读取商品 + 审核，调用商品写接口返回 403。
  - 图片上传：合法类型成功、非法类型/超限/路径穿越被拒绝。
- **E2E（Playwright）**
  - 运营端登录 → 建类目 → 审核商品。
  - 商家端登录 → 上传图片 → 建商品 → 提交 → 被驳回 → 修改 → 再提交 → 通过 → 手动发布。
  - 子账号越权访问被拒绝。
  - 中英文切换后关键页面文案正确。
- **迁移回归**
  - 现有 mtm 的 Vitest 测试迁移后继续通过。
  - 现有页面（登录、入驻、店铺资料、优惠券）手工回归清单逐项通过。
- **契约测试**
  - OpenAPI 文档与实现一致性。
  - 生成客户端可编译。

CI（GitHub Actions）：

1. `bun install --frozen-lockfile`（Bun + Turbo 缓存）。
2. `oxlint` + `oxfmt --check` + `tsc --noEmit`。
3. 启动 Postgres 服务，迁移 + 种子。
4. 单元 / 集成测试。
5. 构建三个应用。
6. E2E（可选，按 PR 标签触发）。

## 18. 文档与许可证

- 根 `README.md`：
  - 这是什么、解决什么问题。
  - 架构图、技术栈。
  - 一条命令启动。
  - 演示账号。
  - 截图 / GIF。
  - 与同类项目的差异。
- `CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`。
- `LICENSE`：MIT，版权人待定。
- 文档站（`apps/docs`）：V1 可选。优先保证 README 与 API 文档（OpenAPI 页面）完整。

## 19. 已定决策

| 决策           | 结论                                                    |
| -------------- | ------------------------------------------------------- |
| 基线仓库       | `/Users/sobird/mtm`，原地演进                           |
| 是否单仓库     | 是，Bun workspaces + Turborepo                          |
| 包管理         | Bun（替代 pnpm）                                        |
| Lint / Format  | oxlint + oxfmt（替代 ESLint / Prettier）                |
| 两个门户       | 运营端 + 商家端，各自 Next.js                           |
| 后端           | 新写 `core-api`（Hono），不迁移 Java BFF                |
| 数据库         | 一个 PostgreSQL 实例，三个独立库                        |
| ORM            | Prisma（替换现有 Sequelize）                            |
| UI             | 现有 `components/ui` + antd 6 封装；不用 Pro Components |
| API            | REST + OpenAPI，Zod contracts 共用                      |
| 认证           | Auth.js v5 + JWT，两个门户独立                          |
| 前端数据       | RSC 首屏 + TanStack Query；Zustand 管 UI 偏好           |
| 状态管理       | 不引入 Redux                                            |
| 菜单           | DB 驱动 + `permissionCode` 过滤                         |
| 现有功能       | 店铺/营销/优惠券保留，迁入 merchant-admin               |
| 微前端         | 不做                                                    |
| V1 范围        | 权限 + 商品 + 类目 + 审核                               |
| 运营端商品权限 | 只读 + 审核，不新建/编辑/删除                           |
| 语言           | 中英双语，默认中文                                      |
| 图片           | 真实上传，本地存储                                      |
| 发布           | 商家手动发布                                            |
| 许可证         | MIT                                                     |

## 20. 留给构建者的决定

以下由实现者自行决定，不需要产品确认：

- 各依赖的具体版本（以初始化时的稳定版为准）。
- 目录内文件拆分、组件命名。
- 种子数据的具体文案与数量（在 13 节范围内）。
- 迁移顺序：先搭 monorepo 骨架与 Prisma 迁移，再打通四模块，最后提取 `packages/ui`。
- 现有页面迁移方式：先整体搬入 `apps/merchant-admin`，再逐页切换数据层。
- 现有验证码登录与新密码登录的共存方式；V1 是否强制密码登录。
- `packages/ui` 的提取粒度与 `transpilePackages` 配置。
- Bun 运行时范围：Next.js 门户用 Node；`core-api` 是否用 `bun --bun` 运行。
- oxlint 规则集、忽略目录；缺失规则是否接受或补充极少量 ESLint。
- oxfmt 配置与版本固定；不支持的语法如何回退。
- 图片存储路径、单文件大小上限、允许的 MIME 类型（默认 `core-api/var/uploads`、10MB、png/jpeg/webp）。
- i18n 具体库、语言切换方式（路径前缀 / Cookie / 用户设置）。
- 错误码命名规范与文案组织方式。
- 登录限流的具体算法与阈值。
- 文档站是否在 V1 一起上线。
- OpenAPI 客户端生成的具体命令与缓存策略。
- E2E 是否默认在 CI 全量跑。
- V1 以自托管（Docker Compose）为准；公开在线 Demo 不进 V1 范围。

已由设计自行确定、不再询问实现细节的项：

- 商家 / 店铺在 V1 只读，由种子数据提供。
- 运营角色无 `platform:cross-tenant` 时，按 `OpsRoleMerchantScope` 限制可见商家。
- 类目与品牌只在运营端管理，商家端只读选择。

## 21. 待确认（需要产品/用户回答）

1. **项目名称与品牌**：仓库名、产品名、Logo 文案。
2. **MIT 版权人**：个人名 / 组织名。

以上两项不阻塞开发，可用工作名与默认版权人先推进。
