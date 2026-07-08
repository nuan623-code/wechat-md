// 智能配色系统的底层色彩工具。
// 目标:主题只需给 1 个主色,其余(加深/浅底/边框/正文/页面背景/主色上的文字/次要色)
// 全部由这里派生,保证任意主色都能得到协调、可读的一整套色板。
// 纯 RGB 线性混合,无依赖;所有输出都是 #rrggbb,内联到公众号安全。

type RGB = { r: number; g: number; b: number };

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to2 = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

// 线性混合:t=0 返回 a,t=1 返回 b。
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex({
    r: x.r + (y.r - x.r) * t,
    g: x.g + (y.g - x.g) * t,
    b: x.b + (y.b - x.b) * t,
  });
}

// 向白色靠拢(变浅),amt=0.9 表示 90% 白。
export function lighten(color: string, amt: number): string {
  return mix(color, "#ffffff", amt);
}

// 向近黑靠拢(加深),用 #1b1b1b 而非纯黑,避免死黑发脏。
export function darken(color: string, amt: number): string {
  return mix(color, "#1b1b1b", amt);
}

// 相对亮度(0~1),用于判断主色上应该用白字还是深色字。
export function luminance(color: string): number {
  const { r, g, b } = hexToRgb(color);
  const srgb = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

// 主色背景上的前景色:亮主色用深色字,暗主色用白字。
export function onColor(color: string): string {
  return luminance(color) > 0.6 ? "#1b1b1b" : "#ffffff";
}
