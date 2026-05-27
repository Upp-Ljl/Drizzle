/**
 * Fake meme source — deterministic seed data for Phase 1.
 *
 * In Phase 2+, real sources (xhs, bilibili, douyin, weibo) get plug-in here.
 * fake.ts is what the app uses as long as `MEME_SOURCE=fake` (default in dev).
 */

export type FakeMemeSeed = {
  title: string;
  slug: string;
  sourcePlatform: 'bilibili' | 'douyin' | 'xhs' | 'weibo' | 'twitter' | 'other';
  firstSeenN: number;
  currentN: number;
  tickerBlurb: string | null;
};

export const FAKE_MEMES_CURRENT_WEEK: FakeMemeSeed[] = [
  {
    title: '上海地铁早高峰太极',
    slug: 'sh-metro-taichi',
    sourcePlatform: 'douyin',
    firstSeenN: 12_432,
    currentN: 1_240_000,
    tickerBlurb: '@梗象先生 押 50 币 ← 158 人跟单',
  },
  {
    title: '拉布拉多西装哥',
    slug: 'lab-suit-bro',
    sourcePlatform: 'bilibili',
    firstSeenN: 8_700,
    currentN: 322_000,
    tickerBlurb: '@早盘哥 押 20 币',
  },
  {
    title: '"老板这碗面多少钱"',
    slug: 'how-much-this-noodle',
    sourcePlatform: 'douyin',
    firstSeenN: 3_140,
    currentN: 84_200,
    tickerBlurb: '@面神 押 10 币',
  },
  {
    title: '哈尔滨大澡堂打工人',
    slug: 'harbin-bath-worker',
    sourcePlatform: 'xhs',
    firstSeenN: 2_810,
    currentN: 56_300,
    tickerBlurb: null,
  },
  {
    title: '广州糖水阿姨',
    slug: 'gz-sugar-water-auntie',
    sourcePlatform: 'xhs',
    firstSeenN: 1_900,
    currentN: 41_200,
    tickerBlurb: null,
  },
  {
    title: '"我妈让我去考公"',
    slug: 'mom-civil-servant',
    sourcePlatform: 'bilibili',
    firstSeenN: 1_800,
    currentN: 980_000,
    tickerBlurb: '@编辑标记: 跨平台覆盖足',
  },
  {
    title: '深圳地铁打瞌睡叠罗汉',
    slug: 'sz-metro-stack-nap',
    sourcePlatform: 'weibo',
    firstSeenN: 4_120,
    currentN: 14_300,
    tickerBlurb: null,
  },
  {
    title: '凌晨四点的烧烤摊摄影展',
    slug: 'dawn-bbq-photo',
    sourcePlatform: 'xhs',
    firstSeenN: 920,
    currentN: 7_500,
    tickerBlurb: null,
  },
  {
    title: '"对工资期望值"灵魂回答',
    slug: 'salary-expectation-soul',
    sourcePlatform: 'douyin',
    firstSeenN: 6_700,
    currentN: 130_000,
    tickerBlurb: '@老韭菜 押 30 币',
  },
  {
    title: '丈母娘式 KOL 评测',
    slug: 'mil-style-review',
    sourcePlatform: 'bilibili',
    firstSeenN: 510,
    currentN: 2_100,
    tickerBlurb: null,
  },
];

export const FAKE_MEMES_PRIOR_WEEK_BROKE: FakeMemeSeed[] = [
  {
    title: '"周五还在加班的程序员鱼"',
    slug: 'friday-overtime-fish',
    sourcePlatform: 'weibo',
    firstSeenN: 3_400,
    currentN: 2_800_000,
    tickerBlurb: null,
  },
  {
    title: '社畜版佛跳墙',
    slug: 'shechu-fotiaoqiang',
    sourcePlatform: 'douyin',
    firstSeenN: 8_900,
    currentN: 1_750_000,
    tickerBlurb: null,
  },
];

export const FAKE_MEMES_PRIOR_WEEK_DEAD: FakeMemeSeed[] = [
  {
    title: '"杭州西湖人鱼船夫"',
    slug: 'hz-merman-boatman',
    sourcePlatform: 'xhs',
    firstSeenN: 5_200,
    currentN: 84_200,
    tickerBlurb: null,
  },
  {
    title: '咖啡馆方言挑战赛',
    slug: 'cafe-dialect-challenge',
    sourcePlatform: 'bilibili',
    firstSeenN: 2_100,
    currentN: 12_400,
    tickerBlurb: null,
  },
  {
    title: '"地铁让座之歌"翻唱',
    slug: 'metro-seat-song',
    sourcePlatform: 'weibo',
    firstSeenN: 1_400,
    currentN: 7_300,
    tickerBlurb: null,
  },
];

export const FAKE_SIGNALS = [
  {
    source: 'bilibili' as const,
    candidateTitle: '"考公焦虑互助会"',
    score: 92,
    tier: 'red' as const,
    authorHandle: '@小张今天又卷了',
    authorFollowers: 1_820,
    growth24h: 4.8,
  },
  {
    source: 'xhs' as const,
    candidateTitle: '"早 C 晚 A 的反义词"',
    score: 76,
    tier: 'yellow' as const,
    authorHandle: '@护肤白盒',
    authorFollowers: 12_400,
    growth24h: 2.1,
  },
  {
    source: 'douyin' as const,
    candidateTitle: '"我家狗也开始上班了"',
    score: 64,
    tier: 'yellow' as const,
    authorHandle: '@狗也内卷',
    authorFollowers: 8_100,
    growth24h: 1.7,
  },
  {
    source: 'weibo' as const,
    candidateTitle: '"周五晚六点的钉钉提示音"',
    score: 41,
    tier: 'green' as const,
    authorHandle: null,
    authorFollowers: null,
    growth24h: 0.9,
  },
  {
    source: 'bilibili' as const,
    candidateTitle: '"小区团购的形而上学"',
    score: 35,
    tier: 'green' as const,
    authorHandle: '@老六本六',
    authorFollowers: 940,
    growth24h: 0.6,
  },
];

export const FAKE_GRAVEYARD = [
  {
    slug: 'hz-merman-boatman',
    epitaph: '可惜了，这味儿其实对了，只是早了一周。',
    backersCount: 1_247,
  },
  {
    slug: 'cafe-dialect-challenge',
    epitaph: '方言是火药，咖啡是水。',
    backersCount: 540,
  },
  {
    slug: 'metro-seat-song',
    epitaph: '让座，但没让到大众的耳朵里。',
    backersCount: 312,
  },
];

/** Mock bet ledger for visual ticker — these are NOT real user bets. */
export const FAKE_TICKER_BETS = [
  { memeSlug: 'sh-metro-taichi', displayName: '@梗象先生', amount: 50 },
  { memeSlug: 'sh-metro-taichi', displayName: '@早盘哥', amount: 20 },
  { memeSlug: 'sh-metro-taichi', displayName: '@梗预言家1号', amount: 15 },
  { memeSlug: 'lab-suit-bro', displayName: '@早盘哥', amount: 20 },
  { memeSlug: 'lab-suit-bro', displayName: '@老韭菜', amount: 10 },
  { memeSlug: 'how-much-this-noodle', displayName: '@面神', amount: 10 },
  { memeSlug: 'salary-expectation-soul', displayName: '@老韭菜', amount: 30 },
  { memeSlug: 'mom-civil-servant', displayName: '@考公男神', amount: 25 },
];
