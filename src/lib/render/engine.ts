// 阶段零 Spike：验证 wenyan-core 能否承载「元素级变体」+「自定义卡片」两层扩展
// 这里只为证伪两个风险点，不追求工程完备；阶段一会重写进 lib/render/engine.ts。
import {
  createWenyanCore,
  registerAllBuiltInThemes,
  getTheme,
  getAllGzhThemes,
} from "@wenyan-md/core";
import {
  palettes,
  buildThemeCss,
  buildPalette,
  type Palette,
  type CodeStyle,
} from "./themes";

registerAllBuiltInThemes();

// createWenyanCore 内部自动注册了代码高亮主题与 Mac 风格，所以这里只管文章主题即可。
const corePromise = createWenyanCore({ isWechat: true });

// 自定义意境主题（id 前缀 wy- 以免和 wenyan 内置 id 冲突）
const customThemes = new Map(palettes.map((p) => [`wy-${p.id}`, p]));

// 选用 wenyan 内置主题时没有派生色板，组件用一套中性蓝作回退，保证颜色不塌。
const defaultComponentPalette = buildPalette({
  id: "_default",
  name: "默认",
  primary: "#3a6ea5",
  font: "sans",
  h2: "leftbar",
});

export type ThemeOption = { id: string; name: string; group: string };
export function listThemes(): ThemeOption[] {
  const mine = palettes.map((p) => ({ id: `wy-${p.id}`, name: p.name, group: "意境主题" }));
  const builtin = getAllGzhThemes().map((t) => ({ id: t.meta.id, name: t.meta.name, group: "内置主题" }));
  return [...mine, ...builtin];
}

// 随机一套好看的：从意境主题 + 引用变体里各随机一个
export function randomCombo(): { themeId: string; blockquoteVariant: string } {
  const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  return {
    themeId: `wy-${pick(palettes).id}`,
    blockquoteVariant: pick(Object.keys(blockquoteVariants)),
  };
}

// 解析主题 -> 基础 CSS：自定义走 buildThemeCss，内置走 wenyan 注册表
async function resolveThemeBaseCss(themeId: string): Promise<string> {
  const custom = customThemes.get(themeId);
  if (custom) return buildThemeCss(custom);
  const theme = getTheme(themeId) ?? getTheme("default")!;
  return theme.getCss();
}

// ---- 第 2 层：引用(blockquote)的元素级变体（验证「叠加变体 CSS」可行） ----
// 关键：内联器(createCssApplier)只会把不含 ":" 的普通选择器写进 style=""，
// 所以变体一律用 `#wenyan blockquote` 这种普通选择器；::before 由 applyPseudoElements 转成真 <span>。
// 变体颜色跟随当前主题色板（此前 card/bigQuote 写死微信绿 #07c160，蓝色主题里会插绿条，出戏）；
// notepad 保留固定黄——「便签纸」的纸就是黄的，属于刻意的跨主题点缀。
export const blockquoteVariants: Record<
  string,
  { label: string; css: (p: Palette) => string }
> = {
  default: { label: "主题默认", css: () => "" },
  notepad: {
    label: "便签纸",
    css: () => `
#wenyan blockquote {
  background: #fffdf3;
  border: 1px solid #f0e3b8;
  border-left: 6px solid #f5c518;
  border-radius: 6px;
  padding: 14px 18px;
  margin: 20px 0;
  color: #6a5a2a;
  font-style: normal;
  font-size: 0.95em;
}`,
  },
  card: {
    label: "白卡片",
    css: (p) => `
#wenyan blockquote {
  background: #ffffff;
  border: 1px solid ${p.border};
  border-left: 5px solid ${p.primary};
  border-radius: 8px;
  padding: 14px 18px;
  margin: 20px 0;
  color: ${p.text};
  font-style: normal;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}`,
  },
  bigQuote: {
    label: "大引号",
    css: (p) => `
#wenyan blockquote {
  background: ${p.soft};
  border: none;
  border-radius: 8px;
  padding: 10px 18px 14px;
  margin: 22px 0;
  color: ${p.text};
  font-style: normal;
  position: static;
}
#wenyan blockquote::before {
  content: "“";
  display: block;
  font-size: 2.4em;
  line-height: 1;
  color: ${p.primary};
  font-weight: bold;
}`,
  },
};

// ---- 第 3 层：自定义卡片（验证 ::: 容器语法 -> 内联 section 能穿透微信） ----
// 因为 wenyan-core 用 marked，不吃 remark-directive，所以在渲染前把 ::: 块预处理成 <section>。
const cardStyles: Record<string, { border: string; bg: string; title: string }> = {
  tip:     { border: "#2b8aef", bg: "#eef6ff", title: "#1a6fd0" },
  warning: { border: "#f5a623", bg: "#fff7e6", title: "#c77700" },
  success: { border: "#07c160", bg: "#eafaf0", title: "#04953f" },
};

function cardOverlayCss(): string {
  return Object.entries(cardStyles)
    .map(
      ([type, c]) => `
#wenyan .wy-card-${type} {
  background: ${c.bg};
  border: 1px solid ${c.border}33;
  border-left: 5px solid ${c.border};
  border-radius: 8px;
  padding: 12px 16px;
  margin: 18px 0;
}
#wenyan .wy-card-${type} .wy-card-title {
  color: ${c.title};
  font-weight: bold;
  margin: 0 0 6px 0;
  font-size: 0.95em;
}
#wenyan .wy-card-${type} .wy-card-body p { margin: 6px 0; }`
    )
    .join("\n");
}

// ---- 第 3 层扩展：跟随主题配色的可视化组件（step/timeline/vs/stat/quote/follow）----
// 全部用真实 <span>/<section> 元素上色（伪元素只对 h1-6/blockquote/pre 生效，这里不能用）；
// 连接线用 flex 列 + 真实 <span>，不依赖 position:absolute；横排(vs/stat)加 min-width 防挤压。
// 颜色全部取自当前主题派生色板 Palette，保证与正文统一。
function componentCss(p: Palette): string {
  return `
/* 步骤条 */
#wenyan .wy-step { margin: 20px 0; }
#wenyan .wy-step-item { display: flex; }
#wenyan .wy-step-gutter { display: flex; flex-direction: column; align-items: center; margin-right: 12px; }
#wenyan .wy-step-num { width: 26px; height: 26px; line-height: 26px; text-align: center; border-radius: 50%; background: ${p.primary}; color: ${p.onPrimary}; font-size: 14px; font-weight: bold; }
#wenyan .wy-step-line { flex: 1; width: 2px; background: ${p.border}; margin: 4px 0; min-height: 14px; }
#wenyan .wy-step-body { flex: 1; padding-bottom: 16px; color: ${p.text}; }
#wenyan .wy-step-body p { margin: 0 0 4px; }

/* 时间线(日期走对比色,和正文拉开) */
#wenyan .wy-tl { margin: 20px 0; }
#wenyan .wy-tl-item { display: flex; }
#wenyan .wy-tl-gutter { display: flex; flex-direction: column; align-items: center; margin-right: 14px; padding-top: 4px; }
#wenyan .wy-tl-dot { width: 12px; height: 12px; border-radius: 50%; background: ${p.primary}; border: 2px solid ${p.soft}; }
#wenyan .wy-tl-line { flex: 1; width: 2px; background: ${p.border}; margin: 4px 0; min-height: 16px; }
#wenyan .wy-tl-body { flex: 1; padding-bottom: 18px; }
#wenyan .wy-tl-date { display: block; color: ${p.accentDeep}; font-weight: bold; font-size: 0.92em; margin-bottom: 2px; }
#wenyan .wy-tl-text { display: block; color: ${p.text}; }

/* 双栏对比(左=主色调,右=对比色调,「对比」名副其实) */
#wenyan .wy-vs { display: flex; gap: 10px; margin: 20px 0; }
#wenyan .wy-vs-col { flex: 1; min-width: 0; border-radius: 8px; padding: 12px 14px; }
#wenyan .wy-vs-col-a { background: ${p.soft}; border: 1px solid ${p.border}; }
#wenyan .wy-vs-col-b { background: ${p.accentSoft}; border: 1px solid ${p.accentBorder}; }
#wenyan .wy-vs-title { font-weight: bold; margin-bottom: 6px; padding-bottom: 6px; }
#wenyan .wy-vs-col-a .wy-vs-title { color: ${p.deep}; border-bottom: 1px solid ${p.border}; }
#wenyan .wy-vs-col-b .wy-vs-title { color: ${p.accentDeep}; border-bottom: 1px solid ${p.accentBorder}; }
#wenyan .wy-vs-body { color: ${p.text}; font-size: 0.94em; }
#wenyan .wy-vs-body p { margin: 6px 0; }

/* 数据卡(单双格交替主色/对比色,制造节奏) */
#wenyan .wy-stat { display: flex; gap: 10px; margin: 22px 0; text-align: center; }
#wenyan .wy-stat-cell { flex: 1; min-width: 0; border-radius: 10px; padding: 14px 8px; }
#wenyan .wy-stat-cell-a { background: ${p.soft}; }
#wenyan .wy-stat-cell-b { background: ${p.accentSoft}; }
#wenyan .wy-stat-num { display: block; font-size: 1.5em; font-weight: bold; line-height: 1.2; }
#wenyan .wy-stat-cell-a .wy-stat-num { color: ${p.primary}; }
#wenyan .wy-stat-cell-b .wy-stat-num { color: ${p.accentDeep}; }
#wenyan .wy-stat-label { display: block; font-size: 0.82em; color: ${p.muted}; margin-top: 4px; }

/* 金句大卡(大引号走对比色,一眼跳出) */
#wenyan .wy-quote { background: ${p.soft}; border-radius: 12px; padding: 18px 22px 22px; margin: 22px 0; text-align: center; }
#wenyan .wy-quote-mark { display: block; font-size: 2.6em; line-height: 0.8; color: ${p.accent}; font-weight: bold; font-family: Georgia, "Times New Roman", serif; }
#wenyan .wy-quote-text { display: block; font-size: 1.15em; font-weight: bold; color: ${p.deep}; margin-top: 2px; }
#wenyan .wy-quote-by { color: ${p.muted}; font-size: 0.9em; margin-top: 10px; }

/* 关注引导 */
#wenyan .wy-follow { background: linear-gradient(135deg, ${p.primary}, ${p.deep}); color: ${p.onPrimary}; border-radius: 12px; padding: 16px 20px; margin: 22px 0; text-align: center; font-weight: bold; font-size: 1.02em; }
#wenyan .wy-follow a { color: ${p.onPrimary}; text-decoration: underline; }
`;
}

// 把一行 markdown 渲染成「行内 HTML」：渲染后剥掉最外层单个 <p>，保留 **加粗**/链接等。
async function renderInline(
  md: string,
  renderMd: (md: string) => Promise<string>
): Promise<string> {
  const html = (await renderMd(md)).trim();
  const m = html.match(/^<p>([\s\S]*)<\/p>$/);
  return m ? m[1] : html;
}

const splitLines = (body: string): string[] =>
  body.split("\n").map((l) => l.trim()).filter(Boolean);

type Renderers = {
  block: (md: string) => Promise<string>; // 渲染成完整块级 HTML（含 <p>）
  inline: (md: string) => Promise<string>; // 渲染成行内 HTML（去掉外层 <p>）
};

// —— 各组件：把 ::: 块体 body 转成语义化 <section> 结构（颜色交给 componentCss）——

async function buildStep(body: string, r: Renderers): Promise<string> {
  const lines = splitLines(body);
  const items = await Promise.all(
    lines.map(async (line, i) => {
      const html = await r.inline(line);
      const conn = i === lines.length - 1 ? "" : `<span class="wy-step-line"></span>`;
      return `<section class="wy-step-item"><section class="wy-step-gutter"><span class="wy-step-num">${i + 1}</span>${conn}</section><section class="wy-step-body">${html}</section></section>`;
    })
  );
  return `<section class="wy-step">${items.join("")}</section>`;
}

async function buildTimeline(body: string, r: Renderers): Promise<string> {
  const lines = splitLines(body);
  const items = await Promise.all(
    lines.map(async (line, i) => {
      const idx = line.indexOf("·");
      const date = idx >= 0 ? line.slice(0, idx).trim() : "";
      const rest = idx >= 0 ? line.slice(idx + 1).trim() : line;
      const html = await r.inline(rest);
      const conn = i === lines.length - 1 ? "" : `<span class="wy-tl-line"></span>`;
      const dateHtml = date ? `<span class="wy-tl-date">${escapeHtml(date)}</span>` : "";
      return `<section class="wy-tl-item"><section class="wy-tl-gutter"><span class="wy-tl-dot"></span>${conn}</section><section class="wy-tl-body">${dateHtml}<span class="wy-tl-text">${html}</span></section></section>`;
    })
  );
  return `<section class="wy-tl">${items.join("")}</section>`;
}

async function buildVs(body: string, r: Renderers): Promise<string> {
  const cols = body
    .split(/^\s*---\s*$/m)
    .map((c) => c.trim())
    .filter(Boolean);
  const parts = await Promise.all(
    cols.map(async (col, i) => {
      const nl = col.indexOf("\n");
      const title = (nl >= 0 ? col.slice(0, nl) : col).trim();
      const rest = nl >= 0 ? col.slice(nl + 1).trim() : "";
      const bodyHtml = rest ? await r.block(rest) : "";
      const ab = i % 2 === 0 ? "wy-vs-col-a" : "wy-vs-col-b"; // 左主色 / 右对比色
      return `<section class="wy-vs-col ${ab}"><section class="wy-vs-title">${escapeHtml(title)}</section><section class="wy-vs-body">${bodyHtml}</section></section>`;
    })
  );
  return `<section class="wy-vs">${parts.join("")}</section>`;
}

function buildStat(body: string): string {
  const cells = splitLines(body).map((line, i) => {
    const idx = line.indexOf("·");
    const value = (idx >= 0 ? line.slice(0, idx) : line).trim();
    const label = idx >= 0 ? line.slice(idx + 1).trim() : "";
    const ab = i % 2 === 0 ? "wy-stat-cell-a" : "wy-stat-cell-b"; // 交替主色/对比色
    return `<section class="wy-stat-cell ${ab}"><span class="wy-stat-num">${escapeHtml(value)}</span><span class="wy-stat-label">${escapeHtml(label)}</span></section>`;
  });
  return `<section class="wy-stat">${cells.join("")}</section>`;
}

async function buildQuote(body: string, r: Renderers): Promise<string> {
  const lines = splitLines(body);
  let by = "";
  if (lines.length > 1 && /^(——|--|—)/.test(lines[lines.length - 1])) {
    by = lines.pop()!.replace(/^(——|--|—)\s*/, "").trim();
  }
  const textHtml = await r.inline(lines.join(" "));
  const byHtml = by ? `<section class="wy-quote-by">—— ${escapeHtml(by)}</section>` : "";
  return `<section class="wy-quote"><span class="wy-quote-mark">“</span><section class="wy-quote-text">${textHtml}</section>${byHtml}</section>`;
}

async function buildFollow(body: string, r: Renderers): Promise<string> {
  const html = await r.inline(splitLines(body).join(" "));
  return `<section class="wy-follow">${html}</section>`;
}

// 把 `::: 类型 标题\n内容\n:::` 预处理成已渲染好的 HTML <section>。
// tip/warning/success 走语义卡片；step/timeline/vs/stat/quote/follow 走各自组件构建器。
const BLOCK_RE = /^:::[ \t]*([\w-]+)[ \t]*(.*)\n([\s\S]*?)\n:::[ \t]*$/gm;

async function preprocessBlocks(markdown: string, r: Renderers): Promise<string> {
  const matches = [...markdown.matchAll(BLOCK_RE)];
  if (matches.length === 0) return markdown;

  let out = "";
  let cursor = 0;
  for (const m of matches) {
    const [full, rawType, rawTitle, rawBody] = m;
    const type = rawType.toLowerCase();
    const body = rawBody.trim();
    let section: string;
    switch (type) {
      case "step":
        section = await buildStep(body, r);
        break;
      case "timeline":
        section = await buildTimeline(body, r);
        break;
      case "vs":
        section = await buildVs(body, r);
        break;
      case "stat":
        section = buildStat(body);
        break;
      case "quote":
        section = await buildQuote(body, r);
        break;
      case "follow":
        section = await buildFollow(body, r);
        break;
      default: {
        // 语义卡片 tip/warning/success（未知类型回退 tip）
        const cardType = type in cardStyles ? type : "tip";
        const title = (rawTitle || "").trim();
        const innerHtml = await r.block(body);
        const titleHtml = title
          ? `<p class="wy-card-title">${escapeHtml(title)}</p>`
          : "";
        section = `<section class="wy-card wy-card-${cardType}">${titleHtml}<section class="wy-card-body">${innerHtml}</section></section>`;
      }
    }
    out += markdown.slice(cursor, m.index) + `\n${section}\n`;
    cursor = (m.index ?? 0) + full.length;
  }
  out += markdown.slice(cursor);
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!)
  );
}

// ---- 中文排版精修（盘古之白）：中英文/数字之间自动加空格 ----
// 在渲染后的 DOM 文本节点上做，跳过 code/pre，避免破坏 URL、代码、行内码。
const CJK = "\\u2e80-\\u9fff\\uf900-\\ufaff\\u3040-\\u30ff";
const RE_CJK_LEFT = new RegExp(`([${CJK}])([A-Za-z0-9%$#@&([])`, "g");
const RE_CJK_RIGHT = new RegExp(`([A-Za-z0-9%$!?.,;:)\\]])([${CJK}])`, "g");

function panguText(s: string): string {
  return s.replace(RE_CJK_LEFT, "$1 $2").replace(RE_CJK_RIGHT, "$1 $2");
}

function applyPangu(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // 跳过代码块/行内码里的文本
      let p = node.parentElement;
      while (p && p !== root) {
        const tag = p.tagName;
        if (tag === "CODE" || tag === "PRE") return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  for (const t of nodes) {
    const next = panguText(t.nodeValue ?? "");
    if (next !== t.nodeValue) t.nodeValue = next;
  }
}

// ---- 主题装饰后处理：Mac 窗口点 / 表格斑马纹 / h2 章节序号 ----
// 这些效果 CSS 做不到（伪元素只对 h1-6/blockquote/pre 生效、nth-child 不被内联），
// 所以渲染后直接改 DOM 注入真实元素/class，再交给内联器。只对自定义主题生效。
function decorate(root: HTMLElement, p: Palette): void {
  if (p.codeStyle === "mac") {
    root.querySelectorAll("pre").forEach((pre) => {
      const bar = document.createElement("section");
      bar.className = "wy-mac-bar";
      bar.innerHTML =
        '<span class="wy-mac-dot wy-mac-r"></span><span class="wy-mac-dot wy-mac-y"></span><span class="wy-mac-dot wy-mac-g"></span>';
      pre.insertAdjacentElement("beforebegin", bar);
    });
  }
  if (p.tableStyle === "striped") {
    root.querySelectorAll("table").forEach((table) => {
      table.querySelectorAll("tbody tr").forEach((tr, i) => {
        if (i % 2 === 1) tr.classList.add("wy-tr-even");
      });
    });
  }
  if (p.h2 === "numbered") {
    let n = 0;
    root.querySelectorAll("h2").forEach((h2) => {
      // 用户已手写数字开头（如「01 先搞懂」）就不再叠加
      if (/^\s*\d/.test(h2.textContent ?? "")) return;
      n += 1;
      const num = document.createElement("span");
      num.className = "wy-h2-num";
      num.textContent = String(n).padStart(2, "0");
      h2.insertAdjacentElement("afterbegin", num);
    });
  }
}

// 代码样式 -> 语法高亮主题。wenyan 默认给 solarized-light(米色底),
// 它的 .hljs 背景会盖过我们 pre 的背景,所以深色系必须换成配套的暗色高亮。
function hlOptionsFor(codeStyle: CodeStyle): { hlThemeId?: string; hlThemeCss?: string } {
  switch (codeStyle) {
    case "light":
      return {}; // 默认 solarized-light,和浅色底搭
    case "dark":
    case "mac":
      return { hlThemeId: "atom-one-dark" };
    case "terminal":
      // 终端要「黑底绿字」纯净感:不给 token 配色,全部继承绿
      return { hlThemeCss: ".hljs{color:#7ee787;background:#101418}" };
  }
}

export type RenderOptions = {
  themeId: string;
  blockquoteVariant: string;
  pangu?: boolean; // 中文排版精修，默认开
};

export async function renderInlinedHtml(
  markdown: string,
  opts: RenderOptions
): Promise<string> {
  const core = await corePromise;

  // 解析当前主题的派生色板：自定义主题用自己的；内置主题用中性回退色板给组件上色。
  const custom = customThemes.get(opts.themeId);
  const palette = custom ?? defaultComponentPalette;

  // 1. 预处理 ::: 块（卡片 + 6 组件）。内部内容走 renderMarkdown / renderInline 支持 markdown。
  const renderers = {
    block: (md: string) => core.renderMarkdown(md),
    inline: (md: string) => renderInline(md, (x) => core.renderMarkdown(x)),
  };
  const pre = await preprocessBlocks(markdown, renderers);

  // 2. Markdown -> HTML
  const innerHtml = await core.renderMarkdown(pre);

  // 3. 放进 id=wenyan 容器（主题 CSS 全部以 #wenyan 为根）
  const el = document.createElement("section");
  el.id = "wenyan";
  el.innerHTML = innerHtml;

  // 3.2 主题装饰（Mac 点 / 斑马纹 / 章节序号）——只有自定义主题带这些维度
  if (custom) decorate(el, palette);

  // 3.5 中文排版精修（盘古之白），跳过代码
  if (opts.pangu !== false) applyPangu(el);

  // 4. 组合：基础主题 CSS + 引用变体 + 卡片样式 + 组件样式（组件样式最后，便于覆盖）
  const baseCss = await resolveThemeBaseCss(opts.themeId);
  const overlay =
    (blockquoteVariants[opts.blockquoteVariant]?.css(palette) ?? "") +
    "\n" +
    cardOverlayCss() +
    "\n" +
    componentCss(palette);
  const themeCss = baseCss + "\n" + overlay;

  // 5. 内联化 + 微信清洗，返回可直接写进剪贴板的 HTML
  // themeCss 非空时会短路覆盖 themeId，所以 themeId 仅作占位（用合法的 default 防御）。
  const html = await core.applyStylesWithTheme(el, {
    themeId: "default",
    themeCss,
    // wenyan 默认 isMacStyle=true 会给所有 pre 加 SVG 三点;
    // 关掉它,Mac 窗交给 decorate() 的主题化版本(codeStyle==="mac" 才有)。
    isMacStyle: false,
    ...hlOptionsFor(palette.codeStyle),
  });
  return html;
}

// 一键复制：必须写 text/html 才能保留样式
export async function copyHtml(html: string): Promise<void> {
  const blob = new Blob([html], { type: "text/html" });
  const plain = new Blob([html], { type: "text/plain" });
  await navigator.clipboard.write([
    new ClipboardItem({ "text/html": blob, "text/plain": plain }),
  ]);
}
