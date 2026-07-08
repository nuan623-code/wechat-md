// 第 1 层:整体主题。按「意境/场景」命名,区别于 wenyan 自带的 Typora 移植主题。
// 每套主题在三个维度上拉开差异:①配色 ②字体(无衬线/宋体/楷体) ③页面背景 + 行间节奏。
// 全部 #wenyan 根选择器、纯 WeChat 安全 CSS,渲染时作为 themeCss 传入即被内联。
// 注意:isWechat 下 wenyan 会强制根容器 color=黑,所以正文色显式写到 #wenyan p / li 上。
//
// 【智能配色系统】主题只需给一个「主色 primary」(+字体+h2造型),其余颜色由 buildPalette
// 从主色派生(见 color.ts):deep/soft/border/text/page/onPrimary/muted 全部协调联动。
// 好处:精修 = 换更好的主色即可整套跟着变;新增主题 = 几乎白送;组件也复用同一套派生色。

import { lighten, darken, mix, onColor } from "./color";

// 只用读者设备大概率自带的字体,避免回退成默认。
const FONTS = {
  sans: `-apple-system, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`,
  serif: `"Songti SC", "SimSun", "Source Han Serif SC", "Noto Serif CJK SC", serif`, // 宋体·书卷
  kai: `"Kaiti SC", "STKaiti", "KaiTi", "楷体", serif`, // 楷体·国风
  yuan: `"Yuanti SC", "STYuanti", "YouYuan", "幼圆", "PingFang SC", sans-serif`, // 圆体·可爱(安卓回退黑体)
} as const;

// 代码块样式:浅色 / 深色 / Mac 窗口(红黄绿三点,点由 engine 后处理注入真实 span) / 终端黑底绿字
export type CodeStyle = "light" | "dark" | "mac" | "terminal";
// 表格样式:全边框 / 斑马纹(主色表头+隔行浅底,偶数行 class 由 engine 注入) / 极简横线
export type TableStyle = "grid" | "striped" | "clean";

// 派生完成的整套色板(供 buildThemeCss 与组件 CSS 共用)。
// 双色系统:primary(主色,定调子/搭骨架)+ accent(对比色,制造跳跃点),
// 避免「通篇一个色」的单调——加粗/行内码/h3竖条/大引号/时间线日期走对比色。
export type Palette = {
  id: string;
  name: string;
  primary: string; // 主色:链接 / 引用竖条 / h1 h2 标题装饰 / 关注条
  deep: string; // 主色加深:标题文字
  soft: string; // 主色超浅底:引用 / 代码块 / 表头背景 / 卡片底
  border: string; // 浅边框:表格 / 代码块 / 分割线 / 连接线
  accent: string; // 对比色:h3 竖条 / 大引号 / 双栏右侧 / 数据卡交替
  accentDeep: string; // 对比色加深:加粗文字 / 行内码文字 / 时间线日期
  accentSoft: string; // 对比色浅底:行内码 chip / 双栏右侧底
  accentBorder: string; // 对比色浅边框:双栏右侧边框
  text: string; // 正文颜色(带一丝主色,不是死黑)
  muted: string; // 次要文字:落款 / 数据卡标签
  page: string; // 整篇页面背景(区别于纯白)
  onPrimary: string; // 主色背景上的前景色(白或深),按对比度自动决定
  font: keyof typeof FONTS; // 字体族
  h2: "leftbar" | "pill" | "underline" | "block" | "numbered"; // 二级标题造型;numbered=自动章节序号
  codeStyle: CodeStyle; // 代码块样式
  tableStyle: TableStyle; // 表格样式
};

// 主题「种子」:人只需维护这几项,其余派生。可选字段用于个别主题微调。
type ThemeSeed = {
  id: string;
  name: string;
  primary: string;
  accent?: string; // 对比色,手工挑选的互补/撞色;不填回退暖金(对多数冷主色都成立)
  font: keyof typeof FONTS;
  h2: Palette["h2"];
  codeStyle?: CodeStyle; // 缺省 light
  tableStyle?: TableStyle; // 缺省 grid
  // —— 可选覆盖:极少数主题需要偏离派生默认(如极简黑白要纯白背景)——
  page?: string;
  text?: string;
};

// 从种子派生整套色板。混合比例经过手工校准,兼顾「浅色够浅、深色够深、正文够黑」。
export function buildPalette(seed: ThemeSeed): Palette {
  const { primary } = seed;
  const accent = seed.accent ?? "#c9862e"; // 暖金:万能对比色回退
  return {
    id: seed.id,
    name: seed.name,
    primary,
    deep: darken(primary, 0.28), // 标题:主色明显加深,拉开层次
    soft: lighten(primary, 0.88), // 超浅底:淡到几乎白,但仍带主色气息
    border: lighten(primary, 0.74), // 浅边框:比 soft 深一档,能看出边界
    accent,
    accentDeep: darken(accent, 0.25), // 加粗/行内码文字:对比色加深保证可读
    accentSoft: lighten(accent, 0.86), // 行内码 chip 底
    accentBorder: lighten(accent, 0.72),
    text: seed.text ?? mix(primary, "#2b2b2b", 0.82), // 正文:近黑 + 一丝主色
    muted: seed.text ? mix(seed.text, "#ffffff", 0.4) : mix(primary, "#8a8a8a", 0.55),
    page: seed.page ?? lighten(primary, 0.93), // 页面背景:极浅主色染白
    onPrimary: onColor(primary),
    font: seed.font,
    h2: seed.h2,
    codeStyle: seed.codeStyle ?? "light",
    tableStyle: seed.tableStyle ?? "grid",
  };
}

// 精修后的 12 套意境主题(主色沿用原有好色相,其余全部由派生统一)+ 新增 6 套。
// 对比色全部手工挑选,走经典撞色:蓝↔橙、绿↔琥珀、朱砂↔金、抹茶↔红豆、牛仔↔皮革……
// 字体/代码样式/表格样式/章节序号 也按主题性格分配,换主题=换整套排版气质。
const seeds: ThemeSeed[] = [
  // —— 精修:原 12 套 ——
  { id: "forest", name: "森系", primary: "#2f855a", accent: "#d98e32", font: "sans", h2: "leftbar" },
  { id: "ocean", name: "海洋系", primary: "#1a7a9c", accent: "#e0704f", font: "sans", h2: "block", codeStyle: "mac", tableStyle: "striped" },
  { id: "sakura", name: "樱花粉", primary: "#d76a92", accent: "#b8923a", font: "yuan", h2: "underline", tableStyle: "striped" },
  { id: "warm", name: "暖橙书卷", primary: "#c4732a", accent: "#2a7f78", font: "serif", h2: "leftbar", tableStyle: "clean" },
  { id: "morandi", name: "莫兰迪灰", primary: "#8a8475", accent: "#a06a5e", font: "serif", h2: "underline", tableStyle: "clean" },
  { id: "cinnabar", name: "国风朱砂", primary: "#b0392c", accent: "#a8842c", font: "kai", h2: "block", tableStyle: "clean" },
  { id: "twilight", name: "暗夜紫", primary: "#7a5cc0", accent: "#d08b3e", font: "sans", h2: "pill", codeStyle: "dark", tableStyle: "striped" },
  { id: "mono", name: "极简黑白", primary: "#222222", accent: "#c0392b", font: "sans", h2: "leftbar", page: "#ffffff", text: "#2a2a2a", codeStyle: "dark", tableStyle: "clean" },
  { id: "navy", name: "商务藏青", primary: "#2c4a7c", accent: "#c56a2b", font: "sans", h2: "numbered", codeStyle: "mac", tableStyle: "striped" },
  { id: "matcha", name: "抹茶", primary: "#7a9a3e", accent: "#a5583f", font: "serif", h2: "leftbar", tableStyle: "striped" },
  { id: "mint", name: "薄荷", primary: "#15a08c", accent: "#e07856", font: "yuan", h2: "pill" },
  { id: "coffee", name: "咖啡", primary: "#7a5640", accent: "#b8862d", font: "serif", h2: "underline", codeStyle: "dark", tableStyle: "clean" },
  // —— 新增 6 套 ——
  { id: "graphite", name: "高级灰", primary: "#5b6b73", accent: "#c9962e", font: "sans", h2: "numbered", codeStyle: "mac", tableStyle: "clean" },
  // 主色对齐 mingyuyang.com 文章页的品牌蓝(深蓝渐变头卡/亮蓝标题/浅蓝高亮块同源),配经典蓝橙撞色
  { id: "sky", name: "晴空蓝", primary: "#2563eb", accent: "#ea7a23", font: "sans", h2: "numbered", codeStyle: "mac", tableStyle: "striped" },
  { id: "wine", name: "酒红", primary: "#8e3b52", accent: "#b8923a", font: "serif", h2: "block", codeStyle: "dark", tableStyle: "clean" },
  { id: "plum", name: "梅子", primary: "#9c4f7c", accent: "#6f8f4f", font: "sans", h2: "pill", tableStyle: "striped" },
  { id: "denim", name: "牛仔靛蓝", primary: "#35618e", accent: "#b97745", font: "sans", h2: "leftbar", codeStyle: "terminal" },
  { id: "clay", name: "陶土", primary: "#b06a4f", accent: "#50708c", font: "kai", h2: "underline", tableStyle: "clean" },
];

export const palettes: Palette[] = seeds.map(buildPalette);

// ---- 风格包:把「主题 + 引用变体」预搭成整套协调风格,一键换装 ----
// 解决「选择多 vs 简单」的张力:组合空间大,用户只点一下。
export type StylePack = {
  id: string;
  name: string;
  themeId: string; // 对应自定义主题 id(wy-*)
  blockquoteVariant: string; // 对应 engine.blockquoteVariants 的 key
};

export const stylePacks: StylePack[] = [
  { id: "fresh-forest", name: "🌿 清新森林", themeId: "wy-forest", blockquoteVariant: "card" },
  { id: "calm-ocean", name: "🌊 静谧海洋", themeId: "wy-ocean", blockquoteVariant: "card" },
  { id: "literary", name: "📜 文艺书卷", themeId: "wy-warm", blockquoteVariant: "bigQuote" },
  { id: "guofeng", name: "🏮 国风雅韵", themeId: "wy-cinnabar", blockquoteVariant: "bigQuote" },
  { id: "biz-brief", name: "🧭 商务简报", themeId: "wy-navy", blockquoteVariant: "default" },
  { id: "girlish", name: "🌸 少女心事", themeId: "wy-sakura", blockquoteVariant: "notepad" },
  { id: "night", name: "🔮 暗夜浪漫", themeId: "wy-twilight", blockquoteVariant: "card" },
  { id: "minimal", name: "⬛ 极简留白", themeId: "wy-mono", blockquoteVariant: "default" },
  { id: "hi-grey", name: "🩶 高级灰调", themeId: "wy-graphite", blockquoteVariant: "card" },
  { id: "clear-sky", name: "☁️ 晴空万里", themeId: "wy-sky", blockquoteVariant: "card" },
];

function h2Css(p: Palette): string {
  switch (p.h2) {
    case "leftbar":
      return `#wenyan h2 { font-size: 1.3em; font-weight: bold; color: ${p.deep}; border-left: 4px solid ${p.primary}; padding: 2px 0 2px 12px; margin: 1.5em 0 0.8em; }`;
    case "pill":
      return `#wenyan h2 { font-size: 1.2em; font-weight: bold; color: ${p.onPrimary}; background: ${p.primary}; display: inline-block; padding: 4px 16px; border-radius: 20px; margin: 1.5em 0 0.8em; }`;
    case "underline":
      return `#wenyan h2 { font-size: 1.3em; font-weight: bold; color: ${p.deep}; border-bottom: 2px solid ${p.primary}; padding-bottom: 6px; margin: 1.5em 0 0.8em; }`;
    case "block":
      return `#wenyan h2 { font-size: 1.2em; font-weight: bold; color: ${p.onPrimary}; background: ${p.primary}; padding: 8px 14px; border-radius: 4px; margin: 1.5em 0 0.8em; }`;
    case "numbered":
      // 章节序号(01/02…)由 engine 后处理注入 .wy-h2-num;已手写数字开头的标题会跳过
      return `#wenyan h2 { font-size: 1.3em; font-weight: bold; color: ${p.deep}; border-bottom: 2px solid ${p.primary}; padding-bottom: 6px; margin: 1.6em 0 0.8em; }
#wenyan .wy-h2-num { color: ${p.accent}; font-size: 1.25em; margin-right: 8px; font-family: Georgia, "Times New Roman", serif; }`;
  }
}

// 代码块样式(mac 的三个点由 engine 注入真实 span,这里只管配色)
function codeCss(p: Palette): string {
  const codeFont = `"SF Mono", Menlo, Consolas, monospace`;
  const base = (bg: string, border: string, color: string, extra = "") => `
#wenyan pre { margin: 1.2em 0; padding: 14px 16px; background: ${bg}; border: 1px solid ${border}; border-radius: 8px; line-height: 1.6; font-size: 13px; overflow-x: auto; ${extra} }
#wenyan pre code { display: block; color: ${color}; background: none; padding: 0; font-family: ${codeFont}; }`;
  switch (p.codeStyle) {
    case "light":
      return base(p.soft, p.border, p.text);
    case "dark":
      return base("#2d333b", "#22272e", "#e6edf3");
    case "terminal":
      return base("#101418", "#1f262e", "#7ee787");
    case "mac":
      return (
        base("#2d333b", "#22272e", "#e6edf3", "margin-top: 0; border-radius: 0 0 8px 8px; border-top: none;") +
        `
#wenyan .wy-mac-bar { background: #21262d; border: 1px solid #22272e; border-bottom: none; border-radius: 8px 8px 0 0; padding: 9px 12px 5px; margin: 1.2em 0 0; line-height: 1; }
#wenyan .wy-mac-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
#wenyan .wy-mac-r { background: #ff5f56; }
#wenyan .wy-mac-y { background: #ffbd2e; }
#wenyan .wy-mac-g { background: #27c93f; }`
      );
  }
}

// 表格样式(striped 的偶数行 class 由 engine 注入)
function tableCss(p: Palette): string {
  const base = `#wenyan table { border-collapse: collapse; margin: 1.4em auto; max-width: 100%; word-break: break-all; font-size: 0.85em; }`;
  switch (p.tableStyle) {
    case "grid":
      return `${base}
#wenyan table th, #wenyan table td { border: 1px solid ${p.border}; padding: 8px 12px; }
#wenyan table th { background: ${p.soft}; color: ${p.deep}; font-weight: bold; }`;
    case "striped":
      return `${base}
#wenyan table th, #wenyan table td { border: none; padding: 9px 12px; }
#wenyan table th { background: ${p.primary}; color: ${p.onPrimary}; font-weight: bold; }
#wenyan .wy-tr-even { background: ${p.soft}; }`;
    case "clean":
      return `${base}
#wenyan table th, #wenyan table td { border: none; border-bottom: 1px solid ${p.border}; padding: 9px 12px; }
#wenyan table th { color: ${p.deep}; font-weight: bold; border-bottom: 2px solid ${p.accent}; }`;
  }
}

export function buildThemeCss(p: Palette): string {
  const ff = FONTS[p.font];
  // 衬线/楷体放宽行距与字距,强化"书卷/国风"的阅读节奏差异;圆体略宽于黑体
  const lh = p.font === "sans" ? "1.75" : p.font === "yuan" ? "1.8" : "1.9";
  const ls = p.font === "sans" ? "0.3px" : p.font === "yuan" ? "0.4px" : "0.6px";
  return `
#wenyan { font-family: ${ff}; font-size: 16px; line-height: ${lh}; letter-spacing: ${ls}; color: ${p.text}; background: ${p.page}; padding: 22px 20px; }
#wenyan p { margin: 1.2em 0; color: ${p.text}; }
#wenyan li { color: ${p.text}; }
#wenyan h1 { font-family: ${ff}; font-size: 1.6em; font-weight: bold; text-align: center; color: ${p.deep}; margin: 0.4em 0 1em; }
${h2Css(p)}
#wenyan h2 { font-family: ${ff}; }
#wenyan h3 { font-family: ${ff}; font-size: 1.15em; font-weight: bold; color: ${p.deep}; border-left: 3px solid ${p.accent}; padding-left: 10px; margin: 1.3em 0 0.7em; }
#wenyan h4, #wenyan h5, #wenyan h6 { font-family: ${ff}; font-size: 1.05em; font-weight: bold; color: ${p.deep}; margin: 1.2em 0 0.6em; }
#wenyan strong { color: ${p.deep}; font-weight: bold; }
#wenyan h1 strong, #wenyan h2 strong, #wenyan h3 strong, #wenyan h4 strong { color: inherit; }
#wenyan em { font-style: italic; }
#wenyan a { color: ${p.primary}; text-decoration: none; word-wrap: break-word; }
#wenyan ul, #wenyan ol { margin: 1em 0; padding-left: 1.4em; }
#wenyan li { margin: 0.4em 0; }
#wenyan blockquote { margin: 1.5em 0; padding: 12px 16px; background: ${p.soft}; border-left: 4px solid ${p.primary}; border-radius: 6px; color: ${p.text}; font-style: normal; font-size: 0.95em; }
#wenyan p code, #wenyan li code { color: ${p.accentDeep}; background: ${p.accentSoft}; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; word-break: break-all; }
${codeCss(p)}
#wenyan img { max-width: 100%; height: auto; display: block; margin: 1em auto; border-radius: 6px; }
#wenyan hr { border: none; border-top: 1px solid ${p.border}; margin: 2em 0; }
${tableCss(p)}
#wenyan .footnote { color: ${p.primary}; }
#wenyan #footnotes p { display: flex; margin: 0; font-size: 0.9em; }
#wenyan .footnote-num { display: inline; width: 10%; }
#wenyan .footnote-txt { display: inline; width: 90%; word-break: break-all; }
`;
}
