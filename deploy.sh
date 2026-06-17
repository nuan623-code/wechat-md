#!/usr/bin/env bash
# 一键部署：构建 → 同步到个人站子路径 → 提交并推送（触发 Cloudflare Pages 自动部署）。
# 用法：npm run deploy   或   ./deploy.sh
set -euo pipefail

SITE_DIR="${SITE_DIR:-$HOME/personal-site}"
DEST="$SITE_DIR/projects/wechat-md"
URL="https://mingyuyang.com/projects/wechat-md/"

cd "$(dirname "$0")"

echo "▶ 1/4 构建生产产物..."
npm run build

echo "▶ 2/4 同步到 $DEST ..."
[ -d "$SITE_DIR/.git" ] || { echo "✖ 找不到个人站仓库：$SITE_DIR"; exit 1; }
mkdir -p "$DEST"
# 用 rsync --delete 保证删掉旧的 hash 资源文件，避免 dist 残留堆积
rsync -a --delete dist/ "$DEST/"

echo "▶ 3/4 提交并推送 personal-site ..."
cd "$SITE_DIR"
if git diff --quiet && git diff --cached --quiet; then
  echo "  (无变化，跳过提交)"
else
  git add -A
  git commit -q -m "chore: 更新公众号 Markdown 排版工具构建产物"
  git push -q origin HEAD
  echo "  已推送，Cloudflare Pages 将自动部署"
fi

echo "▶ 4/4 等待线上生效..."
for i in $(seq 1 20); do
  if curl -sSL -m 12 "$URL" | grep -q "/projects/wechat-md/assets/"; then
    echo "✓ 已上线：$URL"
    exit 0
  fi
  sleep 12
done
echo "△ 已推送，但线上暂未检测到更新（可能仍在部署）。稍后访问：$URL"
