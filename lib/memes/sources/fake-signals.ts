/**
 * 早期信号雷达 mock — 按 kind 分类。
 *
 * 梗信号 = 还没大火但已经在边缘扩散的模板/句式 (B站待爆区 / 小红书冷启动)。
 * 话题信号 = 还没上热搜但提及量陡升的娱乐事件 (微博暖搜 / 抖音上升)。
 *
 * Phase 2 真 source 接入时这层换成真抓取，UI 不变。
 */

export type FakeSignal = {
  source: 'bilibili' | 'douyin' | 'xhs' | 'weibo' | 'twitter';
  kind: 'meme' | 'topic';
  candidateTitle: string;
  /** 0-100 综合分；tier 由 score 划档：red>=80, 50<=yellow<80, green<50 */
  score: number;
  tier: 'red' | 'yellow' | 'green';
  authorHandle: string | null;
  authorFollowers: number | null;
  /** 24h 增速倍数 */
  growth24h: number;
};

export const FAKE_MEME_SIGNALS: FakeSignal[] = [
  {
    source: 'bilibili',
    kind: 'meme',
    candidateTitle: '"X 也是有上限的"反讽体',
    score: 92,
    tier: 'red',
    authorHandle: '@老六本六',
    authorFollowers: 1_820,
    growth24h: 4.8,
  },
  {
    source: 'xhs',
    kind: 'meme',
    candidateTitle: '"我妈让我先 X 再 Y"',
    score: 76,
    tier: 'yellow',
    authorHandle: '@老母亲日记',
    authorFollowers: 12_400,
    growth24h: 2.1,
  },
  {
    source: 'douyin',
    kind: 'meme',
    candidateTitle: '"X，但是 Y" 反差体',
    score: 64,
    tier: 'yellow',
    authorHandle: '@错位男孩',
    authorFollowers: 8_100,
    growth24h: 1.7,
  },
  {
    source: 'bilibili',
    kind: 'meme',
    candidateTitle: '"内娱已经 X 到 Y 了"',
    score: 41,
    tier: 'green',
    authorHandle: '@饭圈老妖',
    authorFollowers: 940,
    growth24h: 0.6,
  },
  {
    source: 'weibo',
    kind: 'meme',
    candidateTitle: '"X 我的命名权我做主"',
    score: 35,
    tier: 'green',
    authorHandle: null,
    authorFollowers: null,
    growth24h: 0.5,
  },
];

export const FAKE_TOPIC_SIGNALS: FakeSignal[] = [
  {
    source: 'weibo',
    kind: 'topic',
    candidateTitle: 'X 顶流 12 月新综艺录制路透',
    score: 88,
    tier: 'red',
    authorHandle: '@娱记狙击手',
    authorFollowers: 240_000,
    growth24h: 5.6,
  },
  {
    source: 'douyin',
    kind: 'topic',
    candidateTitle: '《X 短剧 II》开机消息',
    score: 71,
    tier: 'yellow',
    authorHandle: '@短剧情报站',
    authorFollowers: 84_000,
    growth24h: 2.4,
  },
  {
    source: 'xhs',
    kind: 'topic',
    candidateTitle: 'X 选秀总决赛投票数曲线',
    score: 58,
    tier: 'yellow',
    authorHandle: '@饭圈数据',
    authorFollowers: 41_000,
    growth24h: 1.9,
  },
  {
    source: 'bilibili',
    kind: 'topic',
    candidateTitle: 'X 游戏新版本前瞻直播预约',
    score: 47,
    tier: 'green',
    authorHandle: '@米家老大',
    authorFollowers: 18_400,
    growth24h: 1.2,
  },
  {
    source: 'weibo',
    kind: 'topic',
    candidateTitle: '《X 电影》定档传闻',
    score: 32,
    tier: 'green',
    authorHandle: '@电影手册',
    authorFollowers: 6_700,
    growth24h: 0.7,
  },
];

export const ALL_FAKE_SIGNALS: FakeSignal[] = [...FAKE_MEME_SIGNALS, ...FAKE_TOPIC_SIGNALS];
