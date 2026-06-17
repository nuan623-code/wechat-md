# 公众号 Markdown 排版工具

把 Markdown 一键排版成可直接粘贴进微信公众号后台的图文。纯前端、无后端,样式全部内联,复制即用。

## 特性

- **多套意境主题**:森系 / 海洋 / 樱花 / 暖橙书卷 / 莫兰迪 / 国风朱砂 / 暗夜紫 / 极简 / 商务藏青 / 抹茶 / 薄荷 / 咖啡,在配色、字体、背景、行距上整体拉开差异。
- **风格包一键换装 + 🎲随机**:主题 + 引用样式预搭成整套协调风格,一次点选。
- **自定义卡片**:`::: tip / warning / success` 三种语义卡片。
- **中文排版优化(盘古之白)**:中英文 / 数字之间自动留白,自动跳过代码。
- **引用样式变体**:主题默认 / 便签纸 / 左竖线卡片 / 大引号。
- **复制即用**:写入 `text/html`,粘到公众号后台样式不丢。

## 技术栈

Vite · React 19 · TypeScript · Tailwind v4 · CodeMirror 6 · [@wenyan-md/core](https://www.npmjs.com/package/@wenyan-md/core)(渲染 / 内联 / 微信兼容底座)

## 开发

```bash
npm install
npm run dev      # http://localhost:8851
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览构建产物
```

## 目录

```
src/
  lib/render/    # 渲染引擎:主题、卡片、盘古之白、内联复制
  hooks/         # useRender(防抖 + 竞态保护)
  components/    # Toolbar / Editor(CodeMirror) / Preview
  App.tsx        # 状态中枢
```
