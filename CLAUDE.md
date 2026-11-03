# CLAUDE.md

本文件是新会话的交接入口。

## 项目

开源电商运营后台（项目名 `mtm`），以当前仓库 `mtm` 为基线，演进为：

- `apps/merchant-admin`：现有商家后台（Next.js）
- `apps/ops-admin`：运营端
- `apps/core-api`：commerce-core（Hono）
- 三个 PostgreSQL 数据库：`commerce_core` / `commerce_ops` / `commerce_merchant`

## 当前状态（重要）

- 阶段 1 已完成（monorepo + PostgreSQL/Prisma 数据层）：Turborepo 工作区、`apps/merchant-admin`、`apps/core-api`、三个业务库与测试库、Prisma 迁移与种子数据、一键启动脚本均已就绪。
- 下一个阶段是阶段 2：认证/权限与 ops-admin。
- 后续阶段：2 认证/权限与 ops-admin，3 类目/品牌/商家/上传，4 商品/版本/审核，5 i18n/开源化/CI。

## 必读文档

- 设计：`docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md`
- 前置迁移设计：`docs/superpowers/specs/2026-11-03-nextjs-migration-design.md`
- 阶段 1 计划：`docs/superpowers/plans/2026-11-03-open-commerce-admin-phase1-foundation.md`
- 后续阶段计划：待创建（`docs/superpowers/plans/`）

## 已定技术决策

- 包管理 / 脚本：Bun；workspaces + Turborepo
- Lint / Format：oxlint + oxfmt；类型检查 `tsc --noEmit`
- 前端：Next.js 15 App Router + React 19
- UI：现有 `components/ui` 封装层 + antd 6；页面只能从 `@/components/ui` 导入；不使用 Pro Components
- 数据请求：RSC + TanStack Query；Zustand 只管 UI 偏好
- 表单：React Hook Form + Zod
- 后端：`core-api` 使用 Hono + Zod + OpenAPI
- 数据库：PostgreSQL + Prisma；一个实例、三个独立库
- 认证：Auth.js v5 + JWT；两个门户独立
- 语言：中英双语，默认中文
- 许可证：MIT，版权人 `sobird`
- 项目名 / 包作用域：`mtm` / `@mtm/*`
- 计划拆分：分阶段多计划，每阶段可独立交付

## 约束

- 不把美团品牌、内部域名、员工信息、真实业务数据、密钥带入开源代码。
- 现有商家功能（店铺 / 营销 / 优惠券）保留，迁移到 `apps/merchant-admin`。
- 旧 SQLite 数据不迁移；旧演示表保留原有字符串 ID，新业务表使用 cuid。
- 运营端商品只读 + 审核；商家端负责商品 CRUD / 提交 / 发布。
- 商品版本一旦进入审核即不可变；编辑已提交 / 已驳回商品会创建新版本。
- 发布是商家手动动作。
- 所有新表主键使用 cuid 字符串；跨库只通过 ID 引用，不做跨库外键。

## 现有命令

```bash
bun install
cp .env.example .env
bun run dev        # 启动 PostgreSQL、迁移、种子数据并运行所有工作区应用
bun run db:migrate
bun run db:seed
bun run db:reset
bun run lint
bun run fmt:check
bun run typecheck
bun run test
bun run build
```

服务端口：`apps/merchant-admin` 为 3000，`apps/core-api` 为 4000。`bun run dev` 依赖 Docker 启动本地 PostgreSQL。

## 参考仓库（只读，不直接搬代码）

- `/Users/sobird/Meituan/fe-shop-admin`：旧运营端，参考菜单 / 权限 / 审核
- `/Users/sobird/Meituan/fe-merchant-admin`：旧商家端，参考商品 / 子账号
- `/Users/sobird/Meituan/mall-admin`：旧 Java BFF，仅参考接口语义

## 新会话怎么继续

1. 读本文件、设计文档和当前阶段的实现计划。
2. 设计已获批准；按计划执行，不要跳过阶段边界。
3. 阶段 1 已完成，归档计划见 `docs/superpowers/plans/2026-11-03-open-commerce-admin-phase1-foundation.md`。
4. 下一步：编写并执行阶段 2（认证/权限与 ops-admin）的计划。
5. 完成一个阶段后再编写下一阶段的计划。
