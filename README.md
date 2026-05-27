# 梗气象台 · Meme Weather

> 猜下周哪个梗会火的预测气象局。你不是赌输赢，是在世界听见这个梗之前先听见。

## 本地启动

```bash
pnpm install
cp .env.example .env.local      # 填入你的 Supabase keys
pnpm db:push                    # 推 schema 到 Supabase
pnpm db:seed                    # 灌入确定性 fixture
pnpm dev                        # http://localhost:3000
```

## 主要路由

| 路径 | 屏 |
|---|---|
| `/` | 屏 1 · 今日气象（候选池） |
| `/meme/[id]` | 屏 2 · 单梗详情 + 押注 |
| `/radar` | 屏 3 · 早期信号雷达 |
| `/settle/[week]` | 屏 4 · 结算战绩 |
| `/graveyard` | 屏 5 · 梗坟场 |
| `/demo-accelerate` | 时间加速器（仅 `DEMO_MODE=true`）|

## 测试

```bash
pnpm typecheck            # tsc --noEmit
pnpm test                 # vitest 单测
pnpm playwright:install   # 一次性下载 chromium
pnpm playwright           # e2e
```

## 给 tspr 跑的话

baseUrl 用本地 `http://localhost:3000` 或 vercel preview URL。

- Login fixture：见 `tspr/login-fixture.ts`（GitHub OAuth via Supabase）
- 已知 seeded bugs：见 `tspr/SEEDED-BUGS.md`，需要 tspr 自主发现
- Schema：`lib/db/schema.ts` 单文件
- API contract：所有 route handler 用 Zod 校验

## 设计文档

- [`TECH-STACK.md`](./TECH-STACK.md) — 技术栈锁定
- [`PRODUCT-SPEC.md`](./PRODUCT-SPEC.md) — 玩法与运作
- [`docs/plans/`](./docs/plans/) — 各 phase 的 DUCKPLAN

## 当前阶段

**Phase 1 — Bootstrap demo**：5 屏 + 时间加速器 + 登录护栏 + 测试。无真 cron，无跟单，无 UGC。
