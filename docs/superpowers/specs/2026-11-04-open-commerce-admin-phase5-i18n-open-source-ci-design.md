# 阶段 5：i18n、开源化与 CI 设计

> 本文是主设计文档 `docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md` 的阶段性细化，只覆盖阶段 5。主设计已批准的决策仍然有效；本文只补主设计留给构建者的选择，以及阶段 4 推迟的事项。

## 1. 背景

阶段 1–4 已完成：monorepo、认证/权限、类目/品牌/商家/上传、商品/版本/审核。仓库当前已经可以运行和演示，但还不满足“随时可公开”的标准：

- 两个门户只有中文文案，没有语言包，文案散落在页面和组件里。
- 阶段 4 最终评审把设计 §8.1 要求的操作日志推迟到本阶段（台账 Ruling R12）。门户已有 `OpsOperationLog` / `MerchantOperationLog`，核心库还没有日志表，商品/审核状态变更没有留痕。
- CI 只有 PR 触发的 lint/typecheck/test/build，没有 PostgreSQL 服务、没有 `fmt:check`、没有 E2E；`Dockerfile` 仍是旧 SQLite 单应用版本。
- 缺 README（现为旧的 `README.asciidoc`）、CONTRIBUTING、CODE_OF_CONDUCT、SECURITY；文档与 CLAUDE.md 仍保留旧系统引用。

本阶段的目标是让仓库**随时可公开**：脱敏、文档、CI、自托管都到位。本阶段不实际发布，不推送公开仓库，不改写 Git 历史。

## 2. 目标与非目标

### 目标

1. 两个门户全部页面中英双语（`zh-CN` 默认，`en-US` 可选），语言包集中在 `packages/i18n`。
2. 商品/审核生命周期在三个数据库都留下操作日志。
3. 完成开源化文档与脱敏，并通过自动化扫描守住“无敏感引用”。
4. GitHub Actions CI 覆盖 lint/format/typecheck/test/build，以及关键流程 Playwright E2E。
5. Docker Compose 一条命令自托管（PostgreSQL + 三个应用）。

### 非目标

- 不推送公开仓库，不重写 Git 历史；历史审计只读，发现问题只报告。
- 不重新启用 `deploy.yml` 中被禁用的 Docker 构建与 SSH 部署步骤。
- 不做操作日志查询界面、不做文档站（`apps/docs`）。
- 不新增业务功能；不改变阶段 1–4 已定的状态机与权限模型。

### 反目标

- 出现任何真实商家、员工、内部域名或密钥（即使只在注释、测试或文档里）。
- 只翻译新页面而留下中文老页面；或靠“缺失 key 回退中文”掩盖未覆盖的文案。
- E2E 依赖固定数据计数或脆弱选择器，导致 CI 长期不稳定。

## 3. i18n

### 3.1 库与语言切换

- 使用 `next-intl`，两个门户各自接入；语言包放在共享包 `packages/i18n`。
- 语言通过 Cookie `NEXT_LOCALE` 保存，**不加 URL 路径前缀**。理由：现有菜单、回调地址、E2E 与书签都基于当前路径；加前缀会改动全部路由。Cookie 方式只需在根布局读取并传给 `NextIntlClientProvider`。
- 默认 `zh-CN`；用户在壳层右上角切换 `zh-CN` / `en-US`，切换后写 Cookie（一年、`SameSite=Lax`）并刷新当前页。
- 服务端组件用 `getTranslations`，客户端组件用 `useTranslations`；`html lang`、antd `ConfigProvider` 的 locale（`zhCN` / `enUS`）随当前语言切换。
- 未设置 Cookie 时固定返回 `zh-CN`，不依赖浏览器语言或 IP。

### 3.2 文案包结构

`packages/i18n` 导出：

- `LOCALE_COOKIE`、`DEFAULT_LOCALE`、`SUPPORTED_LOCALES`、`type Locale`。
- `messages/zh-CN.json`、`messages/en-US.json`，同名 key 树。
- `getMessages(locale)`、`createTranslator(locale)`（服务端/测试用）、`translateError(code, t)`（错误码 → 文案）。
- key 命名空间：`common`、`menu`、`auth`、`catalog`、`product`、`audit`、`validation`、`errors`、`status`。

约束：

- 两份语言包 key 集合必须完全一致；测试把两份 JSON 展平成 key 列表并比较，缺任何一边即失败。
- `next-intl` 在缺失 key 时抛错（默认行为），不允许配置“回退到默认语言”来掩盖缺失。
- 文案 key 使用点分命名（如 `product.form.title`），不用中文 key。

### 3.3 覆盖范围

- **翻译**：两个门户**全部页面**（包括阶段 1 之前迁移过来的入驻、店铺、优惠券、营销、消息、分析、金牌、任务等页面）的界面文案、按钮、表头、占位符、空状态、确认对话框、Toast、客户端表单校验信息、服务端错误码对应提示、状态/枚举标签、页面 metadata 标题、`packages/ui` 壳层与通用组件里的固定文案。
- **不翻译**：业务数据（商家名、店铺名、商品标题、类目名、品牌名、属性值等）按录入内容展示；演示账号与种子数据保持录入原样。
- **DB 驱动的 UI 文案**：由种子/数据库提供、但属于界面文案而非业务数据的字段（菜单标题、菜单徽标 `noticeContent`、通知文案等）改存 i18n key，由前端翻译。判据是“这是界面措辞还是用户录入的业务内容”；拿不准时优先存 key。
- `core-api` 返回的 `message` 仅作为开发诊断信息，门户**不得**直接展示；门户一律按 `error.code` 翻译。
- 阶段 1–4 的本地 Route Handler 也会返回错误码（`CATEGORY_*`、`BRAND_*`、`UPLOAD_*`、`ACCOUNT_*`、`INVALID_*` 等），它们与 `core-api` 的错误码一样必须映射文案，不能只覆盖主设计 §9.5 的产品/审核错误码。

### 3.4 菜单标题

- 菜单表 `title` 改存 i18n key（如 `menu.product.list`），由前端翻译；这是主设计 §5 已定的规则。
- 商家端菜单来自旧种子 JSON（`apps/merchant-admin/lib/db/seed/data/main/menu/get.json`）：在种子转换层增加“旧标题 → i18n key”的映射，未映射的标题在种子阶段直接报错，避免带着中文标题入库。
- 运营端菜单种子（`apps/ops-admin/lib/db/seed/auth.ts`）直接改存 key。
- 壳层渲染菜单时对 key 做翻译；若 key 不存在则原样显示（防御用户自建数据），但种子测试保证内置菜单 key 全部存在。
- 阶段 4 新增的商品/审核菜单（1382/1383/19245 等）一并转换为 key。

### 3.5 错误码与校验信息

- 门户增加 `translateError(code, t)`：覆盖**两个门户与 `core-api` 实际会返回的全部错误码**（包括主设计 §9.5 与阶段 1–4 的本地接口错误码）；未知错误码回退到 `errors.UNKNOWN`。
- 增加一个源码扫描测试：从 `core-api` 与两个门户的 Route Handler / 服务里提取所有 `HttpError('CODE'` / 错误码常量，断言每个码在 `errors` 文案里都有条目；新增码却忘了文案时测试直接失败。
- 现有 `ApiError.message` 不再直接 `toast.error(error.message)`；改为 `toast.error(translateError(error.code, t))`。相应调整阶段 1–4 的页面与测试。
- 客户端 Zod 校验：把 schema 改为工厂函数，接收翻译函数（`createLoginSchema(t)` 等），在渲染/提交时得到当前语言文案；测试可传入固定翻译器。避免把中文写死在 schema 里。
- 服务端错误码本身不翻译、不改名；只新增文案映射。

### 3.6 覆盖门禁

- `packages/i18n` 的 key 一致性测试。
- 新增 `scripts/check-i18n.mjs`：扫描两个门户与 `packages/ui` 的 `.tsx/.ts`，发现 JSX 文本或常见属性（label、placeholder、title、aria-label）里的中文字符即失败；业务数据、种子、测试、文案包通过显式 `// i18n-ignore` 注释或路径白名单豁免。该脚本进 CI，防止后续新增页面重新引入硬编码文案。
- 两个门户各增加一组双语言渲染测试：登录页、壳层菜单、商品列表/表单、审核列表等关键页面在 `zh-CN` 与 `en-US` 下断言关键文案。

## 4. 操作日志

### 4.1 核心操作日志

在 `commerce_core` 新增 `CoreOperationLog`：

| 字段              | 说明                                    |
| ----------------- | --------------------------------------- |
| `id`              | cuid                                    |
| `portal`          | `ops` / `merchant`                      |
| `actorId`         | 服务令牌中的 `userId`                   |
| `actorMerchantId` | 服务令牌中的 `merchantId`（运营端为空） |
| `action`          | 如 `product.submit`、`audit.approve`    |
| `resource`        | `product` / `audit`                     |
| `resourceId`      | 商品或审核 ID                           |
| `detail`          | JSON：版本 ID、变更前后状态、驳回原因等 |
| `createdAt`       | 默认当前时间                            |

索引：`[resource, resourceId, createdAt]`、`[actorId, createdAt]`、`[createdAt]`。只有 `core-api` 访问该表。

### 4.2 写入点与事务语义

`core-api` 在下列动作中写入核心日志，并与状态变更在**同一个事务**内提交：

| action            | 触发                  | 记录要点                        |
| ----------------- | --------------------- | ------------------------------- |
| `product.create`  | 新建商品              | 商品 ID、版本 ID                |
| `product.update`  | 编辑草稿 / 创建新版本 | 商品 ID、版本号、是否新建版本   |
| `product.submit`  | 提交审核              | 商品 ID、审核 ID、版本 ID       |
| `product.publish` | 手动发布              | 商品 ID、新线上版本 ID          |
| `product.offline` | 下线                  | 商品 ID、被下线的版本 ID        |
| `product.delete`  | 软删除                | 商品 ID                         |
| `audit.approve`   | 审核通过              | 审核 ID、商品/版本 ID           |
| `audit.reject`    | 审核驳回              | 审核 ID、商品/版本 ID、驳回原因 |

核心日志写入失败时整个操作回滚（fail-closed），因为日志是审计要求的一部分。

### 4.3 门户操作日志

- 商家端 BFF 的商品动作（创建、编辑、提交、发布、下线、删除）在 `core-api` 调用成功后，用现有 `writeOperationLog` 写 `MerchantOperationLog`。
- 运营端 BFF 的审核通过/驳回在成功后写 `OpsOperationLog`。
- `action` 命名与核心日志一致；`resource` 用 `product` / `audit`；`detail` 只记录 ID 与状态，不复制商品内容。
- 门户日志写失败时记 `console.error` 并继续返回成功（fail-open）：此时 `core-api` 的状态变更已完成，无法回滚，让用户看到失败反而误导。核心日志已经提供了审计底线。
- 日志账号 ID 从会话取得，不信任前端传值。

### 4.4 范围与展示

- V1 不做日志查询界面；已有的账号/角色操作日志保持不变。
- 菜单/文档中登记全部 action 名称，供后续界面或导出使用。

## 5. 开源化

### 5.1 文档

新增/替换：

- `README.md`：项目定位、功能截图占位、架构图（文字版即可）、技术栈、快速开始（`bun install` → `cp .env.example .env` → `bun run dev`）、演示账号、常用脚本、Docker 自托管、目录结构、许可协议。
- `CONTRIBUTING.md`：环境要求、常用命令、代码风格（oxlint/oxfmt）、测试要求、提交信息约定（Conventional Commits）、PR 流程。
- `CODE_OF_CONDUCT.md`：Contributor Covenant 2.1 中文/英文版本。
- `SECURITY.md`：支持的版本、漏洞报告方式（不鼓励公开 issue 报安全漏洞）、演示密钥不可用于生产。
- 删除旧 `README.asciidoc`；保留 `LICENSE`（MIT，版权人信息以 `LICENSE` 为准）。

### 5.2 脱敏

- 清理文档与 `CLAUDE.md` 中对旧系统品牌、内部仓库绝对路径的引用，改写为中性描述（“旧系统”“参考实现”“内部路径”）；迁移背景保留，但不出现内部标识。已批准的阶段 1–4 设计与计划文档一并中性化改写（技术内容不变）。
- 新增 `scripts/check-sensitive.mjs` 并接入 CI：
  - 只扫描受版本控制的**文本文件**（按扩展名与 UTF-8 校验跳过二进制）。
  - 敏感模式统一维护在 `scripts/check-sensitive.mjs` 中，该脚本是唯一事实来源；本文不重复列举。
  - 允许清单：检查脚本自身、`LICENSE` 与 `deploy/nginx/mtm.conf` 中的公开作者信息、公开依赖镜像、演示邮箱；按“文件 + 模式”精确匹配，不使用整目录豁免。
  - 发现真实商家名或员工信息时，先改种子/文档再重新扫描；不允许用允许清单掩盖。
- 人工检查 `apps/merchant-admin/public` 与 `apps/ops-admin/public` 下所有图片/HTML，确认没有品牌标识；没有用途的旧资源删除。
- 依赖检查：确认没有私有 registry 包；`.npmrc` 使用公开镜像 `registry.npmmirror.com`，在 README 中说明可替换为官方源。
- `.env.example` 只保留占位值；README 明确演示密码仅用于本地。

### 5.3 Git 历史审计

- 只读审计：扫描全部提交中的密钥样式（私钥、Token、密码赋值）、真实数据文件、旧品牌资源路径与内部域名。
- 审计报告写到仓库外的 `.superpowers/`（已忽略），不提交；对用户口头汇总发现。
- 若发现有效密钥：报告并要求轮换，**不改写历史、不删除提交**（用户已决定不重写）。

### 5.4 部署工作流

- `.github/workflows/deploy.yml` 原样保留；其中被禁用的 Docker 构建、GHCR 登录与 SSH 部署步骤本阶段不重新启用。阶段 5 完成后在注释里更新说明（Dockerfile 已可构建，但启用部署需人工确认）。

## 6. CI

### 6.1 `checks`（PR 与 master 推送）

- `ubuntu-latest`，`postgres:17-alpine` service，健康检查 `pg_isready`。
- 创建 6 个数据库（三个业务库 + 三个测试库）：使用 `scripts/ci-databases.mjs`（通过 `psql` 连接默认 `postgres` 库执行 `CREATE DATABASE IF NOT EXISTS` 等价逻辑）；runner 预装 `psql` 不可靠时先 `apt-get install -y postgresql-client`。
- 环境变量与 `deploy.yml` 中的测试环境保持一致（`MERCHANT_DATABASE_URL`、`CORE_DATABASE_URL`、`OPS_DATABASE_URL`、三个 `*_TEST_DATABASE_URL`、`AUTH_SECRET`、`OPS_AUTH_SECRET`、`CORE_API_JWT_SECRET`、`CORE_API_URL`）。
- 步骤：checkout → setup-bun（读取 `.bun-version`、缓存）→ `bun install --frozen-lockfile` → `bun run lint` → `bun run fmt:check` → `bun run typecheck` → `bun run test` → `bun run build`。
- 测试的 global setup 会自行 `prisma migrate reset` 测试库，CI 只需保证测试库存在。
- 缓存：Bun 安装缓存由 `setup-bun` 处理；`.turbo` 用 `actions/cache`，key 含 lockfile 哈希。

### 6.2 `e2e`

- 触发：`push` 到 `master`；`pull_request` 且带 `e2e` 标签（用 `github.event.pull_request.labels` 判断）。
- `needs: checks`，同样起 Postgres service 并建库；执行 `scripts/e2e-bootstrap.mjs`（创建/重置 `*_e2e` 库 → 三个应用 `prisma migrate reset --force` → 种子），然后 `bun run build`，后台启动三个应用（指向 e2e 库），安装 Playwright 浏览器并运行。
- E2E 使用独立的 `commerce_merchant_e2e` / `commerce_core_e2e` / `commerce_ops_e2e`，不复用开发库或单元测试库；每轮先重置再种子，保证可重复。
- 失败时上传 Playwright trace / screenshot / video（保留 7 天）。
- 超时 30 分钟；失败重试 1 次，仅重试失败用例。

### 6.3 `docker`

- 仅在 `master` 推送时运行：构建三个运行时目标（不推送镜像），防止 Dockerfile 与代码漂移。

## 7. E2E

新增根级 `e2e` 工作区（Playwright + TypeScript），不混入单元测试：

- 在根 `package.json` 的 `workspaces` 加入 `e2e`；`e2e/package.json` 只定义 `test:e2e`、`typecheck`、`lint`、`format`，**不定义 `test` / `build`**，因此 `turbo run test/build` 不会把它纳入。
- 根脚本增加 `test:e2e` 与 `e2e:bootstrap`。
- 依赖：`@playwright/test` 装在 `e2e` 工作区；CI 用 `bunx playwright install --with-deps chromium`。
- E2E 通过环境变量指向 `*_e2e` 数据库；`scripts/e2e-bootstrap.mjs` 负责建库、`prisma migrate reset --force` 与种子，可本地与 CI 共用。

场景（对应主设计 §17）：

1. **运营端主流程**：登录（`admin/admin123`）→ 新建一个本次运行唯一命名的类目 → 打开商品审核列表 → 对种子中的待审核商品执行通过 → 断言状态。
2. **商家端完整生命周期**：密码登录（`merchant@example.com/merchant123`）→ 上传一张测试图片 → 新建商品（唯一编码/标题）→ 提交审核 → 断言“审核中不可编辑” → 运营端驳回并填写原因 → 商家端看到驳回原因 → 修改后重新提交 → 运营端通过 → 商家端手动发布 → 断言已发布。
3. **越权**：子账号（`staff@example.com/staff123`）访问运营端接口/页面被拒绝（403 或跳转 `/403`）；商家子账号调用无权限的商品动作返回 403。
4. **中英切换**：在商家端与运营端切换语言，断言登录页、菜单、商品/审核页面的关键文案随语言变化，且刷新后保持。

约定：

- 选择器优先使用 role + 可访问名称（按钮文案随语言变化时用 `data-testid`）；不依赖 antd 内部 CSS 类。
- 每次运行生成唯一名称（时间戳/随机后缀），避免与种子或上一次运行冲突；不做绝对计数断言。
- 测试数据只通过 UI 与公开 API 创建；不直接写数据库。
- 本地运行使用 Playwright `webServer` 数组启动三个应用（环境变量指向 e2e 库）；CI 复用已启动进程，避免端口冲突。
- E2E 的应用以 `NODE_ENV=production` 启动，但 Playwright 走 HTTP，因此启动时必须设置 `AUTH_COOKIE_SECURE=false`，否则会话 Cookie 不会写入。
- 浏览器只装 Chromium。
- 测试账号与演示数据由种子提供；本地与 CI 的前置步骤统一为 `bun run e2e:bootstrap`（建库 + 重置 + 种子）。

## 8. Docker 自托管

### 8.1 镜像

重写根 `Dockerfile` 为多阶段、多目标：

- `deps`：`oven/bun:1.4.4`，仅复制根 `package.json`、`bun.lock`、`.npmrc` 与各工作区 `package.json`（或直接复制全仓库）后 `bun install --frozen-lockfile`。
- `builder`：复制源码，为三个应用跑 `prisma generate`，`next build` 两个门户，`tsc --noEmit` 校验 `core-api`。
- `merchant`：`node:22-slim`，复制 Next standalone 产物、`.next/static`、`public`，`CMD node server.js`，端口 3000。
- `ops`：同 `merchant`，端口 3001。
- `core-api`：`oven/bun:1.4.4-slim`，复制源码、生成的 Prisma client、prisma 迁移目录与 `node_modules`，`CMD bun src/index.ts`，端口 4000。

Next 两个门户的 `next.config.ts` 显式设置 `outputFileTracingRoot` 为 monorepo 根，保证 standalone 目录结构可预测（当前 `output: 'standalone'` 已启用）。

### 8.2 Compose

重写 `docker-compose.yml`：

- `postgres`：保留现有配置，增加健康检查。
- `migrate`（一次性）：等待 Postgres 健康后，对三个库执行 `prisma migrate deploy`；当 `SEED_DEMO_DATA=true` 时再写入演示种子（生成的 `.env.docker` 默认开启，生产部署可关闭）。成功退出。
- `core-api`、`merchant`、`ops`：`depends_on` `migrate`（`condition: service_completed_successfully`）与 `postgres`（healthy）；通过 `env_file: .env.docker` 注入连接串与密钥。
- 容器内连接串使用服务名：`postgresql://mtm:mtm@postgres:5432/...`；服务端调用 core-api 用 `CORE_API_URL=http://core-api:4000`，浏览器访问的公开地址用 `CORE_PUBLIC_URL=http://localhost:4000`。
- 卷：`mtm-postgres`（数据库）、`mtm-uploads`（core-api 的 `UPLOAD_DIR`，其余服务只读或共享）。
- 端口：3000 / 3001 / 4000 暴露到宿主机；默认不包含 nginx。
- 一条命令：`bun run docker:up`。该脚本执行 `scripts/docker-up.mjs`：若 `.env.docker` 不存在，则生成它（容器内数据库地址、随机 `AUTH_SECRET` / `OPS_AUTH_SECRET` / `CORE_API_JWT_SECRET`、`AUTH_COOKIE_SECURE=false`），然后运行 `docker compose up --build`。`.env.docker` 已在 `.gitignore` 中，不提交。
- 说明：`.env.example` 仍是本地开发（宿主机 `localhost`）的模板，占位密钥保留；Docker 自托管使用生成的 `.env.docker`，避免生产校验拒绝占位密钥。
- 门户的 Auth.js Cookie 安全标记改为读取 `AUTH_COOKIE_SECURE`（未设置时默认 `NODE_ENV === 'production'`）；自托管 demo 在 HTTP 下显式设为 `false`。README 与 SECURITY.md 说明：生产部署应启用 TLS 并恢复默认 `true`。
- 健康检查：core-api `GET /health`（已有）、门户首页。

## 9. 验收标准

- `bun run lint`、`bun run fmt:check`、`bun run typecheck`、`bun run test`、`bun run build` 全绿。
- `packages/i18n` key 一致性测试通过；`scripts/check-i18n.mjs` 无违规；两个门户双语言渲染测试通过。
- 商品/审核的每个动作都产生核心日志与对应门户日志；并发/失败场景有测试。
- `scripts/check-sensitive.mjs` 扫描为零命中；README/CONTRIBUTING/CODE_OF_CONDUCT/SECURITY 就绪。
- CI 的 `checks`、`e2e`、`docker` 三个 job 在 PR/master 上按约定触发并通过。
- 干净环境执行 `bun run docker:up` 后，两个门户可登录、演示流程可走通；README 的快速开始步骤可原样复现。
- HTTP 自托管下 `AUTH_COOKIE_SECURE=false` 生效；未设置且 `NODE_ENV=production` 时仍默认安全 Cookie（有测试覆盖）。
- Git 历史审计报告完成（只读，不提交）。

## 10. 已定决策

| 决策             | 结论                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| i18n 库          | `next-intl`，语言包集中在 `packages/i18n`                                  |
| 语言切换方式     | Cookie `NEXT_LOCALE`，无 URL 前缀                                          |
| 默认语言         | `zh-CN`，固定默认，不跟随浏览器                                            |
| 菜单标题         | DB 存 i18n key，种子转换层完成映射                                         |
| 服务端错误文案   | `core-api` 的 `message` 仅作诊断，门户按错误码翻译                         |
| 校验文案         | Zod schema 工厂接收翻译函数                                                |
| 核心日志事务语义 | 与状态变更同事务，失败回滚                                                 |
| 门户日志事务语义 | 成功动作后写入；写失败记日志但不回滚用户操作                               |
| 日志界面         | V1 不做                                                                    |
| 部署工作流       | 保留 `deploy.yml`，不启用被禁用的 Docker/SSH 步骤                          |
| npm 源           | 保留公开镜像 `registry.npmmirror.com`，README 说明可替换                   |
| README 格式      | 新写 `README.md`，删除 `README.asciidoc`                                   |
| E2E 触发         | master 推送全跑；PR 带 `e2e` 标签跑                                        |
| E2E 数据         | 独立 `*_e2e` 库，每轮重置 + 种子，不污染开发/测试库                        |
| E2E 工作区       | 根 `e2e/` 纳入 workspaces，只注册 `test:e2e`，不进 `bun run test`          |
| Docker 形态      | 单 Dockerfile 多目标，Compose 含一次性 `migrate` 服务                      |
| Docker 启动      | `bun run docker:up` 生成 `.env.docker`（随机密钥、容器内地址）后启动       |
| Cookie 安全标记  | `AUTH_COOKIE_SECURE` 可覆盖，默认跟随 `NODE_ENV`；仅自托管 demo 设为 false |
| 脱敏扫描         | 只扫文本、大小写不敏感、精确允许清单；不整目录豁免                         |
| 文档处理         | 阶段 1–4 设计与计划一并中性化改写；作者公开信息保留                        |
| Git 历史         | 只读审计；发现密钥只报告并轮换，不改写                                     |

## 11. 风险与缓解

- **全量 i18n 改造范围大**：按模块分批迁移，靠 key 一致性与硬编码扫描持续收敛；老页面在完成前不允许合并进本阶段。
- **E2E 不稳定**：唯一数据、role/testid 选择器、仅 Chromium、失败重试 1 次并保留 trace。
- **英文文案质量**：由实现者统一翻译并过一遍页面；不追求营销级文案，只要求准确、一致。
- **历史审计发现密钥**：只报告并建议轮换，不擅自重写历史；若用户后续决定重写，另立任务。
- **Docker 镜像体积与构建时间**：多阶段复用依赖层，`next` standalone 只拷贝运行必需文件；CI 仅构建不推送。
