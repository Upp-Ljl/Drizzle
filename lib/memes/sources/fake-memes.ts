/**
 * 热梗 mock 数据 — 真模板/句式/动作/表情，不是事件。
 *
 * 每条带：
 *  - template_pattern: 可复用的格式（"X 不 X" / "听我说..." / etc.）
 *  - derivative_count: 二创/套用数（核心指标，不是提及量）
 *  - currentN: 全网提及量 / 跨平台覆盖度（次要指标）
 */

export type FakeMeme = {
  title: string;
  slug: string;
  sourcePlatform: 'bilibili' | 'douyin' | 'xhs' | 'weibo' | 'twitter' | 'other';
  templatePattern: string;
  format: 'catchphrase' | 'video-template' | 'image-template' | 'dance' | 'interaction';
  derivativeCount: number;
  currentN: number;
  firstSeenN: number;
  tickerBlurb: string | null;
};

/** 本周（第 47 期）候选热梗 — 模板能套用、有二创就是真梗 */
export const FAKE_MEMES_CURRENT: FakeMeme[] = [
  {
    title: 'city 不 city',
    slug: 'city-or-not-city',
    sourcePlatform: 'douyin',
    templatePattern: 'X 不 X / X 不 X 啊',
    format: 'catchphrase',
    derivativeCount: 28_400,
    currentN: 1_240_000,
    firstSeenN: 2_100,
    tickerBlurb: '@梗象先生 押 50 币 ← 158 人跟单',
  },
  {
    title: '你说得对，但...',
    slug: 'you-are-right-but',
    sourcePlatform: 'bilibili',
    templatePattern: '你说得对，但是 X 是一款由 X 公司自主研发的开放世界冒险游戏',
    format: 'catchphrase',
    derivativeCount: 41_200,
    currentN: 980_000,
    firstSeenN: 1_800,
    tickerBlurb: '@编辑标记：跨圈层迁移率高',
  },
  {
    title: '尊嘟假嘟',
    slug: 'zundu-jiadu',
    sourcePlatform: 'xhs',
    templatePattern: '问句末尾接「尊嘟假嘟」+ 豆包表情',
    format: 'image-template',
    derivativeCount: 8_700,
    currentN: 322_000,
    firstSeenN: 1_200,
    tickerBlurb: '@早盘哥 押 20 币',
  },
  {
    title: '听我说谢谢你',
    slug: 'listen-thank-you',
    sourcePlatform: 'douyin',
    templatePattern: '手势舞动作 + "听我说谢谢你"配乐',
    format: 'dance',
    derivativeCount: 3_140,
    currentN: 84_200,
    firstSeenN: 800,
    tickerBlurb: '@面神 押 10 币',
  },
  {
    title: '硬控我 N 秒',
    slug: 'hard-control-n-sec',
    sourcePlatform: 'xhs',
    templatePattern: '描述沉迷 / 走不动 → "硬控我 X 秒"',
    format: 'catchphrase',
    derivativeCount: 2_810,
    currentN: 56_300,
    firstSeenN: 410,
    tickerBlurb: null,
  },
  {
    title: '纯爱战神',
    slug: 'pureLove-warrior',
    sourcePlatform: 'bilibili',
    templatePattern: '看悲剧 / 言情时自称「纯爱战神」',
    format: 'catchphrase',
    derivativeCount: 1_900,
    currentN: 41_200,
    firstSeenN: 320,
    tickerBlurb: null,
  },
  {
    title: '破防了',
    slug: 'breaks-defense',
    sourcePlatform: 'weibo',
    templatePattern: '看到任何打动人心 / 离谱的内容时回复「破防了」',
    format: 'catchphrase',
    derivativeCount: 14_320,
    currentN: 130_000,
    firstSeenN: 6_700,
    tickerBlurb: '@老韭菜 押 30 币',
  },
  {
    title: '麦肯锡报告',
    slug: 'mckinsey-report',
    sourcePlatform: 'xhs',
    templatePattern: '生活琐事用商业咨询报告体重写一遍',
    format: 'image-template',
    derivativeCount: 920,
    currentN: 7_500,
    firstSeenN: 160,
    tickerBlurb: null,
  },
  {
    title: '格局打开',
    slug: 'kaiju-open',
    sourcePlatform: 'weibo',
    templatePattern: '反驳后接「格局打开」+ 海纳百川图',
    format: 'catchphrase',
    derivativeCount: 6_700,
    currentN: 130_000,
    firstSeenN: 530,
    tickerBlurb: '@考公男神 押 25 币',
  },
  {
    title: 'X 也是有底线的',
    slug: 'x-has-bottom-line',
    sourcePlatform: 'bilibili',
    templatePattern: '反讽职业 / 身份 → "X 也是有底线的"',
    format: 'catchphrase',
    derivativeCount: 510,
    currentN: 2_100,
    firstSeenN: 90,
    tickerBlurb: null,
  },
];

/** 上一期（46）已破圈的梗 */
export const FAKE_MEMES_PRIOR_BROKE: FakeMeme[] = [
  {
    title: '鸡你太美',
    slug: 'ji-you-too-beautiful',
    sourcePlatform: 'bilibili',
    templatePattern: '篮球动作 + 音乐 cover / reaction',
    format: 'video-template',
    derivativeCount: 96_400,
    currentN: 2_800_000,
    firstSeenN: 3_400,
    tickerBlurb: null,
  },
  {
    title: '孤勇者',
    slug: 'lone-warrior',
    sourcePlatform: 'douyin',
    templatePattern: '"爱你孤身走暗巷..." 合唱 / 翻唱',
    format: 'catchphrase',
    derivativeCount: 58_900,
    currentN: 1_750_000,
    firstSeenN: 8_900,
    tickerBlurb: null,
  },
];

/** 上一期（46）凉透的梗，进坟场 */
export const FAKE_MEMES_PRIOR_DEAD: FakeMeme[] = [
  {
    title: '我家狗也开始上班了',
    slug: 'dog-goes-to-work',
    sourcePlatform: 'douyin',
    templatePattern: '"我家 X 也开始 Y 了"',
    format: 'catchphrase',
    derivativeCount: 5_200,
    currentN: 84_200,
    firstSeenN: 920,
    tickerBlurb: null,
  },
  {
    title: '早 C 晚 A 的反义词',
    slug: 'morning-c-evening-a',
    sourcePlatform: 'xhs',
    templatePattern: '"X 的反义词" 列表',
    format: 'catchphrase',
    derivativeCount: 2_100,
    currentN: 12_400,
    firstSeenN: 280,
    tickerBlurb: null,
  },
  {
    title: 'X 在线挑战',
    slug: 'x-online-challenge',
    sourcePlatform: 'weibo',
    templatePattern: '@朋友 + "X 在线挑战 #X"',
    format: 'interaction',
    derivativeCount: 1_400,
    currentN: 7_300,
    firstSeenN: 200,
    tickerBlurb: null,
  },
];
