# 梗气象台 — 技术栈与测试就绪度要求

> 给另一个 session 的 handoff。此文件**只锁技术栈与代码层面的约束**；产品定位、文案、玩法、商业模型由你们继续讨论。
> 日期：2026-05-27
> 仓库目标：可上线 Vercel + Supabase 的 web app，且作为 `tspr` (D:\lll\localsprite) 的真实 dogfood fixture。

---

## 0. 双目标必须同时满足

1. **能用** — 用户能在 vercel 域名打开真玩到 30 秒 demo（5 屏 + 时间加速器）
2. **可测** — 是 tspr 的高质量 test fixture：覆盖 tspr 当前能力的所有边角（REST + UI flow + auth + 后台任务 + 文件上传 + 实时），让 tspr 跑出来"有内容好测"而不是"测了等于没测"

任何技术选择当两者冲突时，**测试可观察性 > 实现便利**。

---

## 1. 技术栈（锁定，无 alt）

| 层 | 选 | 版本 | 理由 |
|---|---|---|---|
| 框架 | Next.js | 15 (App Router) | tspr 已声明支持 Next.js；SSR + RSC + route handlers 三合一，UI/API 一个仓 |
| 语言 | TypeScript | 5.6+，strict | tspr 的 Node/TS 范围 |
| Runtime | Node | 24 (vercel 默认) | 跟 tspr 同栈；避免 edge runtime（部分库不兼容、debug 难） |
| UI | React | 18 (Next 自带) + Tailwind 4 + shadcn/ui | 主流，tspr UI 探索 agent 对常规 DOM 模式识别最好 |
| 数据库 | Supabase Postgres | 当前 | 锁死 |
| ORM | Drizzle ORM | latest | 类型友好，schema 即代码，迁移文件人类可读（tspr 读 schema 推 PRD 准） |
| 认证 | Supabase Auth | email magic link + GitHub OAuth | 多步流，tspr 的 login fixture 能跑通 |
| 实时 | Supabase Realtime | postgres_changes channel | 屏 1 leaderboard 实时更新 → tspr 测 WebSocket 路径 |
| 存储 | Supabase Storage | bucket: posters/ | 屏 4 海报上传 → tspr 测 file upload |
| 后台任务 | Vercel Cron | 周一 09:00 开盘 / 周日 21:00 结算 | tspr 的 backend test plan 能 enumerate cron endpoint |
| 抓取（mock） | 自写 fetcher service | 多 source 抽象 | 不真打小红书/抖音/B 站 API（合规 + 不稳定）；写一层 fake source 喂 fixture 数据；prod 留 plugin 点 |
| 输入校验 | Zod | latest | 跟 tspr 同栈；tspr 读 schema 推接口契约 |
| 客户端状态 | TanStack Query | v5 | fetch 走它一层，tspr UI agent 拦截 network 时模式统一 |
| 测试本地 | Vitest + Playwright | latest | tspr 生成代码默认用这俩 → fixture 自己也用，免转换成本 |
| 部署 | Vercel | hobby/pro | preview deploy per PR，tspr 可对 preview URL 跑 e2e |
| 包管理 | pnpm | 10+ | tspr fixture 已验过对 pnpm 友好 |

**不用**：tRPC、GraphQL、Redux/Zustand、自研 i18n、edge runtime、Server Actions 的复杂 form 流。理由：每加一层非主流抽象，tspr 的 framework detector + scenario synthesizer 命中率掉一档。

---

## 2. 仓库结构

```
meme-weather/
├── package.json                       # name: meme-weather, type: module
├── next.config.ts                     # serverExternalPackages 列出 sharp 等
├── tsconfig.json                      # strict
├── tailwind.config.ts
├── drizzle.config.ts
├── README.md                          # 必含"how to run locally" + "how to run tspr against this"
├── .env.example                       # 所有 secret 列名（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / etc.）
├── .env.local                         # gitignored
├── app/
│   ├── layout.tsx
│   ├── page.tsx                       # 屏 1: 今日气象
│   ├── meme/[id]/page.tsx             # 屏 2: 单梗详情
│   ├── radar/page.tsx                 # 屏 3: 早期信号雷达
│   ├── settle/[week]/page.tsx         # 屏 4: 结算战绩
│   ├── graveyard/page.tsx             # 屏 5: 梗坟场
│   ├── api/
│   │   ├── memes/route.ts             # GET 候选池 / POST 提名
│   │   ├── memes/[id]/route.ts        # GET 详情
│   │   ├── memes/[id]/bet/route.ts    # POST 押注
│   │   ├── radar/route.ts             # GET 雷达信号
│   │   ├── settle/[week]/route.ts     # GET 结算 / POST trigger（cron 用）
│   │   ├── graveyard/route.ts         # GET 墓碑
│   │   ├── posters/route.ts           # POST 生成海报
│   │   ├── auth/callback/route.ts     # Supabase OAuth callback
│   │   └── cron/[job]/route.ts        # Vercel cron 入口（带 secret header 校验）
│   └── (test)/demo-accelerate/page.tsx # 时间加速器（demo only）
├── components/
│   ├── ui/                            # shadcn 自动生成
│   ├── meme-card.tsx
│   ├── bet-button.tsx
│   ├── leaderboard.tsx
│   └── ...                            # 一个文件一个 component，方便 tspr UI agent 推 interaction
├── lib/
│   ├── db/
│   │   ├── schema.ts                  # Drizzle schema（单文件，所有表）
│   │   ├── client.ts                  # supabase-js + drizzle client
│   │   ├── migrations/                # drizzle-kit 生成
│   │   └── seed.ts                    # 喂确定性 fixture 数据（10 个梗、5 个用户、3 期）
│   ├── auth/
│   │   ├── server.ts                  # createServerClient
│   │   └── client.ts                  # createBrowserClient
│   ├── memes/
│   │   ├── fetcher.ts                 # source 抽象（小红书 / 抖音 / B 站 / 微博）
│   │   ├── sources/
│   │   │   ├── fake.ts                # fixture 数据（默认开发用）
│   │   │   └── *.ts                   # 真 source 留 plugin 点（MVP 不实现）
│   │   ├── score.ts                   # 热度计算 + 赔率
│   │   └── settle.ts                  # 结算逻辑（含 1 个故意 bug，见 §4）
│   ├── validation.ts                  # zod schemas
│   └── env.ts                         # 加载 + zod 验环境变量
├── tspr/                              # tspr 工件目录（gitignored 部分）
│   └── login-fixture.ts               # tspr UI agent 用的登录脚本（提交，非 secret）
├── tests/
│   ├── unit/
│   │   ├── score.test.ts
│   │   └── settle.test.ts             # 必含覆盖 §4 故意 bug 的 case（先红后绿）
│   ├── e2e/
│   │   ├── playwright.config.ts
│   │   ├── bet-flow.spec.ts
│   │   ├── settle-flow.spec.ts
│   │   └── login.spec.ts
│   └── fixtures/
│       └── seed.sql                   # 测试用确定性数据
├── public/
└── scripts/
    ├── db-reset.sh                    # drop + migrate + seed（Win 也要能跑：bash via git for windows）
    ├── tspr-smoke.mjs                 # 一键对本仓库跑 tspr 全链
    └── deploy-preview.sh
```

**强制约束**：
- 不引入 monorepo（单 package，避免 tspr framework detector 困惑）
- 不引入 sub-routes 目录嵌套超过 2 层
- 所有 API route 一个文件 export 一个 method（route.ts 里 `export async function GET/POST/...`），不写 controller 抽象
- 每个 page.tsx 顶部注释一行 "@screen <名字>"，方便 tspr UI agent 推 mental model

---

## 3. 数据模型（最小可玩 + tspr 测试友好）

Drizzle schema 单文件 `lib/db/schema.ts`。Postgres via Supabase。

```ts
// 表清单（仅列名，类型由另一个 session 细化）
users                   // 复用 supabase auth.users + profile 字段（level, coins）
weeks                   // 每周一期：id, opensAt, settlesAt, status
memes                   // id, weekId, title, sourceUrl, firstSeenN, currentN, oddsX, status
bets                    // id, userId, memeId, amount, oddsAtBet, createdAt, settledPayout
signals                 // 雷达里的"还没进池"信号：id, source, candidateTitle, score, addedAt
graveyard               // status='dead' 的 memes 镜像，加 epitaph + flowers
nominations             // 用户提名：id, userId, signalId, week
posters                 // 战绩海报：id, userId, weekId, storagePath
audit_log               // 所有写操作记录（tspr DB snapshot 能查到）
```

**测试友好的 schema 约束**：
- 每张表带 `created_at` + `updated_at`（tspr 报告里 dbSnapshot 时间维度可查）
- 每个 mutate API 都写 `audit_log`（tspr backend test plan 能枚举出"应有 audit 行"的场景）
- 没有 cascade delete（让 tspr 撞到 FK 约束错误时能看到结构化错）

---

## 4. 故意植入的 bug（让 tspr 真有东西可找）

为让 tspr 的 generate_backend_test_plan 和 generate_code_and_execute 跑出来**真发现问题**，植入 **3 个隐 bug**（不在 README 暴露，但写在 `tspr/SEEDED-BUGS.md` 里给 tspr 评估者参考）：

1. **结算时区 off-by-one**：`lib/memes/settle.ts` 用 `new Date()` 而非显式 UTC，导致跨 UTC 边界的 bet 被算到错的 week。tspr 应该能在跨时区 fixture 跑出 fail。
2. **下注金额 race condition**：`POST /api/memes/[id]/bet` 不用 Postgres row lock，并发同用户连续点会扣超用户余额。tspr 可以并发请求复现。
3. **分页 off-by-one**：`GET /api/graveyard?page=N` 用 `offset = page * limit` 而非 `(page-1) * limit`，第 1 页和第 2 页有重叠记录。

每个 bug 写一行注释 `// TSPR-BUG-N` 在源码里（这样修复 PR 能 grep 到）。

---

## 5. tspr 测试就绪度清单（must-have）

仓库交付时必须满足以下 12 条，每条对应 tspr 的一个能力点。**这是验收 fixture 是否合格的检查表**。

| # | 要求 | tspr 能力对应 |
|---|---|---|
| T1 | `pnpm install && pnpm dev` 30s 内启起本地 :3000 | tspr_bootstrap_tests 的 localPort 探活 |
| T2 | `.env.example` 列全所有 env var，注释每个的用途 | tspr_generate_code_summary 推 framework 准 |
| T3 | README 有 "## 给 tspr 跑的话" 一节，含 baseUrl / login fixture 路径 / 已知 seeded bugs 提示 | tspr 入口可读 |
| T4 | `tspr/login-fixture.ts` 实现 tspr UI agent 的 login fixture 契约（ESM default export 见 tspr 的 B-3-17） | tspr UI agent needLogin=true 能跑 |
| T5 | Drizzle schema 单文件，所有表注释完整 | tspr_generate_standardized_prd 推 user stories 准 |
| T6 | 每个 REST endpoint 用 Zod 校验 input，输出有稳定 shape | tspr_generate_backend_test_plan 可枚举 |
| T7 | 至少 3 个 REST endpoint 是 mutate（POST/PUT/DELETE），各有 audit_log 写入 | tspr 的 dbSnapshot 测试覆盖有意义 |
| T8 | 至少 1 个 auth-protected endpoint + 1 个 public endpoint | tspr 的 auth-aware test plan 能区分 |
| T9 | Vercel cron endpoint 用 `CRON_SECRET` header 鉴权，未带头返 401 | tspr 测能区分 cron-only path |
| T10 | seed.ts 生成的数据是确定性的（同 seed 同结果），方便 tspr regression | tspr_rerun_tests 能稳定复跑 |
| T11 | Playwright config + 1 个 sample e2e（bet 流），tspr 能 inspect 现成 test 推风格 | tspr_generate_code_and_execute 学风格 |
| T12 | 部署到 vercel 后 preview URL 能从 README 一键复制到 tspr 的 baseUrl | tspr 跑线上 e2e |

---

## 6. 部署 & CI

- **本地开发**：`pnpm dev`（next dev）+ `pnpm db:reset`（drop+migrate+seed）+ `pnpm db:studio`（drizzle-kit studio）
- **Vercel**：main 分支 → production；其余分支 → preview deploy；Vercel env vars 配 SUPABASE_*, CRON_SECRET 等
- **Supabase**：一个 project，main 分支用 production schema；preview 用 supabase branching（如果用得起 pro tier）或共享 dev DB
- **GitHub Actions**（最小）：
  - on PR：`pnpm install && pnpm lint && pnpm test && pnpm build`
  - **tspr 跑 PR 评论**（V2 加）：preview deploy 完后调 tspr 对 preview URL 跑 backend_test_plan + 一个 e2e，结果作为 PR comment

---

## 7. 给另一个 session 的 4 个决策待你们拍

技术栈我锁了。下面 4 个是产品/内容决策，留你们：

1. **数据来源**：MVP 是 mock fake 数据 ✓（我已假设这条），还是要接 1 个真 source（如自己 RSS 聚合）？
2. **用户系统**：必须登录才能押注，还是允许匿名（cookie 标识）？影响 supabase auth 的紧迫度。
3. **货币机制**：每周固定 100 币重置，还是积累制？影响结算逻辑复杂度。
4. **梗坟场**：纯展示，还是允许写墓志铭（多 1 个 UGC 表）？影响 mutate endpoint 数量。

不答这 4 个我也能 bootstrap 仓库，但前 2 周开发流向会不一样。

---

## 8. 第一次 commit 后能给 tspr 跑出的预期信号

跑 tspr 全链（4 tool）应看到：

- `code_summary.json`：框架识别为 `next.js`，feature areas 至少含 memes / bets / settle / radar / graveyard 5 块
- `standard_prd.json`：user stories 至少 8-12 条（押注、查雷达、看结算、领海报、献花...）
- `backend_test_plan.json`：scenarios 至少 20-30 条，含 happy / negative / auth / race / cron
- `frontend_test_plan.json`：scenarios 至少 15-20 条，含 5 屏导航 + 关键交互 + visual regression
- `generate_code_and_execute`：能跑出 **第 4 节那 3 个 seeded bug 至少 1 个被检出** → 这是 fixture 合格的硬指标

---

## 9. 项目命名

- 仓库名：`meme-weather`
- 包名 (package.json)：`meme-weather`
- 显示名：「梗气象台」(README + 页面 title)
- vercel 域：随便，建议 `meme-weather.vercel.app` 或买短域

---

## 10. 下一步

另一个 session 应该：
1. 看完此文件
2. 拍 §7 那 4 个产品决策
3. `pnpm create next-app@latest meme-weather --typescript --tailwind --app --src-dir=false` 起骨架
4. 按 §2 结构布文件，按 §3 写 schema，按 §4 植 bug
5. 写完最小可跑骨架后告诉我，我（本 session 或后续 session）用 tspr 对它跑一遍，看 §8 信号是否达标
