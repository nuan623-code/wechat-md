import { useMemo } from "react";
import { listThemes, blockquoteVariants } from "../lib/render/engine";
import { stylePacks } from "../lib/render/themes";

type Props = {
  themeId: string;
  blockquoteVariant: string;
  pangu: boolean;
  rendering: boolean;
  copyState: { msg: string; ok: boolean } | null;
  onTheme: (id: string) => void;
  onBlockquote: (v: string) => void;
  onPangu: (v: boolean) => void;
  onPack: (id: string) => void;
  onDice: () => void;
  onCopy: () => void;
};

const selectCls =
  "h-8 rounded-md border border-neutral-300 bg-white px-2 text-sm text-neutral-700 outline-none focus:border-emerald-500";

export default function Toolbar(props: Props) {
  const themes = useMemo(() => listThemes(), []);
  const groups = useMemo(() => {
    const m = new Map<string, typeof themes>();
    for (const t of themes) {
      const arr = m.get(t.group) ?? [];
      arr.push(t);
      m.set(t.group, arr);
    }
    return [...m.entries()];
  }, [themes]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2">
      <span className="mr-1 text-sm font-semibold text-neutral-800">
        公众号排版
      </span>

      {/* 风格包一键换装 */}
      <select
        className={selectCls}
        defaultValue=""
        onChange={(e) => props.onPack(e.target.value)}
      >
        <option value="" disabled>
          — 风格包 —
        </option>
        {stylePacks.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-base hover:bg-neutral-50"
        title="随机一套"
        onClick={props.onDice}
      >
        🎲
      </button>

      {/* 主题 */}
      <select
        className={selectCls}
        value={props.themeId}
        onChange={(e) => props.onTheme(e.target.value)}
      >
        {groups.map(([group, items]) => (
          <optgroup key={group} label={group}>
            {items.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* 引用变体 */}
      <select
        className={selectCls}
        value={props.blockquoteVariant}
        onChange={(e) => props.onBlockquote(e.target.value)}
      >
        {Object.entries(blockquoteVariants).map(([key, v]) => (
          <option key={key} value={key}>
            引用：{v.label}
          </option>
        ))}
      </select>

      {/* 盘古之白 */}
      <label className="flex items-center gap-1.5 text-sm text-neutral-700 select-none">
        <input
          type="checkbox"
          className="accent-emerald-600"
          checked={props.pangu}
          onChange={(e) => props.onPangu(e.target.checked)}
        />
        中文排版优化
      </label>

      <div className="flex-1" />

      {props.copyState && (
        <span
          className={
            "text-sm " +
            (props.copyState.ok ? "text-emerald-600" : "text-red-500")
          }
        >
          {props.copyState.msg}
        </span>
      )}

      <button
        className="h-8 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        onClick={props.onCopy}
        disabled={props.rendering}
      >
        复制到公众号
      </button>
    </div>
  );
}
