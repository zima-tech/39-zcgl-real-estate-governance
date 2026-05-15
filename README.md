# Zima Demo 41

基于相邻项目 `zima-demo-3` 初始化的 Next.js 管理后台骨架。

## 技术栈

- Next.js 16 / React 19
- Ant Design 6 / Tailwind CSS 4
- Drizzle ORM
- Turso/libSQL
- Bun

## 已保留模块

- 登录 / 退出 / 会话
- 用户管理
- 角色管理
- 日志审计

数据集合、费用管控、智能荐房、公寓前台等业务模块目前只保留空白入口，等待后续需求补齐页面、API 和数据模型。

## 本地启动

```bash
bun install
bun run dev
```

默认开发端口沿用源项目配置：`http://localhost:8001`。

Turso 连接配置在 `.env.local` 中，本文件已被 `.gitignore` 忽略。

## 默认账号

- `root` / `root123456`
- `demo.admin01` / `seeded-admin-123456`
- `demo.user01` / `seeded-user-123456`

生产环境请设置 `ADMIN_ROOT_PASSWORD`，避免使用开发默认密码初始化 root 账号。

## 常用命令

```bash
bun run dev
bun run build
bun run lint
bun run format
bun run db:generate
bun run db:push
```
