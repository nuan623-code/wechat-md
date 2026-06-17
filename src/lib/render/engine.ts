// 阶段零 Spike：验证 wenyan-core 能否承载「元素级变体」+「自定义卡片」两层扩展
// 这里只为证伪两个风险点，不追求工程完备；阶段一会重写进 lib/render/engine.ts。
import {
  createWenyanCore,
  registerAllBuiltInThemes,
  getTheme,
  getAllGzhThemes,
} from "@wenyan-md/core";
import { palettes, buildThemeCss } from "./themes";

registerAllBuiltInThemes();

// createWenyanCore 内部自动注册了代码高亮主题与 Mac 风格，所以这里只管文章主题即可。
const corePromise = createWenyanCore({ isWechat: true });

// 自定义意境主题（id 前缀 wy- 以免和 wenyan 内置 id 冲突）
const customThemes = new Map(palettes.map((p) => [`wy-${p.id}`, p]));

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
export const blockquoteVariants: Record<string, { label: string; css: string }> = {
  default: { label: "主题默认", css: "" },
  notepad: {
    label: "便签纸",
    css: `
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
    label: "左竖线卡片",
    css: `
#wenyan blockquote {
  background: #f6f8fa;
  border: 1px solid #e6e8eb;
  border-left: 5px solid #07c160;
  border-radius: 8px;
  padding: 14px 18px;
  margin: 20px 0;
  color: #3a3a3a;
  font-style: normal;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}`,
  },
  bigQuote: {
    label: "大引号",
    css: `
#wenyan blockquote {
  background: #fafafa;
  border: none;
  border-radius: 8px;
  padding: 10px 18px 14px;
  margin: 22px 0;
  color: #444;
  font-style: normal;
  position: static;
}
#wenyan blockquote::before {
  content: "“";
  display: block;
  font-size: 2.4em;
  line-height: 1;
  color: #07c160;
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

// 把 `::: tip 标题\n内容\n:::` 预处理成已渲染好的 HTML <section>。
// 用占位符防止内部内容被 marked 二次处理出错。
const CARD_RE = /^:::[ \t]*(\w+)[ \t]*(.*)\n([\s\S]*?)\n:::[ \t]*$/gm;

async function preprocessCards(
  markdown: string,
  renderInner: (md: string) => Promise<string>
): Promise<string> {
  const matches = [...markdown.matchAll(CARD_RE)];
  if (matches.length === 0) return markdown;

  let out = "";
  let cursor = 0;
  for (const m of matches) {
    const [full, rawType, rawTitle, body] = m;
    const type = (rawType in cardStyles ? rawType : "tip");
    const title = (rawTitle || "").trim();
    const innerHtml = await renderInner(body.trim());
    const titleHtml = title
      ? `<p class="wy-card-title">${escapeHtml(title)}</p>`
      : "";
    const section = `\n<section class="wy-card wy-card-${type}">${titleHtml}<section class="wy-card-body">${innerHtml}</section></section>\n`;
    out += markdown.slice(cursor, m.index) + section;
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

  // 1. 预处理自定义卡片（内部内容也走 renderMarkdown 以支持 markdown）
  const pre = await preprocessCards(markdown, (md) => core.renderMarkdown(md));

  // 2. Markdown -> HTML
  const innerHtml = await core.renderMarkdown(pre);

  // 3. 放进 id=wenyan 容器（主题 CSS 全部以 #wenyan 为根）
  const el = document.createElement("section");
  el.id = "wenyan";
  el.innerHTML = innerHtml;

  // 3.5 中文排版精修（盘古之白），跳过代码
  if (opts.pangu !== false) applyPangu(el);

  // 4. 组合：基础主题 CSS + 引用变体 + 卡片样式
  const baseCss = await resolveThemeBaseCss(opts.themeId);
  const overlay =
    (blockquoteVariants[opts.blockquoteVariant]?.css ?? "") +
    "\n" +
    cardOverlayCss();
  const themeCss = baseCss + "\n" + overlay;

  // 5. 内联化 + 微信清洗，返回可直接写进剪贴板的 HTML
  // themeCss 非空时会短路覆盖 themeId，所以 themeId 仅作占位（用合法的 default 防御）。
  const html = await core.applyStylesWithTheme(el, {
    themeId: "default",
    themeCss,
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
