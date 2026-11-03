# Next.js 全量迁移设计（主应用 + mtm_market 合并，移除微前端）

- 日期：2026-11-03
- 状态：待审批
- 范围：整个仓库（`src/`、`packages/mtm_market`、`packages/shared`）

## 1. 背景与意图

当前仓库是两套 webpack 应用：

- 主应用（`src/`）承载登录、注册、入驻、店铺资料、设置等页面。
- `packages/mtm_market` 通过 qiankun 挂载在 `#/market`，同时通过 Module Federation 向主应用首页暴露 9 个仪表盘组件。
- 两边靠 `window.mtm`（React/ReactDOM/Antd/ProComponents/Icons 运行时直传）、共享 store/history、重复主题配置来协作；`packages/shared` 同时承担 HTTP 封装和跨应用运行时。

存在的实际问题：

1. 构建慢：webpack + 两套应用 + shared 预构建 + Module Federation。
2. 工程复杂度高：qiankun 生命周期、externals 映射、`window.__POWERED_BY_QIANKUN__` 分支、独立 React root（`federated-adapter`）、双份 CI/VPS 部署。
3. 依赖陈旧且耦合：React 18、Antd 5 主题体系、Redux Toolkit、客户端自行签发 JWT。
4. 接口层完全靠请求拦截器把 URL 改写成 `/api/**.json` 静态文件，只适合演示，无法承载数据读写。

目标不是“再加一层 Next 包装”，而是**用一次重写把主应用和 market 合并为一个 Next.js App Router 应用**，并同步完成 UI 体系与接口层的替换。

## 2. 目标

1. 单仓库、单应用、单次构建：所有页面路由由同一个 Next.js 应用提供。
2. 彻底移除微前端：qiankun、Module Federation、`externals`、`window.mtm`、`packages/shared` 运行时、`federated-adapter` 全部删除。
3. 移除 Antd 5 体系：`@ant-design/pro-components`、`@ant-design/icons`、`@ant-design/charts` 不再使用。antd 6 仅作为 `components/ui` 封装层的内部实现（见第 18 节修订）。
4. 页面统一使用 `components/ui`；封装层内部可用 headless UI 或 antd，保留现有视觉语言和交互。
5. 用 Next Route Handlers + Sequelize + SQLite 重建接口层；现有 mock JSON 转为种子数据。
6. 用 NextAuth（Auth.js）Credentials + JWT 会话替换客户端 `jose` 签发 token。
7. 用 Docker（容器 + volume）部署，SQLite 文件持久化。
8. 保留主应用与 mtm_market 的现有业务页面与流程，路径改为真实路径（`/login`、`/market/...`）。

## 3. 非目标与反目标

非目标：

- 不做 hash 路由兼容，不保留旧 URL（`/#/market/...`）重定向。
- 不接真实后端；本地数据层即“后端”，行为以现有 mock JSON 为准。
- 不新增多租户、细粒度 RBAC、审计日志等能力。
- 不做深色模式、主题切换器（当前没有，不在此次扩展）。
- 不迁移纯演示页：`/mdx`、`/component` 删除（它们是组件/MDX 试玩页，不属于业务功能）。
- 不保留 Redux Toolkit、React Router、Axios 依赖。

反目标（即使能跑起来也算失败）：

- 重新引入第二套应用边界（iframe、微前端、多 zone、Module Federation）。
- 让组件库样式散落到页面代码，形成不可控的黑盒样式。组件库只能出现在 `components/ui`，主题令牌集中在 `app/providers.tsx`。
- 为了“渐进迁移”长期保留两套 UI/两套路由/两套数据层。

## 4. 约束

- 包管理器保持 bun（`bun@1.4.4`），锁文件为 `bun.lock`。
- Next.js App Router，Node.js 运行时（不使用静态导出）。
- 生产容器 Node 22 LTS；本地 Node 24 可用。
- 业务样式只用 CSS Modules + 全局 CSS 变量；不引入 Tailwind。antd 的 CSS-in-JS 只存在于 `components/ui` 封装层内部。
- TypeScript 严格度沿用现状（`strict: false`），不借迁移扩大范围。
- 现有 UI 文案、字段、页面结构尽量保持一致；允许组件内部实现变化。
- 所有页面默认中文，日期/金额格式沿用 `dayjs`、`numeral`。
- React 组件名与文件名使用 PascalCase；单文件组件目录与组件同名，入口可用 `index.tsx`；CSS Module 与组件同名（`Component.module.css`）。
- 单实例部署：SQLite 不支持多副本并发写。

## 5. 目标目录结构

```
app/
  layout.tsx                     # 根布局：字体、全局样式、Providers
  providers.tsx                  # TanStack Query / Session / Toast（client）
  (auth)/
    login/page.tsx
    register/page.tsx
    register/success/page.tsx
  (entry)/
    settleinpc/page.tsx
    settleinjx/home/page.tsx
    settleinjx/shop/page.tsx
    settleinjx/company/page.tsx
  (admin)/
    layout.tsx                   # 管理端壳：侧边菜单、顶栏、面包屑
    page.tsx                     # 首页仪表盘（原 Home + market remotes）
    setting/page.tsx
    shop/admin/page.tsx
    shop/trademark/page.tsx
    shop/profile/layout.tsx
    shop/profile/page.tsx
    shop/profile/principal/page.tsx
    shop/profile/license/page.tsx
    shop/profile/wallet/page.tsx
    shop/profile/settlement/page.tsx
    market/layout.tsx
    market/page.tsx              # market 首页
    market/home/page.tsx
    market/coupons/page.tsx
    market/coupon/create/page.tsx
    market/coupon/[id]/page.tsx
    market/coupon/update/[id]/page.tsx
  api/...                        # Route Handlers，见第 7 节
  globals.css
  not-found.tsx
components/
  ui/                            # headless 基础组件 + CSS Modules
  layout/                        # AdminShell、Sidebar、Header、PageContainer
  admin/                         # 业务组件（OCR 上传、签约、证件字段等）
  market/                        # 从 mtm_market 迁入的页面与仪表盘组件
lib/
  db/                            # Sequelize 实例、模型、关联
  db/models/
  db/seed/                       # 种子数据（从两份 public/api 复制）
  services/                      # 服务层：RSC 与 Route Handler 共用
  auth.ts                        # NextAuth 配置
  auth-guard.ts                  # RSC/Handler 取会话与鉴权
  api-response.ts                # 统一响应封装
  validation/                    # Zod schema
  query-keys.ts
stores/                          # Zustand UI 状态
styles/
  tokens.css                     # 设计变量
  reset.css
types/
public/
  assets/
Dockerfile
docker-compose.yml
```

路由组 `(auth)`、`(entry)`、`(admin)` 不影响 URL。

## 6. 路由映射

| 旧路径                       | 新路径                      | 来源                                   |
| ---------------------------- | --------------------------- | -------------------------------------- |
| `/`                          | `/`                         | `src/pages/home` + market 9 个 remotes |
| `/setting`（默认 profile）   | `/setting`                  | `src/pages/setting`                    |
| `/shop/admin`                | `/shop/admin`               | `src/pages/shop/admin`                 |
| `/shop/trademark`            | `/shop/trademark`           | `src/pages/shop/trademark`             |
| `/shop/profile`              | `/shop/profile`             | `src/pages/shop/profile/base-info`     |
| `/shop/profile/principal`    | `/shop/profile/principal`   | 同名                                   |
| `/shop/profile/license`      | `/shop/profile/license`     | 同名                                   |
| `/shop/profile/wallet`       | `/shop/profile/wallet`      | 同名                                   |
| `/shop/profile/settlement`   | `/shop/profile/settlement`  | 同名                                   |
| `/login`                     | `/login`                    | `src/pages/login`                      |
| `/register`                  | `/register`                 | `src/pages/register`                   |
| `/register/success`          | `/register/success`         | `src/pages/register/success`           |
| `/settleinpc`                | `/settleinpc`               | 同名                                   |
| `/settleinjx/home`           | `/settleinjx/home`          | 同名                                   |
| `/settleinjx/shop`           | `/settleinjx/shop`          | 同名                                   |
| `/settleinjx/company`        | `/settleinjx/company`       | 同名                                   |
| `#/market` / `#/market/home` | `/market`、`/market/home`   | market `pages/home`                    |
| `#/market/coupons`           | `/market/coupons`           | market `pages/coupon`                  |
| `#/market/coupon/create`     | `/market/coupon/create`     | market `pages/coupon/create`           |
| `#/market/coupon/:id`        | `/market/coupon/:id`        | market `pages/coupon/detail`           |
| `#/market/coupon/update/:id` | `/market/coupon/update/:id` | market `pages/coupon/update`           |
| `/mdx`、`/component`         | 删除                        | 演示页                                 |

主应用首页原本通过 `React.lazy(() => import('market/...'))` 加载的 9 个组件改为直接 `import`：

`workbench`、`market-activity`、`trending-chart`、`violations`、`fund-manage`、`gold-merchant`、`latest-news`、`merchant-growth`、`product-manage`。

## 7. 数据层（Sequelize + SQLite）

### 7.1 连接与初始化

- 驱动：Sequelize v6 官方支持的 `sqlite3`（使用其预编译二进制，避免 `better-sqlite3` 与 Sequelize 方言适配的不确定性）。
- 数据库文件：`process.env.DATABASE_PATH`，默认 `./data/mtm.sqlite`；生产为 `/data/mtm.sqlite`（volume）。
- `lib/db/index.ts` 导出单例 Sequelize；开发环境挂到 `globalThis` 避免 HMR 重复连接。
- 启动时执行 `sequelize.sync()`，随后执行幂等种子（用 `SeedMeta` 表记录已执行版本）。
- 不引入迁移框架：这是单实例、演示性质的数据层；schema 变更通过 seed 版本 + 重建卷处理。文档中明确记录该限制。

### 7.2 模型

业务实体（关系型）：

| 模型               | 关键字段                                                                 | 数据来源                                                 |
| ------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `Account`          | id, login, mobile, interCode, merchantId                                 | `account/get`、登录                                      |
| `Merchant`         | id, name, status, type, contact, address                                 | `merchant/detail`、`merchant/list`                       |
| `MerchantCategory` | id, parentId, name, level                                                | `merchant/category`                                      |
| `MerchantLicense`  | id, merchantId, type, name, url, status, expireAt                        | `merchant/licenses`                                      |
| `MerchantEntry`    | merchantId, step, status, payload                                        | `merchant/entry`（GET/PATCH）                            |
| `EntryTask`        | id, merchantId, bizType, localCommerce, status                           | `merchant/entry/task`                                    |
| `EntryType`        | code, name, templateUrl, payload                                         | `merchant/entry/type`、`/templateUrl`                    |
| `MenuItem`         | id, parentId, title, icon, url, level, sortIndex, toolMenu, auth, code   | `menu/get`                                               |
| `MenuBadge`        | menuId, noticeStyle, noticeContent                                       | `menu/badges`                                            |
| `MenuPreference`   | accountId, menuId, visible, sortIndex                                    | `menu/patch`                                             |
| `MenuFavorite`     | accountId, menuId, sortIndex                                             | `menu/get` 的 `favorites`、`menu/patch`                  |
| `Coupon`           | id, name, displayName, type, target, rule, stock, limit, timings, status | market `merchant/coupon/*`                               |
| `Campaign`         | id, name, type, apply/start/end times, statuses, stock, intro, cover     | market `merchant/campaigns`                              |
| `Message`          | id, type, title, content, publishTime, duration, noticeStyle, actions    | market `message/*`                                       |
| `Violation`        | issueId, merchantId, category, type, dates, states, contents             | market `violation/overview`                              |
| `Product`          | id, poiId, name, status, stock, minPrice, skuCount                       | market `product/selling`                                 |
| `GoldPeriod`       | id, status, startTime, endTime                                           | market `merchant/gold`                                   |
| `GoldStandard`     | id, periodId, key, name, desc, progress, url, qualified                  | market `merchant/gold`                                   |
| `MerchantTask`     | id, merchantId, title, desc, status, reward                              | market `merchant/task/list`                              |
| `Registration`     | mobile, status, createdAt                                                | `register/post`                                          |
| `Invitation`       | code, mobile, usedAt                                                     | `invitation/post`                                        |
| `ReferenceData`    | key (unique), payload (JSON)                                             | `merchant/options`（117KB）、`venus/sign` 等大块静态数据 |
| `AnalysisSnapshot` | key (`workbench`/`trending`/`operation`), period, payload (JSON)         | market `analysis/*`                                      |
| `SeedMeta`         | version, appliedAt                                                       | 种子幂等控制                                             |

说明：

- `Coupon` 用一张“超集”表承载列表与详情两套 schema：列表用的是 `price/discount/leftCount/useTerm`，详情用的是 `rule/stock/limit/putTerm/putCrowd/useCrowd/position/spuList`。公共字段建列，投影专属字段放 JSON 列；service 分别输出 `CouponListItemDTO` 与 `CouponDetailDTO`。
- 优惠券“删除”是状态流转（`status = 6`，即下线/删除态），不是物理删除；`DELETE /api/merchant/coupon/[id]` 执行该流转并返回更新后的记录。
- 菜单收藏沿用现有行为：`menu/get` 返回 `favorites`，侧边栏最多收藏 10 项，`PATCH /api/menu` 提交完整 `favorites` 数组。
- 菜单里指向本仓库未实现页面的条目（如 `/account/wallet`、`/data/statistics`）保持原样展示，点击后落到全局 `not-found`（对应旧的 `NoneSupport`），不删数据、不隐藏。
- 大型且基本只读的树/字典数据（`merchant/options`、部分 `merchant/category`）用 `ReferenceData` JSON 存储，避免为 117KB 下拉数据拆出几十张表。
- 统计分析类数据用 `AnalysisSnapshot` JSON 存储；页面读取时由 service 层校验并返回类型化结构。
- 所有时间字段以 ISO 字符串存储，服务层用 `dayjs` 格式化后返回给页面。

### 7.3 种子数据

- 将 `public/api/**/*.json` 与 `packages/mtm_market/public/api/**/*.json` 复制到 `lib/db/seed/data/**`，不再作为公开静态资源暴露。
- 种子脚本按“实体 → 引用数据 → 分析快照”的顺序插入，ID 固定，确保重复执行幂等。
- 登录账号种子：mobile `13412345678`，interCode `86`，login `mt087320v`，绑定 `merchantId = 1`。
- 优惠券种子：列表里每一行都补齐为完整记录（列表投影 + 详情投影），详情 mock 中不在列表里的 `1070734573` 也单独入库，保证列表 → 详情/编辑可达。
- 验证码不落库；由服务端生成并写入短期签名 Cookie（见 8.2）。

## 8. 认证（NextAuth / Auth.js）

### 8.1 方案

- Auth.js v5，`Credentials` provider，`session.strategy = 'jwt'`。
- 不使用 Sequelize adapter；用户与业务数据全部通过服务层访问。
- JWT 有效期 2 小时，与旧 token 行为一致。
- `AUTH_SECRET` 由环境变量提供。
- Session 中保存 `accountId`、`mobile`、`interCode`、`merchantId`、`login`。
- 保留现有国际区号选择器（`interCode`：86/65/852/853）；手机号校验按区号规则执行，区号写入 `Account` 与会话。

### 8.2 登录流程

1. `GET /api/captcha` 生成 4–6 位数字验证码，写入 `httpOnly`、短时效（5 分钟）、签名的 Cookie，并返回 `{ mobile, captcha }` 展示用数据（沿用现有“以 toast 展示验证码”的演示行为）。
2. `POST` Credentials：校验 `interCode` + mobile 格式与验证码 Cookie；通过后按 `(interCode, mobile)` upsert `Account`（保留 `merchantId = 1`），返回用户对象。
3. NextAuth 写入会话 Cookie（`httpOnly`、`sameSite=lax`、`secure` 生产开启）。
4. `signOut()` 清理会话。

说明：现有 mock 对任意手机号都返回成功，新实现同样“任意合法手机号可登录”，但必须通过验证码，避免成为完全开放入口。

### 8.3 路由保护

- `middleware.ts` 保护 `(admin)` 下所有页面与 market 页面；未登录重定向 `/login?callbackUrl=...`。
- `/login`、`/register`、`/register/success`、`/settleinpc`、`/settleinjx/*`、`/api/auth/*`、`/api/captcha` 公开。
- RSC 内用 `auth()` 获取会话；业务 service 显式接收 `accountId/merchantId`，不隐式读全局。
- 删除 `src/utils/jwt.ts`、`js-cookie` 相关 token 读写。

## 9. 接口层（Route Handlers + 服务层）

两条通道：

1. **Server Components → `lib/services/*`（首选）**：页面初次渲染直接调用服务层，不经过 HTTP。
2. **Client Components → Route Handlers**：表单提交、表格分页/筛选、coupon CRUD、菜单角标轮询等。

约束：

- Route Handler 只做：鉴权 → Zod 校验 → 调 service → 统一响应。
- 不在 handler 里写业务查询。
- service 层不依赖 Request/Response，可被 RSC 与 handler 复用。

统一响应：

```json
{ "code": 0, "message": "ok", "data": {} }
```

- 成功 `code = 0`。
- 业务错误 `code != 0` + 合适 HTTP 状态码。
- 旧 mock 混用 `msg`/`message`，新接口统一为 `message`；客户端适配层兼容读取 `msg` 仅作为过渡，迁移完成后删除。

Route Handler 清单：

| 路径                               | 方法             | 服务                         |
| ---------------------------------- | ---------------- | ---------------------------- |
| `/api/auth/[...nextauth]`          | GET/POST         | NextAuth                     |
| `/api/captcha`                     | GET              | CaptchaService               |
| `/api/account`                     | GET              | AccountService.current       |
| `/api/menu`                        | GET/PATCH        | MenuService（含偏好）        |
| `/api/menu/badges`                 | GET              | MenuService.badges           |
| `/api/merchant/detail`             | GET              | MerchantService.detail       |
| `/api/merchant/list`               | GET              | MerchantService.list         |
| `/api/merchant/category`           | GET              | MerchantService.categories   |
| `/api/merchant/options`            | GET              | ReferenceDataService         |
| `/api/merchant/licenses`           | GET              | LicenseService.list          |
| `/api/merchant/entry`              | GET/PATCH        | EntryService                 |
| `/api/merchant/entry/task`         | GET              | EntryTaskService             |
| `/api/merchant/entry/type`         | GET              | EntryService.types           |
| `/api/merchant/entry/template-url` | GET              | EntryService.templateUrl     |
| `/api/merchant/contract/sign`      | POST             | ContractService.sign         |
| `/api/register`                    | POST             | RegistrationService.register |
| `/api/invitation`                  | POST             | InvitationService.accept     |
| `/api/venus/ocr`                   | GET              | VenusService.ocr             |
| `/api/venus/sign`                  | GET              | VenusService.sign            |
| `/api/venus/upload`                | POST             | VenusService.upload          |
| `/api/merchant/coupon`             | GET/POST         | CouponService                |
| `/api/merchant/coupon/[id]`        | GET/PATCH/DELETE | CouponService                |
| `/api/merchant/campaigns`          | GET              | CampaignService.list         |
| `/api/merchant/gold`               | GET              | GoldService.get              |
| `/api/merchant/task/list`          | GET              | MerchantTaskService.list     |
| `/api/message/latest-news`         | GET              | MessageService.latest        |
| `/api/message/[id]`                | GET              | MessageService.detail        |
| `/api/product/selling`             | GET              | ProductService.selling       |
| `/api/violation/overview`          | GET              | ViolationService.overview    |
| `/api/analysis/workbench`          | GET              | AnalysisService.workbench    |
| `/api/analysis/trending`           | GET              | AnalysisService.trending     |
| `/api/analysis/operation`          | GET              | AnalysisService.operation    |
| `/api/health`                      | GET              | 健康检查（DB ping）          |

`/api/api/thh/task/gold/merchant` 这条历史嵌套路径并入 `/api/merchant/gold`，不保留。

分页/筛选统一参数：`pn`（页码，从 1 开始）、`ps`（每页条数，默认 10），返回 `{ total, items }`。

## 10. 客户端状态与表单

- **TanStack Query**：所有客户端数据请求。`queryKey` 集中在 `lib/query-keys.ts`；服务端预取用 `dehydrate/HydrationBoundary`，避免首屏闪 loading。
- **Zustand**：仅 UI 偏好（侧边栏折叠、表格列宽、最近访问菜单）；不存服务端数据。
- **React Hook Form + Zod**：所有表单；schema 同时供 Route Handler 与服务端复用。
- **TanStack Table**：所有列表页；封装 `DataTable`（排序、筛选、分页、列显示、空态、loading）。
- 删除 Redux store、slices、middleware、`react-redux`、`@reduxjs/toolkit`、`redux-thunk`。
- 删除 `axios`、`src/hooks/useDynamicScript`、`useFederatedComponent`、`src/utils/history.ts`。

## 11. UI 体系（headless + CSS Modules）

### 11.1 基础选型

- 无障碍/交互原语：`@base-ui-components/react`。
- 图标：`lucide-react`。
- 图表：`recharts`（当前只有 trending 一条折线图）。
- 二维码：保留 `qrcode.react`。
- 样式：CSS Modules + `styles/tokens.css` 全局变量。

### 11.2 设计令牌

`tokens.css` 定义：

- 颜色：品牌色、文本层级（primary/secondary/tertiary）、背景、边框、状态色（success/warning/danger/info）。
- 间距：4px 基准（4/8/12/16/24/32/48）。
- 圆角、阴影、层级（tooltip/dropdown/modal/toast）。
- 字体与行高。

现有 Antd 主题色从 `src/styles/theme` 提取到变量；页面用变量，不写死色值。仅亮色主题。

### 11.3 组件清单（最小必要集）

`components/ui/` 至少包含：

- 基础：`Button`、`IconButton`、`Link`、`Spinner`、`Tag`、`Badge`、`Tooltip`、`Popover`、`Dropdown`
- 表单：`Input`、`Textarea`、`NumberInput`、`Select`、`Checkbox`、`Radio`、`Switch`、`DatePicker`、`Upload`、`FormField`、`Form`（RHF 包装）
- 覆盖层：`Dialog`、`Drawer`、`Toast`（替代 `message`/`notification`）
- 数据展示：`Card`、`Descriptions`（LabelValue）、`Tabs`、`Steps`、`Pagination`、`Table`（TanStack 封装）、`Empty`、`Skeleton`
- 布局：`AdminShell`、`Sidebar`、`Header`、`Breadcrumbs`、`PageContainer`

复杂业务组件的替代关系：

| 旧组件                                    | 新实现                                    |
| ----------------------------------------- | ----------------------------------------- |
| `ProTable`                                | `DataTable` + `SearchForm` + `useQuery`   |
| `ProForm` / `ProFormItem`                 | `Form` + `FormField` + RHF/Zod            |
| `PageContainer`                           | `PageContainer`（面包屑 + 标题 + 操作区） |
| `ProCard`                                 | `Card`                                    |
| `message` / `notification`                | `Toast`                                   |
| `Modal` / `Drawer`                        | Base UI `Dialog` / `Drawer` 封装          |
| `ConfigProvider` 主题                     | CSS 变量                                  |
| `federated-adapter`                       | 删除                                      |
| `field-*`（验证码/证件/商户 logo/期限等） | 业务字段组件，基于新 `FormField`          |

迁移覆盖范围：约 78 个文件直接引用 Antd，其中 11 个使用 ProComponents。全部重写，不做兼容层。

### 11.4 客户端边界

- Base UI 组件、TanStack Query、RHF、Table、Zustand 均在 client components 中使用。
- 页面骨架、数据读取、鉴权尽量放 RSC；交互区块用 `'use client'` 叶子组件，避免把整页标成客户端。

## 12. 移除微前端与旧工程

删除：

- `packages/mtm_market/` 整个包（源码迁入 `app/`、`components/market/`、`lib/services/`）。
- `packages/shared/` 整个包（`http` 能力由 `lib/api-client.ts` 取代；布局组件由 `components/layout/` 取代）。
- `src/router/micro/*`、`src/router/routes.tsx`、`src/router/index.ts`。
- `src/hooks/useDynamicScript.ts`、`useFederatedComponent.ts`、`useComponents.tsx`、`src/components/federated-adapter`。
- `webpack.config.js`、`packages/*/webpack.config.*`、`postcss.config.js`（如 Next 内不需要）、`hosts`、`dist/`。
- `qiankun`、`history`、`react-router-dom`、`axios`、`antd`、`@ant-design/*`、ProComponents、`@ant-design/charts`、Redux 全家桶。
- `src/utils/jwt.ts`、`js-cookie`。
- `.github/workflows/mtm_market.yml`。

保留并迁移：

- `dayjs`、`numeral`、`lodash`、`classnames`、`nanoid`（如仍需要）、`qrcode.react`。
- `src/utils/validator/*`（改为 Zod schema 基础或直接复用）。
- 业务图片资源（`src/pages/settleinjx/home/img`、`src/assets` → `public/assets`）。

`packages/shared/src/utils/http.ts` 的 mock 改写逻辑（把 URL 改写成 `**/<method>.json`）随包删除，不再保留。

## 13. 部署（Docker + volume）

### 13.1 构建

- `next.config.ts` 开启 `output: 'standalone'`。
- 多阶段 `Dockerfile`：
  1. `oven/bun` 阶段：`bun install --frozen-lockfile`。
  2. builder 阶段：`bun run build`。
  3. runner 阶段：Node 22 slim + standalone 产物 + `public/` + `.next/static`，非 root 用户运行。
- 环境变量：`DATABASE_PATH=/data/mtm.sqlite`、`AUTH_SECRET`、`NODE_ENV=production`、`PORT=3000`。

### 13.2 运行

`docker-compose.yml`：

```yaml
services:
  app:
    image: ghcr.io/<owner>/mtm:latest
    ports: ['3000:3000']
    environment:
      - DATABASE_PATH=/data/mtm.sqlite
    env_file: .env.production
    volumes:
      - mtm-data:/data
    restart: unless-stopped

volumes:
  mtm-data:
```

- 宿主机现有 nginx 反向代理到 `127.0.0.1:3000`（与当前静态站点方式保持一致）。
- 单副本；SQLite volume 只能挂载给一个写实例。
- 首次启动自动 `sync + seed`；`SeedMeta` 保证重复启动不重复插入。
- 健康检查：`GET /api/health` 执行 `SELECT 1`。

### 13.3 CI

`.github/workflows/deploy.yml`：

1. checkout、setup-bun、`bun install --frozen-lockfile`。
2. `bun run lint`、`bun run typecheck`。
3. `docker build` 并推送 GHCR（tag：`latest` + commit SHA）。
4. 通过 SSH 在 VPS 执行 `docker compose pull && docker compose up -d`。
5. 删除 scp 静态文件部署方式与 `mtm_market` 工作流。

## 14. 实施顺序（高层）

1. 在原地初始化 Next.js（保留 git 历史），配置 TypeScript 路径别名、CSS Modules、oxlint/oxfmt。
2. 建立 `lib/db`（Sequelize/模型/种子），把两份 mock 数据迁入 seed。
3. 建立服务层与统一响应、鉴权工具。
4. NextAuth 登录/登出/验证码 + middleware。
5. 建立 `tokens.css` 与 `components/ui` 基础组件；先完成 AdminShell。
6. 按路由迁移主应用页面（登录/注册 → 入驻 → 设置 → 店铺）。
7. 迁入 market 页面与 9 个仪表盘组件，合并到首页与 `/market/*`。
8. 删除旧代码、依赖、配置、CI；更新 `package.json` scripts（`dev`/`build`/`start`/`lint`/`typecheck`）。
9. Dockerfile/compose/部署流水线。
10. 全量回归。

## 15. 验收标准

- `bun run lint`、`bun run typecheck`、`bun run build` 全部通过。
- `package.json` 与 `bun.lock` 中不存在 `antd`、`@ant-design/*`、`qiankun`、`react-redux`、`@reduxjs/toolkit`、`axios`、`react-router-dom`、`packages/mtm_market`、`packages/shared`。
- 所有路由（第 6 节）可直接访问；未登录访问管理端跳转 `/login`。
- 登录 → 首页仪表盘 → 店铺资料 → market 优惠券列表/创建/编辑/删除全流程可用。
- 优惠券增删改在容器重启后仍然存在（volume 生效）。
- 浏览器控制台无 404（除不存在的资源）、无 React hydration 错误。
- 首屏页面为 RSC 渲染；客户端 bundle 中不再包含完整组件库主题代码。
- 构建产物无 `window.mtm`、`__POWERED_BY_QIANKUN__`、`__webpack_require__` 相关代码。

## 16. 由实现者决定的默认值（Builder calls）

以下是实现阶段可自行决定、不阻塞设计的点：

1. Next.js / React 版本：使用实施时的最新稳定版（App Router），不锁死旧主版本。
2. SQLite 驱动：`sqlite3`（Sequelize v6 官方方言依赖，预编译二进制可在 Debian 镜像直接使用）。
3. Schema 管理：`sequelize.sync()` + 幂等种子，不引入 Umzug/迁移文件。
4. 登录账号策略：任意合法手机号 + 验证码可登录；按 mobile upsert `Account`，绑定演示商家。
5. 验证码存储：签名 Cookie（5 分钟），不引入 Redis。
6. 图表库：`recharts`；图标库：`lucide-react`。
7. 仅亮色主题。
8. 删除 `/mdx`、`/component` 演示页；不引入 `@next/mdx`。
9. 合并 `/api/api/thh/task/gold/merchant` 到 `/api/merchant/gold`。
10. 宿主机 nginx 反向代理容器，不额外加 nginx 容器。
11. CI 使用 GHCR + SSH `docker compose pull`。
12. 保留 `lodash` 仅在确有使用时；能用原生实现的按需移除。
13. 测试：本设计不强制单元测试；以 lint/typecheck/build + 手工回归矩阵为准（若实现阶段需要 E2E，另立计划）。
14. 目录名：`lib/` 而非 `src/lib/`，`app/` 位于仓库根。
15. 优惠券删除为软删除（`status = 6`），列表与详情共用一张超集表、两套 DTO。
16. 菜单收藏独立建模（`MenuFavorite`，上限 10），`PATCH /api/menu` 提交完整收藏数组。
17. 菜单中未迁移的链接保留展示，点击落到全局 `not-found`。
18. 登录保留 `interCode` 区号；验证码继续在 UI 中直接展示（演示性质）。

## 17. 风险与应对

| 风险                                                  | 影响                     | 应对                                                          |
| ----------------------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| 一次性重写范围大（171 个 TS/TSX，78 个文件引 Antd）   | 周期长、回归面大         | 严格按第 14 节顺序；先打通纵向流程，再横向铺页面              |
| Base UI 成熟度/API 变动                               | 组件返工                 | 只依赖基础原语；`components/ui` 做二次封装隔离                |
| RSC/Client 边界误判                                   | hydration 报错、包体变大 | 交互叶子组件单独 `'use client'`；构建后检查 bundle            |
| Sequelize + SQLite 并发与类型                         | 写冲突、类型松散         | 单实例部署；服务层输出显式 DTO 类型；事务包裹写操作           |
| 种子数据与页面字段不一致（mock 混用 `msg`/`message`） | 页面字段错位             | 种子转换脚本 + 服务层 DTO 映射；迁移时逐页对照                |
| 重写期间 UI 细节丢失                                  | 体验回退                 | 以现有页面截图/行为为基准做回归清单                           |
| Docker volume 权限                                    | 启动失败                 | 镜像内非 root 用户 + volume 目录预创建并授权                  |
| 删除旧应用后无法回退                                  | 风险集中                 | 在独立分支推进；合并前保留旧代码于 git 历史；不保留运行时双轨 |

## 18. 修订（2026-11-03）：antd 限定在封装层

迁移完成后对日期选择、表格排序/筛选、上传三类交互做了 antd 对比原型。结论：headless 实现在这三类场景的交互成本高于收益，决定**在封装层内引入 antd**，而不是在页面里直接使用。

- 页面与业务组件继续只从 `@/components/ui` 导入；`.oxlintrc.jsonc` 用 `no-restricted-imports` 禁止 `antd` / `@ant-design/*` 出现在 `components/ui/**` 之外（根布局与 Provider 除外）。
- `DataTable`、`DatePicker`、`DateRangePicker`、`Upload` 内部使用 antd；其余基础组件保持现有 base-ui/CSS Modules 实现。
- 主题令牌集中在 `app/providers.tsx`（`ConfigProvider` + `AntdApp`），与 `styles/tokens.css` 对齐；`AntdRegistry` 放在根布局负责 SSR 样式注入。
- 表格排序/筛选走服务端参数（`sort`/`order`/`target`），antd 只负责交互 UI，避免客户端只排当前页导致的总数错位。
- 代价：antd 组件所在路由的首屏 JS 增加约 300 kB（gzip，未拆分）；作为交换，日期、表格、上传的交互由成熟组件承担。
