# 梗气象台 — 产品 & 玩法规格

> Demo session 产物。**只讲怎么玩 + 怎么运作**。
> 技术栈见 [`TECH-STACK.md`](./TECH-STACK.md)，本文件不重复。
> 日期：2026-05-27
> 配套阅读顺序：先 TECH-STACK §0-§3 → 本文件全部 → TECH-STACK §4-§10。

---

## 0. 一句话产品

> **猜下周哪个梗会火的预测气象局。**
> 你不是赌输赢，是在世界听见这个梗之前先听见。

---

## 1. 4 个产品决策（已拍板，不留 alt）

| # | 决策 | 选 | 一句话理由 |
|---|---|---|---|
| 1 | 数据来源 | **MVP 全 mock（fake source 喂 fixture）** | 真 source 合规+稳定都不达标；上线后再 V2 接 |
| 2 | 用户系统 | **默认完全免登录浏览；触发"保存记录"动作时才弹登录** | 不强求身份就能看气压；只在用户主动留痕时才索取登录 |
| 3 | 货币机制 | **每周固定 100 币重置，不积累** | 防大佬碾压；每周公平开局；老玩家靠"等级+徽章"沉淀，不靠囤币 |
| 4 | 梗坟场 | **UGC 墓志铭（每梗 1 条主墓志铭 + 多人献花）** | 这是这个产品的灵魂屏；情绪沉淀 + 老玩家身份感 |

登录边界（核心原则：**看不要登录，写才要**）：

| 行为 | 是否要登录 |
|---|---|
| 看首页 / 任意梗详情 / 雷达 / 任意历史 settle 周 / 坟场 | ❌ 不需要 |
| 排序、筛选、看曲线、看金证展品、看墓志铭 | ❌ 不需要 |
| **押注**（落档为 bet 记录） | ✅ 需要 |
| **雷达提名**（落档为 nomination） | ✅ 需要 |
| **献花**（落档为 flower 记录） | ✅ 需要 |
| **写墓志铭 / 投票 / 留言** | ✅ 需要 |
| **接受跟单 / 跟人** | ✅ 需要 |

**实现**：所有受保护动作的按钮在未登录时点击 → 弹一个登录模态（GitHub OAuth / Google OAuth 一键，magic link 备用），登录成功后**自动续上原本要做的动作**（中断恢复）。

**没有匿名身份**：访客就是"看客"，零身份；想留下任何痕迹都得登录。这意味着：
- 不发 `anon_uid` cookie
- 不存任何"游客状态"
- 不需要"账号合并"逻辑
- 列表里的所有"@xxx 押了 / 提名了 / 写了墓志铭"都是真名（登录用户）

---

## 2. 玩家旅程

### 2.1 新人首次（60 秒目标）

```
打开首页（无任何门槛 / 弹窗 / 注册引导）
  ↓
浏览本周候选池 30 个梗，看头条气压、排序、筛选
  ↓
点开一个梗 → 看到早期热度 N、24h 曲线、谁在押、谁在跟单
  ↓
点"我也押 10 币" → 第一次触发：弹登录模态（GitHub / Google 一键）
  ↓
登录完成后自动续上押注 → 1.5s 动画 → 梗诞生证 #xxxxx 入个人面板
  ↓
回首页，看到顶栏自己头像 + "还剩 X 天结算，到时收战绩"
```

**关键**：
- **前 30 秒可以纯浏览**——看气压、看梗、看雷达、看坟场、看历史 settle 周，零门槛
- **登录只在用户主动想留痕的瞬间**触发，且登录后**自动续上原动作**（不是登录完叫用户重新点一遍）
- 这游戏的"30 秒钩子"是**看气压面板就有意思**，押注是加深；登录只在加深时才出现

### 2.2 老玩家循环（7 天循环）

```
周一 09:00  推送"本周开盘"
  ↓
周一-周二  花配额下注（多数玩家集中在这两天）
  ↓
周三-周五  滚动调仓 + 雷达扫早期信号 + 提名进池
  ↓
周六晚    最后下注高峰（"还有 24h"焦虑驱动）
  ↓
周日 21:00 审议会直播（30min，自带内容属性）
  ↓
周日 21:30 战绩海报推送 → 玩家分享朋友圈/小红书
  ↓
周一 08:00 老玩家"预热扫雷达"为下期做嗅觉
```

### 2.3 进阶玩家（季度循环）

```
每周    主线周赛参与 +「滚动池」长线押"X 月之前会破圈"
  ↓
月末   月榜公示（前 50 名）
  ↓
季末   季度颁奖：Top 10「梗气象学家」上墙 + 限定徽章 + 媒体合作露出（如有）
  ↓
跟单   等级 ≥ Lv.5 解锁"接受跟单"，跟单费 5% 抽成入囊
```

---

## 3. 五屏玩法详解

路由对照 TECH-STACK §2，每屏给"做什么 / 关键交互 / 数据来源 / 测试钩子"。

### 屏 1 · `/` 今日气象（首页）

**做什么**：本周候选池 30 个梗 + 实时气压头条 + 倒计时

**关键交互**：
- 表格点排序（按热度 / 按赔率 / 按上升速度）
- 点单条 → 跳屏 2
- 头部"高压区 / 低压区 / 异常涡旋"3 卡片是策展位（编辑钦点）
- 实时频道：当有人押注/有新梗诞生证生成，首页右侧滚动条 "@xxxxx 刚押了「太极」10 币"

**数据**：当前 week 的 `memes` + `weeks.opensAt/settlesAt` + Realtime `bets` channel

**测试钩子**：T1 启动 + T6 GET /api/memes 校验 + 实时频道 e2e

### 屏 2 · `/meme/[id]` 单梗详情

**做什么**：押注主战场

**关键交互**：
- 显示当前 N、24h 热度曲线、跨平台分布
- 押注框：输入金额（1-余额）、显示赔率、显示"诞生证 N 值预览"
- 「跟 @xxxx 一键 mirror」按钮（如该梗已有 KOL 押）
- "查看坟场" 链接（如该梗状态变 dead）

**数据**：`memes` + 派生热度指数 + `bets` aggregate

**测试钩子**：T6 POST /api/memes/[id]/bet + T7 audit_log 写入 + 跟单 e2e

### 屏 3 · `/radar` 早期信号雷达

**做什么**：发现还没进池的早期梗

**关键交互**：
- 三档展示：🔴 异常上升 / 🟡 边缘信号 / 🟢 监视中
- 每条卡片显示来源（B 站待爆区 / 小红书 / 微博 / 抖音）、24h 增速、作者画像
- 「提名进本周池」按钮 → 未登录则弹登录模态（每周登录用户配额 2）
- 「收藏」按钮 → 同样要登录（落档为个人记号）

**数据**：`signals` 表 + 评分算法见 §5.3

**测试钩子**：T6 GET /api/radar + T8 POST /api/radar/nominate（auth 必需）

### 屏 4 · `/settle/[week]` 结算战绩

**做什么**：周日 21:00 自动跳转 / 复盘任意历史期

**关键交互**：
- 该周押注列表 + 命中状态 + 收益
- 金证展示（命中的梗，配 N₀ 和 N_final）
- 编辑钦点解释卡（哪些是人工加分判定，附理由）
- 翻车纪念（押了但凉了的）
- 「生成分享海报」按钮 → 屏 4.5

**数据**：`bets` (where weekId=X & settledPayout!=null) + `memes` 终态

**测试钩子**：T6 GET /api/settle/[week] + 故意 bug §4.1 (TSPR-BUG-1 时区) 在此触发

### 屏 4.5 · 战绩海报（弹层 / 子路由）

**做什么**：自动生成分享图

**关键交互**：
- 模板：金证主视觉 + 战绩数字 + 跑赢 X% 玩家文案 + 二维码
- 一键下载 PNG / 一键复制小红书文案
- 海报记录到 `posters` 表，下次进 settle 页可重新下载

**测试钩子**：T6 POST /api/posters + Supabase Storage 上传 + 图片对比 e2e

### 屏 5 · `/graveyard` 梗坟场

**做什么**：失败梗永久档案 + UGC 墓志铭

**关键交互**：
- 列表展示：墓碑编号、梗名、生卒日、最高热度、看好人数
- 点墓碑展开：墓志铭（一条主，主由首位押注最多的玩家写，可被票多者覆盖）+ 献花数 + 留言列表
- 「献花」「写墓志铭」「投票」「留言」全部需登录（点了未登录则弹模态）
- 翻页：分页 20/页（**故意 bug TSPR-BUG-3 off-by-one 在这**）

**数据**：`graveyard` 表 + `memes` join

**测试钩子**：T7 audit_log（献花 / 墓志铭）+ 分页 race + 故意 bug §4.3 复现

### 屏 X · `/(test)/demo-accelerate` 时间加速器（仅 demo）

**做什么**：演示用，跳过真实一周

**关键交互**：
- 一颗按钮"加速到周日结算"
- 服务端把"当前 week 的 settlesAt 改成 now-1min"，触发 settle job
- 3 秒动画 → 跳屏 4

**用途**：给看 demo 的人 30 秒走完一周。**线上 prod 关闭此路由**（环境变量 `DEMO_MODE=true` 才挂载）。

**测试钩子**：e2e 跑全 demo flow，单测确认 prod 时此路由 404

---

## 4. 运作循环（周/日/小时 三层时钟）

### 4.1 周时钟（主线）

| 时点 | 触发 | 做什么 |
|---|---|---|
| **周一 09:00** | Vercel Cron `/api/cron/open-week` | 创建 new `week` 行；从 signals 池 + 算法挖 + 编辑标记 共 30 个候选写入 memes |
| **周一-周六** | 玩家自主 | 下注 / 调仓 / 雷达提名 |
| **周日 21:00** | Vercel Cron `/api/cron/settle-week` | 锁定当周 week.status=`settling`；跑硬指标判定；调用编辑加分接口；写入每个 meme 终态；批量算 payout 写回 bets |
| **周日 21:00-21:30** | 编辑直播窗口 | 30 分钟人工窗口：编辑通过 `/api/admin/judge` 钦点/否决；超时自动锁死纯硬指标结果 |
| **周日 21:30** | Vercel Cron `/api/cron/finalize-week` | 锁定 week.status=`settled`；生成所有玩家海报；推送通知 |

### 4.2 日时钟

| 时点 | 触发 | 做什么 |
|---|---|---|
| **每小时整点** | Vercel Cron `/api/cron/refresh-heat` | 重算所有活跃 meme 的 currentN（mock 模式从 fake source 拉新值）|
| **每 6 小时** | Vercel Cron `/api/cron/scan-signals` | 扫早期信号源，更新 `signals` 表 |
| **每日 08:00** | Vercel Cron `/api/cron/digest` | 给所有已登录且开启"日报推送"的用户发当日气压邮件 |

### 4.3 小时/秒时钟

- **押注/取消**：实时写库 + Realtime 广播
- **诞生证**：押注瞬间快照 N 值，存入 `bets.firstNAtBet`（需要在 schema 加这一列，见 §8 补丁建议）
- **跟单**：被跟方下注 → 队列消息 → 跟单方 mirror 一笔（带 5% 抽成给被跟方）

---

## 5. 核心机制深挖

### 5.1 货币与赔率

**初始**：每周一刷 100 币，未用完归零。

**赔率公式**（写入 `lib/memes/score.ts`）：

```
odds = clamp(
  base_odds(meme.currentN),    // 当前热度越低，base 越高
  1.2,                         // 下限：防"必中也赚"
  10.0                         // 上限：防长尾过度奖励
)

base_odds(N) = 1 + (10 / log10(N + 100))
```

**例**：
- N=1k → odds ≈ 4.3x
- N=10k → odds ≈ 3.5x
- N=100k → odds ≈ 3.0x
- N=1M → odds ≈ 2.7x

**押注瞬间锁赔率**：`bets.oddsAtBet` 存下注当时赔率，结算用此而非最新。

**Payout**：
- 命中：`amount * oddsAtBet`
- 未中：0
- 编辑钦点命中：`amount * oddsAtBet * 0.7`（钦点比硬指标命中折扣 30%，避免"瞎押也能赢"）

### 5.2 破圈判定（硬 + 软）

**硬指标**（自动判，满足任一即破圈）：
1. 微博热搜入榜（任意时长）
2. 跨 ≥3 主流平台 hashtag 各 > 50w（B 站 / 抖音 / 小红书 / 微博 / Twitter 各算一个）
3. 全网搜索指数 7 日均增速 > 300%

**编辑加分**（人工，公开理由）：
- 周日 21:00-21:30 直播窗口
- 编辑可对未达硬指标的梗"钦点为破圈"，必须给文字理由（写入 `weeks.editorialNotes`）
- 也可对达标但"明显刷的"梗否决（极少使用）
- 钦点 ≤ 3 个/周

**判定接口签名**：

```ts
// lib/memes/settle.ts
type Verdict = { memeId: number, outcome: 'broke'|'dead', source: 'hard'|'editorial', note?: string };

async function settleWeek(weekId: number): Promise<Verdict[]>
```

**故意 bug TSPR-BUG-1 嵌在这**：函数里用 `new Date()` 而非 UTC，导致跨日 bet 算错周。

### 5.3 早期信号雷达评分

`signals` 表每条带：

```
signal_score = w1 * growth_24h + w2 * cross_platform_count + w3 * author_low_follower_bonus - w4 * age_decay
```

权重：w1=0.5, w2=0.3, w3=0.15, w4=0.05

**门槛**：
- 🔴 异常上升：score > 80
- 🟡 边缘信号：50 < score <= 80
- 🟢 监视中：30 < score <= 50

提名进池：每周登录用户 2 次配额；进池后写 `nominations` 表 + 该 meme 显示「@xxx 提名」徽章。

### 5.4 跟单系统

**前置条件**：被跟方等级 ≥ Lv.5，且必须登录账号。

**机制**：
- 跟单方点"跟 @X"按钮 → 写 `follows` 表（关系表，见 §8 补丁）
- 跟单方设置：每笔自动 mirror 上限（默认 10 币）
- 被跟方下注 → 异步触发跟单 fan-out：
  - 取该 KOL 所有 follower
  - 对每个 follower 检查余额、上限、本周已 mirror 次数（防压榨配额）
  - 满足条件则插入一笔 bet（标记 `bets.mirrorOfBetId` = 源 bet）
  - 5% 抽成：扣 follower 的 amount * 0.05 转 KOL 余额（不另收钱，从押金里扣）
- 跟单方收益独立结算（按各自 oddsAtBet）

**防霸榜**：
- 单 KOL 最多 100 个 follower（超出排队等待）
- 单 follower 最多跟 3 个 KOL
- 跟单 24h 冷却：刚 follow 不能立即 mirror，防 sandwich attack

### 5.5 梗诞生证

**生成时机**：押注成功的事务里写入。

**存储**：在 `bets` 表加 `firstNAtBet` (int) + `certificateId` (string, uuid-short)。

**展示规则**：
- 押注当下：状态「等待破圈」，灰色样式
- 结算后命中：状态「金证」，金色边框 + 该梗最终 N 值 + "你是第 X 个押注者"
- 结算后未中：状态「悼念」，褪色样式 + 链向梗坟场该墓碑

**炫耀触发器**：金证页面带"复制为图片"按钮，复制后是带水印的 PNG。

### 5.6 梗坟场 UGC

**死梗入坟条件**：结算时 outcome=dead 且 currentN ≥ 1000（太小的梗不立碑，避免坟场垃圾化）。

**墓志铭机制**：
- 该梗首批押注者（前 10 名）有 24h 优先撰写期
- 期满后任何登录用户可投稿，最高赞墓志铭上墙（每 7 天结算一次替换）
- 墓志铭上限 100 字

**献花**：需登录，每墓碑每用户每日 1 次。献花数显示在墓碑上。未登录点献花 → 弹登录模态，登录后自动完成献花。

**留言**：需登录，限 50 字。

---

## 6. 状态机

### 6.1 Week

```
draft  ──[周一 09:00 cron]──>  open
open   ──[周日 21:00 cron]──>  settling
settling ──[21:30 cron / 编辑超时]──> settled
settled  (终态)
```

### 6.2 Meme

```
nominated ──[小编 / 算法选入]──> in_pool
in_pool  ──[周日结算: 硬指标 OR 编辑钦点]──> broke
in_pool  ──[周日结算: 都未达]──> dead
dead     ──[currentN ≥ 1000]──> in_graveyard
```

### 6.3 Bet

```
placed ──[结算: 命中]──> won (payout > 0)
placed ──[结算: 未中]──> lost (payout = 0)
placed ──[结算前 12h 内]──> cancellable (用户可撤回，扣 10% 手续费)
```

### 6.4 User

**访客**不存在状态机——没记录、没身份、没 cookie。

```
（访客无状态）
  ↓ [首次触发保存动作 → OAuth 登录]
account_created
  ↓ [累计命中数 ≥ N²，N 从 1 到 10]
level_up (Lv.N)
  ↓ [Lv.5 达成 + 主动开启"接受跟单"]
active_kol
```

**等级**：按累计正确押注数计算。Lv.N 需要 N² 次命中（Lv.1 需 1，Lv.5 需 25，Lv.10 需 100）。

---

## 7. Demo 范围切片（三层）

### 7.1 **v0.1 Demo（30 秒可玩，一周内可上线）**

**目标**：让看 demo 的人 30 秒走完一周循环，相信"这游戏好玩"。

**必须**：
- 5 屏完整可点（首页 / 单梗 / 雷达 / 结算 / 坟场）—— 浏览全程零门槛
- 全部 mock 数据（fake source 喂 10 个梗、5 个用户、3 期）
- 时间加速器路由可用
- **Supabase Auth 最简版**：GitHub OAuth 一键登录已上线（demo 看客点押注时弹出）
- 押注 + 诞生证生成 + 登录后自动续上原动作
- 海报生成（即使是预渲染的，1-2 个模板就行）
- Vercel 部署可访问

**不需要**：
- 真实 cron（用时间加速器代替）
- 跟单
- UGC 墓志铭（坟场展示静态文案即可，献花按钮可点但走登录后变 no-op）
- 雷达提名（雷达可看不可操作）
- Magic link / Google OAuth（GitHub 单端就够 demo）

**验收**：随便找一个没看过这个项目的人，给 URL，30 秒内能不能完成"押注 → 加速 → 看战绩"全流程并说"好玩"。

### 7.2 **v0.5 一期完整闭环（2-3 周）**

**目标**：跑完真实一周（周一 → 周日），含真实 cron 触发。

**新增**：
- Vercel Cron 全部 4 个 job 上线（open-week / refresh-heat / scan-signals / settle-week / finalize-week）
- Supabase Auth（email magic link）
- 跟单系统（最小：1 KOL + N follower）
- UGC 墓志铭 + 献花
- 雷达提名进池
- 编辑后台（一个最小 admin 页面，密码保护）

**验收**：
- 真跑一周，全自动产出 settled week
- tspr 跑全链，§5 T1-T12 全过
- §4 那 3 个故意 bug 至少 1 个被 tspr 检出

### 7.3 **v1 完整产品（1-2 个月）**

**新增**：
- 跨平台真 source 接入（先 1 个：微博 / 小红书 / B 站 三选一）
- GitHub OAuth
- 季度榜单 + 颁奖逻辑
- 推送通知（邮件 + web push）
- 移动端响应式优化
- 反作弊（IP 限流、行为指纹、刷子检测）

---

## 8. 对 TECH-STACK schema 的补丁建议

TECH-STACK §3 的表清单需要这些字段/表补丁才能跑通本规格：

| 表 | 字段 | 用途 |
|---|---|---|
| `bets` | `+ firstNAtBet int` | 梗诞生证快照 |
| `bets` | `+ certificateId text` | 诞生证编号 |
| `bets` | `+ mirrorOfBetId int null` | 跟单溯源 |
| `bets` | `+ cancelledAt timestamp null` | 撤回功能 |
| `memes` | `+ currentN int` | 实时热度（已在但需确认 cron 维护） |
| `memes` | `+ verdictSource enum('hard','editorial','dead')` | 区分硬指标命中 vs 钦点 |
| `weeks` | `+ editorialNotes jsonb` | 编辑钦点理由（公开） |
| `graveyard` | `+ epitaph text` | 主墓志铭 |
| `graveyard` | `+ epitaphAuthorId int` | 撰写者 |
| **`follows`**（新表） | `kolId, followerId, mirrorCap, createdAt` | 跟单关系 |
| **`epitaph_votes`**（新表） | `graveyardId, userId, voteWeight` | 墓志铭投票 |
| **`flowers`**（新表） | `graveyardId, userId, createdAt` | 献花记录 |
| `audit_log` | `+ action enum` | 跟单 / 钦点 / 墓志铭等都要写 |

---

## 9. 反作弊与边界

### 9.1 必须

- **读端口 IP 限速**：每 IP 每分钟 ≤ 120 次 GET，超出 429（防爬）
- **写端口登录限速**：每用户每分钟 ≤ 30 次 mutate，超出 429（押注/提名/献花/留言共享配额）
- **押注同梗冷却**：同 user 同 meme 两次押注间隔 ≥ 10 秒
- **跟单 fan-out 限流**：单 KOL 触发 fan-out 时，每秒最多 10 笔 mirror
- **政治/敏感梗黑名单**：候选池/雷达入池前关键词检查（中文敏感词库 + 人工 review queue）

### 9.2 V2 再做

- 行为指纹反小号
- 跟单 PnL 异常告警
- 编辑钦点的审计权重（让编辑相互制衡，防一人说了算）

---

## 10. 下一步给 bootstrap session

1. 看完 TECH-STACK.md + 本文件
2. 按 TECH-STACK §10 起骨架
3. 按 §8 补丁修 schema
4. 实现优先级：屏 1 > 时间加速器 > 屏 2 押注 > 诞生证 > 屏 4 结算 > 屏 5 坟场静态 > 屏 3 雷达静态
5. v0.1 demo 跑通后通知本 session（或 tspr session）跑验收
6. v0.5 阶段再做 cron + Auth + UGC + 跟单
