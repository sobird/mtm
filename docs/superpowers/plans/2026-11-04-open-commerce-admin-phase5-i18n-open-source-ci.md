# 阶段 5：i18n、开源化与 CI 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让仓库达到“随时可公开”的标准：两个门户全量中英双语、三个数据库补齐操作日志、开源文档与脱敏到位、CI 覆盖检查与关键流程 E2E、Docker Compose 一条命令自托管。

**Architecture:** 新建共享包 `@mtm/i18n` 集中语言包与翻译工具，两个门户通过 `next-intl` + `NEXT_LOCALE` Cookie 读取语言；`core-api` 在状态变更事务内写 `CoreOperationLog`（失败回滚），门户 BFF 在调用成功后写既有日志表（失败不阻断）；GitHub Actions 拆成 `checks` / `e2e` / `docker` 三个作业；E2E 使用独立 `*_e2e` 库；根 `Dockerfile` 改为多阶段多目标并由 Compose 编排。

**Tech Stack:** Bun 1.4.4、Turborepo、Next.js 15 App Router、React 19、next-intl、Hono、Prisma 6 + PostgreSQL 17、Playwright（Chromium）、GitHub Actions、Docker multi-stage。

**Spec:** `docs/superpowers/specs/2026-11-04-open-commerce-admin-phase5-i18n-open-source-ci-design.md`

## Global Constraints

- 包管理一律 Bun 1.4.4；项目名 `mtm`，包作用域 `@mtm/*`；两个门户 Node 22 运行时。
- 端口固定：`merchant-admin` 3000、`ops-admin` 3001、`core-api` 4000。
- 许可证保持 MIT，版权行原样保留（见 `LICENSE`，本阶段不修改作者信息）。
- 默认语言 `zh-CN`，支持 `zh-CN` / `en-US`；语言 Cookie 名 `NEXT_LOCALE`，不加 URL 前缀。
- 服务端错误码不改名；界面文案只通过 key 翻译；缺失 key 必须抛错，不允许静默回退中文。
- 菜单标题、徽标等 DB 驱动的界面文案存 i18n key；用户录入的业务数据保持原样。
- `core-api` 日志与状态变更同事务（fail-closed）；门户日志在成功后写、失败只 `console.error`（fail-open）。
- 门户页面只能从 `@/components/ui`（商家端）或 `@mtm/ui`（运营端）导入 UI。
- 所有新表主键 cuid；跨库只通过 ID 引用，不做跨库外键。
- 不引入任何真实商家、员工、内部域名、内部仓库路径或密钥；文档保持中性描述。
- 数据库重置类测试需要设置 `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="我同意重置本地开发和测试数据库"`，本地执行 `bun run test` 前先确保 PostgreSQL 已启动。
- 提交信息使用 Conventional Commits（如 `feat(i18n): ...`）。
- 每个任务结束时 `lint` 与相关测试必须通过；阶段结束前 `bun run lint`、`bun run fmt:check`、`bun run typecheck`、`bun run test`、`bun run build` 全绿。

## Review Focus

以下是设计隐含、但任务测试最容易漏掉的五类输入/失败模式。每一行都必须在对应任务里有测试钉住：

1. **非法/未知的 `NEXT_LOCALE` Cookie**（如 `en`、`fr-FR`、空串、伪造值）必须回退到 `zh-CN`，不得崩溃或返回 `undefined`。钉在 Task 1 `normalizeLocale` 测试；Task 2 的切换控件只写入 `SUPPORTED_LOCALES` 内的值。
2. **新增错误码但忘记文案**：`core-api` 或门户 Route Handler 新增 `HttpError`/`AppError` 码时，界面不得直接展示原始码，且扫描测试必须失败。钉在 Task 4 错误码覆盖测试。
3. **门户日志写失败但核心动作已成功**：用户操作已经完成，BFF 不得返回失败；必须记录 `console.error` 并照常返回成功。钉在 Task 14 fail-open 测试。
4. **`bun run docker:up` 重复执行**：不得覆盖已有 `.env.docker` 或轮换密钥（否则已有会话全部失效）。钉在 Task 23 `.env.docker` 生成器幂等测试。
5. **脱敏允许清单过宽**：作者公开信息只能在精确的“文件 + 模式”组合里放行；出现在其他文档中必须扫描失败。钉在 Task 16 检查脚本测试。

---

## File Structure

新增：

- `packages/i18n/`：`package.json`、`tsconfig.json`、`vitest.config.ts`、`src/{index,locale,messages,errors,menu,permissions,browser}.ts`、`messages/{zh-CN,en-US}.json`、`tests/*.test.ts`
- `apps/merchant-admin/i18n/request.ts`、`apps/ops-admin/i18n/request.ts`
- `apps/merchant-admin/lib/db/seed/menu-i18n.ts`
- `apps/{merchant-admin,ops-admin}/lib/operation-log-mapping.ts`
- `apps/core-api/src/services/operation-log.ts`
- `apps/core-api/prisma/migrations/<timestamp>_core_operation_log/`
- `packages/auth/src/cookies.ts`
- `scripts/{check-i18n,check-sensitive,docker-up,docker-env,ci-databases,e2e-bootstrap}.mjs` 与 `scripts/*.test.mjs`
- `e2e/`（`package.json`、`playwright.config.ts`、`tsconfig.json`、`fixtures/product.png`、`tests/*.spec.ts`）
- 根 `README.md`、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`
- `deploy/postgres/init.sql`

修改重点：两个门户的根布局/Providers/壳层、两个 `next.config.ts`、`apps/{portal}/lib/auth.config.ts`、菜单种子与菜单服务、所有页面组件、`apps/core-api/prisma/schema.prisma`、`apps/core-api/src/services/{products,audits}.ts`、两个 `lib/core-api.ts`、`.github/workflows/ci.yml`、根 `Dockerfile`、`docker-compose.yml`、根 `package.json`、`turbo.json`、`.gitignore`、`CLAUDE.md`、阶段 1–5 文档。

---

### Task 1: 共享 i18n 基础包

**Files:**

- Create: `packages/i18n/package.json`, `packages/i18n/tsconfig.json`, `packages/i18n/vitest.config.ts`
- Create: `packages/i18n/src/{index,locale,messages,errors,menu,permissions,browser}.ts`
- Create: `packages/i18n/messages/{zh-CN,en-US}.json`
- Test: `packages/i18n/tests/{locale,messages,helpers}.test.ts`

**Interfaces:**

- Produces（后续任务依赖，签名必须一致）:
  - `LOCALE_COOKIE: 'NEXT_LOCALE'`
  - `DEFAULT_LOCALE: 'zh-CN'`
  - `SUPPORTED_LOCALES: readonly ['zh-CN', 'en-US']`
  - `type Locale = 'zh-CN' | 'en-US'`
  - `interface Translator { (key: string, values?: Record<string, string | number>): string; has(key: string): boolean }`
  - `type Translate = Translator`（schema 工厂统一使用该别名）
  - `type Messages = typeof zhCN`（语言包对象类型）
  - `normalizeLocale(value: string | null | undefined): Locale`
  - `getMessages(locale: Locale): Messages`
  - `createTranslator(locale: Locale): Translator`
  - `handleIntlError(error: IntlError): void`（`MISSING_MESSAGE` 抛出，其余交给 next-intl 默认日志）
  - `translateError(code: string | null | undefined, t: Translator): string`
  - `translateUiKey(value: string, t: Translator): string`（以 `menu.` / `menu.badge.` 开头才翻译，否则原样返回）
  - `translatePermissionName(code: string, fallback: string, t: Translator): string`
  - `buildLocaleCookie(locale: Locale): string`、`persistLocale(locale: Locale): void`

- [ ] **Step 1: 建包骨架并写失败测试**

`packages/i18n/package.json`：

```json
{
  "name": "@mtm/i18n",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./browser": "./src/browser.ts"
  },
  "scripts": {
    "lint": "oxlint -c ../../packages/config/oxlint.jsonc",
    "format": "oxfmt --check --config ../../packages/config/oxfmt.jsonc",
    "format:fix": "oxfmt --config ../../packages/config/oxfmt.jsonc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "next-intl": "^4.6.0" },
  "devDependencies": {
    "@mtm/config": "workspace:*",
    "jsdom": "^30.1.3",
    "typescript": "^5.0.2",
    "vitest": "^5.1.0"
  }
}
```

`tsconfig.json` 与 `vitest.config.ts` 复制 `packages/auth` 的同名文件结构（`extends ../../packages/config/tsconfig.base.json`，`include: ["src","tests","vitest.config.ts"]`）。

`tests/locale.test.ts`：

```ts
import { describe, expect, test } from 'vitest';

import { DEFAULT_LOCALE, normalizeLocale } from '../src';

describe('normalizeLocale', () => {
  test('accepts supported locales', () => {
    expect(normalizeLocale('zh-CN')).toBe('zh-CN');
    expect(normalizeLocale('en-US')).toBe('en-US');
  });

  test('falls back to zh-CN for unknown, partial, empty and missing values', () => {
    for (const input of [undefined, null, '', 'en', 'fr-FR', 'EN-us', 'zh']) {
      expect(normalizeLocale(input)).toBe(DEFAULT_LOCALE);
    }
  });
});
```

`tests/messages.test.ts`：

```ts
import { describe, expect, test } from 'vitest';

import { createTranslator, getMessages, translateError, translateUiKey } from '../src';

function flatten(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null ? flatten(child as object, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
}

describe('messages', () => {
  test('zh-CN and en-US expose the same key set', () => {
    expect(flatten(getMessages('zh-CN')).sort()).toEqual(flatten(getMessages('en-US')).sort());
  });

  test('translates known keys and errors', () => {
    const t = createTranslator('en-US');
    expect(t('common.logout')).toBe('Sign out');
    expect(translateError('PRODUCT_NOT_FOUND', t)).toBe('Product not found');
    expect(translateError('NOT_A_REAL_CODE', t)).toBe('Something went wrong. Please try again later.');
  });

  test('translates menu keys and leaves business text or missing keys untouched', () => {
    const t = createTranslator('zh-CN');
    expect(translateUiKey('menu.product.list', t)).toBe('商品列表');
    expect(translateUiKey('青禾家居旗舰店', t)).toBe('青禾家居旗舰店');
    expect(translateUiKey('menu.not.seeded', t)).toBe('menu.not.seeded');
  });

  test('throws when a key is missing', () => {
    const t = createTranslator('en-US');
    expect(() => t('no.such.key')).toThrow(/MISSING_MESSAGE/);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/i18n && bunx vitest run`
Expected: FAIL，模块或导出不存在。

- [ ] **Step 3: 实现基础包**

`src/locale.ts` 精确实现：

```ts
export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const DEFAULT_LOCALE = 'zh-CN';
export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(value: string | null | undefined): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : DEFAULT_LOCALE;
}
```

`src/messages.ts`：从 `../messages/zh-CN.json`、`../messages/en-US.json` 静态导入，`getMessages(locale)` 返回对应对象；以别名导入 next-intl 的 `createTranslator as createNextIntlTranslator`（避免与本包导出的同名函数递归），调用 `createNextIntlTranslator({ locale, messages, onError: handleIntlError })` 并转换为导出的 `Translator` 类型。

`handleIntlError` 从 `next-intl` 导入 `IntlError` / `IntlErrorCode`，仅当 `error.code === IntlErrorCode.MISSING_MESSAGE` 时 `throw error`，其他错误码保持 next-intl 默认日志。注意：next-intl 的默认 `onError` 只是 `console.error` 并回退渲染 key，并不会抛错，所以必须显式设置。

初始两个 JSON 至少包含：

```json
{
  "common": {
    "logout": "退出登录",
    "language": "语言"
  },
  "menu": { "product": { "list": "商品列表" } },
  "errors": {
    "UNKNOWN": "操作失败，请稍后重试",
    "PRODUCT_NOT_FOUND": "商品不存在"
  }
}
```

英文对应值：`Sign out` / `Language` / `Products` / `Something went wrong. Please try again later.` / `Product not found`。语言名（`中文` / `English`）不放进语言包，由 LocaleSwitcher 用静态标签映射（语言名保持自身语言，且 next-intl 无法解析含字面点号的扁平 key）。

`src/errors.ts`：

```ts
export function translateError(code: string | null | undefined, t: Translator): string {
  const key = `errors.${code ?? 'UNKNOWN'}`;
  return t.has(key) ? t(key) : t('errors.UNKNOWN');
}
```

`src/menu.ts`：`translateUiKey` 仅在 value 以 `menu.` 开头且 `t.has(value)` 时返回 `t(value)`，其余情况（非菜单值或 key 未播种）原样返回 value。

`src/permissions.ts`：`PERMISSION_NAME_KEYS` 映射 17 个权限码（见 Task 3），`translatePermissionName` 未命中返回 `fallback`。

`src/browser.ts`：

```ts
export function buildLocaleCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function persistLocale(locale: Locale): void {
  document.cookie = buildLocaleCookie(locale);
  window.location.reload();
}
```

`src/index.ts` 汇总导出以上全部符号与类型。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd ../.. && bun install && cd packages/i18n && bunx vitest run && bun run typecheck`
Expected: PASS（先 `bun install` 建立新工作区链接并安装 `next-intl` / `jsdom`，再跑测试与类型检查）。

- [ ] **Step 5: 提交**

```bash
git add packages/i18n bun.lock
git commit -m "feat(i18n): add shared locale and message package"
```

---

### Task 2: 门户接入 next-intl 与语言切换

**Files:**

- Modify: `apps/merchant-admin/package.json`, `apps/ops-admin/package.json`, `packages/ui/package.json`
- Modify: `apps/merchant-admin/next.config.ts`, `apps/ops-admin/next.config.ts`
- Create: `apps/merchant-admin/i18n/request.ts`, `apps/ops-admin/i18n/request.ts`
- Modify: `apps/merchant-admin/app/layout.tsx`, `apps/ops-admin/app/layout.tsx`
- Modify: `apps/merchant-admin/app/providers.tsx`, `apps/ops-admin/app/providers.tsx`
- Modify: `packages/ui/src/layout/Header.tsx`, `packages/ui/src/index.ts`
- Create: `packages/ui/src/layout/LocaleSwitcher.tsx`
- Modify: `apps/merchant-admin/components/layout/Header/index.tsx`
- Create: `apps/{merchant-admin,ops-admin}/tests/i18n/render.tsx`（`renderWithIntl` 测试助手）
- Test: `packages/i18n/tests/browser.test.ts`, `apps/ops-admin/tests/components/Header.test.tsx`, `apps/merchant-admin/tests/components/Header.test.tsx`（后两者当前不存在，需新建）

**Interfaces:**

- Consumes: Task 1 的 `LOCALE_COOKIE`、`normalizeLocale`、`getMessages`、`buildLocaleCookie`。
- Produces: `Providers({ locale }: { locale: Locale })`；壳层语言切换控件 `data-testid='locale-switcher'`；`html lang` 跟随当前语言。

- [ ] **Step 1: 写失败测试**

`packages/i18n/tests/browser.test.ts`：

```ts
// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';

import { buildLocaleCookie } from '../src';
import { persistLocale } from '../src/browser';

test('builds a one-year SameSite=Lax cookie', () => {
  expect(buildLocaleCookie('en-US')).toBe('NEXT_LOCALE=en-US; Path=/; Max-Age=31536000; SameSite=Lax');
});

test('persists the cookie and reloads the page', () => {
  const reload = vi.fn();
  vi.stubGlobal('location', { reload });
  persistLocale('en-US');
  expect(document.cookie).toContain('NEXT_LOCALE=en-US');
  expect(reload).toHaveBeenCalledTimes(1);
});
```

运营端 `Header` 测试（复用 `renderWithIntl`，见 Task 2 Step 3 的测试助手）：在 `en-US` 下断言按钮可访问名为 `Sign out`，且 `locale-switcher` 存在。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/i18n && bunx vitest run tests/browser.test.ts`
Expected: FAIL（`persistLocale` 未实现或 header 无翻译）。

- [ ] **Step 3: 接入 next-intl**

1. 两个门户执行 `bun add next-intl`，并添加 `"@mtm/i18n": "workspace:*"` 依赖；`packages/ui` 添加 `@mtm/i18n` 与 `next-intl` 依赖。
2. `apps/{portal}/i18n/request.ts`：

```ts
import { getMessages, handleIntlError, normalizeLocale, LOCALE_COOKIE } from '@mtm/i18n';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { locale, messages: getMessages(locale), onError: handleIntlError };
});
```

3. 两个 `next.config.ts` 用插件包裹现有配置：

```ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
```

4. 根布局改为异步，读取 `getLocale()` / `getMessages()`，`<html lang={locale}>`，用 `<NextIntlClientProvider locale={locale} messages={messages} onError={handleIntlError}>` 包裹 `<Providers locale={locale}>`；`generateMetadata` 用 `getTranslations()` 返回 `common.appTitle`（两门户分别 `merchant` / `ops`）。
5. `Providers` 接收 `locale`：`ConfigProvider locale={locale === 'zh-CN' ? zhCN : enUS}`，并 `dayjs.locale(locale === 'zh-CN' ? 'zh-cn' : 'en')`；两个门户都要 import `antd/locale/en_US` 与 `dayjs/locale/en`。
6. `packages/ui/src/layout/LocaleSwitcher.tsx`（`'use client'`）：原生 `<select data-testid='locale-switcher' aria-label={t('common.language')}>`，选项来自 `SUPPORTED_LOCALES`，标签用静态映射（`zh-CN` → `中文`、`en-US` → `English`；语言名保持自身语言，不放进语言包），`onChange` 调从 `@mtm/i18n/browser` 导入的 `persistLocale`。加入 `Header` 右侧、退出按钮之前，并从 `packages/ui/src/index.ts` 导出。
7. 商家端 Header 复制同样的小控件（放在 `components/layout/Header/index.tsx` 内或同目录 `LocaleSwitcher`），文案改走 `useTranslations`：`common.toggleSidebar`、`common.accountMenu`、`common.logout`、`common.language`。`packages/ui` 的 Header 同步把 `退出登录` 换成 `t('common.logout')`。
8. 新增测试助手 `apps/{portal}/tests/i18n/render.tsx`：

```tsx
import { getMessages, handleIntlError, type Locale } from '@mtm/i18n';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';

export function renderWithIntl(ui: ReactElement, locale: Locale = 'zh-CN') {
  return render(
    <NextIntlClientProvider locale={locale} messages={getMessages(locale)} onError={handleIntlError}>
      {ui}
    </NextIntlClientProvider>
  );
}
```

9. 两个 JSON 的 `common` 增补：`appTitle.merchant`、`appTitle.ops`、`toggleSidebar`、`accountMenu`。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd packages/i18n && bunx vitest run && cd ../../apps/ops-admin && bunx vitest run tests/components/Header.test.tsx && cd ../merchant-admin && bunx vitest run tests/components/Header.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add packages/i18n packages/ui apps/merchant-admin apps/ops-admin bun.lock
git commit -m "feat(i18n): wire next-intl and locale switcher into both portals"
```

---

### Task 3: 菜单与权限的 i18n key

**Files:**

- Create: `apps/merchant-admin/lib/db/seed/menu-i18n.ts`
- Modify: `apps/merchant-admin/lib/db/seed/transformers.ts`, `apps/merchant-admin/lib/db/seed/auth.ts`
- Modify: `apps/ops-admin/lib/db/seed/auth.ts`
- Modify: `apps/merchant-admin/components/layout/SidebarMenu/index.tsx`, `apps/merchant-admin/components/layout/Sidebar/index.tsx`, `apps/merchant-admin/components/layout/TitleWithBadge/index.tsx`
- Modify: `packages/ui/src/layout/SidebarMenu.tsx`, `packages/ui/src/layout/Sidebar.tsx`
- Modify: `apps/{merchant-admin,ops-admin}/components/system/RoleManager/index.tsx`
- Test: `apps/merchant-admin/tests/lib/db/auth-seed.test.ts`, `apps/ops-admin/tests/lib/services/menu.test.ts`, `apps/ops-admin/tests/components/RoleManager.test.tsx`

**Interfaces:**

- Consumes: `translateUiKey`、`translatePermissionName`、消息包 `menu.*` / `permissions.*`。
- Produces: 种子写入的菜单 `title` 全部形如 `menu.<path>`；`menu.badge.new` 为徽标“新”的 key；两门户渲染菜单与权限名时翻译。

- [ ] **Step 1: 写失败测试**

在商家端 `auth-seed.test.ts` 末尾添加：

```ts
import { DEFAULT_LOCALE, getMessages } from '@mtm/i18n';

function messageKeys(value: object, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'object' && child !== null) {
      for (const nested of messageKeys(child, `${prefix}${key}.`)) keys.add(nested);
    } else {
      keys.add(`${prefix}${key}`);
    }
  }
  return keys;
}

test('所有内置菜单标题都是已翻译的 i18n key', async () => {
  await initDatabase();
  await seedMerchantAuth(prisma);
  const keys = messageKeys(getMessages(DEFAULT_LOCALE));
  const rows = await prisma.menuItem.findMany();
  for (const row of rows) {
    const title = row.title ?? '';
    if (!title) continue;
    expect(title.startsWith('menu.')).toBe(true);
    expect(keys.has(title)).toBe(true);
  }
});

test('阶段 4 商品菜单使用 key', async () => {
  await initDatabase();
  await seedMerchantAuth(prisma);
  const rows = await prisma.menuItem.findMany({ where: { id: { in: ['1382', '1383', '19245'] } } });
  expect(new Map(rows.map(row => [row.id, row.title]))).toEqual(
    new Map([
      ['1382', 'menu.product.group'],
      ['1383', 'menu.product.list'],
      ['19245', 'menu.product.create'],
    ])
  );
});
```

运营端 `menu.test.ts` 断言所有 `OpsMenuItem.title` 以 `menu.` 开头且在消息包中存在；`RoleManager.test.tsx` 在 `en-US` 下断言显示 `Product view`。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/merchant-admin && bunx vitest run tests/lib/db/auth-seed.test.ts`
Expected: FAIL（标题仍是中文）。

- [ ] **Step 3: 建立映射并改种子**

`apps/merchant-admin/lib/db/seed/menu-i18n.ts` 包含完整映射（必须覆盖 `lib/db/seed/data/main/menu/get.json` 的全部 54 个唯一标题；未映射的非空标题在种子阶段抛错）：

```ts
export const MENU_TITLE_KEYS: Readonly<Record<string, string>> = {
  交易分析: 'menu.analytics.trade',
  优惠券: 'menu.marketing.coupons',
  保证金管理: 'menu.funds.deposit',
  创建新商品: 'menu.product.create',
  发票管理: 'menu.finance.invoices',
  发货中心: 'menu.shipping.center',
  发货管理: 'menu.shipping.list',
  后台首页: 'menu.home',
  品类分析: 'menu.analytics.category',
  售后工作台: 'menu.afterSales.workbench',
  售后管理: 'menu.afterSales.group',
  商品分析: 'menu.analytics.product',
  商品列表: 'menu.product.list',
  商品管理: 'menu.product.group',
  商品诊断: 'menu.product.diagnosis',
  商家成长: 'menu.growth.overview',
  地址审核: 'menu.orders.addressReview',
  奖励中心: 'menu.growth.rewards',
  子账号管理: 'menu.system.staff',
  客服平台: 'menu.service.platform',
  小额打款: 'menu.funds.payouts',
  店铺信息: 'menu.shop.info',
  店铺管理: 'menu.shop.group',
  成长任务: 'menu.growth.tasks',
  我的钱包: 'menu.funds.wallet',
  数据中心: 'menu.analytics.group',
  服务分析: 'menu.analytics.service',
  消息中心: 'menu.messages.center',
  消息设置: 'menu.messages.settings',
  物流工具: 'menu.shipping.tools',
  申诉中心: 'menu.afterSales.appeals',
  电子面单: 'menu.shipping.waybill',
  系统设置: 'menu.system.settings',
  经营概览: 'menu.analytics.overview',
  自动回复: 'menu.messages.autoReply',
  自动核单: 'menu.orders.autoVerify',
  营销中心: 'menu.marketing.group',
  营销活动: 'menu.marketing.campaigns',
  规则中心: 'menu.rules.center',
  规则管理: 'menu.rules.list',
  订单列表: 'menu.orders.list',
  订单地址审核: 'menu.orders.addressApproval',
  账单对账: 'menu.finance.billing',
  账户资金: 'menu.funds.account',
  资金管理: 'menu.funds.group',
  违规列表: 'menu.violations.list',
  退货包运费: 'menu.afterSales.returnShipping',
  金牌商家认证: 'menu.growth.gold',
  闪电退款: 'menu.afterSales.flashRefund',
  隐私保护: 'menu.settings.privacy',
  顾客关怀: 'menu.customers.care',
  顾客画像: 'menu.customers.profile',
  顾客管理: 'menu.customers.group',
  顾客评价: 'menu.customers.reviews',
};

export function toMenuTitleKey(title: string): string {
  const key = MENU_TITLE_KEYS[title];
  if (!key) {
    throw new Error(`未映射的菜单标题：${title}`);
  }
  return key;
}
```

- `transformers.ts` 的 `normalizeMenuItem` 把 `title` 改为 `toMenuTitleKey(str(row.title))`；空标题保持空串。
- `transformMenuBadges` 把 `noticeContent === '新'` 改为 `'menu.badge.new'`，其余值原样。
- `auth.ts` 的 `MERCHANT_MENU_SEEDS` 三个标题改为 `menu.system.group` / `menu.system.accounts` / `menu.system.roles`；三处 `updateMany` 标题改为 `menu.product.group` / `menu.product.list` / `menu.product.create`。
- 运营端 `MENU_SEEDS` 标题：`menu.dashboard`、`menu.product.list`、`menu.category.list`、`menu.brand.list`、`menu.audit.list`、`menu.merchant.list`、`menu.system.group`、`menu.system.accounts`、`menu.system.roles`。

消息包补全上述 54 个菜单 key 与 9 个运营菜单 key，中英文各一份。

权限名映射（`src/permissions.ts`，17 条）：

```ts
export const PERMISSION_NAME_KEYS: Readonly<Record<string, string>> = {
  'product:view': 'permissions.productView',
  'product:create': 'permissions.productCreate',
  'product:update': 'permissions.productUpdate',
  'product:delete': 'permissions.productDelete',
  'product:submit': 'permissions.productSubmit',
  'product:publish': 'permissions.productPublish',
  'product:audit': 'permissions.productAudit',
  'category:view': 'permissions.categoryView',
  'category:manage': 'permissions.categoryManage',
  'brand:manage': 'permissions.brandManage',
  'merchant:view': 'permissions.merchantView',
  'merchant:update': 'permissions.merchantUpdate',
  'shop:view': 'permissions.shopView',
  'shop:update': 'permissions.shopUpdate',
  'account:manage': 'permissions.accountManage',
  'role:manage': 'permissions.roleManage',
  'platform:cross-tenant': 'permissions.platformCrossTenant',
};
```

- 两端 `RoleManager` 渲染权限选项时用 `translatePermissionName(permission.code, permission.name, t)`。
- 两端菜单渲染：`translateUiKey(item.title, t)`；`data-testid={'menu-' + item.id}` 一并加上，供 E2E 使用。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/merchant-admin && bunx vitest run tests/lib/db/auth-seed.test.ts && cd ../ops-admin && bunx vitest run tests/lib/services/menu.test.ts tests/components/RoleManager.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/merchant-admin apps/ops-admin packages/i18n
git commit -m "feat(i18n): store menu and permission labels as keys"
```

---

### Task 4: 错误码目录、翻译助手与源码覆盖测试

**Files:**

- Modify: `packages/i18n/messages/{zh-CN,en-US}.json`
- Create: `packages/i18n/tests/error-codes.test.ts`
- Modify: `apps/{merchant-admin,ops-admin}/lib/errors.ts`（保留 `AppError`）
- Create: `apps/{merchant-admin,ops-admin}/lib/translate-api-error.ts`
- Test: `apps/{merchant-admin,ops-admin}/tests/lib/translate-api-error.test.ts`

**Interfaces:**

- Consumes: `translateError`、`ApiError`（`apps/{portal}/lib/api-client.ts`）。
- Produces: `translateApiError(error: unknown, t: Translator, fallbackKey?: string): string`；`errors` 命名空间覆盖全部服务端与门户错误码。

- [ ] **Step 1: 写失败测试**

`packages/i18n/tests/error-codes.test.ts` 扫描源码并对比消息包：

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { getMessages } from '../src';

const ROOT = new URL('../../../', import.meta.url).pathname;

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (name === 'node_modules' || name === 'generated' || name === '.next') return [];
    return statSync(path).isDirectory() ? filesUnder(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

function collectCodes(): Set<string> {
  const codes = new Set<string>();
  const sources = [
    ...filesUnder(join(ROOT, 'apps/core-api/src')),
    ...filesUnder(join(ROOT, 'apps/merchant-admin/lib')),
    ...filesUnder(join(ROOT, 'apps/merchant-admin/app')),
    ...filesUnder(join(ROOT, 'apps/ops-admin/lib')),
    ...filesUnder(join(ROOT, 'apps/ops-admin/app')),
  ];
  for (const file of sources) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/new (?:HttpError|AppError|ApiError)\('([A-Z][A-Z0-9_]+)'/g)) codes.add(match[1]);
    for (const match of text.matchAll(/code: '([A-Z][A-Z0-9_]+)'/g)) codes.add(match[1]);
  }
  return codes;
}

describe('error catalog', () => {
  test('every source error code has both translations', () => {
    const zh = getMessages('zh-CN').errors as Record<string, string>;
    const en = getMessages('en-US').errors as Record<string, string>;
    const missing = [...collectCodes()].filter(code => !(code in zh) || !(code in en));
    expect(missing).toEqual([]);
  });
});
```

`translate-api-error.test.ts`：

```ts
import { createTranslator } from '@mtm/i18n';
import { expect, test } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';

const t = createTranslator('en-US');

test('translates a known ApiError by code, not by its message', () => {
  expect(translateApiError(new ApiError('PRODUCT_IN_REVIEW', 409, '商品审核中'), t)).toBe(
    'This product is under review and cannot be edited.'
  );
});

test('falls back to errors.UNKNOWN for unknown errors', () => {
  expect(translateApiError(new Error('boom'), t)).toBe(t('errors.UNKNOWN'));
  expect(translateApiError(new ApiError('SOMETHING_NEW', 400), t)).toBe(t('errors.UNKNOWN'));
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/i18n && bunx vitest run tests/error-codes.test.ts && cd ../../apps/ops-admin && bunx vitest run tests/lib/translate-api-error.test.ts`
Expected: FAIL（错误码缺失、助手不存在）。

- [ ] **Step 3: 建立错误码目录与助手**

- 把两个 `messages` 文件的 `errors` 命名空间补齐到源码中出现的全部错误码。当前完整集合至少包含：
  - core-api：`AUDIT_ALREADY_REVIEWED`、`AUDIT_NOT_FOUND`、`AUDIT_VERSION_CONFLICT`、`BRAND_EXISTS`、`BRAND_NOT_FOUND`、`CATEGORY_ATTRIBUTE_INVALID`、`CATEGORY_HAS_CHILDREN`、`CATEGORY_IN_USE`、`CATEGORY_LEVEL_LIMIT`、`CATEGORY_NOT_FOUND`、`FORBIDDEN`、`MERCHANT_NOT_FOUND`、`PRODUCT_ATTRIBUTE_INVALID`、`PRODUCT_ATTRIBUTE_REQUIRED`、`PRODUCT_ATTRIBUTE_UNKNOWN`、`PRODUCT_BRAND_INVALID`、`PRODUCT_CATEGORY_INVALID`、`PRODUCT_CODE_EXISTS`、`PRODUCT_IN_REVIEW`、`PRODUCT_NOT_APPROVED`、`PRODUCT_NOT_DRAFT`、`PRODUCT_NOT_FOUND`、`PRODUCT_NOT_PUBLISHED`、`PRODUCT_PUBLISHED`、`PRODUCT_SHOP_INVALID`、`PRODUCT_SKU_DUPLICATE`、`PRODUCT_VERSION_CONFLICT`、`SHOP_NOT_FOUND`、`UPLOAD_INVALID_FILE`、`UPLOAD_TOO_LARGE`、`UPLOAD_UNSUPPORTED_TYPE`
  - 门户：`ACCOUNT_NOT_FOUND`、`CONFIGURATION_ERROR`、`CORE_API_ERROR`、`CORE_API_TIMEOUT`、`CSRF_FORBIDDEN`、`FILE_TOO_LARGE`、`INVALID_BODY`、`INVALID_CAPTCHA`、`INVALID_MOBILE`、`INVALID_PATH`、`INVALID_PERMISSION`、`INVALID_QUERY`、`INVALID_ROLE`、`INTERNAL_ERROR`、`LAST_SUPER_ADMIN`、`MAX_FAVORITES`、`NOT_FOUND`、`OCR_NOT_FOUND`、`OWNER_IMMUTABLE`、`ROLE_CODE_TAKEN`、`ROLE_NOT_FOUND`、`SELF_DISABLE_FORBIDDEN`、`UNAUTHORIZED`、`USERNAME_TAKEN`、`HTTP_ERROR`、`UNKNOWN`
  - 中文文案以现有 `HttpError` / `AppError` 的 message 为准，英文文案统一、准确即可。
- `apps/{portal}/lib/translate-api-error.ts`：

```ts
import { translateError, type Translator } from '@mtm/i18n';

import { ApiError } from './api-client';

export function translateApiError(error: unknown, t: Translator, fallbackKey?: string): string {
  if (error instanceof ApiError) {
    return translateError(error.code, t);
  }
  return fallbackKey ? t(fallbackKey) : t('errors.UNKNOWN');
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd packages/i18n && bunx vitest run tests/error-codes.test.ts && cd ../../apps/merchant-admin && bunx vitest run tests/lib/translate-api-error.test.ts && cd ../ops-admin && bunx vitest run tests/lib/translate-api-error.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add packages/i18n apps/merchant-admin apps/ops-admin
git commit -m "feat(i18n): add complete error catalog and code-based translator"
```

---

### Task 5: 商家端共享 UI 组件、壳层与登录/注册

**Files:**

- Modify: `apps/merchant-admin/components/ui/**`（`DataTable`、`Dialog`、`Drawer`、`Empty`、`Pagination`、`SearchForm`、`Select`、`Steps`、`Upload` 等含中文的文件）
- Modify: `apps/merchant-admin/components/layout/{Header,Sidebar,Breadcrumbs,PageContainer}/**`（`SidebarMenu`、`TitleWithBadge` 已在 Task 3 处理）
- Modify: `apps/merchant-admin/components/auth/{LoginForm,RegisterForm,CaptchaField}/**`
- Modify: `apps/merchant-admin/app/(admin)/layout.tsx`、`app/(auth)/**`、`app/(admin)/403/page.tsx`、`app/not-found.tsx`（`setting` 页面归 Task 8）
- Modify: `apps/merchant-admin/lib/validation/auth.ts`、`apps/merchant-admin/lib/auth.ts`（服务端 authorize 继续使用默认语言的 `passwordLoginSchema`）
- Test: `apps/merchant-admin/tests/components/LoginForm.test.tsx`、`tests/lib/auth/schema.test.ts`（包装 `renderWithIntl` 并补 `en-US` 断言）

**Interfaces:**

- Consumes: Task 1/2/4 的 `useTranslations`、`translateApiError`、消息包。
- Produces: 商家端 UI 套件不再含硬编码中文；`useTranslations()` 在客户端组件中可用。

- [ ] **Step 1: 写失败测试**

在 `LoginForm` 测试中新增：

```tsx
test('renders in English', () => {
  renderWithIntl(
    <ToastProvider>
      <LoginForm />
    </ToastProvider>,
    'en-US'
  );
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Username or phone')).toBeInTheDocument();
});
```

同时把原测试的渲染包进 `renderWithIntl`，登录提交改为按 `data-testid='login-submit'` 点击（文案会随语言变化）。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/merchant-admin && bunx vitest run tests/components/LoginForm.test.tsx`
Expected: FAIL（英文文案不存在）。

- [ ] **Step 3: 迁移文案**

- 消息包新增 `common`（`save/cancel/confirm/delete/edit/search/reset/loading/noData/noPermission/actions` 等）、`auth.login.*`、`auth.register.*`、`validation.*`。
- 所有客户端组件改用 `useTranslations('...')`；服务端组件（403/not-found/setting 页面）用 `getTranslations()`。
- 所有 `toast.error(error instanceof ApiError ? error.message : ...)` 改为 `toast.error(translateApiError(error, t, '<fallback key>'))`。
- `components/ui` 中的默认空状态、分页文案、上传提示等改为 `useTranslations('common')`。
- 登录/注册按钮加 `data-testid='login-submit'` / `register-submit`；测试中不再用中文字面量断言，改用翻译后的 `placeholder` 或 `aria-label`（两者都走翻译）。
- `lib/validation/auth.ts` 改为工厂：`export function createLoginSchema(t: Translate)`、`createPasswordLoginSchema(t)`、`createRegisterSchema(t)`，错误信息取 `t('validation.*')`；同时保留 `passwordLoginSchema` 这个用 `createTranslator(DEFAULT_LOCALE)` 构造的默认实例，供 `lib/auth.ts` 的 credentials `authorize` 使用（服务端校验信息不展示给用户）；更新 `LoginForm`/`RegisterForm`/`tests/lib/auth/schema.test.ts`。

- [ ] **Step 4: 运行相关测试与 lint**

Run: `cd apps/merchant-admin && bunx vitest run tests/components/LoginForm.test.tsx tests/lib/auth/schema.test.ts && bun run typecheck && bun run lint`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/merchant-admin
git commit -m "feat(i18n): translate merchant shell, auth and shared UI"
```

---

### Task 6: 商家端入驻页面

**Files:**

- Modify: `apps/merchant-admin/components/entry/**`（`EntryHeader`、`EntryInvitationForm`、`EntryCompany/**`、`EntryShop`、`EntrySteps`、`EntryWarningAlert`、`SettleinpcNotice`、`StoreTypeGuideDialog`、`StoreTypeSelector`）
- Modify: `apps/merchant-admin/components/admin/**`（入驻公司资料使用的 `OcrUpload`、`FieldCaptcha`、`FieldTermPicker`、`FieldUploadFile`、`SignContract`、`FieldMerchantLogo`、`FieldIdCard`）
- Modify: `apps/merchant-admin/app/(entry)/layout.tsx`、`apps/merchant-admin/app/(entry)/settleinpc/page.tsx`、`apps/merchant-admin/app/(entry)/settleinjx/{home,company,shop}/page.tsx`
- Modify: `apps/merchant-admin/lib/validation/{company,id-card,phone}.ts`
- Test: `apps/merchant-admin/tests/components/EntryFlow.test.tsx`（新建）

**Interfaces:** 与 Task 5 相同；新增消息命名空间 `entry.*`、`validation.*` 扩展。

- [ ] **Step 1: 写失败测试**

新建 `EntryFlow.test.tsx`：在 `en-US` 下渲染 `EntryHeader` 与 `EntryInvitationForm`，断言 `Business onboarding` 与邀请码输入框的可访问名称；在 `zh-CN` 下断言中文对应文案。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/merchant-admin && bunx vitest run tests/components/EntryFlow.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 迁移文案**

- 为入驻流程建 `entry.*` key（标题、步骤、表单标签、按钮、提示、OCR 失败提示、店铺类型说明）。
- 全部客户端组件改 `useTranslations('entry')`；`components/admin/**` 的字段标签、上传提示、OCR/合同文案一并改 key；`toast.error` 走 `translateApiError`；schema 工厂接收 `t`。
- 页面 metadata 用 `getTranslations()`。

- [ ] **Step 4: 运行测试与检查**

Run: `cd apps/merchant-admin && bunx vitest run tests/components/EntryFlow.test.tsx && bun run typecheck && bun run lint`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/merchant-admin
git commit -m "feat(i18n): translate merchant onboarding flow"
```

---

### Task 7: 商家端商品模块

**Files:**

- Modify: `apps/merchant-admin/components/product/**`（`ProductManager`、`ProductForm`、`ProductForm/schema.ts`、`AttributeFields`、`ProductImageField`、`SkuEditor`）
- Modify: `apps/merchant-admin/app/(admin)/products/{page,new/page,[id]/page}.tsx`
- Test: `apps/merchant-admin/tests/components/ProductManager.test.tsx`、`ProductForm.test.tsx`、`product-form-schema.test.ts`

**Interfaces:**

- `createProductFormSchema(mode, getAttributes, t)`（在现有两个参数后追加 `t: Translate`）。
- 重要控件加 `data-testid`：`product-create`、`product-code`、`product-title`、`product-category`、`product-brand`、`product-image-input`、`product-sku-code`、`product-submit`、`product-publish`、`product-offline`、`product-status`、`attribute-<attributeId>`。

- [ ] **Step 1: 写失败测试**

在 `ProductManager.test.tsx` 增加 `en-US` 渲染断言（表头 `Product`, 按钮 `Create product`）；在 `product-form-schema.test.ts` 用 `createTranslator('en-US')` 断言必填错误为英文；保留一条中文断言。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/merchant-admin && bunx vitest run tests/components/ProductManager.test.tsx tests/components/product-form-schema.test.ts`
Expected: FAIL。

- [ ] **Step 3: 迁移文案与 schema**

- 新增 `product.*` 命名空间（列表、表单、SKU、图片、状态、确认对话框、Toast）。
- `createProductFormSchema` 接收 `t`，所有 message 改用 `t('validation.*')`；`ProductForm` 用 `useMemo` 把 `t` 放进依赖。
- 状态列用 `t('status.' + status)`。
- 商品页面服务端 metadata 走 `getTranslations()`。
- `toast.error` 全部走 `translateApiError`。

- [ ] **Step 4: 运行测试与检查**

Run: `cd apps/merchant-admin && bunx vitest run tests/components/ProductManager.test.tsx tests/components/ProductForm.test.tsx tests/components/product-form-schema.test.ts && bun run typecheck && bun run lint`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/merchant-admin
git commit -m "feat(i18n): translate merchant product pages"
```

---

### Task 8: 商家端店铺、设置与系统管理模块

**Files:**

- Modify: `apps/merchant-admin/components/{shop/**,setting/**,system/**}`（`system` 含 `AccountManager`、`RoleManager`）
- Modify: `apps/merchant-admin/app/(admin)/shop/**`（含 profile layout）、`app/(admin)/setting/page.tsx`、`app/(admin)/system/**`
- Modify: `apps/merchant-admin/lib/validation/{profile,system,admin}.ts`
- Test: `apps/merchant-admin/tests/components/BaseInfo.test.tsx`、`AccountManager.test.tsx`、`RoleManager.test.tsx`

**Interfaces:** 新增 `shop.*`、`setting.*`、`system.*` 命名空间；schema 工厂接收 `t`。

- [ ] **Step 1: 写失败测试**

`BaseInfo.test.tsx` 增加 `en-US` 断言（`Shop name`、`Save`）；`RoleManager.test.tsx` 增加英文权限名断言。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/merchant-admin && bunx vitest run tests/components/BaseInfo.test.tsx tests/components/RoleManager.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 迁移文案**

- 店铺资料各标签页、证件上传、钱包、商标、设置页、账号管理、角色管理（含 `MENU/BUTTON/API` 标签）全部改 key；`toast` 走 `translateApiError`。
- `validation/profile.ts`、`validation/system.ts`、`validation/admin.ts` 改为工厂。
- 页面 metadata 翻译。

- [ ] **Step 4: 运行测试与检查**

Run: `cd apps/merchant-admin && bunx vitest run tests/components/BaseInfo.test.tsx tests/components/AccountManager.test.tsx tests/components/RoleManager.test.tsx && bun run typecheck && bun run lint`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/merchant-admin
git commit -m "feat(i18n): translate merchant shop and settings"
```

---

### Task 9: 商家端市场与首页模块

**Files:**

- Modify: `apps/merchant-admin/components/market/**`（`coupon/**`、`home/**`、`remotes/**`）
- Modify: `apps/merchant-admin/app/(admin)/market/**`（含 layout）、`app/(admin)/page.tsx`
- Modify: `apps/merchant-admin/lib/validation/{coupon,common}.ts`
- Delete: `apps/merchant-admin/lib/messages.ts`
- Test: `apps/merchant-admin/tests/lib/validation/coupon.test.ts`、`tests/lib/services/coupon-handler.test.ts`

**Interfaces:** 新增 `marketing.*`、`dashboard.*` 扩展。

- [ ] **Step 1: 写失败测试**

`coupon.test.ts` 用 `createTranslator('en-US')` 断言优惠券表单校验文案为英文。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/merchant-admin && bunx vitest run tests/lib/validation/coupon.test.ts`
Expected: FAIL。

- [ ] **Step 3: 迁移文案**

- 优惠券列表/新建/编辑/详情、营销首页 tiles、远程卡片（资金、成长、活动、资讯、违规、商品管理）全部改 key。
- 把 `NO_PERMISSION_MESSAGE` 的引用改为 `t('common.noPermission')`，并删除 `lib/messages.ts`。
- `createCouponSchema(t)` 等工厂化。

- [ ] **Step 4: 运行测试与检查**

Run: `cd apps/merchant-admin && bunx vitest run tests/lib/validation/coupon.test.ts tests/lib/services/coupon-handler.test.ts && bun run typecheck && bun run lint`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/merchant-admin
git commit -m "feat(i18n): translate merchant marketing and dashboard pages"
```

---

### Task 10: 运营端全部页面

**Files:**

- Modify: `apps/ops-admin/components/**`（`auth/LoginForm`、`catalog/**`、`system/**`）
- Modify: `apps/ops-admin/app/**/page.tsx`、`apps/ops-admin/app/(dashboard)/layout.tsx`、`app/(auth)/layout.tsx`
- Modify: `apps/ops-admin/lib/validation/{auth,system}.ts`
- Test: `apps/ops-admin/tests/components/*.test.tsx`（全部包 `renderWithIntl`，每个组件至少一条 `en-US` 断言）

**Interfaces:** 新增 `catalog.*`（类目/品牌/商家/商品只读）、`audit.*`、`opsCommon.*`（或复用 `common.*`）；`createLoginSchema(t)`、`createAccountSchema(t)`、`createRoleSchema(t)`。

- [ ] **Step 1: 写失败测试**

`LoginForm.test.tsx` 的 `renderLoginForm` 改用 `renderWithIntl`，点击 `data-testid='login-submit'`，并新增英文断言。`AuditManager.test.tsx` 新增 `en-US` 断言（`Approve` / `Reject`）。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/ops-admin && bunx vitest run tests/components/LoginForm.test.tsx tests/components/AuditManager.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 迁移文案**

- 登录页、仪表盘、类目、品牌、商家、商品只读、审核、账号、角色页面全部改 key。
- 审核页按钮加 `data-testid='audit-approve'` / `audit-reject`，驳回原因输入 `audit-comment`。
- 所有表格、表单、确认框、Toast 走翻译；`toast.error` 走 `translateApiError`。
- 壳层 `AdminShell title` 从 `app/(dashboard)/layout.tsx` 传入 `t('common.appTitle.ops')`。
- `validation/auth.ts`、`validation/system.ts` 工厂化并更新测试。

- [ ] **Step 4: 运行测试与检查**

Run: `cd apps/ops-admin && bunx vitest run && bun run typecheck && bun run lint`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/ops-admin
git commit -m "feat(i18n): translate ops portal"
```

---

### Task 11: 硬编码门禁与双语言渲染测试

**Files:**

- Create: `scripts/check-i18n.mjs`、`scripts/check-i18n.test.mjs`
- Modify: `package.json`（`"check:i18n": "bun scripts/check-i18n.mjs"`）
- Modify: `packages/ui/src/**`（其余含固定文案的组件）
- Create: `apps/{merchant-admin,ops-admin}/tests/i18n/pages.test.tsx`
- Modify: `.github/workflows/ci.yml`（在 Task 18 中一并加步骤，此处只跑本地）

**Interfaces:**

- `findHardcodedChinese(source: string, filePath: string): { line: number; text: string }[]`
- 检测对象仅限界面文案：JSX 文本节点、`label|placeholder|title|aria-label|aria-description|alt` 属性值、`toast.*|message.*|Modal.*|notification.*` 调用中的字符串参数；这些位置出现 CJK 即命中。
- CLI：扫描 `git ls-files` 中的界面文件，忽略注释、测试、种子、`app/api` 服务端路由与允许路径，命中即退出码 1。

- [ ] **Step 1: 写失败测试**

`scripts/check-i18n.test.mjs`（Bun test）：

```js
import { expect, test } from 'bun:test';

import { findHardcodedChinese } from './check-i18n.mjs';

test('flags Chinese UI text', () => {
  expect(findHardcodedChinese('<Input placeholder="请输入商品标题" />', 'apps/x.tsx')).toHaveLength(1);
});

test('ignores comments, tests, server routes and allowlisted paths', () => {
  expect(findHardcodedChinese('// 中文注释\nconst x = 1;', 'apps/x.tsx')).toEqual([]);
  expect(findHardcodedChinese('<span>你好</span>', 'apps/merchant-admin/tests/x.test.tsx')).toEqual([]);
  expect(findHardcodedChinese("throw new Error('未登录')", 'apps/merchant-admin/app/api/x/route.ts')).toEqual([]);
});

test('flags toast and modal copy', () => {
  expect(findHardcodedChinese("toast.error('保存失败')", 'apps/x.tsx')).toHaveLength(1);
  expect(findHardcodedChinese("message: '确认删除？'", 'apps/x.tsx')).toHaveLength(1);
});

test('honours i18n-ignore on the same line', () => {
  expect(findHardcodedChinese('<span>业务数据</span> // i18n-ignore', 'apps/x.tsx')).toEqual([]);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bun test scripts/check-i18n.test.mjs`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现扫描器**

- 扫描范围：`apps/*/app`（排除 `app/**/api/**`）、`apps/*/components`、`packages/ui/src`、`packages/i18n/src` 下的 `.ts/.tsx`。
- 先剥离 `/* ... */` 与 `// ...` 注释（保留行号）；检测只在以下形态中进行：
  - JSX 文本：`>中文文本<`（不含 `{` / `}` 的片段）；
  - 属性值：`label|placeholder|title|aria-label|aria-description|alt` 后跟含 CJK 的字符串；
  - 调用参数：`toast.*(...)`、`message.*(...)`、`Modal.*(...)`、`notification.*(...)` 内的字符串字面量，以及对象字面量中的 `message|description|title|content: '...'`。
- 含 CJK 的行若带 `i18n-ignore` 或前一行为 `i18n-ignore-next-line`，跳过。
- 路径允许：`**/tests/**`、`**/*.test.*`、`**/generated/**`、`**/prisma/**`、`**/lib/db/seed/**`、`**/messages/*.json`、`**/scripts/**`、`**/e2e/**`、`**/docs/**`、`**/app/**/api/**`。
- 输出格式：`<file>:<line> <text>`，非零退出。
- 跑 `bun run check:i18n`，修掉剩余命中：`packages/ui` 与页面中命中的界面文案改用 `useTranslations` / `getTranslations`（客户端组件按需加 `'use client'`）；`i18n-ignore` 只允许加在真正的业务数据字符串上（如演示类目名），不得用于界面文案。

- [ ] **Step 4: 双语言页面测试**

`apps/ops-admin/tests/i18n/pages.test.tsx`：渲染 `LoginForm`、`AuditManager`、`ProductManager` 的 `zh-CN` 与 `en-US` 版本，各断言一条关键文案；商家端同理覆盖 `LoginForm`、`ProductManager`、`ProductForm`、壳层菜单（用假 `menuItems` 渲染 `Sidebar`）。

- [ ] **Step 5: 运行门禁与测试**

Run: `bun run check:i18n && cd apps/ops-admin && bunx vitest run tests/i18n && cd ../merchant-admin && bunx vitest run tests/i18n`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add scripts package.json apps/merchant-admin apps/ops-admin
git commit -m "feat(i18n): add hardcoded copy gate and bilingual page tests"
```

---

### Task 12: CoreOperationLog 模型与商品日志

**Files:**

- Modify: `apps/core-api/prisma/schema.prisma`
- Create: `apps/core-api/prisma/migrations/<timestamp>_core_operation_log/migration.sql`（由 Prisma 生成）
- Create: `apps/core-api/src/services/operation-log.ts`
- Modify: `apps/core-api/src/services/products.ts`
- Modify: `apps/core-api/tests/helpers.ts`（`resetCoreFixtures` 增加 `coreOperationLog.deleteMany()`）
- Test: `apps/core-api/tests/operation-logs.test.ts`

**Interfaces:**

- Produces:
  - Prisma model `CoreOperationLog`，字段 `id/portal/actorId/actorMerchantId/action/resource/resourceId/detail/createdAt`，索引 `[resource, resourceId, createdAt]`、`[actorId, createdAt]`、`[createdAt]`。
  - `recordCoreOperationLog(tx: Prisma.TransactionClient, auth: ServiceTokenClaims, input: CoreOperationLogInput): Promise<void>`，其中 `CoreOperationLogInput = { action: string; resource: 'product' | 'audit'; resourceId?: string | null; detail?: Prisma.InputJsonValue }`。

- [ ] **Step 1: 写失败测试**

```ts
import { DEMO_MERCHANT_ID } from '@mtm/contracts';
import { beforeEach, expect, test } from 'vitest';

import { seedCoreData } from '@/prisma/seed-data';
import { createApp } from '@/src/app';
import { prisma } from '@/src/db';
import { recordCoreOperationLog } from '@/src/services/operation-log';

import { merchantToken, resetCoreFixtures } from './helpers';

beforeEach(async () => {
  await resetCoreFixtures();
  await seedCoreData(prisma);
});

// 从 tests/products.test.ts 复制 CREATE_BODY 与请求辅助（或把常量导出后复用）
test('创建商品写入 product.create 核心日志', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create']);
  const res = await createApp().request('/api/v1/products', {
    method: 'POST',
    headers: { authorization: `Bearer ${await token}`, 'content-type': 'application/json' },
    body: JSON.stringify(CREATE_BODY),
  });
  const detail = (await res.json()).data;
  const log = await prisma.coreOperationLog.findFirstOrThrow({ where: { action: 'product.create' } });
  expect(log).toMatchObject({
    portal: 'merchant',
    actorId: 'merchant-test',
    actorMerchantId: DEMO_MERCHANT_ID,
    resource: 'product',
    resourceId: detail.id,
  });
  expect(log.detail).toMatchObject({ versionId: detail.currentVersionId });
});

test('日志写入与业务变更在同一事务，抛错时一起回滚', async () => {
  await expect(
    prisma.$transaction(async tx => {
      await recordCoreOperationLog(
        tx,
        { portal: 'merchant', userId: 'u1', merchantId: 'm1', permissions: [], merchantScope: null },
        {
          action: 'product.delete',
          resource: 'product',
          resourceId: 'p1',
        }
      );
      throw new Error('boom');
    })
  ).rejects.toThrow('boom');
  expect(await prisma.coreOperationLog.count()).toBe(0);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/core-api && PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="我同意重置本地开发和测试数据库" bunx vitest run tests/operation-logs.test.ts`
Expected: FAIL（模型/服务不存在）。

- [ ] **Step 3: 加模型、迁移与服务**

- schema 追加：

```prisma
model CoreOperationLog {
  id              String   @id @default(cuid())
  portal          String
  actorId         String
  actorMerchantId String?
  action          String
  resource        String
  resourceId      String?
  detail          Json?
  createdAt       DateTime @default(now())

  @@index([resource, resourceId, createdAt])
  @@index([actorId, createdAt])
  @@index([createdAt])
}
```

- 生成迁移：`cd apps/core-api && bun --env-file=../../.env x prisma migrate dev --name core_operation_log`。
- 实现 `operation-log.ts`：`tx.coreOperationLog.create({ data: { portal: auth.portal, actorId: auth.userId, actorMerchantId: auth.merchantId, action: input.action, resource: input.resource, resourceId: input.resourceId ?? null, detail: input.detail ?? undefined } })`。
- `products.ts` 各写入点（全部在既有 `$transaction` 内，最后一步或状态变更之后）：
  - `createProduct`：`product.create`，`detail: { versionId: version.id, version: 1 }`。
  - `updateProduct` 两个分支：`product.update`，`detail: { versionId, version, newVersion: boolean }`。
  - `submitProduct`：`product.submit`，`detail: { versionId, auditId }`（把 `auditRecord.create` 的返回值保存下来）。
  - `publishProduct`：`product.publish`，`detail: { versionId: current.id }`。
  - `offlineProduct`：`product.offline`，`detail: { versionId: publishedVersionId }`。
  - `deleteProduct`：`product.delete`，`detail: { versionId: product.currentVersion.id }`。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/core-api && PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="我同意重置本地开发和测试数据库" bunx vitest run tests/products.test.ts tests/operation-logs.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/core-api
git commit -m "feat(core-api): record product lifecycle operation logs"
```

---

### Task 13: 审核日志

**Files:**

- Modify: `apps/core-api/src/services/audits.ts`
- Test: `apps/core-api/tests/audits.test.ts`、`apps/core-api/tests/operation-logs.test.ts`

**Interfaces:** 复用 `recordCoreOperationLog`；`action` 为 `audit.approve` / `audit.reject`，`resource: 'audit'`。

- [ ] **Step 1: 写失败测试**

在 `audits.test.ts` 的通过/驳回用例中追加：

```ts
const log = await prisma.coreOperationLog.findFirstOrThrow({ where: { action: 'audit.approve' } });
expect(log).toMatchObject({ portal: 'ops', actorId: 'ops-test', resource: 'audit', resourceId: auditId });
expect(log.detail).toMatchObject({ productVersionId: audit.productVersionId, productId: audit.product.id });
```

驳回用例断言 `action: 'audit.reject'` 且 `detail.comment` 为填写的原因。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/core-api && PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="我同意重置本地开发和测试数据库" bunx vitest run tests/audits.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

在 `decide` 的 `$transaction` 内、两个 `updateMany` 成功后：

```ts
await recordCoreOperationLog(tx, auth, {
  action: next === 'APPROVED' ? 'audit.approve' : 'audit.reject',
  resource: 'audit',
  resourceId: id,
  detail: {
    productId: existing.productVersion.product.id,
    productVersionId: existing.productVersionId,
    comment: normalizeComment(comment),
  },
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/core-api && PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="我同意重置本地开发和测试数据库" bunx vitest run tests/audits.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/core-api
git commit -m "feat(core-api): record audit decisions"
```

---

### Task 14: 门户 BFF 操作日志

**Files:**

- Create: `apps/merchant-admin/lib/operation-log-mapping.ts`
- Create: `apps/ops-admin/lib/operation-log-mapping.ts`
- Modify: `apps/merchant-admin/lib/core-api.ts`、`apps/ops-admin/lib/core-api.ts`
- Test: `apps/{merchant-admin,ops-admin}/tests/lib/operation-log-mapping.test.ts`、`tests/lib/core-api.test.ts`

**Interfaces:**

- `resolveProductLogEntry(method: string, segments: string[], data: unknown): { action: string; resource: 'product'; resourceId: string | null; detail: Record<string, unknown> } | null`
- `resolveAuditLogEntry(method: string, segments: string[], data: unknown): { action: string; resource: 'audit'; ... } | null`
- `proxyToCoreApi` 成功后写日志；写失败 `console.error` 后继续返回成功。

- [ ] **Step 1: 写失败测试**

映射测试：

```ts
import { expect, test } from 'vitest';

import { resolveProductLogEntry } from '@/lib/operation-log-mapping';

test('maps product actions', () => {
  expect(resolveProductLogEntry('POST', ['products'], { id: 'p1', currentVersionId: 'v1' })).toEqual({
    action: 'product.create',
    resource: 'product',
    resourceId: 'p1',
    detail: { versionId: 'v1' },
  });
  expect(resolveProductLogEntry('POST', ['products', 'p1', 'submit'], { id: 'p1' })?.action).toBe('product.submit');
  expect(resolveProductLogEntry('POST', ['products', 'p1', 'publish'], { id: 'p1' })?.action).toBe('product.publish');
  expect(resolveProductLogEntry('POST', ['products', 'p1', 'offline'], { id: 'p1' })?.action).toBe('product.offline');
  expect(resolveProductLogEntry('DELETE', ['products', 'p1'], undefined)).toEqual({
    action: 'product.delete',
    resource: 'product',
    resourceId: 'p1',
    detail: {},
  });
  expect(resolveProductLogEntry('GET', ['products'], undefined)).toBeNull();
});
```

`core-api.test.ts` 增加：

```ts
vi.mock('@/lib/services/operation-log', () => ({ writeOperationLog: writeOperationLogMock }));

test('writes a portal log after a successful product action', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 'p1', currentVersionId: 'v1' } }));
  await proxyToCoreApi(new Request('http://localhost/api/bff/products', { method: 'POST', headers: { 'sec-fetch-site': 'same-origin' }, body: '{}' }), ['products']);
  expect(writeOperationLogMock).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'merchant-account-1', action: 'product.create', resourceId: 'p1' }));
});

test('still succeeds when the portal log write fails', async () => {
  writeOperationLogMock.mockRejectedValue(new Error('log down'));
  fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 'p1', currentVersionId: 'v1' } }));
  const response = await proxyToCoreApi(/* same request */, ['products']);
  expect(response.status).toBe(200);
});
```

运营端 `core-api.test.ts` 同样断言 `audit.approve` 与 fail-open。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/merchant-admin && bunx vitest run tests/lib/operation-log-mapping.test.ts tests/lib/core-api.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现映射与写入**

商家端映射规则：

| 方法      | segments                      | action            | resourceId |
| --------- | ----------------------------- | ----------------- | ---------- |
| POST      | `['products']`                | `product.create`  | `data.id`  |
| PUT/PATCH | `['products', id]`            | `product.update`  | `id`       |
| POST      | `['products', id, 'submit']`  | `product.submit`  | `id`       |
| POST      | `['products', id, 'publish']` | `product.publish` | `id`       |
| POST      | `['products', id, 'offline']` | `product.offline` | `id`       |
| DELETE    | `['products', id]`            | `product.delete`  | `id`       |

运营端：POST `['audits', id, 'approve']` → `audit.approve`；`['audits', id, 'reject']` → `audit.reject`。

`proxyToCoreApi` 改动：

```ts
const account = await requireAccount();
// ...
const { data, meta } = await callCoreApiEnvelope<unknown>(`/${joined}`, { method, body, formData, search });
const entry = resolveProductLogEntry(method, segments, data);
if (entry) {
  try {
    await writeOperationLog({ accountId: account.accountId, ...entry });
  } catch (error) {
    console.error('[operation-log]', error);
  }
}
return meta ? okPage(data, meta) : ok(data);
```

（`requireAccount` / `requireOpsAccount` 当前返回值被丢弃，改为接收并使用；运营端把 `resolveProductLogEntry` 换成 `resolveAuditLogEntry`，其余相同。）

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/merchant-admin && bunx vitest run tests/lib/operation-log-mapping.test.ts tests/lib/core-api.test.ts && cd ../ops-admin && bunx vitest run tests/lib/operation-log-mapping.test.ts tests/lib/core-api.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/merchant-admin apps/ops-admin
git commit -m "feat(portals): log product and audit actions in the BFF"
```

---

### Task 15: 开源文档

**Files:**

- Create: `README.md`、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`
- Delete: `README.asciidoc`
- Modify: `.env.example`（补 `AUTH_COOKIE_SECURE` 注释、`SEED_DEMO_DATA` 说明）

**Interfaces:** README 的快速开始、演示账号、脚本、Docker 自托管章节必须与阶段最终行为一致。

- [ ] **Step 1: 写 README**

章节与内容要求：

1. 项目定位（开源电商运营后台，两个门户 + 核心服务）、功能概览与功能截图占位。
2. 架构（文字版：merchant-admin / ops-admin → BFF → core-api → 三个 PostgreSQL 库），并登记操作日志 action 清单（`product.create/update/submit/publish/offline/delete`、`audit.approve/reject`）。
3. 技术栈与目录结构。
4. 快速开始：`bun install` → `cp .env.example .env` → `bun run dev`；说明需要 Docker。
5. 演示账号（运营端 `admin/admin123`；商家 `merchant@example.com/merchant123`；子账号 `staff@example.com/staff123`），并注明仅限本地。
6. 常用脚本（dev/db:migrate/db:seed/db:reset/lint/fmt:check/typecheck/test/build/check:i18n/check:sensitive/test:e2e/docker:up）。
7. Docker 自托管（`bun run docker:up`，端口 3000/3001/4000），并说明生产部署需启用 TLS、恢复 `AUTH_COOKIE_SECURE` 默认值。
8. 国际化（`NEXT_LOCALE` Cookie、默认中文）。
9. 许可协议（MIT，见 `LICENSE`）。

- [ ] **Step 2: 写 CONTRIBUTING / CODE_OF_CONDUCT / SECURITY**

- `CONTRIBUTING.md`：环境要求（Bun 1.4.4、Docker、Node 22）、常用命令、代码风格（oxlint/oxfmt）、测试要求（含 E2E 前置 `bun run e2e:bootstrap`）、Conventional Commits、PR 流程。
- `CODE_OF_CONDUCT.md`：Contributor Covenant 2.1 中英双语标准文本。
- `SECURITY.md`：支持的版本、私密报告渠道（仓库 Security 页）、演示密钥/账号不可用于生产、自托管需启用 TLS 并把 `AUTH_COOKIE_SECURE` 恢复默认。

- [ ] **Step 3: 删除旧 README 并补环境变量说明**

```bash
git rm README.asciidoc
```

`.env.example` 末尾加：

```bash
# 仅用于 HTTP 自托管演示；生产环境请启用 TLS 并删除此行（默认跟随 NODE_ENV）
# AUTH_COOKIE_SECURE=false
# Docker 自托管时是否写入演示数据（仅 docker-compose 使用）
# SEED_DEMO_DATA=true
```

- [ ] **Step 4: 检查命令与格式**

Run: `bun run fmt:check`
Expected: PASS（文档格式符合 oxfmt）。

- [ ] **Step 5: 提交**

```bash
git add README.md CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md .env.example
git commit -m "docs: add open-source project documentation"
```

---

### Task 16: 敏感信息扫描、资源与历史审计

**Files:**

- Create: `scripts/check-sensitive.mjs`、`scripts/check-sensitive.test.mjs`
- Modify: `package.json`（`"check:sensitive": "bun scripts/check-sensitive.mjs"`）
- Modify: `.gitignore`（确认 `.superpowers/` 已忽略）

**Interfaces:**

- `SENSITIVE_PATTERNS: { name: string; pattern: RegExp }[]`
- `scanText(text: string, filePath: string): { line: number; pattern: string }[]`
- CLI 扫描 `git ls-files` 的文本文件，命中退出码 1。

- [ ] **Step 1: 写失败测试**

```js
import { expect, test } from 'bun:test';

import { scanText } from './check-sensitive.mjs';

test('flags brand and internal references in arbitrary files', () => {
  expect(scanText('<旧品牌词占位>', 'docs/example.md')).toHaveLength(1);
});

test('allows the registered public author info only in its own files', () => {
  expect(scanText('Copyright (c) 2021 AUTHOR', 'LICENSE')).toEqual([]);
  expect(scanText('Copyright (c) 2021 AUTHOR', 'docs/example.md').length).toBeGreaterThan(0);
});
```

（测试中的 `AUTHOR` 与品牌字样用 Task 16 从设计 §5.2 读到的真实模式替换；本计划不复写这些字样，避免自身被扫描命中。）

- [ ] **Step 2: 运行测试确认失败**

Run: `bun test scripts/check-sensitive.test.mjs`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现扫描器**

- 从设计文档 §5.2 抄录完整模式：旧系统中文品牌、英文品牌、三字母缩写（词边界）、两个内部邮箱域前缀、内部包作用域、旧品牌资源前缀、内部域名/IP、非演示邮箱。
- 大小写不敏感；按扩展名 + UTF-8 解码失败跳过二进制。
- 允许清单按“文件 + 模式”精确匹配，至少包括：`scripts/check-sensitive.mjs`（模式定义自身）、`scripts/check-sensitive.test.mjs`（测试样例）、`LICENSE`（作者行）、`deploy/nginx/mtm.conf`（作者信息）、公开镜像域名、`*@example.com`。
- CLI 扫描 `git ls-files` 全部文件；忽略 `node_modules`、`.next`、生成的二进制。

- [ ] **Step 4: 资源与历史审计（只读）**

- 逐张检查 `apps/merchant-admin/public`（全部文件）与 `apps/ops-admin/public`，确认无品牌标识；无用途的演示资源删除。
- 检查 `.npmrc` 无私有 registry；`bun.lock` 只引用公开源。
- Git 历史审计（只读，报告写到 `.superpowers/audit/phase5-history.md`，不提交）：

```bash
git log -p --all | grep -nEi '<从设计 §5.2 读取的密钥样式与旧品牌模式>'
```

- 若发现有效密钥：在交付说明中要求轮换，不改写历史。

- [ ] **Step 5: 运行脚本（预期仍有文档命中）**

Run: `bun run check:sensitive`
Expected: FAIL，并列出待脱敏文档；这是 Task 17 的输入。

- [ ] **Step 6: 提交**

```bash
git add scripts package.json apps/*/public
git commit -m "chore: add sensitive-content scanner and asset audit"
```

---

### Task 17: 文档脱敏与 CLAUDE.md 更新

**Files:**

- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md`
- Modify: `docs/superpowers/specs/2026-11-03-nextjs-migration-design.md`
- Modify: `docs/superpowers/specs/2026-11-04-open-commerce-admin-phase5-i18n-open-source-ci-design.md`
- Modify: `docs/superpowers/plans/2026-11-03-open-commerce-admin-phase{1,2}-*.md`
- Modify: `docs/superpowers/plans/2026-11-04-open-commerce-admin-phase{3,4,5}-*.md`

**Interfaces:** 脱敏后 `bun run check:sensitive` 零命中。

- [ ] **Step 1: 中性化改写**

- 旧系统品牌名、内部仓库绝对路径、内部邮箱/包作用域、旧品牌资源名统一改为中性描述（“旧系统”“参考实现”“内部路径”），保留技术内容与决策记录。
- CLAUDE.md：
  - 当前状态更新为阶段 5 完成；
  - 已知缺口删除（日志已补齐）；
  - 参考仓库章节改为中性说明或删除；
  - 命令清单加入 `check:i18n`、`check:sensitive`、`test:e2e`、`docker:up`；
  - 增加 i18n 约定（`@mtm/i18n`、Cookie、key 规则）与操作日志约定。
- 阶段 5 设计文档 §5.2 的模式清单改为一句话，指向 `scripts/check-sensitive.mjs`（模式只保留在脚本里）；文档中的作者姓名与内部路径示例一并删除或中性化，作者公开信息只保留在 `LICENSE` 与 `deploy/nginx/mtm.conf`（扫描允许清单只覆盖这两处）。

- [ ] **Step 2: 运行扫描**

Run: `bun run check:sensitive`
Expected: PASS，零命中。

- [ ] **Step 3: 全量格式检查**

Run: `bun run fmt:check`
Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add CLAUDE.md docs
git commit -m "docs: neutralize internal references and update handoff notes"
```

---

### Task 18: CI checks 作业

**Files:**

- Create: `scripts/ci-databases.mjs`
- Modify: `.github/workflows/ci.yml`

**Interfaces:** `checks` 作业在 PR 与 master 推送运行，创建 6 个数据库，执行 lint/fmt/typecheck/test/build。

- [ ] **Step 1: 写数据库创建脚本**

`scripts/ci-databases.mjs`（Bun 内置 Postgres 客户端，不依赖 psql）：

```js
import { SQL } from 'bun';

const BASE = process.env.CI_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/postgres';
const DATABASES = [
  'commerce_merchant',
  'commerce_ops',
  'commerce_core',
  'commerce_merchant_test',
  'commerce_core_test',
  'commerce_ops_test',
];

const sql = new SQL(BASE);
for (const name of DATABASES) {
  const rows = await sql`SELECT 1 FROM pg_database WHERE datname = ${name}`;
  if (rows.length === 0) {
    await sql.unsafe(`CREATE DATABASE "${name}"`);
    console.log(`created ${name}`);
  }
}
await sql.close();
```

（设计 §6.1 建议用 `psql`；这里改用 Bun 内置 `SQL`，省去安装 `postgresql-client`，创建行为等价。）

- [ ] **Step 2: 改 ci.yml**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [master]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_USER: mtm
          POSTGRES_PASSWORD: mtm
          POSTGRES_DB: postgres
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U mtm -d postgres"
          --health-interval 2s
          --health-timeout 3s
          --health-retries 30
    env:
      MERCHANT_DATABASE_URL: postgresql://mtm:mtm@localhost:5432/commerce_merchant?schema=public
      CORE_DATABASE_URL: postgresql://mtm:mtm@localhost:5432/commerce_core?schema=public
      OPS_DATABASE_URL: postgresql://mtm:mtm@localhost:5432/commerce_ops?schema=public
      MERCHANT_TEST_DATABASE_URL: postgresql://mtm:mtm@localhost:5432/commerce_merchant_test?schema=public
      CORE_TEST_DATABASE_URL: postgresql://mtm:mtm@localhost:5432/commerce_core_test?schema=public
      OPS_TEST_DATABASE_URL: postgresql://mtm:mtm@localhost:5432/commerce_ops_test?schema=public
      AUTH_SECRET: ci-secret
      OPS_AUTH_SECRET: ci-ops-secret
      CORE_API_JWT_SECRET: ci-core-secret
      CORE_API_URL: http://localhost:4000
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 我同意重置本地开发和测试数据库
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version
      - uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ hashFiles('bun.lock') }}
          restore-keys: turbo-${{ runner.os }}-
      - run: bun scripts/ci-databases.mjs
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run fmt:check
      - run: bun run check:i18n
      - run: bun run check:sensitive
      - run: bun test scripts
      - run: bun run typecheck
      - run: bun run test
      - run: bun run build
```

- [ ] **Step 3: 校验格式**

Run: `bun run fmt:check`
Expected: PASS（YAML 格式）。

- [ ] **Step 4: 本地模拟关键步骤**

Run: `bun scripts/ci-databases.mjs && bun run lint && bun run fmt:check && bun run check:i18n && bun run check:sensitive && bun test scripts`
Expected: PASS（需本地 PostgreSQL 已启动）。

- [ ] **Step 5: 提交**

```bash
git add scripts/ci-databases.mjs .github/workflows/ci.yml
git commit -m "ci: run checks with postgres, formatting and content gates"
```

---

### Task 19: E2E 基础设施与登录冒烟

**Files:**

- Create: `e2e/package.json`、`e2e/tsconfig.json`、`e2e/playwright.config.ts`、`e2e/tests/smoke.spec.ts`、`e2e/fixtures/product.png`
- Create: `scripts/e2e-bootstrap.mjs`
- Modify: `package.json`（workspaces 加 `e2e`，加 `test:e2e`、`e2e:bootstrap`）

**Interfaces:**

- `bun run e2e:bootstrap`：创建 `commerce_{merchant,core,ops}_e2e`，三个应用 `prisma migrate reset --force`，写入种子。
- `bun run test:e2e`：Playwright 运行。
- Playwright `webServer` 启动三个应用，环境变量指向 `*_e2e` 库，`AUTH_COOKIE_SECURE=false`。

- [ ] **Step 1: 建 workspace 与冒烟测试**

`e2e/package.json`：

```json
{
  "name": "@mtm/e2e",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "test:e2e": "playwright test",
    "lint": "oxlint -c ../packages/config/oxlint.jsonc",
    "format": "oxfmt --check --config ../packages/config/oxfmt.jsonc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@mtm/config": "workspace:*",
    "@playwright/test": "^1.56.0",
    "typescript": "^5.0.2"
  }
}
```

根 `package.json`：`workspaces` 增加 `"e2e"`；scripts 增加：

```json
"e2e:bootstrap": "bun scripts/e2e-bootstrap.mjs",
"test:e2e": "bun --cwd e2e run test:e2e"
```

`e2e/tests/smoke.spec.ts`：打开运营端登录页，用 `admin/admin123` 登录，断言 URL 为 `/` 且菜单可见；商家端同样登录。

- [ ] **Step 2: 运行确认失败**

Run: `bun run e2e:bootstrap`（脚本不存在）
Expected: FAIL。

- [ ] **Step 3: 实现 bootstrap 与 Playwright 配置**

`scripts/e2e-bootstrap.mjs`：

- `BASE = process.env.CI_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/postgres'`。
- 使用 `Bun.SQL` 创建三个 `*_e2e` 库（不存在才创建）。
- 对每个应用执行（env 覆盖对应 URL）：
  1. `bunx prisma migrate reset --force --skip-generate --skip-seed`
  2. `bun prisma/seed.ts`
- 应用目录与 URL 环境变量映射：`apps/merchant-admin`→`MERCHANT_DATABASE_URL`、`apps/core-api`→`CORE_DATABASE_URL`、`apps/ops-admin`→`OPS_DATABASE_URL`。

`e2e/playwright.config.ts`：

```ts
import { defineConfig } from '@playwright/test';

const E2E = {
  MERCHANT_DATABASE_URL: 'postgresql://mtm:mtm@localhost:5432/commerce_merchant_e2e?schema=public',
  CORE_DATABASE_URL: 'postgresql://mtm:mtm@localhost:5432/commerce_core_e2e?schema=public',
  OPS_DATABASE_URL: 'postgresql://mtm:mtm@localhost:5432/commerce_ops_e2e?schema=public',
  AUTH_SECRET: 'e2e-merchant-secret',
  OPS_AUTH_SECRET: 'e2e-ops-secret',
  CORE_API_JWT_SECRET: 'e2e-core-secret',
  CORE_API_URL: 'http://localhost:4000',
  CORE_PUBLIC_URL: 'http://localhost:4000',
  AUTH_COOKIE_SECURE: 'false',
};

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  retries: 1,
  use: {
    browserName: 'chromium',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'bun --cwd ../apps/merchant-admin run start',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      env: E2E,
    },
    { command: 'bun --cwd ../apps/ops-admin run start', port: 3001, reuseExistingServer: !process.env.CI, env: E2E },
    { command: 'bun --cwd ../apps/core-api run start', port: 4000, reuseExistingServer: !process.env.CI, env: E2E },
  ],
});
```

`e2e/fixtures/product.png`：用命令生成 1×1 PNG：

```bash
node -e "require('fs').writeFileSync('e2e/fixtures/product.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64'))"
```

- [ ] **Step 4: 构建并运行冒烟**

Run: `bun run e2e:bootstrap && bun run build && bun run test:e2e -- tests/smoke.spec.ts`
Expected: PASS（浏览器需先 `bunx playwright install chromium`）。

- [ ] **Step 5: 提交**

```bash
git add e2e scripts/e2e-bootstrap.mjs package.json bun.lock
git commit -m "test(e2e): add playwright workspace and bootstrap script"
```

---

### Task 20: E2E 关键流程场景

**Files:**

- Create: `e2e/tests/ops-audit.spec.ts`、`e2e/tests/merchant-lifecycle.spec.ts`、`e2e/tests/rbac.spec.ts`、`e2e/tests/locale.spec.ts`
- Create: `e2e/tests/helpers.ts`
- Modify: 页面组件补 `data-testid`（见各任务已要求的 testid，缺的在此补齐）

**Interfaces:** 场景中的名称唯一（`Date.now()` 后缀）；不使用固定计数；选择器优先 role/name，随语言变化的用 `data-testid`。

- [ ] **Step 1: 写场景**

`helpers.ts`：

```ts
import { expect, type Page } from '@playwright/test';

export const MERCHANT_URL = process.env.MERCHANT_URL ?? 'http://localhost:3000';
export const OPS_URL = process.env.OPS_URL ?? 'http://localhost:3001';

export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function loginMerchant(page: Page, identifier = 'merchant@example.com', password = 'merchant123') {
  await page.goto(`${MERCHANT_URL}/login`);
  await page.getByPlaceholder(/用户名或手机号|Username or phone/).fill(identifier);
  await page.getByPlaceholder(/密码|Password/).fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(new RegExp(`${MERCHANT_URL}/?$`));
}
```

场景：

1. `ops-audit.spec.ts`：登录运营端 → 创建唯一类目 → 打开审核列表 → 通过种子待审核商品 → 断言状态 `Approved`/`已通过`。
2. `merchant-lifecycle.spec.ts`：
   - 上传图片（`product-image-input` 设置 `e2e/fixtures/product.png`）；
   - 新建唯一编码/标题商品，选类目“沙发”、品牌“青禾”、填写必填属性与 SKU；
   - 提交审核 → 断言“审核中”且编辑按钮禁用；
   - 运营端驳回并填写原因 → 商家端看到原因；
   - 修改后重新提交 → 运营端通过 → 商家端发布 → 断言已发布。
3. `rbac.spec.ts`：`staff@example.com/staff123` 访问 `/system/accounts` → 跳 `/403`；直接 `POST /api/roles` → 403；未登录访问运营端 `/api/bff/products` → 401。
4. `locale.spec.ts`：在两个门户切换 `en-US`，断言登录页、菜单、商品/审核页面关键文案变英文；刷新后保持；切回 `zh-CN` 恢复中文。

- [ ] **Step 2: 运行确认失败**

Run: `bun run e2e:bootstrap && bun run build && bun run test:e2e`
Expected: FAIL（缺 testid/文案不匹配）。

- [ ] **Step 3: 补齐 testid 与稳定选择器**

- 商品表单：`product-code`、`product-title`、`product-category`、`product-brand`、`attribute-<id>`、`product-image-input`、`product-sku-code`、`product-submit`、`product-publish`、`product-offline`、`product-status`。
- 审核：`audit-approve`、`audit-reject`、`audit-comment`、`audit-status`。
- 类目：`category-create`、`category-name`、`category-save`。
- 登录：`login-submit`；语言：`locale-switcher`。
- 菜单：`menu-<id>`（Task 3 已加）。

- [ ] **Step 4: 运行全部 E2E**

Run: `bun run e2e:bootstrap && bun run build && bun run test:e2e`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add e2e apps/merchant-admin apps/ops-admin
git commit -m "test(e2e): cover checkout lifecycle, audit, RBAC and locale"
```

---

### Task 21: E2E CI 作业

**Files:**

- Modify: `.github/workflows/ci.yml`

**Interfaces:** `e2e` 作业在 master 推送或 PR 带 `e2e` 标签时运行，`needs: checks`。

- [ ] **Step 1: 追加作业**

```yaml
e2e:
  if: >-
    github.event_name == 'push' ||
    contains(github.event.pull_request.labels.*.name, 'e2e')
  needs: checks
  runs-on: ubuntu-latest
  timeout-minutes: 30
  services:
    postgres:
      image: postgres:17-alpine
      env:
        POSTGRES_USER: mtm
        POSTGRES_PASSWORD: mtm
        POSTGRES_DB: postgres
      ports: ['5432:5432']
      options: >-
        --health-cmd "pg_isready -U mtm -d postgres"
        --health-interval 2s
        --health-timeout 3s
        --health-retries 30
  env:
    MERCHANT_DATABASE_URL: postgresql://mtm:mtm@localhost:5432/commerce_merchant_e2e?schema=public
    CORE_DATABASE_URL: postgresql://mtm:mtm@localhost:5432/commerce_core_e2e?schema=public
    OPS_DATABASE_URL: postgresql://mtm:mtm@localhost:5432/commerce_ops_e2e?schema=public
    AUTH_SECRET: ci-secret
    OPS_AUTH_SECRET: ci-ops-secret
    CORE_API_JWT_SECRET: ci-core-secret
    CORE_API_URL: http://localhost:4000
    CORE_PUBLIC_URL: http://localhost:4000
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 我同意重置本地开发和测试数据库
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
      with:
        bun-version-file: .bun-version
    - run: bun install --frozen-lockfile
    - run: cp .env.example .env
    - run: bun run e2e:bootstrap
    - run: bun run build
    - run: bunx playwright install --with-deps chromium
      working-directory: e2e
    - run: bun run test:e2e
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-artifacts
        path: e2e/test-results
        retention-days: 7
```

- [ ] **Step 2: 校验 YAML**

Run: `bun run fmt:check`
Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run key-flow e2e on master and labelled pull requests"
```

---

### Task 22: `AUTH_COOKIE_SECURE` 开关

**Files:**

- Create: `packages/auth/src/cookies.ts`
- Modify: `packages/auth/package.json`（exports 增加 `./cookies`）
- Modify: `apps/merchant-admin/lib/auth.config.ts`、`apps/ops-admin/lib/auth.config.ts`
- Modify: `turbo.json`（`globalEnv` 与 `build` 相关 env 增加 `AUTH_COOKIE_SECURE`）
- Test: `packages/auth/tests/cookies.test.ts`、`apps/{portal}/tests/lib/auth-config.test.ts`

**Interfaces:**

- `useSecureCookies(env: NodeJS.ProcessEnv = process.env): boolean`
  - `AUTH_COOKIE_SECURE=true` → true
  - `AUTH_COOKIE_SECURE=false` → false
  - 其他/未设置 → `env.NODE_ENV === 'production'`
- 两个门户的 Cookie 名与 `secure` 标记都使用该函数结果。

- [ ] **Step 1: 写失败测试**

```ts
import { expect, test } from 'vitest';

import { useSecureCookies } from '../src/cookies';

test('AUTH_COOKIE_SECURE overrides NODE_ENV', () => {
  expect(useSecureCookies({ NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'false' })).toBe(false);
  expect(useSecureCookies({ NODE_ENV: 'development', AUTH_COOKIE_SECURE: 'true' })).toBe(true);
});

test('defaults to NODE_ENV production', () => {
  expect(useSecureCookies({ NODE_ENV: 'production' })).toBe(true);
  expect(useSecureCookies({ NODE_ENV: 'development' })).toBe(false);
  expect(useSecureCookies({ NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'yes' })).toBe(true);
});
```

门户测试补充：`AUTH_COOKIE_SECURE=false` 时 Cookie 名不带 `__Secure-` 且 `secure: false`。

- [ ] **Step 2: 运行确认失败**

Run: `cd packages/auth && bunx vitest run tests/cookies.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现并接入**

```ts
export function useSecureCookies(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.AUTH_COOKIE_SECURE === 'true') return true;
  if (env.AUTH_COOKIE_SECURE === 'false') return false;
  return env.NODE_ENV === 'production';
}
```

两个 `auth.config.ts` 顶部：

```ts
const secureCookies = useSecureCookies();
```

`useSecureCookies` 替换三处 `process.env.NODE_ENV === 'production'`（`useSecureCookies` 字段、Cookie 名、`secure` 选项）。

- [ ] **Step 4: 运行测试**

Run: `cd packages/auth && bunx vitest run tests/cookies.test.ts && cd ../../apps/merchant-admin && bunx vitest run tests/lib/auth-config.test.ts && cd ../ops-admin && bunx vitest run tests/lib/auth-config.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add packages/auth apps/merchant-admin apps/ops-admin turbo.json
git commit -m "feat(auth): allow overriding secure cookie flag for http self-hosting"
```

---

### Task 23: Docker 镜像、Compose 与 `docker:up`

**Files:**

- Rewrite: `Dockerfile`
- Modify: `docker-compose.yml`, `.dockerignore`, `.gitignore`
- Create: `deploy/postgres/init.sql`
- Create: `scripts/docker-env.mjs`、`scripts/docker-up.mjs`、`scripts/docker-env.test.mjs`
- Modify: `apps/merchant-admin/next.config.ts`、`apps/ops-admin/next.config.ts`（`outputFileTracingRoot`）
- Modify: `package.json`（`"docker:up": "bun scripts/docker-up.mjs"`）
- Modify: `.github/workflows/ci.yml`（`docker` 作业）

**Interfaces:**

- `buildDockerEnv(existing: string | null, env?: Record<string, string>): string`：`existing` 非空时原样返回；否则生成含随机密钥的完整配置。
- `bun run docker:up`：`.env.docker` 不存在时生成，然后 `docker compose up --build`。

- [ ] **Step 1: 写失败测试**

```js
import { expect, test } from 'bun:test';

import { buildDockerEnv } from './docker-env.mjs';

test('does not overwrite an existing env file', () => {
  expect(buildDockerEnv('AUTH_SECRET=keep')).toBe('AUTH_SECRET=keep');
});

test('generates container URLs, random secrets and demo flags', () => {
  const text = buildDockerEnv(null, { RANDOM: () => 'abc123' });
  expect(text).toContain('MERCHANT_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_merchant?schema=public');
  expect(text).toContain('CORE_API_URL=http://core-api:4000');
  expect(text).toContain('CORE_PUBLIC_URL=http://localhost:4000');
  expect(text).toContain('AUTH_COOKIE_SECURE=false');
  expect(text).toContain('SEED_DEMO_DATA=true');
  expect(text).toContain('AUTH_SECRET=abc123');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `bun test scripts/docker-env.test.mjs`
Expected: FAIL。

- [ ] **Step 3: 实现生成器与启动脚本**

`scripts/docker-env.mjs`：

```js
import { randomBytes } from 'node:crypto';

export function buildDockerEnv(existing, env = {}) {
  if (existing) return existing;
  const random = env.RANDOM ?? (() => randomBytes(32).toString('hex'));
  return [
    'MERCHANT_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_merchant?schema=public',
    'CORE_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_core?schema=public',
    'OPS_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_ops?schema=public',
    `AUTH_SECRET=${random()}`,
    `OPS_AUTH_SECRET=${random()}`,
    `CORE_API_JWT_SECRET=${random()}`,
    'CORE_API_URL=http://core-api:4000',
    'CORE_PUBLIC_URL=http://localhost:4000',
    'UPLOAD_DIR=/data/uploads',
    'UPLOAD_MAX_BYTES=10485760',
    'AUTH_COOKIE_SECURE=false',
    'SEED_DEMO_DATA=true',
    '',
  ].join('\n');
}
```

`scripts/docker-up.mjs`：读取 `.env.docker`（存在则保留），否则写入生成内容；`spawnSync('docker', ['compose','up','--build'], { stdio: 'inherit' })`。

- [ ] **Step 4: 改 Dockerfile 与 Compose**

- `next.config.ts` 两个门户加：

```ts
import path from 'node:path';
// ...
outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
```

- `Dockerfile` 目标：`deps`、`builder`、`merchant`、`ops`、`core-api`、`migrate`。
  - `deps`：`oven/bun:1.4.4`，复制根 manifest、lock、`.npmrc` 与三个 app/四个 package 的 `package.json`，`bun install --frozen-lockfile`。
  - `builder`：复制源码，三个应用 `prisma generate`，`bun run build`；构建前设置仅用于构建的占位 `ENV`（`AUTH_SECRET=build-placeholder`、`OPS_AUTH_SECRET=build-placeholder`、`CORE_API_JWT_SECRET=build-placeholder`、三个 `*_DATABASE_URL`、`CORE_API_URL`、`CORE_PUBLIC_URL`），避免 Next 构建期读取缺失环境变量。
  - `merchant`/`ops`：`node:22-slim`，复制 `apps/<app>/.next/standalone` 到 `/app`、复制 `apps/<app>/.next/static` 与 `apps/<app>/public`，`CMD ["node","apps/<app>/server.js"]`，`ENV PORT=3000`（ops 3001）、`HOSTNAME=0.0.0.0`。
  - `core-api`：`oven/bun:1.4.4-slim`，复制根 `node_modules`、`package.json`、`apps/core-api`、`packages`，`CMD ["bun","apps/core-api/src/index.ts"]`。
  - `migrate`：基于 `builder`，默认 `CMD ["sh","-c","true"]`，由 Compose 覆盖。
- `deploy/postgres/init.sql`：

```sql
CREATE DATABASE commerce_merchant;
CREATE DATABASE commerce_core;
CREATE DATABASE commerce_ops;
```

- `docker-compose.yml`：
  - `postgres`：增加 `./deploy/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro` 挂载，保留健康检查。
  - `migrate`：`build.target: migrate`，`env_file: .env.docker`，`depends_on: postgres(healthy)`，命令固定为：

```yaml
command: >-
  sh -c "cd apps/merchant-admin && bunx prisma migrate deploy &&
  cd ../core-api && bunx prisma migrate deploy &&
  cd ../ops-admin && bunx prisma migrate deploy &&
  if [ \"$$SEED_DEMO_DATA\" = \"true\" ]; then
  cd ../merchant-admin && bun prisma/seed.ts &&
  cd ../core-api && bun prisma/seed.ts &&
  cd ../ops-admin && bun prisma/seed.ts; fi"
```

- `core-api`：`build.target: core-api`，`env_file: .env.docker`，`depends_on migrate(service_completed_successfully)`，端口 4000，卷 `mtm-uploads:/data/uploads`，健康检查 `bun -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"`。
- `merchant` / `ops`：`build.target` 对应名称，端口 3000/3001，依赖 `migrate`，健康检查 `node -e "fetch('http://127.0.0.1:<port>/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"`。
- 卷：`mtm-postgres`、`mtm-uploads`。
- `.gitignore` 增加 `.env.docker`；`.dockerignore` 保留排除 `.env*`（构建上下文不夹带本地密钥）。

- [ ] **Step 5: 增加 docker CI 作业**

```yaml
docker:
  if: github.event_name == 'push' && github.ref == 'refs/heads/master'
  needs: checks
  runs-on: ubuntu-latest
  timeout-minutes: 30
  steps:
    - uses: actions/checkout@v4
    - uses: docker/setup-buildx-action@v3
    - run: docker build --target merchant -t mtm/merchant:ci .
    - run: docker build --target ops -t mtm/ops:ci .
    - run: docker build --target core-api -t mtm/core-api:ci .
```

- [ ] **Step 6: 验证生成器与配置**

Run: `bun test scripts/docker-env.test.mjs && bun run fmt:check`
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add Dockerfile docker-compose.yml deploy scripts/docker-env.mjs scripts/docker-up.mjs scripts/docker-env.test.mjs apps/merchant-admin/next.config.ts apps/ops-admin/next.config.ts package.json .gitignore .github/workflows/ci.yml
git commit -m "feat(docker): add multi-target images and compose self-hosting"
```

---

### Task 24: 最终验收

**Files:**

- Modify: `.github/workflows/deploy.yml`（仅注释）
- Modify: `README.md`（补齐最终脚本与自托管说明）
- Modify: `CLAUDE.md`（最终状态核对）

- [ ] **Step 1: 更新部署工作流注释**

在 `deploy.yml` 被禁用的 Docker/SSH 步骤上方加一行注释：Dockerfile 已可构建，但启用部署仍需人工确认；本阶段不改变步骤启用状态。

- [ ] **Step 2: 核对 README 与实际脚本**

确认 README 列出的每个命令都能在根目录执行；补充 `bun run check:i18n`、`bun run check:sensitive`、`bun run e2e:bootstrap`、`bun run test:e2e`、`bun run docker:up`。

- [ ] **Step 3: 全量验证**

先确保 PostgreSQL 已启动，然后：

```bash
bun run lint
bun run fmt:check
bun run typecheck
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="我同意重置本地开发和测试数据库" bun run test
bun run build
bun run check:i18n
bun run check:sensitive
```

Expected: 全部通过。

- [ ] **Step 4: E2E 与 Docker 冒烟**

```bash
bun run e2e:bootstrap && bun run build && bun run test:e2e
bun run docker:up
```

Expected: E2E 全绿；`docker:up` 后 3000/3001 可登录、4000 `/health` 返回正常。

- [ ] **Step 5: 提交**

```bash
git add .github/workflows/deploy.yml README.md CLAUDE.md
git commit -m "docs: finalize phase 5 self-hosting and verification notes"
```

---

## 验收清单

- [ ] `packages/i18n` key 一致性与错误码覆盖测试通过。
- [ ] `bun run check:i18n` 零命中；两门户关键页面 `zh-CN` / `en-US` 渲染测试通过。
- [ ] 商品与审核每个动作都写核心日志与门户日志；核心日志事务回滚测试、门户日志 fail-open 测试通过。
- [ ] `bun run check:sensitive` 零命中；四份开源文档就绪；历史审计报告只读、未提交。
- [ ] CI `checks` / `e2e` / `docker` 按约定触发；`fmt:check` 进入 checks。
- [ ] `bun run docker:up` 在干净环境可用；`AUTH_COOKIE_SECURE=false` 生效且有测试，默认生产仍为安全 Cookie。
- [ ] 根命令 lint / fmt:check / typecheck / test / build 全绿。
