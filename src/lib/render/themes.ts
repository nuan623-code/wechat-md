// 第 1 层：整体主题。按「意境/场景」命名，区别于 wenyan 自带的 Typora 移植主题。
// 每套主题在三个维度上拉开差异：①配色 ②字体(无衬线/宋体/楷体) ③页面背景 + 行间节奏。
// 全部 #wenyan 根选择器、纯 WeChat 安全 CSS，渲染时作为 themeCss 传入即被内联。
// 注意：isWechat 下 wenyan 会强制根容器 color=黑，所以正文色显式写到 #wenyan p / li 上。

// 只用读者设备大概率自带的字体，避免回退成默认。
const FONTS = {
  sans: `-apple-system, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`,
  serif: `"Songti SC", "SimSun", "Source Han Serif SC", "Noto Serif CJK SC", serif`, // 宋体·书卷
  kai: `"Kaiti SC", "STKaiti", "KaiTi", "楷体", serif`, // 楷体·国风
} as const;

export type Palette = {
  id: string;
  name: string;
  primary: string; // 主色：链接 / 强调 / 引用竖条 / 标题装饰
  deep: string; // 主色加深：标题文字 / 加粗文字 / 行内码文字
  soft: string; // 主色超浅底：引用 / 行内码 / 代码块 / 表头背景
  border: string; // 浅边框：表格 / 代码块 / 分割线
  text: string; // 正文颜色
  page: string; // 整篇页面背景（区别于纯白）
  font: keyof typeof FONTS; // 字体族
  h2: "leftbar" | "pill" | "underline" | "block"; // 二级标题造型，制造视觉差异
};

export const palettes: Palette[] = [
  { id: "forest",  name: "森系",     primary: "#2f855a", deep: "#276749", soft: "#e6f1ea", border: "#d4e6da", text: "#2d3b33", page: "#f3f8f4", font: "sans",  h2: "leftbar" },
  { id: "ocean",   name: "海洋系",   primary: "#1a7a9c", deep: "#15637e", soft: "#e4f1f7", border: "#cfe6ef", text: "#21404a", page: "#eef7fb", font: "sans",  h2: "block" },
  { id: "sakura",  name: "樱花粉",   primary: "#d76a92", deep: "#c0527c", soft: "#fbe9f0", border: "#f3d9e2", text: "#5a3a45", page: "#fdf4f7", font: "sans",  h2: "underline" },
  { id: "warm",    name: "暖橙书卷", primary: "#c4732a", deep: "#a85d1c", soft: "#f7ecdc", border: "#ecdcc6", text: "#4d3a28", page: "#fbf6ee", font: "serif", h2: "leftbar" },
  { id: "morandi", name: "莫兰迪灰", primary: "#8a8475", deep: "#6f6a5c", soft: "#efede7", border: "#e1ded5", text: "#4a473f", page: "#f5f4f0", font: "serif", h2: "underline" },
  { id: "cinnabar",name: "国风朱砂", primary: "#b0392c", deep: "#8f2c22", soft: "#f7e6e2", border: "#ecd5d0", text: "#3a2c28", page: "#fbf3f0", font: "kai",   h2: "block" },
  { id: "twilight",name: "暗夜紫",   primary: "#7a5cc0", deep: "#634aa0", soft: "#efe9f8", border: "#e0d6f2", text: "#3d3550", page: "#f5f1fb", font: "sans",  h2: "pill" },
  { id: "mono",    name: "极简黑白", primary: "#222222", deep: "#000000", soft: "#f0f0f0", border: "#e0e0e0", text: "#2a2a2a", page: "#ffffff", font: "sans",  h2: "leftbar" },
  { id: "navy",    name: "商务藏青", primary: "#2c4a7c", deep: "#1f3760", soft: "#e8edf5", border: "#d5dded", text: "#2a3242", page: "#f1f4f9", font: "sans",  h2: "block" },
  { id: "matcha",  name: "抹茶",     primary: "#7a9a3e", deep: "#62812e", soft: "#eef3e0", border: "#e0e8c8", text: "#3f4a2c", page: "#f6f9ec", font: "serif", h2: "leftbar" },
  { id: "mint",    name: "薄荷",     primary: "#15a08c", deep: "#0f8474", soft: "#e0f3ef", border: "#cfeee8", text: "#234842", page: "#eef9f6", font: "sans",  h2: "pill" },
  { id: "coffee",  name: "咖啡",     primary: "#7a5640", deep: "#5f4231", soft: "#efe6dd", border: "#e6d9cd", text: "#43342a", page: "#f7f2ec", font: "serif", h2: "underline" },
];

// ---- 风格包：把「主题 + 引用变体」预搭成整套协调风格，一键换装 ----
// 解决「选择多 vs 简单」的张力：组合空间大，用户只点一下。
export type StylePack = {
  id: string;
  name: string;
  themeId: string; // 对应自定义主题 id（wy-*）
  blockquoteVariant: string; // 对应 engine.blockquoteVariants 的 key
};

export const stylePacks: StylePack[] = [
  { id: "fresh-forest", name: "🌿 清新森林", themeId: "wy-forest",  blockquoteVariant: "card" },
  { id: "calm-ocean",   name: "🌊 静谧海洋", themeId: "wy-ocean",   blockquoteVariant: "card" },
  { id: "literary",     name: "📜 文艺书卷", themeId: "wy-warm",    blockquoteVariant: "bigQuote" },
  { id: "guofeng",      name: "🏮 国风雅韵", themeId: "wy-cinnabar",blockquoteVariant: "bigQuote" },
  { id: "biz-brief",    name: "🧭 商务简报", themeId: "wy-navy",    blockquoteVariant: "default" },
  { id: "girlish",      name: "🌸 少女心事", themeId: "wy-sakura",  blockquoteVariant: "notepad" },
  { id: "night",        name: "🔮 暗夜浪漫", themeId: "wy-twilight",blockquoteVariant: "card" },
  { id: "minimal",      name: "⬛ 极简留白", themeId: "wy-mono",    blockquoteVariant: "default" },
];

function h2Css(p: Palette): string {
  switch (p.h2) {
    case "leftbar":
      return `#wenyan h2 { font-size: 1.3em; font-weight: bold; color: ${p.deep}; border-left: 4px solid ${p.primary}; padding: 2px 0 2px 12px; margin: 1.5em 0 0.8em; }`;
    case "pill":
      return `#wenyan h2 { font-size: 1.2em; font-weight: bold; color: #ffffff; background: ${p.primary}; display: inline-block; padding: 4px 16px; border-radius: 20px; margin: 1.5em 0 0.8em; }`;
    case "underline":
      return `#wenyan h2 { font-size: 1.3em; font-weight: bold; color: ${p.deep}; border-bottom: 2px solid ${p.primary}; padding-bottom: 6px; margin: 1.5em 0 0.8em; }`;
    case "block":
      return `#wenyan h2 { font-size: 1.2em; font-weight: bold; color: #ffffff; background: ${p.primary}; padding: 8px 14px; border-radius: 4px; margin: 1.5em 0 0.8em; }`;
  }
}

export function buildThemeCss(p: Palette): string {
  const ff = FONTS[p.font];
  // 衬线/楷体放宽行距与字距，强化"书卷/国风"的阅读节奏差异
  const lh = p.font === "sans" ? "1.75" : "1.9";
  const ls = p.font === "sans" ? "0.3px" : "0.6px";
  return `
#wenyan { font-family: ${ff}; font-size: 16px; line-height: ${lh}; letter-spacing: ${ls}; color: ${p.text}; background: ${p.page}; padding: 22px 20px; }
#wenyan p { margin: 1.2em 0; color: ${p.text}; }
#wenyan li { color: ${p.text}; }
#wenyan h1 { font-family: ${ff}; font-size: 1.6em; font-weight: bold; text-align: center; color: ${p.deep}; margin: 0.4em 0 1em; }
${h2Css(p)}
#wenyan h2 { font-family: ${ff}; }
#wenyan h3 { font-family: ${ff}; font-size: 1.15em; font-weight: bold; color: ${p.deep}; border-left: 3px solid ${p.primary}; padding-left: 10px; margin: 1.3em 0 0.7em; }
#wenyan h4, #wenyan h5, #wenyan h6 { font-family: ${ff}; font-size: 1.05em; font-weight: bold; color: ${p.deep}; margin: 1.2em 0 0.6em; }
#wenyan strong { color: ${p.deep}; font-weight: bold; }
#wenyan em { font-style: italic; }
#wenyan a { color: ${p.primary}; text-decoration: none; word-wrap: break-word; }
#wenyan ul, #wenyan ol { margin: 1em 0; padding-left: 1.4em; }
#wenyan li { margin: 0.4em 0; }
#wenyan blockquote { margin: 1.5em 0; padding: 12px 16px; background: ${p.soft}; border-left: 4px solid ${p.primary}; border-radius: 6px; color: ${p.text}; font-style: normal; font-size: 0.95em; }
#wenyan p code, #wenyan li code { color: ${p.deep}; background: ${p.soft}; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; word-break: break-all; }
#wenyan pre { margin: 1.2em 0; padding: 14px 16px; background: ${p.soft}; border: 1px solid ${p.border}; border-radius: 8px; line-height: 1.6; font-size: 13px; overflow-x: auto; }
#wenyan pre code { display: block; color: ${p.text}; background: none; padding: 0; font-family: "SF Mono", Menlo, Consolas, monospace; }
#wenyan img { max-width: 100%; height: auto; display: block; margin: 1em auto; border-radius: 6px; }
#wenyan hr { border: none; border-top: 1px solid ${p.border}; margin: 2em 0; }
#wenyan table { border-collapse: collapse; margin: 1.4em auto; max-width: 100%; word-break: break-all; font-size: 0.85em; }
#wenyan table th, #wenyan table td { border: 1px solid ${p.border}; padding: 8px 12px; }
#wenyan table th { background: ${p.soft}; color: ${p.deep}; font-weight: bold; }
#wenyan .footnote { color: ${p.primary}; }
#wenyan #footnotes p { display: flex; margin: 0; font-size: 0.9em; }
#wenyan .footnote-num { display: inline; width: 10%; }
#wenyan .footnote-txt { display: inline; width: 90%; word-break: break-all; }
`;
}
