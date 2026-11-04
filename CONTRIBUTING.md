# 贡献指南

感谢参与 `mtm`。本文说明本地开发、代码风格、测试与提交要求。参与本项目即表示同意遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 环境要求

- Bun 1.4.4（版本由 `package.json` 的 `packageManager` 与 `.bun-version` 固定）
- Docker（用于启动本地 PostgreSQL）
- Node.js 22（Next.js 运行时）

建议使用版本管理器切换到 `.bun-version` 指定的 Bun 版本后再安装依赖。

## 开始开发

```bash
bun install
cp .env.example .env
bun run dev
```

`bun run dev` 会启动 PostgreSQL、创建数据库、执行迁移与种子数据，然后同时运行三个应用：

- 商家后台：http://localhost:3000
- 运营端：http://localhost:3001
- 核心服务：http://localhost:4000

演示账号与本地演示限制见 [README.md](README.md#演示账号)。不要在提交中写入真实账号、密钥或业务数据。

## 常用命令

| 命令                      | 说明                               |
| ------------------------- | ---------------------------------- |
| `bun run dev`             | 启动数据库并运行全部应用           |
| `bun run db:migrate`      | 应用数据库迁移                     |
| `bun run db:seed`         | 写入种子数据                       |
| `bun run db:reset`        | 重置业务库并重新迁移、写入种子数据 |
| `bun run lint`            | oxlint 静态检查                    |
| `bun run fmt`             | oxfmt 自动格式化                   |
| `bun run fmt:check`       | oxfmt 格式检查                     |
| `bun run typecheck`       | TypeScript 类型检查                |
| `bun run test`            | Vitest 单元与组件测试              |
| `bun run build`           | 构建全部应用                       |
| `bun run check:i18n`      | 检查 i18n key 一致性与硬编码文案   |
| `bun run check:sensitive` | 扫描敏感信息                       |
| `bun run e2e:bootstrap`   | 准备 E2E 数据库与构建产物          |
| `bun run test:e2e`        | 运行 Playwright E2E 测试           |
| `bun run docker:up`       | 启动 Docker Compose 自托管栈       |

提交前至少运行 `bun run lint`、`bun run fmt:check`、`bun run typecheck` 与相关测试。

## 代码风格

- 使用 oxlint 与 oxfmt，配置位于 `packages/config/`。不要在各工作区另建规则文件。
- 所有 TypeScript 代码必须通过 `tsc --noEmit`。
- 业务页面与功能组件只能从 `@/components/ui` 或 `@mtm/ui` 导入 UI 组件，不要直接导入 antd。
- 数据请求使用 RSC + TanStack Query；Zustand 仅存放 UI 偏好。
- 表单统一使用 React Hook Form + Zod。
- 权限码集中定义在 `packages/contracts`，不要在各应用内散落字符串权限码。
- 新增或修改界面文案时，同步更新 `packages/i18n/messages/zh-CN.json` 与 `en-US.json`。
- 不要提交 `.env`、上传文件、生成产物、真实业务数据或内部域名。

## 测试要求

- 新增业务逻辑、权限判断、i18n 或数据库行为时，请补充 Vitest 测试。
- 运行全量测试：`bun run test`。
- E2E 使用 Playwright。首次运行前执行 `bun run e2e:bootstrap` 准备数据库与构建产物，然后运行 `bun run test:e2e`。
- 涉及数据库的测试使用 `*_test` 数据库；不要将测试指向开发库或共享库。
- 提交 PR 前确保 CI 中的 lint、typecheck、test、build 全部通过。

## 提交信息

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```text
<type>(<scope>): <subject>
```

常用 `type`：

| type       | 用途                   |
| ---------- | ---------------------- |
| `feat`     | 新功能                 |
| `fix`      | 缺陷修复               |
| `docs`     | 文档变更               |
| `refactor` | 不改变行为的重构       |
| `test`     | 测试相关               |
| `chore`    | 构建、依赖、工具等杂项 |
| `ci`       | CI 配置                |
| `perf`     | 性能优化               |
| `style`    | 不影响逻辑的格式调整   |

示例：

```text
feat(merchant): add product version history
fix(auth): reject expired service tokens
docs: add open-source project documentation
```

仓库通过 Husky + commitlint 校验提交信息；请勿使用 `--no-verify` 绕过钩子。

## PR 流程

1. 从 `master` 创建功能分支，分支名建议使用 `feat/…`、`fix/…`、`docs/…` 等前缀。
2. 完成代码与测试，确保本地 lint、fmt:check、typecheck、test、build 通过。
3. 若新增环境变量，同步更新 `.env.example` 与相关文档；若新增界面文案，同步更新中英消息。
4. 提交并推送分支，向 `master` 发起 Pull Request。
5. 在 PR 描述中说明变更动机、主要改动与验证方式，并关联相关 Issue。
6. 等待 CI 通过和代码评审；根据评审意见修改时追加新提交，不要强推覆盖评审历史。
7. 合并后删除功能分支。

## 数据库变更

- Prisma schema 与迁移分别位于 `apps/*/prisma/`，各库独立管理。
- 已提交的迁移不要修改；需要调整时新增迁移。
- 跨库数据只通过 ID 引用，不要添加跨库外键。

## 安全问题

请勿通过公开 Issue、PR 或 Discussion 报告安全漏洞。报告方式见 [SECURITY.md](SECURITY.md)。
