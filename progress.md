# 进度:配色系统升级 + 6 个新组件

## 目标(用户确认「全做 + 配色升级」)
以「更聪明的配色系统」为地基,一次做完四件事:
1. **智能配色系统**:主题只定义 1 个主色(+字体+h2造型),其余(deep/soft/border/text/page/onPrimary/muted)自动派生,保证协调。
2. **精修现有 12 套主题**:用新系统重新表达,色板更统一。
3. **新增主题**:6 套(graphite/sky/wine/plum/denim/clay),补齐选择。
4. **6 个新组件,颜色跟随主题**:步骤条 step / 时间线 timeline / 双栏对比 vs / 数据卡 stat / 金句大卡 quote / 关注引导 follow。

## 硬约束(公众号白名单)
- 伪元素只对 h1-6/blockquote/pre 生效 → 装饰一律用真实 `<span>`。
- 少用 position:absolute → 连接线用 flex 列 + 真 `<span>`。
- flex 横排(vs/stat)需真机复验,用保守写法 + min-width 防挤压。
- 全部 `#wenyan` 根选择器、内联安全。

## 计划 / 状态
- [x] A. `src/lib/render/color.ts`:hex/mix/lighten/darken/luminance/onColor + 供 buildPalette 用
- [x] B. `themes.ts`:改成 seed 驱动(ThemeSeed→buildPalette),精修 12 套 + 新增 6 套(graphite/sky/wine/plum/denim/clay=18 套);Palette 加 onPrimary/muted;h2 pill/block 用 onPrimary;新增 2 风格包(hi-grey/clear-sky)
- [x] C. `engine.ts`:preprocessBlocks 派发 6 组件 + tip/warning/success;componentCss(palette) 跟随主题;内置主题回退 defaultComponentPalette(#3a6ea5);renderInline 剥 <p>
- [x] D. `sample.ts`:示例加全部 6 组件演示
- [x] E. tsc 零报错;预览验证 forest 绿 / purple 回退蓝 / cinnabar 红 三态,6 组件全渲染、颜色跟随、无 console 报错
- [ ] F. 交付前问用户是否部署(deploy.sh)—— 待用户确认

## 追加(2026-07-08 下午,用户反馈)
- [x] 晴空蓝主色 #3d7fd6 → **#2563eb**(对齐 mingyuyang.com 文章页品牌蓝,用户指名要这个配色)。
- [x] 引用变体跟随主题:css 由字符串改为 `(p: Palette) => string`。card(改名「白卡片」,白底+主题色竖条)、bigQuote(soft 底+主题色引号)不再写死微信绿 #07c160——这就是用户说「晴空万里+晴空蓝 这俩之间有问题」的元凶(蓝主题插绿条)。notepad 保留固定黄(便签纸的纸就是黄的,刻意点缀)。
- [x] 已在预览用用户真实文章(iOS 出海归因)验证:竖条=rgb(37,99,235),白底,编辑器内容无损(HMR 后靠切换控件触发重渲染,**不能整页刷新**——会丢用户粘贴的内容,无 localStorage)。

## 追加 2(2026-07-08,用户要「不要通篇蓝,要对比和变换」)
- [x] 双色系统:Palette 加 accent/accentDeep/accentSoft/accentBorder;18 套主题全部手工配对比色(蓝↔橙、绿↔琥珀、朱砂↔金、抹茶↔红豆、牛仔↔皮革、极简黑白↔朱红等);seed.accent 缺省回退暖金 #c9862e。
- [x] 对比色应用位:加粗 strong(标题内 strong 用 inherit 防串色)、行内码 chip(accentSoft 底+accentDeep 字)、h3 竖条、金句大引号、时间线日期、双栏 vs 左主色右对比色(wy-vs-col-a/b)、数据卡单双格交替(wy-stat-cell-a/b)。主色保持:h1/h2/链接/引用竖条/步骤圆点/关注条渐变。
- [x] 验证:tsc OK;页面 DOM(strong/code/h3=橙,h2/link=蓝)+ 离屏渲染内联产物(stat 蓝橙交替/vs 双色/quote 橙引号/tl 橙日期,均已写入 style="")+ 截图确认。

## 追加 3(2026-07-08,用户要「不同的字体/代码样式/数字/表格格式」)
- [x] 按北极星「简单>选择多」:不加下拉框,做成主题固有维度,分配到 18 套主题。
- [x] 字体 +圆体 yuan(Yuanti SC/STYuanti/幼圆,安卓回退黑体)→ sakura/mint。
- [x] codeStyle 4 种:light(默认 solarized-light 高亮)/ dark(atom-one-dark)/ mac(dark+红黄绿三点,decorate 注入真实 span)/ terminal(黑底绿字,hlThemeCss 覆盖 token 色)。**关键**:wenyan 默认高亮 solarized-light 的 .hljs 背景会盖过 pre 背景,深色系必须换 hlThemeId;且 applyStylesWithTheme 的 isMacStyle **默认 true**(给所有 pre 加 SVG 三点),已显式关掉改用自己的主题化 Mac 条。
- [x] tableStyle 3 种:grid(全边框)/ striped(主色表头+onPrimary 字+偶数行 soft 底,decorate 注入 .wy-tr-even)/ clean(只横线+表头 accent 下划线)。
- [x] h2 新造型 numbered:decorate 注入 .wy-h2-num(01/02 对比色 Georgia)+主色下划线;标题已手写数字开头则跳过(用户文章 01-08 实测跳过正确)。
- [x] decorate() 只对自定义主题跑;离屏验证 4 种 codeStyle 的内联 style="" 全部正确;浮层截图确认 sky=序号+Mac 窗+斑马纹整体效果。
- [x] 验证技巧:离屏 import 要加 `?t=Date.now()` 穿透浏览器模块缓存,否则测的是旧模块。

## 追加 4(2026-07-08,用户:「黄色跟蓝色搭起来不好看」)
- [x] 根因:加粗在中文文章里是**高频元素**(「**为什么**:」这类段首标签一段一个),全染 accentDeep 后第二色从点缀变泛滥,视觉脏。
- [x] 修正:strong 回归 `deep`(同用户网站做法);accent 只留低频结构装饰——h3竖条/大引号/时间线日期/h2序号/行内码chip/vs右栏/stat交替。原则:**对比色是调味料不是主菜,只给低频元素**。
- [x] 已用用户文章同区域截图对比验证。

## 验证结论(2026-07-08 预览)
- step-num/quote-mark/follow 渐变/timeline-dot/vs-title/stat-num 颜色均取当前主题主色:forest=rgb(47,133,90)、cinnabar=rgb(176,57,44),切换即变。
- 内置 wenyan 主题(如 purple)→ 组件用回退中性蓝 #3a6ea5,不塌。
- 真机复验项(仍需用户在公众号后台粘贴确认):vs/stat 横排 flex、step/timeline 连接线撑高。

## 备注
- 组件语法统一 `::: 名字`,与现有 tip/warning/success 一致。
- tip/warning/success 保持固定语义色;新 6 组件跟随主题。
- 真机复验项:vs、stat、step/timeline 的连接线(flex 撑高)。
