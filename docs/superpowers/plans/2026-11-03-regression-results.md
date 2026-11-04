# 迁移回归结果（2026-11-03）

本次执行只记录实际运行结果。HTTP / smoke 检查针对 standalone 生产构建运行；浏览器交互检查通过 Playwright 对同一构建执行，结果见“浏览器回归”一节。

## 执行环境

- 分支：`feat/nextjs-migration`
- 构建：`bun run build`（Next 15.5.28，`output: 'standalone'`）
- 启动方式：`node .next/standalone/server.js`（`next start` 对 standalone 构建不适用，未尝试）
- 启动命令：
  ```bash
  for p in sqlite3 bindings file-uri-to-path node-addon-api; do
    rm -rf ".next/standalone/node_modules/$p"
    cp -R "node_modules/$p" ".next/standalone/node_modules/$p"
  done
  NODE_ENV=production DATABASE_PATH="$(pwd)/data/smoke.sqlite" AUTH_SECRET=test-secret PORT=3000 \
    node .next/standalone/server.js
  ```
- Smoke：`AUTH_SECRET=test-secret bun run smoke`
- 说明：standalone `server.js` 会把 cwd 切到 `.next/standalone`，因此 `DATABASE_PATH` 必须使用绝对路径，否则服务端与 smoke 脚本会指向不同文件。
- 浏览器回归：Playwright 访问 `http://localhost:3000`，使用 `data/e2e.sqlite`。启动前需把 `.next/static` 与 `public` 复制进 `.next/standalone`（Dockerfile 已包含该步骤，手工运行 standalone 时不会自动复制），否则 `/_next/static/*` 全部 404。

## Smoke 输出（退出码 0）

```text
$ bun scripts/smoke.ts
Smoke target: http://localhost:3000
Smoke database: <repo>/data/smoke.sqlite

PASS  GET /api/health  —  200, db=true
PASS  GET /login (anonymous)  —  status 200
PASS  GET /settleinjx/company (anonymous)  —  status 200
PASS  GET /settleinjx/shop (anonymous)  —  status 200
PASS  GET /settleinjx/home (anonymous)  —  status 200
PASS  GET /settleinpc (anonymous)  —  status 200
PASS  GET /register/success (anonymous)  —  status 200
PASS  GET /register (anonymous)  —  status 200
PASS  GET / (anonymous)  —  status 307 -> /login?callbackUrl=%2F
PASS  GET /market/coupons (anonymous)  —  status 307 -> /login?callbackUrl=%2Fmarket%2Fcoupons
PASS  GET / (authenticated)  —  status 200
PASS  GET /shop/profile/principal (authenticated)  —  status 200
PASS  GET /shop/profile/settlement (authenticated)  —  status 200
PASS  GET /market/coupon/create?target=1 (authenticated)  —  status 200
PASS  GET /market/coupons (authenticated)  —  status 200
PASS  GET /shop/profile/license (authenticated)  —  status 200
PASS  GET /shop/profile (authenticated)  —  status 200
PASS  GET /shop/trademark (authenticated)  —  status 200
PASS  GET /market/home (authenticated)  —  status 200
PASS  GET /shop/admin (authenticated)  —  status 200
PASS  GET /shop/profile/wallet (authenticated)  —  status 200
PASS  GET /setting (authenticated)  —  status 200
PASS  GET /market (authenticated)  —  status 307 -> /market/home
PASS  GET /api/merchant/coupon (anonymous)  —  status 401, code UNAUTHORIZED
PASS  POST /api/merchant/coupon  —  status 200, code 0, id 1793684042590
PASS  GET /api/merchant/coupon (created coupon present)  —  status 200, found true
PASS  GET /api/merchant/coupon/1793684042590  —  status 200, code 0
PASS  DELETE /api/merchant/coupon/1793684042590  —  status 200, coupon status 6
PASS  GET /market/coupon/1793684042590 (authenticated)  —  status 200
PASS  GET /market/coupon/update/1793684042590 (authenticated)  —  status 200

All smoke checks passed.
```

覆盖的路由集合：公开 `/login`、`/register`、`/register/success`、`/settleinpc`、`/settleinjx/{home,shop,company}`；受保护 `/`、`/market/coupons`、`/market/home`、`/market/coupon/create?target=1`、`/setting`、`/shop/admin`、`/shop/trademark`、`/shop/profile`、`/shop/profile/{principal,license,wallet,settlement}`；`/market` 断言为重定向 `/market/home`；创建券后的 `/market/coupon/[id]` 与 `/market/coupon/update/[id]`。

## HTML 内容标记检查（fetch，非浏览器）

服务端渲染 HTML 中均返回 200 且包含预期文案：

| 页面                             | 状态 | 命中标记                                                                                                                     |
| -------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/`                              | 200  | 经营概览、最新动态、订单概况、实时数据、商品管理、资金管理、金牌商家、营销活动、违规情况、经营趋势（9 个 DashboardGridItem） |
| `/setting`                       | 200  | 账户设置                                                                                                                     |
| `/shop/admin`                    | 200  | 店铺管理员                                                                                                                   |
| `/shop/trademark`                | 200  | 商标管理                                                                                                                     |
| `/shop/profile`                  | 200  | 基本信息                                                                                                                     |
| `/shop/profile/principal`        | 200  | 主体信息（页面外壳；法人信息由客户端请求后渲染，SSR HTML 为 Skeleton）                                                       |
| `/shop/profile/license`          | 200  | 许可证列表                                                                                                                   |
| `/shop/profile/wallet`           | 200  | 钱包余额                                                                                                                     |
| `/shop/profile/settlement`       | 200  | 结算费率                                                                                                                     |
| `/market/coupons`                | 200  | 优惠券                                                                                                                       |
| `/market/home`                   | 200  | 营销中心                                                                                                                     |
| `/market/coupon/create?target=1` | 200  | 创建优惠券                                                                                                                   |
| `/login`                         | 200  | 登录                                                                                                                         |
| `/register`                      | 200  | 注册                                                                                                                         |
| `/register/success`              | 200  | 注册                                                                                                                         |
| `/settleinpc`                    | 200  | 入驻                                                                                                                         |
| `/settleinjx/home`               | 200  | 入驻                                                                                                                         |
| `/settleinjx/shop`               | 200  | 入驻                                                                                                                         |
| `/settleinjx/company`            | 200  | 入驻                                                                                                                         |

## 手工检查项

| 项目                                                            | 结果                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 登录（区号 86/852）                                             | 已执行（浏览器）：86 使用种子账号 `13412345678`，852 使用新号码 `61234567`（自动建号）均登录成功；验证码从页面 toast 读取。65/853 共用同一校验与登录路径，仅区号正则不同，已有单元测试覆盖。                                                         |
| 登录后退出                                                      | 已执行（浏览器）：退出后跳转 `http://localhost:3000/login`（修复前会跳转到 standalone 的绑定地址 `http://0.0.0.0:3000/login`）。                                                                                                                     |
| 首页 9 个仪表盘区块                                             | 已执行（HTML 标记 + 浏览器渲染）：9 个区块标题均出现；首页“活动”页签切换正常，报名中/我报名的列表内容不同。                                                                                                                                          |
| `/setting`、`/shop/admin`、`/shop/trademark`、`/shop/profile/*` | 已执行（HTTP 200 + HTML 标记 + 浏览器渲染）：页面骨架、表单、证照/钱包/结算数据均显示；控制台无 hydration 报错。                                                                                                                                     |
| 入驻 4 个页面                                                   | 已执行（HTTP 200 + HTML 标记）。                                                                                                                                                                                                                     |
| `/market/*` 优惠券全流程                                        | 已执行（浏览器 UI 全流程）：创建（类型选择弹窗 → 表单 → 提交）→ 列表出现新券 → 详情页字段正确 → 编辑改名 → 列表已更新 → 下线确认弹窗 → 状态变为“已下线”。另有 API 层创建/列表/详情/下线 smoke 覆盖。                                                 |
| 容器重启后数据保留                                              | Docker 守护进程不可用，未执行容器重启。改为执行独立服务进程重启：停止并重新启动 `node .next/standalone/server.js`，复用同一 `data/smoke.sqlite`；重启后 `GET /api/merchant/coupon/1793684042590` 仍返回 `status: 6`，`/api/health` 返回 `db: true`。 |
| 控制台无 hydration 错误                                         | 已执行（浏览器）：全部页面仅出现侧栏未迁移链接的 RSC 预取 404（`_rsc=` 请求），无 hydration / React 报错；早期 `/_next/static/*` 404 系手工运行 standalone 未复制静态资源所致，复制后消失。                                                          |
| 浏览器分页                                                      | 已执行（浏览器）：优惠券列表显示 11 条总量、每页 10 条、“第 1 / 2 页”分页。                                                                                                                                                                          |

服务进程重启后数据保留的实测片段：

```json
{"code":0,"message":"ok","data":{"id":"1793684042590","name":"回归测试券","status":6,...}}
{"code":0,"message":"ok","data":{"db":true}}
```

## 浏览器回归

对 standalone 生产构建（`NODE_ENV=production`、`data/e2e.sqlite`）执行：

1. `/login` 登录（86，演示账号）→ 跳转 `/`；首页仪表盘、活动页签（报名中 4 条 / 我报名的 2 条）渲染正常。
2. `/market/coupons`：11 条种子数据、每页 10 条、分页“第 1 / 2 页”。
3. 创建优惠券：`创建优惠券` → 类型弹窗（默认选中店铺客服体验券）→ `/market/coupon/create?target=3` 表单（名称、发放时段 datetime-local、张数、门槛/面额）→ 提交回到列表，新券出现。
4. 详情 `/market/coupon/1793686062866`：类型、名称、发放时间、张数 20、满 100 减 15、每人限领 1 张、使用时间与创建日期均正确。
5. 编辑 `/market/coupon/update/1793686062866`：表单预填正确，改名提交后列表同步更新。
6. 下线：确认弹窗 → 状态变为“已下线”，操作列仅剩“查看”。
7. `/setting`、`/shop/admin`、`/shop/trademark`、`/shop/profile`、`/shop/profile/{principal,license,wallet,settlement}` 均正常渲染。
8. 退出登录后跳转 `/login`（见“本次顺带修复”）。
9. 控制台无 hydration 错误；仅有未迁移侧栏链接的 RSC 预取 404。

## 全量校验

```bash
bun run lint && bun run typecheck && bun run test && bun run build
```

- lint：通过（仅既有 warning：`jsx-a11y`、`no-console`；无 error）。
- typecheck：通过。
- test：20 个测试文件、64 个用例全部通过。
- build：通过（Next 15.5.28）。

## 本次顺带修复

- `lib/auth.config.ts`：新增 `redirect` 回调，回调地址保持相对路径。standalone 服务把请求 URL 的 origin 解析为绑定地址（`0.0.0.0`），此前退出登录会被重定向到 `http://0.0.0.0:3000/login`；现返回 `/login`，由浏览器按当前 origin 解析。同时拒绝 `//host`、`/\\host` 与外部绝对地址，避免开放重定向。`tests/lib/auth-config.test.ts` 覆盖上述分支。
- `docker-compose.yml` / `README.asciidoc`：镜像名与 `deploy.yml` 由 `GITHUB_REPOSITORY` 推导出的 `ghcr.io/<owner>/mtm` 对齐（仓库地址以远端配置为准，旧地址仅作重定向）。
- `lib/db/connection.ts`：把创建 SQLite 目录的 `mkdirSync` 从模块导入期移到 `beforeConnect` 钩子。`next build` 在 “Collecting page data” 阶段导入 DB 模块时，不再尝试创建 `.env.production` 中的 `/data`。
- `app/(entry)/layout.tsx`：标记 `dynamic = 'force-dynamic'`。该 layout 会 `initDatabase()`，构建时不应被预渲染（此前 `/settleinjx/company` 预渲染触发 `/data` 创建失败）。
- `vitest.config.ts`：移除无效的 `css.postcss` 兼容配置。
- `.env.development`：移除已无代码读取的 `baseURL` / `MICRO_MTM_MARKET_URL` / `EPASSPORT_*` 变量。

## CI

新增 `.github/workflows/ci.yml`：在 `pull_request` 上运行 `bun install --frozen-lockfile`、lint、typecheck、test、build。`deploy.yml` 仅在 push `master` 时触发，因此 PR 之前没有检查。
