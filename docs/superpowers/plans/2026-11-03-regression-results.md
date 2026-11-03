# 迁移回归结果（2026-11-03）

本次执行只记录实际运行结果。浏览器交互类检查（登录验证码、hydration 控制台、视觉布局）在当前环境无法自动化，均标记为“未执行”，未以其他方式宣称通过。

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

## Smoke 输出（退出码 0）

```text
$ bun scripts/smoke.ts
Smoke target: http://localhost:3000
Smoke database: /Users/sobird/mtm/data/smoke.sqlite

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
| 登录（区号 86/65/852/853）                                      | 未执行。验证码 + 浏览器交互无法在此环境自动化；种子仅包含一个演示账号（`13412345678`，`interCode=86`）。                                                                                                                                             |
| 首页 9 个仪表盘区块                                             | 已执行（HTML 标记）：9 个区块标题均出现。                                                                                                                                                                                                            |
| `/setting`、`/shop/admin`、`/shop/trademark`、`/shop/profile/*` | 已执行（HTTP 200 + HTML 标记）。                                                                                                                                                                                                                     |
| 入驻 4 个页面                                                   | 已执行（HTTP 200 + HTML 标记）。                                                                                                                                                                                                                     |
| `/market/*` 优惠券全流程                                        | 已执行（API 创建/列表/详情/下线 + 页面 200）。                                                                                                                                                                                                       |
| 容器重启后数据保留                                              | Docker 守护进程不可用，未执行容器重启。改为执行独立服务进程重启：停止并重新启动 `node .next/standalone/server.js`，复用同一 `data/smoke.sqlite`；重启后 `GET /api/merchant/coupon/1793684042590` 仍返回 `status: 6`，`/api/health` 返回 `db: true`。 |
| 控制台无 hydration 错误                                         | 未执行。无浏览器自动化，fetch 无法观察 hydration/console。                                                                                                                                                                                           |

服务进程重启后数据保留的实测片段：

```json
{"code":0,"message":"ok","data":{"id":"1793684042590","name":"回归测试券","status":6,...}}
{"code":0,"message":"ok","data":{"db":true}}
```

## 全量校验

```bash
bun run lint && bun run typecheck && bun run test && bun run build
```

- lint：通过（仅既有 warning：2 处 `jsx-a11y`、`no-console`；无 error）。
- typecheck：通过。
- test：18 个测试文件、55 个用例全部通过。
- build：通过（Next 15.5.28）。

## 本次顺带修复

- `lib/db/connection.ts`：把创建 SQLite 目录的 `mkdirSync` 从模块导入期移到 `beforeConnect` 钩子。`next build` 在 “Collecting page data” 阶段导入 DB 模块时，不再尝试创建 `.env.production` 中的 `/data`。
- `app/(entry)/layout.tsx`：标记 `dynamic = 'force-dynamic'`。该 layout 会 `initDatabase()`，构建时不应被预渲染（此前 `/settleinjx/company` 预渲染触发 `/data` 创建失败）。
- `vitest.config.ts`：移除无效的 `css.postcss` 兼容配置。
- `.env.development`：移除已无代码读取的 `baseURL` / `MICRO_MTM_MARKET_URL` / `EPASSPORT_*` 变量。
