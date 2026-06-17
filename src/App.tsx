import { useCallback, useState } from "react";
import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";
import Preview from "./components/Preview";
import { useRender } from "./hooks/useRender";
import { copyHtml, randomCombo } from "./lib/render/engine";
import { stylePacks } from "./lib/render/themes";
import { SAMPLE_MD } from "./lib/render/sample";

export default function App() {
  const [markdown, setMarkdown] = useState(SAMPLE_MD);
  const [themeId, setThemeId] = useState("wy-forest");
  const [blockquoteVariant, setBlockquoteVariant] = useState("default");
  const [pangu, setPangu] = useState(true);
  const [copyState, setCopyState] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);

  const { html, error, rendering } = useRender(markdown, {
    themeId,
    blockquoteVariant,
    pangu,
  });

  const onPack = useCallback((id: string) => {
    const pack = stylePacks.find((p) => p.id === id);
    if (!pack) return;
    setThemeId(pack.themeId);
    setBlockquoteVariant(pack.blockquoteVariant);
  }, []);

  const onDice = useCallback(() => {
    const c = randomCombo();
    setThemeId(c.themeId);
    setBlockquoteVariant(c.blockquoteVariant);
  }, []);

  const onCopy = useCallback(async () => {
    if (!html) return;
    try {
      await copyHtml(html);
      setCopyState({ msg: "✅ 已复制，去后台粘贴", ok: true });
    } catch (e) {
      setCopyState({ msg: "复制失败：" + (e as Error).message, ok: false });
    }
    window.setTimeout(() => setCopyState(null), 4000);
  }, [html]);

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        themeId={themeId}
        blockquoteVariant={blockquoteVariant}
        pangu={pangu}
        rendering={rendering}
        copyState={copyState}
        onTheme={setThemeId}
        onBlockquote={setBlockquoteVariant}
        onPangu={setPangu}
        onPack={onPack}
        onDice={onDice}
        onCopy={onCopy}
      />

      <div className="grid min-h-0 flex-1 grid-cols-2">
        <div className="min-h-0 border-r border-neutral-200">
          <Editor value={markdown} onChange={setMarkdown} />
        </div>
        <div className="min-h-0">
          {error ? (
            <div className="p-4 text-sm text-red-500">渲染出错：{error}</div>
          ) : (
            <Preview html={html} />
          )}
        </div>
      </div>
    </div>
  );
}
