#!/usr/bin/env bash
# 一键部署：构建 → 同步到个人站(my-shared-memories)的 public/projects/wechat-md → 走该站的部署脚本。
# 用法：npm run deploy   或   ./deploy.sh
#
# 说明：mingyuyang.com 现由 my-shared-memories(TanStack Start，部署到 Cloudflare Workers)提供服务，
# 静态资源放在其 public/ 下。旧的 personal-site(Cloudflare Pages)已不再服务该域名。
set -euo pipefail

SITE_DIR="${SITE_DIR:-$HOME/my-shared-memories}"
DEST="$SITE_DIR/public/projects/wechat-md"
URL="https://mingyuyang.com/projects/wechat-md/"

cd "$(dirname "$0")"

echo "▶ 1/3 构建生产产物..."
npm run build

echo "▶ 2/3 同步到 $DEST ..."
[ -d "$SITE_DIR/.git" ] || { echo "✖ 找不到个人站仓库：$SITE_DIR"; exit 1; }
mkdir -p "$DEST"
# 用 rsync --delete 保证删掉旧的 hash 资源文件，避免 dist 残留堆积
rsync -a --delete dist/ "$DEST/"

echo "▶ 3/3 提交并部署 my-shared-memories ..."
cd "$SITE_DIR"
git checkout -- src/routeTree.gen.ts 2>/dev/null || true
if git diff --quiet -- public/projects/wechat-md && git diff --cached --quiet -- public/projects/wechat-md; then
  echo "  (构建产物无变化)"
else
  git add public/projects/wechat-md
  git commit -q -m "chore: 更新公众号 Markdown 排版工具构建产物"
fi
# publish.sh 负责:构建 → 部署 Cloudflare Workers → 验证线上 → 推送 origin prod
./publish.sh --deploy-only

echo "✓ 完成:$URL"
