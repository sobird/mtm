# mtm

开源电商运营后台：面向商家的自助运营门户与面向平台运营人员的运营端，两个门户共享一套权限模型、商品数据与审核流程，后端由独立的 `core-api` 核心服务提供。

- 商家后台 `apps/merchant-admin`：商品创建、版本化编辑、提交审核、发布/下线，店铺资料、营销、账号与角色管理。
- 运营端 `apps/ops-admin`：类目、品牌、商家与商品只读视图，商品审核，账号与角色管理。
- 核心服务 `apps/core-api`：商品、类目、品牌、商家、审核与上传等业务接口。

> 功能截图占位：待补充商家后台商品管理与运营端审核工作台的截图。

## 功能概览

- **两个独立门户**：商家端与运营端各自登录、各自会话、各自角色，界面通过共享壳层保持一致。
- **商品版本化与审核流**：草稿 → 提交审核 → 通过/驳回 → 发布/下线；已进入审核的版本不可变，编辑已提交或已驳回商品会创建新版本。
- **类目、品牌与图片上传**：类目树 CRUD、品牌 CRUD；品牌图片经本地 `StorageAdapter` 存储，仅接受 PNG / JPEG / WEBP。
- **RBAC 权限体系**：权限码集中定义，菜单按权限过滤，页面守卫跳转 `/403`，业务接口按权限码校验。
- **操作日志**：商品与审核动作同时写入核心日志和门户日志，覆盖创建、编辑、提交、发布、下线、删除、通过、驳回。
- **中英双语**：默认中文，支持英文，可在界面切换。
- **商家历史模块**：店铺资料、营销、优惠券、数据看板等原有商家功能保留在 `apps/merchant-admin`。

## 架构

浏览器只访问两个 Next.js 门户。门户内的 BFF（`app/api/bff/[...path]`）负责鉴权与转发，业务请求统一进入 `core-api`，再由 `core-api` 访问 `commerce_core` 数据库。两个门户同时各自使用 Prisma 访问自己的数据库，用于认证、角色、菜单和门户侧操作日志。

```text
merchant-admin (3000) ─ app/api/bff/[...path] ─┐
                                               ├─> core-api (4000) ─> commerce_core
ops-admin      (3001) ─ app/api/bff/[...path] ─┘

merchant-admin ─ Prisma ─> commerce_merchant
ops-admin      ─ Prisma ─> commerce_ops
```

- 三个数据库共用一个 PostgreSQL 实例，库名分别为 `commerce_core`、`commerce_merchant`、`commerce_ops`；测试库为对应的 `*_test` 库。
- 跨库只通过 ID 引用，不建立跨库外键。
- 两个门户使用 Auth.js v5 的 JWT 会话，Cookie 分别为 `merchant.session` 与 `ops.session`，密钥分别为 `AUTH_SECRET` 与 `OPS_AUTH_SECRET`。
- 门户 BFF 调用 `core-api` 前会签发 60 秒有效期的服务间 JWT（`CORE_API_JWT_SECRET`），`core-api` 校验签名、门户与权限声明后再处理请求。

### 操作日志

| action            | 触发场景               |
| ----------------- | ---------------------- |
| `product.create`  | 商家创建商品           |
| `product.update`  | 商家编辑商品并生成版本 |
| `product.submit`  | 商家提交商品审核       |
| `product.publish` | 商家发布商品           |
| `product.offline` | 商家下线商品           |
| `product.delete`  | 商家删除商品           |
| `audit.approve`   | 运营人员审核通过       |
| `audit.reject`    | 运营人员审核驳回       |

核心日志与业务写入处于同一数据库事务，业务失败时日志一并回滚（fail-closed）。门户 BFF 日志在业务成功后写入，写入失败不会阻断主流程（fail-open）。

## 技术栈

- **运行时与构建**：Bun 1.4.4 workspaces、Turborepo
- **前端**：Next.js 15 App Router、React 19、TypeScript
- **UI**：antd 6 封装在 `@/components/ui` / `@mtm/ui` 内，业务页面只使用共享封装层
- **状态与表单**：TanStack Query、Zustand、React Hook Form + Zod
- **后端**：Hono 4 + Zod + `@hono/zod-openapi`
- **数据层**：PostgreSQL 17 + Prisma
- **认证**：Auth.js v5 (JWT)、`jose`、`@node-rs/argon2`
- **国际化**：next-intl，消息集中在 `packages/i18n`
- **测试与质量**：Vitest + Testing Library、Playwright、oxlint、oxfmt、`tsc --noEmit`

## 目录结构

```text
apps/
  merchant-admin/   # 商家后台（Next.js，端口 3000）
  ops-admin/        # 运营端（Next.js，端口 3001）
  core-api/         # 核心服务（Hono，端口 4000）
packages/
  contracts/        # 权限码与跨端共享类型
  auth/             # 密码哈希、限流、服务间 JWT、菜单过滤
  ui/               # 共享壳层与 UI 封装
  i18n/             # zh-CN / en-US 消息与语言工具
  config/           # 共享 tsconfig、oxlint、oxfmt 配置
scripts/            # 仓库级脚本（开发引导、i18n 检查等）
deploy/             # 自托管部署配置
Dockerfile
docker-compose.yml
```

## 快速开始

前置要求：

- Bun 1.4.4（由 `packageManager` 与 `.bun-version` 固定）
- Docker（`bun run dev` 通过 Docker Compose 启动本地 PostgreSQL）
- Node.js 22（Next.js 运行时）

```bash
bun install
cp .env.example .env
bun run dev
```

`bun run dev` 会启动 PostgreSQL、创建三个业务库、执行 Prisma generate / migrate / seed，然后并行启动三个应用：

| 应用     | 地址                         |
| -------- | ---------------------------- |
| 商家后台 | http://localhost:3000        |
| 运营端   | http://localhost:3001        |
| 核心服务 | http://localhost:4000        |
| 健康检查 | http://localhost:4000/health |

## 演示账号

以下账号仅用于本地演示，生产环境必须全部更换密码，并替换所有 `change-me*` 占位密钥。

| 门户       | 账号                   | 密码 / 登录方式  |
| ---------- | ---------------------- | ---------------- |
| 运营端     | `admin`                | `admin123`       |
| 商家主账号 | `merchant@example.com` | `merchant123`    |
| 商家主账号 | 手机号 `13412345678`   | 登录页图形验证码 |
| 商家子账号 | `staff@example.com`    | `staff123`       |

图形验证码仅用于本地演示；生产环境应关闭验证码或接入短信服务。

## 常用脚本

| 命令                      | 说明                                          |
| ------------------------- | --------------------------------------------- |
| `bun run dev`             | 启动 PostgreSQL、迁移、种子数据并运行所有应用 |
| `bun run db:migrate`      | 启动 PostgreSQL、创建数据库并应用迁移         |
| `bun run db:seed`         | 写入种子数据                                  |
| `bun run db:reset`        | 重置三个业务库并重新迁移、写入种子数据        |
| `bun run lint`            | oxlint 静态检查                               |
| `bun run fmt:check`       | oxfmt 格式检查                                |
| `bun run typecheck`       | `tsc --noEmit` 类型检查                       |
| `bun run test`            | 运行 Vitest 单元与组件测试                    |
| `bun run build`           | 构建所有应用                                  |
| `bun run check:i18n`      | 检查 i18n key 一致性与硬编码文案              |
| `bun run check:sensitive` | 扫描敏感信息                                  |
| `bun run e2e:bootstrap`   | 准备 E2E 数据库                               |
| `bun run test:e2e`        | 运行 Playwright E2E 测试                      |
| `bun run docker:up`       | 启动 Docker Compose 自托管栈                  |

E2E 首次运行需要依次准备数据库、构建并运行测试：`bun run e2e:bootstrap && bun run build && bun run test:e2e`；Playwright 使用 `next start` 启动生产服务器。

## Docker 自托管

仓库提供 `Dockerfile`、`docker-compose.yml` 与 `deploy/` 配置，可用一条命令启动完整栈：

```bash
bun run docker:up
```

首次运行会生成 `.env.docker`（包含随机生成的 `AUTH_SECRET`、`OPS_AUTH_SECRET`、`CORE_API_JWT_SECRET`，已加入 `.gitignore`，权限为 `0600`），随后启动 PostgreSQL 并完成迁移与种子数据，再启动核心服务、商家后台与运营端。首次构建镜像建议预留约 10 GB 可用磁盘空间。

启动后：

- 商家后台：http://localhost:3000
- 运营端：http://localhost:3001
- 核心服务：http://localhost:4000（健康检查 `/health`）

`SEED_DEMO_DATA` 控制是否写入演示数据，仅在本地或演示环境开启，生产环境应保持关闭。HTTP 自托管时 `.env.docker` 默认写入 `AUTH_COOKIE_SECURE=false`；未显式设置时该值跟随 `NODE_ENV`，生产环境默认启用 Secure Cookie。

生产部署要求：

- 在反向代理或负载均衡层启用 TLS，只暴露必要的 HTTP 端口。
- Docker 自托管时删除 `.env.docker` 中的 `AUTH_COOKIE_SECURE=false`；源码直接运行时删除 `.env` 中的同名设置，恢复其默认值（跟随 `NODE_ENV`，生产环境自动启用 Secure Cookie）。
- 将 `AUTH_SECRET`、`OPS_AUTH_SECRET`、`CORE_API_JWT_SECRET` 全部替换为高强度随机值。
- 更换所有演示账号密码，关闭演示验证码或接入短信服务。
- 不要将 PostgreSQL 端口暴露到公网；持久化数据库与上传目录并纳入备份。

## 国际化

- 默认语言为 `zh-CN`，同时支持 `en-US`。
- 语言选择保存在 `NEXT_LOCALE` Cookie 中，URL 不带语言前缀。
- 消息文件位于 `packages/i18n/messages/zh-CN.json` 与 `en-US.json`。
- 新增界面文案时必须同时补齐两种语言，并运行 `bun run check:i18n`。

## 环境变量

参考 `.env.example`。主要变量：

| 变量                                                                              | 说明                                                  |
| --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `MERCHANT_DATABASE_URL` / `OPS_DATABASE_URL` / `CORE_DATABASE_URL`                | 三个业务库连接串                                      |
| `MERCHANT_TEST_DATABASE_URL` / `OPS_TEST_DATABASE_URL` / `CORE_TEST_DATABASE_URL` | 测试库连接串，禁止指向开发数据                        |
| `AUTH_SECRET` / `OPS_AUTH_SECRET`                                                 | 两个门户独立的会话密钥                                |
| `CORE_API_JWT_SECRET`                                                             | 门户调用 `core-api` 的 60 秒服务间 JWT 密钥           |
| `CORE_API_URL`                                                                    | 门户访问 `core-api` 的基地址                          |
| `CORE_PUBLIC_URL`                                                                 | 上传文件的公开访问基地址                              |
| `UPLOAD_DIR` / `UPLOAD_MAX_BYTES`                                                 | 本地上传目录与单文件大小上限                          |
| `AUTH_COOKIE_SECURE`                                                              | 可选；默认跟随 `NODE_ENV`，仅 HTTP 演示可设为 `false` |
| `SEED_DEMO_DATA`                                                                  | 仅 Docker Compose 使用，控制是否写入演示数据          |

## 参与贡献

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。安全问题请按 [SECURITY.md](SECURITY.md) 私密报告，不要公开提交 Issue。

## 许可协议

本项目使用 MIT 许可证，版权人见 [LICENSE](LICENSE)。
