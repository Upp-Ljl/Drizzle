/**
 * 热点话题 mock 数据 — 娱乐事件，预测会否在周日前破阈值。
 *
 * 每条带：
 *  - title: 简短显示名（如 "X 综艺第三季"）
 *  - topicQuestion: 完整 Y/N 疑问句（用户押的就是这个）
 *  - thresholdN: 周日前 currentN 要达到的指标
 *  - currentN: 当前 mention/讨论指标
 *
 * 全部偏娱乐向 — 综艺 / 演唱会 / 影视 / 网红 / 游戏，不碰政治财经。
 */

export type FakeTopic = {
  title: string;
  slug: string;
  sourcePlatform: 'bilibili' | 'douyin' | 'xhs' | 'weibo' | 'twitter' | 'other';
  topicQuestion: string;
  thresholdN: number;
  currentN: number;
  firstSeenN: number;
  tickerBlurb: string | null;
};

/** 本周（47）候选话题 */
export const FAKE_TOPICS_CURRENT: FakeTopic[] = [
  {
    title: '《心动的信号 6》大结局',
    slug: 'xindong-6-finale',
    sourcePlatform: 'weibo',
    topicQuestion: '周日 24:00 前会进微博热搜 top10 吗？',
    thresholdN: 800_000,
    currentN: 620_000,
    firstSeenN: 84_000,
    tickerBlurb: '@综艺观察家 押 40 币',
  },
  {
    title: '周深 跨年单曲',
    slug: 'zhou-shen-new-year',
    sourcePlatform: 'weibo',
    topicQuestion: '上线 72h 内 QQ音乐评论数会破 100k 吗？',
    thresholdN: 1_000_000,
    currentN: 412_000,
    firstSeenN: 32_000,
    tickerBlurb: null,
  },
  {
    title: '《XX 我们离婚吧》大爆款短剧',
    slug: 'duanju-divorce',
    sourcePlatform: 'douyin',
    topicQuestion: '周日前累计播放量会破 5 亿吗？',
    thresholdN: 5_000_000,
    currentN: 3_200_000,
    firstSeenN: 480_000,
    tickerBlurb: '@梗象先生 押 30 币',
  },
  {
    title: 'X 顶流明星新综艺路透',
    slug: 'top-star-new-variety',
    sourcePlatform: 'xhs',
    topicQuestion: '周末三天会上小红书热点榜 top5 吗？',
    thresholdN: 600_000,
    currentN: 287_000,
    firstSeenN: 18_000,
    tickerBlurb: null,
  },
  {
    title: '《原神》新角色 X 复刻',
    slug: 'genshin-rerun-x',
    sourcePlatform: 'bilibili',
    topicQuestion: 'B 站二创视频数 24h 内会破 5000 吗？',
    thresholdN: 800_000,
    currentN: 412_000,
    firstSeenN: 9_400,
    tickerBlurb: '@米家老大 押 20 币',
  },
  {
    title: 'X 网红 X 月生日直播',
    slug: 'kol-birthday-live',
    sourcePlatform: 'douyin',
    topicQuestion: '直播间峰值同时在线会破 200w 吗？',
    thresholdN: 400_000,
    currentN: 87_000,
    firstSeenN: 6_400,
    tickerBlurb: null,
  },
  {
    title: '《XX 大电影》开画首日',
    slug: 'movie-x-opening-day',
    sourcePlatform: 'weibo',
    topicQuestion: '开画首日票房会破 8000 万吗？',
    thresholdN: 700_000,
    currentN: 156_000,
    firstSeenN: 21_000,
    tickerBlurb: null,
  },
  {
    title: 'X 选秀总决赛',
    slug: 'xz-final',
    sourcePlatform: 'weibo',
    topicQuestion: '总决赛投票数会破 1 亿吗？',
    thresholdN: 900_000,
    currentN: 412_000,
    firstSeenN: 41_000,
    tickerBlurb: '@偶像分析师 押 35 币',
  },
];

/** 上一期已破阈值（破圈成功） */
export const FAKE_TOPICS_PRIOR_BROKE: FakeTopic[] = [
  {
    title: '《XX 演唱会》全国巡演开票',
    slug: 'concert-tour-opening',
    sourcePlatform: 'weibo',
    topicQuestion: '开票 1h 内全场售罄吗？',
    thresholdN: 1_500_000,
    currentN: 3_200_000,
    firstSeenN: 412_000,
    tickerBlurb: null,
  },
];

/** 上一期未达阈值（凉了） */
export const FAKE_TOPICS_PRIOR_DEAD: FakeTopic[] = [
  {
    title: '《XX 时尚盛典》红毯',
    slug: 'fashion-gala-redcarpet',
    sourcePlatform: 'weibo',
    topicQuestion: '红毯当晚会上热搜 top10 吗？',
    thresholdN: 800_000,
    currentN: 184_000,
    firstSeenN: 23_000,
    tickerBlurb: null,
  },
  {
    title: 'X 网红首次直播带货',
    slug: 'kol-first-live-sale',
    sourcePlatform: 'douyin',
    topicQuestion: '首场 GMV 会破千万吗？',
    thresholdN: 500_000,
    currentN: 87_000,
    firstSeenN: 9_400,
    tickerBlurb: null,
  },
];
