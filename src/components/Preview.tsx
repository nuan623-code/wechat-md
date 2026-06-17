import { useEffect, useRef } from "react";

type Props = {
  html: string;
};

// 预览区：把内联后的 HTML 直接塞进一个模拟手机宽度的容器，
// 所见即所得地接近公众号里的最终效果。
export default function Preview({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html;
  }, [html]);

  return (
    <div className="h-full overflow-auto bg-neutral-100 py-6">
      <div className="mx-auto w-full max-w-[420px] bg-white shadow-sm ring-1 ring-black/5">
        <div ref={ref} />
      </div>
    </div>
  );
}
