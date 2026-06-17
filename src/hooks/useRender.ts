import { useEffect, useRef, useState } from "react";
import { renderInlinedHtml, type RenderOptions } from "../lib/render/engine";

export type RenderState = {
  html: string;
  error: string | null;
  rendering: boolean;
};

// 防抖渲染：markdown 或选项变化后 250ms 触发一次内联渲染。
// 用自增 token 防止旧的异步结果覆盖新结果（竞态）。
export function useRender(
  markdown: string,
  opts: RenderOptions,
  delay = 250
): RenderState {
  const [state, setState] = useState<RenderState>({
    html: "",
    error: null,
    rendering: true,
  });
  const tokenRef = useRef(0);
  const { themeId, blockquoteVariant, pangu } = opts;

  useEffect(() => {
    const token = ++tokenRef.current;
    setState((s) => ({ ...s, rendering: true }));
    const timer = window.setTimeout(async () => {
      try {
        const html = await renderInlinedHtml(markdown, {
          themeId,
          blockquoteVariant,
          pangu,
        });
        if (token === tokenRef.current)
          setState({ html, error: null, rendering: false });
      } catch (e) {
        if (token === tokenRef.current)
          setState((s) => ({
            ...s,
            error: (e as Error).message,
            rendering: false,
          }));
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [markdown, themeId, blockquoteVariant, pangu, delay]);

  return state;
}
