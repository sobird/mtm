# CLAUDE.md

本文件是新会话的交接入口。

## 项目

开源电商运营后台（项目名 `mtm`），以当前仓库 `mtm` 为基线，演进为：

- `apps/merchant-admin`：现有商家后台（Next.js）
- `apps/ops-admin`：运营端
- `apps/core-api`：commerce-core（Hono）
- 共享包：`packages/contracts`（权限码）、`packages/auth`（密码 / 签名 / 菜单过滤）、`packages/ui`（共享壳层）、`packages/i18n`（语言与消息）
- 三个 PostgreSQL 数据库：`commerce_core` / `commerce_ops` / `commerce_merchant`

## 当前状态（重要）

- 阶段 1 已完成（monorepo + PostgreSQL/Prisma 数据层）：Turborepo 工作区、`apps/merchant-admin`、`apps/core-api`、三个业务库与测试库、Prisma 迁移与种子数据、一键启动脚本均已就绪。
- 阶段 2 已完成（认证 / 权限与 ops-admin）：两个门户独立登录与会话 Cookie、集中权限码与菜单过滤、页面 403、账号 / 角色管理、BFF 60 秒签名 JWT 与 `core-api` 服务间鉴权、共享 UI 壳层均已就绪。
- 阶段 3 已完成（类目/品牌/商家/上传）：类目树 CRUD、品牌 CRUD + 图片上传、运营端商家/店铺只读、商家端店铺资料自维护、图片本地存储（StorageAdapter）均已就绪。
- 阶段 4 已完成（商品/版本/审核）：商品 CRUD 与版本化（已审核版本不可变）、类目属性校验、商家端商品列表/表单/提交/发布/下线、运营端商品只读列表与详情、审核列表与通过/驳回、演示商品种子与 7 个 `product:*` 权限码均已就绪。
- 阶段 5 已完成（i18n/开源化/CI）：两个门户双语与语言切换、共享 `@mtm/i18n` 包、菜单/权限/错误码翻译、硬编码中文门禁（`check:i18n`）、敏感信息扫描（`check:sensitive`）、核心与门户操作日志、开源文档与脱敏均已完成。
- 当前无未完成阶段；后续为阶段 5 计划中的 E2E、CI 与 Docker 收尾任务。

## 必读文档

- 设计：`docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md`
- 前置迁移设计：`docs/superpowers/specs/2026-11-03-nextjs-migration-design.md`
- 阶段 1 计划：`docs/superpowers/plans/2026-11-03-open-commerce-admin-phase1-foundation.md`
- 阶段 2 计划：`docs/superpowers/plans/2026-11-03-open-commerce-admin-phase2-auth.md`
- 阶段 3 计划：`docs/superpowers/plans/2026-11-04-open-commerce-admin-phase3-catalog-merchant-upload.md`
- 阶段 4 计划：`docs/superpowers/plans/2026-11-04-open-commerce-admin-phase4-products.md`
- 阶段 5 设计：`docs/superpowers/specs/2026-11-04-open-commerce-admin-phase5-i18n-open-source-ci-design.md`
- 阶段 5 计划：`docs/superpowers/plans/2026-11-04-open-commerce-admin-phase5-i18n-open-source-ci.md`

## 已定技术决策

- 包管理 / 脚本：Bun；workspaces + Turborepo
- Lint / Format：oxlint + oxfmt；类型检查 `tsc --noEmit`
- 前端：Next.js 15 App Router + React 19
- UI：现有 `components/ui` 封装层 + antd 6；页面只能从 `@/components/ui` 导入；不使用 Pro Components
- 数据请求：RSC + TanStack Query；Zustand 只管 UI 偏好
- 表单：React Hook Form + Zod
- 后端：`core-api` 使用 Hono + Zod + OpenAPI
- 数据库：PostgreSQL + Prisma；一个实例、三个独立库
- 认证：Auth.js v5 + JWT；两个门户使用独立 Cookie（`merchant.session` / `ops.session`）与独立密钥（`AUTH_SECRET` / `OPS_AUTH_SECRET`）
- 权限：权限码在 `packages/contracts` 集中定义；菜单按权限过滤、页面守卫跳 `/403`、接口按权限码校验；门户经 BFF 用 60 秒签名 JWT 调用 `core-api`（`CORE_API_JWT_SECRET`）
- 语言：中英双语，默认中文
- 许可证：MIT，版权人见 `LICENSE`
- 项目名 / 包作用域：`mtm` / `@mtm/*`
- 计划拆分：分阶段多计划，每阶段可独立交付

## 约束

- 不把旧系统品牌、内部域名、员工信息、真实业务数据、密钥带入开源代码。
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
bun run check:i18n       # 界面层硬编码中文门禁
bun run check:sensitive  # 敏感信息（旧品牌/内部路径/非演示邮箱）扫描
bun run test:e2e         # Playwright 端到端测试
bun run docker:up        # 本地 Docker Compose 自托管
bun run build
```

服务端口：`apps/merchant-admin` 为 3000，`apps/ops-admin` 为 3001，`apps/core-api` 为 4000。`bun run dev` 依赖 Docker 启动本地 PostgreSQL。

上传相关环境变量（见 `.env.example`）：

- `CORE_PUBLIC_URL`：`core-api` 对外基址（默认 `http://localhost:4000`），用于拼接上传文件的绝对 URL。
- `UPLOAD_DIR`：本地图片存储目录（默认 `var/uploads`，相对 `apps/core-api`）。
- `UPLOAD_MAX_BYTES`：单文件上限，默认 `10485760`（10MB）。

上传接口只接受 PNG / JPEG / WEBP，返回的公开地址形如 `${CORE_PUBLIC_URL}/uploads/<随机文件名>`。`apps/core-api/var/` 已在 `.gitignore` 中，不提交。

演示账号：运营端 `admin / admin123`；商家主账号 `merchant@example.com / merchant123`（或手机号 `13412345678` + 登录页图形验证码）；商家子账号 `staff@example.com / staff123`。图形验证码与演示密码仅用于本地演示，生产环境必须关闭验证码或接入短信服务，并更换全部演示密码与 `change-me*` 占位密钥。

## i18n 约定

- 语言与消息集中在 `packages/i18n`（`@mtm/i18n`）：`LOCALE_COOKIE = 'NEXT_LOCALE'`、`DEFAULT_LOCALE = 'zh-CN'`、`SUPPORTED_LOCALES = ['zh-CN', 'en-US']`。
- 服务端与客户端分别用 `getTranslations` / `useTranslations`；缺 key 时 `handleIntlError` 抛 `MISSING_MESSAGE`，不做静默回退。
- key 按域分层：`common.*`、`menu.*`、`menu.badge.*`、`errors.*`。菜单与权限名使用稳定 key，种子数据可回退到原始中文；语言名（`中文` / `English`）用静态标签映射，不放进语言包。
- `bun run check:i18n` 只扫描界面层（`app/`、`components/`、共享 UI/i18n 包）；注释、种子、测试与 API 路由除外。真实业务数据需以 `// i18n-ignore` 标注。

## 操作日志约定

- 核心日志：`core-api` 的 `recordCoreOperationLog(tx, auth, input)` 必须在业务事务内写 `CoreOperationLog`；写入失败则整个事务回滚（fail-closed）。
- 门户日志：两个门户 BFF 在 `core-api` 调用成功后再写 `OpsOperationLog`；写入失败只 `console.error` 并继续返回成功（fail-open），因为核心状态变更已完成、无法回滚。
- 日志账号 ID 取自会话，不信任前端传值；`detail` 只记录 ID 与状态，不复制业务内容。

## 新会话怎么继续

1. 读本文件、设计文档和当前阶段的实现计划。
2. 设计已获批准；按计划执行，不要跳过阶段边界。
3. 阶段 1–5 已完成，计划见 `docs/superpowers/plans/` 下对应的 `phase1-foundation`、`phase2-auth`、`phase3-catalog-merchant-upload`、`phase4-products`、`phase5-i18n-open-source-ci` 文件。
4. 下一步：阅读阶段 5 计划，继续其中的 E2E、CI 与 Docker 收尾任务。
5. 完成一个阶段后再编写下一阶段的计划。
