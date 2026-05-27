# Phase 1 Bootstrap — DUCKPLAN

> 日期：2026-05-27
> 范围：把 PRODUCT-SPEC.md §7.1 的 v0.1 Demo 落地为本地可跑、可点 5 屏、含登录与押注的 Next.js + Supabase 应用。
> 接续：完成后 Phase 2 接真 cron + 部署。

---

## Plan（具体改什么）

1. **DUCKPLAN 本身**：本文件（已在写）
2. **基线配置**：`package.json` / `tsconfig.json` (strict) / `next.config.ts` / `tailwind.config.ts` / `postcss.config.mjs` / `drizzle.config.ts` / `.gitignore` / `.env.example` / `README.md`
3. **依赖安装**：Next 15 + React 18 + TS 5.6 strict + Tailwind 4 + shadcn 基线 + Drizzle + drizzle-kit + postgres / postgres-js + @supabase/ssr + @supabase/supabase-js + Zod + TanStack Query v5 + vitest + @playwright/test + jsdom + @testing-library/react + @testing-library/jest-dom
4. **app 骨架**：`app/layout.tsx` + `app/globals.css` + 5 个 page.tsx（首页/单梗/雷达/结算/坟场）+ 时间加速器 `app/(test)/demo-accelerate/page.tsx`
5. **lib**：
   - `lib/db/schema.ts`（Drizzle，单文件，含 §8 补丁的全部表）
   - `lib/db/client.ts`（Drizzle + postgres-js 双客户端：server-only service-role 一份 + edge-safe anon 一份）
   - `lib/db/seed.ts`（确定性 fixture：3 周 / 30 梗 / 5 用户 / 20 押注 / 5 墓碑）
   - `lib/memes/sources/fake.ts`
   - `lib/memes/score.ts`（含 TSPR-BUG-1：时区 off-by-one）
   - `lib/memes/settle.ts`（含 TSPR-BUG-1 二次触发点）
   - `lib/auth/server.ts` + `lib/auth/client.ts`（Supabase SSR helper）
   - `lib/auth/intent.ts`（OAuth 中断恢复：URL `?intent=...` 或 sessionStorage）
   - `lib/validation.ts`（Zod schemas）
   - `lib/env.ts`（环境变量加载 + Zod 验）
6. **api routes**：
   - `GET /api/memes` 候选池
   - `GET /api/memes/[id]` 单梗
   - `POST /api/memes/[id]/bet` 押注（含 TSPR-BUG-2 race condition）
   - `GET /api/radar` 信号
   - `GET /api/settle/[week]` 结算结果
   - `GET /api/graveyard` 墓碑（含 TSPR-BUG-3 分页 off-by-one）
   - `POST /api/posters` 海报
   - `GET /api/auth/callback` Supabase OAuth callback
   - `POST /api/dev/accelerate` 时间加速器（仅 DEMO_MODE=true）
7. **组件**：`components/ui/*`（shadcn 基线）+ `meme-card.tsx` + `bet-form.tsx` + `certificate-card.tsx` + `heat-chart.tsx` + `auth-modal.tsx` + `weather-header.tsx` + `signal-radar.tsx` + `tombstone.tsx`
8. **测试**：
   - `tests/unit/score.test.ts`：赔率公式
   - `tests/unit/settle.test.ts`：覆盖 TSPR-BUG-1 跨时区
   - `tests/e2e/bet-flow.spec.ts`：未登录点押注 → 弹模态 → 登录后续上 → 诞生证生成
   - `tests/e2e/full-demo.spec.ts`：5 屏 click-through + 时间加速器 → 战绩页
9. **首次 commit**：`feat: phase 1 bootstrap — scaffold + 5 screens + auth + tests`

---

## Expected Outputs（产出物）

完成后 `D:\lll\meme-weather\` 目录有：

- 一份**可跑 `pnpm dev`** 的 Next.js 15 App Router 项目
- 5 屏 + 时间加速器全部可点
- 数据来自 mock fake source（已 seed 到 Supabase）
- 未登录可浏览全部页面；点押注/献花/提名/墓志铭弹 GitHub OAuth 登录
- 登录成功后**自动续上原动作**
- `pnpm test` 单测全绿（含覆盖 TSPR-BUG-1 的 case）
- `pnpm playwright test` e2e 全绿
- `pnpm build` 无错
- 一次干净的 `git commit` 落地
- 三个 TSPR-BUG-N 用 `// TSPR-BUG-N` 注释标记在源码

---

## How To Verify（验证命令）

按顺序执行，全过即 Phase 1 done：

```bash
cd D:/lll/meme-weather

# 1. 依赖齐
pnpm install

# 2. schema 推到 Supabase（用户 .env.local 已就位）
pnpm db:push     # drizzle-kit push

# 3. seed 跑通
pnpm db:seed

# 4. 单测全绿
pnpm test        # vitest run

# 5. 类型 + lint + build 干净
pnpm typecheck
pnpm lint
pnpm build

# 6. e2e 全绿（含登录 + 押注全程）
pnpm playwright install --with-deps
pnpm playwright test

# 7. 手动 demo flow 验收
pnpm dev
# 浏览器开 http://localhost:3000
# - 不登录看 5 屏
# - 点押注 → 弹模态 → GitHub OAuth → 完成押注 → 看金证（待结算样式）
# - 访问 http://localhost:3000/demo-accelerate → 点加速 → 跳战绩页 → 看 payout
```

---

## Probes（快速 JSON probe，并行 cross-check 用）

并行用 `claude --model haiku -p` 拿到关于 schema / 路由 / 组件树的 canonical JSON，对比 §1-§9 spec 是否漂移。

probe 列：

1. **routes-probe**：列出所有 `app/**/page.tsx` 和 `app/**/route.ts`
2. **schema-probe**：从 `lib/db/schema.ts` 提表 + 字段 + 关系
3. **deps-probe**：从 `package.json` 列 prod + dev deps 名单
4. **bug-probe**：grep `// TSPR-BUG-` 必须返 3 条

每个 probe 用一致 schema 比对，不一致直接停下查根因。

---

## Out of Scope（明确不做）

| 项 | 推到 |
|---|---|
| 真 cron job（Vercel Cron 接入） | Phase 2 |
| 跟单系统 | Phase 2 |
| UGC 墓志铭 / 投票 / 留言 | Phase 2 |
| 雷达提名进池 | Phase 2 |
| Vercel 部署 | Phase 3 |
| 真 source 抓取（小红书 / B 站 / 抖音 / 微博） | V1+ |
| Magic link / Google OAuth | V1+（v0.1 仅 GitHub OAuth）|
| 反作弊（行为指纹 / IP 限流外的） | V1+ |
| 季度榜单 / 颁奖 | V1+ |
| 移动端响应式优化 | V1+ |
