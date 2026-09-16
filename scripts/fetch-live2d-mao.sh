#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/apps/desktop/public/pets/live2d/mao"
ASSETS="$ROOT/assets/pets/live2d/mao"
if [[ -f "$DEST/Mao.model3.json" ]]; then
  echo "Mao sample already present at $DEST"
  exit 0
fi
TMP=$(mktemp -d)
git clone --depth 1 --filter=blob:none --sparse https://github.com/Live2D/CubismWebSamples.git "$TMP/repo"
git -C "$TMP/repo" sparse-checkout set Samples/Resources/Mao
mkdir -p "$(dirname "$DEST")" "$(dirname "$ASSETS")"
cp -R "$TMP/repo/Samples/Resources/Mao" "$DEST"
cp -R "$TMP/repo/Samples/Resources/Mao" "$ASSETS"
rm -rf "$TMP"
echo "Installed Live2D Mao sample (Free Material License) → $DEST"
